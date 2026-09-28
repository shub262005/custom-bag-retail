package com.inventory.inventorymanagement.security;

import com.inventory.inventorymanagement.entity.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserService {
    public static final String SYSTEM_ACTOR = "SYSTEM";

    public Optional<CurrentUser> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(new CurrentUser(principal.getId(), principal.getEmail(), principal.getRole()));
    }

    public String getActorIdentifier() {
        Optional<CurrentUser> currentUser = getCurrentUser();
        if (currentUser.isPresent()) {
            return currentUser.get().email();
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return SYSTEM_ACTOR;
        }

        String name = authentication.getName();
        return name == null || name.isBlank() || "anonymousUser".equals(name) ? SYSTEM_ACTOR : name;
    }

    public record CurrentUser(Long id, String email, UserRole role) { }
}
