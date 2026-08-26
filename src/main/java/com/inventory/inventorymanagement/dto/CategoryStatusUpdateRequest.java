package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CategoryStatus;
import jakarta.validation.constraints.NotNull;

public class CategoryStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private CategoryStatus status;

    public CategoryStatusUpdateRequest() {
    }

    public CategoryStatusUpdateRequest(CategoryStatus status) {
        this.status = status;
    }

    public CategoryStatus getStatus() {
        return status;
    }

    public void setStatus(CategoryStatus status) {
        this.status = status;
    }
}
