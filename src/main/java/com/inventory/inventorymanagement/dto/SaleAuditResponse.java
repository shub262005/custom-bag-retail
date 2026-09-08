package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.SaleAuditAction;
import com.inventory.inventorymanagement.entity.SaleAuditHistory;

import java.time.LocalDateTime;

public class SaleAuditResponse {

    private Long id;
    private Long saleId;
    private String userId;
    private SaleAuditAction actionType;
    private String description;
    private LocalDateTime createdAt;

    public SaleAuditResponse() {
    }

    public SaleAuditResponse(Long id, Long saleId, String userId, SaleAuditAction actionType,
                             String description, LocalDateTime createdAt) {
        this.id = id;
        this.saleId = saleId;
        this.userId = userId;
        this.actionType = actionType;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static SaleAuditResponse fromEntity(SaleAuditHistory history) {
        if (history == null) {
            return null;
        }
        return new SaleAuditResponse(
                history.getId(),
                history.getSale() != null ? history.getSale().getId() : null,
                history.getUserId(),
                history.getActionType(),
                history.getDescription(),
                history.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public SaleAuditAction getActionType() {
        return actionType;
    }

    public void setActionType(SaleAuditAction actionType) {
        this.actionType = actionType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
