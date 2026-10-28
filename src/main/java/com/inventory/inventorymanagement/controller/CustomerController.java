package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.CustomerStatus;
import com.inventory.inventorymanagement.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status) {
        List<CustomerResponse> customers = customerService.getCustomers(search, status);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/sales")
    public ResponseEntity<List<SaleResponse>> getCustomerSales(@PathVariable Long id) {
        List<SaleResponse> sales = customerService.getCustomerSales(id);
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/{id}/repayments")
    public ResponseEntity<List<CustomerRepaymentResponse>> getCustomerRepayments(@PathVariable Long id) {
        List<CustomerRepaymentResponse> repayments = customerService.getCustomerRepayments(id);
        return ResponseEntity.ok(repayments);
    }

    @PostMapping("/{id}/repayments")
    public ResponseEntity<CustomerRepaymentResponse> recordRepayment(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRepaymentRequest request) {
        request.setCustomerId(id);
        CustomerRepaymentResponse response = customerService.recordRepayment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/repayments")
    public ResponseEntity<CustomerRepaymentResponse> recordGeneralRepayment(
            @Valid @RequestBody CustomerRepaymentRequest request) {
        CustomerRepaymentResponse response = customerService.recordRepayment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
