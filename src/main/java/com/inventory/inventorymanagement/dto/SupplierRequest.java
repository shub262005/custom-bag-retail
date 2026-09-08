package com.inventory.inventorymanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class SupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(max = 150, message = "Supplier name cannot exceed 150 characters")
    private String name;

    @Size(max = 50, message = "GST number cannot exceed 50 characters")
    private String gstNumber;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @Valid
    private List<SupplierPhoneRequest> phones = new ArrayList<>();

    @Valid
    private List<SupplierEmailRequest> emails = new ArrayList<>();

    public SupplierRequest() {
    }

    public SupplierRequest(String name, String gstNumber, String address,
                           List<SupplierPhoneRequest> phones, List<SupplierEmailRequest> emails) {
        this.name = name;
        this.gstNumber = gstNumber;
        this.address = address;
        if (phones != null) {
            this.phones = phones;
        }
        if (emails != null) {
            this.emails = emails;
        }
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

    public List<SupplierPhoneRequest> getPhones() {
        return phones;
    }

    public void setPhones(List<SupplierPhoneRequest> phones) {
        this.phones = phones != null ? phones : new ArrayList<>();
    }

    public List<SupplierEmailRequest> getEmails() {
        return emails;
    }

    public void setEmails(List<SupplierEmailRequest> emails) {
        this.emails = emails != null ? emails : new ArrayList<>();
    }
}
