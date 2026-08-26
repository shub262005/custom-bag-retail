package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.BrandStatus;

import java.time.LocalDateTime;

public class BrandResponse {

    private Long id;
    private String name;
    private BrandStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BrandResponse() {
    }

    public BrandResponse(Long id, String name, BrandStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BrandResponse fromEntity(Brand brand) {
        if (brand == null) {
            return null;
        }
        return new BrandResponse(
                brand.getId(),
                brand.getName(),
                brand.getStatus(),
                brand.getCreatedAt(),
                brand.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
