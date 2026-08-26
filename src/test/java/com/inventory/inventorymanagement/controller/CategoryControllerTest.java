package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.CategoryRequest;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.dto.CategoryStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @Test
    void createCategory_ValidRequest_Returns201Created() throws Exception {
        CategoryRequest request = new CategoryRequest("Electronics", CategoryStatus.ACTIVE);
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Electronics"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createCategory_BlankName_Returns400BadRequest() throws Exception {
        CategoryRequest request = new CategoryRequest("", CategoryStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void createCategory_DuplicateName_Returns409Conflict() throws Exception {
        CategoryRequest request = new CategoryRequest("Electronics", CategoryStatus.ACTIVE);

        when(categoryService.createCategory(any(CategoryRequest.class)))
                .thenThrow(new DuplicateResourceException("Category with name 'Electronics' already exists"));

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Category with name 'Electronics' already exists"));
    }

    @Test
    void getCategoryById_Found_Returns200Ok() throws Exception {
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.getCategoryById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Electronics"));
    }

    @Test
    void getCategoryById_NotFound_Returns404NotFound() throws Exception {
        when(categoryService.getCategoryById(99L))
                .thenThrow(new ResourceNotFoundException("Category not found with id: 99"));

        mockMvc.perform(get("/api/v1/categories/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllCategories_ReturnsList() throws Exception {
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.getAllCategories(null)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Electronics"));
    }

    @Test
    void updateCategory_Valid_Returns200Ok() throws Exception {
        CategoryRequest request = new CategoryRequest("Home Appliances", CategoryStatus.ACTIVE);
        CategoryResponse response = new CategoryResponse(1L, "Home Appliances", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.updateCategory(eq(1L), any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Home Appliances"));
    }

    @Test
    void updateCategoryStatus_Returns200Ok() throws Exception {
        CategoryStatusUpdateRequest request = new CategoryStatusUpdateRequest(CategoryStatus.INACTIVE);
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.updateCategoryStatus(1L, CategoryStatus.INACTIVE)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/categories/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void activateCategory_Returns200Ok() throws Exception {
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.activateCategory(1L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/categories/1/activate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void deactivateCategory_Returns200Ok() throws Exception {
        CategoryResponse response = new CategoryResponse(1L, "Electronics", CategoryStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(categoryService.deactivateCategory(1L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/categories/1/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
}
