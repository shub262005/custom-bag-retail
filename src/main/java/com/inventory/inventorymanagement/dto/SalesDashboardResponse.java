package com.inventory.inventorymanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class SalesDashboardResponse {

    private LocalDate date;
    private long todayCompletedSalesCount;
    private BigDecimal todayCompletedSalesAmount;
    private long todayCancelledSalesCount;
    private List<PaymentMethodSalesReportResponse> salesByPaymentMethod = new ArrayList<>();
    private List<ProductSalesReportResponse> topSellingProducts = new ArrayList<>();

    public SalesDashboardResponse() {
    }

    public SalesDashboardResponse(LocalDate date, long todayCompletedSalesCount,
                                  BigDecimal todayCompletedSalesAmount, long todayCancelledSalesCount,
                                  List<PaymentMethodSalesReportResponse> salesByPaymentMethod,
                                  List<ProductSalesReportResponse> topSellingProducts) {
        this.date = date;
        this.todayCompletedSalesCount = todayCompletedSalesCount;
        this.todayCompletedSalesAmount = todayCompletedSalesAmount != null ? todayCompletedSalesAmount : BigDecimal.ZERO;
        this.todayCancelledSalesCount = todayCancelledSalesCount;
        this.salesByPaymentMethod = salesByPaymentMethod != null ? salesByPaymentMethod : new ArrayList<>();
        this.topSellingProducts = topSellingProducts != null ? topSellingProducts : new ArrayList<>();
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public long getTodayCompletedSalesCount() {
        return todayCompletedSalesCount;
    }

    public void setTodayCompletedSalesCount(long todayCompletedSalesCount) {
        this.todayCompletedSalesCount = todayCompletedSalesCount;
    }

    public BigDecimal getTodayCompletedSalesAmount() {
        return todayCompletedSalesAmount;
    }

    public void setTodayCompletedSalesAmount(BigDecimal todayCompletedSalesAmount) {
        this.todayCompletedSalesAmount = todayCompletedSalesAmount;
    }

    public long getTodayCancelledSalesCount() {
        return todayCancelledSalesCount;
    }

    public void setTodayCancelledSalesCount(long todayCancelledSalesCount) {
        this.todayCancelledSalesCount = todayCancelledSalesCount;
    }

    public List<PaymentMethodSalesReportResponse> getSalesByPaymentMethod() {
        return salesByPaymentMethod;
    }

    public void setSalesByPaymentMethod(List<PaymentMethodSalesReportResponse> salesByPaymentMethod) {
        this.salesByPaymentMethod = salesByPaymentMethod;
    }

    public List<ProductSalesReportResponse> getTopSellingProducts() {
        return topSellingProducts;
    }

    public void setTopSellingProducts(List<ProductSalesReportResponse> topSellingProducts) {
        this.topSellingProducts = topSellingProducts;
    }
}
