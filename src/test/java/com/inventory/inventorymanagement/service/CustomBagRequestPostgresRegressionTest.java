package com.inventory.inventorymanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.security.JwtTokenService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Opt in with -Dcustombag.postgres.tests=true. Exercises the real PostgreSQL
 * migration, JWT filter, multipart endpoint, persistence, and module isolation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "file:src/main/resources/application.properties",
        properties = "app.upload.custom-bag-logo-dir=target/test-custom-bag-uploads")
@EnabledIfSystemProperty(named = "custombag.postgres.tests", matches = "true")
@Transactional
class CustomBagRequestPostgresRegressionTest {
    private static final String PASSWORD = "CustomBagRegression!2026";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtTokenService tokens;
    @Autowired UserRepository users;
    @Autowired CustomBagRequestRepository requests;
    @Autowired ProductRepository products;
    @Autowired SaleRepository sales;
    @Autowired PurchaseRepository purchases;
    @Autowired InventoryTransactionRepository inventory;
    @Autowired EntityManager entityManager;

    private final List<String> logoReferences = new ArrayList<>();

    @AfterEach
    void removeUploadedFixtures() throws Exception {
        Path directory = Path.of("target/test-custom-bag-uploads").toAbsolutePath().normalize();
        for (String reference : logoReferences) {
            Files.deleteIfExists(directory.resolve(Path.of(reference).getFileName()).normalize());
        }
    }

