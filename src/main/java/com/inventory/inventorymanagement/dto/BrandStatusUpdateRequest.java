package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.BrandStatus;
import jakarta.validation.constraints.NotNull;

public class BrandStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private BrandStatus status;

    public BrandStatusUpdateRequest() {
    }

    public BrandStatusUpdateRequest(BrandStatus status) {
        this.status = status;
    }

    public BrandStatus getStatus() {
        return status;
    }

    public void setStatus(BrandStatus status) {
        this.status = status;
    }
}
