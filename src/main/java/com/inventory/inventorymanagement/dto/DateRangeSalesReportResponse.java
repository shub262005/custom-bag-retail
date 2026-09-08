package com.inventory.inventorymanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DateRangeSalesReportResponse {

    private LocalDate startDate;
    private LocalDate endDate;
    private long totalSalesCount;
    private BigDecimal totalSalesAmount;
    private List<DailySalesReportResponse> dailyBreakdown = new ArrayList<>();

    public DateRangeSalesReportResponse() {
    }

    public DateRangeSalesReportResponse(LocalDate startDate, LocalDate endDate, long totalSalesCount,
                                        BigDecimal totalSalesAmount, List<DailySalesReportResponse> dailyBreakdown) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalSalesCount = totalSalesCount;
        this.totalSalesAmount = totalSalesAmount != null ? totalSalesAmount : BigDecimal.ZERO;
        this.dailyBreakdown = dailyBreakdown != null ? dailyBreakdown : new ArrayList<>();
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
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

    public List<DailySalesReportResponse> getDailyBreakdown() {
        return dailyBreakdown;
    }

    public void setDailyBreakdown(List<DailySalesReportResponse> dailyBreakdown) {
        this.dailyBreakdown = dailyBreakdown;
    }
}
