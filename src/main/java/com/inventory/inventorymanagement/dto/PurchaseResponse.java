package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PaymentStatus;
import com.inventory.inventorymanagement.entity.Purchase;
import com.inventory.inventorymanagement.entity.PurchaseStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PurchaseResponse {

    private Long id;
    private String purchaseNumber;
    private SupplierResponse supplier;
    private LocalDate purchaseDate;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private BigDecimal subtotal;
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private PurchaseStatus status;
    private String notes;
    private List<PurchaseItemResponse> items = new ArrayList<>();
    private List<PurchasePaymentResponse> payments = new ArrayList<>();
    private BigDecimal totalPaid;
    private BigDecimal outstandingAmount;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PurchaseResponse() {
    }

    public PurchaseResponse(Long id, String purchaseNumber, SupplierResponse supplier, LocalDate purchaseDate,
                            String invoiceNumber, LocalDate invoiceDate, BigDecimal subtotal,
                            BigDecimal discountPercentage, BigDecimal discountAmount, BigDecimal taxRate,
                            BigDecimal taxAmount, BigDecimal grandTotal, PurchaseStatus status, String notes,
                            List<PurchaseItemResponse> items, List<PurchasePaymentResponse> payments,
                            BigDecimal totalPaid, BigDecimal outstandingAmount, PaymentStatus paymentStatus,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.purchaseNumber = purchaseNumber;
        this.supplier = supplier;
        this.purchaseDate = purchaseDate;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.subtotal = subtotal;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.taxRate = taxRate;
        this.taxAmount = taxAmount;
        this.grandTotal = grandTotal;
        this.status = status;
        this.notes = notes;
        this.items = items != null ? items : new ArrayList<>();
        this.payments = payments != null ? payments : new ArrayList<>();
        this.totalPaid = totalPaid;
        this.outstandingAmount = outstandingAmount;
        this.paymentStatus = paymentStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static PurchaseResponse fromEntity(Purchase purchase) {
        if (purchase == null) {
            return null;
        }

        SupplierResponse supplierResponse = purchase.getSupplier() != null
                ? SupplierResponse.fromEntity(purchase.getSupplier())
                : null;

        List<PurchaseItemResponse> itemResponses = purchase.getItems() != null
                ? purchase.getItems().stream().map(PurchaseItemResponse::fromEntity).toList()
                : new ArrayList<>();

        List<PurchasePaymentResponse> paymentResponses = purchase.getPayments() != null
                ? purchase.getPayments().stream().map(PurchasePaymentResponse::fromEntity).toList()
                : new ArrayList<>();

        BigDecimal totalPaid = purchase.calculateTotalPaid();
        BigDecimal outstanding = purchase.calculateOutstanding();
        PaymentStatus paymentStatus = purchase.calculatePaymentStatus();

        return new PurchaseResponse(
                purchase.getId(),
                purchase.getPurchaseNumber(),
                supplierResponse,
                purchase.getPurchaseDate(),
                purchase.getInvoiceNumber(),
                purchase.getInvoiceDate(),
                purchase.getSubtotal(),
                purchase.getDiscountPercentage(),
                purchase.getDiscountAmount(),
                purchase.getTaxRate(),
                purchase.getTaxAmount(),
                purchase.getGrandTotal(),
                purchase.getStatus(),
                purchase.getNotes(),
                itemResponses,
                paymentResponses,
                totalPaid,
                outstanding,
                paymentStatus,
                purchase.getCreatedAt(),
                purchase.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPurchaseNumber() {
        return purchaseNumber;
    }

    public void setPurchaseNumber(String purchaseNumber) {
        this.purchaseNumber = purchaseNumber;
    }

    public SupplierResponse getSupplier() {
        return supplier;
    }

    public void setSupplier(SupplierResponse supplier) {
        this.supplier = supplier;
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

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
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

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public PurchaseStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItemResponse> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItemResponse> items) {
        this.items = items;
    }

    public List<PurchasePaymentResponse> getPayments() {
        return payments;
    }

    public void setPayments(List<PurchasePaymentResponse> payments) {
        this.payments = payments;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
