package com.inventory.inventorymanagement.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/** Ephemeral, single-PC/single-phone relay. Never saves a sale or changes inventory. */
@Service
public class PhoneScannerService {
    private static final Duration LIFETIME = Duration.ofMinutes(30);
    private static final Duration HEARTBEAT = Duration.ofSeconds(15);
    private final Map<String, Session> sessions = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;

    public PhoneScannerService() { this(Clock.systemUTC()); }
    PhoneScannerService(Clock clock) { this.clock = clock; }

    public record Pairing(String id, String pairingToken, Instant expiresAt) {}
    public record Device(String token, Instant expiresAt) {}
    public record Scan(String id, String code, String status, String message, String targetId) {}
    public record Status(boolean connected, boolean accepting, Instant expiresAt, Scan scan, String targetId, String targetLabel) {}

    private static final class Session {
        final Long owner;
        final Instant expiresAt;
        String pairingToken;
        String deviceToken;
        Instant heartbeat;
        boolean accepting;
        String deliveredScan;
        String targetId = "idle";
        String targetLabel = "Waiting for a scan-enabled form";
        final LinkedHashMap<String, Scan> scans = new LinkedHashMap<>();
        Session(Long owner, Instant now, String pairingToken) {
            this.owner = owner;
            this.expiresAt = now.plus(LIFETIME);
            this.heartbeat = now;
            this.pairingToken = pairingToken;
        }
    }

    public synchronized Pairing create(Long owner) {
        cleanup();
        if (sessions.size() >= 100 || sessions.values().stream().filter(s -> s.owner.equals(owner)).count() >= 5) {
            throw problem(HttpStatus.TOO_MANY_REQUESTS, "Close an existing phone scanner session before pairing another.");
        }
        String id = UUID.randomUUID().toString();
        Session session = new Session(owner, clock.instant(), token());
        sessions.put(id, session);
        return new Pairing(id, session.pairingToken, session.expiresAt);
    }

    public synchronized Device pair(String id, String pairingToken) {
        Session s = session(id);
        if (!same(s.pairingToken, pairingToken)) throw problem(HttpStatus.FORBIDDEN, "Pairing link is invalid or already used. Create a new link on the PC.");
        s.pairingToken = null; // One phone only; QR link cannot be reused.
        s.deviceToken = token();
        return new Device(s.deviceToken, s.expiresAt);
    }

    public synchronized Status poll(String id, Long owner, boolean accepting) {
        return poll(id, owner, accepting, "legacy", "Current form");
    }

    public synchronized Status poll(String id, Long owner, boolean accepting, String targetId, String targetLabel) {
        Session s = owned(id, owner);
        s.heartbeat = clock.instant();
        s.accepting = accepting;
        s.targetId = targetId;
        s.targetLabel = targetLabel;
        // A delivered scan is reconciled by the PC's outcome cache even during navigation.
        s.scans.replaceAll((key, scan) -> scan.status().equals("PENDING") && !key.equals(s.deliveredScan)
                && (!accepting || !scan.targetId().equals(targetId))
                ? new Scan(scan.id(), scan.code(), "REJECTED", "PC form changed or paused. Check its destination and scan again.", scan.targetId()) : scan);
        Scan delivered = s.deliveredScan == null ? null : s.scans.get(s.deliveredScan);
        Scan next = delivered != null && delivered.status().equals("PENDING") ? delivered
                : accepting ? s.scans.values().stream().filter(scan -> scan.status().equals("PENDING") && scan.targetId().equals(targetId)).findFirst().orElse(null) : null;
        if (next != null) s.deliveredScan = next.id();
        return status(s, next);
    }

