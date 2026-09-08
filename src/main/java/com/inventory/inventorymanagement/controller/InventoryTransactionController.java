package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.InventoryTransactionRequest;
import com.inventory.inventorymanagement.dto.InventoryTransactionResponse;
import com.inventory.inventorymanagement.entity.TransactionType;
import com.inventory.inventorymanagement.service.InventoryTransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory-transactions")
public class InventoryTransactionController {

    private final InventoryTransactionService inventoryTransactionService;

    public InventoryTransactionController(InventoryTransactionService inventoryTransactionService) {
        this.inventoryTransactionService = inventoryTransactionService;
    }

    @PostMapping
    public ResponseEntity<InventoryTransactionResponse> createTransaction(
            @Valid @RequestBody InventoryTransactionRequest request) {
        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<InventoryTransactionResponse>> getTransactions(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) TransactionType transactionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<InventoryTransactionResponse> transactions = inventoryTransactionService.getTransactions(
                productId, transactionType, startDate, endDate
        );
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryTransactionResponse> getTransactionById(@PathVariable Long id) {
        InventoryTransactionResponse response = inventoryTransactionService.getTransactionById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<InventoryTransactionResponse>> getTransactionsByProductId(
            @PathVariable Long productId) {
        List<InventoryTransactionResponse> transactions = inventoryTransactionService.getTransactionsByProductId(productId);
        return ResponseEntity.ok(transactions);
    }
}
