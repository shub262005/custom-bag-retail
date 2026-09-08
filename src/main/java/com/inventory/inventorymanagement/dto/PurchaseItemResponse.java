package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.PurchaseItem;

import java.math.BigDecimal;

public class PurchaseItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private Integer quantity;
    private BigDecimal purchasePrice;
    private BigDecimal itemTotal;

    public PurchaseItemResponse() {
    }

    public PurchaseItemResponse(Long id, Long productId, String productName, String productSku,
                                Integer quantity, BigDecimal purchasePrice, BigDecimal itemTotal) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productSku = productSku;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.itemTotal = itemTotal;
    }

    public static PurchaseItemResponse fromEntity(PurchaseItem item) {
        if (item == null) {
            return null;
        }

        Long prodId = item.getProduct() != null ? item.getProduct().getId() : null;
        String prodName = item.getProduct() != null ? item.getProduct().getName() : null;
        String prodSku = item.getProduct() != null ? item.getProduct().getSku() : null;

        return new PurchaseItemResponse(
                item.getId(),
                prodId,
                prodName,
                prodSku,
                item.getQuantity(),
                item.getPurchasePrice(),
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

    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimal getItemTotal() {
        return itemTotal;
    }

    public void setItemTotal(BigDecimal itemTotal) {
        this.itemTotal = itemTotal;
    }
}
