package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.PurchasePaymentRequest;
import com.inventory.inventorymanagement.dto.PurchaseRequest;
import com.inventory.inventorymanagement.dto.PurchaseResponse;
import com.inventory.inventorymanagement.entity.PurchaseStatus;

import java.time.LocalDate;
import java.util.List;

public interface PurchaseService {

    PurchaseResponse createPurchase(PurchaseRequest request);

    PurchaseResponse getPurchaseById(Long id);

    PurchaseResponse getPurchaseByNumber(String purchaseNumber);

    List<PurchaseResponse> getPurchases(Long supplierId,
                                        PurchaseStatus status,
                                        LocalDate startDate,
                                        LocalDate endDate,
                                        String search);

    PurchaseResponse updatePurchase(Long id, PurchaseRequest request);

    PurchaseResponse cancelPurchase(Long id);

    PurchaseResponse addPayment(Long purchaseId, PurchasePaymentRequest request);

    PurchaseResponse updatePayment(Long purchaseId, Long paymentId, PurchasePaymentRequest request);

    PurchaseResponse deletePayment(Long purchaseId, Long paymentId);
}
