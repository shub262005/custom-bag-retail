package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.CustomerRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CustomerRepaymentRepository extends JpaRepository<CustomerRepayment, Long> {

    List<CustomerRepayment> findByCustomerIdOrderByRepaymentDateDescCreatedAtDesc(Long customerId);

    List<CustomerRepayment> findBySaleIdOrderByRepaymentDateDescCreatedAtDesc(Long saleId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM CustomerRepayment r WHERE r.customer.id = :customerId")
    BigDecimal getTotalRepaidByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM CustomerRepayment r")
    BigDecimal getTotalRepaidAll();
}
