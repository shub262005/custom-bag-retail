package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.service.impl.SaleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

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
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private SaleItemRepository saleItemRepository;

    @Mock
    private SalePaymentRepository salePaymentRepository;

    @Mock
    private SaleAuditHistoryRepository saleAuditHistoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private SaleNumberGenerator saleNumberGenerator;

    @InjectMocks
    private SaleServiceImpl saleService;

    private Product activeProduct1;
    private Product activeProduct2;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        Category category = new Category(1L, "Backpacks", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        Brand brand = new Brand(1L, "Skybags", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        activeProduct1 = new Product(1L, "School Bag Alpha", "SKU-001", "111111", category, brand,
                "Blue", "30L", new BigDecimal("500.00"), new BigDecimal("1000.00"), 10, 2, null,
                ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        activeProduct2 = new Product(2L, "Travel Bag Beta", "SKU-002", "222222", category, brand,
                "Black", "45L", new BigDecimal("800.00"), new BigDecimal("1500.00"), 5, 1, null,
                ProductStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        inactiveProduct = new Product(3L, "Old Bag Gamma", "SKU-003", "333333", category, brand,
                "Red", "20L", new BigDecimal("300.00"), new BigDecimal("600.00"), 8, 1, null,
                ProductStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());
    }

    // ==========================================
    // 1. SALE CREATION TESTS
    // ==========================================

    @Test
    void createSale_SuccessfulMultiItem() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(activeProduct2));
        when(saleNumberGenerator.generateSaleNumber(any())).thenReturn("SAL-2026-000001");
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> {
            Sale s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(
                        new SaleItemRequest(1L, 2, new BigDecimal("1000.00")),
                        new SaleItemRequest(2L, 1, new BigDecimal("1500.00"))
                ),
                null, null, PaymentMethod.UPI, "GPay"
        );

        SaleResponse response = saleService.createSale(request);

        assertNotNull(response);
        assertEquals("SAL-2026-000001", response.getSaleNumber());
        assertEquals(new BigDecimal("3500.00"), response.getGrandTotal());
        assertEquals(SaleStatus.COMPLETED, response.getStatus());
        assertEquals(8, activeProduct1.getStockQuantity());
        assertEquals(4, activeProduct2.getStockQuantity());

        verify(inventoryTransactionRepository, times(2)).save(any(InventoryTransaction.class));
        verify(saleAuditHistoryRepository).save(any(SaleAuditHistory.class));
    }

    @Test
    void createSale_InsufficientStock_RejectsEntireSale() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(activeProduct2));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(
                        new SaleItemRequest(1L, 2, new BigDecimal("1000.00")),
                        new SaleItemRequest(2L, 10, new BigDecimal("1500.00")) // stock is 5
                ),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Insufficient stock for product id: 2"));

        assertEquals(10, activeProduct1.getStockQuantity());
        verify(inventoryTransactionRepository, never()).save(any());
        verify(saleRepository, never()).save(any());
    }

    @Test
    void createSale_InactiveProduct_Rejected() {
        when(productRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(inactiveProduct));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(3L, 1, new BigDecimal("600.00"))),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Cannot add inactive product"));
    }

    @Test
    void createSale_DuplicateSamePrice_Merged() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleNumberGenerator.generateSaleNumber(any())).thenReturn("SAL-2026-000002");
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(
                        new SaleItemRequest(1L, 2, new BigDecimal("1000.00")),
                        new SaleItemRequest(1L, 3, new BigDecimal("1000.00"))
                ),
                null, null, PaymentMethod.CASH, null
        );

        SaleResponse response = saleService.createSale(request);

        assertEquals(1, response.getItems().size());
        assertEquals(5, response.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("5000.00"), response.getGrandTotal());
        assertEquals(5, activeProduct1.getStockQuantity());
    }

    @Test
    void createSale_DuplicateDifferentPrice_Rejected() {
        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(
                        new SaleItemRequest(1L, 2, new BigDecimal("1000.00")),
                        new SaleItemRequest(1L, 3, new BigDecimal("1200.00"))
                ),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("different selling prices is not allowed"));
    }

    @Test
    void createSale_InvalidQuantity_Rejected() {
        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 0, new BigDecimal("1000.00"))),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Item quantity must be at least 1"));
    }

    @Test
    void createSale_InvalidSellingPrice_Rejected() {
        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("-10.00"))),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Selling price cannot be negative"));
    }

    @Test
    void createSale_BothDiscountsSupplied_Rejected() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                new BigDecimal("10.00"), new BigDecimal("100.00"), PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Cannot provide both discount percentage and discount amount"));
    }

    @Test
    void createSale_DiscountGreaterThanSubtotal_Rejected() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                null, new BigDecimal("1500.00"), PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Discount amount cannot exceed subtotal"));
    }

    @Test
    void createSale_100PercentDiscount_ProducesZeroTotal() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleNumberGenerator.generateSaleNumber(any())).thenReturn("SAL-2026-000003");
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                new BigDecimal("100.00"), null, null, null // Payment method not required for ₹0
        );

        SaleResponse response = saleService.createSale(request);

        assertEquals(new BigDecimal("0.00"), response.getGrandTotal());
        assertEquals(new BigDecimal("0.00"), response.getPayment().getAmount());
        assertNull(response.getPayment().getPaymentMethod());
    }

    @Test
    void createSale_FutureSaleDate_Rejected() {
        SaleRequest request = new SaleRequest(
                LocalDate.now().plusDays(1),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                null, null, PaymentMethod.CASH, null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Sale date cannot be in the future"));
    }

    @Test
    void createSale_MissingPaymentMethod_WhenTotalPositive_Rejected() {
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));

        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                null, null, null, null // Missing payment method
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Payment method is required"));
    }

    // ==========================================
    // 2. SALE EDITING TESTS
    // ==========================================

    @Test
    void updateSale_QuantityIncrease_DeductsDifference() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("2000.00"));
        existingSale.setSubtotal(new BigDecimal("2000.00"));
        existingSale.addItem(new SaleItem(activeProduct1, 2, new BigDecimal("1000.00"), new BigDecimal("2000.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("2000.00"), PaymentMethod.UPI, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Edit: Quantity 2 -> 5 (delta +3, activeProduct1 has stock 10)
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 5, new BigDecimal("1000.00"))),
                null, null, PaymentMethod.CASH, "Updated payment", true
        );

        SaleResponse response = saleService.updateSale(100L, request);

        assertEquals(new BigDecimal("5000.00"), response.getGrandTotal());
        assertEquals(7, activeProduct1.getStockQuantity()); // 10 - 3 = 7
        assertEquals(new BigDecimal("5000.00"), response.getPayment().getAmount());
        assertEquals(PaymentMethod.CASH, response.getPayment().getPaymentMethod());

        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(inventoryTransactionRepository).save(captor.capture());
        assertEquals(TransactionType.STOCK_OUT, captor.getValue().getTransactionType());
        assertEquals(3, captor.getValue().getQuantity());
    }

    @Test
    void updateSale_QuantityDecrease_RestoresDifference() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("5000.00"));
        existingSale.setSubtotal(new BigDecimal("5000.00"));
        existingSale.addItem(new SaleItem(activeProduct1, 5, new BigDecimal("1000.00"), new BigDecimal("5000.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("5000.00"), PaymentMethod.UPI, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Edit: Quantity 5 -> 2 (delta -3)
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 2, new BigDecimal("1000.00"))),
                null, null, null, null, true // reducePayment = true
        );

        SaleResponse response = saleService.updateSale(100L, request);

        assertEquals(new BigDecimal("2000.00"), response.getGrandTotal());
        assertEquals(13, activeProduct1.getStockQuantity()); // 10 + 3 = 13
        assertEquals(new BigDecimal("2000.00"), response.getPayment().getAmount());

        ArgumentCaptor<InventoryTransaction> captor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(inventoryTransactionRepository).save(captor.capture());
        assertEquals(TransactionType.STOCK_IN, captor.getValue().getTransactionType());
        assertEquals(3, captor.getValue().getQuantity());
    }

    @Test
    void updateSale_QuantityDecrease_KeepPaymentOption() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("2000.00"));
        existingSale.setSubtotal(new BigDecimal("2000.00"));
        existingSale.addItem(new SaleItem(activeProduct1, 2, new BigDecimal("1000.00"), new BigDecimal("2000.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("2000.00"), PaymentMethod.UPI, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Total decreases from 2000 to 1700, user chooses keep payment (reducePayment = false)
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1700.00"))),
                null, null, null, null, false // retain payment
        );

        SaleResponse response = saleService.updateSale(100L, request);

        assertEquals(new BigDecimal("1700.00"), response.getGrandTotal());
        assertEquals(new BigDecimal("2000.00"), response.getPayment().getAmount()); // retained!
    }

    @Test
    void updateSale_ItemRemoval_RestoresStock() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("2500.00"));
        existingSale.setSubtotal(new BigDecimal("2500.00"));
        existingSale.addItem(new SaleItem(activeProduct1, 1, new BigDecimal("1000.00"), new BigDecimal("1000.00")));
        existingSale.addItem(new SaleItem(activeProduct2, 1, new BigDecimal("1500.00"), new BigDecimal("1500.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("2500.00"), PaymentMethod.UPI, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(activeProduct2));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Remove activeProduct2 completely
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))),
                null, null, null, null, true
        );

        SaleResponse response = saleService.updateSale(100L, request);

        assertEquals(1, response.getItems().size());
        assertEquals(6, activeProduct2.getStockQuantity()); // 5 + 1 = 6
    }

    @Test
    void updateSale_ExistingInactiveProduct_CanBeEdited() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("1200.00"));
        existingSale.setSubtotal(new BigDecimal("1200.00"));
        existingSale.addItem(new SaleItem(inactiveProduct, 2, new BigDecimal("600.00"), new BigDecimal("1200.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("1200.00"), PaymentMethod.CASH, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(inactiveProduct));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Existing inactive product quantity changed from 2 to 1 (delta -1, restores stock)
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(3L, 1, new BigDecimal("600.00"))),
                null, null, null, null, true
        );

        SaleResponse response = saleService.updateSale(100L, request);

        assertEquals(1, response.getItems().size());
        assertEquals(9, inactiveProduct.getStockQuantity()); // 8 + 1 = 9
    }

    @Test
    void updateSale_AddNewInactiveProduct_Rejected() {
        Sale existingSale = new Sale();
        existingSale.setId(100L);
        existingSale.setSaleNumber("SAL-2026-000100");
        existingSale.setSaleDate(LocalDate.now());
        existingSale.setStatus(SaleStatus.COMPLETED);
        existingSale.setGrandTotal(new BigDecimal("1000.00"));
        existingSale.setSubtotal(new BigDecimal("1000.00"));
        existingSale.addItem(new SaleItem(activeProduct1, 1, new BigDecimal("1000.00"), new BigDecimal("1000.00")));
        existingSale.setPayment(new SalePayment(new BigDecimal("1000.00"), PaymentMethod.CASH, null));

        when(saleRepository.findById(100L)).thenReturn(Optional.of(existingSale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(productRepository.findByIdForUpdate(3L)).thenReturn(Optional.of(inactiveProduct));

        // Adding inactiveProduct (id 3) which was NOT in existingSale
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(
                        new SaleItemRequest(1L, 1, new BigDecimal("1000.00")),
                        new SaleItemRequest(3L, 1, new BigDecimal("600.00"))
                ),
                null, null, null, null, true
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.updateSale(100L, request));
        assertTrue(ex.getMessage().contains("Cannot add inactive product id 3"));
    }

    @Test
    void updateSale_CancelledSale_Rejected() {
        Sale cancelledSale = new Sale();
        cancelledSale.setId(200L);
        cancelledSale.setStatus(SaleStatus.CANCELLED);

        when(saleRepository.findById(200L)).thenReturn(Optional.of(cancelledSale));

        SaleEditRequest request = new SaleEditRequest();
        request.setItems(List.of(new SaleItemRequest(1L, 1, new BigDecimal("1000.00"))));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.updateSale(200L, request));
        assertTrue(ex.getMessage().contains("Cannot edit a cancelled sale"));
    }

    // ==========================================
    // 3. CANCELLATION TESTS
    // ==========================================

    @Test
    void cancelSale_SuccessfulRestoration_EvenWhenStockLow() {
        Sale sale = new Sale();
        sale.setId(300L);
        sale.setSaleNumber("SAL-2026-000300");
        sale.setStatus(SaleStatus.COMPLETED);
        sale.addItem(new SaleItem(activeProduct1, 5, new BigDecimal("1000.00"), new BigDecimal("5000.00")));
        activeProduct1.setStockQuantity(2); // Current stock is 2 (less than 5 sold)

        when(saleRepository.findById(300L)).thenReturn(Optional.of(sale));
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(activeProduct1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        SaleCancelRequest request = new SaleCancelRequest(CancellationReason.CUSTOMER_RETURNED_ITEM, "Damaged zip");

        SaleResponse response = saleService.cancelSale(300L, request);

        assertEquals(SaleStatus.CANCELLED, response.getStatus());
        assertEquals(CancellationReason.CUSTOMER_RETURNED_ITEM, response.getCancellationReason());
        assertEquals("Damaged zip", response.getCancellationDescription());
        assertEquals(7, activeProduct1.getStockQuantity()); // 2 + 5 = 7!

        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
        verify(saleAuditHistoryRepository).save(any(SaleAuditHistory.class));
    }

    @Test
    void cancelSale_AlreadyCancelled_Rejected() {
        Sale sale = new Sale();
        sale.setId(300L);
        sale.setStatus(SaleStatus.CANCELLED);

        when(saleRepository.findById(300L)).thenReturn(Optional.of(sale));

        SaleCancelRequest request = new SaleCancelRequest(CancellationReason.DUPLICATE_SALE, null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.cancelSale(300L, request));
        assertTrue(ex.getMessage().contains("Sale is already cancelled"));
    }

    @Test
    void cancelSale_MissingReason_Rejected() {
        Sale sale = new Sale();
        sale.setId(300L);
        sale.setStatus(SaleStatus.COMPLETED);

        when(saleRepository.findById(300L)).thenReturn(Optional.of(sale));

        SaleCancelRequest request = new SaleCancelRequest(null, null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> saleService.cancelSale(300L, request));
        assertTrue(ex.getMessage().contains("Cancellation reason is required"));
    }

    // ==========================================
    // 4. REPORTS & DASHBOARD TESTS
    // ==========================================

    @Test
    void getDailySalesReport_ReturnsCorrectAggregates() {
        LocalDate today = LocalDate.now();
        when(saleRepository.getDailySalesMetrics(today)).thenReturn(List.<Object[]>of(new Object[]{5L, new BigDecimal("12500.00")}));

        DailySalesReportResponse response = saleService.getDailySalesReport(today);

        assertEquals(today, response.getDate());
        assertEquals(5L, response.getTotalSalesCount());
        assertEquals(new BigDecimal("12500.00"), response.getTotalSalesAmount());
    }

    @Test
    void getSalesDashboard_ReturnsTodayMetrics() {
        LocalDate today = LocalDate.now();
        when(saleRepository.getDailySalesMetrics(today)).thenReturn(List.<Object[]>of(new Object[]{3L, new BigDecimal("8000.00")}));
        when(saleRepository.countCancelledSalesByDate(today)).thenReturn(1L);
        when(saleRepository.getSalesByPaymentMethod(today, today)).thenReturn(List.<Object[]>of(
                new Object[]{PaymentMethod.UPI, 2L, new BigDecimal("6000.00")},
                new Object[]{PaymentMethod.CASH, 1L, new BigDecimal("2000.00")}
        ));
        when(saleItemRepository.getTopSellingProducts(eq(today), any(PageRequest.class))).thenReturn(List.<Object[]>of(
                new Object[]{1L, "School Bag Alpha", "SKU-001", 5L, new BigDecimal("5000.00")}
        ));

        SalesDashboardResponse response = saleService.getSalesDashboard(today);

        assertNotNull(response);
        assertEquals(today, response.getDate());
        assertEquals(3L, response.getTodayCompletedSalesCount());
        assertEquals(new BigDecimal("8000.00"), response.getTodayCompletedSalesAmount());
        assertEquals(1L, response.getTodayCancelledSalesCount());
        assertEquals(2, response.getSalesByPaymentMethod().size());
        assertEquals(1, response.getTopSellingProducts().size());
    }

    @Test
    void getSalesByCategory_ReturnsCorrectData() {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();
        when(saleItemRepository.getSalesByCategory(start, end)).thenReturn(List.<Object[]>of(
                new Object[]{1L, "Backpacks", 10L, new BigDecimal("8500.00")}
        ));

        List<CategorySalesReportResponse> response = saleService.getSalesByCategory(start, end);

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(1L, response.get(0).getCategoryId());
        assertEquals("Backpacks", response.get(0).getCategoryName());
        assertEquals(10L, response.get(0).getQuantitySold());
        assertEquals(new BigDecimal("8500.00"), response.get(0).getSalesAmount());
    }

    @Test
    void getSalesByProduct_ReturnsCorrectData() {
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();
        when(saleItemRepository.getSalesByProduct(start, end)).thenReturn(List.<Object[]>of(
                new Object[]{1L, "School Bag Alpha", "SKU-001", 5L, new BigDecimal("5000.00")}
        ));

        List<ProductSalesReportResponse> response = saleService.getSalesByProduct(start, end);

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(1L, response.get(0).getProductId());
        assertEquals("School Bag Alpha", response.get(0).getProductName());
        assertEquals("SKU-001", response.get(0).getSku());
        assertEquals(5L, response.get(0).getQuantitySold());
        assertEquals(new BigDecimal("5000.00"), response.get(0).getSalesAmount());
    }

    @Test
    void getDateRangeSalesReport_ReturnsBreakdown() {
        LocalDate start = LocalDate.now().minusDays(2);
        LocalDate end = LocalDate.now();
        when(saleRepository.getDateRangeSalesBreakdown(start, end)).thenReturn(List.<Object[]>of(
                new Object[]{start, 2L, new BigDecimal("3000.00")},
                new Object[]{end, 3L, new BigDecimal("5000.00")}
        ));

        DateRangeSalesReportResponse response = saleService.getDateRangeSalesReport(start, end);

        assertNotNull(response);
        assertEquals(start, response.getStartDate());
        assertEquals(end, response.getEndDate());
        assertEquals(5L, response.getTotalSalesCount());
        assertEquals(new BigDecimal("8000.00"), response.getTotalSalesAmount());
        assertEquals(2, response.getDailyBreakdown().size());
    }

    @Test
    void getCancelledSalesReport_ReturnsCancelledList() {
        Sale cancelled = new Sale();
        cancelled.setId(400L);
        cancelled.setSaleNumber("SAL-2026-000400");
        cancelled.setSaleDate(LocalDate.now());
        cancelled.setStatus(SaleStatus.CANCELLED);
        cancelled.setCancellationReason(CancellationReason.WRONG_SALE_ENTRY);
        cancelled.setGrandTotal(new BigDecimal("2000.00"));

        when(saleRepository.findCancelledSales(null, null)).thenReturn(List.of(cancelled));

        List<CancelledSalesReportResponse> response = saleService.getCancelledSalesReport(null, null);

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("SAL-2026-000400", response.get(0).getSaleNumber());
        assertEquals(CancellationReason.WRONG_SALE_ENTRY, response.get(0).getCancellationReason());
    }

    @Test
    void getSaleInventoryTransactions_ReturnsTxList() {
        Sale sale = new Sale();
        sale.setId(500L);
        sale.setSaleNumber("SAL-2026-000500");

        when(saleRepository.findById(500L)).thenReturn(Optional.of(sale));

        InventoryTransaction tx = new InventoryTransaction();
        tx.setId(10L);
        tx.setProduct(activeProduct1);
        tx.setTransactionType(TransactionType.STOCK_OUT);
        tx.setQuantity(2);
        tx.setQuantityBefore(10);
        tx.setQuantityAfter(8);
        tx.setReferenceId("SAL-2026-000500");

        when(inventoryTransactionRepository.findByReferenceIdOrderByCreatedAtAsc("SAL-2026-000500"))
                .thenReturn(List.of(tx));

        List<InventoryTransactionResponse> response = saleService.getSaleInventoryTransactions(500L);

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(TransactionType.STOCK_OUT, response.get(0).getTransactionType());
        assertEquals(2, response.get(0).getQuantity());
    }

    @Test
    void getSaleAuditHistory_ReturnsAuditList() {
        Sale sale = new Sale();
        sale.setId(600L);

        when(saleRepository.existsById(600L)).thenReturn(true);

        SaleAuditHistory audit = new SaleAuditHistory(sale, "SYSTEM", SaleAuditAction.SALE_CREATED, "Created sale");
        audit.setId(1L);

        when(saleAuditHistoryRepository.findBySaleIdOrderByCreatedAtDesc(600L)).thenReturn(List.of(audit));

        List<SaleAuditResponse> response = saleService.getSaleAuditHistory(600L);

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(SaleAuditAction.SALE_CREATED, response.get(0).getActionType());
        assertEquals("Created sale", response.get(0).getDescription());
    }
}
