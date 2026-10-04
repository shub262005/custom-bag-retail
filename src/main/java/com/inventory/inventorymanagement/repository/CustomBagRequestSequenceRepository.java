package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.CustomBagRequestSequence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomBagRequestSequenceRepository extends JpaRepository<CustomBagRequestSequence, Integer> {
    @Query(value = "INSERT INTO custom_bag_request_sequences (year, last_value) VALUES (:year, 1) " +
            "ON CONFLICT (year) DO UPDATE SET last_value = custom_bag_request_sequences.last_value + 1 " +
            "RETURNING last_value", nativeQuery = true)
    Long getNextSequenceValue(@Param("year") int year);
}