    public synchronized void acknowledge(String id, Long owner, String scanId, boolean accepted, String message) {
        Session s = owned(id, owner);
        Scan scan = s.scans.get(scanId);
        if (scan == null) throw problem(HttpStatus.NOT_FOUND, "Scan is unavailable.");
        if (scan.status().equals("PENDING")) s.scans.put(scanId,
                new Scan(scanId, scan.code(), accepted ? "ADDED" : "REJECTED", message, scan.targetId()));
        if (scanId.equals(s.deliveredScan)) s.deliveredScan = null;
    }

    public synchronized void close(String id, Long owner) { owned(id, owner); sessions.remove(id); }

    public synchronized Scan submit(String id, String deviceToken, String requestId, String raw) {
        return submit(id, deviceToken, requestId, raw, "legacy");
    }

    public synchronized Scan submit(String id, String deviceToken, String requestId, String raw, String targetId) {
        Session s = device(id, deviceToken);
        if (requestId == null || !requestId.matches("[A-Za-z0-9-]{1,64}")) throw problem(HttpStatus.BAD_REQUEST, "Invalid scan request ID.");
        String code = raw == null ? "" : raw.trim();
        if (code.isEmpty() || code.length() > 50) throw problem(HttpStatus.BAD_REQUEST, "Scan a product SKU or barcode of up to 50 characters.");
        Scan previous = s.scans.get(requestId);
        if (previous != null) {
            if (!previous.code().equals(code) || !previous.targetId().equals(targetId)) throw problem(HttpStatus.CONFLICT, "Scan ID was already used for another code or form.");
            return previous; // Network retries cannot add another unit.
        }
        if (!isAccepting(s) || !s.targetId.equals(targetId)) throw problem(HttpStatus.CONFLICT, "PC form changed, disconnected or paused. Wait for its current destination and scan again.");
        // Keep all IDs for this session to preserve idempotency, with a fixed memory bound.
        if (s.scans.size() >= 500) throw problem(HttpStatus.TOO_MANY_REQUESTS, "Session scan limit reached. Reconnect the phone from the PC.");
        if (s.scans.values().stream().filter(scan -> scan.status().equals("PENDING")).count() >= 10) throw problem(HttpStatus.TOO_MANY_REQUESTS, "Wait for the PC to process the previous scans.");
        Scan scan = new Scan(requestId, code, "PENDING", "Waiting for PC confirmation.", targetId);
        s.scans.put(requestId, scan);
        return scan;
    }

    public synchronized Status deviceStatus(String id, String deviceToken, String scanId) {
        Session s = device(id, deviceToken);
        Scan scan = scanId == null ? null : s.scans.get(scanId);
        if (scanId != null && scan == null) throw problem(HttpStatus.NOT_FOUND, "Scan is unavailable.");
        return status(s, scan);
    }

    private Status status(Session s, Scan scan) { return new Status(s.deviceToken != null, isAccepting(s), s.expiresAt, scan, s.targetId, s.targetLabel); }
    private boolean isAccepting(Session s) { return s.accepting && s.heartbeat.plus(HEARTBEAT).isAfter(clock.instant()); }
    private Session owned(String id, Long owner) {
        Session s = session(id);
        if (!s.owner.equals(owner)) throw problem(HttpStatus.NOT_FOUND, "Scanner session is unavailable.");
        return s;
    }
    private Session device(String id, String deviceToken) {
        Session s = session(id);
        if (!same(s.deviceToken, deviceToken)) throw problem(HttpStatus.FORBIDDEN, "Phone scanner is not paired. Reconnect it from the PC.");
        return s;
    }
    private Session session(String id) {
        cleanup();
        Session s = sessions.get(id);
        if (s == null) throw problem(HttpStatus.GONE, "Scanner session ended or expired. Reconnect the phone from the PC.");
        return s;
    }
    private void cleanup() { sessions.values().removeIf(s -> !s.expiresAt.isAfter(clock.instant())); }
    private String token() { byte[] bytes = new byte[32]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    private boolean same(String expected, String supplied) {
        return expected != null && supplied != null && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8));
    }
    private ResponseStatusException problem(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
