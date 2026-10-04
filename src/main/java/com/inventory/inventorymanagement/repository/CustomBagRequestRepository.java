package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.CustomBagRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomBagRequestRepository extends JpaRepository<CustomBagRequest, Long> {
    List<CustomBagRequest> findAllByCustomerIdOrderByCreatedAtDescIdDesc(Long customerId);
    Optional<CustomBagRequest> findByIdAndCustomerId(Long id, Long customerId);
}
