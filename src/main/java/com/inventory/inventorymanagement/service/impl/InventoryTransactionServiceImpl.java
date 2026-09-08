package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.InventoryTransactionRequest;
import com.inventory.inventorymanagement.dto.InventoryTransactionResponse;
import com.inventory.inventorymanagement.entity.InventoryTransaction;
import com.inventory.inventorymanagement.entity.Product;
import com.inventory.inventorymanagement.entity.ProductStatus;
import com.inventory.inventorymanagement.entity.TransactionType;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.InventoryTransactionRepository;
import com.inventory.inventorymanagement.repository.ProductRepository;
import com.inventory.inventorymanagement.service.InventoryTransactionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InventoryTransactionServiceImpl implements InventoryTransactionService {

    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;

    public InventoryTransactionServiceImpl(InventoryTransactionRepository inventoryTransactionRepository,
                                          ProductRepository productRepository) {
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
    }

    @Override
    public InventoryTransactionResponse createTransaction(InventoryTransactionRequest request) {
        Long productId = request.getProductId();
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot perform inventory transaction on inactive product with id: " + productId);
        }

        int quantityBefore = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int quantityAfter;
        int recordedQuantity;

        TransactionType type = request.getTransactionType();
        Integer reqQty = request.getQuantity();

        if (type == TransactionType.STOCK_IN) {
            if (reqQty == null || reqQty <= 0) {
                throw new IllegalArgumentException("STOCK_IN quantity must be greater than 0");
            }
            recordedQuantity = reqQty;
            quantityAfter = quantityBefore + recordedQuantity;
        } else if (type == TransactionType.STOCK_OUT) {
            if (reqQty == null || reqQty <= 0) {
                throw new IllegalArgumentException("STOCK_OUT quantity must be greater than 0");
            }
            if (reqQty > quantityBefore) {
                throw new IllegalArgumentException(
                        "Insufficient stock for product id: " + productId +
                        ". Current stock: " + quantityBefore + ", requested: " + reqQty
                );
            }
            recordedQuantity = reqQty;
            quantityAfter = quantityBefore - recordedQuantity;
        } else if (type == TransactionType.ADJUSTMENT) {
            if (reqQty == null || reqQty < 0) {
                throw new IllegalArgumentException("ADJUSTMENT target stock quantity cannot be negative");
            }
            quantityAfter = reqQty;
            recordedQuantity = Math.abs(quantityAfter - quantityBefore);
        } else {
            throw new IllegalArgumentException("Unsupported transaction type: " + type);
        }

        product.setStockQuantity(quantityAfter);
        productRepository.save(product);

        InventoryTransaction tx = new InventoryTransaction();
        tx.setProduct(product);
        tx.setTransactionType(type);
        tx.setQuantity(recordedQuantity);
        tx.setQuantityBefore(quantityBefore);
        tx.setQuantityAfter(quantityAfter);
        tx.setReason(request.getReason() != null ? request.getReason().trim() : null);
        tx.setReferenceType(request.getReferenceType() != null ? request.getReferenceType().trim() : null);
        tx.setReferenceId(request.getReferenceId() != null ? request.getReferenceId().trim() : null);
        tx.setMovementDate(request.getMovementDate() != null ? request.getMovementDate() : java.time.LocalDate.now());

        InventoryTransaction savedTx = inventoryTransactionRepository.save(tx);
        return InventoryTransactionResponse.fromEntity(savedTx);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryTransactionResponse getTransactionById(Long id) {
        InventoryTransaction tx = inventoryTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory transaction not found with id: " + id));
        return InventoryTransactionResponse.fromEntity(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getTransactionsByProductId(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        List<InventoryTransaction> transactions = inventoryTransactionRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return transactions.stream()
                .map(InventoryTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getTransactions(Long productId,
                                                              TransactionType transactionType,
                                                              LocalDateTime startDate,
                                                              LocalDateTime endDate) {
        List<InventoryTransaction> transactions = inventoryTransactionRepository.findWithFilters(
                productId, transactionType, startDate, endDate
        );
        return transactions.stream()
                .map(InventoryTransactionResponse::fromEntity)
                .toList();
    }
}
