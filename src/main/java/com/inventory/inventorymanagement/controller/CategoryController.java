package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.CategoryRequest;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.dto.CategoryStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        CategoryResponse response = categoryService.getCategoryById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
            @RequestParam(required = false) CategoryStatus status) {
        List<CategoryResponse> categories = categoryService.getAllCategories(status);
        return ResponseEntity.ok(categories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CategoryResponse> updateCategoryStatus(
            @PathVariable Long id,
            @Valid @RequestBody CategoryStatusUpdateRequest request) {
        CategoryResponse response = categoryService.updateCategoryStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<CategoryResponse> activateCategory(@PathVariable Long id) {
        CategoryResponse response = categoryService.activateCategory(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CategoryResponse> deactivateCategory(@PathVariable Long id) {
        CategoryResponse response = categoryService.deactivateCategory(id);
        return ResponseEntity.ok(response);
    }
}
