package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.InventoryTransaction;
import com.inventory.inventorymanagement.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByProductIdOrderByCreatedAtDesc(Long productId);

    @Query("SELECT it FROM InventoryTransaction it " +
           "JOIN FETCH it.product p " +
           "WHERE (:productId IS NULL OR p.id = :productId) " +
           "  AND (:transactionType IS NULL OR it.transactionType = :transactionType) " +
           "  AND (CAST(:startDate AS timestamp) IS NULL OR it.createdAt >= :startDate) " +
           "  AND (CAST(:endDate AS timestamp) IS NULL OR it.createdAt <= :endDate) " +
           "ORDER BY it.createdAt DESC")
    List<InventoryTransaction> findWithFilters(
            @Param("productId") Long productId,
            @Param("transactionType") TransactionType transactionType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    List<InventoryTransaction> findByReferenceIdOrderByCreatedAtAsc(String referenceId);
}
