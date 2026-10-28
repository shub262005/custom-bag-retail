package com.inventory.inventorymanagement.service.impl;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.*;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.CustomerRepaymentRepository;
import com.inventory.inventorymanagement.repository.CustomerRepository;
import com.inventory.inventorymanagement.repository.SaleRepository;
import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.CustomerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerRepaymentRepository repaymentRepository;
    private final SaleRepository saleRepository;
    private final CurrentUserService currentUserService;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               CustomerRepaymentRepository repaymentRepository,
                               SaleRepository saleRepository,
                               CurrentUserService currentUserService) {
        this.customerRepository = customerRepository;
        this.repaymentRepository = repaymentRepository;
        this.saleRepository = saleRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer phone number is required");
        }

        String trimmedPhone = request.getPhone().trim();
        if (customerRepository.existsByPhone(trimmedPhone)) {
            throw new IllegalArgumentException("Customer with phone number " + trimmedPhone + " already exists");
        }

        Customer customer = new Customer(
                request.getName().trim(),
                trimmedPhone,
                request.getEmail() != null ? request.getEmail().trim() : null,
                request.getAddress() != null ? request.getAddress().trim() : null,
                request.getStatus() != null ? request.getStatus() : CustomerStatus.ACTIVE
        );

        Customer saved = customerRepository.save(customer);
        return toCustomerResponseWithStats(saved);
    }

    @Override
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer phone number is required");
        }

        String trimmedPhone = request.getPhone().trim();
        customerRepository.findByPhone(trimmedPhone).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Customer with phone number " + trimmedPhone + " already exists");
            }
        });

        customer.setName(request.getName().trim());
        customer.setPhone(trimmedPhone);
        customer.setEmail(request.getEmail() != null ? request.getEmail().trim() : null);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        if (request.getStatus() != null) {
            customer.setStatus(request.getStatus());
        }

        Customer saved = customerRepository.save(customer);
        return toCustomerResponseWithStats(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return toCustomerResponseWithStats(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getCustomers(String query, CustomerStatus status) {
        String trimmedQuery = query != null ? query.trim() : null;
        List<Customer> customers = customerRepository.findWithFilters(trimmedQuery, status);
        return customers.stream()
                .map(this::toCustomerResponseWithStats)
                .toList();
    }

    @Override
    public Customer getOrCreateCustomer(Long customerId, String name, String phone, String email, String address) {
        if (customerId != null) {
            return customerRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        }

        if (phone != null && !phone.trim().isEmpty()) {
            String trimmedPhone = phone.trim();
            var existing = customerRepository.findByPhone(trimmedPhone);
            if (existing.isPresent()) {
                Customer cust = existing.get();
                if (name != null && !name.trim().isEmpty() && !cust.getName().equalsIgnoreCase(name.trim())) {
                    cust.setName(name.trim());
                    cust = customerRepository.save(cust);
                }
                return cust;
            }

            if (name != null && !name.trim().isEmpty()) {
                Customer newCust = new Customer(
                        name.trim(),
                        trimmedPhone,
                        email != null ? email.trim() : null,
                        address != null ? address.trim() : null,
                        CustomerStatus.ACTIVE
                );
                return customerRepository.save(newCust);
            }
        }

        return null;
    }

    @Override
    public CustomerRepaymentResponse recordRepayment(CustomerRepaymentRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Repayment amount must be greater than zero");
        }
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Payment method is required");
        }

        Customer customer = null;
        Sale targetSale = null;

        if (request.getSaleId() != null) {
            targetSale = saleRepository.findById(request.getSaleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + request.getSaleId()));
            customer = targetSale.getCustomer();
            if (customer == null && request.getCustomerId() != null) {
                customer = customerRepository.findById(request.getCustomerId()).orElse(null);
            }
        } else if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
        }

        if (customer == null) {
            throw new IllegalArgumentException("Customer is required for recording repayment");
        }

        BigDecimal remainingToApply = request.getAmount();

        if (targetSale != null) {
            BigDecimal due = targetSale.getDueAmount() != null ? targetSale.getDueAmount() : BigDecimal.ZERO;
            if (remainingToApply.compareTo(due) > 0) {
                throw new IllegalArgumentException(
                        "Repayment amount (₹" + remainingToApply + ") cannot exceed remaining due amount (₹" + due + ") for sale " + targetSale.getSaleNumber()
                );
            }

            BigDecimal paid = targetSale.getPaidAmount() != null ? targetSale.getPaidAmount() : BigDecimal.ZERO;
            targetSale.setPaidAmount(paid.add(remainingToApply));
            BigDecimal newDue = due.subtract(remainingToApply);
            targetSale.setDueAmount(newDue);

            if (newDue.compareTo(BigDecimal.ZERO) <= 0) {
                targetSale.setDueAmount(BigDecimal.ZERO);
                targetSale.setPaymentStatus(PaymentStatus.PAID);
            } else {
                targetSale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
            }
            saleRepository.save(targetSale);
        } else {
            List<Sale> customerDueSales = saleRepository.findByCustomerId(customer.getId()).stream()
                    .filter(s -> s.getStatus() == SaleStatus.COMPLETED && s.getDueAmount().compareTo(BigDecimal.ZERO) > 0)
                    .sorted((a, b) -> a.getSaleDate().compareTo(b.getSaleDate()))
                    .toList();

            for (Sale sale : customerDueSales) {
                if (remainingToApply.compareTo(BigDecimal.ZERO) <= 0) break;

                BigDecimal saleDue = sale.getDueAmount();
                BigDecimal deduct = remainingToApply.min(saleDue);

                sale.setPaidAmount(sale.getPaidAmount().add(deduct));
                BigDecimal updatedDue = saleDue.subtract(deduct);
                sale.setDueAmount(updatedDue);

                if (updatedDue.compareTo(BigDecimal.ZERO) <= 0) {
                    sale.setDueAmount(BigDecimal.ZERO);
                    sale.setPaymentStatus(PaymentStatus.PAID);
                } else {
                    sale.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
                }
                saleRepository.save(sale);
                remainingToApply = remainingToApply.subtract(deduct);
            }
        }

        LocalDate repaymentDate = request.getRepaymentDate() != null ? request.getRepaymentDate() : LocalDate.now();
        String receivedBy = currentUserService.getActorIdentifier();

        CustomerRepayment repayment = new CustomerRepayment(
                customer,
                targetSale,
                request.getAmount(),
                request.getPaymentMethod(),
                repaymentDate,
                request.getNotes() != null ? request.getNotes().trim() : null,
                receivedBy
        );

        CustomerRepayment saved = repaymentRepository.save(repayment);
        return CustomerRepaymentResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerRepaymentResponse> getCustomerRepayments(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }
        return repaymentRepository.findByCustomerIdOrderByRepaymentDateDescCreatedAtDesc(customerId).stream()
                .map(CustomerRepaymentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SaleResponse> getCustomerSales(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }
        return saleRepository.findByCustomerId(customerId).stream()
                .map(SaleResponse::fromEntity)
                .toList();
    }

    private CustomerResponse toCustomerResponseWithStats(Customer customer) {
        CustomerResponse response = CustomerResponse.fromEntity(customer);
        List<Object[]> stats = saleRepository.getCustomerSalesStats(customer.getId());
        if (stats != null && !stats.isEmpty() && stats.get(0) != null) {
            Object[] row = stats.get(0);
            long count = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            BigDecimal purchasesTotal = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            BigDecimal paidTotal = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            BigDecimal dueTotal = row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO;

            response.setTotalPurchasesCount(count);
            response.setTotalPurchasesAmount(purchasesTotal);
            response.setTotalPaidAmount(paidTotal);
            response.setTotalDueAmount(dueTotal);
        }

        BigDecimal repaid = repaymentRepository.getTotalRepaidByCustomerId(customer.getId());
        response.setTotalRepaidAmount(repaid != null ? repaid : BigDecimal.ZERO);

        return response;
    }
}
