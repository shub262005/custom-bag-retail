package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CategoryRequest;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.entity.Category;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.CategoryRepository;
import com.inventory.inventorymanagement.service.impl.CategoryServiceImpl;
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
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category(
                1L,
                "Electronics",
                CategoryStatus.ACTIVE,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    void createCategory_Success() {
        CategoryRequest request = new CategoryRequest("Electronics", CategoryStatus.ACTIVE);
        when(categoryRepository.existsByNameIgnoreCase("Electronics")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(sampleCategory);

        CategoryResponse response = categoryService.createCategory(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Electronics", response.getName());
        assertEquals(CategoryStatus.ACTIVE, response.getStatus());
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void createCategory_DuplicateName_ThrowsException() {
        CategoryRequest request = new CategoryRequest("Electronics");
        when(categoryRepository.existsByNameIgnoreCase("Electronics")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> categoryService.createCategory(request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void getCategoryById_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));

        CategoryResponse response = categoryService.getCategoryById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Electronics", response.getName());
    }

    @Test
    void getCategoryById_NotFound_ThrowsException() {
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.getCategoryById(99L));
    }

    @Test
    void getAllCategories_WithoutStatusFilter() {
        when(categoryRepository.findAll()).thenReturn(List.of(sampleCategory));

        List<CategoryResponse> responses = categoryService.getAllCategories(null);

        assertEquals(1, responses.size());
        assertEquals("Electronics", responses.get(0).getName());
    }

    @Test
    void getAllCategories_WithStatusFilter() {
        when(categoryRepository.findByStatus(CategoryStatus.ACTIVE)).thenReturn(List.of(sampleCategory));

        List<CategoryResponse> responses = categoryService.getAllCategories(CategoryStatus.ACTIVE);

        assertEquals(1, responses.size());
        assertEquals(CategoryStatus.ACTIVE, responses.get(0).getStatus());
    }

    @Test
    void updateCategory_Success() {
        CategoryRequest request = new CategoryRequest("Smart Electronics", CategoryStatus.ACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.existsByNameIgnoreCaseAndIdNot("Smart Electronics", 1L)).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(sampleCategory);

        CategoryResponse response = categoryService.updateCategory(1L, request);

        assertNotNull(response);
        verify(categoryRepository).save(sampleCategory);
    }

    @Test
    void updateCategory_DuplicateName_ThrowsException() {
        CategoryRequest request = new CategoryRequest("Clothing", CategoryStatus.ACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.existsByNameIgnoreCaseAndIdNot("Clothing", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> categoryService.updateCategory(1L, request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void activateCategory_Success() {
        sampleCategory.setStatus(CategoryStatus.INACTIVE);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(sampleCategory);

        CategoryResponse response = categoryService.activateCategory(1L);

        assertNotNull(response);
        assertEquals(CategoryStatus.ACTIVE, sampleCategory.getStatus());
        verify(categoryRepository).save(sampleCategory);
    }

    @Test
    void deactivateCategory_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenReturn(sampleCategory);

        CategoryResponse response = categoryService.deactivateCategory(1L);

        assertNotNull(response);
        assertEquals(CategoryStatus.INACTIVE, sampleCategory.getStatus());
        verify(categoryRepository).save(sampleCategory);
    }
}
