package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.service.BrandService;
import com.inventory.inventorymanagement.service.CategoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicStorefrontController.class)
class PublicStorefrontControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BrandService brandService;

    @MockBean
    private CategoryService categoryService;

    @Test
    void anonymousVisitorCanReadOnlyActiveBrandsWithSafeFields() throws Exception {
        when(brandService.getAllBrands(BrandStatus.ACTIVE)).thenReturn(List.of(
                new BrandResponse(1L, "Safari", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now()),
                new BrandResponse(2L, "VIP", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now())
        ));

        mockMvc.perform(get("/api/v1/public/storefront/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Safari"))
                .andExpect(jsonPath("$[0].status").doesNotExist())
                .andExpect(jsonPath("$[0].createdAt").doesNotExist())
                .andExpect(jsonPath("$[0].updatedAt").doesNotExist());

        verify(brandService).getAllBrands(BrandStatus.ACTIVE);
    }

    @Test
    void anonymousVisitorCanReadOnlyActiveCategoriesWithSafeFields() throws Exception {
        when(categoryService.getAllCategories(CategoryStatus.ACTIVE)).thenReturn(List.of(
                new CategoryResponse(1L, "Travel Bags", CategoryStatus.ACTIVE,
                        LocalDateTime.now(), LocalDateTime.now())
        ));

        mockMvc.perform(get("/api/v1/public/storefront/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Travel Bags"))
                .andExpect(jsonPath("$[0].status").doesNotExist());

        verify(categoryService).getAllCategories(CategoryStatus.ACTIVE);
    }
}
