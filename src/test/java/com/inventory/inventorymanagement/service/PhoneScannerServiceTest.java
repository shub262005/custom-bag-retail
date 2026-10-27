package com.inventory.inventorymanagement.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class PhoneScannerServiceTest {
    static class TestClock extends Clock {
        Instant now = Instant.parse("2026-10-27T10:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test void pairingIsSingleUseAndCapabilitiesCannotReadOtherSessions() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var other = service.create(2L);
        assertThrows(ResponseStatusException.class, () -> service.pair(pair.id(), "wrong"));
        var device = service.pair(pair.id(), pair.pairingToken());
        assertThrows(ResponseStatusException.class, () -> service.pair(pair.id(), pair.pairingToken()));
        assertThrows(ResponseStatusException.class, () -> service.deviceStatus(other.id(), device.token(), null));
        assertThrows(ResponseStatusException.class, () -> service.poll(pair.id(), 2L, true));
        assertThrows(ResponseStatusException.class, () -> service.close(pair.id(), 2L));
    }

    @Test void retriesAndRepeatedAcknowledgementsNeverCreateASecondScan() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var device = service.pair(pair.id(), pair.pairingToken());
        service.poll(pair.id(), 1L, true);
        var first = service.submit(pair.id(), device.token(), "request-1", "BAG-001");
        assertEquals(first, service.submit(pair.id(), device.token(), "request-1", "BAG-001"));
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), device.token(), "request-1", "OTHER"));
        assertEquals("request-1", service.poll(pair.id(), 1L, true).scan().id());
        service.acknowledge(pair.id(), 1L, "request-1", true, "Bag: added 1 unit.");
        service.acknowledge(pair.id(), 1L, "request-1", false, "Retry must not overwrite outcome");
        assertNull(service.poll(pair.id(), 1L, true).scan());
        assertEquals("ADDED", service.submit(pair.id(), device.token(), "request-1", "BAG-001").status());
        assertEquals("Bag: added 1 unit.", service.deviceStatus(pair.id(), device.token(), "request-1").scan().message());
        assertEquals("PENDING", service.submit(pair.id(), device.token(), "request-2", "BAG-001").status());
    }

    @Test void reviewRejectsQueuedCodesAndOfflinePcStopsAccepting() {
        var clock = new TestClock();
        var service = new PhoneScannerService(clock);
        var pair = service.create(1L);
        var device = service.pair(pair.id(), pair.pairingToken());
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), device.token(), "first", "BAG-001"));
        service.poll(pair.id(), 1L, true);
        service.submit(pair.id(), device.token(), "first", "BAG-001");
        assertNull(service.poll(pair.id(), 1L, false).scan());
        assertEquals("REJECTED", service.deviceStatus(pair.id(), device.token(), "first").scan().status());
        service.poll(pair.id(), 1L, true);
        clock.now = clock.now.plusSeconds(16);
        assertFalse(service.deviceStatus(pair.id(), device.token(), null).accepting());
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), device.token(), "next", "BAG-001"));
    }

    @Test void disconnectExpiryAndLimitsInvalidateCapabilities() {
        var clock = new TestClock();
        var service = new PhoneScannerService(clock);
        var pair = service.create(1L);
        var device = service.pair(pair.id(), pair.pairingToken());
        service.close(pair.id(), 1L);
        assertThrows(ResponseStatusException.class, () -> service.deviceStatus(pair.id(), device.token(), null));
        var expiring = service.create(1L);
        clock.now = clock.now.plus(Duration.ofMinutes(30));
        assertThrows(ResponseStatusException.class, () -> service.pair(expiring.id(), expiring.pairingToken()));
        for (int i = 0; i < 5; i++) service.create(1L);
        assertThrows(ResponseStatusException.class, () -> service.create(1L));
    }

    @Test void scanQueueAndPayloadsAreBounded() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var device = service.pair(pair.id(), pair.pairingToken());
        service.poll(pair.id(), 1L, true);
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), device.token(), "bad", "a".repeat(51)));
        for (int i = 0; i < 10; i++) service.submit(pair.id(), device.token(), "scan-" + i, "BAG-001");
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), device.token(), "overflow", "BAG-001"));
    }

    @Test void pausingWhileAcknowledgementIsInFlightPreservesDeliveredOutcome() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var phone = service.pair(pair.id(), pair.pairingToken());
        service.poll(pair.id(), 1L, true);
        service.submit(pair.id(), phone.token(), "delivered", "BAG-001");
        service.poll(pair.id(), 1L, true);
        service.submit(pair.id(), phone.token(), "queued", "BAG-002");
        service.poll(pair.id(), 1L, false);
        service.acknowledge(pair.id(), 1L, "delivered", true, "Added");
        assertEquals("ADDED", service.deviceStatus(pair.id(), phone.token(), "delivered").scan().status());
        assertEquals("REJECTED", service.deviceStatus(pair.id(), phone.token(), "queued").scan().status());
    }

    @Test void samePhoneSwitchesBetweenSalesPurchasesAndRegistrationWithoutPairingAgain() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var phone = service.pair(pair.id(), pair.pairingToken());
        for (String target : new String[]{"sales", "purchases", "registration"}) {
            service.poll(pair.id(), 1L, true, target, target + " form");
            var state = service.deviceStatus(pair.id(), phone.token(), null);
            assertTrue(state.connected());
            assertEquals(target, state.targetId());
            assertEquals(target + " form", state.targetLabel());
            var scan = service.submit(pair.id(), phone.token(), "scan-" + target, "BAG-001", target);
            assertEquals(target, scan.targetId());
            service.acknowledge(pair.id(), 1L, scan.id(), true, "Processed in " + target);
        }
        service.poll(pair.id(), 1L, false, "idle", "Open a scan-enabled form");
        assertTrue(service.deviceStatus(pair.id(), phone.token(), null).connected());
        assertFalse(service.deviceStatus(pair.id(), phone.token(), null).accepting());
    }

    @Test void oldDestinationCodesAreRejectedAndDeliveredResultsCanStillBeAcknowledged() {
        var service = new PhoneScannerService();
        var pair = service.create(1L);
        var phone = service.pair(pair.id(), pair.pairingToken());
        service.poll(pair.id(), 1L, true, "sales", "Sales");
        service.submit(pair.id(), phone.token(), "delivered", "BAG-001", "sales");
        service.poll(pair.id(), 1L, true, "sales", "Sales");
        service.submit(pair.id(), phone.token(), "queued", "BAG-002", "sales");
        var switched = service.poll(pair.id(), 1L, true, "purchases", "Purchases");
        assertEquals("sales", switched.scan().targetId()); // PC reconciles; cannot dispatch it to purchases.
        assertEquals("REJECTED", service.deviceStatus(pair.id(), phone.token(), "queued").scan().status());
        assertThrows(ResponseStatusException.class, () -> service.submit(pair.id(), phone.token(), "late", "BAG-001", "sales"));
        service.acknowledge(pair.id(), 1L, "delivered", true, "Added to sales before switching");
        assertNull(service.poll(pair.id(), 1L, true, "purchases", "Purchases").scan());
        assertEquals("ADDED", service.deviceStatus(pair.id(), phone.token(), "delivered").scan().status());
        assertEquals("PENDING", service.submit(pair.id(), phone.token(), "new", "BAG-001", "purchases").status());
    }
}
