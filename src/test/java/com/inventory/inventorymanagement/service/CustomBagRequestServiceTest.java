package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.impl.CustomBagRequestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Sort;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomBagRequestServiceTest {
    CustomBagRequestRepository requests = mock(CustomBagRequestRepository.class);
    UserRepository users = mock(UserRepository.class);
    CurrentUserService currentUsers = mock(CurrentUserService.class);
    CustomBagRequestNumberGenerator numbers = mock(CustomBagRequestNumberGenerator.class);
    CustomBagLogoStorageService logos = mock(CustomBagLogoStorageService.class);
    CustomBagRequestServiceImpl service;
    AppUser customer;

    @BeforeEach void setup() {
        service = new CustomBagRequestServiceImpl(requests, users, currentUsers, numbers,
                new CustomBagPricingService(), logos);
        customer = new AppUser("Customer A", "a@example.com", "hash", UserRole.CUSTOMER, UserStatus.ACTIVE);
        customer.setId(10L);
        when(currentUsers.getCurrentUser()).thenReturn(Optional.of(
                new CurrentUserService.CurrentUser(10L, "a@example.com", UserRole.CUSTOMER)));
        when(users.findById(10L)).thenReturn(Optional.of(customer));
        when(numbers.generate()).thenReturn("CBR-2026-000001");
        when(requests.saveAndFlush(any())).thenAnswer(i -> { CustomBagRequest r = i.getArgument(0); r.setId(1L); return r; });
    }

    @Test void createsSubmittedRequestForAuthenticatedCustomerAndCalculatesPrice() {
        CustomBagRequestCreateRequest r = CustomBagPricingServiceTest.request(CustomBagType.BACKPACK);
        r.setSize(CustomBagSize.MEDIUM); r.setCompartmentCount(2); r.setFrontPocket(true);
        CustomBagRequestResponse response = service.create(r, null);
        assertEquals("CBR-2026-000001", response.requestNumber());
        assertEquals(CustomBagRequestStatus.SUBMITTED, response.status());
        assertEquals(10L, response.customer().id());
        assertEquals("1550.00", response.estimatedPrice().toPlainString());
        ArgumentCaptor<CustomBagRequest> saved = ArgumentCaptor.forClass(CustomBagRequest.class);
        verify(requests).saveAndFlush(saved.capture());
        assertSame(customer, saved.getValue().getCustomer());
        assertNull(saved.getValue().getAdminNote());
    }

    @Test void logoAndCustomTextArePersistedAndPriced() {
        CustomBagRequestCreateRequest r = CustomBagPricingServiceTest.request(CustomBagType.BACKPACK);
        r.setLogoPosition(BrandingPosition.UPPER_FRONT); r.setCustomText("  METRO  ");
        r.setTextColor(BrandTextColor.WHITE); r.setTextPosition(BrandingPosition.CENTER);
        MockMultipartFile file = new MockMultipartFile("logo", "logo.png", "image/png", new byte[]{1});
        when(logos.store(file)).thenReturn("custom-bag-logos/safe.png");
        CustomBagRequestResponse response = service.create(r, file);
        assertEquals("1500.00", response.estimatedPrice().toPlainString());
        assertEquals("METRO", response.customText());
        assertEquals("custom-bag-logos/safe.png", response.logoReference());
    }

    @Test void rejectsUnsupportedConfigurationsAndSpecialDesign() {
        CustomBagRequestCreateRequest laptop = CustomBagPricingServiceTest.request(CustomBagType.LAPTOP_BAG);
        laptop.setSidePockets(true);
        assertThrows(IllegalArgumentException.class, () -> service.create(laptop, null));
        CustomBagRequestCreateRequest duffel = CustomBagPricingServiceTest.request(CustomBagType.DUFFEL_BAG);
        duffel.setLaptopPadding(true);
        assertThrows(IllegalArgumentException.class, () -> service.create(duffel, null));
        CustomBagRequestCreateRequest special = CustomBagPricingServiceTest.request(CustomBagType.BACKPACK);
        special.setRequestType(CustomBagRequestType.SPECIAL_DESIGN);
        assertThrows(IllegalArgumentException.class, () -> service.create(special, null));
        verifyNoInteractions(requests);
    }

    @Test void ownershipCannotBeSelectedByRequestPayload() {
        assertThrows(NoSuchFieldException.class,
                () -> CustomBagRequestCreateRequest.class.getDeclaredField("customerUserId"));
    }

    @Test void historyUsesOwnerScopedNewestFirstRepositoryQuery() {
        CustomBagRequest newer = persisted(2L, "CBR-2026-000002", customer);
        CustomBagRequest older = persisted(1L, "CBR-2026-000001", customer);
        when(requests.findAllByCustomerIdOrderByCreatedAtDescIdDesc(10L)).thenReturn(List.of(newer, older));
        var result = service.getMine();
        assertEquals(List.of("CBR-2026-000002", "CBR-2026-000001"), result.stream().map(CustomBagRequestSummaryResponse::requestNumber).toList());
        verify(requests).findAllByCustomerIdOrderByCreatedAtDescIdDesc(10L);
    }

    @Test void detailAndLogoNeverFallBackToUnrestrictedIdLookup() {
        AppUser other = new AppUser("Customer B", "b@example.com", "hash", UserRole.CUSTOMER, UserStatus.ACTIVE);
        other.setId(20L);
        CustomBagRequest owned = persisted(1L, "CBR-2026-000001", customer);
        owned.setLogoReference("custom-bag-logos/safe.png");
        when(requests.findByIdAndCustomerId(1L, 10L)).thenReturn(Optional.of(owned));
        when(requests.findByIdAndCustomerId(2L, 10L)).thenReturn(Optional.empty());
        when(logos.load("custom-bag-logos/safe.png")).thenReturn(mock(CustomBagLogoStorageService.StoredLogo.class));
        assertEquals(10L, service.getMineById(1L).customer().id());
        assertNotNull(service.getMineLogo(1L));
        assertThrows(ResourceNotFoundException.class, () -> service.getMineById(2L));
        assertThrows(ResourceNotFoundException.class, () -> service.getMineLogo(2L));
        verify(requests, never()).findById(anyLong());
    }

    @Test void noLogoReturnsNotFound() {
        CustomBagRequest owned = persisted(1L, "CBR-2026-000001", customer);
        when(requests.findByIdAndCustomerId(1L, 10L)).thenReturn(Optional.of(owned));
        assertThrows(ResourceNotFoundException.class, () -> service.getMineLogo(1L));
        verifyNoInteractions(logos);
    }

    @Test void adminListFiltersStatusRequestNumberAndCustomerWithoutOwnerScope() {
        AppUser other = new AppUser("Other Person", "other@example.com", "hash", UserRole.CUSTOMER, UserStatus.ACTIVE);
        other.setId(20L);
        CustomBagRequest matching = persisted(1L, "CBR-2026-ABC123", other);
        CustomBagRequest excluded = persisted(2L, "CBR-2026-OTHER", customer);
        excluded.setStatus(CustomBagRequestStatus.REVIEWING);
        when(requests.findAll(any(Sort.class))).thenReturn(List.of(matching, excluded));
        var result = service.getAdminRequests(CustomBagRequestStatus.SUBMITTED, "abc", "OTHER@EXAMPLE");
        assertEquals(List.of("CBR-2026-ABC123"), result.stream().map(CustomBagAdminSummaryResponse::requestNumber).toList());
        verify(requests).findAll(any(Sort.class));
        verify(requests, never()).findAllByCustomerIdOrderByCreatedAtDescIdDesc(anyLong());
    }

    @Test void adminTransitionsFollowTheOnlyAllowedWorkflowAndPersistTrimmedNote() {
        CustomBagRequest request = persisted(1L, "CBR-2026-000001", customer);
        when(requests.findById(1L)).thenReturn(Optional.of(request));
        assertEquals(CustomBagRequestStatus.REVIEWING,
                service.updateAdminReview(1L, new CustomBagAdminUpdateRequest(CustomBagRequestStatus.REVIEWING, "  checking design  ")).status());
        assertEquals("checking design", request.getAdminNote());
        assertEquals(CustomBagRequestStatus.APPROVED,
                service.updateAdminReview(1L, new CustomBagAdminUpdateRequest(CustomBagRequestStatus.APPROVED, "Approved")).status());
        assertEquals(CustomBagRequestStatus.COMPLETED,
                service.updateAdminReview(1L, new CustomBagAdminUpdateRequest(CustomBagRequestStatus.COMPLETED, "Done")).status());
        verify(requests, times(3)).saveAndFlush(request);
    }

    @Test void adminCanRejectFromSubmittedOrReviewing() {
        CustomBagRequest submitted = persisted(1L, "CBR-2026-000001", customer);
        CustomBagRequest reviewing = persisted(2L, "CBR-2026-000002", customer);
        reviewing.setStatus(CustomBagRequestStatus.REVIEWING);
        when(requests.findById(1L)).thenReturn(Optional.of(submitted));
        when(requests.findById(2L)).thenReturn(Optional.of(reviewing));
        assertEquals(CustomBagRequestStatus.REJECTED,
                service.updateAdminReview(1L, new CustomBagAdminUpdateRequest(CustomBagRequestStatus.REJECTED, null)).status());
        assertEquals(CustomBagRequestStatus.REJECTED,
                service.updateAdminReview(2L, new CustomBagAdminUpdateRequest(CustomBagRequestStatus.REJECTED, "No")).status());
    }

    @Test void skipsAndTerminalStateChangesAreRejectedWithoutSaving() {
        for (CustomBagRequestStatus source : CustomBagRequestStatus.values()) {
            CustomBagRequest request = persisted(1L, "CBR-2026-000001", customer);
            request.setStatus(source);
            when(requests.findById(1L)).thenReturn(Optional.of(request));
            for (CustomBagRequestStatus target : CustomBagRequestStatus.values()) {
                boolean allowed = (source == CustomBagRequestStatus.SUBMITTED && (target == CustomBagRequestStatus.REVIEWING || target == CustomBagRequestStatus.REJECTED))
                        || (source == CustomBagRequestStatus.REVIEWING && (target == CustomBagRequestStatus.APPROVED || target == CustomBagRequestStatus.REJECTED))
                        || (source == CustomBagRequestStatus.APPROVED && target == CustomBagRequestStatus.COMPLETED);
                if (!allowed) assertThrows(IllegalArgumentException.class,
                        () -> service.updateAdminReview(1L, new CustomBagAdminUpdateRequest(target, "unchanged")), source + " -> " + target);
            }
        }
        verify(requests, never()).saveAndFlush(any());
    }

    private CustomBagRequest persisted(long id, String number, AppUser owner) {
        CustomBagRequest request = new CustomBagRequest();
        request.setId(id); request.setRequestNumber(number); request.setCustomer(owner);
        request.setRequestType(CustomBagRequestType.STANDARD); request.setStatus(CustomBagRequestStatus.SUBMITTED);
        request.setBagType(CustomBagType.BACKPACK); request.setSize(CustomBagSize.MEDIUM);
        request.setMaterial(CustomBagMaterial.POLYESTER); request.setBodyColor(CustomBagColor.NAVY);
        request.setPocketColor(CustomBagColor.BLUE); request.setStrapColor(CustomBagColor.BLACK);
        request.setCompartmentCount(2); request.setEstimatedPrice(new java.math.BigDecimal("1400.00"));
        request.setCreatedAt(LocalDateTime.now()); request.setUpdatedAt(LocalDateTime.now());
        return request;
    }
}
