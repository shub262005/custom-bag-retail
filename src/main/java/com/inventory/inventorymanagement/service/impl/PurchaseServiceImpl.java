package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.service.InventoryTransactionService;
import com.inventory.inventorymanagement.service.PurchaseNumberGenerator;
import com.inventory.inventorymanagement.service.PurchaseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final PurchasePaymentRepository purchasePaymentRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionService inventoryTransactionService;
    private final PurchaseNumberGenerator purchaseNumberGenerator;

    public PurchaseServiceImpl(PurchaseRepository purchaseRepository,
                               PurchaseItemRepository purchaseItemRepository,
                               PurchasePaymentRepository purchasePaymentRepository,
                               SupplierRepository supplierRepository,
                               ProductRepository productRepository,
                               InventoryTransactionService inventoryTransactionService,
                               PurchaseNumberGenerator purchaseNumberGenerator) {
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.purchasePaymentRepository = purchasePaymentRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.inventoryTransactionService = inventoryTransactionService;
        this.purchaseNumberGenerator = purchaseNumberGenerator;
    }

    @Override
    public PurchaseResponse createPurchase(PurchaseRequest request) {
        if (request.getDiscountPercentage() != null && request.getDiscountAmount() != null) {
            throw new IllegalArgumentException("Cannot provide both discount percentage and discount amount. Please provide only one.");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        if (supplier.getStatus() != SupplierStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot create purchase for inactive supplier with id: " + request.getSupplierId());
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase must contain at least one item");
        }

        Set<Long> seenProductIds = new HashSet<>();
        for (PurchaseItemRequest itemReq : request.getItems()) {
            if (!seenProductIds.add(itemReq.getProductId())) {
                throw new DuplicateResourceException("Duplicate product id " + itemReq.getProductId() + " in purchase request");
            }
        }

        List<Long> sortedProductIds = request.getItems().stream()
                .map(PurchaseItemRequest::getProductId)
                .sorted()
                .toList();

        Map<Long, Product> productMap = new HashMap<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot add inactive product id " + productId + " to a purchase");
            }
            productMap.put(productId, product);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PurchaseItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() < 1) {
                throw new IllegalArgumentException("Item quantity must be at least 1");
            }
            if (itemReq.getPurchasePrice() == null || itemReq.getPurchasePrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Purchase price cannot be negative");
            }
            BigDecimal itemTotal = itemReq.getPurchasePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemTotal);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal[] discountValues = calculateDiscount(subtotal, request.getDiscountPercentage(), request.getDiscountAmount());
        BigDecimal discountPercentage = discountValues[0];
        BigDecimal discountAmount = discountValues[1];

        BigDecimal taxableAmount = subtotal.subtract(discountAmount);

        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO;
        if (taxRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Tax rate cannot be negative");
        }
        taxRate = taxRate.setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = taxableAmount.multiply(taxRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        if (request.getPayments() != null && !request.getPayments().isEmpty()) {
            BigDecimal totalPayment = BigDecimal.ZERO;
            for (PurchasePaymentRequest pReq : request.getPayments()) {
                if (pReq.getAmount() == null || pReq.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Payment amount must be greater than 0");
                }
                totalPayment = totalPayment.add(pReq.getAmount());
            }
            if (totalPayment.compareTo(grandTotal) > 0) {
                throw new IllegalArgumentException("Total payment amount (" + totalPayment +
                        ") cannot exceed purchase grand total (" + grandTotal + ")");
            }
        }

        String purchaseNumber = purchaseNumberGenerator.generatePurchaseNumber(request.getPurchaseDate());

        Purchase purchase = new Purchase();
        purchase.setPurchaseNumber(purchaseNumber);
        purchase.setSupplier(supplier);
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setInvoiceNumber(request.getInvoiceNumber() != null ? request.getInvoiceNumber().trim() : null);
        purchase.setInvoiceDate(request.getInvoiceDate());
        purchase.setSubtotal(subtotal);
        purchase.setDiscountPercentage(discountPercentage);
        purchase.setDiscountAmount(discountAmount);
        purchase.setTaxRate(taxRate);
        purchase.setTaxAmount(taxAmount);
        purchase.setGrandTotal(grandTotal);
        purchase.setStatus(PurchaseStatus.COMPLETED);
        purchase.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        for (PurchaseItemRequest itemReq : request.getItems()) {
            Product product = productMap.get(itemReq.getProductId());
            BigDecimal itemTotal = itemReq.getPurchasePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            purchase.addItem(new PurchaseItem(product, itemReq.getQuantity(), itemReq.getPurchasePrice(), itemTotal));
        }

        if (request.getPayments() != null) {
            for (PurchasePaymentRequest pReq : request.getPayments()) {
                purchase.addPayment(new PurchasePayment(
                        pReq.getAmount(),
                        pReq.getPaymentMethod(),
                        pReq.getPaymentReference() != null ? pReq.getPaymentReference().trim() : null,
                        pReq.getPaymentDate(),
                        pReq.getNotes() != null ? pReq.getNotes().trim() : null
                ));
            }
        }

        Purchase savedPurchase = purchaseRepository.save(purchase);

        for (PurchaseItem item : savedPurchase.getItems()) {
            InventoryTransactionRequest txReq = new InventoryTransactionRequest(
                    item.getProduct().getId(),
                    TransactionType.STOCK_IN,
                    item.getQuantity(),
                    "Purchase: " + purchaseNumber,
                    "PURCHASE",
                    purchaseNumber,
                    request.getPurchaseDate()
            );
            inventoryTransactionService.createTransaction(txReq);
            updateProductLastPurchasePrice(item.getProduct().getId());
        }

        return PurchaseResponse.fromEntity(savedPurchase);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseResponse getPurchaseById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));
        return PurchaseResponse.fromEntity(purchase);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseResponse getPurchaseByNumber(String purchaseNumber) {
        Purchase purchase = purchaseRepository.findByPurchaseNumber(purchaseNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with number: " + purchaseNumber));
        return PurchaseResponse.fromEntity(purchase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseResponse> getPurchases(Long supplierId,
                                                PurchaseStatus status,
                                                LocalDate startDate,
                                                LocalDate endDate,
                                                String search) {
        String trimmedSearch = search != null ? search.trim() : null;
        List<Purchase> purchases = purchaseRepository.findWithFilters(supplierId, status, startDate, endDate, trimmedSearch);
        return purchases.stream()
                .map(PurchaseResponse::fromEntity)
                .toList();
    }

    @Override
    public PurchaseResponse updatePurchase(Long id, PurchaseRequest request) {
        if (request.getDiscountPercentage() != null && request.getDiscountAmount() != null) {
            throw new IllegalArgumentException("Cannot provide both discount percentage and discount amount. Please provide only one.");
        }

        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));

        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot edit a cancelled purchase");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        if (supplier.getStatus() != SupplierStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign inactive supplier with id: " + request.getSupplierId());
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase must contain at least one item");
        }

        Set<Long> seenProductIds = new HashSet<>();
        for (PurchaseItemRequest itemReq : request.getItems()) {
            if (!seenProductIds.add(itemReq.getProductId())) {
                throw new DuplicateResourceException("Duplicate product id " + itemReq.getProductId() + " in purchase request");
            }
        }

        Set<Long> allProductIds = new HashSet<>();
        purchase.getItems().forEach(item -> allProductIds.add(item.getProduct().getId()));
        request.getItems().forEach(item -> allProductIds.add(item.getProductId()));

        List<Long> sortedProductIds = allProductIds.stream().sorted().toList();
        Map<Long, Product> productMap = new HashMap<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            productMap.put(productId, product);
        }

        for (PurchaseItemRequest itemReq : request.getItems()) {
            Product prod = productMap.get(itemReq.getProductId());
            if (prod.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot add inactive product id " + itemReq.getProductId() + " to a purchase");
            }
        }

        Map<Long, Integer> oldQuantities = new HashMap<>();
        purchase.getItems().forEach(item -> oldQuantities.put(item.getProduct().getId(), item.getQuantity()));

        Map<Long, Integer> newQuantities = new HashMap<>();
        request.getItems().forEach(item -> newQuantities.put(item.getProductId(), item.getQuantity()));

        for (Long productId : allProductIds) {
            int oldQty = oldQuantities.getOrDefault(productId, 0);
            int newQty = newQuantities.getOrDefault(productId, 0);
            int delta = newQty - oldQty;

            if (delta < 0) {
                int requiredReduction = -delta;
                Product product = productMap.get(productId);
                int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                if (currentStock < requiredReduction) {
                    throw new IllegalArgumentException(
                            "Insufficient stock for product id: " + productId +
                            ". Current stock: " + currentStock + ", required reduction: " + requiredReduction
                    );
                }
            }
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PurchaseItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() < 1) {
                throw new IllegalArgumentException("Item quantity must be at least 1");
            }
            if (itemReq.getPurchasePrice() == null || itemReq.getPurchasePrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Purchase price cannot be negative");
            }
            BigDecimal itemTotal = itemReq.getPurchasePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemTotal);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal[] discountValues = calculateDiscount(subtotal, request.getDiscountPercentage(), request.getDiscountAmount());
        BigDecimal discountPercentage = discountValues[0];
        BigDecimal discountAmount = discountValues[1];

        BigDecimal taxableAmount = subtotal.subtract(discountAmount);
        BigDecimal taxRate = request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO;
        if (taxRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Tax rate cannot be negative");
        }
        taxRate = taxRate.setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxAmount = taxableAmount.multiply(taxRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalPaid = purchase.calculateTotalPaid();
        if (grandTotal.compareTo(totalPaid) < 0) {
            throw new IllegalArgumentException(
                    "Purchase grand total (" + grandTotal + ") cannot be less than total amount already paid (" +
                    totalPaid + "). Please adjust or delete payments first."
            );
        }

        for (Long productId : allProductIds) {
            int oldQty = oldQuantities.getOrDefault(productId, 0);
            int newQty = newQuantities.getOrDefault(productId, 0);
            int delta = newQty - oldQty;

            if (delta > 0) {
                InventoryTransactionRequest txReq = new InventoryTransactionRequest(
                        productId,
                        TransactionType.STOCK_IN,
                        delta,
                        "Purchase edit: " + purchase.getPurchaseNumber(),
                        "PURCHASE",
                        purchase.getPurchaseNumber(),
                        request.getPurchaseDate()
                );
                inventoryTransactionService.createTransaction(txReq);
            } else if (delta < 0) {
                InventoryTransactionRequest txReq = new InventoryTransactionRequest(
                        productId,
                        TransactionType.STOCK_OUT,
                        -delta,
                        "Purchase edit: " + purchase.getPurchaseNumber(),
                        "PURCHASE",
                        purchase.getPurchaseNumber(),
                        request.getPurchaseDate()
                );
                inventoryTransactionService.createTransaction(txReq);
            }
        }

        purchase.setSupplier(supplier);
        purchase.setPurchaseDate(request.getPurchaseDate());
        purchase.setInvoiceNumber(request.getInvoiceNumber() != null ? request.getInvoiceNumber().trim() : null);
        purchase.setInvoiceDate(request.getInvoiceDate());
        purchase.setSubtotal(subtotal);
        purchase.setDiscountPercentage(discountPercentage);
        purchase.setDiscountAmount(discountAmount);
        purchase.setTaxRate(taxRate);
        purchase.setTaxAmount(taxAmount);
        purchase.setGrandTotal(grandTotal);
        purchase.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        purchase.clearItems();
        for (PurchaseItemRequest itemReq : request.getItems()) {
            Product product = productMap.get(itemReq.getProductId());
            BigDecimal itemTotal = itemReq.getPurchasePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            purchase.addItem(new PurchaseItem(product, itemReq.getQuantity(), itemReq.getPurchasePrice(), itemTotal));
        }

        Purchase updatedPurchase = purchaseRepository.save(purchase);

        for (Long productId : allProductIds) {
            updateProductLastPurchasePrice(productId);
        }

        return PurchaseResponse.fromEntity(updatedPurchase);
    }

    @Override
    public PurchaseResponse cancelPurchase(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + id));

        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new IllegalArgumentException("Purchase is already cancelled");
        }

        List<Long> sortedProductIds = purchase.getItems().stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .sorted()
                .toList();

        Map<Long, Product> productMap = new HashMap<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            productMap.put(productId, product);
        }

        for (PurchaseItem item : purchase.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (currentStock < item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Insufficient stock to cancel purchase " + purchase.getPurchaseNumber() +
                        " for product id: " + product.getId() + ". Current stock: " + currentStock +
                        ", required: " + item.getQuantity()
                );
            }
        }

        for (PurchaseItem item : purchase.getItems()) {
            InventoryTransactionRequest txReq = new InventoryTransactionRequest(
                    item.getProduct().getId(),
                    TransactionType.STOCK_OUT,
                    item.getQuantity(),
                    "Purchase cancellation: " + purchase.getPurchaseNumber(),
                    "PURCHASE_CANCEL",
                    purchase.getPurchaseNumber(),
                    LocalDate.now()
            );
            inventoryTransactionService.createTransaction(txReq);
        }

        purchase.setStatus(PurchaseStatus.CANCELLED);
        Purchase saved = purchaseRepository.save(purchase);

        for (Long productId : sortedProductIds) {
            updateProductLastPurchasePrice(productId);
        }

        return PurchaseResponse.fromEntity(saved);
    }

    @Override
    public PurchaseResponse addPayment(Long purchaseId, PurchasePaymentRequest request) {
        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + purchaseId));

        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot add payment to a cancelled purchase");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }

        BigDecimal currentTotal = purchase.calculateTotalPaid();
        BigDecimal newTotal = currentTotal.add(request.getAmount());
        if (newTotal.compareTo(purchase.getGrandTotal()) > 0) {
            throw new IllegalArgumentException(
                    "Total payments (" + newTotal + ") cannot exceed purchase grand total (" +
                    purchase.getGrandTotal() + ")"
            );
        }

        PurchasePayment payment = new PurchasePayment(
                request.getAmount(),
                request.getPaymentMethod(),
                request.getPaymentReference() != null ? request.getPaymentReference().trim() : null,
                request.getPaymentDate(),
                request.getNotes() != null ? request.getNotes().trim() : null
        );
        purchase.addPayment(payment);
        Purchase saved = purchaseRepository.save(purchase);
        return PurchaseResponse.fromEntity(saved);
    }

    @Override
    public PurchaseResponse updatePayment(Long purchaseId, Long paymentId, PurchasePaymentRequest request) {
        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + purchaseId));

        if (purchase.getStatus() == PurchaseStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot edit payment on a cancelled purchase");
        }

        PurchasePayment payment = purchase.getPayments().stream()
                .filter(p -> p.getId().equals(paymentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }

        BigDecimal totalWithoutCurrent = purchase.calculateTotalPaid().subtract(payment.getAmount());
        BigDecimal newTotal = totalWithoutCurrent.add(request.getAmount());
        if (newTotal.compareTo(purchase.getGrandTotal()) > 0) {
            throw new IllegalArgumentException(
                    "Total payments (" + newTotal + ") cannot exceed purchase grand total (" +
                    purchase.getGrandTotal() + ")"
            );
        }

        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentReference(request.getPaymentReference() != null ? request.getPaymentReference().trim() : null);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        Purchase saved = purchaseRepository.save(purchase);
        return PurchaseResponse.fromEntity(saved);
    }

    @Override
    public PurchaseResponse deletePayment(Long purchaseId, Long paymentId) {
        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase not found with id: " + purchaseId));

        PurchasePayment payment = purchase.getPayments().stream()
                .filter(p -> p.getId().equals(paymentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        purchase.removePayment(payment);
        Purchase saved = purchaseRepository.save(purchase);
        return PurchaseResponse.fromEntity(saved);
    }

    private BigDecimal[] calculateDiscount(BigDecimal subtotal, BigDecimal discountPercentage, BigDecimal discountAmount) {
        if (discountPercentage != null && discountAmount != null) {
            throw new IllegalArgumentException("Cannot provide both discount percentage and discount amount. Please provide only one.");
        }

        BigDecimal pct = BigDecimal.ZERO;
        BigDecimal amt = BigDecimal.ZERO;

        if (discountPercentage != null) {
            pct = discountPercentage;
            if (pct.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Discount percentage cannot be negative");
            }
            if (pct.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException("Discount percentage cannot exceed 100%");
            }
            amt = subtotal.multiply(pct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if (discountAmount != null) {
            amt = discountAmount;
            if (amt.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Discount amount cannot be negative");
            }
            if (amt.compareTo(subtotal) > 0) {
                throw new IllegalArgumentException("Discount amount cannot exceed subtotal");
            }
            pct = subtotal.compareTo(BigDecimal.ZERO) > 0
                    ? amt.multiply(BigDecimal.valueOf(100)).divide(subtotal, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
        }

        return new BigDecimal[]{pct.setScale(2, RoundingMode.HALF_UP), amt.setScale(2, RoundingMode.HALF_UP)};
    }

    private void updateProductLastPurchasePrice(Long productId) {
        List<BigDecimal> prices = purchaseItemRepository.findCompletedPurchasePricesOrderByDateDesc(
                productId, PurchaseStatus.COMPLETED
        );
        Product product = productRepository.findByIdForUpdate(productId).orElse(null);
        if (product != null) {
            BigDecimal latestPrice = prices.isEmpty() ? null : prices.get(0);
            product.setLastPurchasePrice(latestPrice);
            productRepository.save(product);
        }
    }
}
