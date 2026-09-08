package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.PurchasePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchasePaymentRepository extends JpaRepository<PurchasePayment, Long> {

    List<PurchasePayment> findByPurchaseId(Long purchaseId);
}
