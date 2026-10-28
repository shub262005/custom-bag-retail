package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.Customer;
import com.inventory.inventorymanagement.entity.CustomerStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private CustomerStatus status;
    private Long totalPurchasesCount = 0L;
    private BigDecimal totalPurchasesAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;
    private BigDecimal totalDueAmount = BigDecimal.ZERO;
    private BigDecimal totalRepaidAmount = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CustomerResponse() {
    }

    public CustomerResponse(Long id, String name, String phone, String email, String address,
                            CustomerStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static CustomerResponse fromEntity(Customer customer) {
        if (customer == null) {
            return null;
        }
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
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

    public Long getTotalPurchasesCount() {
        return totalPurchasesCount;
    }

    public void setTotalPurchasesCount(Long totalPurchasesCount) {
        this.totalPurchasesCount = totalPurchasesCount;
    }

    public BigDecimal getTotalPurchasesAmount() {
        return totalPurchasesAmount;
    }

    public void setTotalPurchasesAmount(BigDecimal totalPurchasesAmount) {
        this.totalPurchasesAmount = totalPurchasesAmount;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public BigDecimal getTotalDueAmount() {
        return totalDueAmount;
    }

    public void setTotalDueAmount(BigDecimal totalDueAmount) {
        this.totalDueAmount = totalDueAmount;
    }

    public BigDecimal getTotalRepaidAmount() {
        return totalRepaidAmount;
    }

    public void setTotalRepaidAmount(BigDecimal totalRepaidAmount) {
        this.totalRepaidAmount = totalRepaidAmount;
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

