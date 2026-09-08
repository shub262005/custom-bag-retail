package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "sale_audit_history")
public class SaleAuditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Column(name = "user_id", length = 100)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 30)
    private SaleAuditAction actionType;

    @Column(name = "description", length = 1000)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SaleAuditHistory() {
    }

    public SaleAuditHistory(Long id, Sale sale, String userId, SaleAuditAction actionType,
                            String description, LocalDateTime createdAt) {
        this.id = id;
        this.sale = sale;
        this.userId = userId;
        this.actionType = actionType;
        this.description = description;
        this.createdAt = createdAt;
    }

    public SaleAuditHistory(Sale sale, String userId, SaleAuditAction actionType, String description) {
        this.sale = sale;
        this.userId = userId;
        this.actionType = actionType;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SaleAuditHistory that = (SaleAuditHistory) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SaleAuditHistory{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                ", actionType=" + actionType +
                ", description='" + description + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
