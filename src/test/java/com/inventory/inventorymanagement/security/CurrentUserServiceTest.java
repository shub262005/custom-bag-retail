package com.inventory.inventorymanagement.security;

import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.entity.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CurrentUserServiceTest {
    private final CurrentUserService currentUserService = new CurrentUserService();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatedApplicationUserUsesNormalizedEmailAsAuditIdentity() {
        AppUser user = new AppUser("Admin", "ADMIN@Example.COM", "hash", UserRole.ADMIN, UserStatus.ACTIVE);
        user.setId(42L);
        UserPrincipal principal = UserPrincipal.from(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        assertEquals("admin@example.com", currentUserService.getActorIdentifier());
        CurrentUserService.CurrentUser current = currentUserService.getCurrentUser().orElseThrow();
        assertEquals(42L, current.id());
        assertEquals(UserRole.ADMIN, current.role());
    }

    @Test
    void missingAuthenticationFallsBackToSystemActor() {
        assertEquals(CurrentUserService.SYSTEM_ACTOR, currentUserService.getActorIdentifier());
    }
}
