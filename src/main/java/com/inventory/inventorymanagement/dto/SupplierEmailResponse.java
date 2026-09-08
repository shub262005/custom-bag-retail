package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.SupplierEmail;

public class SupplierEmailResponse {

    private Long id;
    private String email;
    private String label;

    public SupplierEmailResponse() {
    }

    public SupplierEmailResponse(Long id, String email, String label) {
        this.id = id;
        this.email = email;
        this.label = label;
    }

    public static SupplierEmailResponse fromEntity(SupplierEmail email) {
        if (email == null) {
            return null;
        }
        return new SupplierEmailResponse(email.getId(), email.getEmail(), email.getLabel());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
