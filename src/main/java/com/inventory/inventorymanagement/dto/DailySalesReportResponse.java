package com.inventory.inventorymanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailySalesReportResponse {

    private LocalDate date;
    private long totalSalesCount;
    private BigDecimal totalSalesAmount;

    public DailySalesReportResponse() {
    }

    public DailySalesReportResponse(LocalDate date, long totalSalesCount, BigDecimal totalSalesAmount) {
        this.date = date;
        this.totalSalesCount = totalSalesCount;
        this.totalSalesAmount = totalSalesAmount != null ? totalSalesAmount : BigDecimal.ZERO;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public long getTotalSalesCount() {
        return totalSalesCount;
    }

    public void setTotalSalesCount(long totalSalesCount) {
        this.totalSalesCount = totalSalesCount;
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
    }
}
