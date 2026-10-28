package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CustomerStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CustomerRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 150, message = "Customer name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Customer phone number is required")
    @Size(max = 20, message = "Customer phone number must not exceed 20 characters")
    private String phone;

    @Size(max = 150, message = "Customer email must not exceed 150 characters")
    private String email;

    @Size(max = 500, message = "Customer address must not exceed 500 characters")
    private String address;

    private CustomerStatus status;

    public CustomerRequest() {
    }

    public CustomerRequest(String name, String phone, String email, String address, CustomerStatus status) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.status = status != null ? status : CustomerStatus.ACTIVE;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public CustomerStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerStatus status) {
        this.status = status;
    }
}
