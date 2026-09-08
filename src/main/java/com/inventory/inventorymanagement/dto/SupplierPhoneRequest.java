package com.inventory.inventorymanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SupplierPhoneRequest {

    @NotBlank(message = "Phone number is required")
    @Size(max = 50, message = "Phone number cannot exceed 50 characters")
    private String phoneNumber;

    @Size(max = 50, message = "Label cannot exceed 50 characters")
    private String label;

    public SupplierPhoneRequest() {
    }

    public SupplierPhoneRequest(String phoneNumber, String label) {
        this.phoneNumber = phoneNumber;
        this.label = label;
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
