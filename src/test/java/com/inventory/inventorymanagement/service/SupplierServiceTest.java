package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.SupplierEmailRequest;
import com.inventory.inventorymanagement.dto.SupplierPhoneRequest;
import com.inventory.inventorymanagement.dto.SupplierRequest;
import com.inventory.inventorymanagement.dto.SupplierResponse;
import com.inventory.inventorymanagement.entity.Supplier;
import com.inventory.inventorymanagement.entity.SupplierEmail;
import com.inventory.inventorymanagement.entity.SupplierPhone;
import com.inventory.inventorymanagement.entity.SupplierStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.ResourceNotFoundException;
import com.inventory.inventorymanagement.repository.SupplierRepository;
import com.inventory.inventorymanagement.service.impl.SupplierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    private Supplier sampleSupplier;

    @BeforeEach
    void setUp() {
        sampleSupplier = new Supplier(
                1L, "ABC Bags", "27AAPFU0939F1ZV", "123 Market Road, Solapur",
                SupplierStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now()
        );
        sampleSupplier.addPhone(new SupplierPhone(1L, sampleSupplier, "9876543210", "Office"));
        sampleSupplier.addEmail(new SupplierEmail(1L, sampleSupplier, "contact@abcbags.com", "General"));
    }

    @Test
    void createSupplier_Success_WithAllFields() {
        SupplierRequest request = new SupplierRequest(
                "ABC Bags", "27AAPFU0939F1ZV", "123 Market Road, Solapur",
                List.of(new SupplierPhoneRequest("9876543210", "Office")),
                List.of(new SupplierEmailRequest("contact@abcbags.com", "General"))
        );

        when(supplierRepository.existsByNameIgnoreCase("ABC Bags")).thenReturn(false);
        when(supplierRepository.existsByGstNumberIgnoreCase("27AAPFU0939F1ZV")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("ABC Bags", response.getName());
        assertEquals("27AAPFU0939F1ZV", response.getGstNumber());
        assertEquals(SupplierStatus.ACTIVE, response.getStatus());
        assertEquals(1, response.getPhones().size());
        assertEquals("9876543210", response.getPhones().get(0).getPhoneNumber());
        assertEquals(1, response.getEmails().size());
        assertEquals("contact@abcbags.com", response.getEmails().get(0).getEmail());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void createSupplier_DefaultsToActive() {
        SupplierRequest request = new SupplierRequest("XYZ Traders", null, null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("XYZ Traders")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier s = invocation.getArgument(0);
            s.setId(2L);
            return s;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(SupplierStatus.ACTIVE, response.getStatus());
    }

    @Test
    void createSupplier_DuplicateName_ThrowsDuplicateResourceException() {
        SupplierRequest request = new SupplierRequest("ABC Bags", null, null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("ABC Bags")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.createSupplier(request));

        assertTrue(ex.getMessage().contains("already exists"));
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void createSupplier_DuplicateName_CaseInsensitive_ThrowsDuplicateResourceException() {
        SupplierRequest request = new SupplierRequest("abc bags", null, null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("abc bags")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.createSupplier(request));
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void createSupplier_WithoutGst_Success() {
        SupplierRequest request = new SupplierRequest("No GST Supplier", null, "Local Market", null, null);

        when(supplierRepository.existsByNameIgnoreCase("No GST Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier s = invocation.getArgument(0);
            s.setId(3L);
            return s;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertNull(response.getGstNumber());
        verify(supplierRepository, never()).existsByGstNumberIgnoreCase(any());
    }

    @Test
    void createSupplier_WithGst_Success() {
        SupplierRequest request = new SupplierRequest("GST Supplier", "29ABCDE1234F1Z5", null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("GST Supplier")).thenReturn(false);
        when(supplierRepository.existsByGstNumberIgnoreCase("29ABCDE1234F1Z5")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier s = invocation.getArgument(0);
            s.setId(4L);
            return s;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals("29ABCDE1234F1Z5", response.getGstNumber());
    }

    @Test
    void createSupplier_DuplicateGst_ThrowsDuplicateResourceException() {
        SupplierRequest request = new SupplierRequest("Unique Name", "27AAPFU0939F1ZV", null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("Unique Name")).thenReturn(false);
        when(supplierRepository.existsByGstNumberIgnoreCase("27AAPFU0939F1ZV")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> supplierService.createSupplier(request));

        assertTrue(ex.getMessage().contains("GST number '27AAPFU0939F1ZV' already exists"));
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void createSupplier_MultipleWithoutGst_Allowed() {
        SupplierRequest request1 = new SupplierRequest("Supplier One", null, null, null, null);
        SupplierRequest request2 = new SupplierRequest("Supplier Two", "  ", null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("Supplier One")).thenReturn(false);
        when(supplierRepository.existsByNameIgnoreCase("Supplier Two")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> supplierService.createSupplier(request1));
        assertDoesNotThrow(() -> supplierService.createSupplier(request2));
    }

    @Test
    void createSupplier_WithoutPhones_Success() {
        SupplierRequest request = new SupplierRequest("No Phone Supplier", null, null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("No Phone Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertTrue(response.getPhones().isEmpty());
    }

    @Test
    void createSupplier_WithMultiplePhones_Success() {
        SupplierRequest request = new SupplierRequest(
                "Multi Phone Supplier", null, null,
                List.of(new SupplierPhoneRequest("9876543210", "Office"),
                        new SupplierPhoneRequest("9123456789", "WhatsApp")),
                null
        );

        when(supplierRepository.existsByNameIgnoreCase("Multi Phone Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(2, response.getPhones().size());
    }

    @Test
    void createSupplier_WithoutEmails_Success() {
        SupplierRequest request = new SupplierRequest("No Email Supplier", null, null, null, null);

        when(supplierRepository.existsByNameIgnoreCase("No Email Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertTrue(response.getEmails().isEmpty());
    }

    @Test
    void createSupplier_WithMultipleEmails_Success() {
        SupplierRequest request = new SupplierRequest(
                "Multi Email Supplier", null, null, null,
                List.of(new SupplierEmailRequest("accounts@test.com", "Accounts"),
                        new SupplierEmailRequest("orders@test.com", "Orders"))
        );

        when(supplierRepository.existsByNameIgnoreCase("Multi Email Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(2, response.getEmails().size());
    }

    @Test
    void createSupplier_OmitPhoneLabel_Success() {
        SupplierRequest request = new SupplierRequest(
                "Phone No Label", null, null,
                List.of(new SupplierPhoneRequest("9876543210", null)),
                null
        );

        when(supplierRepository.existsByNameIgnoreCase("Phone No Label")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(1, response.getPhones().size());
        assertNull(response.getPhones().get(0).getLabel());
    }

    @Test
    void createSupplier_OmitEmailLabel_Success() {
        SupplierRequest request = new SupplierRequest(
                "Email No Label", null, null, null,
                List.of(new SupplierEmailRequest("test@example.com", null))
        );

        when(supplierRepository.existsByNameIgnoreCase("Email No Label")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(1, response.getEmails().size());
        assertNull(response.getEmails().get(0).getLabel());
    }

    @Test
    void createSupplier_SamePhoneBelongsToDifferentSuppliers_Allowed() {
        SupplierRequest request = new SupplierRequest(
                "Second Supplier", null, null,
                List.of(new SupplierPhoneRequest("9876543210", "Common Support")),
                null
        );

        when(supplierRepository.existsByNameIgnoreCase("Second Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals("9876543210", response.getPhones().get(0).getPhoneNumber());
    }

    @Test
    void createSupplier_SameEmailBelongsToDifferentSuppliers_Allowed() {
        SupplierRequest request = new SupplierRequest(
                "Another Supplier", null, null, null,
                List.of(new SupplierEmailRequest("contact@abcbags.com", "Shared"))
        );

        when(supplierRepository.existsByNameIgnoreCase("Another Supplier")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals("contact@abcbags.com", response.getEmails().get(0).getEmail());
    }

    @Test
    void getSupplierById_Success() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));

        SupplierResponse response = supplierService.getSupplierById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("ABC Bags", response.getName());
    }

    @Test
    void getSupplierById_NotFound_ThrowsResourceNotFoundException() {
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> supplierService.getSupplierById(99L));
    }

    @Test
    void updateSupplier_Success() {
        SupplierRequest request = new SupplierRequest(
                "ABC Bags International", "27AAPFU0939F1ZV", "456 New Road, Mumbai",
                List.of(new SupplierPhoneRequest("9998887776", "Primary")),
                List.of(new SupplierEmailRequest("info@abcbags.com", "Sales"))
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("ABC Bags International", 1L)).thenReturn(false);
        when(supplierRepository.existsByGstNumberIgnoreCaseAndIdNot("27AAPFU0939F1ZV", 1L)).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.updateSupplier(1L, request);

        assertNotNull(response);
        assertEquals("ABC Bags International", sampleSupplier.getName());
        assertEquals("456 New Road, Mumbai", sampleSupplier.getAddress());
        assertEquals(1, sampleSupplier.getPhones().size());
        assertEquals("9998887776", sampleSupplier.getPhones().get(0).getPhoneNumber());
        assertEquals(1, sampleSupplier.getEmails().size());
        assertEquals("info@abcbags.com", sampleSupplier.getEmails().get(0).getEmail());
    }

    @Test
    void updateSupplier_DuplicateName_ThrowsDuplicateResourceException() {
        SupplierRequest request = new SupplierRequest("Existing Supplier", null, null, null, null);

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("Existing Supplier", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.updateSupplier(1L, request));
        verify(supplierRepository, never()).save(sampleSupplier);
    }

    @Test
    void updateSupplier_DuplicateGst_ThrowsDuplicateResourceException() {
        SupplierRequest request = new SupplierRequest("ABC Bags", "29OTHERGST1234F", null, null, null);

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("ABC Bags", 1L)).thenReturn(false);
        when(supplierRepository.existsByGstNumberIgnoreCaseAndIdNot("29OTHERGST1234F", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.updateSupplier(1L, request));
        verify(supplierRepository, never()).save(sampleSupplier);
    }

    @Test
    void updateSupplier_UpdatesNestedContacts() {
        SupplierRequest request = new SupplierRequest(
                "ABC Bags", null, null,
                List.of(new SupplierPhoneRequest("1112223334", "New Phone")),
                List.of(new SupplierEmailRequest("new@abcbags.com", "New Email"))
        );

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("ABC Bags", 1L)).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.updateSupplier(1L, request);

        assertNotNull(response);
        assertEquals(1, sampleSupplier.getPhones().size());
        assertEquals("1112223334", sampleSupplier.getPhones().get(0).getPhoneNumber());
        assertEquals(1, sampleSupplier.getEmails().size());
        assertEquals("new@abcbags.com", sampleSupplier.getEmails().get(0).getEmail());
    }

    @Test
    void searchSuppliers_ByName() {
        when(supplierRepository.searchSuppliers("ABC")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> list = supplierService.searchSuppliers("ABC");

        assertEquals(1, list.size());
        assertEquals("ABC Bags", list.get(0).getName());
    }

    @Test
    void searchSuppliers_ByGstNumber() {
        when(supplierRepository.searchSuppliers("0939F1ZV")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> list = supplierService.searchSuppliers("0939F1ZV");

        assertEquals(1, list.size());
        assertEquals("27AAPFU0939F1ZV", list.get(0).getGstNumber());
    }

    @Test
    void searchSuppliers_ByPhone() {
        when(supplierRepository.searchSuppliers("9876543210")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> list = supplierService.searchSuppliers("9876543210");

        assertEquals(1, list.size());
        assertEquals(1, list.get(0).getPhones().size());
    }

    @Test
    void searchSuppliers_ByEmail() {
        when(supplierRepository.searchSuppliers("contact@abcbags.com")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> list = supplierService.searchSuppliers("contact@abcbags.com");

        assertEquals(1, list.size());
        assertEquals(1, list.get(0).getEmails().size());
    }

    @Test
    void searchSuppliers_EmptyQuery_ReturnsEmptyList() {
        List<SupplierResponse> list = supplierService.searchSuppliers("   ");

        assertTrue(list.isEmpty());
        verify(supplierRepository, never()).searchSuppliers(any());
    }

    @Test
    void getAllSuppliers_FilterActive() {
        when(supplierRepository.findByStatus(SupplierStatus.ACTIVE)).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> list = supplierService.getAllSuppliers(SupplierStatus.ACTIVE);

        assertEquals(1, list.size());
        assertEquals(SupplierStatus.ACTIVE, list.get(0).getStatus());
    }

    @Test
    void getAllSuppliers_FilterInactive() {
        Supplier inactiveSupplier = new Supplier(2L, "Inactive Co", null, null, SupplierStatus.INACTIVE, LocalDateTime.now(), LocalDateTime.now());
        when(supplierRepository.findByStatus(SupplierStatus.INACTIVE)).thenReturn(List.of(inactiveSupplier));

        List<SupplierResponse> list = supplierService.getAllSuppliers(SupplierStatus.INACTIVE);

        assertEquals(1, list.size());
        assertEquals(SupplierStatus.INACTIVE, list.get(0).getStatus());
    }

    @Test
    void updateSupplierStatus_ActiveToInactive() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.updateSupplierStatus(1L, SupplierStatus.INACTIVE);

        assertNotNull(response);
        assertEquals(SupplierStatus.INACTIVE, sampleSupplier.getStatus());
        verify(supplierRepository).save(sampleSupplier);
    }

    @Test
    void updateSupplierStatus_InactiveToActive() {
        sampleSupplier.setStatus(SupplierStatus.INACTIVE);
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.updateSupplierStatus(1L, SupplierStatus.ACTIVE);

        assertNotNull(response);
        assertEquals(SupplierStatus.ACTIVE, sampleSupplier.getStatus());
        verify(supplierRepository).save(sampleSupplier);
    }
}
