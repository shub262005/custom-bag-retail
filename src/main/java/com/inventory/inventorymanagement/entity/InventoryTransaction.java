package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "movement_date", nullable = false)
    private java.time.LocalDate movementDate = java.time.LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public InventoryTransaction() {
    }

    public InventoryTransaction(Long id, Product product, TransactionType transactionType,
                                Integer quantity, Integer quantityBefore, Integer quantityAfter,
                                String reason, String referenceType, String referenceId,
                                LocalDateTime createdAt) {
        this(id, product, transactionType, quantity, quantityBefore, quantityAfter,
             reason, referenceType, referenceId, java.time.LocalDate.now(), createdAt);
    }

    public InventoryTransaction(Long id, Product product, TransactionType transactionType,
                                Integer quantity, Integer quantityBefore, Integer quantityAfter,
                                String reason, String referenceType, String referenceId,
                                java.time.LocalDate movementDate,
                                LocalDateTime createdAt) {
        this.id = id;
        this.product = product;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.reason = reason;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.movementDate = movementDate != null ? movementDate : java.time.LocalDate.now();
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getQuantityBefore() {
        return quantityBefore;
    }

    public void setQuantityBefore(Integer quantityBefore) {
        this.quantityBefore = quantityBefore;
    }

    public Integer getQuantityAfter() {
        return quantityAfter;
    }

    public void setQuantityAfter(Integer quantityAfter) {
        this.quantityAfter = quantityAfter;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public java.time.LocalDate getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(java.time.LocalDate movementDate) {
        this.movementDate = movementDate;
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
        InventoryTransaction that = (InventoryTransaction) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "InventoryTransaction{" +
                "id=" + id +
                ", transactionType=" + transactionType +
                ", quantity=" + quantity +
                ", quantityBefore=" + quantityBefore +
                ", quantityAfter=" + quantityAfter +
                ", reason='" + reason + '\'' +
                ", referenceType='" + referenceType + '\'' +
                ", referenceId='" + referenceId + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
