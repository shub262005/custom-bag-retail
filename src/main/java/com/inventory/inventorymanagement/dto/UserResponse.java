package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;

public record UserResponse(Long id, String name, String email, UserRole role) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
