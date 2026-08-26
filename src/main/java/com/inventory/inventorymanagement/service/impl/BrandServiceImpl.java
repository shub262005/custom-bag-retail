package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.BrandRequest;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.BrandRepository;
import com.inventory.inventorymanagement.service.BrandService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;

    public BrandServiceImpl(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Override
    public BrandResponse createBrand(BrandRequest request) {
        String trimmedName = request.getName().trim();

        if (brandRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Brand with name '" + trimmedName + "' already exists");
        }

        Brand brand = new Brand();
        brand.setName(trimmedName);
        brand.setStatus(request.getStatus() != null ? request.getStatus() : BrandStatus.ACTIVE);

        Brand savedBrand = brandRepository.save(brand);
        return BrandResponse.fromEntity(savedBrand);
    }

    @Override
    @Transactional(readOnly = true)
    public BrandResponse getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));
        return BrandResponse.fromEntity(brand);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandResponse> getAllBrands(BrandStatus status) {
        List<Brand> brands;
        if (status != null) {
            brands = brandRepository.findByStatus(status);
        } else {
            brands = brandRepository.findAll();
        }
        return brands.stream()
                .map(BrandResponse::fromEntity)
                .toList();
    }

    @Override
    public BrandResponse updateBrand(Long id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        String trimmedName = request.getName().trim();

        if (brandRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Brand with name '" + trimmedName + "' already exists");
        }

        brand.setName(trimmedName);
        if (request.getStatus() != null) {
            brand.setStatus(request.getStatus());
        }

        Brand updatedBrand = brandRepository.save(brand);
        return BrandResponse.fromEntity(updatedBrand);
    }

    @Override
    public BrandResponse updateBrandStatus(Long id, BrandStatus status) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        brand.setStatus(status);
        Brand updatedBrand = brandRepository.save(brand);
        return BrandResponse.fromEntity(updatedBrand);
    }
}
