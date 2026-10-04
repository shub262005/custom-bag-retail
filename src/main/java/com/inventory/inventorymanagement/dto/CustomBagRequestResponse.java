package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomBagRequestResponse(Long id, String requestNumber, CustomerSummary customer,
        CustomBagRequestType requestType, CustomBagType bagType, CustomBagSize size,
        CustomBagMaterial material, CustomBagColor bodyColor, CustomBagColor pocketColor,
        CustomBagColor strapColor, boolean frontPocket, boolean sidePockets, int compartmentCount,
        boolean laptopPadding, boolean waterResistant, String logoReference, BrandingPosition logoPosition,
        String customText, BrandTextColor textColor, BrandingPosition textPosition, String customerNotes,
        BigDecimal estimatedPrice, CustomBagRequestStatus status, String adminNote,
        LocalDateTime createdAt, LocalDateTime updatedAt) {
    public record CustomerSummary(Long id, String name, String email) { }
    public static CustomBagRequestResponse fromEntity(CustomBagRequest r) {
        return new CustomBagRequestResponse(r.getId(), r.getRequestNumber(),
                new CustomerSummary(r.getCustomer().getId(), r.getCustomer().getName(), r.getCustomer().getEmail()),
                r.getRequestType(), r.getBagType(), r.getSize(), r.getMaterial(), r.getBodyColor(),
                r.getPocketColor(), r.getStrapColor(), r.isFrontPocket(), r.isSidePockets(),
                r.getCompartmentCount(), r.isLaptopPadding(), r.isWaterResistant(), r.getLogoReference(),
                r.getLogoPosition(), r.getCustomText(), r.getTextColor(), r.getTextPosition(),
                r.getCustomerNotes(), r.getEstimatedPrice(), r.getStatus(), r.getAdminNote(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}
