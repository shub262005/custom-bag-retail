package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.CustomBagRequestCreateRequest;
import com.inventory.inventorymanagement.entity.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class CustomBagPricingServiceTest {
    private final CustomBagPricingService pricing = new CustomBagPricingService();

    @Test void mirrorsFrontendBackpackPricing() {
        CustomBagRequestCreateRequest r = request(CustomBagType.BACKPACK);
        r.setSize(CustomBagSize.MEDIUM); r.setMaterial(CustomBagMaterial.CANVAS);
        r.setCompartmentCount(3); r.setFrontPocket(true); r.setSidePockets(true);
        r.setLaptopPadding(true); r.setWaterResistant(true); r.setCustomText("ROOPAM");
        assertEquals(new BigDecimal("2600.00"), pricing.calculate(r, true));
    }

    @Test void templateBasePricesMatchFrontend() {
        assertEquals(new BigDecimal("1200.00"), pricing.calculate(request(CustomBagType.BACKPACK), false));
        assertEquals(new BigDecimal("1400.00"), pricing.calculate(request(CustomBagType.LAPTOP_BAG), false));
        assertEquals(new BigDecimal("1600.00"), pricing.calculate(request(CustomBagType.DUFFEL_BAG), false));
    }

    static CustomBagRequestCreateRequest request(CustomBagType type) {
        CustomBagRequestCreateRequest r = new CustomBagRequestCreateRequest();
        r.setBagType(type); r.setSize(CustomBagSize.SMALL); r.setMaterial(CustomBagMaterial.POLYESTER);
        r.setBodyColor(CustomBagColor.NAVY); r.setPocketColor(CustomBagColor.BLUE); r.setStrapColor(CustomBagColor.BLACK);
        r.setCompartmentCount(1); return r;
    }
}
