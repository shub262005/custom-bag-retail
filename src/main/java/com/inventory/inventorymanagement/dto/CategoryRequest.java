package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 2, max = 100, message = "Category name must be between 2 and 100 characters")
    private String name;

    private CategoryStatus status = CategoryStatus.ACTIVE;

    public CategoryRequest() {
    }

    public CategoryRequest(String name) {
        this.name = name;
        this.status = CategoryStatus.ACTIVE;
    }

    public CategoryRequest(String name, CategoryStatus status) {
        this.name = name;
        this.status = status != null ? status : CategoryStatus.ACTIVE;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public CategoryStatus getStatus() {
        return status;
    }

    public void setStatus(CategoryStatus status) {
        this.status = status;
    }
}
