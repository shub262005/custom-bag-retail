package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.BrandRequest;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.entity.BrandStatus;

import java.util.List;

public interface BrandService {

    BrandResponse createBrand(BrandRequest request);

    BrandResponse getBrandById(Long id);

    List<BrandResponse> getAllBrands(BrandStatus status);

    BrandResponse updateBrand(Long id, BrandRequest request);

    BrandResponse updateBrandStatus(Long id, BrandStatus status);
}
