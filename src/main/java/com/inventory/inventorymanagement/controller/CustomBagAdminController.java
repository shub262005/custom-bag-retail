package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.entity.CustomBagRequestStatus;
import com.inventory.inventorymanagement.service.CustomBagLogoStorageService.StoredLogo;
import com.inventory.inventorymanagement.service.CustomBagRequestService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/custom-bag-requests/admin")
public class CustomBagAdminController {
    private final CustomBagRequestService service;
    public CustomBagAdminController(CustomBagRequestService service) { this.service = service; }

    @GetMapping
    public List<CustomBagAdminSummaryResponse> list(@RequestParam(required = false) CustomBagRequestStatus status,
            @RequestParam(required = false) String requestNumber, @RequestParam(required = false) String customer) {
        return service.getAdminRequests(status, requestNumber, customer);
    }

    @GetMapping("/{id}")
    public CustomBagRequestResponse detail(@PathVariable Long id) { return service.getAdminById(id); }

    @GetMapping("/{id}/logo")
    public ResponseEntity<Resource> logo(@PathVariable Long id) {
        StoredLogo logo = service.getAdminLogo(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(logo.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300").body(logo.resource());
    }

    @PatchMapping("/{id}")
    public CustomBagRequestResponse update(@PathVariable Long id, @Valid @RequestBody CustomBagAdminUpdateRequest request) {
        return service.updateAdminReview(id, request);
    }
}
