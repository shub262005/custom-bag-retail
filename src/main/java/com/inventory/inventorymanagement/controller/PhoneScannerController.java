package com.inventory.inventorymanagement.controller;

import com.inventory.inventorymanagement.security.CurrentUserService;
import com.inventory.inventorymanagement.service.PhoneScannerService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/scanner")
public class PhoneScannerController {
    private final PhoneScannerService service;
    private final CurrentUserService currentUser;
    public PhoneScannerController(PhoneScannerService service, CurrentUserService currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    public record PollRequest(boolean accepting, @NotBlank @Size(max = 100) String targetId, @NotBlank @Size(max = 200) String targetLabel) {}
    public record PairRequest(@NotBlank @Size(max = 100) String token) {}
    public record ScanRequest(@NotBlank @Size(max = 64) String id, @NotBlank @Size(max = 50) String code, @NotBlank @Size(max = 100) String targetId) {}
    public record AckRequest(boolean accepted, @NotBlank @Size(max = 300) String message) {}

    @ModelAttribute
    public void noCache(HttpServletResponse response) { response.setHeader("Cache-Control", "no-store"); }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public PhoneScannerService.Pairing create() { return service.create(owner()); }

    @PostMapping("/sessions/{id}/poll")
    public PhoneScannerService.Status poll(@PathVariable String id, @Valid @RequestBody PollRequest request) {
        return service.poll(id, owner(), request.accepting(), request.targetId(), request.targetLabel());
    }

    @PostMapping("/sessions/{id}/scans/{scanId}/ack")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acknowledge(@PathVariable String id, @PathVariable String scanId, @Valid @RequestBody AckRequest request) {
        service.acknowledge(id, owner(), scanId, request.accepted(), request.message());
    }

    @DeleteMapping("/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void close(@PathVariable String id) { service.close(id, owner()); }

    // These endpoints use a limited, ephemeral capability rather than sharing the staff JWT.
    @PostMapping("/device/{id}/pair")
    public PhoneScannerService.Device pair(@PathVariable String id, @Valid @RequestBody PairRequest request) {
        return service.pair(id, request.token());
    }

    @PostMapping("/device/{id}/scans")
    public PhoneScannerService.Scan scan(@PathVariable String id, @RequestHeader(value = "X-Scanner-Token", required = false) String token,
                                         @Valid @RequestBody ScanRequest request) {
        return service.submit(id, token, request.id(), request.code(), request.targetId());
    }

    @GetMapping("/device/{id}/status")
    public PhoneScannerService.Status status(@PathVariable String id, @RequestHeader(value = "X-Scanner-Token", required = false) String token,
                                             @RequestParam(required = false) String scanId) {
        return service.deviceStatus(id, token, scanId);
    }

    private Long owner() {
        return currentUser.getCurrentUser().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Staff login required.")).id();
    }
}
