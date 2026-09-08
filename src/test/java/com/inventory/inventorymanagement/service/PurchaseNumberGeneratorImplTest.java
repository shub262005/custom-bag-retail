package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.repository.PurchaseSequenceRepository;
import com.inventory.inventorymanagement.service.impl.PurchaseNumberGeneratorImpl;
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
class PurchaseNumberGeneratorImplTest {

    @Mock
    private PurchaseSequenceRepository purchaseSequenceRepository;

    @InjectMocks
    private PurchaseNumberGeneratorImpl purchaseNumberGenerator;

    @Test
    void generatePurchaseNumber_CurrentYear() {
        LocalDate date = LocalDate.of(2026, 9, 7);
        when(purchaseSequenceRepository.getNextSequenceValue(2026)).thenReturn(1L);

        String number = purchaseNumberGenerator.generatePurchaseNumber(date);

        assertEquals("PUR-2026-000001", number);
        verify(purchaseSequenceRepository).getNextSequenceValue(2026);
    }

    @Test
    void generatePurchaseNumber_YearlyRollover() {
        LocalDate date2026 = LocalDate.of(2026, 12, 31);
        LocalDate date2027 = LocalDate.of(2027, 1, 1);

        when(purchaseSequenceRepository.getNextSequenceValue(2026)).thenReturn(999L);
        when(purchaseSequenceRepository.getNextSequenceValue(2027)).thenReturn(1L);

        String num2026 = purchaseNumberGenerator.generatePurchaseNumber(date2026);
        String num2027 = purchaseNumberGenerator.generatePurchaseNumber(date2027);

        assertEquals("PUR-2026-000999", num2026);
        assertEquals("PUR-2027-000001", num2027);
    }
}
