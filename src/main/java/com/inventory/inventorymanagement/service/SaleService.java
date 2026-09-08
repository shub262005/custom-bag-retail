package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.SaleStatus;

import java.time.LocalDate;
import java.util.List;

public interface SaleService {

    SaleResponse createSale(SaleRequest request);

    SaleResponse getSaleById(Long id);

    SaleResponse getSaleByNumber(String saleNumber);

    SaleResponse updateSale(Long id, SaleEditRequest request);

    SaleResponse cancelSale(Long id, SaleCancelRequest request);

    List<SaleResponse> getSales(String saleNumber,
                                 SaleStatus status,
                                 LocalDate startDate,
                                 LocalDate endDate,
                                 PaymentMethod paymentMethod,
                                 String search);

    List<InventoryTransactionResponse> getSaleInventoryTransactions(Long id);

    List<SaleAuditResponse> getSaleAuditHistory(Long id);

    DailySalesReportResponse getDailySalesReport(LocalDate date);

    DateRangeSalesReportResponse getDateRangeSalesReport(LocalDate startDate, LocalDate endDate);

    List<ProductSalesReportResponse> getSalesByProduct(LocalDate startDate, LocalDate endDate);

    List<CategorySalesReportResponse> getSalesByCategory(LocalDate startDate, LocalDate endDate);

    List<PaymentMethodSalesReportResponse> getSalesByPaymentMethod(LocalDate startDate, LocalDate endDate);

    List<CancelledSalesReportResponse> getCancelledSalesReport(LocalDate startDate, LocalDate endDate);

    SalesDashboardResponse getSalesDashboard(LocalDate date);
}
