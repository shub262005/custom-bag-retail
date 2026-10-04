package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "custom_bag_request_sequences")
public class CustomBagRequestSequence {
    @Id private Integer year;
    @Column(name = "last_value", nullable = false) private Long lastValue;
    public CustomBagRequestSequence() { }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Long getLastValue() { return lastValue; }
    public void setLastValue(Long lastValue) { this.lastValue = lastValue; }
}
