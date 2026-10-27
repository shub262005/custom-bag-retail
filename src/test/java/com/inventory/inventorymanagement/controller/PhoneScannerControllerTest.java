package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.PhoneScannerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Optional;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PhoneScannerController.class)
@Import(PhoneScannerService.class)
class PhoneScannerControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @MockBean CurrentUserService currentUser;

    @BeforeEach void staff() {
        when(currentUser.getCurrentUser()).thenReturn(Optional.of(new CurrentUserService.CurrentUser(1L, "staff@example.com", UserRole.CASHIER)));
    }

    @Test void ownerEndpointsRequireStaffAndDeviceRequiresCapability() throws Exception {
        mvc.perform(post("/api/v1/scanner/sessions")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/scanner/sessions").with(user("customer").roles("CUSTOMER"))).andExpect(status().isForbidden());
        JsonNode pair = create();
        mvc.perform(get("/api/v1/scanner/device/" + pair.get("id").asText() + "/status"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/scanner/device/" + pair.get("id").asText() + "/status").header("X-Scanner-Token", "wrong"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.message").exists());
    }

    @Test void anonymousPhoneCanPairSendAndObservePcAcknowledgement() throws Exception {
        JsonNode pair = create();
        String id = pair.get("id").asText();
        String phone = mvc.perform(post("/api/v1/scanner/device/" + id + "/pair")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"token\":\"" + pair.get("pairingToken").asText() + "\"}"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString();
        String token = mapper.readTree(phone).get("token").asText();
        mvc.perform(post("/api/v1/scanner/sessions/" + id + "/poll").with(user("staff").roles("CASHIER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"accepting\":true,\"targetId\":\"sale-1\",\"targetLabel\":\"Sales\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/scanner/device/" + id + "/scans").header("X-Scanner-Token", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"scan-1\",\"code\":\"BAG-001\",\"targetId\":\"sale-1\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(post("/api/v1/scanner/sessions/" + id + "/scans/scan-1/ack").with(user("staff").roles("CASHIER"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"accepted\":true,\"message\":\"Bag: added 1 unit.\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/scanner/device/" + id + "/status?scanId=scan-1").header("X-Scanner-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.scan.status").value("ADDED"));
        when(currentUser.getCurrentUser()).thenReturn(Optional.of(new CurrentUserService.CurrentUser(2L, "other@example.com", UserRole.ADMIN)));
        mvc.perform(delete("/api/v1/scanner/sessions/" + id).with(user("other").roles("ADMIN"))).andExpect(status().isNotFound());
        staff();
        mvc.perform(delete("/api/v1/scanner/sessions/" + id).with(user("staff").roles("CASHIER"))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/scanner/device/" + id + "/status").header("X-Scanner-Token", token)).andExpect(status().isGone());
    }

    private JsonNode create() throws Exception {
        return mapper.readTree(mvc.perform(post("/api/v1/scanner/sessions").with(user("staff").roles("CASHIER")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }
}
