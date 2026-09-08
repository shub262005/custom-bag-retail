package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.*;
import com.inventory.inventorymanagement.service.SaleNumberGenerator;
import com.inventory.inventorymanagement.service.SaleService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final SalePaymentRepository salePaymentRepository;
    private final SaleAuditHistoryRepository saleAuditHistoryRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final SaleNumberGenerator saleNumberGenerator;

    public SaleServiceImpl(SaleRepository saleRepository,
                           SaleItemRepository saleItemRepository,
                           SalePaymentRepository salePaymentRepository,
                           SaleAuditHistoryRepository saleAuditHistoryRepository,
                           ProductRepository productRepository,
                           InventoryTransactionRepository inventoryTransactionRepository,
                           SaleNumberGenerator saleNumberGenerator) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.salePaymentRepository = salePaymentRepository;
        this.saleAuditHistoryRepository = saleAuditHistoryRepository;
        this.productRepository = productRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.saleNumberGenerator = saleNumberGenerator;
    }

    @Override
    public SaleResponse createSale(SaleRequest request) {
        LocalDate saleDate = request.getSaleDate() != null ? request.getSaleDate() : LocalDate.now();
        if (saleDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Sale date cannot be in the future");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Sale must contain at least one item");
        }

        List<SaleItemRequest> mergedItems = validateAndMergeItems(request.getItems());

        List<Long> sortedProductIds = mergedItems.stream()
                .map(SaleItemRequest::getProductId)
                .sorted()
                .toList();

        Map<Long, Product> productMap = new HashMap<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            if (product.getStatus() != ProductStatus.ACTIVE) {
                throw new IllegalArgumentException("Cannot add inactive product id " + productId + " to a new sale");
            }
            productMap.put(productId, product);
        }

        for (SaleItemRequest itemReq : mergedItems) {
            Product product = productMap.get(itemReq.getProductId());
            int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            if (itemReq.getQuantity() > currentStock) {
                throw new IllegalArgumentException(
                        "Insufficient stock for product id: " + product.getId() +
                        ". Current stock: " + currentStock + ", requested: " + itemReq.getQuantity()
                );
            }
        }

        BigDecimal subtotal = calculateSubtotal(mergedItems);
        BigDecimal[] discountValues = calculateDiscount(subtotal, request.getDiscountPercentage(), request.getDiscountAmount());
        BigDecimal discountPercentage = discountValues[0];
        BigDecimal discountAmount = discountValues[1];
        BigDecimal grandTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (grandTotal.compareTo(BigDecimal.ZERO) > 0) {
            if (request.getPaymentMethod() == null) {
                throw new IllegalArgumentException("Payment method is required for sale total of " + grandTotal);
            }
        }

        String saleNumber = saleNumberGenerator.generateSaleNumber(saleDate);

        Sale sale = new Sale();
        sale.setSaleNumber(saleNumber);
        sale.setSaleDate(saleDate);
        sale.setSubtotal(subtotal);
        sale.setDiscountPercentage(discountPercentage);
        sale.setDiscountAmount(discountAmount);
        sale.setGrandTotal(grandTotal);
        sale.setStatus(SaleStatus.COMPLETED);

        for (SaleItemRequest itemReq : mergedItems) {
            Product product = productMap.get(itemReq.getProductId());
            BigDecimal itemTotal = itemReq.getSellingPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            sale.addItem(new SaleItem(product, itemReq.getQuantity(), itemReq.getSellingPrice(), itemTotal));
        }

        SalePayment payment = new SalePayment(
                grandTotal,
                grandTotal.compareTo(BigDecimal.ZERO) > 0 ? request.getPaymentMethod() : null,
                request.getPaymentDescription() != null ? request.getPaymentDescription().trim() : null
        );
        sale.setPayment(payment);

        Sale savedSale = saleRepository.save(sale);

        for (SaleItem item : savedSale.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            int before = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            int after = before - item.getQuantity();

            product.setStockQuantity(after);
            productRepository.save(product);

            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType(TransactionType.STOCK_OUT);
            tx.setQuantity(item.getQuantity());
            tx.setQuantityBefore(before);
            tx.setQuantityAfter(after);
            tx.setReferenceType("SALE");
            tx.setReferenceId(saleNumber);
            tx.setMovementDate(saleDate);
            tx.setReason("Sale: " + saleNumber);
            inventoryTransactionRepository.save(tx);
        }

        String auditDesc = String.format("Sale created with %d item(s), total ₹%s",
                savedSale.getItems().size(), savedSale.getGrandTotal().toPlainString());
        saleAuditHistoryRepository.save(new SaleAuditHistory(savedSale, "SYSTEM", SaleAuditAction.SALE_CREATED, auditDesc));

        return SaleResponse.fromEntity(savedSale);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));
        return SaleResponse.fromEntity(sale);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleResponse getSaleByNumber(String saleNumber) {
        Sale sale = saleRepository.findBySaleNumber(saleNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with number: " + saleNumber));
        return SaleResponse.fromEntity(sale);
    }

    @Override
    public SaleResponse updateSale(Long id, SaleEditRequest request) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot edit a cancelled sale");
        }

        LocalDate newDate = request.getSaleDate() != null ? request.getSaleDate() : sale.getSaleDate();
        if (newDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Sale date cannot be in the future");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Sale must contain at least one item");
        }

        List<SaleItemRequest> mergedItems = validateAndMergeItems(request.getItems());

        Map<Long, Integer> oldQuantities = sale.getItems().stream()
                .collect(Collectors.toMap(i -> i.getProduct().getId(), SaleItem::getQuantity));
        Map<Long, Integer> newQuantities = mergedItems.stream()
                .collect(Collectors.toMap(SaleItemRequest::getProductId, SaleItemRequest::getQuantity));

        Set<Long> allProductIds = new HashSet<>(oldQuantities.keySet());
        allProductIds.addAll(newQuantities.keySet());

        List<Long> sortedProductIds = allProductIds.stream().sorted().toList();
        Map<Long, Product> productMap = new HashMap<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
            productMap.put(productId, product);
        }

        for (SaleItemRequest itemReq : mergedItems) {
            if (!oldQuantities.containsKey(itemReq.getProductId())) {
                Product product = productMap.get(itemReq.getProductId());
                if (product.getStatus() != ProductStatus.ACTIVE) {
                    throw new IllegalArgumentException("Cannot add inactive product id " + itemReq.getProductId() + " to a sale");
                }
            }
        }

        for (Long productId : allProductIds) {
            int oldQty = oldQuantities.getOrDefault(productId, 0);
            int newQty = newQuantities.getOrDefault(productId, 0);
            int delta = newQty - oldQty;

            if (delta > 0) {
                Product product = productMap.get(productId);
                int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                if (currentStock < delta) {
                    throw new IllegalArgumentException(
                            "Insufficient stock for product id: " + productId +
                            ". Current stock: " + currentStock + ", required increase: " + delta
                    );
                }
            }
        }

        BigDecimal subtotal = calculateSubtotal(mergedItems);
        BigDecimal[] discountValues = calculateDiscount(subtotal, request.getDiscountPercentage(), request.getDiscountAmount());
        BigDecimal discountPercentage = discountValues[0];
        BigDecimal discountAmount = discountValues[1];
        BigDecimal newGrandTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        if (newGrandTotal.compareTo(BigDecimal.ZERO) < 0) {
            newGrandTotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        for (Long productId : allProductIds) {
            int oldQty = oldQuantities.getOrDefault(productId, 0);
            int newQty = newQuantities.getOrDefault(productId, 0);
            int delta = newQty - oldQty;
            Product product = productMap.get(productId);
            int before = product.getStockQuantity() != null ? product.getStockQuantity() : 0;

            if (delta > 0) {
                int after = before - delta;
                product.setStockQuantity(after);
                productRepository.save(product);

                InventoryTransaction tx = new InventoryTransaction();
                tx.setProduct(product);
                tx.setTransactionType(TransactionType.STOCK_OUT);
                tx.setQuantity(delta);
                tx.setQuantityBefore(before);
                tx.setQuantityAfter(after);
                tx.setReferenceType("SALE");
                tx.setReferenceId(sale.getSaleNumber());
                tx.setMovementDate(newDate);
                tx.setReason("Sale edit: " + sale.getSaleNumber());
                inventoryTransactionRepository.save(tx);
            } else if (delta < 0) {
                int restoreQty = -delta;
                int after = before + restoreQty;
                product.setStockQuantity(after);
                productRepository.save(product);

                InventoryTransaction tx = new InventoryTransaction();
                tx.setProduct(product);
                tx.setTransactionType(TransactionType.STOCK_IN);
                tx.setQuantity(restoreQty);
                tx.setQuantityBefore(before);
                tx.setQuantityAfter(after);
                tx.setReferenceType("SALE");
                tx.setReferenceId(sale.getSaleNumber());
                tx.setMovementDate(newDate);
                tx.setReason("Sale edit: " + sale.getSaleNumber());
                inventoryTransactionRepository.save(tx);
            }
        }

        SalePayment payment = sale.getPayment();
        if (payment == null) {
            payment = new SalePayment();
            sale.setPayment(payment);
        }

        BigDecimal oldGrandTotal = sale.getGrandTotal() != null ? sale.getGrandTotal() : BigDecimal.ZERO;
        if (newGrandTotal.compareTo(oldGrandTotal) > 0) {
            payment.setAmount(newGrandTotal);
        } else if (newGrandTotal.compareTo(oldGrandTotal) < 0) {
            boolean reduce = request.getReducePaymentOnTotalDecrease() == null || request.getReducePaymentOnTotalDecrease();
            if (reduce) {
                payment.setAmount(newGrandTotal);
            }
        }

        if (request.getPaymentMethod() != null) {
            payment.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.getPaymentDescription() != null) {
            payment.setDescription(request.getPaymentDescription().trim());
        }

        sale.setSaleDate(newDate);
        sale.setSubtotal(subtotal);
        sale.setDiscountPercentage(discountPercentage);
        sale.setDiscountAmount(discountAmount);
        sale.setGrandTotal(newGrandTotal);

        sale.clearItems();
        for (SaleItemRequest itemReq : mergedItems) {
            Product product = productMap.get(itemReq.getProductId());
            BigDecimal itemTotal = itemReq.getSellingPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            sale.addItem(new SaleItem(product, itemReq.getQuantity(), itemReq.getSellingPrice(), itemTotal));
        }

        Sale updatedSale = saleRepository.save(sale);

        String auditDesc = String.format("Sale updated: items and payment adjusted, new total ₹%s",
                updatedSale.getGrandTotal().toPlainString());
        saleAuditHistoryRepository.save(new SaleAuditHistory(updatedSale, "SYSTEM", SaleAuditAction.SALE_UPDATED, auditDesc));

        return SaleResponse.fromEntity(updatedSale);
    }

    @Override
    public SaleResponse cancelSale(Long id, SaleCancelRequest request) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));

        if (sale.getStatus() == SaleStatus.CANCELLED) {
            throw new IllegalArgumentException("Sale is already cancelled");
        }

        if (request.getReason() == null) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        List<Long> sortedProductIds = sale.getItems().stream()
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

        for (SaleItem item : sale.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            int before = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
            int after = before + item.getQuantity();

            product.setStockQuantity(after);
            productRepository.save(product);

            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType(TransactionType.STOCK_IN);
            tx.setQuantity(item.getQuantity());
            tx.setQuantityBefore(before);
            tx.setQuantityAfter(after);
            tx.setReferenceType("SALE_CANCEL");
            tx.setReferenceId(sale.getSaleNumber());
            tx.setMovementDate(LocalDate.now());
            tx.setReason("Sale cancellation: " + sale.getSaleNumber());
            inventoryTransactionRepository.save(tx);
        }

        sale.setStatus(SaleStatus.CANCELLED);
        sale.setCancellationReason(request.getReason());
        sale.setCancellationDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        sale.setCancelledBy("SYSTEM");
        sale.setCancelledAt(LocalDateTime.now());

        Sale saved = saleRepository.save(sale);

        String auditDesc = "Sale cancelled: " + request.getReason();
        saleAuditHistoryRepository.save(new SaleAuditHistory(saved, "SYSTEM", SaleAuditAction.SALE_CANCELLED, auditDesc));

        return SaleResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SaleResponse> getSales(String saleNumber,
                                       SaleStatus status,
                                       LocalDate startDate,
                                       LocalDate endDate,
                                       PaymentMethod paymentMethod,
                                       String search) {
        String trimmedNumber = saleNumber != null ? saleNumber.trim() : null;
        String trimmedSearch = search != null ? search.trim() : null;

        List<Sale> sales = saleRepository.findWithFilters(trimmedNumber, status, startDate, endDate, paymentMethod, trimmedSearch);
        return sales.stream()
                .map(SaleResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getSaleInventoryTransactions(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));

        List<InventoryTransaction> transactions = inventoryTransactionRepository
                .findByReferenceIdOrderByCreatedAtAsc(sale.getSaleNumber());

        return transactions.stream()
                .map(InventoryTransactionResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SaleAuditResponse> getSaleAuditHistory(Long id) {
        if (!saleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sale not found with id: " + id);
        }
        return saleAuditHistoryRepository.findBySaleIdOrderByCreatedAtDesc(id).stream()
                .map(SaleAuditResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DailySalesReportResponse getDailySalesReport(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<Object[]> rows = saleRepository.getDailySalesMetrics(targetDate);
        long count = 0;
        BigDecimal amount = BigDecimal.ZERO;
        if (rows != null && !rows.isEmpty() && rows.get(0) != null) {
            Object[] row = rows.get(0);
            count = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            amount = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
        }
        return new DailySalesReportResponse(targetDate, count, amount.setScale(2, RoundingMode.HALF_UP));
    }

    @Override
    @Transactional(readOnly = true)
    public DateRangeSalesReportResponse getDateRangeSalesReport(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        List<Object[]> breakdownRows = saleRepository.getDateRangeSalesBreakdown(start, end);
        List<DailySalesReportResponse> breakdown = new ArrayList<>();
        long totalCount = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (breakdownRows != null) {
            for (Object[] row : breakdownRows) {
                LocalDate d = (LocalDate) row[0];
                long cnt = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                BigDecimal amt = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
                amt = amt.setScale(2, RoundingMode.HALF_UP);

                breakdown.add(new DailySalesReportResponse(d, cnt, amt));
                totalCount += cnt;
                totalAmount = totalAmount.add(amt);
            }
        }

        return new DateRangeSalesReportResponse(start, end, totalCount, totalAmount.setScale(2, RoundingMode.HALF_UP), breakdown);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSalesReportResponse> getSalesByProduct(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        List<Object[]> rows = saleItemRepository.getSalesByProduct(start, end);
        List<ProductSalesReportResponse> result = new ArrayList<>();
        if (rows != null) {
            for (Object[] row : rows) {
                Long productId = (Long) row[0];
                String productName = (String) row[1];
                String sku = (String) row[2];
                long qty = row[3] != null ? ((Number) row[3]).longValue() : 0L;
                BigDecimal amt = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;
                result.add(new ProductSalesReportResponse(productId, productName, sku, qty, amt.setScale(2, RoundingMode.HALF_UP)));
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategorySalesReportResponse> getSalesByCategory(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        List<Object[]> rows = saleItemRepository.getSalesByCategory(start, end);
        List<CategorySalesReportResponse> result = new ArrayList<>();
        if (rows != null) {
            for (Object[] row : rows) {
                Long categoryId = (Long) row[0];
                String categoryName = (String) row[1];
                long qty = row[2] != null ? ((Number) row[2]).longValue() : 0L;
                BigDecimal amt = row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO;
                result.add(new CategorySalesReportResponse(categoryId, categoryName, qty, amt.setScale(2, RoundingMode.HALF_UP)));
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentMethodSalesReportResponse> getSalesByPaymentMethod(LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        List<Object[]> rows = saleRepository.getSalesByPaymentMethod(start, end);
        List<PaymentMethodSalesReportResponse> result = new ArrayList<>();
        if (rows != null) {
            for (Object[] row : rows) {
                PaymentMethod method = (PaymentMethod) row[0];
                long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                BigDecimal amt = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
                result.add(new PaymentMethodSalesReportResponse(method, count, amt.setScale(2, RoundingMode.HALF_UP)));
            }
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CancelledSalesReportResponse> getCancelledSalesReport(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }
        List<Sale> cancelledSales = saleRepository.findCancelledSales(startDate, endDate);
        return cancelledSales.stream()
                .map(CancelledSalesReportResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SalesDashboardResponse getSalesDashboard(LocalDate date) {
        LocalDate today = date != null ? date : LocalDate.now();

        DailySalesReportResponse dailyMetrics = getDailySalesReport(today);
        Long cancelledCount = saleRepository.countCancelledSalesByDate(today);
        List<PaymentMethodSalesReportResponse> paymentMethodMetrics = getSalesByPaymentMethod(today, today);

        List<Object[]> topRows = saleItemRepository.getTopSellingProducts(today, PageRequest.of(0, 5));
        List<ProductSalesReportResponse> topProducts = new ArrayList<>();
        if (topRows != null) {
            for (Object[] row : topRows) {
                Long productId = (Long) row[0];
                String productName = (String) row[1];
                String sku = (String) row[2];
                long qty = row[3] != null ? ((Number) row[3]).longValue() : 0L;
                BigDecimal amt = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;
                topProducts.add(new ProductSalesReportResponse(productId, productName, sku, qty, amt.setScale(2, RoundingMode.HALF_UP)));
            }
        }

        return new SalesDashboardResponse(
                today,
                dailyMetrics.getTotalSalesCount(),
                dailyMetrics.getTotalSalesAmount(),
                cancelledCount != null ? cancelledCount : 0L,
                paymentMethodMetrics,
                topProducts
        );
    }

    private List<SaleItemRequest> validateAndMergeItems(List<SaleItemRequest> items) {
        Map<Long, List<SaleItemRequest>> grouped = new LinkedHashMap<>();
        for (SaleItemRequest item : items) {
            if (item.getProductId() == null) {
                throw new IllegalArgumentException("Product ID is required");
            }
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new IllegalArgumentException("Item quantity must be at least 1");
            }
            if (item.getSellingPrice() == null || item.getSellingPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Selling price cannot be negative");
            }
            grouped.computeIfAbsent(item.getProductId(), k -> new ArrayList<>()).add(item);
        }

        List<SaleItemRequest> merged = new ArrayList<>();
        for (Map.Entry<Long, List<SaleItemRequest>> entry : grouped.entrySet()) {
            List<SaleItemRequest> list = entry.getValue();
            BigDecimal expectedPrice = list.get(0).getSellingPrice().setScale(2, RoundingMode.HALF_UP);
            int totalQty = 0;
            for (SaleItemRequest req : list) {
                BigDecimal currentPrice = req.getSellingPrice().setScale(2, RoundingMode.HALF_UP);
                if (currentPrice.compareTo(expectedPrice) != 0) {
                    throw new IllegalArgumentException(
                            "Duplicate product id " + entry.getKey() + " with different selling prices is not allowed"
                    );
                }
                totalQty += req.getQuantity();
            }
            merged.add(new SaleItemRequest(entry.getKey(), totalQty, expectedPrice));
        }
        return merged;
    }

    private BigDecimal calculateSubtotal(List<SaleItemRequest> items) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (SaleItemRequest item : items) {
            BigDecimal itemTotal = item.getSellingPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(itemTotal);
        }
        return subtotal.setScale(2, RoundingMode.HALF_UP);
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
}
