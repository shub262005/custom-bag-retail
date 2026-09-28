package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.entity.UserStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.repository.UserRepository;
import com.inventory.inventorymanagement.security.JwtTokenService;
import com.inventory.inventorymanagement.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {
    @Autowired MockMvc mockMvc;
    @Autowired JwtTokenService tokenService;
    @MockBean AuthService authService;
    @MockBean UserRepository users;
    private AppUser user;

    @BeforeEach
    void setUp() {
        user = new AppUser("Customer", "customer@example.com", "$2a$10$not-returned",
                UserRole.CUSTOMER, UserStatus.ACTIVE);
        user.setId(11L);
    }

    @Test
    void registerReturnsCreatedCustomerAndIgnoresClientRole() throws Exception {
        when(authService.register(any())).thenReturn(new UserResponse(11L, "Customer",
                "customer@example.com", UserRole.CUSTOMER));
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Customer","email":"customer@example.com",
                                 "password":"password123","role":"ADMIN"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void duplicateRegistrationReturnsConflict() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateResourceException("An account with this email already exists"));
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Customer\",\"email\":\"customer@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidEmailAndShortPasswordReturnValidationErrors() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Customer\",\"email\":\"invalid\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    void loginReturnsTokenAndSafeUser() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("signed.jwt.token",
                new UserResponse(11L, "Customer", "customer@example.com", UserRole.CUSTOMER)));
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"customer@example.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("signed.jwt.token"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void meWithValidTokenReturnsAuthenticatedUser() throws Exception {
        when(users.findById(11L)).thenReturn(Optional.of(user));
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenService.generate(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.email").value("customer@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void meWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void meWithInvalidTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
