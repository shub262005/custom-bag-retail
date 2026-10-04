package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.repository.UserRepository;
import com.inventory.inventorymanagement.service.CustomBagRequestService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.mockito.Mockito.when;
import com.inventory.inventorymanagement.service.CustomBagLogoStorageService.StoredLogo;
import org.springframework.core.io.ByteArrayResource;

@WebMvcTest(CustomBagRequestController.class)
class CustomBagRequestControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean CustomBagRequestService service;
    @MockBean UserRepository users;

    private MockMultipartFile request() {
        return new MockMultipartFile("request", "", "application/json", """
                {"bagType":"BACKPACK","size":"MEDIUM","material":"POLYESTER",
                 "bodyColor":"NAVY","pocketColor":"BLUE","strapColor":"BLACK",
                 "frontPocket":true,"sidePockets":true,"compartmentCount":2,
                 "laptopPadding":false,"waterResistant":false,"customerUserId":999}
                """.getBytes());
    }

    @Test void anonymousIs401() throws Exception {
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(request())).andExpect(status().isUnauthorized());
    }
    @Test void cashierAndAdminAre403() throws Exception {
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(request()).with(user("c").roles("CASHIER"))).andExpect(status().isForbidden());
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(request()).with(user("a").roles("ADMIN"))).andExpect(status().isForbidden());
    }
    @Test void customerIsAllowedAndInjectedOwnershipFieldIsIgnored() throws Exception {
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(request()).with(user("customer").roles("CUSTOMER"))).andExpect(status().isCreated());
    }
    @Test void invalidEnumAndTextLengthAre400() throws Exception {
        MockMultipartFile invalid = new MockMultipartFile("request", "", "application/json",
                "{\"bagType\":\"UNKNOWN\"}".getBytes());
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(invalid).with(user("customer").roles("CUSTOMER"))).andExpect(status().isBadRequest());
        String text = "x".repeat(25);
        MockMultipartFile tooLong = new MockMultipartFile("request", "", "application/json", ("""
                {"bagType":"BACKPACK","size":"MEDIUM","material":"POLYESTER",
                "bodyColor":"NAVY","pocketColor":"BLUE","strapColor":"BLACK","compartmentCount":2,
                "customText":"%s","textColor":"WHITE","textPosition":"CENTER"}
                """.formatted(text)).getBytes());
        mockMvc.perform(multipart("/api/v1/custom-bag-requests").file(tooLong).with(user("customer").roles("CUSTOMER"))).andExpect(status().isBadRequest());
    }

    @Test void mineEndpointsAreCustomerOnly() throws Exception {
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine").with(user("cashier").roles("CASHIER"))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine").with(user("manager").roles("INVENTORY_MANAGER"))).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine").with(user("customer").roles("CUSTOMER"))).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine/7").with(user("customer").roles("CUSTOMER"))).andExpect(status().isOk());
    }

    @Test void customerLogoEndpointStreamsOwnedImageContentType() throws Exception {
        when(service.getMineLogo(7L)).thenReturn(new StoredLogo(new ByteArrayResource(new byte[]{1, 2}), "image/png"));
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine/7/logo").with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(new byte[]{1, 2}));
        mockMvc.perform(get("/api/v1/custom-bag-requests/mine/7/logo").with(user("cashier").roles("CASHIER")))
                .andExpect(status().isForbidden());
    }
}
