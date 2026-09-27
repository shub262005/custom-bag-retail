package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Opt in with -Dsales.postgres.tests=true. Uses the unchanged application datasource
 * and real migrations/schema validation. All fixtures and stock changes roll back;
 * PostgreSQL identity sequences can still acquire gaps.
 */
@SpringBootTest
@TestPropertySource(locations = "file:src/main/resources/application.properties")
@EnabledIfSystemProperty(named = "sales.postgres.tests", matches = "true")
@Transactional
class SalePostgresRegressionTest {
    @Autowired SaleService service;
    @Autowired SaleRepository sales;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired InventoryTransactionRepository inventory;
    @Autowired SaleAuditHistoryRepository audits;
    @Autowired EntityManager em;

    Product first, second, third;
    String marker;
    LocalDate today = LocalDate.now();

    @BeforeEach
    void fixtures() {
        marker = UUID.randomUUID().toString().replace("-", "");
        Category category = categories.save(new Category("Regression " + marker, CategoryStatus.ACTIVE));
        first = product(category, "Alpha", "A");
        second = product(category, "Beta", "B");
        third = product(category, "Gamma", "C");
        em.flush();
    }

    private Product product(Category category, String name, String suffix) {
        return products.save(new Product(null, name + " " + marker, marker + suffix,
                "BC" + marker + suffix, category, null, null, null, new BigDecimal("5.00"),
                new BigDecimal("10.00"), 20, 0, null, ProductStatus.ACTIVE, null, null));
    }

    private SaleItemRequest item(Product product, int quantity, String price) {
        return new SaleItemRequest(product.getId(), quantity, new BigDecimal(price));
    }

    private SaleResponse create(LocalDate date, PaymentMethod method, SaleItemRequest... items) {
        SaleResponse response = service.createSale(new SaleRequest(date, List.of(items), null, null, method, marker));
        em.flush();
        return response;
    }

    private SaleResponse edit(long id, SaleItemRequest... items) {
        service.updateSale(id, new SaleEditRequest(null, List.of(items), null, null, null, null, true));
        em.flush();
        em.clear();
        return service.getSaleById(id);
    }

    @Test
    void retainedItemQuantityAndPricePersistWithStableId() {
        SaleResponse original = create(today, PaymentMethod.CASH, item(first, 2, "10"));
        Long itemId = original.getItems().get(0).getId();
        SaleResponse updated = edit(original.getId(), item(first, 3, "12"));
        assertEquals(itemId, updated.getItems().get(0).getId());
        assertEquals(3, updated.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("12.00"), updated.getItems().get(0).getSellingPrice());
        assertEquals(new BigDecimal("36.00"), updated.getGrandTotal());
        assertEquals(new BigDecimal("36.00"), updated.getPayment().getAmount());
        assertEquals(17, products.findById(first.getId()).orElseThrow().getStockQuantity());
        List<InventoryTransaction> movements = inventory.findByReferenceIdOrderByCreatedAtAsc(original.getSaleNumber());
        assertEquals(2, movements.size());
        assertEquals(1, movements.get(1).getQuantity());
        assertEquals(TransactionType.STOCK_OUT, movements.get(1).getTransactionType());
        assertEquals(SaleAuditAction.SALE_UPDATED, audits.findBySaleIdOrderByCreatedAtDesc(original.getId()).get(0).getActionType());
    }

    @Test
    void mixedEditRetainsRemovesAndAddsWithCorrectStock() {
        SaleResponse original = create(today, PaymentMethod.CASH, item(first, 2, "10"), item(second, 2, "10"));
        Long retainedId = original.getItems().stream().filter(i -> i.getProductId().equals(first.getId())).findFirst().orElseThrow().getId();
        Long removedId = original.getItems().stream().filter(i -> i.getProductId().equals(second.getId())).findFirst().orElseThrow().getId();
        SaleResponse updated = edit(original.getId(), item(first, 1, "11"), item(third, 3, "10"));
        assertEquals(2, updated.getItems().size());
        assertEquals(retainedId, updated.getItems().stream().filter(i -> i.getProductId().equals(first.getId())).findFirst().orElseThrow().getId());
        assertNull(em.find(SaleItem.class, removedId));
        assertNotNull(updated.getItems().stream().filter(i -> i.getProductId().equals(third.getId())).findFirst().orElseThrow().getId());
        assertEquals(19, products.findById(first.getId()).orElseThrow().getStockQuantity());
        assertEquals(20, products.findById(second.getId()).orElseThrow().getStockQuantity());
        assertEquals(17, products.findById(third.getId()).orElseThrow().getStockQuantity());
        assertEquals(new BigDecimal("41.00"), updated.getPayment().getAmount());
        List<InventoryTransaction> movements = inventory.findByReferenceIdOrderByCreatedAtAsc(original.getSaleNumber());
        assertEquals(5, movements.size());
        assertTrue(movements.stream().anyMatch(t -> t.getProduct().getId().equals(second.getId()) && t.getTransactionType() == TransactionType.STOCK_IN && t.getQuantity() == 2));
        assertEquals(2, audits.findBySaleIdOrderByCreatedAtDesc(original.getId()).size());
    }

