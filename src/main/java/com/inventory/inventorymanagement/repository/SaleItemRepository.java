package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    List<SaleItem> findBySaleId(Long saleId);

    @Query("SELECT item.product.id, item.product.name, item.product.sku, SUM(item.quantity), SUM(item.itemTotal) " +
           "FROM SaleItem item " +
           "WHERE item.sale.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND item.sale.saleDate BETWEEN :startDate AND :endDate " +
           "GROUP BY item.product.id, item.product.name, item.product.sku " +
           "ORDER BY SUM(item.itemTotal) DESC")
    List<Object[]> getSalesByProduct(@Param("startDate") LocalDate startDate,
                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT item.product.category.id, item.product.category.name, SUM(item.quantity), SUM(item.itemTotal) " +
           "FROM SaleItem item " +
           "WHERE item.sale.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND item.sale.saleDate BETWEEN :startDate AND :endDate " +
           "GROUP BY item.product.category.id, item.product.category.name " +
           "ORDER BY SUM(item.itemTotal) DESC")
    List<Object[]> getSalesByCategory(@Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    @Query("SELECT item.product.id, item.product.name, item.product.sku, SUM(item.quantity), SUM(item.itemTotal) " +
           "FROM SaleItem item " +
           "WHERE item.sale.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND item.sale.saleDate = :saleDate " +
           "GROUP BY item.product.id, item.product.name, item.product.sku " +
           "ORDER BY SUM(item.quantity) DESC")
    List<Object[]> getTopSellingProducts(@Param("saleDate") LocalDate saleDate, Pageable pageable);
}
