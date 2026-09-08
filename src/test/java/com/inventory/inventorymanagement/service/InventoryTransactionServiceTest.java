package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.InventoryTransactionRequest;
import com.inventory.inventorymanagement.dto.InventoryTransactionResponse;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.InventoryTransactionRepository;
import com.inventory.inventorymanagement.repository.ProductRepository;
import com.inventory.inventorymanagement.service.impl.InventoryTransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryTransactionServiceTest {

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private InventoryTransactionServiceImpl inventoryTransactionService;

    private Category sampleCategory;
    private Brand sampleBrand;
    private Product activeProduct;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        sampleBrand = new Brand(1L, "Sony", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        activeProduct = new Product(
                1L, "Wireless Headphones", "SKU-WH-001", "BARCODE-12345",
                sampleCategory, sampleBrand, "Black", null,
                new BigDecimal("50.00"), new BigDecimal("79.99"),
                20, 5, "https://example.com/image.jpg",
                ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now()
        );

        inactiveProduct = new Product(
                2L, "Old Headphones", "SKU-OLD-001", null,
                sampleCategory, sampleBrand, "Grey", null,
                new BigDecimal("30.00"), new BigDecimal("49.99"),
                10, 2, null,
                ProductStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    void createTransaction_StockIn_Success() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_IN, 10,
                "Supplier restock", "PURCHASE_ORDER", "PO-1001"
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(100L);
            tx.setCreatedAt(LocalDateTime.now());
            return tx;
        });

        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals(1L, response.getProductId());
        assertEquals("Wireless Headphones", response.getProductName());
        assertEquals("SKU-WH-001", response.getProductSku());
        assertEquals(TransactionType.STOCK_IN, response.getTransactionType());
        assertEquals(10, response.getQuantity());
        assertEquals(20, response.getQuantityBefore());
        assertEquals(30, response.getQuantityAfter());
        assertEquals("Supplier restock", response.getReason());
        assertEquals("PURCHASE_ORDER", response.getReferenceType());
        assertEquals("PO-1001", response.getReferenceId());

        assertEquals(30, activeProduct.getStockQuantity());
        verify(productRepository).save(activeProduct);
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void createTransaction_StockOut_Success() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_OUT, 5,
                "Customer order", "SALES_ORDER", "SO-2001"
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(101L);
            tx.setCreatedAt(LocalDateTime.now());
            return tx;
        });

        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);

        assertNotNull(response);
        assertEquals(101L, response.getId());
        assertEquals(TransactionType.STOCK_OUT, response.getTransactionType());
        assertEquals(5, response.getQuantity());
        assertEquals(20, response.getQuantityBefore());
        assertEquals(15, response.getQuantityAfter());
        assertEquals(15, activeProduct.getStockQuantity());

        verify(productRepository).save(activeProduct);
    }

    @Test
    void createTransaction_StockOut_InsufficientStock_ThrowsIllegalArgumentException() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_OUT, 25, // Available is 20
                "Bulk order", "SALES_ORDER", "SO-9999"
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inventoryTransactionService.createTransaction(request));

        assertTrue(exception.getMessage().contains("Insufficient stock for product id: 1"));
        assertTrue(exception.getMessage().contains("Current stock: 20, requested: 25"));
        assertEquals(20, activeProduct.getStockQuantity()); // Remains unchanged
        verify(productRepository, never()).save(any(Product.class));
        verify(inventoryTransactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    void createTransaction_Adjustment_Upwards_Success() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                1L, TransactionType.ADJUSTMENT, 25, // Target count = 25 (was 20)
                "Physical inventory count surplus", "MANUAL_COUNT", "AUDIT-01"
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(102L);
            tx.setCreatedAt(LocalDateTime.now());
            return tx;
        });

        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);

        assertNotNull(response);
        assertEquals(TransactionType.ADJUSTMENT, response.getTransactionType());
        assertEquals(5, response.getQuantity()); // Delta = 25 - 20 = 5
        assertEquals(20, response.getQuantityBefore());
        assertEquals(25, response.getQuantityAfter());
        assertEquals(25, activeProduct.getStockQuantity());

        verify(productRepository).save(activeProduct);
    }

    @Test
    void createTransaction_Adjustment_Downwards_Success() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                1L, TransactionType.ADJUSTMENT, 12, // Target count = 12 (was 20)
                "Found damaged units during audit", "MANUAL_COUNT", "AUDIT-02"
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));
        when(inventoryTransactionRepository.save(any(InventoryTransaction.class))).thenAnswer(invocation -> {
            InventoryTransaction tx = invocation.getArgument(0);
            tx.setId(103L);
            tx.setCreatedAt(LocalDateTime.now());
            return tx;
        });

        InventoryTransactionResponse response = inventoryTransactionService.createTransaction(request);

        assertNotNull(response);
        assertEquals(TransactionType.ADJUSTMENT, response.getTransactionType());
        assertEquals(8, response.getQuantity()); // Delta = |12 - 20| = 8
        assertEquals(20, response.getQuantityBefore());
        assertEquals(12, response.getQuantityAfter());
        assertEquals(12, activeProduct.getStockQuantity());

        verify(productRepository).save(activeProduct);
    }

    @Test
    void createTransaction_ProductNotFound_ThrowsResourceNotFoundException() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                99L, TransactionType.STOCK_IN, 10,
                "Restock", null, null
        );

        when(productRepository.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> inventoryTransactionService.createTransaction(request));

        assertTrue(exception.getMessage().contains("Product not found with id: 99"));
        verify(productRepository, never()).save(any(Product.class));
        verify(inventoryTransactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    void createTransaction_InactiveProduct_ThrowsIllegalArgumentException() {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                2L, TransactionType.STOCK_IN, 10,
                "Restock", null, null
        );

        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(inactiveProduct));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inventoryTransactionService.createTransaction(request));

        assertTrue(exception.getMessage().contains("Cannot perform inventory transaction on inactive product with id: 2"));
        verify(productRepository, never()).save(any(Product.class));
        verify(inventoryTransactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    void createTransaction_StockIn_ZeroOrNegativeQuantity_ThrowsIllegalArgumentException() {
        InventoryTransactionRequest zeroRequest = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_IN, 0, null, null, null
        );
        InventoryTransactionRequest negativeRequest = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_IN, -5, null, null, null
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));

        assertThrows(IllegalArgumentException.class,
                () -> inventoryTransactionService.createTransaction(zeroRequest));

        assertThrows(IllegalArgumentException.class,
                () -> inventoryTransactionService.createTransaction(negativeRequest));

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createTransaction_StockOut_ZeroOrNegativeQuantity_ThrowsIllegalArgumentException() {
        InventoryTransactionRequest zeroRequest = new InventoryTransactionRequest(
                1L, TransactionType.STOCK_OUT, 0, null, null, null
        );

        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct));

        assertThrows(IllegalArgumentException.class,
                () -> inventoryTransactionService.createTransaction(zeroRequest));

        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void getTransactionById_Success() {
        InventoryTransaction tx = new InventoryTransaction(
                50L, activeProduct, TransactionType.STOCK_IN, 10, 0, 10,
                "Initial stock", "INIT", "INIT-1", LocalDateTime.now()
        );

        when(inventoryTransactionRepository.findById(50L)).thenReturn(Optional.of(tx));

        InventoryTransactionResponse response = inventoryTransactionService.getTransactionById(50L);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals("Wireless Headphones", response.getProductName());
    }

    @Test
    void getTransactionById_NotFound_ThrowsResourceNotFoundException() {
        when(inventoryTransactionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> inventoryTransactionService.getTransactionById(999L));
    }

    @Test
    void getTransactionsByProductId_Success() {
        InventoryTransaction tx = new InventoryTransaction(
                50L, activeProduct, TransactionType.STOCK_IN, 10, 0, 10,
                "Initial stock", "INIT", "INIT-1", LocalDateTime.now()
        );

        when(productRepository.existsById(1L)).thenReturn(true);
        when(inventoryTransactionRepository.findByProductIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(tx));

        List<InventoryTransactionResponse> list = inventoryTransactionService.getTransactionsByProductId(1L);

        assertEquals(1, list.size());
        assertEquals(50L, list.get(0).getId());
    }

    @Test
    void getTransactionsByProductId_ProductNotFound_ThrowsResourceNotFoundException() {
        when(productRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> inventoryTransactionService.getTransactionsByProductId(999L));
    }

    @Test
    void getTransactions_WithFilters_Success() {
        InventoryTransaction tx = new InventoryTransaction(
                50L, activeProduct, TransactionType.STOCK_IN, 10, 0, 10,
                "Initial stock", "INIT", "INIT-1", LocalDateTime.now()
        );

        LocalDateTime now = LocalDateTime.now();
        when(inventoryTransactionRepository.findWithFilters(1L, TransactionType.STOCK_IN, now.minusDays(1), now))
                .thenReturn(List.of(tx));

        List<InventoryTransactionResponse> list = inventoryTransactionService.getTransactions(
                1L, TransactionType.STOCK_IN, now.minusDays(1), now
        );

        assertEquals(1, list.size());
        assertEquals(TransactionType.STOCK_IN, list.get(0).getTransactionType());
    }
}
