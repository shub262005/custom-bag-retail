package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SaleEditRequest {

    private LocalDate saleDate;

    @NotEmpty(message = "Sale must contain at least one item")
    @Valid
    private List<SaleItemRequest> items;

    @DecimalMin(value = "0.00", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percentage cannot exceed 100")
    private BigDecimal discountPercentage;

    @DecimalMin(value = "0.00", message = "Discount amount cannot be negative")
    private BigDecimal discountAmount;

    private PaymentMethod paymentMethod;

    private String paymentDescription;

    private Boolean reducePaymentOnTotalDecrease = true;

    public SaleEditRequest() {
    }

    public SaleEditRequest(LocalDate saleDate, List<SaleItemRequest> items,
                           BigDecimal discountPercentage, BigDecimal discountAmount,
                           PaymentMethod paymentMethod, String paymentDescription,
                           Boolean reducePaymentOnTotalDecrease) {
        this.saleDate = saleDate;
        this.items = items;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.paymentMethod = paymentMethod;
        this.paymentDescription = paymentDescription;
        this.reducePaymentOnTotalDecrease = reducePaymentOnTotalDecrease != null ? reducePaymentOnTotalDecrease : true;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
    }

    public List<SaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SaleItemRequest> items) {
        this.items = items;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentDescription() {
        return paymentDescription;
    }

    public void setPaymentDescription(String paymentDescription) {
        this.paymentDescription = paymentDescription;
    }

    public Boolean getReducePaymentOnTotalDecrease() {
        return reducePaymentOnTotalDecrease;
    }

    public void setReducePaymentOnTotalDecrease(Boolean reducePaymentOnTotalDecrease) {
        this.reducePaymentOnTotalDecrease = reducePaymentOnTotalDecrease != null ? reducePaymentOnTotalDecrease : true;
    }
}
