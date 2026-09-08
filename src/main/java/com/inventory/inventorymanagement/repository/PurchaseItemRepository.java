package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.PurchaseItem;
import com.inventory.inventorymanagement.entity.PurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {

    List<PurchaseItem> findByPurchaseId(Long purchaseId);

    @Query("SELECT pi.purchasePrice FROM PurchaseItem pi " +
           "JOIN pi.purchase p " +
           "WHERE pi.product.id = :productId " +
           "  AND p.status = :status " +
           "ORDER BY p.purchaseDate DESC, p.id DESC")
    List<BigDecimal> findCompletedPurchasePricesOrderByDateDesc(
            @Param("productId") Long productId,
            @Param("status") PurchaseStatus status
    );
}
