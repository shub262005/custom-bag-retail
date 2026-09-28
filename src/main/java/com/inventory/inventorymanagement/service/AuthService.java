package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.AuthResponse;
import com.inventory.inventorymanagement.dto.LoginRequest;
import com.inventory.inventorymanagement.dto.RegisterRequest;
import com.inventory.inventorymanagement.dto.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
