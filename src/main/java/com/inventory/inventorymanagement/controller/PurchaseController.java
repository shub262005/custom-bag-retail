package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.PurchasePaymentRequest;
import com.inventory.inventorymanagement.dto.PurchaseRequest;
import com.inventory.inventorymanagement.dto.PurchaseResponse;
import com.inventory.inventorymanagement.entity.PurchaseStatus;
import com.inventory.inventorymanagement.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<PurchaseResponse> createPurchase(@Valid @RequestBody PurchaseRequest request) {
        PurchaseResponse response = purchaseService.createPurchase(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseResponse>> getPurchases(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) PurchaseStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search) {
        List<PurchaseResponse> purchases = purchaseService.getPurchases(supplierId, status, startDate, endDate, search);
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseResponse> getPurchaseById(@PathVariable Long id) {
        PurchaseResponse response = purchaseService.getPurchaseById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/number/{purchaseNumber}")
    public ResponseEntity<PurchaseResponse> getPurchaseByNumber(@PathVariable String purchaseNumber) {
        PurchaseResponse response = purchaseService.getPurchaseByNumber(purchaseNumber);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PurchaseResponse> updatePurchase(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseRequest request) {
        PurchaseResponse response = purchaseService.updatePurchase(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<PurchaseResponse> cancelPurchase(@PathVariable Long id) {
        PurchaseResponse response = purchaseService.cancelPurchase(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<PurchaseResponse> addPayment(
            @PathVariable Long id,
            @Valid @RequestBody PurchasePaymentRequest request) {
        PurchaseResponse response = purchaseService.addPayment(id, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/payments/{paymentId}")
    public ResponseEntity<PurchaseResponse> updatePayment(
            @PathVariable Long id,
            @PathVariable Long paymentId,
            @Valid @RequestBody PurchasePaymentRequest request) {
        PurchaseResponse response = purchaseService.updatePayment(id, paymentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/payments/{paymentId}")
    public ResponseEntity<PurchaseResponse> deletePayment(
            @PathVariable Long id,
            @PathVariable Long paymentId) {
        PurchaseResponse response = purchaseService.deletePayment(id, paymentId);
        return ResponseEntity.ok(response);
    }
}
