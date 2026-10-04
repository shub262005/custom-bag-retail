package com.inventory.inventorymanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.util.Set;
import java.util.UUID;

@Service
public class CustomBagLogoStorageService {
    public static final long MAX_SIZE = 2L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("image/png", "image/jpeg");
    private final Path directory;

    public CustomBagLogoStorageService(@Value("${app.upload.custom-bag-logo-dir:uploads/custom-bag-logos}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("Logo images must be 2 MB or smaller");
        if (!TYPES.contains(file.getContentType())) throw new IllegalArgumentException("Logo must be a PNG, JPG, or JPEG image");
        String extension = validateSignatureAndExtension(file);
        String filename = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(directory);
            Path target = directory.resolve(filename).normalize();
            if (!target.getParent().equals(directory)) throw new IllegalArgumentException("Invalid logo path");
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return "custom-bag-logos/" + filename;
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store the logo image", ex);
        }
    }

    public void delete(String reference) {
        if (reference == null) return;
        String filename = Path.of(reference).getFileName().toString();
        try { Files.deleteIfExists(directory.resolve(filename).normalize()); } catch (IOException ignored) { }
    }

    public StoredLogo load(String reference) {
        if (reference == null || !reference.matches("custom-bag-logos/[0-9a-fA-F-]{36}\\.(png|jpg)"))
            throw new IllegalArgumentException("Invalid logo reference");
        String filename = Path.of(reference).getFileName().toString();
        Path file = directory.resolve(filename).normalize();
        if (!file.getParent().equals(directory) || !Files.isRegularFile(file))
            throw new IllegalArgumentException("Logo image was not found");
        String contentType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        try { return new StoredLogo(new UrlResource(file.toUri()), contentType); }
        catch (IOException ex) { throw new IllegalStateException("Could not load the logo image", ex); }
    }

    public record StoredLogo(Resource resource, String contentType) { }

    private String validateSignatureAndExtension(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            boolean png = header.length >= 8 && (header[0] & 0xff) == 0x89 && header[1] == 0x50
                    && header[2] == 0x4e && header[3] == 0x47 && header[4] == 0x0d && header[5] == 0x0a
                    && header[6] == 0x1a && header[7] == 0x0a;
            boolean jpeg = header.length >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8
                    && (header[2] & 0xff) == 0xff;
            if ("image/png".equals(file.getContentType()) && png) return ".png";
            if ("image/jpeg".equals(file.getContentType()) && jpeg) return ".jpg";
            throw new IllegalArgumentException("Logo file content does not match PNG or JPEG format");
        } catch (IOException ex) {
            throw new IllegalArgumentException("Logo image could not be read", ex);
        }
    }
}
