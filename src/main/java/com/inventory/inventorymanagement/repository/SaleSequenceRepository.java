package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.SaleSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SaleSequenceRepository extends JpaRepository<SaleSequence, Integer> {

    @Query(value = "INSERT INTO sale_sequences (year, last_value) VALUES (:year, 1) " +
                   "ON CONFLICT (year) DO UPDATE SET last_value = sale_sequences.last_value + 1 " +
                   "RETURNING last_value", nativeQuery = true)
    Long getNextSequenceValue(@Param("year") int year);
}
