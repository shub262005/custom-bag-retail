package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Product;
import com.inventory.inventorymanagement.entity.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    Optional<Product> findByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCase(String barcode);

    boolean existsByBarcodeIgnoreCaseAndIdNot(String barcode, Long id);

    List<Product> findByStatus(ProductStatus status);

    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.category " +
           "LEFT JOIN FETCH p.brand " +
           "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR (p.barcode IS NOT NULL AND LOWER(p.barcode) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query);
}
