package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.repository.SaleSequenceRepository;
import com.inventory.inventorymanagement.service.SaleNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class SaleNumberGeneratorImpl implements SaleNumberGenerator {

    private final SaleSequenceRepository saleSequenceRepository;

    public SaleNumberGeneratorImpl(SaleSequenceRepository saleSequenceRepository) {
        this.saleSequenceRepository = saleSequenceRepository;
    }

    @Override
    @Transactional
    public String generateSaleNumber(LocalDate saleDate) {
        int year = (saleDate != null ? saleDate : LocalDate.now()).getYear();
        Long nextVal = saleSequenceRepository.getNextSequenceValue(year);
        return String.format("SAL-%d-%06d", year, nextVal);
    }
}
