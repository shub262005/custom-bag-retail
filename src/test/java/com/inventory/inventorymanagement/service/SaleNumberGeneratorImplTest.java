package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.repository.SaleSequenceRepository;
import com.inventory.inventorymanagement.service.impl.SaleNumberGeneratorImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleNumberGeneratorImplTest {

    @Mock
    private SaleSequenceRepository saleSequenceRepository;

    @InjectMocks
    private SaleNumberGeneratorImpl saleNumberGenerator;

    @Test
    void generateSaleNumber_CurrentYear() {
        LocalDate date = LocalDate.of(2026, 9, 8);
        when(saleSequenceRepository.getNextSequenceValue(2026)).thenReturn(1L);

        String number = saleNumberGenerator.generateSaleNumber(date);

        assertEquals("SAL-2026-000001", number);
        verify(saleSequenceRepository).getNextSequenceValue(2026);
    }

    @Test
    void generateSaleNumber_YearlyRollover() {
        LocalDate date2026 = LocalDate.of(2026, 12, 31);
        LocalDate date2027 = LocalDate.of(2027, 1, 1);

        when(saleSequenceRepository.getNextSequenceValue(2026)).thenReturn(999L);
        when(saleSequenceRepository.getNextSequenceValue(2027)).thenReturn(1L);

        String num2026 = saleNumberGenerator.generateSaleNumber(date2026);
        String num2027 = saleNumberGenerator.generateSaleNumber(date2027);

        assertEquals("SAL-2026-000999", num2026);
        assertEquals("SAL-2027-000001", num2027);
    }
}
