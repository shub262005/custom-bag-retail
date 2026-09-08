package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.PurchasePayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PurchasePaymentResponse {

    private Long id;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String paymentReference;
    private LocalDate paymentDate;
    private String notes;
    private LocalDateTime createdAt;

    public PurchasePaymentResponse() {
    }

    public PurchasePaymentResponse(Long id, BigDecimal amount, PaymentMethod paymentMethod,
                                   String paymentReference, LocalDate paymentDate, String notes,
                                   LocalDateTime createdAt) {
        this.id = id;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
        this.paymentDate = paymentDate;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public static PurchasePaymentResponse fromEntity(PurchasePayment payment) {
        if (payment == null) {
            return null;
        }
        return new PurchasePaymentResponse(
                payment.getId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentReference(),
                payment.getPaymentDate(),
                payment.getNotes(),
                payment.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
