package com.inventory.inventorymanagement.service;

/** Stock and merged line quantities must fit the database's non-negative integer range. */
public final class QuantityMath {
    private QuantityMath() {}

    public static int add(int before, int increase) {
        long result = (long) before + increase;
        if (before < 0 || increase < 0 || result > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Quantity exceeds the supported stock range (0 to " + Integer.MAX_VALUE + ").");
        }
        return (int) result;
    }
}
