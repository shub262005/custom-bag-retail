package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.ProductRequest;
import com.inventory.inventorymanagement.dto.ProductResponse;
import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.Category;
import com.inventory.inventorymanagement.entity.Product;
import com.inventory.inventorymanagement.entity.ProductStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.BrandRepository;
import com.inventory.inventorymanagement.repository.CategoryRepository;
import com.inventory.inventorymanagement.repository.ProductRepository;
import com.inventory.inventorymanagement.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              BrandRepository brandRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        String trimmedSku = request.getSku().trim();

        if (productRepository.existsBySkuIgnoreCase(trimmedSku)) {
            throw new DuplicateResourceException("Product with SKU '" + trimmedSku + "' already exists");
        }

        String trimmedBarcode = sanitizeBarcode(request.getBarcode());
        if (trimmedBarcode != null && productRepository.existsByBarcodeIgnoreCase(trimmedBarcode)) {
            throw new DuplicateResourceException("Product with barcode '" + trimmedBarcode + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        }

        Product product = new Product();
        product.setName(request.getName().trim());
        product.setSku(trimmedSku);
        product.setBarcode(trimmedBarcode);
        product.setCategory(category);
        product.setBrand(brand);
        product.setColor(request.getColor() != null ? request.getColor().trim() : null);
        product.setCapacity(request.getCapacity() != null ? request.getCapacity().trim() : null);
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setStockQuantity(0); // Initialized to 0
        product.setMinimumStock(request.getMinimumStock());
        product.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE);

        Product savedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(savedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return ProductResponse.fromEntity(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts(ProductStatus status) {
        List<Product> products;
        if (status != null) {
            products = productRepository.findByStatus(status);
        } else {
            products = productRepository.findAll();
        }
        return products.stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        String trimmedSku = request.getSku().trim();
        if (productRepository.existsBySkuIgnoreCaseAndIdNot(trimmedSku, id)) {
            throw new DuplicateResourceException("Product with SKU '" + trimmedSku + "' already exists");
        }

        String trimmedBarcode = sanitizeBarcode(request.getBarcode());
        if (trimmedBarcode != null && productRepository.existsByBarcodeIgnoreCaseAndIdNot(trimmedBarcode, id)) {
            throw new DuplicateResourceException("Product with barcode '" + trimmedBarcode + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Brand brand = null;
        if (request.getBrandId() != null) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        }

        product.setName(request.getName().trim());
        product.setSku(trimmedSku);
        product.setBarcode(trimmedBarcode);
        product.setCategory(category);
        product.setBrand(brand);
        product.setColor(request.getColor() != null ? request.getColor().trim() : null);
        product.setCapacity(request.getCapacity() != null ? request.getCapacity().trim() : null);
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        // Note: stockQuantity is preserved and NOT modified during product updates
        product.setMinimumStock(request.getMinimumStock());
        product.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product updatedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(updatedProduct);
    }

    @Override
    public ProductResponse updateProductStatus(Long id, ProductStatus status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStatus(status);
        Product updatedProduct = productRepository.save(product);
        return ProductResponse.fromEntity(updatedProduct);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> products = productRepository.searchProducts(query.trim());
        return products.stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }

    private String sanitizeBarcode(String barcode) {
        if (barcode == null) {
            return null;
        }
        String trimmed = barcode.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
