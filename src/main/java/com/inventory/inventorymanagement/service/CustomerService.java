package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CustomerRepaymentRequest;
import com.inventory.inventorymanagement.dto.CustomerRepaymentResponse;
import com.inventory.inventorymanagement.dto.CustomerRequest;
import com.inventory.inventorymanagement.dto.CustomerResponse;
import com.inventory.inventorymanagement.dto.SaleResponse;
import com.inventory.inventorymanagement.entity.Customer;
import com.inventory.inventorymanagement.entity.CustomerStatus;

import java.util.List;

public interface CustomerService {

    CustomerResponse createCustomer(CustomerRequest request);

    CustomerResponse updateCustomer(Long id, CustomerRequest request);

    CustomerResponse getCustomerById(Long id);

    List<CustomerResponse> getCustomers(String query, CustomerStatus status);

    Customer getOrCreateCustomer(Long customerId, String name, String phone, String email, String address);

    CustomerRepaymentResponse recordRepayment(CustomerRepaymentRequest request);

    List<CustomerRepaymentResponse> getCustomerRepayments(Long customerId);

    List<SaleResponse> getCustomerSales(Long customerId);
}
