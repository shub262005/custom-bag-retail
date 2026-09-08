package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.Supplier;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<Supplier> findByGstNumberIgnoreCase(String gstNumber);

    boolean existsByGstNumberIgnoreCase(String gstNumber);

    boolean existsByGstNumberIgnoreCaseAndIdNot(String gstNumber, Long id);

    List<Supplier> findByStatus(SupplierStatus status);

    @Query("SELECT DISTINCT s FROM Supplier s " +
           "LEFT JOIN s.phones p " +
           "LEFT JOIN s.emails e " +
           "WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "   OR (s.gstNumber IS NOT NULL AND LOWER(s.gstNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "   OR (p.phoneNumber IS NOT NULL AND LOWER(p.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "   OR (e.email IS NOT NULL AND LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Supplier> searchSuppliers(@Param("query") String query);
}
