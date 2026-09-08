package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {

    Optional<SalePayment> findBySaleId(Long saleId);
}
