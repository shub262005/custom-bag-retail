package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import org.springframework.data.domain.Sort;

@Service
public class CustomBagRequestServiceImpl implements CustomBagRequestService {
    private static final Map<CustomBagRequestStatus, Set<CustomBagRequestStatus>> ADMIN_TRANSITIONS = Map.of(
            CustomBagRequestStatus.SUBMITTED, Set.of(CustomBagRequestStatus.REVIEWING, CustomBagRequestStatus.REJECTED),
            CustomBagRequestStatus.REVIEWING, Set.of(CustomBagRequestStatus.APPROVED, CustomBagRequestStatus.REJECTED),
            CustomBagRequestStatus.APPROVED, Set.of(CustomBagRequestStatus.COMPLETED),
            CustomBagRequestStatus.REJECTED, Set.of(), CustomBagRequestStatus.COMPLETED, Set.of(),
            CustomBagRequestStatus.CANCELLED, Set.of());
    private final CustomBagRequestRepository requests;
    private final UserRepository users;
    private final CurrentUserService currentUsers;
    private final CustomBagRequestNumberGenerator numbers;
    private final CustomBagPricingService pricing;
    private final CustomBagLogoStorageService logos;

    public CustomBagRequestServiceImpl(CustomBagRequestRepository requests, UserRepository users,
            CurrentUserService currentUsers, CustomBagRequestNumberGenerator numbers,
            CustomBagPricingService pricing, CustomBagLogoStorageService logos) {
        this.requests = requests; this.users = users; this.currentUsers = currentUsers;
        this.numbers = numbers; this.pricing = pricing; this.logos = logos;
    }

    @Override @Transactional
    public CustomBagRequestResponse create(CustomBagRequestCreateRequest r, MultipartFile logo) {
        validate(r, logo != null && !logo.isEmpty());
        CurrentUserService.CurrentUser identity = currentUsers.getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("Authenticated customer identity is unavailable"));
        AppUser customer = users.findById(identity.id())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated customer was not found"));

