package com.inventory.inventorymanagement.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PurchaseEntityEqualityTest {

    @Test
    void purchaseItem_EqualityAndHashCode() {
        PurchaseItem item1 = new PurchaseItem();
        PurchaseItem item2 = new PurchaseItem();

        // 1. Same object is equal to itself
        assertEquals(item1, item1);

        // 2. Equals null is false
        assertNotEquals(item1, null);

        // 3. Equals different class is false
        assertNotEquals(item1, new Object());

        // 4. Two different transient objects with null IDs are NOT equal
        assertNotEquals(item1, item2);

        // 5. Persisted objects with same non-null ID are equal
        item1.setId(100L);
        item2.setId(100L);
        assertEquals(item1, item2);

        // 6. Persisted objects with different IDs are NOT equal
        item2.setId(200L);
        assertNotEquals(item1, item2);

        // 7. Transient vs Persisted is NOT equal
        PurchaseItem item3 = new PurchaseItem();
        assertNotEquals(item1, item3);

        // 8. HashCode stability across instances of same class
        assertEquals(item1.hashCode(), item2.hashCode());
        assertEquals(item1.hashCode(), item3.hashCode());
        assertEquals(PurchaseItem.class.hashCode(), item1.hashCode());
    }

    @Test
    void purchasePayment_EqualityAndHashCode() {
        PurchasePayment payment1 = new PurchasePayment();
        PurchasePayment payment2 = new PurchasePayment();

        // 1. Same object is equal to itself
        assertEquals(payment1, payment1);

        // 2. Equals null is false
        assertNotEquals(payment1, null);

        // 3. Equals different class is false
        assertNotEquals(payment1, new Object());

        // 4. Two different transient objects with null IDs are NOT equal
        assertNotEquals(payment1, payment2);

        // 5. Persisted objects with same non-null ID are equal
        payment1.setId(10L);
        payment2.setId(10L);
        assertEquals(payment1, payment2);

        // 6. Persisted objects with different IDs are NOT equal
        payment2.setId(20L);
        assertNotEquals(payment1, payment2);

        // 7. Transient vs Persisted is NOT equal
        PurchasePayment payment3 = new PurchasePayment();
        assertNotEquals(payment1, payment3);

        // 8. HashCode stability
        assertEquals(payment1.hashCode(), payment2.hashCode());
        assertEquals(payment1.hashCode(), payment3.hashCode());
        assertEquals(PurchasePayment.class.hashCode(), payment1.hashCode());
    }

    @Test
    void purchase_EqualityAndHashCode() {
        Purchase purchase1 = new Purchase();
        Purchase purchase2 = new Purchase();

        // 1. Same object is equal to itself
        assertEquals(purchase1, purchase1);

        // 2. Equals null is false
        assertNotEquals(purchase1, null);

        // 3. Equals different class is false
        assertNotEquals(purchase1, new Object());

        // 4. Two different transient objects with null IDs are NOT equal
        assertNotEquals(purchase1, purchase2);

        // 5. Persisted objects with same non-null ID are equal
        purchase1.setId(1L);
        purchase2.setId(1L);
        assertEquals(purchase1, purchase2);

        // 6. Persisted objects with different IDs are NOT equal
        purchase2.setId(2L);
        assertNotEquals(purchase1, purchase2);

        // 7. Transient vs Persisted is NOT equal
        Purchase purchase3 = new Purchase();
        assertNotEquals(purchase1, purchase3);

        // 8. HashCode stability
        assertEquals(purchase1.hashCode(), purchase2.hashCode());
        assertEquals(purchase1.hashCode(), purchase3.hashCode());
        assertEquals(Purchase.class.hashCode(), purchase1.hashCode());
    }
}
