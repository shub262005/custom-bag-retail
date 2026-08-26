package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.BrandStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class BrandRequest {

    @NotBlank(message = "Brand name is required")
    @Size(min = 2, max = 100, message = "Brand name must be between 2 and 100 characters")
    private String name;

    private BrandStatus status = BrandStatus.ACTIVE;

    public BrandRequest() {
    }

    public BrandRequest(String name) {
        this.name = name;
        this.status = BrandStatus.ACTIVE;
    }

    public BrandRequest(String name, BrandStatus status) {
        this.name = name;
        this.status = status != null ? status : BrandStatus.ACTIVE;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BrandStatus getStatus() {
        return status;
    }

    public void setStatus(BrandStatus status) {
        this.status = status;
    }
}
