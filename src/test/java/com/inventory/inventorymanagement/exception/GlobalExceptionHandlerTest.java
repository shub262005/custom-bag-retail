package com.inventory.inventorymanagement.exception;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {
    @Test
    void unexpectedFailureDoesNotExposeServerDetails() {
        var request = new MockHttpServletRequest("GET", "/api/v1/products");
        var response = new GlobalExceptionHandler().handleGlobalException(
                new RuntimeException("SQL connection failed: private-host secret-password"), request);
        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred. Please try again or contact the store.",
                response.getBody().getMessage());
    }
}
