package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Customer;
import com.inventory.inventorymanagement.entity.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    boolean existsByPhone(String phone);

    @Query("SELECT c FROM Customer c " +
           "WHERE (:status IS NULL OR c.status = :status) " +
           "  AND (:query IS NULL OR :query = '' " +
           "       OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "       OR c.phone LIKE CONCAT('%', :query, '%') " +
           "       OR (c.email IS NOT NULL AND LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY c.name ASC")
    List<Customer> findWithFilters(@Param("query") String query, @Param("status") CustomerStatus status);
}
