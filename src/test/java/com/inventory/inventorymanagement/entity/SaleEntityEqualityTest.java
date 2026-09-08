package com.inventory.inventorymanagement.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SaleEntityEqualityTest {

    @Test
    void saleItem_EqualityAndHashCode() {
        SaleItem item1 = new SaleItem();
        SaleItem item2 = new SaleItem();

        assertEquals(item1, item1);
        assertNotEquals(item1, null);
        assertNotEquals(item1, new Object());
        assertNotEquals(item1, item2);

        item1.setId(100L);
        item2.setId(100L);
        assertEquals(item1, item2);

        item2.setId(200L);
        assertNotEquals(item1, item2);

        SaleItem item3 = new SaleItem();
        assertNotEquals(item1, item3);

        assertEquals(item1.hashCode(), item2.hashCode());
        assertEquals(item1.hashCode(), item3.hashCode());
        assertEquals(SaleItem.class.hashCode(), item1.hashCode());
    }

    @Test
    void salePayment_EqualityAndHashCode() {
        SalePayment payment1 = new SalePayment();
        SalePayment payment2 = new SalePayment();

        assertEquals(payment1, payment1);
        assertNotEquals(payment1, null);
        assertNotEquals(payment1, new Object());
        assertNotEquals(payment1, payment2);

        payment1.setId(10L);
        payment2.setId(10L);
        assertEquals(payment1, payment2);

        payment2.setId(20L);
        assertNotEquals(payment1, payment2);

        SalePayment payment3 = new SalePayment();
        assertNotEquals(payment1, payment3);

        assertEquals(payment1.hashCode(), payment2.hashCode());
        assertEquals(payment1.hashCode(), payment3.hashCode());
        assertEquals(SalePayment.class.hashCode(), payment1.hashCode());
    }

    @Test
    void sale_EqualityAndHashCode() {
        Sale sale1 = new Sale();
        Sale sale2 = new Sale();

        assertEquals(sale1, sale1);
        assertNotEquals(sale1, null);
        assertNotEquals(sale1, new Object());
        assertNotEquals(sale1, sale2);

        sale1.setId(1L);
        sale2.setId(1L);
        assertEquals(sale1, sale2);

        sale2.setId(2L);
        assertNotEquals(sale1, sale2);

        Sale sale3 = new Sale();
        assertNotEquals(sale1, sale3);

        assertEquals(sale1.hashCode(), sale2.hashCode());
        assertEquals(sale1.hashCode(), sale3.hashCode());
        assertEquals(Sale.class.hashCode(), sale1.hashCode());
    }

    @Test
    void saleAuditHistory_EqualityAndHashCode() {
        SaleAuditHistory audit1 = new SaleAuditHistory();
        SaleAuditHistory audit2 = new SaleAuditHistory();

        assertEquals(audit1, audit1);
        assertNotEquals(audit1, null);
        assertNotEquals(audit1, new Object());
        assertNotEquals(audit1, audit2);

        audit1.setId(5L);
        audit2.setId(5L);
        assertEquals(audit1, audit2);

        audit2.setId(15L);
        assertNotEquals(audit1, audit2);

        SaleAuditHistory audit3 = new SaleAuditHistory();
        assertNotEquals(audit1, audit3);

        assertEquals(audit1.hashCode(), audit2.hashCode());
        assertEquals(audit1.hashCode(), audit3.hashCode());
        assertEquals(SaleAuditHistory.class.hashCode(), audit1.hashCode());
    }
}
