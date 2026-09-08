package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.SupplierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SupplierController.class)
class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupplierService supplierService;

    private SupplierResponse sampleResponse() {
        return new SupplierResponse(
                1L,
                "ABC Bags",
                "27AAPFU0939F1ZV",
                "123 Market Road, Solapur",
                SupplierStatus.ACTIVE,
                List.of(new SupplierPhoneResponse(1L, "9876543210", "Office")),
                List.of(new SupplierEmailResponse(1L, "contact@abcbags.com", "General")),
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }

    @Test
    void createSupplier_ValidRequest_Returns201Created() throws Exception {
        SupplierRequest request = new SupplierRequest(
                "ABC Bags", "27AAPFU0939F1ZV", "123 Market Road, Solapur",
                List.of(new SupplierPhoneRequest("9876543210", "Office")),
                List.of(new SupplierEmailRequest("contact@abcbags.com", "General"))
        );

        when(supplierService.createSupplier(any(SupplierRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ABC Bags"))
                .andExpect(jsonPath("$.gstNumber").value("27AAPFU0939F1ZV"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.phones[0].phoneNumber").value("9876543210"))
                .andExpect(jsonPath("$.emails[0].email").value("contact@abcbags.com"));
    }

    @Test
    void createSupplier_BlankName_Returns400BadRequest() throws Exception {
        SupplierRequest request = new SupplierRequest("", null, null, null, null);

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.name").exists());
    }

    @Test
    void createSupplier_InvalidEmailFormat_Returns400BadRequest() throws Exception {
        SupplierRequest request = new SupplierRequest(
                "Valid Name", null, null,
                null,
                List.of(new SupplierEmailRequest("invalid-email-address", "Work"))
        );

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createSupplier_DuplicateName_Returns409Conflict() throws Exception {
        SupplierRequest request = new SupplierRequest("ABC Bags", null, null, null, null);

        when(supplierService.createSupplier(any(SupplierRequest.class)))
                .thenThrow(new DuplicateResourceException("Supplier with name 'ABC Bags' already exists"));

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Supplier with name 'ABC Bags' already exists"));
    }

    @Test
    void createSupplier_DuplicateGst_Returns409Conflict() throws Exception {
        SupplierRequest request = new SupplierRequest("New Bags", "27AAPFU0939F1ZV", null, null, null);

        when(supplierService.createSupplier(any(SupplierRequest.class)))
                .thenThrow(new DuplicateResourceException("Supplier with GST number '27AAPFU0939F1ZV' already exists"));

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Supplier with GST number '27AAPFU0939F1ZV' already exists"));
    }

    @Test
    void getSupplierById_Found_Returns200Ok() throws Exception {
        when(supplierService.getSupplierById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/suppliers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("ABC Bags"));
    }

    @Test
    void getSupplierById_NotFound_Returns404NotFound() throws Exception {
        when(supplierService.getSupplierById(99L))
                .thenThrow(new ResourceNotFoundException("Supplier not found with id: 99"));

        mockMvc.perform(get("/api/v1/suppliers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getAllSuppliers_ReturnsList() throws Exception {
        when(supplierService.getAllSuppliers(null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("ABC Bags"));
    }

    @Test
    void getAllSuppliers_WithStatusFilter_ReturnsFilteredList() throws Exception {
        when(supplierService.getAllSuppliers(SupplierStatus.ACTIVE)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/suppliers?status=ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void searchSuppliers_ReturnsMatchingList() throws Exception {
        when(supplierService.searchSuppliers("ABC")).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/suppliers/search").param("q", "ABC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("ABC Bags"));
    }

    @Test
    void updateSupplier_Valid_Returns200Ok() throws Exception {
        SupplierRequest request = new SupplierRequest(
                "ABC Bags International", "27AAPFU0939F1ZV", "456 Market Road",
                List.of(new SupplierPhoneRequest("9876543210", "Office")),
                null
        );

        when(supplierService.updateSupplier(eq(1L), any(SupplierRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/suppliers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateSupplierStatus_Valid_Returns200Ok() throws Exception {
        SupplierStatusUpdateRequest request = new SupplierStatusUpdateRequest(SupplierStatus.INACTIVE);
        SupplierResponse response = sampleResponse();
        response.setStatus(SupplierStatus.INACTIVE);

        when(supplierService.updateSupplierStatus(1L, SupplierStatus.INACTIVE)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/suppliers/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void updateSupplierStatus_MissingStatus_Returns400BadRequest() throws Exception {
        SupplierStatusUpdateRequest request = new SupplierStatusUpdateRequest(null);

        mockMvc.perform(patch("/api/v1/suppliers/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.status").exists());
    }
}
