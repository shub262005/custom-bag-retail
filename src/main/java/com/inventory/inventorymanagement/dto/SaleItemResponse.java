package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.SaleItem;

import java.math.BigDecimal;

public class SaleItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private String barcode;
    private Integer quantity;
    private BigDecimal sellingPrice;
    private BigDecimal itemTotal;

    public SaleItemResponse() {
    }

    public SaleItemResponse(Long id, Long productId, String productName, String sku,
                            String barcode, Integer quantity, BigDecimal sellingPrice,
                            BigDecimal itemTotal) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.sku = sku;
        this.barcode = barcode;
        this.quantity = quantity;
        this.sellingPrice = sellingPrice;
        this.itemTotal = itemTotal;
    }

    public static SaleItemResponse fromEntity(SaleItem item) {
        if (item == null) {
            return null;
        }
        return new SaleItemResponse(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProduct() != null ? item.getProduct().getName() : null,
                item.getProduct() != null ? item.getProduct().getSku() : null,
                item.getProduct() != null ? item.getProduct().getBarcode() : null,
                item.getQuantity(),
                item.getSellingPrice(),
                item.getItemTotal()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getItemTotal() {
        return itemTotal;
    }

    public void setItemTotal(BigDecimal itemTotal) {
        this.itemTotal = itemTotal;
    }
}
