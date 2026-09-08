package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(
    name = "sale_items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_sale_item_sale_product", columnNames = {"sale_id", "product_id"})
    }
)
public class SaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sale_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "selling_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "item_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal itemTotal;

    public SaleItem() {
    }

    public SaleItem(Long id, Sale sale, Product product, Integer quantity,
                    BigDecimal sellingPrice, BigDecimal itemTotal) {
        this.id = id;
        this.sale = sale;
        this.product = product;
        this.quantity = quantity;
        this.sellingPrice = sellingPrice;
        this.itemTotal = itemTotal;
    }

    public SaleItem(Product product, Integer quantity, BigDecimal sellingPrice, BigDecimal itemTotal) {
        this.product = product;
        this.quantity = quantity;
        this.sellingPrice = sellingPrice;
        this.itemTotal = itemTotal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SaleItem that = (SaleItem) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "SaleItem{" +
                "id=" + id +
                ", quantity=" + quantity +
                ", sellingPrice=" + sellingPrice +
                ", itemTotal=" + itemTotal +
                '}';
    }
}
