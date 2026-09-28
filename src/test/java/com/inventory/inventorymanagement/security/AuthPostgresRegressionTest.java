package com.inventory.inventorymanagement.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Opt in with -Dauth.postgres.tests=true. Uses the development PostgreSQL database
 * and real Flyway/JPA configuration; all test-created users roll back.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "file:src/main/resources/application.properties")
@EnabledIfSystemProperty(named = "auth.postgres.tests", matches = "true")
@Transactional
class AuthPostgresRegressionTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;

    @Test
    void registrationLoginAndMeUseRealPostgresAndBcrypt() throws Exception {
        String email = "auth-postgres-regression@roopam.local";
        String password = "Regression!2026";

        String registration = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Postgres Regression","email":"AUTH-POSTGRES-REGRESSION@ROOPAM.LOCAL",
                                 "password":"Regression!2026","role":"ADMIN"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertFalse(registration.contains(password));

        AppUser persisted = users.findByEmail(email).orElseThrow();
        assertNotEquals(password, persisted.getPasswordHash());
        assertTrue(persisted.getPasswordHash().startsWith("$2"));
        assertTrue(passwordEncoder.matches(password, persisted.getPasswordHash()));

        String loginBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"auth-postgres-regression@roopam.local\",\"password\":\"Regression!2026\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        JsonNode login = objectMapper.readTree(loginBody);
        String token = login.get("token").asText();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"auth-postgres-regression@roopam.local\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }
}
