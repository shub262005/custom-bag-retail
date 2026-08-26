package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.ProductRequest;
import com.inventory.inventorymanagement.dto.ProductResponse;
import com.inventory.inventorymanagement.entity.ProductStatus;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    ProductResponse getProductById(Long id);

    List<ProductResponse> getAllProducts(ProductStatus status);

    ProductResponse updateProduct(Long id, ProductRequest request);

    ProductResponse updateProductStatus(Long id, ProductStatus status);

    List<ProductResponse> searchProducts(String query);
}
