package com.inventory.inventorymanagement.service;

import com.inventory.inventorymanagement.dto.LoginRequest;
import com.inventory.inventorymanagement.dto.RegisterRequest;
import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.entity.UserStatus;
import com.inventory.inventorymanagement.exception.DuplicateResourceException;
import com.inventory.inventorymanagement.exception.InvalidCredentialsException;
import com.inventory.inventorymanagement.repository.UserRepository;
import com.inventory.inventorymanagement.security.JwtTokenService;
import com.inventory.inventorymanagement.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserRepository users;
    @Mock JwtTokenService tokens;
    private BCryptPasswordEncoder encoder;
    private AuthServiceImpl service;

    @BeforeEach
    void setUp() {
        encoder = new BCryptPasswordEncoder(4);
        service = new AuthServiceImpl(users, encoder, tokens);
    }

    @Test
    void registerCreatesNormalizedCustomerWithBcryptPassword() {
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });

        var response = service.register(new RegisterRequest(" Customer ", " Customer@Example.COM ", "password123"));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(users).saveAndFlush(captor.capture());
        AppUser saved = captor.getValue();
        assertEquals(UserRole.CUSTOMER, saved.getRole());
        assertEquals(UserStatus.ACTIVE, saved.getStatus());
        assertEquals("customer@example.com", saved.getEmail());
        assertNotEquals("password123", saved.getPasswordHash());
        assertTrue(saved.getPasswordHash().startsWith("$2"));
        assertTrue(encoder.matches("password123", saved.getPasswordHash()));
        assertEquals(UserRole.CUSTOMER, response.role());
    }

    @Test
    void duplicateEmailIsRejectedCaseInsensitively() {
        when(users.existsByEmail("customer@example.com")).thenReturn(true);
        assertThrows(DuplicateResourceException.class, () -> service.register(
                new RegisterRequest("Customer", "CUSTOMER@example.com", "password123")));
    }

    @Test
    void loginWithCorrectCredentialsReturnsTokenAndSafeUser() {
        AppUser user = activeUser();
        when(users.findByEmail("customer@example.com")).thenReturn(Optional.of(user));
        when(tokens.generate(user)).thenReturn("signed.jwt.token");

        var response = service.login(new LoginRequest("CUSTOMER@example.com", "password123"));

        assertEquals("signed.jwt.token", response.token());
        assertEquals(3L, response.user().id());
        assertEquals(UserRole.CUSTOMER, response.user().role());
    }

    @Test
    void loginWithWrongPasswordIsRejected() {
        when(users.findByEmail("customer@example.com")).thenReturn(Optional.of(activeUser()));
        assertThrows(InvalidCredentialsException.class,
                () -> service.login(new LoginRequest("customer@example.com", "wrong-pass")));
        verifyNoInteractions(tokens);
    }

    @Test
    void loginWithUnknownEmailIsRejected() {
        when(users.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        assertThrows(InvalidCredentialsException.class,
                () -> service.login(new LoginRequest("missing@example.com", "password123")));
    }

    @Test
    void inactiveUserCannotLogin() {
        AppUser user = activeUser();
        user.setStatus(UserStatus.INACTIVE);
        when(users.findByEmail("customer@example.com")).thenReturn(Optional.of(user));
        assertThrows(InvalidCredentialsException.class,
                () -> service.login(new LoginRequest("customer@example.com", "password123")));
    }

    private AppUser activeUser() {
        AppUser user = new AppUser("Customer", "customer@example.com", encoder.encode("password123"),
                UserRole.CUSTOMER, UserStatus.ACTIVE);
        user.setId(3L);
        return user;
    }
}
