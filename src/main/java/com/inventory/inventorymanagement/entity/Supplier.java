package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "supplier_id")
    private Long id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "gst_number", length = 50)
    private String gstNumber;

    @Column(name = "address", length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupplierStatus status = SupplierStatus.ACTIVE;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    private List<SupplierPhone> phones = new ArrayList<>();

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    private List<SupplierEmail> emails = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Supplier() {
    }

    public Supplier(Long id, String name, String gstNumber, String address, SupplierStatus status,
                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.gstNumber = gstNumber;
        this.address = address;
        this.status = status != null ? status : SupplierStatus.ACTIVE;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public SupplierStatus getStatus() {
        return status;
    }

    public void setStatus(SupplierStatus status) {
        this.status = status;
    }

    public List<SupplierPhone> getPhones() {
        return phones;
    }

    public void setPhones(List<SupplierPhone> phones) {
        this.phones = phones;
    }

    public List<SupplierEmail> getEmails() {
        return emails;
    }

    public void setEmails(List<SupplierEmail> emails) {
        this.emails = emails;
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

    public void addPhone(SupplierPhone phone) {
        if (phone != null) {
            phones.add(phone);
            phone.setSupplier(this);
        }
    }

    public void removePhone(SupplierPhone phone) {
        if (phone != null) {
            phones.remove(phone);
            phone.setSupplier(null);
        }
    }

    public void clearPhones() {
        for (SupplierPhone phone : new ArrayList<>(phones)) {
            removePhone(phone);
        }
    }

    public void addEmail(SupplierEmail email) {
        if (email != null) {
            emails.add(email);
            email.setSupplier(this);
        }
    }

    public void removeEmail(SupplierEmail email) {
        if (email != null) {
            emails.remove(email);
            email.setSupplier(null);
        }
    }

    public void clearEmails() {
        for (SupplierEmail email : new ArrayList<>(emails)) {
            removeEmail(email);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Supplier supplier = (Supplier) o;
        return Objects.equals(id, supplier.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Supplier{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", gstNumber='" + gstNumber + '\'' +
                ", status=" + status +
                '}';
    }
}
