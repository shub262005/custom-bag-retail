package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.repository.PurchaseSequenceRepository;
import com.inventory.inventorymanagement.service.PurchaseNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class PurchaseNumberGeneratorImpl implements PurchaseNumberGenerator {

    private final PurchaseSequenceRepository purchaseSequenceRepository;

    public PurchaseNumberGeneratorImpl(PurchaseSequenceRepository purchaseSequenceRepository) {
        this.purchaseSequenceRepository = purchaseSequenceRepository;
    }

    @Override
    @Transactional
    public String generatePurchaseNumber(LocalDate purchaseDate) {
        int year = (purchaseDate != null ? purchaseDate : LocalDate.now()).getYear();
        Long nextVal = purchaseSequenceRepository.getNextSequenceValue(year);
        return String.format("PUR-%d-%06d", year, nextVal);
    }
}
