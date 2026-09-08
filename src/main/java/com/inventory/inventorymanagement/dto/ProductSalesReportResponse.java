package com.inventory.inventorymanagement.dto;

import java.math.BigDecimal;

public class ProductSalesReportResponse {

    private Long productId;
    private String productName;
    private String sku;
    private long quantitySold;
    private BigDecimal salesAmount;

    public ProductSalesReportResponse() {
    }

    public ProductSalesReportResponse(Long productId, String productName, String sku,
                                      long quantitySold, BigDecimal salesAmount) {
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.quantitySold = quantitySold;
        this.salesAmount = salesAmount != null ? salesAmount : BigDecimal.ZERO;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
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
