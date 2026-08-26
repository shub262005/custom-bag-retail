package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.ProductRequest;
import com.inventory.inventorymanagement.dto.ProductResponse;
import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.BrandStatus;
import com.inventory.inventorymanagement.entity.Category;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import com.inventory.inventorymanagement.entity.Product;
import com.inventory.inventorymanagement.entity.ProductStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.BrandRepository;
import com.inventory.inventorymanagement.repository.CategoryRepository;
import com.inventory.inventorymanagement.repository.ProductRepository;
import com.inventory.inventorymanagement.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BrandRepository brandRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Category sampleCategory;
    private Brand sampleBrand;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category(1L, "Electronics", CategoryStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        sampleBrand = new Brand(1L, "Sony", BrandStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());
        sampleProduct = new Product(
                1L,
                "Wireless Headphones",
                "SKU-WH-001",
                "BARCODE-12345",
                sampleCategory,
                sampleBrand,
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
    void createProduct_Success_WithAllFields() {
        ProductRequest request = new ProductRequest(
                "Wireless Headphones", "SKU-WH-001", "BARCODE-12345",
                1L, 1L, "Black", null,
                new BigDecimal("50.00"), new BigDecimal("79.99"),
                5, "https://example.com/image.jpg", ProductStatus.ACTIVE
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-WH-001")).thenReturn(false);
        when(productRepository.existsByBarcodeIgnoreCase("BARCODE-12345")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Wireless Headphones", response.getName());
        assertEquals("SKU-WH-001", response.getSku());
        assertEquals("BARCODE-12345", response.getBarcode());
        assertEquals(0, response.getStockQuantity());
        assertEquals(5, response.getMinimumStock());
        assertNotNull(response.getCategory());
        assertEquals(1L, response.getCategory().getId());
        assertNotNull(response.getBrand());
        assertEquals(1L, response.getBrand().getId());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createProduct_Success_WithoutBarcodeAndBrand() {
        ProductRequest request = new ProductRequest(
                "Basic Item", "SKU-BASIC", null,
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        Product productWithoutBrand = new Product(
                2L, "Basic Item", "SKU-BASIC", null,
                sampleCategory, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                0, 2, null, ProductStatus.ACTIVE,
                LocalDateTime.now(), LocalDateTime.now()
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-BASIC")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenReturn(productWithoutBrand);

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertNull(response.getBarcode());
        assertNull(response.getBrand());
        verify(brandRepository, never()).findById(any());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void createProduct_DuplicateSku_ThrowsDuplicateResourceException() {
        ProductRequest request = new ProductRequest(
                "Item", "SKU-WH-001", null,
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-WH-001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createProduct_DuplicateBarcode_ThrowsDuplicateResourceException() {
        ProductRequest request = new ProductRequest(
                "Item", "SKU-UNIQUE", "BARCODE-12345",
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-UNIQUE")).thenReturn(false);
        when(productRepository.existsByBarcodeIgnoreCase("BARCODE-12345")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createProduct_CategoryNotFound_ThrowsResourceNotFoundException() {
        ProductRequest request = new ProductRequest(
                "Item", "SKU-UNIQUE", null,
                99L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-UNIQUE")).thenReturn(false);
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createProduct_BrandNotFound_ThrowsResourceNotFoundException() {
        ProductRequest request = new ProductRequest(
                "Item", "SKU-UNIQUE", null,
                1L, 99L, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        when(productRepository.existsBySkuIgnoreCase("SKU-UNIQUE")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(brandRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

        ProductResponse response = productService.getProductById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Wireless Headphones", response.getName());
    }

    @Test
    void getProductById_NotFound_ThrowsResourceNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void getAllProducts_WithStatus() {
        when(productRepository.findByStatus(ProductStatus.ACTIVE)).thenReturn(List.of(sampleProduct));

        List<ProductResponse> responses = productService.getAllProducts(ProductStatus.ACTIVE);

        assertEquals(1, responses.size());
        assertEquals("SKU-WH-001", responses.get(0).getSku());
    }

    @Test
    void getAllProducts_WithoutStatus() {
        when(productRepository.findAll()).thenReturn(List.of(sampleProduct));

        List<ProductResponse> responses = productService.getAllProducts(null);

        assertEquals(1, responses.size());
    }

    @Test
    void updateProduct_Success_PreservesStockQuantity() {
        sampleProduct.setStockQuantity(25); // Existing inventory count
        ProductRequest request = new ProductRequest(
                "Updated Headphones", "SKU-WH-001", "BARCODE-12345",
                1L, 1L, "White", null,
                new BigDecimal("55.00"), new BigDecimal("89.99"),
                10, null, ProductStatus.ACTIVE
        );

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.existsBySkuIgnoreCaseAndIdNot("SKU-WH-001", 1L)).thenReturn(false);
        when(productRepository.existsByBarcodeIgnoreCaseAndIdNot("BARCODE-12345", 1L)).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(brandRepository.findById(1L)).thenReturn(Optional.of(sampleBrand));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductResponse response = productService.updateProduct(1L, request);

        assertNotNull(response);
        assertEquals("Updated Headphones", sampleProduct.getName());
        assertEquals("White", sampleProduct.getColor());
        assertEquals(25, sampleProduct.getStockQuantity()); // Stock remains unchanged!
        verify(productRepository).save(sampleProduct);
    }

    @Test
    void updateProduct_DuplicateSku_ThrowsDuplicateResourceException() {
        ProductRequest request = new ProductRequest(
                "Item", "EXISTING-SKU", null,
                1L, null, null, null,
                new BigDecimal("10.00"), new BigDecimal("15.00"),
                2, null, ProductStatus.ACTIVE
        );

        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.existsBySkuIgnoreCaseAndIdNot("EXISTING-SKU", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.updateProduct(1L, request));
        verify(productRepository, never()).save(sampleProduct);
    }

    @Test
    void updateProductStatus_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
        when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

        ProductResponse response = productService.updateProductStatus(1L, ProductStatus.INACTIVE);

        assertNotNull(response);
        assertEquals(ProductStatus.INACTIVE, sampleProduct.getStatus());
        verify(productRepository).save(sampleProduct);
    }

    @Test
    void searchProducts_ByNameOrSkuOrBarcode() {
        when(productRepository.searchProducts("Headphones")).thenReturn(List.of(sampleProduct));

        List<ProductResponse> responses = productService.searchProducts("Headphones");

        assertEquals(1, responses.size());
        assertEquals("Wireless Headphones", responses.get(0).getName());
        verify(productRepository).searchProducts("Headphones");
    }

    @Test
    void searchProducts_EmptyQuery_ReturnsEmptyList() {
        List<ProductResponse> responses = productService.searchProducts("   ");

        assertTrue(responses.isEmpty());
        verify(productRepository, never()).searchProducts(any());
    }
}
