package com.inventory.inventorymanagement.repository;

import com.inventory.inventorymanagement.entity.PaymentMethod;
import com.inventory.inventorymanagement.entity.Sale;
import com.inventory.inventorymanagement.entity.SaleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findBySaleNumber(String saleNumber);

    boolean existsBySaleNumber(String saleNumber);

    @Query("SELECT DISTINCT s FROM Sale s " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product prod " +
           "LEFT JOIN FETCH s.payment p " +
           "WHERE (:saleNumber IS NULL OR LOWER(s.saleNumber) LIKE LOWER(CONCAT('%', :saleNumber, '%'))) " +
           "  AND (:status IS NULL OR s.status = :status) " +
           "  AND (:startDate IS NULL OR s.saleDate >= :startDate) " +
           "  AND (:endDate IS NULL OR s.saleDate <= :endDate) " +
           "  AND (:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) " +
           "  AND (:search IS NULL OR (" +
           "       LOWER(prod.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       LOWER(prod.sku) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       (prod.barcode IS NOT NULL AND LOWER(prod.barcode) LIKE LOWER(CONCAT('%', :search, '%')))" +
           "  )) " +
           "ORDER BY s.saleDate DESC, s.id DESC")
    List<Sale> findWithFilters(@Param("saleNumber") String saleNumber,
                               @Param("status") SaleStatus status,
                               @Param("startDate") LocalDate startDate,
                               @Param("endDate") LocalDate endDate,
                               @Param("paymentMethod") PaymentMethod paymentMethod,
                               @Param("search") String search);

    @Query("SELECT COUNT(s), COALESCE(SUM(s.grandTotal), 0) " +
           "FROM Sale s " +
           "WHERE s.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND s.saleDate = :date")
    List<Object[]> getDailySalesMetrics(@Param("date") LocalDate date);

    @Query("SELECT s.saleDate, COUNT(s), COALESCE(SUM(s.grandTotal), 0) " +
           "FROM Sale s " +
           "WHERE s.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND s.saleDate BETWEEN :startDate AND :endDate " +
           "GROUP BY s.saleDate " +
           "ORDER BY s.saleDate ASC")
    List<Object[]> getDateRangeSalesBreakdown(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    @Query("SELECT p.paymentMethod, COUNT(s), COALESCE(SUM(s.grandTotal), 0) " +
           "FROM Sale s " +
           "JOIN s.payment p " +
           "WHERE s.status = com.inventory.inventorymanagement.entity.SaleStatus.COMPLETED " +
           "  AND s.saleDate BETWEEN :startDate AND :endDate " +
           "  AND p.paymentMethod IS NOT NULL " +
           "GROUP BY p.paymentMethod " +
           "ORDER BY SUM(s.grandTotal) DESC")
    List<Object[]> getSalesByPaymentMethod(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(s) " +
           "FROM Sale s " +
           "WHERE s.status = com.inventory.inventorymanagement.entity.SaleStatus.CANCELLED " +
           "  AND s.saleDate = :date")
    Long countCancelledSalesByDate(@Param("date") LocalDate date);

    @Query("SELECT DISTINCT s FROM Sale s " +
           "LEFT JOIN FETCH s.items i " +
           "LEFT JOIN FETCH i.product prod " +
           "LEFT JOIN FETCH s.payment p " +
           "WHERE s.status = com.inventory.inventorymanagement.entity.SaleStatus.CANCELLED " +
           "  AND (:startDate IS NULL OR s.saleDate >= :startDate) " +
           "  AND (:endDate IS NULL OR s.saleDate <= :endDate) " +
           "ORDER BY s.saleDate DESC, s.id DESC")
    List<Sale> findCancelledSales(@Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);
}
