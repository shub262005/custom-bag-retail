package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.PaymentStatus;
import com.inventory.inventorymanagement.entity.PurchaseStatus;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.PurchaseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PurchaseController.class)
class PurchaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PurchaseService purchaseService;

    private PurchaseResponse sampleResponse() {
        SupplierResponse supplier = new SupplierResponse(
                1L, "Safari Bags", "27AAPFU0939F1ZV", "Solapur", SupplierStatus.ACTIVE,
                List.of(), List.of(), LocalDateTime.now(), LocalDateTime.now()
        );
        PurchaseItemResponse item = new PurchaseItemResponse(
                1L, 10L, "Travel Bag Alpha", "SKU-BAG-001", 5, new BigDecimal("500.00"), new BigDecimal("2500.00")
        );
        PurchasePaymentResponse payment = new PurchasePaymentResponse(
                1L, new BigDecimal("1000.00"), PaymentMethod.UPI, "UPI-REF-1", LocalDate.now(), "Part payment", LocalDateTime.now()
        );

        return new PurchaseResponse(
                1L, "PUR-2026-000001", supplier, LocalDate.now(), "INV-001", LocalDate.now(),
                new BigDecimal("2500.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, new BigDecimal("2500.00"), PurchaseStatus.COMPLETED, "First purchase",
                List.of(item), List.of(payment), new BigDecimal("1000.00"), new BigDecimal("1500.00"),
                PaymentStatus.PARTIALLY_PAID, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    void createPurchase_ValidRequest_Returns201Created() throws Exception {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), "INV-001", LocalDate.now(),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "First purchase",
                List.of(new PurchaseItemRequest(10L, 5, new BigDecimal("500.00"))),
                List.of(new PurchasePaymentRequest(new BigDecimal("1000.00"), PaymentMethod.UPI, "UPI-REF-1", LocalDate.now(), null))
        );

        when(purchaseService.createPurchase(any(PurchaseRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/purchases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.purchaseNumber").value("PUR-2026-000001"))
                .andExpect(jsonPath("$.grandTotal").value(2500.00))
                .andExpect(jsonPath("$.paymentStatus").value("PARTIALLY_PAID"))
                .andExpect(jsonPath("$.items[0].productName").value("Travel Bag Alpha"));
    }

    @Test
    void createPurchase_MissingRequiredFields_Returns400BadRequest() throws Exception {
        PurchaseRequest request = new PurchaseRequest(); // Missing supplierId, purchaseDate, items

        mockMvc.perform(post("/api/v1/purchases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.supplierId").exists())
                .andExpect(jsonPath("$.validationErrors.purchaseDate").exists())
                .andExpect(jsonPath("$.validationErrors.items").exists());
    }

    @Test
    void createPurchase_DuplicateProducts_Returns409Conflict() throws Exception {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 1, new BigDecimal("100.00")),
                        new PurchaseItemRequest(10L, 2, new BigDecimal("100.00"))), null
        );

        when(purchaseService.createPurchase(any(PurchaseRequest.class)))
                .thenThrow(new DuplicateResourceException("Duplicate product id 10 in purchase request"));

        mockMvc.perform(post("/api/v1/purchases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Duplicate product id 10 in purchase request"));
    }

    @Test
    void createPurchase_SupplierNotFound_Returns404NotFound() throws Exception {
        PurchaseRequest request = new PurchaseRequest(
                99L, LocalDate.now(), null, null, null, null, null, null,
                List.of(new PurchaseItemRequest(10L, 1, new BigDecimal("100.00"))), null
        );

        when(purchaseService.createPurchase(any(PurchaseRequest.class)))
                .thenThrow(new ResourceNotFoundException("Supplier not found with id: 99"));

        mockMvc.perform(post("/api/v1/purchases")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getPurchaseById_Found_Returns200Ok() throws Exception {
        when(purchaseService.getPurchaseById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/purchases/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.purchaseNumber").value("PUR-2026-000001"));
    }

    @Test
    void getPurchaseByNumber_Found_Returns200Ok() throws Exception {
        when(purchaseService.getPurchaseByNumber("PUR-2026-000001")).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/purchases/number/PUR-2026-000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.purchaseNumber").value("PUR-2026-000001"));
    }

    @Test
    void updatePurchase_Valid_Returns200Ok() throws Exception {
        PurchaseRequest request = new PurchaseRequest(
                1L, LocalDate.now(), "INV-002", LocalDate.now(),
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "Updated",
                List.of(new PurchaseItemRequest(10L, 6, new BigDecimal("500.00"))), null
        );

        when(purchaseService.updatePurchase(eq(1L), any(PurchaseRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/purchases/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void cancelPurchase_Valid_Returns200Ok() throws Exception {
        PurchaseResponse cancelledResponse = sampleResponse();
        cancelledResponse.setStatus(PurchaseStatus.CANCELLED);

        when(purchaseService.cancelPurchase(1L)).thenReturn(cancelledResponse);

        mockMvc.perform(patch("/api/v1/purchases/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void cancelPurchase_InsufficientStock_Returns400BadRequest() throws Exception {
        when(purchaseService.cancelPurchase(1L))
                .thenThrow(new IllegalArgumentException("Insufficient stock to cancel purchase PUR-2026-000001"));

        mockMvc.perform(patch("/api/v1/purchases/1/cancel"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Insufficient stock to cancel purchase PUR-2026-000001"));
    }

    @Test
    void addPayment_Valid_Returns201Created() throws Exception {
        PurchasePaymentRequest request = new PurchasePaymentRequest(
                new BigDecimal("500.00"), PaymentMethod.CASH, null, LocalDate.now(), "Second payment"
        );

        when(purchaseService.addPayment(eq(1L), any(PurchasePaymentRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/purchases/1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void deletePayment_Valid_Returns200Ok() throws Exception {
        when(purchaseService.deletePayment(1L, 10L)).thenReturn(sampleResponse());

        mockMvc.perform(delete("/api/v1/purchases/1/payments/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }
}
