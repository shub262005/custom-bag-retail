package com.inventory.inventorymanagement.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.*;
import jakarta.persistence.EntityManager;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Opt in with -Dauthorization.postgres.tests=true. Exercises real JWTs, PostgreSQL,
 * authorization filters, sale mutations, and persisted audit identities in one transaction.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "file:src/main/resources/application.properties")
@EnabledIfSystemProperty(named = "authorization.postgres.tests", matches = "true")
@Transactional
class AuthorizationPostgresRegressionTest {
    private static final String PASSWORD = "RoleRegression!2026";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired SaleRepository sales;
    @Autowired SaleAuditHistoryRepository audits;
    @Autowired EntityManager entityManager;

    @Test
    void realRoleTokensEnforceMatrixAndPersistSaleActors() throws Exception {
        String marker = UUID.randomUUID().toString().replace("-", "");
        String adminEmail = "admin-" + marker + "@roopam.local";
        String managerEmail = "manager-" + marker + "@roopam.local";
        String cashierEmail = "cashier-" + marker + "@roopam.local";
        String customerEmail = "customer-" + marker + "@roopam.local";

        createUser(adminEmail, UserRole.ADMIN);
        createUser(managerEmail, UserRole.INVENTORY_MANAGER);
        createUser(cashierEmail, UserRole.CASHIER);
        createUser(customerEmail, UserRole.CUSTOMER);

        String admin = login(adminEmail);
        String manager = login(managerEmail);
        String cashier = login(cashierEmail);
        String customer = login(customerEmail);

        Category category = categories.save(new Category("Authz " + marker, CategoryStatus.ACTIVE));
        Product product = products.save(new Product(null, "Role bag " + marker, marker,
                "BC" + marker, category, null, null, null, new BigDecimal("50.00"),
                new BigDecimal("100.00"), 20, 1, null, ProductStatus.ACTIVE, null, null));
        entityManager.flush();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(customer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("CUSTOMER"));
        assertForbidden(get("/api/v1/products"), customer);
        assertForbidden(get("/api/v1/sales"), customer);

        mockMvc.perform(get("/api/v1/products").header("Authorization", bearer(cashier)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/sales/dashboard").header("Authorization", bearer(cashier)))
                .andExpect(status().isOk());
        assertForbidden(get("/api/v1/categories"), cashier);
        assertForbidden(get("/api/v1/sales/reports/daily"), cashier);
        assertForbidden(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content("{}"), cashier);

        String createBody = saleBody(product.getId(), 2);
        String createdJson = mockMvc.perform(post("/api/v1/sales")
                        .header("Authorization", bearer(cashier))
                        .contentType(MediaType.APPLICATION_JSON).content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long saleId = objectMapper.readTree(createdJson).get("id").asLong();

        mockMvc.perform(put("/api/v1/sales/{id}", saleId)
                        .header("Authorization", bearer(cashier))
                        .contentType(MediaType.APPLICATION_JSON).content(saleEditBody(product.getId(), 3)))
                .andExpect(status().isOk());
        assertForbidden(patch("/api/v1/sales/{id}/cancel", saleId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"WRONG_SALE_ENTRY\"}"), cashier);
        assertEquals(SaleStatus.COMPLETED, sales.findById(saleId).orElseThrow().getStatus());

        mockMvc.perform(patch("/api/v1/sales/{id}/cancel", saleId)
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"WRONG_SALE_ENTRY\",\"description\":\"role regression\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cancelledBy").value(managerEmail));

        String adminSaleJson = mockMvc.perform(post("/api/v1/sales")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(saleBody(product.getId(), 1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long adminSaleId = objectMapper.readTree(adminSaleJson).get("id").asLong();
        entityManager.flush();
        entityManager.clear();

        List<SaleAuditHistory> cashierHistory = audits.findBySaleIdOrderByCreatedAtDesc(saleId);
        assertEquals(3, cashierHistory.size());
        assertEquals(managerEmail, cashierHistory.get(0).getUserId());
        assertTrue(cashierHistory.stream()
                .filter(a -> a.getActionType() != SaleAuditAction.SALE_CANCELLED)
                .allMatch(a -> cashierEmail.equals(a.getUserId())));
        assertEquals(adminEmail, audits.findBySaleIdOrderByCreatedAtDesc(adminSaleId).get(0).getUserId());
    }

    private void createUser(String email, UserRole role) {
        users.save(new AppUser(role.name(), email, passwordEncoder.encode(PASSWORD), role, UserStatus.ACTIVE));
    }

    private String login(String email) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginBody(email, PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(body);
        return response.get("token").asText();
    }

    private void assertForbidden(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                                 String token) throws Exception {
        mockMvc.perform(request.header("Authorization", bearer(token)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    private String saleBody(long productId, int quantity) {
        return """
                {"saleDate":"%s","items":[{"productId":%d,"quantity":%d,"sellingPrice":100.00}],
                 "paymentMethod":"CASH","paymentDescription":"role regression"}
                """.formatted(LocalDate.now(), productId, quantity);
    }

    private String saleEditBody(long productId, int quantity) {
        return """
                {"items":[{"productId":%d,"quantity":%d,"sellingPrice":100.00}],
                 "paymentMethod":"CASH","reducePaymentOnTotalDecrease":true}
                """.formatted(productId, quantity);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record LoginBody(String email, String password) { }
}
