package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "purchases")
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchase_id")
    private Long id;

    @Column(name = "purchase_number", nullable = false, unique = true, length = 50)
    private String purchaseNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PurchaseStatus status = PurchaseStatus.COMPLETED;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    private List<PurchaseItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    private List<PurchasePayment> payments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Purchase() {
    }

    public Purchase(Long id, String purchaseNumber, Supplier supplier, LocalDate purchaseDate,
                    String invoiceNumber, LocalDate invoiceDate, BigDecimal subtotal,
                    BigDecimal discountPercentage, BigDecimal discountAmount,
                    BigDecimal taxRate, BigDecimal taxAmount, BigDecimal grandTotal,
                    PurchaseStatus status, String notes,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.purchaseNumber = purchaseNumber;
        this.supplier = supplier;
        this.purchaseDate = purchaseDate;
        this.invoiceNumber = invoiceNumber;
        this.invoiceDate = invoiceDate;
        this.subtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        this.discountPercentage = discountPercentage != null ? discountPercentage : BigDecimal.ZERO;
        this.discountAmount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        this.taxRate = taxRate != null ? taxRate : BigDecimal.ZERO;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.grandTotal = grandTotal != null ? grandTotal : BigDecimal.ZERO;
        this.status = status != null ? status : PurchaseStatus.COMPLETED;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPurchaseNumber() {
        return purchaseNumber;
    }

    public void setPurchaseNumber(String purchaseNumber) {
        this.purchaseNumber = purchaseNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(BigDecimal discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public PurchaseStatus getStatus() {
        return status;
    }

    public void setStatus(PurchaseStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PurchaseItem> getItems() {
        return items;
    }

    public void setItems(List<PurchaseItem> items) {
        this.items = items;
    }

    public List<PurchasePayment> getPayments() {
        return payments;
    }

    public void setPayments(List<PurchasePayment> payments) {
        this.payments = payments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void addItem(PurchaseItem item) {
        if (item != null) {
            items.add(item);
            item.setPurchase(this);
        }
    }

    public void removeItem(PurchaseItem item) {
        if (item != null) {
            items.remove(item);
            item.setPurchase(null);
        }
    }

    public void clearItems() {
        for (PurchaseItem item : new ArrayList<>(items)) {
            removeItem(item);
        }
    }

    public void addPayment(PurchasePayment payment) {
        if (payment != null) {
            payments.add(payment);
            payment.setPurchase(this);
        }
    }

    public void removePayment(PurchasePayment payment) {
        if (payment != null) {
            payments.remove(payment);
            payment.setPurchase(null);
        }
    }

    public BigDecimal calculateTotalPaid() {
        if (payments == null || payments.isEmpty()) {
            return BigDecimal.ZERO.setScale(2);
        }
        return payments.stream()
                .map(PurchasePayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2);
    }

    public BigDecimal calculateOutstanding() {
        BigDecimal totalPaid = calculateTotalPaid();
        BigDecimal grand = grandTotal != null ? grandTotal : BigDecimal.ZERO;
        return grand.subtract(totalPaid).setScale(2);
    }

    public PaymentStatus calculatePaymentStatus() {
        BigDecimal totalPaid = calculateTotalPaid();
        BigDecimal grand = grandTotal != null ? grandTotal : BigDecimal.ZERO;

        if (totalPaid.compareTo(BigDecimal.ZERO) == 0) {
            return PaymentStatus.UNPAID;
        } else if (totalPaid.compareTo(grand) >= 0) {
            return PaymentStatus.PAID;
        } else {
            return PaymentStatus.PARTIALLY_PAID;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Purchase purchase = (Purchase) o;
        return id != null && Objects.equals(id, purchase.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Purchase{" +
                "id=" + id +
                ", purchaseNumber='" + purchaseNumber + '\'' +
                ", purchaseDate=" + purchaseDate +
                ", grandTotal=" + grandTotal +
                ", status=" + status +
                '}';
    }
}
