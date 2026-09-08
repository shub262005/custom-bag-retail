package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.service.impl.PurchaseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PurchaseItemRepository purchaseItemRepository;

    @Mock
    private PurchasePaymentRepository purchasePaymentRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryTransactionService inventoryTransactionService;

    @Mock
    private PurchaseNumberGenerator purchaseNumberGenerator;

    @InjectMocks
    private PurchaseServiceImpl purchaseService;

    private Supplier activeSupplier;
    private Supplier inactiveSupplier;
    private Product activeProduct1;
    private Product activeProduct2;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        activeSupplier = new Supplier(1L, "Safari Bags", "27AAPFU0939F1ZV", "Solapur",
                SupplierStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        inactiveSupplier = new Supplier(2L, "Old Supplier", null, "Pune",
                SupplierStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());

        Category category = new Category(1L, "Bags", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        Brand brand = new Brand(1L, "Skybags", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        activeProduct1 = new Product(10L, "Travel Bag Alpha", "SKU-BAG-001", "BAR-001",
                category, brand, "Blue", "30L", new BigDecimal("500.00"), new BigDecimal("999.00"),
                10, 2, null, ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        activeProduct2 = new Product(20L, "Travel Bag Beta", "SKU-BAG-002", "BAR-002",
                category, brand, "Black", "40L", new BigDecimal("700.00"), new BigDecimal("1299.00"),
                5, 1, null, ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        inactiveProduct = new Product(30L, "Legacy Bag", "SKU-LEG-001", null,
                category, brand, "Red", "20L", new BigDecimal("200.00"), new BigDecimal("499.00"),
                0, 0, null, ProductStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void createPurchase_Success_FullFlow() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.of(2026, 9, 10), "INV-2026-001", LocalDate.of(2026, 9, 8),
                new BigDecimal("10.00"), null, new BigDecimal("5.00"), "First bulk purchase",
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))),
                List.of(new PurchasePaymentRequest(new BigDecimal("1000.00"), PaymentMethod.UPI, "UPI-REF-1", LocalDate.of(2026, 9, 10), "Part payment"))
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseNumberGenerator.generatePurchaseNumber(LocalDate.of(2026, 9, 10))).thenReturn("PUR-2026-000001");
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
            Purchase p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });

        PurchaseResponse response = purchaseService.createPurchase(request);

        assertNotNull(response);
        assertEquals("PUR-2026-000001", response.getPurchaseNumber());
        assertEquals(new BigDecimal("2500.00"), response.getSubtotal()); // 5 * 500 = 2500
        assertEquals(new BigDecimal("10.00"), response.getDiscountPercentage());
        assertEquals(new BigDecimal("250.00"), response.getDiscountAmount()); // 10% of 2500 = 250
        assertEquals(new BigDecimal("112.50"), response.getTaxAmount()); // 5% of 2250 = 112.50
        assertEquals(new BigDecimal("2362.50"), response.getGrandTotal()); // 2250 + 112.50 = 2362.50
        assertEquals(PaymentStatus.PARTIALLY_PAID, response.getPaymentStatus());
        assertEquals(new BigDecimal("1000.00"), response.getTotalPaid());
        assertEquals(new BigDecimal("1362.50"), response.getOutstandingAmount());
        assertEquals(PurchaseStatus.COMPLETED, response.getStatus());

        verify(inventoryTransactionService).createTransaction(argThat(txReq ->
                txReq.getProductId().equals(10L) &&
                txReq.getTransactionType() == TransactionType.STOCK_IN &&
                txReq.getQuantity() == 5 &&
                txReq.getMovementDate().equals(LocalDate.of(2026, 9, 10))
        ));
    }

    @Test
    void createPurchase_SupplierNotFound_ThrowsResourceNotFoundException() {
        PurchaseRequest request = new PurchaseRequest(
                99L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void createPurchase_InactiveSupplier_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                2L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(2L)).thenReturn(Optional.of(inactiveSupplier));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertTrue(ex.getMessage().contains("inactive supplier"));
    }

    @Test
    void createPurchase_ProductNotFound_ThrowsResourceNotFoundException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(999L, 5, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void createPurchase_InactiveProduct_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(30L, 5, new BigDecimal("200.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(30L)).thenReturn(Optional.of(inactiveProduct));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertTrue(ex.getMessage().contains("inactive product"));
    }

    @Test
    void createPurchase_DuplicateProducts_ThrowsDuplicateResourceException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00")),
                        new PurchaseItemRequest(10L, 2, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));

        assertThrows(DuplicateResourceException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void createPurchase_EmptyItems_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));

        assertThrows(IllegalArgumentException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void createPurchase_ZeroPriceAllowed_Success() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, "Promotional sample",
                List.of(new PurchaseItemRequest(10L, 3, BigDecimal.ZERO)), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseNumberGenerator.generatePurchaseNumber(any())).thenReturn("PUR-2026-000002");
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseResponse response = purchaseService.createPurchase(request);

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO.setScale(2), response.getSubtotal());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getGrandTotal());
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus());
    }

    @Test
    void createPurchase_NegativePrice_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 3, new BigDecimal("-50.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        assertThrows(IllegalArgumentException.class, () -> purchaseService.createPurchase(request));
    }

    @Test
    void createPurchase_ZeroOrNegativeQuantity_ThrowsIllegalArgumentException() {
        PurchaseRequest zeroReq = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 0, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        assertThrows(IllegalArgumentException.class, () -> purchaseService.createPurchase(zeroReq));
    }

    @Test
    void createPurchase_PaymentExceedingGrandTotal_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 1, new BigDecimal("100.00"))),
                List.of(new PurchasePaymentRequest(new BigDecimal("150.00"), PaymentMethod.CASH, null, LocalDate.now(), null))
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertTrue(ex.getMessage().contains("cannot exceed purchase grand total"));
    }

    @Test
    void updatePurchase_Success_IncreaseStock() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), "INV-1", null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 2, new BigDecimal("500.00"), new BigDecimal("1000.00")));

        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), "INV-1", null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), // Quantity increased from 2 to 5 -> +3
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchaseResponse response = purchaseService.updatePurchase(1L, updateRequest);

        assertNotNull(response);
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getTransactionType() == TransactionType.STOCK_IN &&
                tx.getQuantity() == 3
        ));
    }

    @Test
    void updatePurchase_Success_DecreaseStock() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), "INV-1", null,
                new BigDecimal("2500.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("2500.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 5, new BigDecimal("500.00"), new BigDecimal("2500.00")));

        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), "INV-1", null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 2, new BigDecimal("500.00"))), // Quantity decreased from 5 to 2 -> -3
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1)); // current stock = 10
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchaseResponse response = purchaseService.updatePurchase(1L, updateRequest);

        assertNotNull(response);
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getTransactionType() == TransactionType.STOCK_OUT &&
                tx.getQuantity() == 3
        ));
    }

    @Test
    void updatePurchase_InsufficientStockForDecrease_ThrowsIllegalArgumentException() {
        activeProduct1.setStockQuantity(2); // Only 2 in stock!

        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("2500.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("2500.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 5, new BigDecimal("500.00"), new BigDecimal("2500.00")));

        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 1, new BigDecimal("500.00"))), // Reduction requires 4, but stock is 2
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.updatePurchase(1L, updateRequest));
        assertTrue(ex.getMessage().contains("Insufficient stock"));
        verify(inventoryTransactionService, never()).createTransaction(any());
    }

    @Test
    void updatePurchase_GrandTotalBelowPaidAmount_ThrowsIllegalArgumentException() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("2000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("2000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 4, new BigDecimal("500.00"), new BigDecimal("2000.00")));
        existingPurchase.addPayment(new PurchasePayment(new BigDecimal("1500.00"), PaymentMethod.CASH, null, LocalDate.now(), null));

        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 2, new BigDecimal("500.00"))), // New total = 1000, but 1500 paid!
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.updatePurchase(1L, updateRequest));
        assertTrue(ex.getMessage().contains("cannot be less than total amount already paid"));
    }

    @Test
    void cancelPurchase_Success_ReversesStock() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 5, new BigDecimal("200.00"), new BigDecimal("1000.00")));

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1)); // Stock is 10
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchaseResponse response = purchaseService.cancelPurchase(1L);

        assertNotNull(response);
        assertEquals(PurchaseStatus.CANCELLED, response.getStatus());
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getTransactionType() == TransactionType.STOCK_OUT &&
                tx.getQuantity() == 5 &&
                tx.getReferenceType().equals("PURCHASE_CANCEL")
        ));
    }

    @Test
    void cancelPurchase_InsufficientStock_ThrowsIllegalArgumentException() {
        activeProduct1.setStockQuantity(2); // Only 2 in stock, but purchase had 5!

        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(activeProduct1, 5, new BigDecimal("200.00"), new BigDecimal("1000.00")));

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.cancelPurchase(1L));
        assertTrue(ex.getMessage().contains("Insufficient stock to cancel purchase"));
        verify(inventoryTransactionService, never()).createTransaction(any());
    }

    @Test
    void cancelPurchase_AlreadyCancelled_ThrowsIllegalArgumentException() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.CANCELLED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));

        assertThrows(IllegalArgumentException.class, () -> purchaseService.cancelPurchase(1L));
    }

    @Test
    void addPayment_Success_UpdatesPaymentStatus() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchasePaymentRequest req = new PurchasePaymentRequest(
                new BigDecimal("1000.00"), PaymentMethod.CASH, null, LocalDate.now(), "Full payment"
        );

        PurchaseResponse response = purchaseService.addPayment(1L, req);

        assertNotNull(response);
        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
        assertEquals(new BigDecimal("1000.00"), response.getTotalPaid());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getOutstandingAmount());
    }

    @Test
    void addPayment_ExceedingGrandTotal_ThrowsIllegalArgumentException() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("500.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("500.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));

        PurchasePaymentRequest req = new PurchasePaymentRequest(
                new BigDecimal("600.00"), PaymentMethod.CASH, null, LocalDate.now(), null
        );

        assertThrows(IllegalArgumentException.class, () -> purchaseService.addPayment(1L, req));
    }

    @Test
    void deletePayment_Success_RecalculatesPaymentStatus() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        PurchasePayment payment = new PurchasePayment(10L, existingPurchase, new BigDecimal("500.00"),
                PaymentMethod.CASH, null, LocalDate.now(), null, LocalDateTime.now(), LocalDateTime.now());
        existingPurchase.addPayment(payment);

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchaseResponse response = purchaseService.deletePayment(1L, 10L);

        assertNotNull(response);
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getTotalPaid());
    }

    @Test
    void updatePayment_Success_RecalculatesPaymentStatus() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        PurchasePayment payment = new PurchasePayment(10L, existingPurchase, new BigDecimal("400.00"),
                PaymentMethod.CASH, null, LocalDate.now(), null, LocalDateTime.now(), LocalDateTime.now());
        existingPurchase.addPayment(payment);

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(purchaseRepository.save(any(Purchase.class))).thenReturn(existingPurchase);

        PurchasePaymentRequest updateReq = new PurchasePaymentRequest(
                new BigDecimal("1000.00"), PaymentMethod.BANK_TRANSFER, "TXN-1", LocalDate.now(), "Full payment"
        );

        PurchaseResponse response = purchaseService.updatePayment(1L, 10L, updateReq);

        assertNotNull(response);
        assertEquals(PaymentStatus.PAID, response.getPaymentStatus());
        assertEquals(new BigDecimal("1000.00"), response.getTotalPaid());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getOutstandingAmount());
    }

    @Test
    void createPurchase_FutureDated_StockUpdatedImmediately() {
        LocalDate futureDate = LocalDate.now().plusDays(10);
        PurchaseRequest request = new PurchaseRequest(
                1L, futureDate, null, null, null, null, null, "Future stock arrival",
                List.of(new PurchaseItemRequest(10L, 8, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseNumberGenerator.generatePurchaseNumber(futureDate)).thenReturn("PUR-2026-000005");
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseResponse response = purchaseService.createPurchase(request);

        assertNotNull(response);
        assertEquals(futureDate, response.getPurchaseDate());
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getMovementDate().equals(futureDate) &&
                tx.getTransactionType() == TransactionType.STOCK_IN &&
                tx.getQuantity() == 8
        ));
    }

    @Test
    void createPurchase_Backdated_MovementDateEqualsPurchaseDate() {
        LocalDate pastDate = LocalDate.of(2026, 8, 1);
        PurchaseRequest request = new PurchaseRequest(
                1L, pastDate, null, null, null, null, null, "Backdated stock entry",
                List.of(new PurchaseItemRequest(10L, 4, new BigDecimal("500.00"))), null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseNumberGenerator.generatePurchaseNumber(pastDate)).thenReturn("PUR-2026-000006");
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseResponse response = purchaseService.createPurchase(request);

        assertNotNull(response);
        assertEquals(pastDate, response.getPurchaseDate());
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getMovementDate().equals(pastDate) &&
                tx.getTransactionType() == TransactionType.STOCK_IN &&
                tx.getQuantity() == 4
        ));
    }

    @Test
    void getPurchases_WithFilters_ReturnsList() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(purchaseRepository.findWithFilters(1L, PurchaseStatus.COMPLETED, null, null, "Safari"))
                .thenReturn(List.of(existingPurchase));

        List<PurchaseResponse> responses = purchaseService.getPurchases(1L, PurchaseStatus.COMPLETED, null, null, "Safari");

        assertEquals(1, responses.size());
        assertEquals("PUR-2026-000001", responses.get(0).getPurchaseNumber());
    }

    @Test
    void getPurchaseByNumber_Success() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("1000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("1000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(purchaseRepository.findByPurchaseNumber("PUR-2026-000001")).thenReturn(Optional.of(existingPurchase));

        PurchaseResponse response = purchaseService.getPurchaseByNumber("PUR-2026-000001");

        assertNotNull(response);
        assertEquals("PUR-2026-000001", response.getPurchaseNumber());
    }

    @Test
    void createPurchase_TransactionFailure_RollbackSimulated() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), "INV-FAIL", LocalDate.now(),
                null, null, null, "Rollback test",
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00")),
                        new PurchaseItemRequest(20L, 3, new BigDecimal("700.00"))),
                null
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(activeProduct2));
        when(purchaseNumberGenerator.generatePurchaseNumber(any())).thenReturn("PUR-2026-000099");
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryTransactionService.createTransaction(any()))
                .thenThrow(new RuntimeException("Database error during inventory transaction"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> purchaseService.createPurchase(request));
        assertEquals("Database error during inventory transaction", ex.getMessage());

        // Verify only 1 attempt was made before failure halted the process
        verify(inventoryTransactionService, times(1)).createTransaction(any());
        // Verify product price was never updated because transaction failed before completion
        verify(productRepository, never()).save(argThat(p -> p.getLastPurchasePrice() != null));
    }

    @Test
    void cancelPurchase_LastPurchasePriceFallback_Success() {
        // Purchase P1 (earlier: 2026-09-01, price: 100.00)
        Purchase purchase1 = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.of(2026, 9, 1), null, null,
                new BigDecimal("500.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("500.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        PurchaseItem item1 = new PurchaseItem(101L, purchase1, activeProduct1, 5, new BigDecimal("100.00"), new BigDecimal("500.00"));
        purchase1.addItem(item1);

        // Purchase P2 (later: 2026-09-05, price: 150.00)
        Purchase purchase2 = new Purchase(
                2L, "PUR-2026-000002", activeSupplier, LocalDate.of(2026, 9, 5), null, null,
                new BigDecimal("450.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("450.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        PurchaseItem item2 = new PurchaseItem(102L, purchase2, activeProduct1, 3, new BigDecimal("150.00"), new BigDecimal("450.00"));
        purchase2.addItem(item2);

        // Before cancellation, Product 10's last purchase price is 150.00
        activeProduct1.setLastPurchasePrice(new BigDecimal("150.00"));

        when(purchaseRepository.findById(2L)).thenReturn(Optional.of(purchase2));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(inv -> inv.getArgument(0));

        // When P2 is cancelled, query for COMPLETED purchases now returns only P1's price (100.00)
        when(purchaseItemRepository.findCompletedPurchasePricesOrderByDateDesc(10L, PurchaseStatus.COMPLETED))
                .thenReturn(List.of(new BigDecimal("100.00")));

        PurchaseResponse response = purchaseService.cancelPurchase(2L);

        assertNotNull(response);
        assertEquals(PurchaseStatus.CANCELLED, response.getStatus());

        // P2 becomes CANCELLED, P1 remains COMPLETED
        assertEquals(PurchaseStatus.CANCELLED, purchase2.getStatus());
        assertEquals(PurchaseStatus.COMPLETED, purchase1.getStatus());

        // Historical item prices remain intact
        assertEquals(new BigDecimal("100.00"), item1.getPurchasePrice());
        assertEquals(new BigDecimal("150.00"), item2.getPurchasePrice());

        // Product lastPurchasePrice fell back to 100.00
        assertEquals(new BigDecimal("100.00"), activeProduct1.getLastPurchasePrice());

        // Reverse transaction created for P2's 3 items
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getProductId().equals(10L) &&
                tx.getTransactionType() == TransactionType.STOCK_OUT &&
                tx.getQuantity() == 3 &&
                tx.getReferenceType().equals("PURCHASE_CANCEL")
        ));
    }

    @Test
    void updatePurchase_ItemRemovalAndAddition_Success() {
        Category category = activeProduct1.getCategory();
        Brand brand = activeProduct1.getBrand();
        Product activeProduct3 = new Product(40L, "Travel Bag Gamma", "SKU-BAG-003", "BAR-003",
                category, brand, "Green", "50L", new BigDecimal("800.00"), new BigDecimal("1499.00"),
                15, 2, null, ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        // Initial Purchase: Product A (10L) qty 10, Product B (20L) qty 5
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("6000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("6000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(1L, existingPurchase, activeProduct1, 10, new BigDecimal("500.00"), new BigDecimal("5000.00")));
        existingPurchase.addItem(new PurchaseItem(2L, existingPurchase, activeProduct2, 5, new BigDecimal("200.00"), new BigDecimal("1000.00")));

        // Update Request: Product A (10L) qty 10 (unchanged), Product C (40L) qty 7 (added), Product B (removed)
        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(
                        new PurchaseItemRequest(10L, 10, new BigDecimal("500.00")),
                        new PurchaseItemRequest(40L, 7, new BigDecimal("800.00"))
                ),
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(activeProduct2));
        when(productRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(activeProduct3));
        when(purchaseRepository.save(any(Purchase.class))).thenAnswer(inv -> inv.getArgument(0));

        PurchaseResponse response = purchaseService.updatePurchase(1L, updateRequest);

        assertNotNull(response);
        assertEquals(2, response.getItems().size());

        // Product B (20L): removed -> STOCK_OUT 5
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getProductId().equals(20L) &&
                tx.getTransactionType() == TransactionType.STOCK_OUT &&
                tx.getQuantity() == 5
        ));

        // Product C (40L): added -> STOCK_IN 7
        verify(inventoryTransactionService).createTransaction(argThat(tx ->
                tx.getProductId().equals(40L) &&
                tx.getTransactionType() == TransactionType.STOCK_IN &&
                tx.getQuantity() == 7
        ));

        // Product A (10L): unchanged -> NO inventory movement
        verify(inventoryTransactionService, never()).createTransaction(argThat(tx ->
                tx.getProductId().equals(10L)
        ));
    }

    @Test
    void createPurchase_DiscountConflict_BothProvided_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null,
                new BigDecimal("10.00"), new BigDecimal("100.00"), null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertEquals("Cannot provide both discount percentage and discount amount. Please provide only one.", ex.getMessage());

        verify(purchaseRepository, never()).save(any());
        verify(inventoryTransactionService, never()).createTransaction(any());
    }

    @Test
    void createPurchase_DiscountConflict_PercentageAndZeroAmount_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null,
                new BigDecimal("10.00"), BigDecimal.ZERO, null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertEquals("Cannot provide both discount percentage and discount amount. Please provide only one.", ex.getMessage());

        verify(purchaseRepository, never()).save(any());
        verify(inventoryTransactionService, never()).createTransaction(any());
    }

    @Test
    void createPurchase_DiscountConflict_ZeroPercentageAndAmount_ThrowsIllegalArgumentException() {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null,
                BigDecimal.ZERO, new BigDecimal("500.00"), null, null,
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))), null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.createPurchase(request));
        assertEquals("Cannot provide both discount percentage and discount amount. Please provide only one.", ex.getMessage());

        verify(purchaseRepository, never()).save(any());
        verify(inventoryTransactionService, never()).createTransaction(any());
    }

    @Test
    void updatePurchase_PaymentExceedsNewGrandTotal_Detailed_ThrowsIllegalArgumentException() {
        Purchase existingPurchase = new Purchase(
                1L, "PUR-2026-000001", activeSupplier, LocalDate.now(), null, null,
                new BigDecimal("2000.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("2000.00"), PurchaseStatus.COMPLETED, null,
                LocalDateTime.now(), LocalDateTime.now()
        );
        existingPurchase.addItem(new PurchaseItem(1L, existingPurchase, activeProduct1, 4, new BigDecimal("500.00"), new BigDecimal("2000.00")));
        existingPurchase.addPayment(new PurchasePayment(1L, existingPurchase, new BigDecimal("1500.00"), PaymentMethod.CASH, null, LocalDate.now(), null, LocalDateTime.now(), LocalDateTime.now()));

        PurchaseRequest updateRequest = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 2, new BigDecimal("500.00"))),
                null
        );

        when(purchaseRepository.findById(1L)).thenReturn(Optional.of(existingPurchase));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(activeSupplier));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(activeProduct1));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> purchaseService.updatePurchase(1L, updateRequest));
        assertTrue(ex.getMessage().contains("cannot be less than total amount already paid"));

        // Verify purchase and inventory are completely unchanged
        assertEquals(new BigDecimal("2000.00"), existingPurchase.getGrandTotal());
        assertEquals(1, existingPurchase.getItems().size());
        assertEquals(4, existingPurchase.getItems().get(0).getQuantity());
        assertEquals(1, existingPurchase.getPayments().size());
        verify(purchaseRepository, never()).save(any());
        verify(inventoryTransactionService, never()).createTransaction(any());
    }
}
