package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CustomBagRequestCreateRequest;
import com.inventory.inventorymanagement.dto.CustomBagRequestResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import com.inventory.inventorymanagement.dto.CustomBagRequestSummaryResponse;
import com.inventory.inventorymanagement.dto.CustomBagAdminSummaryResponse;
import com.inventory.inventorymanagement.dto.CustomBagAdminUpdateRequest;
import com.inventory.inventorymanagement.entity.CustomBagRequestStatus;
import com.inventory.inventorymanagement.service.CustomBagLogoStorageService.StoredLogo;

public interface CustomBagRequestService {
    CustomBagRequestResponse create(CustomBagRequestCreateRequest request, MultipartFile logo);
    List<CustomBagRequestSummaryResponse> getMine();
    CustomBagRequestResponse getMineById(Long id);
    StoredLogo getMineLogo(Long id);
    List<CustomBagAdminSummaryResponse> getAdminRequests(CustomBagRequestStatus status, String requestNumber, String customer);
    CustomBagRequestResponse getAdminById(Long id);
    StoredLogo getAdminLogo(Long id);
    CustomBagRequestResponse updateAdminReview(Long id, CustomBagAdminUpdateRequest request);
}
