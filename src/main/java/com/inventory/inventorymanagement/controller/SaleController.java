package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.SaleStatus;
import com.inventory.inventorymanagement.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public ResponseEntity<SaleResponse> createSale(@Valid @RequestBody SaleRequest request) {
        SaleResponse response = saleService.createSale(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SaleResponse>> getSales(
            @RequestParam(required = false) String saleNumber,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @RequestParam(required = false) String search) {
        List<SaleResponse> response = saleService.getSales(saleNumber, status, startDate, endDate, paymentMethod, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSaleById(@PathVariable Long id) {
        SaleResponse response = saleService.getSaleById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/number/{saleNumber}")
    public ResponseEntity<SaleResponse> getSaleByNumber(@PathVariable String saleNumber) {
        SaleResponse response = saleService.getSaleByNumber(saleNumber);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SaleResponse> updateSale(
            @PathVariable Long id,
            @Valid @RequestBody SaleEditRequest request) {
        SaleResponse response = saleService.updateSale(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<SaleResponse> cancelSale(
            @PathVariable Long id,
            @Valid @RequestBody SaleCancelRequest request) {
        SaleResponse response = saleService.cancelSale(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/inventory-transactions")
    public ResponseEntity<List<InventoryTransactionResponse>> getSaleInventoryTransactions(@PathVariable Long id) {
        List<InventoryTransactionResponse> response = saleService.getSaleInventoryTransactions(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/audit-history")
    public ResponseEntity<List<SaleAuditResponse>> getSaleAuditHistory(@PathVariable Long id) {
        List<SaleAuditResponse> response = saleService.getSaleAuditHistory(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/daily")
    public ResponseEntity<DailySalesReportResponse> getDailySalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailySalesReportResponse response = saleService.getDailySalesReport(date);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/date-range")
    public ResponseEntity<DateRangeSalesReportResponse> getDateRangeSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        DateRangeSalesReportResponse response = saleService.getDateRangeSalesReport(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/by-product")
    public ResponseEntity<List<ProductSalesReportResponse>> getSalesByProduct(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<ProductSalesReportResponse> response = saleService.getSalesByProduct(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/by-category")
    public ResponseEntity<List<CategorySalesReportResponse>> getSalesByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CategorySalesReportResponse> response = saleService.getSalesByCategory(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/by-payment-method")
    public ResponseEntity<List<PaymentMethodSalesReportResponse>> getSalesByPaymentMethod(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PaymentMethodSalesReportResponse> response = saleService.getSalesByPaymentMethod(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/cancelled")
    public ResponseEntity<List<CancelledSalesReportResponse>> getCancelledSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CancelledSalesReportResponse> response = saleService.getCancelledSalesReport(startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<SalesDashboardResponse> getSalesDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        SalesDashboardResponse response = saleService.getSalesDashboard(date);
        return ResponseEntity.ok(response);
    }
}
