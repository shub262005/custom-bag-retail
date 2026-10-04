package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** A single receipt/reversal check; all business rows and stock changes roll back. */
@SpringBootTest
@TestPropertySource(locations = "file:src/main/resources/application.properties")
@EnabledIfSystemProperty(named = "purchases.postgres.tests", matches = "true")
@Transactional
class PurchasePostgresRegressionTest {
    @Autowired PurchaseService service;
    @Autowired ProductRepository products;
    @Autowired CategoryRepository categories;
    @Autowired SupplierRepository suppliers;
    @Autowired InventoryTransactionRepository inventory;
    @Autowired EntityManager em;

    @Test
    void receiptAddsStockAndCancellationReversesTheLedger() {
        String marker = UUID.randomUUID().toString().replace("-", "");
        var category = categories.save(new Category("Purchase regression " + marker, CategoryStatus.ACTIVE));
        var product = products.save(new Product(null, "Receipt " + marker, marker, null,
                category, null, null, null, new BigDecimal("5.00"), new BigDecimal("10.00"),
                20, 0, null, ProductStatus.ACTIVE, null, null));
        var supplier = suppliers.save(new Supplier(null, "Receipt supplier " + marker,
                null, null, SupplierStatus.ACTIVE, null, null));
        em.flush();
        var purchase = service.createPurchase(new PurchaseRequest(supplier.getId(), LocalDate.now(),
                null, null, null, null, null, marker,
                List.of(new PurchaseItemRequest(product.getId(), 2, new BigDecimal("5.00"))), List.of()));
        em.flush();
        em.clear();
        assertEquals(22, products.findById(product.getId()).orElseThrow().getStockQuantity());
        var received = inventory.findByReferenceIdOrderByCreatedAtAsc(purchase.getPurchaseNumber());
        assertEquals(1, received.size());
        assertEquals(TransactionType.STOCK_IN, received.get(0).getTransactionType());
        assertEquals(2, received.get(0).getQuantity());
        assertEquals(PurchaseStatus.CANCELLED, service.cancelPurchase(purchase.getId()).getStatus());
        em.flush();
        em.clear();
        assertEquals(20, products.findById(product.getId()).orElseThrow().getStockQuantity());
        var reversed = inventory.findByReferenceIdOrderByCreatedAtAsc(purchase.getPurchaseNumber());
        assertEquals(2, reversed.size());
        assertTrue(reversed.stream().anyMatch(row -> row.getTransactionType() == TransactionType.STOCK_OUT
                && row.getQuantity() == 2));
    }
}
