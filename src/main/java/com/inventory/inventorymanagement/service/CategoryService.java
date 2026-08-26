package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CategoryRequest;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.entity.CategoryStatus;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse getCategoryById(Long id);

    List<CategoryResponse> getAllCategories(CategoryStatus status);

    CategoryResponse updateCategory(Long id, CategoryRequest request);

    CategoryResponse updateCategoryStatus(Long id, CategoryStatus status);

    CategoryResponse activateCategory(Long id);

    CategoryResponse deactivateCategory(Long id);
}
