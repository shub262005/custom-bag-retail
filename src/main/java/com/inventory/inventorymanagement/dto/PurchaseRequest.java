package com.inventory.inventorymanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PurchaseRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    @Size(max = 100, message = "Invoice number cannot exceed 100 characters")
    private String invoiceNumber;

    private LocalDate invoiceDate;

    private BigDecimal discountPercentage;

    private BigDecimal discountAmount;

    private BigDecimal taxRate;

    @Size(max = 1000, message = "Notes cannot exceed 1000 characters")
    private String notes;

    @NotEmpty(message = "Purchase must contain at least one item")
    @Valid
    private List<PurchaseItemRequest> items = new ArrayList<>();

    @Valid
    private List<PurchasePaymentRequest> payments = new ArrayList<>();

    public PurchaseRequest() {
    }

    public PurchaseRequest(Long supplierId, LocalDate purchaseDate, String invoiceNumber, LocalDate invoiceDate,
                           BigDecimal discountPercentage, BigDecimal discountAmount, BigDecimal taxRate,
                           String notes, List<PurchaseItemRequest> items, List<PurchasePaymentRequest> payments) {
        this.supplierId = supplierId;
        this.purchaseDate = purchaseDate;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.taxRate = taxRate;
        this.notes = notes;
        if (items != null) {
            this.items = items;
        }
        if (payments != null) {
            this.payments = payments;
        }
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
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

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItemRequest> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemRequest> items) {
        this.items = items != null ? items : new ArrayList<>();
    }

    public List<PurchasePaymentRequest> getPayments() {
        return payments;
    }

    public void setPayments(List<PurchasePaymentRequest> payments) {
        this.payments = payments != null ? payments : new ArrayList<>();
    }
}
