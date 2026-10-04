package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.StorefrontItemResponse;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.service.BrandService;
import com.inventory.inventorymanagement.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public/storefront")
public class PublicStorefrontController {

    private final BrandService brandService;
    private final CategoryService categoryService;

    public PublicStorefrontController(BrandService brandService, CategoryService categoryService) {
        this.brandService = brandService;
        this.categoryService = categoryService;
    }

    @GetMapping("/brands")
    public ResponseEntity<List<StorefrontItemResponse>> getActiveBrands() {
        List<StorefrontItemResponse> brands = brandService.getAllBrands(BrandStatus.ACTIVE).stream()
                .map(brand -> new StorefrontItemResponse(brand.getId(), brand.getName()))
                .limit(8)
                .toList();
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<StorefrontItemResponse>> getActiveCategories() {
        List<StorefrontItemResponse> categories = categoryService.getAllCategories(CategoryStatus.ACTIVE).stream()
                .map(category -> new StorefrontItemResponse(category.getId(), category.getName()))
                .toList();
        return ResponseEntity.ok(categories);
    }
}
