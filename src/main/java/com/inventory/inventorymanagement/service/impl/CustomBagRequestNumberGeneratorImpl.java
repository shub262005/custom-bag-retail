package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.repository.CustomBagRequestSequenceRepository;
import com.inventory.inventorymanagement.service.CustomBagRequestNumberGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
public class CustomBagRequestNumberGeneratorImpl implements CustomBagRequestNumberGenerator {
    private final CustomBagRequestSequenceRepository repository;
    public CustomBagRequestNumberGeneratorImpl(CustomBagRequestSequenceRepository repository) { this.repository = repository; }
    @Override @Transactional
    public String generate() {
        int year = LocalDate.now().getYear();
        return String.format("CBR-%d-%06d", year, repository.getNextSequenceValue(year));
    }
}
