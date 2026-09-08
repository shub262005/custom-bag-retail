package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CancellationReason;
import com.inventory.inventorymanagement.entity.Sale;
import com.inventory.inventorymanagement.entity.SaleStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SaleResponse {

    private Long id;
    private String saleNumber;
    private LocalDate saleDate;
    private BigDecimal subtotal;
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private BigDecimal grandTotal;
    private SaleStatus status;
    private CancellationReason cancellationReason;
    private String cancellationDescription;
    private String cancelledBy;
    private LocalDateTime cancelledAt;
    private List<SaleItemResponse> items = new ArrayList<>();
    private SalePaymentResponse payment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SaleResponse() {
    }

    public SaleResponse(Long id, String saleNumber, LocalDate saleDate, BigDecimal subtotal,
                        BigDecimal discountPercentage, BigDecimal discountAmount, BigDecimal grandTotal,
                        SaleStatus status, CancellationReason cancellationReason,
                        String cancellationDescription, String cancelledBy, LocalDateTime cancelledAt,
                        List<SaleItemResponse> items, SalePaymentResponse payment,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.saleNumber = saleNumber;
        this.saleDate = saleDate;
        this.subtotal = subtotal;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.grandTotal = grandTotal;
        this.status = status;
        this.cancellationReason = cancellationReason;
        this.cancellationDescription = cancellationDescription;
        this.cancelledBy = cancelledBy;
        this.cancelledAt = cancelledAt;
        this.items = items != null ? items : new ArrayList<>();
        this.payment = payment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static SaleResponse fromEntity(Sale sale) {
        if (sale == null) {
            return null;
        }

        List<SaleItemResponse> itemResponses = sale.getItems() != null
                ? sale.getItems().stream().map(SaleItemResponse::fromEntity).toList()
                : new ArrayList<>();

        SalePaymentResponse paymentResponse = sale.getPayment() != null
                ? SalePaymentResponse.fromEntity(sale.getPayment())
                : null;

        return new SaleResponse(
                sale.getId(),
                sale.getSaleNumber(),
                sale.getSaleDate(),
                sale.getSubtotal(),
                sale.getDiscountPercentage(),
                sale.getDiscountAmount(),
                sale.getGrandTotal(),
                sale.getStatus(),
                sale.getCancellationReason(),
                sale.getCancellationDescription(),
                sale.getCancelledBy(),
                sale.getCancelledAt(),
                itemResponses,
                paymentResponse,
                sale.getCreatedAt(),
                sale.getUpdatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSaleNumber() {
        return saleNumber;
    }

    public void setSaleNumber(String saleNumber) {
        this.saleNumber = saleNumber;
    }

    public LocalDate getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDate saleDate) {
        this.saleDate = saleDate;
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

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public SaleStatus getStatus() {
        return status;
    }

    public void setStatus(SaleStatus status) {
        this.status = status;
    }

    public CancellationReason getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(CancellationReason cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationDescription() {
        return cancellationDescription;
    }

    public void setCancellationDescription(String cancellationDescription) {
        this.cancellationDescription = cancellationDescription;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(String cancelledBy) {
        this.cancelledBy = cancelledBy;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SaleItemResponse> items) {
        this.items = items;
    }

    public SalePaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(SalePaymentResponse payment) {
        this.payment = payment;
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
