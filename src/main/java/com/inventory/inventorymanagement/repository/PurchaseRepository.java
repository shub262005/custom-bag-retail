package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Purchase;
import com.inventory.inventorymanagement.entity.PurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    Optional<Purchase> findByPurchaseNumber(String purchaseNumber);

    boolean existsByPurchaseNumber(String purchaseNumber);

    List<Purchase> findByStatus(PurchaseStatus status);

    @Query("SELECT DISTINCT p FROM Purchase p " +
           "JOIN FETCH p.supplier s " +
           "WHERE (:supplierId IS NULL OR s.id = :supplierId) " +
           "  AND (:status IS NULL OR p.status = :status) " +
           "  AND (CAST(:startDate AS date) IS NULL OR p.purchaseDate >= :startDate) " +
           "  AND (CAST(:endDate AS date) IS NULL OR p.purchaseDate <= :endDate) " +
           "  AND (:query IS NULL OR :query = '' " +
           "       OR LOWER(p.purchaseNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "       OR (p.invoiceNumber IS NOT NULL AND LOWER(p.invoiceNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "       OR LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.purchaseDate DESC, p.id DESC")
    List<Purchase> findWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("status") PurchaseStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("query") String query
    );
}
