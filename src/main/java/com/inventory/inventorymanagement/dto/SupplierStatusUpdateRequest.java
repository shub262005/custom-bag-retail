package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.SupplierStatus;
import jakarta.validation.constraints.NotNull;

public class SupplierStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private SupplierStatus status;

    public SupplierStatusUpdateRequest() {
    }

    public SupplierStatusUpdateRequest(SupplierStatus status) {
        this.status = status;
    }

    public SupplierStatus getStatus() {
        return status;
    }

    public void setStatus(SupplierStatus status) {
        this.status = status;
    }
}
