package com.inventory.inventorymanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sale_sequences")
public class SaleSequence {

    @Id
    @Column(name = "year")
    private Integer year;

    @Column(name = "last_value", nullable = false)
    private Long lastValue = 0L;

    public SaleSequence() {
    }

    public SaleSequence(Integer year, Long lastValue) {
        this.year = year;
        this.lastValue = lastValue;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Long getLastValue() {
        return lastValue;
    }

    public void setLastValue(Long lastValue) {
        this.lastValue = lastValue;
    }
}
