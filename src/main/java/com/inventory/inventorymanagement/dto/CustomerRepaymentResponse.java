package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.CustomerRepayment;
import com.inventory.inventorymanagement.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CustomerRepaymentResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long saleId;
    private String saleNumber;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private LocalDate repaymentDate;
    private String notes;
    private String receivedBy;
    private LocalDateTime createdAt;

    public CustomerRepaymentResponse() {
    }

    public CustomerRepaymentResponse(Long id, Long customerId, String customerName, String customerPhone,
                                   Long saleId, String saleNumber, BigDecimal amount,
                                   PaymentMethod paymentMethod, LocalDate repaymentDate,
                                   String notes, String receivedBy, LocalDateTime createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.saleId = saleId;
        this.saleNumber = saleNumber;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.repaymentDate = repaymentDate;
        this.notes = notes;
        this.receivedBy = receivedBy;
        this.createdAt = createdAt;
    }

    public static CustomerRepaymentResponse fromEntity(CustomerRepayment repayment) {
        if (repayment == null) {
            return null;
        }

        Long customerId = repayment.getCustomer() != null ? repayment.getCustomer().getId() : null;
        String customerName = repayment.getCustomer() != null ? repayment.getCustomer().getName() : null;
        String customerPhone = repayment.getCustomer() != null ? repayment.getCustomer().getPhone() : null;
        Long saleId = repayment.getSale() != null ? repayment.getSale().getId() : null;
        String saleNumber = repayment.getSale() != null ? repayment.getSale().getSaleNumber() : null;

        return new CustomerRepaymentResponse(
                repayment.getId(),
                customerId,
                customerName,
                customerPhone,
                saleId,
                saleNumber,
                repayment.getAmount(),
                repayment.getPaymentMethod(),
                repayment.getRepaymentDate(),
                repayment.getNotes(),
                repayment.getReceivedBy(),
                repayment.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
    }

    public String getSaleNumber() {
        return saleNumber;
    }

    public void setSaleNumber(String saleNumber) {
        this.saleNumber = saleNumber;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDate getRepaymentDate() {
        return repaymentDate;
    }

    public void setRepaymentDate(LocalDate repaymentDate) {
        this.repaymentDate = repaymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
