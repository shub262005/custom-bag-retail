package com.inventory.inventorymanagement.dto;

import com.inventory.inventorymanagement.entity.*;
import jakarta.validation.constraints.*;

public class CustomBagRequestCreateRequest {
    private CustomBagRequestType requestType = CustomBagRequestType.STANDARD;
    @NotNull private CustomBagType bagType;
    @NotNull private CustomBagSize size;
    @NotNull private CustomBagMaterial material;
    @NotNull private CustomBagColor bodyColor;
    @NotNull private CustomBagColor pocketColor;
    @NotNull private CustomBagColor strapColor;
    private boolean frontPocket;
    private boolean sidePockets;
    @Min(1) @Max(4) private int compartmentCount;
    private boolean laptopPadding;
    private boolean waterResistant;
    private BrandingPosition logoPosition;
    @Size(max = 24) private String customText;
    private BrandTextColor textColor;
    private BrandingPosition textPosition;
    @Size(max = 1000) private String customerNotes;

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
    public BrandingPosition getLogoPosition() { return logoPosition; } public void setLogoPosition(BrandingPosition v) { logoPosition = v; }
    public String getCustomText() { return customText; } public void setCustomText(String v) { customText = v; }
    public BrandTextColor getTextColor() { return textColor; } public void setTextColor(BrandTextColor v) { textColor = v; }
    public BrandingPosition getTextPosition() { return textPosition; } public void setTextPosition(BrandingPosition v) { textPosition = v; }
    public String getCustomerNotes() { return customerNotes; } public void setCustomerNotes(String v) { customerNotes = v; }
}
