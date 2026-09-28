package com.inventory.inventorymanagement.security;

import com.inventory.inventorymanagement.controller.*;
import com.inventory.inventorymanagement.repository.UserRepository;
import com.inventory.inventorymanagement.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({ProductController.class, CategoryController.class, BrandController.class,
        InventoryTransactionController.class, SupplierController.class, PurchaseController.class,
        SaleController.class})
class AuthorizationMatrixTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean private ProductService productService;
    @MockBean private CategoryService categoryService;
    @MockBean private BrandService brandService;
    @MockBean private InventoryTransactionService inventoryTransactionService;
    @MockBean private SupplierService supplierService;
    @MockBean private PurchaseService purchaseService;
    @MockBean private SaleService saleService;
    @MockBean private UserRepository userRepository;

    @Test
    void anonymousBusinessRequestsReturnStructured401() throws Exception {
        for (String path : new String[]{
                "/api/v1/products", "/api/v1/categories", "/api/v1/brands",
                "/api/v1/inventory-transactions", "/api/v1/suppliers", "/api/v1/purchases",
                "/api/v1/sales", "/api/v1/sales/dashboard", "/api/v1/sales/reports/daily"}) {
            mockMvc.perform(get(path))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"))
                    .andExpect(jsonPath("$.path").value(path));
        }
    }

    @Test
    void customerCannotAccessBusinessApisAndGetsStructured403() throws Exception {
        for (String path : new String[]{
                "/api/v1/products", "/api/v1/categories", "/api/v1/inventory-transactions",
                "/api/v1/suppliers", "/api/v1/purchases", "/api/v1/sales",
                "/api/v1/sales/dashboard", "/api/v1/sales/reports/daily"}) {
            mockMvc.perform(get(path).with(user("customer@example.com").roles("CUSTOMER")))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"))
                    .andExpect(jsonPath("$.path").value(path));
        }
    }

    @Test
    void cashierCanReadProductsAndOperateSalesButCannotManageOrReport() throws Exception {
        var cashier = user("cashier@example.com").roles("CASHIER");

        mockMvc.perform(get("/api/v1/products").with(cashier)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/sales").with(cashier)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/sales/dashboard").with(cashier)).andExpect(status().isOk());

        assertAuthorized(post("/api/v1/sales").contentType(MediaType.APPLICATION_JSON).content("{}")
                .with(cashier));
        assertAuthorized(put("/api/v1/sales/1").contentType(MediaType.APPLICATION_JSON).content("{}")
                .with(cashier));

        mockMvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content("{}")
                        .with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/categories").with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/inventory-transactions").with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/suppliers").with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/purchases").with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/sales/reports/daily").with(cashier)).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/v1/sales/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON).content("{}").with(cashier))
                .andExpect(status().isForbidden());
    }

    @Test
    void inventoryManagerAndAdminCanReachManagementAndPrivilegedSaleEndpoints() throws Exception {
        for (String role : new String[]{"INVENTORY_MANAGER", "ADMIN"}) {
            var staff = user(role.toLowerCase() + "@example.com").roles(role);
            mockMvc.perform(get("/api/v1/categories").with(staff)).andExpect(status().isOk());
            mockMvc.perform(get("/api/v1/brands").with(staff)).andExpect(status().isOk());
            mockMvc.perform(get("/api/v1/inventory-transactions").with(staff)).andExpect(status().isOk());
            mockMvc.perform(get("/api/v1/suppliers").with(staff)).andExpect(status().isOk());
            mockMvc.perform(get("/api/v1/purchases").with(staff)).andExpect(status().isOk());
            mockMvc.perform(get("/api/v1/sales/reports/daily").with(staff)).andExpect(status().isOk());

            assertAuthorized(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content("{}")
                    .with(staff));
            assertAuthorized(patch("/api/v1/sales/1/cancel").contentType(MediaType.APPLICATION_JSON)
                    .content("{}").with(staff));
        }
    }

    private void assertAuthorized(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request)
            throws Exception {
        mockMvc.perform(request).andExpect(result -> {
            int status = result.getResponse().getStatus();
            assertNotEquals(401, status, "authenticated request must not be treated as anonymous");
            assertNotEquals(403, status, "role must be allowed through the security filter");
        });
    }
}
