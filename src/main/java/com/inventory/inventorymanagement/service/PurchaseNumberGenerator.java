package com.inventory.inventorymanagement.service;

import java.time.LocalDate;

public interface PurchaseNumberGenerator {

    String generatePurchaseNumber(LocalDate purchaseDate);
}
