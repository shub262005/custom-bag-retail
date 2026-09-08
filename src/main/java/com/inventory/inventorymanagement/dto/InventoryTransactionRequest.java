package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.TransactionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class InventoryTransactionRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be greater than or equal to 0")
    private Integer quantity;

    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    @Size(max = 50, message = "Reference type cannot exceed 50 characters")
    private String referenceType;

    @Size(max = 100, message = "Reference ID cannot exceed 100 characters")
    private String referenceId;

    private java.time.LocalDate movementDate;

    public InventoryTransactionRequest() {
    }

    public InventoryTransactionRequest(Long productId, TransactionType transactionType, Integer quantity,
                                     String reason, String referenceType, String referenceId) {
        this(productId, transactionType, quantity, reason, referenceType, referenceId, null);
    }

    public InventoryTransactionRequest(Long productId, TransactionType transactionType, Integer quantity,
                                     String reason, String referenceType, String referenceId,
                                     java.time.LocalDate movementDate) {
        this.productId = productId;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.reason = reason;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.movementDate = movementDate;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
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
}
