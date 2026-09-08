package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "supplier_emails")
public class SupplierEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "email_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "label", length = 50)
    private String label;

    public SupplierEmail() {
    }

    public SupplierEmail(Long id, Supplier supplier, String email, String label) {
        this.id = id;
        this.supplier = supplier;
        this.email = email;
        this.label = label;
    }

    public SupplierEmail(String email, String label) {
        this.email = email;
        this.label = label;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SupplierEmail that = (SupplierEmail) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "SupplierEmail{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", label='" + label + '\'' +
                '}';
    }
}
