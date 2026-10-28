package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CustomerRepaymentRequest;
import com.inventory.inventorymanagement.dto.CustomerRepaymentResponse;
import com.inventory.inventorymanagement.dto.CustomerRequest;
import com.inventory.inventorymanagement.dto.CustomerResponse;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.repository.CustomerRepaymentRepository;
import com.inventory.inventorymanagement.repository.CustomerRepository;
import com.inventory.inventorymanagement.repository.SaleRepository;
import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerRepaymentRepository repaymentRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        lenient().when(currentUserService.getActorIdentifier()).thenReturn("cashier@roopam.local");
        sampleCustomer = new Customer(1L, "Rahul Sharma", "9876543210", "rahul@example.com", "Pune", CustomerStatus.ACTIVE);
    }

    @Test
    void createCustomer_Success() {
        CustomerRequest req = new CustomerRequest("Rahul Sharma", "9876543210", "rahul@example.com", "Pune", CustomerStatus.ACTIVE);
        when(customerRepository.existsByPhone("9876543210")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(sampleCustomer);

        CustomerResponse response = customerService.createCustomer(req);

        assertNotNull(response);
        assertEquals("Rahul Sharma", response.getName());
        assertEquals("9876543210", response.getPhone());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    void createCustomer_DuplicatePhone_ThrowsException() {
        CustomerRequest req = new CustomerRequest("Rahul Sharma", "9876543210", null, null, null);
        when(customerRepository.existsByPhone("9876543210")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> customerService.createCustomer(req));
    }

    @Test
    void recordRepayment_SpecificSale_UpdatesSaleDueAndPaid() {
        Sale sale = new Sale();
        sale.setId(10L);
        sale.setSaleNumber("SAL-2026-000001");
        sale.setGrandTotal(new BigDecimal("2000.00"));
        sale.setPaidAmount(new BigDecimal("500.00"));
        sale.setDueAmount(new BigDecimal("1500.00"));
        sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        sale.setCustomer(sampleCustomer);

        when(saleRepository.findById(10L)).thenReturn(Optional.of(sale));

        CustomerRepayment repayment = new CustomerRepayment(sampleCustomer, sale, new BigDecimal("1000.00"),
                PaymentMethod.UPI, LocalDate.now(), "Part payment", "cashier@roopam.local");
        repayment.setId(100L);
        when(repaymentRepository.save(any(CustomerRepayment.class))).thenReturn(repayment);

        CustomerRepaymentRequest req = new CustomerRepaymentRequest(1L, 10L, new BigDecimal("1000.00"),
                PaymentMethod.UPI, LocalDate.now(), "Part payment");

        CustomerRepaymentResponse resp = customerService.recordRepayment(req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("1000.00"), resp.getAmount());
        assertEquals(new BigDecimal("1500.00"), sale.getPaidAmount());
        assertEquals(new BigDecimal("500.00"), sale.getDueAmount());
        assertEquals(PaymentStatus.PARTIALLY_PAID, sale.getPaymentStatus());
        verify(saleRepository, times(1)).save(sale);
    }

    @Test
    void recordRepayment_FullRepayment_SetsSaleStatusToPaid() {
        Sale sale = new Sale();
        sale.setId(10L);
        sale.setGrandTotal(new BigDecimal("1000.00"));
        sale.setPaidAmount(BigDecimal.ZERO);
        sale.setDueAmount(new BigDecimal("1000.00"));
        sale.setPaymentStatus(PaymentStatus.UNPAID);
        sale.setCustomer(sampleCustomer);

        when(saleRepository.findById(10L)).thenReturn(Optional.of(sale));

        CustomerRepayment repayment = new CustomerRepayment(sampleCustomer, sale, new BigDecimal("1000.00"),
                PaymentMethod.CASH, LocalDate.now(), null, "cashier@roopam.local");
        repayment.setId(101L);
        when(repaymentRepository.save(any(CustomerRepayment.class))).thenReturn(repayment);

        CustomerRepaymentRequest req = new CustomerRepaymentRequest(1L, 10L, new BigDecimal("1000.00"),
                PaymentMethod.CASH, LocalDate.now(), null);

        CustomerRepaymentResponse resp = customerService.recordRepayment(req);

        assertNotNull(resp);
        assertEquals(new BigDecimal("1000.00"), sale.getPaidAmount());
        assertEquals(BigDecimal.ZERO, sale.getDueAmount());
        assertEquals(PaymentStatus.PAID, sale.getPaymentStatus());
    }

    @Test
    void recordRepayment_ExceedsDue_ThrowsException() {
        Sale sale = new Sale();
        sale.setId(10L);
        sale.setDueAmount(new BigDecimal("500.00"));
        sale.setCustomer(sampleCustomer);
        when(saleRepository.findById(10L)).thenReturn(Optional.of(sale));

        CustomerRepaymentRequest req = new CustomerRepaymentRequest(1L, 10L, new BigDecimal("600.00"),
                PaymentMethod.CASH, LocalDate.now(), null);

        assertThrows(IllegalArgumentException.class, () -> customerService.recordRepayment(req));
    }
}
