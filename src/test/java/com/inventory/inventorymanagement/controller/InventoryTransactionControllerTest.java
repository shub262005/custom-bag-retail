package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.InventoryTransactionRequest;
import com.inventory.inventorymanagement.dto.InventoryTransactionResponse;
import com.inventory.inventorymanagement.entity.TransactionType;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.InventoryTransactionService;
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

@WebMvcTest(InventoryTransactionController.class)
class InventoryTransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryTransactionService inventoryTransactionService;

    private InventoryTransactionResponse sampleResponse() {
        return new InventoryTransactionResponse(
                1L,
                10L,
                "Wireless Headphones",
                "SKU-WH-001",
                TransactionType.STOCK_IN,
                20,
                0,
                20,
                "Initial batch",
                "PURCHASE_ORDER",
                "PO-100",
                LocalDateTime.now()
        );
    }

    @Test
    void createTransaction_ValidRequest_Returns201Created() throws Exception {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                10L, TransactionType.STOCK_IN, 20,
                "Initial batch", "PURCHASE_ORDER", "PO-100"
        );

        when(inventoryTransactionService.createTransaction(any(InventoryTransactionRequest.class)))
                .thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.productId").value(10))
                .andExpect(jsonPath("$.productName").value("Wireless Headphones"))
                .andExpect(jsonPath("$.productSku").value("SKU-WH-001"))
                .andExpect(jsonPath("$.transactionType").value("STOCK_IN"))
                .andExpect(jsonPath("$.quantity").value(20))
                .andExpect(jsonPath("$.quantityBefore").value(0))
                .andExpect(jsonPath("$.quantityAfter").value(20));
    }

    @Test
    void createTransaction_MissingRequiredFields_Returns400BadRequest() throws Exception {
        InventoryTransactionRequest emptyRequest = new InventoryTransactionRequest();

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.productId").exists())
                .andExpect(jsonPath("$.validationErrors.transactionType").exists())
                .andExpect(jsonPath("$.validationErrors.quantity").exists());
    }

    @Test
    void createTransaction_NegativeQuantity_Returns400BadRequest() throws Exception {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                10L, TransactionType.STOCK_IN, -5, null, null, null
        );

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.quantity").exists());
    }

    @Test
    void createTransaction_ProductNotFound_Returns404NotFound() throws Exception {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                99L, TransactionType.STOCK_IN, 10, null, null, null
        );

        when(inventoryTransactionService.createTransaction(any(InventoryTransactionRequest.class)))
                .thenThrow(new ResourceNotFoundException("Product not found with id: 99"));

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Product not found with id: 99"));
    }

    @Test
    void createTransaction_InsufficientStock_Returns400BadRequest() throws Exception {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                10L, TransactionType.STOCK_OUT, 50, null, null, null
        );

        when(inventoryTransactionService.createTransaction(any(InventoryTransactionRequest.class)))
                .thenThrow(new IllegalArgumentException("Insufficient stock for product id: 10. Current stock: 20, requested: 50"));

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Insufficient stock for product id: 10. Current stock: 20, requested: 50"));
    }

    @Test
    void createTransaction_InactiveProduct_Returns400BadRequest() throws Exception {
        InventoryTransactionRequest request = new InventoryTransactionRequest(
                10L, TransactionType.STOCK_OUT, 5, null, null, null
        );

        when(inventoryTransactionService.createTransaction(any(InventoryTransactionRequest.class)))
                .thenThrow(new IllegalArgumentException("Cannot perform inventory transaction on inactive product with id: 10"));

        mockMvc.perform(post("/api/v1/inventory-transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Cannot perform inventory transaction on inactive product with id: 10"));
    }

    @Test
    void getTransactionById_Found_Returns200Ok() throws Exception {
        when(inventoryTransactionService.getTransactionById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/inventory-transactions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.productId").value(10))
                .andExpect(jsonPath("$.productName").value("Wireless Headphones"));
    }

    @Test
    void getTransactionById_NotFound_Returns404NotFound() throws Exception {
        when(inventoryTransactionService.getTransactionById(999L))
                .thenThrow(new ResourceNotFoundException("Inventory transaction not found with id: 999"));

        mockMvc.perform(get("/api/v1/inventory-transactions/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getTransactions_ReturnsList() throws Exception {
        when(inventoryTransactionService.getTransactions(null, null, null, null))
                .thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/inventory-transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void getTransactionsByProductId_ReturnsList() throws Exception {
        when(inventoryTransactionService.getTransactionsByProductId(10L))
                .thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/inventory-transactions/product/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].productId").value(10));
    }
}
