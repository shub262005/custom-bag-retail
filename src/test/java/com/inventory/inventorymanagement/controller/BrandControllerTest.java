package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.BrandRequest;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.dto.BrandStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.BrandService;
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

@WebMvcTest(BrandController.class)
class BrandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BrandService brandService;

    @Test
    void createBrand_ValidRequest_Returns201Created() throws Exception {
        BrandRequest request = new BrandRequest("Samsung", BrandStatus.ACTIVE);
        BrandResponse response = new BrandResponse(1L, "Samsung", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.createBrand(any(BrandRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Samsung"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createBrand_BlankName_Returns400BadRequest() throws Exception {
        BrandRequest request = new BrandRequest("", BrandStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void createBrand_DuplicateName_Returns409Conflict() throws Exception {
        BrandRequest request = new BrandRequest("Samsung", BrandStatus.ACTIVE);

        when(brandService.createBrand(any(BrandRequest.class)))
                .thenThrow(new DuplicateResourceException("Brand with name 'Samsung' already exists"));

        mockMvc.perform(post("/api/v1/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Brand with name 'Samsung' already exists"));
    }

    @Test
    void getBrandById_Found_Returns200Ok() throws Exception {
        BrandResponse response = new BrandResponse(1L, "Samsung", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.getBrandById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/brands/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Samsung"));
    }

    @Test
    void getBrandById_NotFound_Returns404NotFound() throws Exception {
        when(brandService.getBrandById(99L))
                .thenThrow(new ResourceNotFoundException("Brand not found with id: 99"));

        mockMvc.perform(get("/api/v1/brands/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllBrands_ReturnsList() throws Exception {
        BrandResponse response = new BrandResponse(1L, "Samsung", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.getAllBrands(null)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Samsung"));
    }

    @Test
    void getAllBrands_WithStatusFilter_ReturnsFilteredList() throws Exception {
        BrandResponse response = new BrandResponse(1L, "Samsung", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.getAllBrands(BrandStatus.ACTIVE)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/brands?status=ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void updateBrand_Valid_Returns200Ok() throws Exception {
        BrandRequest request = new BrandRequest("Samsung Electronics", BrandStatus.ACTIVE);
        BrandResponse response = new BrandResponse(1L, "Samsung Electronics", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.updateBrand(eq(1L), any(BrandRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/brands/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Samsung Electronics"));
    }

    @Test
    void updateBrand_DuplicateName_Returns409Conflict() throws Exception {
        BrandRequest request = new BrandRequest("Apple", BrandStatus.ACTIVE);

        when(brandService.updateBrand(eq(1L), any(BrandRequest.class)))
                .thenThrow(new DuplicateResourceException("Brand with name 'Apple' already exists"));

        mockMvc.perform(put("/api/v1/brands/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void updateBrandStatus_Returns200Ok() throws Exception {
        BrandStatusUpdateRequest request = new BrandStatusUpdateRequest(BrandStatus.INACTIVE);
        BrandResponse response = new BrandResponse(1L, "Samsung", BrandStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(brandService.updateBrandStatus(1L, BrandStatus.INACTIVE)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/brands/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
}
