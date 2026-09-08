package com.inventory.inventorymanagement.dto;

import java.math.BigDecimal;

public class CategorySalesReportResponse {

    private Long categoryId;
    private String categoryName;
    private long quantitySold;
    private BigDecimal salesAmount;

    public CategorySalesReportResponse() {
    }

    public CategorySalesReportResponse(Long categoryId, String categoryName,
                                       long quantitySold, BigDecimal salesAmount) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.quantitySold = quantitySold;
        this.salesAmount = salesAmount != null ? salesAmount : BigDecimal.ZERO;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public long getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(long quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getSalesAmount() {
        return salesAmount;
    }

    public void setSalesAmount(BigDecimal salesAmount) {
        this.salesAmount = salesAmount;
    }
}
