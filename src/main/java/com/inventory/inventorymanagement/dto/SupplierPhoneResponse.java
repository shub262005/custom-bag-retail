package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.SupplierPhone;

public class SupplierPhoneResponse {

    private Long id;
    private String phoneNumber;
    private String label;

    public SupplierPhoneResponse() {
    }

    public SupplierPhoneResponse(Long id, String phoneNumber, String label) {
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.label = label;
    }

    public static SupplierPhoneResponse fromEntity(SupplierPhone phone) {
        if (phone == null) {
            return null;
        }
        return new SupplierPhoneResponse(phone.getId(), phone.getPhoneNumber(), phone.getLabel());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
}
