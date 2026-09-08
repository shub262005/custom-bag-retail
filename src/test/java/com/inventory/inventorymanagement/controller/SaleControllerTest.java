package com.inventory.inventorymanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.CancellationReason;
import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.SaleStatus;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.service.SaleService;
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

@WebMvcTest(SaleController.class)
class SaleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SaleService saleService;

    private SaleResponse sampleResponse() {
        SaleItemResponse item = new SaleItemResponse(
                1L, 10L, "Travel Bag Alpha", "SKU-BAG-001", "123456", 2,
                new BigDecimal("1000.00"), new BigDecimal("2000.00")
        );
        SalePaymentResponse payment = new SalePaymentResponse(
                1L, new BigDecimal("2000.00"), PaymentMethod.UPI, "GPay", LocalDateTime.now()
        );

        return new SaleResponse(
                1L, "SAL-2026-000001", LocalDate.now(), new BigDecimal("2000.00"),
                BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("2000.00"),
                SaleStatus.COMPLETED, null, null, null, null,
                List.of(item), payment, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    void createSale_Success() throws Exception {
        SaleRequest request = new SaleRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(10L, 2, new BigDecimal("1000.00"))),
                null, null, PaymentMethod.UPI, "GPay"
        );

        when(saleService.createSale(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/sales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.saleNumber").value("SAL-2026-000001"))
                .andExpect(jsonPath("$.grandTotal").value(2000.00))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void getSaleById_Success() throws Exception {
        when(saleService.getSaleById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/sales/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.saleNumber").value("SAL-2026-000001"));
    }

    @Test
    void getSaleById_NotFound() throws Exception {
        when(saleService.getSaleById(999L)).thenThrow(new ResourceNotFoundException("Sale not found with id: 999"));

        mockMvc.perform(get("/api/v1/sales/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Sale not found with id: 999"));
    }

    @Test
    void getSaleByNumber_Success() throws Exception {
        when(saleService.getSaleByNumber("SAL-2026-000001")).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/sales/number/SAL-2026-000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saleNumber").value("SAL-2026-000001"));
    }

    @Test
    void updateSale_Success() throws Exception {
        SaleEditRequest request = new SaleEditRequest(
                LocalDate.now(),
                List.of(new SaleItemRequest(10L, 3, new BigDecimal("1000.00"))),
                null, null, PaymentMethod.CASH, null, true
        );

        when(saleService.updateSale(eq(1L), any())).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/sales/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void cancelSale_Success() throws Exception {
        SaleCancelRequest request = new SaleCancelRequest(CancellationReason.CUSTOMER_RETURNED_ITEM, "Damaged handle");

        SaleResponse cancelledResponse = sampleResponse();
        cancelledResponse.setStatus(SaleStatus.CANCELLED);
        cancelledResponse.setCancellationReason(CancellationReason.CUSTOMER_RETURNED_ITEM);

        when(saleService.cancelSale(eq(1L), any())).thenReturn(cancelledResponse);

        mockMvc.perform(patch("/api/v1/sales/1/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellationReason").value("CUSTOMER_RETURNED_ITEM"));
    }

    @Test
    void getDailySalesReport_Success() throws Exception {
        LocalDate today = LocalDate.now();
        DailySalesReportResponse response = new DailySalesReportResponse(today, 5L, new BigDecimal("15000.00"));

        when(saleService.getDailySalesReport(today)).thenReturn(response);

        mockMvc.perform(get("/api/v1/sales/reports/daily")
                        .param("date", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSalesCount").value(5))
                .andExpect(jsonPath("$.totalSalesAmount").value(15000.00));
    }

    @Test
    void getSalesDashboard_Success() throws Exception {
        LocalDate today = LocalDate.now();
        SalesDashboardResponse response = new SalesDashboardResponse(
                today, 10L, new BigDecimal("25000.00"), 1L, List.of(), List.of()
        );

        when(saleService.getSalesDashboard(today)).thenReturn(response);

        mockMvc.perform(get("/api/v1/sales/dashboard")
                        .param("date", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.todayCompletedSalesCount").value(10))
                .andExpect(jsonPath("$.todayCompletedSalesAmount").value(25000.00))
                .andExpect(jsonPath("$.todayCancelledSalesCount").value(1));
    }
}
