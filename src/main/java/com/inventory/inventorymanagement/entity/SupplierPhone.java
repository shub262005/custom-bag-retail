package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;

import java.util.Objects;

@Entity
@Table(name = "supplier_phones")
public class SupplierPhone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "phone_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "phone_number", nullable = false, length = 50)
    private String phoneNumber;

    @Column(name = "label", length = 50)
    private String label;

    public SupplierPhone() {
    }

    public SupplierPhone(Long id, Supplier supplier, String phoneNumber, String label) {
        this.id = id;
        this.supplier = supplier;
        this.phoneNumber = phoneNumber;
        this.label = label;
    }

    public SupplierPhone(String phoneNumber, String label) {
        this.phoneNumber = phoneNumber;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
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
        SupplierPhone that = (SupplierPhone) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "SupplierPhone{" +
                "id=" + id +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", label='" + label + '\'' +
                '}';
    }
}
