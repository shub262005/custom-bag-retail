package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CancellationReason;
import jakarta.validation.constraints.NotNull;

public class SaleCancelRequest {

    @NotNull(message = "Cancellation reason is required")
    private CancellationReason reason;

    private String description;

    public SaleCancelRequest() {
    }

    public SaleCancelRequest(CancellationReason reason, String description) {
        this.reason = reason;
        this.description = description;
    }

    public CancellationReason getReason() {
        return reason;
    }

    public void setReason(CancellationReason reason) {
        this.reason = reason;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
