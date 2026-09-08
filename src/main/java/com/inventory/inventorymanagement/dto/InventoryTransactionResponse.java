package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.InventoryTransaction;
import com.inventory.inventorymanagement.entity.TransactionType;

import java.time.LocalDateTime;

public class InventoryTransactionResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private TransactionType transactionType;
    private Integer quantity;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private String reason;
    private String referenceType;
    private String referenceId;
    private java.time.LocalDate movementDate;
    private LocalDateTime createdAt;

    public InventoryTransactionResponse() {
    }

    public InventoryTransactionResponse(Long id, Long productId, String productName, String productSku,
                                        TransactionType transactionType, Integer quantity,
                                        Integer quantityBefore, Integer quantityAfter,
                                        String reason, String referenceType, String referenceId,
                                        LocalDateTime createdAt) {
        this(id, productId, productName, productSku, transactionType, quantity,
             quantityBefore, quantityAfter, reason, referenceType, referenceId, null, createdAt);
    }

    public InventoryTransactionResponse(Long id, Long productId, String productName, String productSku,
                                        TransactionType transactionType, Integer quantity,
                                        Integer quantityBefore, Integer quantityAfter,
                                        String reason, String referenceType, String referenceId,
                                        java.time.LocalDate movementDate,
                                        LocalDateTime createdAt) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productSku = productSku;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.quantityBefore = quantityBefore;
        this.quantityAfter = quantityAfter;
        this.reason = reason;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.movementDate = movementDate;
        this.createdAt = createdAt;
    }

    public static InventoryTransactionResponse fromEntity(InventoryTransaction tx) {
        if (tx == null) {
            return null;
        }

        Long productId = tx.getProduct() != null ? tx.getProduct().getId() : null;
        String productName = tx.getProduct() != null ? tx.getProduct().getName() : null;
        String productSku = tx.getProduct() != null ? tx.getProduct().getSku() : null;

        return new InventoryTransactionResponse(
                tx.getId(),
                productId,
                productName,
                productSku,
                tx.getTransactionType(),
                tx.getQuantity(),
                tx.getQuantityBefore(),
                tx.getQuantityAfter(),
                tx.getReason(),
                tx.getReferenceType(),
                tx.getReferenceId(),
                tx.getMovementDate(),
                tx.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
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
}
