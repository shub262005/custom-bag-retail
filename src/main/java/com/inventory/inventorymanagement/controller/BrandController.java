package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.BrandRequest;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.dto.BrandStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.service.BrandService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/brands")
public class BrandController {

    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @PostMapping
    public ResponseEntity<BrandResponse> createBrand(@Valid @RequestBody BrandRequest request) {
        BrandResponse response = brandService.createBrand(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAllBrands(
            @RequestParam(required = false) BrandStatus status) {
        List<BrandResponse> brands = brandService.getAllBrands(status);
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandResponse> getBrandById(@PathVariable Long id) {
        BrandResponse response = brandService.getBrandById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandResponse> updateBrand(
            @PathVariable Long id,
            @Valid @RequestBody BrandRequest request) {
        BrandResponse response = brandService.updateBrand(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BrandResponse> updateBrandStatus(
            @PathVariable Long id,
            @Valid @RequestBody BrandStatusUpdateRequest request) {
        BrandResponse response = brandService.updateBrandStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
