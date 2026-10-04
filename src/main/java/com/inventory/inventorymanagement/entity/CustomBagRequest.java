package com.inventory.inventorymanagement.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_bag_requests")
public class CustomBagRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "custom_bag_request_id") private Long id;
    @Column(name = "request_number", nullable = false, unique = true, length = 30) private String requestNumber;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_user_id", nullable = false) private AppUser customer;
    @Enumerated(EnumType.STRING) @Column(name = "request_type", nullable = false, length = 30) private CustomBagRequestType requestType;
    @Enumerated(EnumType.STRING) @Column(name = "bag_type", nullable = false, length = 30) private CustomBagType bagType;
    @Enumerated(EnumType.STRING) @Column(name = "size", nullable = false, length = 20) private CustomBagSize size;
    @Enumerated(EnumType.STRING) @Column(name = "material", nullable = false, length = 30) private CustomBagMaterial material;
    @Enumerated(EnumType.STRING) @Column(name = "body_color", nullable = false, length = 20) private CustomBagColor bodyColor;
    @Enumerated(EnumType.STRING) @Column(name = "pocket_color", nullable = false, length = 20) private CustomBagColor pocketColor;
    @Enumerated(EnumType.STRING) @Column(name = "strap_color", nullable = false, length = 20) private CustomBagColor strapColor;
    @Column(name = "front_pocket", nullable = false) private boolean frontPocket;
    @Column(name = "side_pockets", nullable = false) private boolean sidePockets;
    @Column(name = "compartment_count", nullable = false) private int compartmentCount;
    @Column(name = "laptop_padding", nullable = false) private boolean laptopPadding;
    @Column(name = "water_resistant", nullable = false) private boolean waterResistant;
    @Column(name = "logo_reference", length = 500) private String logoReference;
    @Enumerated(EnumType.STRING) @Column(name = "logo_position", length = 30) private BrandingPosition logoPosition;
    @Column(name = "custom_text", length = 24) private String customText;
    @Enumerated(EnumType.STRING) @Column(name = "text_color", length = 20) private BrandTextColor textColor;
    @Enumerated(EnumType.STRING) @Column(name = "text_position", length = 30) private BrandingPosition textPosition;
    @Column(name = "customer_notes", length = 1000) private String customerNotes;
    @Column(name = "estimated_price", nullable = false, precision = 12, scale = 2) private BigDecimal estimatedPrice;
    @Enumerated(EnumType.STRING) @Column(name = "status", nullable = false, length = 30) private CustomBagRequestStatus status;
    @Column(name = "admin_note", length = 1000) private String adminNote;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    public CustomBagRequest() { }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getRequestNumber() { return requestNumber; } public void setRequestNumber(String v) { requestNumber = v; }
    public AppUser getCustomer() { return customer; } public void setCustomer(AppUser v) { customer = v; }
    public CustomBagRequestType getRequestType() { return requestType; } public void setRequestType(CustomBagRequestType v) { requestType = v; }
    public CustomBagType getBagType() { return bagType; } public void setBagType(CustomBagType v) { bagType = v; }
    public CustomBagSize getSize() { return size; } public void setSize(CustomBagSize v) { size = v; }
    public CustomBagMaterial getMaterial() { return material; } public void setMaterial(CustomBagMaterial v) { material = v; }
    public CustomBagColor getBodyColor() { return bodyColor; } public void setBodyColor(CustomBagColor v) { bodyColor = v; }
    public CustomBagColor getPocketColor() { return pocketColor; } public void setPocketColor(CustomBagColor v) { pocketColor = v; }
    public CustomBagColor getStrapColor() { return strapColor; } public void setStrapColor(CustomBagColor v) { strapColor = v; }
    public boolean isFrontPocket() { return frontPocket; } public void setFrontPocket(boolean v) { frontPocket = v; }
    public boolean isSidePockets() { return sidePockets; } public void setSidePockets(boolean v) { sidePockets = v; }
    public int getCompartmentCount() { return compartmentCount; } public void setCompartmentCount(int v) { compartmentCount = v; }
    public boolean isLaptopPadding() { return laptopPadding; } public void setLaptopPadding(boolean v) { laptopPadding = v; }
    public boolean isWaterResistant() { return waterResistant; } public void setWaterResistant(boolean v) { waterResistant = v; }
    public String getLogoReference() { return logoReference; } public void setLogoReference(String v) { logoReference = v; }
    public BrandingPosition getLogoPosition() { return logoPosition; } public void setLogoPosition(BrandingPosition v) { logoPosition = v; }
    public String getCustomText() { return customText; } public void setCustomText(String v) { customText = v; }
    public BrandTextColor getTextColor() { return textColor; } public void setTextColor(BrandTextColor v) { textColor = v; }
    public BrandingPosition getTextPosition() { return textPosition; } public void setTextPosition(BrandingPosition v) { textPosition = v; }
    public String getCustomerNotes() { return customerNotes; } public void setCustomerNotes(String v) { customerNotes = v; }
    public BigDecimal getEstimatedPrice() { return estimatedPrice; } public void setEstimatedPrice(BigDecimal v) { estimatedPrice = v; }
    public CustomBagRequestStatus getStatus() { return status; } public void setStatus(CustomBagRequestStatus v) { status = v; }
    public String getAdminNote() { return adminNote; } public void setAdminNote(String v) { adminNote = v; }
    public LocalDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(LocalDateTime v) { createdAt = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; } public void setUpdatedAt(LocalDateTime v) { updatedAt = v; }
}