    @Test
    void failedEditRollsBackStockItemsPaymentInventoryAndAudit() {
        // Use an existing product so its original stock can be checked after the test transaction rolls back.
        Product existing = products.findAll().stream().filter(p -> !p.getSku().startsWith(marker)
                && p.getStatus() == ProductStatus.ACTIVE && p.getStockQuantity() >= 3).findFirst().orElseThrow();
        Long productId = existing.getId();
        int before = existing.getStockQuantity();
        SaleResponse original = create(today, PaymentMethod.CASH, item(existing, 1, "10"));
        // Force a persistence failure after stock-delta work, not just an early validation failure.
        assertThrows(RuntimeException.class, () -> {
            service.updateSale(original.getId(), new SaleEditRequest(null, List.of(item(existing, 2, "10")),
                    null, null, null, "x".repeat(256), true));
            em.flush();
        });
        TestTransaction.flagForRollback();
        TestTransaction.end();
        assertEquals(before, products.findById(productId).orElseThrow().getStockQuantity());
        assertFalse(sales.existsById(original.getId()));
        assertTrue(inventory.findByReferenceIdOrderByCreatedAtAsc(original.getSaleNumber()).isEmpty());
        assertTrue(audits.findBySaleIdOrderByCreatedAtDesc(original.getId()).isEmpty());
    }

    enum FilterCase { NONE, NUMBER, STATUS, START, END, RANGE, PAYMENT, NAME, SKU, BARCODE, COMBINED, NO_MATCH, ORDER }

    @ParameterizedTest
    @EnumSource(FilterCase.class)
    void listFiltersExecuteOnPostgres(FilterCase filter) {
        SaleResponse older = create(today.minusDays(2), PaymentMethod.CASH, item(first, 1, "10"));
        SaleResponse recent = create(today, PaymentMethod.UPI, item(first, 1, "10"));
        SaleResponse cancelled = create(today, PaymentMethod.CARD, item(second, 1, "10"));
        service.cancelSale(cancelled.getId(), new SaleCancelRequest(CancellationReason.WRONG_SALE_ENTRY, marker));
        em.flush();
        em.clear();
        String number = null, search = null;
        SaleStatus status = null;
        LocalDate start = null, end = null;
        PaymentMethod payment = null;
        List<Long> expected = List.of(cancelled.getId(), recent.getId(), older.getId());
        switch (filter) {
            case NUMBER -> { number = recent.getSaleNumber().substring(1).toLowerCase(Locale.ROOT); expected = List.of(recent.getId()); }
            case STATUS -> { status = SaleStatus.CANCELLED; expected = List.of(cancelled.getId()); }
            case START -> { start = today; expected = List.of(cancelled.getId(), recent.getId()); }
            case END -> { end = today.minusDays(2); expected = List.of(older.getId()); }
            case RANGE -> { start = today; end = today; expected = List.of(cancelled.getId(), recent.getId()); }
            case PAYMENT -> { payment = PaymentMethod.UPI; expected = List.of(recent.getId()); }
            case NAME -> { search = first.getName().toUpperCase(Locale.ROOT); expected = List.of(recent.getId(), older.getId()); }
            case SKU -> { search = first.getSku().toUpperCase(Locale.ROOT); expected = List.of(recent.getId(), older.getId()); }
            case BARCODE -> { search = first.getBarcode().toLowerCase(Locale.ROOT); expected = List.of(recent.getId(), older.getId()); }
            case COMBINED -> { number = recent.getSaleNumber(); status = SaleStatus.COMPLETED; start = today; end = today; payment = PaymentMethod.UPI; search = first.getName(); expected = List.of(recent.getId()); }
            case NO_MATCH -> { search = "missing-" + marker; expected = List.of(); }
            default -> { }
        }
        Set<Long> fixtureIds = Set.of(older.getId(), recent.getId(), cancelled.getId());
        List<Sale> result = sales.findWithFilters(number, status, start, end, payment, search);
        if (filter == FilterCase.NO_MATCH) {
            assertTrue(result.isEmpty());
        }
        assertEquals(expected, result.stream().map(Sale::getId).filter(fixtureIds::contains).toList());
        List<Long> serviceIds = service.getSales(number, status, start, end, payment, search).stream()
                .map(SaleResponse::getId).filter(fixtureIds::contains).toList();
        assertEquals(expected, serviceIds);
        if (filter == FilterCase.ORDER || filter == FilterCase.NONE) {
            List<Long> sortedIds = result.stream().sorted(Comparator.comparing(Sale::getSaleDate).reversed()
                    .thenComparing(Sale::getId, Comparator.reverseOrder())).map(Sale::getId).toList();
            assertEquals(sortedIds, result.stream().map(Sale::getId).toList());
        }
    }
}