    @Test
    void persistsTwoIndependentCustomerRequestsWithoutInventoryOrCommerceSideEffects() throws Exception {
        String marker = UUID.randomUUID().toString().replace("-", "");
        AppUser customer = users.saveAndFlush(new AppUser("Bag Customer", "bag-" + marker + "@roopam.local",
                passwordEncoder.encode(PASSWORD), UserRole.CUSTOMER, UserStatus.ACTIVE));
        String token = tokens.generate(customer);
        AppUser customerB = users.saveAndFlush(new AppUser("Bag Customer B", "bag-b-" + marker + "@roopam.local",
                passwordEncoder.encode(PASSWORD), UserRole.CUSTOMER, UserStatus.ACTIVE));
        AppUser emptyCustomer = users.saveAndFlush(new AppUser("Empty Bag Customer", "bag-empty-" + marker + "@roopam.local",
                passwordEncoder.encode(PASSWORD), UserRole.CUSTOMER, UserStatus.ACTIVE));
        AppUser admin = users.saveAndFlush(new AppUser("Bag Admin", "bag-admin-" + marker + "@roopam.local",
                passwordEncoder.encode(PASSWORD), UserRole.ADMIN, UserStatus.ACTIVE));
        String adminToken = tokens.generate(admin);
        String tokenB = tokens.generate(customerB);

        long productCount = products.count();
        long saleCount = sales.count();
        long purchaseCount = purchases.count();
        long inventoryCount = inventory.count();

        JsonNode firstResponse = submit(token, """
                {"requestType":"STANDARD","bagType":"BACKPACK","size":"MEDIUM","material":"CANVAS",
                 "bodyColor":"NAVY","pocketColor":"BLACK","strapColor":"GRAY","frontPocket":true,
                 "sidePockets":true,"compartmentCount":2,"laptopPadding":true,"waterResistant":true,
                 "logoPosition":"UPPER_FRONT","customText":"ROOPAM","textColor":"WHITE",
                 "textPosition":"FRONT_POCKET","customerNotes":"Call before producing"}
                """, new MockMultipartFile("logo", "original-brand.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3}));
        JsonNode secondResponse = submit(token, """
                {"requestType":"STANDARD","bagType":"DUFFEL_BAG","size":"LARGE","material":"LEATHER",
                 "bodyColor":"BROWN","pocketColor":"BLACK","strapColor":"BLACK","frontPocket":false,
                 "sidePockets":true,"compartmentCount":4,"laptopPadding":false,"waterResistant":false}
                """, null);
        JsonNode customerBResponse = submit(tokenB, """
                {"requestType":"STANDARD","bagType":"LAPTOP_BAG","size":"SMALL","material":"POLYESTER",
                 "bodyColor":"BLUE","pocketColor":"NAVY","strapColor":"BLACK","frontPocket":true,
                 "sidePockets":false,"compartmentCount":1,"laptopPadding":true,"waterResistant":false}
                """, null);

        long firstId = firstResponse.get("id").asLong();
        long secondId = secondResponse.get("id").asLong();
        long customerBId = customerBResponse.get("id").asLong();
        assertNotEquals(firstId, secondId);
        assertNotEquals(firstResponse.get("requestNumber").asText(), secondResponse.get("requestNumber").asText());
        assertTrue(firstResponse.get("requestNumber").asText().matches("CBR-\\d{4}-\\d{6}"));

        entityManager.flush();
        entityManager.clear();
        CustomBagRequest first = requests.findById(firstId).orElseThrow();
        CustomBagRequest second = requests.findById(secondId).orElseThrow();
        logoReferences.add(first.getLogoReference());

        assertEquals(customer.getId(), first.getCustomer().getId());
        assertEquals(customer.getId(), second.getCustomer().getId());
        assertEquals(CustomBagRequestStatus.SUBMITTED, first.getStatus());
        assertEquals(CustomBagRequestStatus.SUBMITTED, second.getStatus());
        assertEquals(new BigDecimal("2500.00"), first.getEstimatedPrice());
        assertEquals(new BigDecimal("2850.00"), second.getEstimatedPrice());
        assertEquals("ROOPAM", first.getCustomText());
        assertEquals("Call before producing", first.getCustomerNotes());
        assertNotNull(first.getLogoReference());
        assertTrue(first.getLogoReference().startsWith("custom-bag-logos/"));
        assertNull(second.getLogoReference());
        assertNull(second.getCustomText());
        assertNotNull(first.getCreatedAt());
        assertNotNull(first.getUpdatedAt());
        assertNotNull(second.getCreatedAt());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(secondId)).andExpect(jsonPath("$[1].id").value(firstId));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(customerBId));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine")
                        .header("Authorization", "Bearer " + tokens.generate(emptyCustomer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine/{id}", firstId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.customer.id").value(customer.getId()));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine/{id}", customerBId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine/{id}/logo", firstId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine/{id}/logo", firstId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/custom-bag-requests/mine/{id}/logo", secondId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/custom-bag-requests/admin")
                        .param("status", "SUBMITTED").param("requestNumber", firstResponse.get("requestNumber").asText())
                        .param("customer", customer.getEmail()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(firstId)).andExpect(jsonPath("$[0].customer.id").value(customer.getId()));
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/{id}", customerBId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.customer.id").value(customerB.getId()));
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/{id}/logo", firstId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/{id}", firstId)
                        .header("Authorization", "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWING\",\"adminNote\":\"  Design is being reviewed  \"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REVIEWING"))
                .andExpect(jsonPath("$.adminNote").value("Design is being reviewed"));
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/{id}", firstId)
                        .header("Authorization", "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APPROVED\",\"adminNote\":\"Approved for production\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine/{id}", firstId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.adminNote").value("Approved for production"));

        assertEquals(productCount, products.count());
        assertEquals(saleCount, sales.count());
        assertEquals(purchaseCount, purchases.count());
        assertEquals(inventoryCount, inventory.count());
    }

    @Test
    void inactiveCustomerTokenCannotSubmit() throws Exception {
        String marker = UUID.randomUUID().toString().replace("-", "");
        AppUser inactive = users.saveAndFlush(new AppUser("Inactive Bag Customer",
                "inactive-bag-" + marker + "@roopam.local", passwordEncoder.encode(PASSWORD),
                UserRole.CUSTOMER, UserStatus.INACTIVE));

        MockMultipartFile request = jsonPart("""
                {"bagType":"BACKPACK","size":"SMALL","material":"POLYESTER","bodyColor":"BLACK",
                 "pocketColor":"BLACK","strapColor":"BLACK","frontPocket":false,"sidePockets":false,
                 "compartmentCount":1,"laptopPadding":false,"waterResistant":false}
                """);
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(request)
                        .header("Authorization", "Bearer " + tokens.generate(inactive)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401));
    }

    private JsonNode submit(String token, String body, MockMultipartFile logo) throws Exception {
        var builder = multipart("/api/v1/custom-bag-requests").file(jsonPart(body));
        if (logo != null) builder.file(logo);
        String response = mockMvc.perform(builder.header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.customer.email").exists())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private MockMultipartFile jsonPart(String body) {
        return new MockMultipartFile("request", "request.json", MediaType.APPLICATION_JSON_VALUE, body.getBytes());
    }
}
