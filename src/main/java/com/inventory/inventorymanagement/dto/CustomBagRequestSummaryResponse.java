package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomBagRequestSummaryResponse(Long id, String requestNumber, CustomBagType bagType,
        CustomBagMaterial material, CustomBagColor bodyColor, BigDecimal estimatedPrice,
        CustomBagRequestStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static CustomBagRequestSummaryResponse fromEntity(CustomBagRequest request) {
        return new CustomBagRequestSummaryResponse(request.getId(), request.getRequestNumber(),
                request.getBagType(), request.getMaterial(), request.getBodyColor(),
                request.getEstimatedPrice(), request.getStatus(), request.getCreatedAt(), request.getUpdatedAt());
    }
}
