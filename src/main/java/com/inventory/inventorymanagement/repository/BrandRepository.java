package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Brand;
import com.inventory.inventorymanagement.entity.BrandStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Brand> findByStatus(BrandStatus status);
}
