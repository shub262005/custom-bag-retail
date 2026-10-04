package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.dto.*;
import com.inventory.inventorymanagement.service.CustomBagRequestService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import com.inventory.inventorymanagement.service.CustomBagLogoStorageService.StoredLogo;

@RestController
@RequestMapping("/api/v1/custom-bag-requests")
public class CustomBagRequestController {
    private final CustomBagRequestService service;
    public CustomBagRequestController(CustomBagRequestService service) { this.service = service; }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CustomBagRequestResponse> create(
            @Valid @RequestPart("request") CustomBagRequestCreateRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, logo));
    }

    @GetMapping("/mine")
    public List<CustomBagRequestSummaryResponse> mine() { return service.getMine(); }

    @GetMapping("/mine/{id}")
    public CustomBagRequestResponse mineById(@PathVariable Long id) { return service.getMineById(id); }

    @GetMapping("/mine/{id}/logo")
    public ResponseEntity<org.springframework.core.io.Resource> mineLogo(@PathVariable Long id) {
        StoredLogo logo = service.getMineLogo(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(logo.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                .body(logo.resource());
    }
}
