package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Category;
import com.inventory.inventorymanagement.entity.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Category> findByStatus(CategoryStatus status);
}
