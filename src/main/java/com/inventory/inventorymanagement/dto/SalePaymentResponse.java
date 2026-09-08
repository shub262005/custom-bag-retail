package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.SalePayment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SalePaymentResponse {

    private Long id;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String description;
    private LocalDateTime createdAt;

    public SalePaymentResponse() {
    }

    public SalePaymentResponse(Long id, BigDecimal amount, PaymentMethod paymentMethod,
                               String description, LocalDateTime createdAt) {
        this.id = id;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static SalePaymentResponse fromEntity(SalePayment payment) {
        if (payment == null) {
            return null;
        }
        return new SalePaymentResponse(
                payment.getId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getDescription(),
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
