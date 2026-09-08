package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.SupplierRequest;
import com.inventory.inventorymanagement.dto.SupplierResponse;
import com.inventory.inventorymanagement.entity.SupplierStatus;

import java.util.List;

public interface SupplierService {

    SupplierResponse createSupplier(SupplierRequest request);

    SupplierResponse getSupplierById(Long id);

    List<SupplierResponse> getAllSuppliers(SupplierStatus status);

    List<SupplierResponse> searchSuppliers(String query);

    SupplierResponse updateSupplier(Long id, SupplierRequest request);

    SupplierResponse updateSupplierStatus(Long id, SupplierStatus status);
}
