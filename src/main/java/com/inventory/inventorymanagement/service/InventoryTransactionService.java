package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.InventoryTransactionRequest;
import com.inventory.inventorymanagement.dto.InventoryTransactionResponse;
import com.inventory.inventorymanagement.entity.TransactionType;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryTransactionService {

    InventoryTransactionResponse createTransaction(InventoryTransactionRequest request);

    InventoryTransactionResponse getTransactionById(Long id);

    List<InventoryTransactionResponse> getTransactionsByProductId(Long productId);

    List<InventoryTransactionResponse> getTransactions(Long productId,
                                                       TransactionType transactionType,
                                                       LocalDateTime startDate,
                                                       LocalDateTime endDate);
}
