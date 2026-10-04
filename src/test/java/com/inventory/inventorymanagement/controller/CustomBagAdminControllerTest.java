package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.repository.UserRepository;
import com.inventory.inventorymanagement.service.CustomBagRequestService;
import com.inventory.inventorymanagement.service.CustomBagLogoStorageService.StoredLogo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomBagAdminController.class)
class CustomBagAdminControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean CustomBagRequestService service;
    @MockBean UserRepository users;

    @Test void allAdminEndpointsRejectAnonymous() throws Exception {
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7/logo")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/7").contentType("application/json")
                .content("{\"status\":\"REVIEWING\"}")).andExpect(status().isUnauthorized());
    }

    @Test void allAdminEndpointsRejectEveryNonAdminRole() throws Exception {
        for (String role : new String[]{"CUSTOMER", "CASHIER", "INVENTORY_MANAGER"}) {
            mockMvc.perform(get("/api/v1/custom-bag-requests/admin").with(user(role).roles(role))).andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7").with(user(role).roles(role))).andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7/logo").with(user(role).roles(role))).andExpect(status().isForbidden());
            mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/7").with(user(role).roles(role))
                    .contentType("application/json").content("{\"status\":\"REVIEWING\"}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test void adminCanUseListDetailLogoAndUpdate() throws Exception {
        when(service.getAdminLogo(7L)).thenReturn(new StoredLogo(new ByteArrayResource(new byte[]{1, 2}), "image/png"));
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin?status=SUBMITTED&requestNumber=CBR&customer=bag")
                .with(user("admin").roles("ADMIN"))).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7").with(user("admin").roles("ADMIN"))).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/custom-bag-requests/admin/7/logo").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png")).andExpect(content().bytes(new byte[]{1, 2}));
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/7").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"status\":\"REVIEWING\",\"adminNote\":\"Review started\"}"))
                .andExpect(status().isOk());
    }

    @Test void updateValidatesRequiredStatusAndNoteLength() throws Exception {
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/7").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{}")) .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/api/v1/custom-bag-requests/admin/7").with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"status\":\"REVIEWING\",\"adminNote\":\"" + "x".repeat(1001) + "\"}"))
                .andExpect(status().isBadRequest());
    }
}
