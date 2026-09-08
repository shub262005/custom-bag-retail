package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PaymentMethod;

import java.math.BigDecimal;

public class PaymentMethodSalesReportResponse {

    private PaymentMethod paymentMethod;
    private long salesCount;
    private BigDecimal totalAmount;

    public PaymentMethodSalesReportResponse() {
    }

    public PaymentMethodSalesReportResponse(PaymentMethod paymentMethod, long salesCount, BigDecimal totalAmount) {
        this.paymentMethod = paymentMethod;
        this.salesCount = salesCount;
        this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public long getSalesCount() {
        return salesCount;
    }

    public void setSalesCount(long salesCount) {
        this.salesCount = salesCount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
