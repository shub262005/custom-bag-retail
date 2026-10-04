package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomBagAdminSummaryResponse(Long id, String requestNumber,
        CustomBagRequestResponse.CustomerSummary customer, CustomBagType bagType,
        CustomBagMaterial material, BigDecimal estimatedPrice, CustomBagRequestStatus status,
        LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static CustomBagAdminSummaryResponse fromEntity(CustomBagRequest request) {
        AppUser customer = request.getCustomer();
        return new CustomBagAdminSummaryResponse(request.getId(), request.getRequestNumber(),
                new CustomBagRequestResponse.CustomerSummary(customer.getId(), customer.getName(), customer.getEmail()),
                request.getBagType(), request.getMaterial(), request.getEstimatedPrice(), request.getStatus(),
                request.getCreatedAt(), request.getUpdatedAt());
    }
}
