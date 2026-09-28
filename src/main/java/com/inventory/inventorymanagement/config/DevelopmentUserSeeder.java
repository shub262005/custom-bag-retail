package com.inventory.inventorymanagement.config;

import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.entity.UserStatus;
import com.inventory.inventorymanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@Profile("dev")
public class DevelopmentUserSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String inventoryEmail;
    private final String inventoryPassword;
    private final String cashierEmail;
    private final String cashierPassword;

    public DevelopmentUserSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.dev-seed.admin-email}") String adminEmail,
            @Value("${app.dev-seed.admin-password}") String adminPassword,
            @Value("${app.dev-seed.inventory-manager-email}") String inventoryEmail,
            @Value("${app.dev-seed.inventory-manager-password}") String inventoryPassword,
            @Value("${app.dev-seed.cashier-email}") String cashierEmail,
            @Value("${app.dev-seed.cashier-password}") String cashierPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.inventoryEmail = inventoryEmail;
        this.inventoryPassword = inventoryPassword;
        this.cashierEmail = cashierEmail;
        this.cashierPassword = cashierPassword;
    }

    @Override
    public void run(String... args) {
        createIfMissing("Development Admin", adminEmail, adminPassword, UserRole.ADMIN);
        createIfMissing("Development Inventory Manager", inventoryEmail, inventoryPassword,
                UserRole.INVENTORY_MANAGER);
        createIfMissing("Development Cashier", cashierEmail, cashierPassword, UserRole.CASHIER);
    }

    private void createIfMissing(String name, String email, String password, UserRole role) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (!userRepository.existsByEmail(normalizedEmail)) {
            userRepository.save(new AppUser(name, normalizedEmail, passwordEncoder.encode(password), role,
                    UserStatus.ACTIVE));
        }
    }
}
