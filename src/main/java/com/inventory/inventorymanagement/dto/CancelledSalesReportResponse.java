package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CancellationReason;
import com.inventory.inventorymanagement.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CancelledSalesReportResponse {

    private Long saleId;
    private String saleNumber;
    private LocalDate saleDate;
    private BigDecimal grandTotal;
    private CancellationReason cancellationReason;
    private String cancellationDescription;
    private String cancelledBy;
    private LocalDateTime cancelledAt;
    private List<SaleItemResponse> items = new ArrayList<>();

    public CancelledSalesReportResponse() {
    }

    public CancelledSalesReportResponse(Long saleId, String saleNumber, LocalDate saleDate,
                                        BigDecimal grandTotal, CancellationReason cancellationReason,
                                        String cancellationDescription, String cancelledBy,
                                        LocalDateTime cancelledAt, List<SaleItemResponse> items) {
        this.saleId = saleId;
        this.saleNumber = saleNumber;
        this.saleDate = saleDate;
        this.grandTotal = grandTotal;
        this.cancellationReason = cancellationReason;
        this.cancellationDescription = cancellationDescription;
        this.cancelledBy = cancelledBy;
        this.cancelledAt = cancelledAt;
        this.items = items != null ? items : new ArrayList<>();
    }

    public static CancelledSalesReportResponse fromEntity(Sale sale) {
        if (sale == null) {
            return null;
        }

        List<SaleItemResponse> itemResponses = sale.getItems() != null
                ? sale.getItems().stream().map(SaleItemResponse::fromEntity).toList()
                : new ArrayList<>();

        return new CancelledSalesReportResponse(
                sale.getId(),
                sale.getSaleNumber(),
                sale.getSaleDate(),
                sale.getGrandTotal(),
                sale.getCancellationReason(),
                sale.getCancellationDescription(),
                sale.getCancelledBy(),
                sale.getCancelledAt(),
                itemResponses
        );
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
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

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
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
}
