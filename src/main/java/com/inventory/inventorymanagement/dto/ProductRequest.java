package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 150, message = "Product name must be between 2 and 150 characters")
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(min = 2, max = 50, message = "SKU must be between 2 and 50 characters")
    private String sku;

    @Size(max = 50, message = "Barcode must be at most 50 characters")
    private String barcode;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private Long brandId;

    @Size(max = 50, message = "Color must be at most 50 characters")
    private String color;

    @Size(max = 50, message = "Capacity must be at most 50 characters")
    private String capacity;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "0.01", message = "Purchase price must be greater than 0")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    private BigDecimal sellingPrice;

    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock must be greater than or equal to 0")
    private Integer minimumStock;

    @Size(max = 255, message = "Image URL must be at most 255 characters")
    private String imageUrl;

    private ProductStatus status = ProductStatus.ACTIVE;

    public ProductRequest() {
    }

    public ProductRequest(String name, String sku, String barcode, Long categoryId, Long brandId,
                          String color, String capacity, BigDecimal purchasePrice, BigDecimal sellingPrice,
                          Integer minimumStock, String imageUrl, ProductStatus status) {
        this.name = name;
        this.sku = sku;
        this.barcode = barcode;
        this.categoryId = categoryId;
        this.brandId = brandId;
        this.color = color;
        this.capacity = capacity;
        this.purchasePrice = purchasePrice;
        this.sellingPrice = sellingPrice;
        this.minimumStock = minimumStock;
        this.imageUrl = imageUrl;
        this.status = status != null ? status : ProductStatus.ACTIVE;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getBrandId() {
        return brandId;
    }

    public void setBrandId(Long brandId) {
        this.brandId = brandId;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getCapacity() {
        return capacity;
    }

    public void setCapacity(String capacity) {
        this.capacity = capacity;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public Integer getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(Integer minimumStock) {
        this.minimumStock = minimumStock;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public void setStatus(ProductStatus status) {
        this.status = status;
    }
}
