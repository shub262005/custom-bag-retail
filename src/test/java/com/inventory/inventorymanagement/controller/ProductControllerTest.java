package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.CategoryResponse;
import com.inventory.inventorymanagement.dto.BrandResponse;
import com.inventory.inventorymanagement.dto.ProductRequest;
import com.inventory.inventorymanagement.dto.ProductResponse;
import com.inventory.inventorymanagement.dto.ProductStatusUpdateRequest;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.entity.ProductStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    private ProductResponse sampleResponse() {
        CategoryResponse categoryResponse = new CategoryResponse(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        BrandResponse brandResponse = new BrandResponse(1L, "Sony", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        return new ProductResponse(
                1L,
                "Wireless Headphones",
                "SKU-WH-001",
                "BARCODE-12345",
                categoryResponse,
                brandResponse,
                "Black",
                null,
                new BigDecimal("50.00"),
                new BigDecimal("79.99"),
                0,
                5,
                "https://example.com/image.jpg",
                ProductStatus.ACTIVE,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    void createProduct_ValidRequest_Returns201Created() throws Exception {
        ProductRequest request = new ProductRequest(
                "Wireless Headphones", "SKU-WH-001", "BARCODE-12345",
                1L, 1L, "Black", null,
                new BigDecimal("50.00"), new BigDecimal("79.99"),
                5, "https://example.com/image.jpg", ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Wireless Headphones"))
                .andExpect(jsonPath("$.sku").value("SKU-WH-001"))
                .andExpect(jsonPath("$.stockQuantity").value(0))
                .andExpect(jsonPath("$.category.name").value("Electronics"))
                .andExpect(jsonPath("$.brand.name").value("Sony"));
    }

    @Test
    void createProduct_MissingRequiredFields_Returns400BadRequest() throws Exception {
        ProductRequest request = new ProductRequest(); // Empty body missing name, sku, categoryId, prices, minimumStock

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.name").exists())
                .andExpect(jsonPath("$.validationErrors.sku").exists())
                .andExpect(jsonPath("$.validationErrors.categoryId").exists())
                .andExpect(jsonPath("$.validationErrors.purchasePrice").exists())
                .andExpect(jsonPath("$.validationErrors.sellingPrice").exists())
                .andExpect(jsonPath("$.validationErrors.minimumStock").exists());
    }

    @Test
    void createProduct_InvalidPricesAndStock_Returns400BadRequest() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-TEST", null,
                1L, null, null, null,
                new BigDecimal("0.00"), // Invalid purchase price <= 0
                new BigDecimal("-5.00"), // Invalid selling price <= 0
                -1, // Invalid minimum stock < 0
                null, ProductStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.purchasePrice").exists())
                .andExpect(jsonPath("$.validationErrors.sellingPrice").exists())
                .andExpect(jsonPath("$.validationErrors.minimumStock").exists());
    }

    @Test
    void createProduct_DuplicateSku_Returns409Conflict() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-DUPLICATE", null,
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new DuplicateResourceException("Product with SKU 'SKU-DUPLICATE' already exists"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Product with SKU 'SKU-DUPLICATE' already exists"));
    }

    @Test
    void createProduct_DuplicateBarcode_Returns409Conflict() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-NEW", "BARCODE-DUP",
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new DuplicateResourceException("Product with barcode 'BARCODE-DUP' already exists"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void createProduct_CategoryNotFound_Returns404NotFound() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-NEW", null,
                99L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new ResourceNotFoundException("Category not found with id: 99"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createProduct_InactiveCategory_Returns400BadRequest() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-NEW", null,
                2L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new IllegalArgumentException("Cannot assign inactive category with id: 2"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Cannot assign inactive category with id: 2"));
    }

    @Test
    void createProduct_BrandNotFound_Returns404NotFound() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-NEW", null,
                1L, 99L, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new ResourceNotFoundException("Brand not found with id: 99"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createProduct_InactiveBrand_Returns400BadRequest() throws Exception {
        ProductRequest request = new ProductRequest(
                "Test Item", "SKU-NEW", null,
                1L, 2L, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, null, ProductStatus.ACTIVE
        );

        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new IllegalArgumentException("Cannot assign inactive brand with id: 2"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Cannot assign inactive brand with id: 2"));
    }

    @Test
    void getProductById_Found_Returns200Ok() throws Exception {
        when(productService.getProductById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Wireless Headphones"));
    }

    @Test
    void getProductById_NotFound_Returns404NotFound() throws Exception {
        when(productService.getProductById(99L))
                .thenThrow(new ResourceNotFoundException("Product not found with id: 99"));

        mockMvc.perform(get("/api/v1/products/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllProducts_WithoutFilter_ReturnsList() throws Exception {
        when(productService.getAllProducts(null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Wireless Headphones"));
    }

    @Test
    void getAllProducts_WithStatusFilter_ReturnsFilteredList() throws Exception {
        when(productService.getAllProducts(ProductStatus.ACTIVE)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/products?status=ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void searchProducts_ReturnsMatchingList() throws Exception {
        when(productService.searchProducts("Headphones")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/products/search").param("q", "Headphones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Wireless Headphones"));
    }

    @Test
    void updateProduct_Valid_Returns200Ok() throws Exception {
        ProductRequest request = new ProductRequest(
                "Updated Headphones", "SKU-WH-001", "BARCODE-12345",
                1L, 1L, "Silver", null,
                new BigDecimal("50.00"), new BigDecimal("85.00"),
                5, null, ProductStatus.ACTIVE
        );

        when(productService.updateProduct(eq(1L), any(ProductRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateProductStatus_Returns200Ok() throws Exception {
        ProductStatusUpdateRequest request = new ProductStatusUpdateRequest(ProductStatus.INACTIVE);
        ProductResponse response = sampleResponse();
        response.setStatus(ProductStatus.INACTIVE);

        when(productService.updateProductStatus(1L, ProductStatus.INACTIVE)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/products/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }
}
