package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(
    name = "purchase_items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_purchase_item_purchase_product", columnNames = {"purchase_id", "product_id"})
    }
)
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false)
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "purchase_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "item_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal itemTotal;

    public PurchaseItem() {
    }

    public PurchaseItem(Long id, Purchase purchase, Product product, Integer quantity,
                        BigDecimal purchasePrice, BigDecimal itemTotal) {
        this.id = id;
        this.purchase = purchase;
        this.product = product;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.itemTotal = itemTotal;
    }

    public PurchaseItem(Product product, Integer quantity, BigDecimal purchasePrice, BigDecimal itemTotal) {
        this.product = product;
        this.quantity = quantity;
        this.purchasePrice = purchasePrice;
        this.itemTotal = itemTotal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Purchase getPurchase() {
        return purchase;
    }

    public void setPurchase(Purchase purchase) {
        this.purchase = purchase;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PurchaseItem that = (PurchaseItem) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "PurchaseItem{" +
                "id=" + id +
                ", quantity=" + quantity +
                ", purchasePrice=" + purchasePrice +
                ", itemTotal=" + itemTotal +
                '}';
    }
}
