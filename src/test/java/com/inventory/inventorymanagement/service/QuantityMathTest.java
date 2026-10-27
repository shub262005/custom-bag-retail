package com.inventory.inventorymanagement.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class QuantityMathTest {
    @Test void acceptsStockAtTheIntegerBoundary() {
        assertEquals(Integer.MAX_VALUE, QuantityMath.add(Integer.MAX_VALUE - 1, 1));
        assertEquals(10, QuantityMath.add(0, 10));
    }

    @Test void overflowCannotWrapStockOrMergedSalesQuantities() {
        assertThrows(IllegalArgumentException.class, () -> QuantityMath.add(Integer.MAX_VALUE, 1));
        assertThrows(IllegalArgumentException.class, () -> QuantityMath.add(2_000_000_000, 2_000_000_000));
        assertThrows(IllegalArgumentException.class, () -> QuantityMath.add(-1, 2));
    }
}
