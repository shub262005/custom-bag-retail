package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.SaleAuditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleAuditHistoryRepository extends JpaRepository<SaleAuditHistory, Long> {

    List<SaleAuditHistory> findBySaleIdOrderByCreatedAtDesc(Long saleId);
}
