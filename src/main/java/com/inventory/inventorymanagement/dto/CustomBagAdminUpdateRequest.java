package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CustomBagRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomBagAdminUpdateRequest(@NotNull CustomBagRequestStatus status,
        @Size(max = 1000) String adminNote) { }
