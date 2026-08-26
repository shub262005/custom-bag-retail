package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.CategoryRequest;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.entity.Category;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.CategoryRepository;
import com.inventory.inventorymanagement.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryResponse createCategory(CategoryRequest request) {
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Category with name '" + trimmedName + "' already exists");
        }

        Category category = new Category();
        category.setName(trimmedName);
        category.setStatus(request.getStatus() != null ? request.getStatus() : CategoryStatus.ACTIVE);

        Category savedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryResponse.fromEntity(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(CategoryStatus status) {
        List<Category> categories;
        if (status != null) {
            categories = categoryRepository.findByStatus(status);
        } else {
            categories = categoryRepository.findAll();
        }
        return categories.stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Category with name '" + trimmedName + "' already exists");
        }

        category.setName(trimmedName);
        if (request.getStatus() != null) {
            category.setStatus(request.getStatus());
        }

        Category updatedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updatedCategory);
    }

    @Override
    public CategoryResponse updateCategoryStatus(Long id, CategoryStatus status) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        category.setStatus(status);
        Category updatedCategory = categoryRepository.save(category);
        return CategoryResponse.fromEntity(updatedCategory);
    }

    @Override
    public CategoryResponse activateCategory(Long id) {
        return updateCategoryStatus(id, CategoryStatus.ACTIVE);
    }

    @Override
    public CategoryResponse deactivateCategory(Long id) {
        return updateCategoryStatus(id, CategoryStatus.INACTIVE);
    }
}
