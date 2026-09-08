package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.Supplier;
import com.inventory.inventorymanagement.entity.SupplierEmail;
import com.inventory.inventorymanagement.entity.SupplierPhone;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.SupplierRepository;
import com.inventory.inventorymanagement.service.SupplierService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Override
    public SupplierResponse createSupplier(SupplierRequest request) {
        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Supplier with name '" + trimmedName + "' already exists");
        }

        String trimmedGst = sanitizeGst(request.getGstNumber());
        if (trimmedGst != null && supplierRepository.existsByGstNumberIgnoreCase(trimmedGst)) {
            throw new DuplicateResourceException("Supplier with GST number '" + trimmedGst + "' already exists");
        }

        Supplier supplier = new Supplier();
        supplier.setName(trimmedName);
        supplier.setGstNumber(trimmedGst);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        supplier.setStatus(SupplierStatus.ACTIVE);

        if (request.getPhones() != null) {
            for (SupplierPhoneRequest phoneReq : request.getPhones()) {
                supplier.addPhone(new SupplierPhone(
                        phoneReq.getPhoneNumber().trim(),
                        phoneReq.getLabel() != null ? phoneReq.getLabel().trim() : null
                ));
            }
        }

        if (request.getEmails() != null) {
            for (SupplierEmailRequest emailReq : request.getEmails()) {
                supplier.addEmail(new SupplierEmail(
                        emailReq.getEmail().trim(),
                        emailReq.getLabel() != null ? emailReq.getLabel().trim() : null
                ));
            }
        }

        Supplier savedSupplier = supplierRepository.save(supplier);
        return SupplierResponse.fromEntity(savedSupplier);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
        return SupplierResponse.fromEntity(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers(SupplierStatus status) {
        List<Supplier> suppliers;
        if (status != null) {
            suppliers = supplierRepository.findByStatus(status);
        } else {
            suppliers = supplierRepository.findAll();
        }
        return suppliers.stream()
                .map(SupplierResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> searchSuppliers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<Supplier> suppliers = supplierRepository.searchSuppliers(query.trim());
        return suppliers.stream()
                .map(SupplierResponse::fromEntity)
                .toList();
    }

    @Override
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Supplier with name '" + trimmedName + "' already exists");
        }

        String trimmedGst = sanitizeGst(request.getGstNumber());
        if (trimmedGst != null && supplierRepository.existsByGstNumberIgnoreCaseAndIdNot(trimmedGst, id)) {
            throw new DuplicateResourceException("Supplier with GST number '" + trimmedGst + "' already exists");
        }

        supplier.setName(trimmedName);
        supplier.setGstNumber(trimmedGst);
        supplier.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);

        supplier.clearPhones();
        if (request.getPhones() != null) {
            for (SupplierPhoneRequest phoneReq : request.getPhones()) {
                supplier.addPhone(new SupplierPhone(
                        phoneReq.getPhoneNumber().trim(),
                        phoneReq.getLabel() != null ? phoneReq.getLabel().trim() : null
                ));
            }
        }

        supplier.clearEmails();
        if (request.getEmails() != null) {
            for (SupplierEmailRequest emailReq : request.getEmails()) {
                supplier.addEmail(new SupplierEmail(
                        emailReq.getEmail().trim(),
                        emailReq.getLabel() != null ? emailReq.getLabel().trim() : null
                ));
            }
        }

        Supplier updatedSupplier = supplierRepository.save(supplier);
        return SupplierResponse.fromEntity(updatedSupplier);
    }

    @Override
    public SupplierResponse updateSupplierStatus(Long id, SupplierStatus status) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplier.setStatus(status);
        Supplier updatedSupplier = supplierRepository.save(supplier);
        return SupplierResponse.fromEntity(updatedSupplier);
    }

    private String sanitizeGst(String gstNumber) {
        if (gstNumber == null) {
            return null;
        }
        String trimmed = gstNumber.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
