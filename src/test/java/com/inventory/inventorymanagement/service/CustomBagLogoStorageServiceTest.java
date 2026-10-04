package com.inventory.inventorymanagement.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;

class CustomBagLogoStorageServiceTest {
    @TempDir Path temp;

    @Test void storesPngUnderGeneratedSafeName() throws Exception {
        CustomBagLogoStorageService service = new CustomBagLogoStorageService(temp.toString());
        byte[] png = {(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1};
        String ref = service.store(new MockMultipartFile("logo", "../../unsafe.png", "image/png", png));
        assertTrue(ref.matches("custom-bag-logos/[0-9a-f-]+\\.png"));
        assertTrue(Files.exists(temp.resolve(Path.of(ref).getFileName())));
    }

    @Test void rejectsSpoofedAndOversizedFiles() {
        CustomBagLogoStorageService service = new CustomBagLogoStorageService(temp.toString());
        assertThrows(IllegalArgumentException.class, () -> service.store(
                new MockMultipartFile("logo", "fake.png", "image/png", "not png".getBytes())));
        assertThrows(IllegalArgumentException.class, () -> service.store(
                new MockMultipartFile("logo", "large.jpg", "image/jpeg", new byte[(int)CustomBagLogoStorageService.MAX_SIZE + 1])));
        assertThrows(IllegalArgumentException.class, () -> service.store(
                new MockMultipartFile("logo", "x.gif", "image/gif", new byte[]{1,2,3})));
    }

    @Test void loadsOnlyGeneratedDirectoryReferencesWithCorrectContentType() throws Exception {
        CustomBagLogoStorageService service = new CustomBagLogoStorageService(temp.toString());
        byte[] png = {(byte)0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1};
        String reference = service.store(new MockMultipartFile("logo", "logo.png", "image/png", png));
        var loaded = service.load(reference);
        assertEquals("image/png", loaded.contentType());
        try (var input = loaded.resource().getInputStream()) {
            assertArrayEquals(png, input.readAllBytes());
        }
        assertThrows(IllegalArgumentException.class, () -> service.load("../outside.png"));
        assertThrows(IllegalArgumentException.class, () -> service.load("custom-bag-logos/../../outside.png"));
    }
}
