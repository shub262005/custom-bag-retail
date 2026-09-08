package com.inventory.inventorymanagement.service;

import java.time.LocalDate;

public interface SaleNumberGenerator {

    String generateSaleNumber(LocalDate saleDate);
}
