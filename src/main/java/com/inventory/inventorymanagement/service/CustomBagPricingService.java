package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CustomBagRequestCreateRequest;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class CustomBagPricingService {
    public BigDecimal calculate(CustomBagRequestCreateRequest r, boolean hasLogo) {
        int total = switch (r.getBagType()) { case BACKPACK -> 1200; case LAPTOP_BAG -> 1400; case DUFFEL_BAG -> 1600; };
        total += switch (r.getSize()) { case SMALL -> 0; case MEDIUM -> 150; case LARGE -> 300; };
        total += switch (r.getMaterial()) { case POLYESTER -> 0; case CANVAS -> 150; case LEATHER -> 500; };
        total += (r.getCompartmentCount() - 1) * 100;
        if (r.isFrontPocket()) total += 100;
        if (r.isSidePockets()) total += 150;
        if (r.isLaptopPadding()) total += 200;
        if (r.isWaterResistant()) total += 150;
        if (hasLogo) total += 200;
        if (r.getCustomText() != null && !r.getCustomText().trim().isEmpty()) total += 100;
        return BigDecimal.valueOf(total).setScale(2);
    }
}
