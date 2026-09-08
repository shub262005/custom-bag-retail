package com.inventory.inventorymanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "purchase_sequences")
public class PurchaseSequence {

    @Id
    @Column(name = "year")
    private Integer year;

    @Column(name = "last_value", nullable = false)
    private Long lastValue = 0L;

    public PurchaseSequence() {
    }

    public PurchaseSequence(Integer year, Long lastValue) {
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
