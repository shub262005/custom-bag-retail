package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.BrandRequest;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.BrandRepository;
import com.inventory.inventorymanagement.service.impl.BrandServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BrandServiceTest {

    @Mock
    private BrandRepository brandRepository;

    @InjectMocks
    private BrandServiceImpl brandService;

    private Brand sampleBrand;

    @BeforeEach
    void setUp() {
        sampleBrand = new Brand(
                1L,
                "Samsung",
                BrandStatus.ACTIVE,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    void createBrand_Success() {
        BrandRequest request = new BrandRequest("Samsung", BrandStatus.ACTIVE);
        when(brandRepository.existsByNameIgnoreCase("Samsung")).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenReturn(sampleBrand);

        BrandResponse response = brandService.createBrand(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Samsung", response.getName());
        assertEquals(BrandStatus.ACTIVE, response.getStatus());
        verify(brandRepository).save(any(Brand.class));
    }

    @Test
    void createBrand_DuplicateName_ThrowsDuplicateResourceException() {
        BrandRequest request = new BrandRequest("Samsung");
        when(brandRepository.existsByNameIgnoreCase("Samsung")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> brandService.createBrand(request));
        verify(brandRepository, never()).save(any(Brand.class));
    }

    @Test
    void getBrandById_Success() {
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));

        BrandResponse response = brandService.getBrandById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Samsung", response.getName());
    }

    @Test
    void getBrandById_NotFound_ThrowsResourceNotFoundException() {
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> brandService.getBrandById(99L));
    }

    @Test
    void getAllBrands_WithoutStatusFilter() {
        when(brandRepository.findAll()).thenReturn(List.of(sampleBrand));

        List<BrandResponse> responses = brandService.getAllBrands(null);

        assertEquals(1, responses.size());
        assertEquals("Samsung", responses.get(0).getName());
    }

    @Test
    void getAllBrands_WithStatusFilter() {
        when(brandRepository.findByStatus(BrandStatus.ACTIVE)).thenReturn(List.of(sampleBrand));

        List<BrandResponse> responses = brandService.getAllBrands(BrandStatus.ACTIVE);

        assertEquals(1, responses.size());
        assertEquals(BrandStatus.ACTIVE, responses.get(0).getStatus());
    }

    @Test
    void updateBrand_Success() {
        BrandRequest request = new BrandRequest("Samsung Electronics", BrandStatus.ACTIVE);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));
        when(brandRepository.existsByNameIgnoreCaseAndIdNot("Samsung Electronics", 1L)).thenReturn(false);
        when(brandRepository.save(any(Brand.class))).thenReturn(sampleBrand);

        BrandResponse response = brandService.updateBrand(1L, request);

        assertNotNull(response);
        verify(brandRepository).save(sampleBrand);
    }

    @Test
    void updateBrand_DuplicateName_ThrowsDuplicateResourceException() {
        BrandRequest request = new BrandRequest("Apple", BrandStatus.ACTIVE);
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));
        when(brandRepository.existsByNameIgnoreCaseAndIdNot("Apple", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> brandService.updateBrand(1L, request));
        verify(brandRepository, never()).save(any(Brand.class));
    }

    @Test
    void updateBrandStatus_Success() {
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));
        when(brandRepository.save(any(Brand.class))).thenReturn(sampleBrand);

        BrandResponse response = brandService.updateBrandStatus(1L, BrandStatus.INACTIVE);

        assertNotNull(response);
        assertEquals(BrandStatus.INACTIVE, sampleBrand.getStatus());
        verify(brandRepository).save(sampleBrand);
    }

    @Test
    void updateBrandStatus_NotFound_ThrowsResourceNotFoundException() {
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> brandService.updateBrandStatus(99L, BrandStatus.INACTIVE));
    }
}
