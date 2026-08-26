package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.ProductStatus;
import jakarta.validation.constraints.NotNull;

public class ProductStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ProductStatus status;

    public ProductStatusUpdateRequest() {
    }

    public ProductStatusUpdateRequest(ProductStatus status) {
        this.status = status;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }
}