        String logoReference = logos.store(logo);
        try {
            CustomBagRequest entity = new CustomBagRequest();
            entity.setRequestNumber(numbers.generate()); entity.setCustomer(customer);
            entity.setRequestType(CustomBagRequestType.STANDARD); entity.setStatus(CustomBagRequestStatus.SUBMITTED);
            entity.setBagType(r.getBagType()); entity.setSize(r.getSize()); entity.setMaterial(r.getMaterial());
            entity.setBodyColor(r.getBodyColor()); entity.setPocketColor(r.getPocketColor()); entity.setStrapColor(r.getStrapColor());
            entity.setFrontPocket(r.isFrontPocket()); entity.setSidePockets(r.isSidePockets());
            entity.setCompartmentCount(r.getCompartmentCount()); entity.setLaptopPadding(r.isLaptopPadding());
            entity.setWaterResistant(r.isWaterResistant()); entity.setLogoReference(logoReference);
            entity.setLogoPosition(logoReference == null ? null : r.getLogoPosition());
            String text = trimToNull(r.getCustomText()); entity.setCustomText(text);
            entity.setTextColor(text == null ? null : r.getTextColor()); entity.setTextPosition(text == null ? null : r.getTextPosition());
            entity.setCustomerNotes(trimToNull(r.getCustomerNotes()));
            entity.setEstimatedPrice(pricing.calculate(r, logoReference != null));
            return CustomBagRequestResponse.fromEntity(requests.saveAndFlush(entity));
        } catch (RuntimeException ex) {
            logos.delete(logoReference);
            throw ex;
        }
    }

    @Override @Transactional(readOnly = true)
    public List<CustomBagRequestSummaryResponse> getMine() {
        long customerId = currentCustomerId();
        return requests.findAllByCustomerIdOrderByCreatedAtDescIdDesc(customerId).stream()
                .map(CustomBagRequestSummaryResponse::fromEntity).toList();
    }

    @Override @Transactional(readOnly = true)
    public CustomBagRequestResponse getMineById(Long id) {
        return CustomBagRequestResponse.fromEntity(ownedRequest(id));
    }

    @Override @Transactional(readOnly = true)
    public CustomBagLogoStorageService.StoredLogo getMineLogo(Long id) {
        CustomBagRequest request = ownedRequest(id);
        if (request.getLogoReference() == null)
            throw new ResourceNotFoundException("Custom bag request logo was not found");
        try { return logos.load(request.getLogoReference()); }
        catch (IllegalArgumentException ex) { throw new ResourceNotFoundException("Custom bag request logo was not found"); }
    }

    private CustomBagRequest ownedRequest(Long id) {
        return requests.findByIdAndCustomerId(id, currentCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Custom bag request was not found"));
    }

    private long currentCustomerId() {
        return currentUsers.getCurrentUser()
                .orElseThrow(() -> new IllegalStateException("Authenticated customer identity is unavailable")).id();
    }

    @Override @Transactional(readOnly = true)
    public List<CustomBagAdminSummaryResponse> getAdminRequests(CustomBagRequestStatus status,
            String requestNumber, String customer) {
        String numberFilter = normalized(requestNumber);
        String customerFilter = normalized(customer);
        return requests.findAll(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))).stream()
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> numberFilter == null || r.getRequestNumber().toLowerCase(Locale.ROOT).contains(numberFilter))
                .filter(r -> customerFilter == null || r.getCustomer().getName().toLowerCase(Locale.ROOT).contains(customerFilter)
                        || r.getCustomer().getEmail().toLowerCase(Locale.ROOT).contains(customerFilter))
                .map(CustomBagAdminSummaryResponse::fromEntity).toList();
    }

    @Override @Transactional(readOnly = true)
    public CustomBagRequestResponse getAdminById(Long id) { return CustomBagRequestResponse.fromEntity(adminRequest(id)); }

    @Override @Transactional(readOnly = true)
    public CustomBagLogoStorageService.StoredLogo getAdminLogo(Long id) {
        CustomBagRequest request = adminRequest(id);
        if (request.getLogoReference() == null) throw new ResourceNotFoundException("Custom bag request logo was not found");
        try { return logos.load(request.getLogoReference()); }
        catch (IllegalArgumentException ex) { throw new ResourceNotFoundException("Custom bag request logo was not found"); }
    }

    @Override @Transactional
    public CustomBagRequestResponse updateAdminReview(Long id, CustomBagAdminUpdateRequest update) {
        CustomBagRequest request = adminRequest(id);
        Set<CustomBagRequestStatus> allowed = ADMIN_TRANSITIONS.getOrDefault(request.getStatus(), Set.of());
        if (!allowed.contains(update.status()))
            throw new IllegalArgumentException("Status cannot transition from " + request.getStatus() + " to " + update.status());
        request.setStatus(update.status());
        request.setAdminNote(trimToNull(update.adminNote()));
        return CustomBagRequestResponse.fromEntity(requests.saveAndFlush(request));
    }

    private CustomBagRequest adminRequest(Long id) {
        return requests.findById(id).orElseThrow(() -> new ResourceNotFoundException("Custom bag request was not found"));
    }

    private String normalized(String value) {
        String clean = trimToNull(value);
        return clean == null ? null : clean.toLowerCase(Locale.ROOT);
    }

    private void validate(CustomBagRequestCreateRequest r, boolean hasLogo) {
        if (r.getRequestType() != null && r.getRequestType() != CustomBagRequestType.STANDARD)
            throw new IllegalArgumentException("SPECIAL_DESIGN requests are not supported yet");
        Set<Integer> compartments = switch (r.getBagType()) {
            case BACKPACK, DUFFEL_BAG -> Set.of(1, 2, 3, 4);
            case LAPTOP_BAG -> Set.of(1, 2, 3);
        };
        if (!compartments.contains(r.getCompartmentCount()))
            throw new IllegalArgumentException("Selected compartment count is not supported by this bag type");
        if (r.getBagType() == CustomBagType.LAPTOP_BAG && r.isSidePockets())
            throw new IllegalArgumentException("Laptop Bag does not support side pockets");
        if (r.getBagType() == CustomBagType.DUFFEL_BAG && r.isLaptopPadding())
            throw new IllegalArgumentException("Duffel Bag does not support laptop padding");
        if (hasLogo && r.getLogoPosition() == null) throw new IllegalArgumentException("Logo position is required when a logo is uploaded");
        if (trimToNull(r.getCustomText()) != null && (r.getTextColor() == null || r.getTextPosition() == null))
            throw new IllegalArgumentException("Text color and position are required with custom text");
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }
}
