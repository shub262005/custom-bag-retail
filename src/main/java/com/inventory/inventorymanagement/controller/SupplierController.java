package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.SupplierRequest;
import com.inventory.inventorymanagement.dto.SupplierResponse;
import com.inventory.inventorymanagement.dto.SupplierStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import com.inventory.inventorymanagement.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest request) {
        SupplierResponse response = supplierService.createSupplier(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAllSuppliers(
            @RequestParam(required = false) SupplierStatus status) {
        List<SupplierResponse> suppliers = supplierService.getAllSuppliers(status);
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/search")
    public ResponseEntity<List<SupplierResponse>> searchSuppliers(
            @RequestParam(name = "q", required = false, defaultValue = "") String query) {
        List<SupplierResponse> suppliers = supplierService.searchSuppliers(query);
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> getSupplierById(@PathVariable Long id) {
        SupplierResponse response = supplierService.getSupplierById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request) {
        SupplierResponse response = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SupplierResponse> updateSupplierStatus(
            @PathVariable Long id,
            @Valid @RequestBody SupplierStatusUpdateRequest request) {
        SupplierResponse response = supplierService.updateSupplierStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
