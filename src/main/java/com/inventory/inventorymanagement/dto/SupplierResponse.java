package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.Supplier;
import com.inventory.inventorymanagement.entity.SupplierStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SupplierResponse {

    private Long id;
    private String name;
    private String gstNumber;
    private String address;
    private SupplierStatus status;
    private List<SupplierPhoneResponse> phones = new ArrayList<>();
    private List<SupplierEmailResponse> emails = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SupplierResponse() {
    }

    public SupplierResponse(Long id, String name, String gstNumber, String address, SupplierStatus status,
                            List<SupplierPhoneResponse> phones, List<SupplierEmailResponse> emails,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.gstNumber = gstNumber;
        this.address = address;
        this.status = status;
        this.phones = phones != null ? phones : new ArrayList<>();
        this.emails = emails != null ? emails : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static SupplierResponse fromEntity(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        List<SupplierPhoneResponse> phoneResponses = supplier.getPhones() != null
                ? supplier.getPhones().stream().map(SupplierPhoneResponse::fromEntity).toList()
                : new ArrayList<>();

        List<SupplierEmailResponse> emailResponses = supplier.getEmails() != null
                ? supplier.getEmails().stream().map(SupplierEmailResponse::fromEntity).toList()
                : new ArrayList<>();

        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getGstNumber(),
                supplier.getAddress(),
                supplier.getStatus(),
                phoneResponses,
                emailResponses,
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
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

    public List<SupplierPhoneResponse> getPhones() {
        return phones;
    }

    public void setPhones(List<SupplierPhoneResponse> phones) {
        this.phones = phones;
    }

    public List<SupplierEmailResponse> getEmails() {
        return emails;
    }

    public void setEmails(List<SupplierEmailResponse> emails) {
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
}
