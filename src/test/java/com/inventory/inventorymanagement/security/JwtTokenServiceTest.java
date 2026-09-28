package com.inventory.inventorymanagement.security;

import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserRole;
import com.inventory.inventorymanagement.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {
    private SecurityConfig config;
    private SecretKey key;
    private AppUser user;

    @BeforeEach
    void setUp() {
        config = new SecurityConfig();
        key = config.jwtSecretKey("test-only-secret-key-that-is-long-enough-for-hs256");
        user = new AppUser("Customer", "customer@example.com", "unused", UserRole.CUSTOMER,
                UserStatus.ACTIVE);
        user.setId(42L);
    }

    @Test
    void validTokenContainsMinimalIdentityClaims() {
        JwtTokenService service = serviceWithTtl(Duration.ofHours(8));
        var jwt = service.decode(service.generate(user));
        assertEquals("customer@example.com", jwt.getSubject());
        assertEquals(42L, ((Number) jwt.getClaim("uid")).longValue());
        assertEquals("CUSTOMER", jwt.getClaimAsString("role"));
        assertNotNull(jwt.getExpiresAt());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtTokenService service = serviceWithTtl(Duration.ofHours(8));
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getEmail())
                .issuedAt(now.minusSeconds(120))
                .expiresAt(now.minusSeconds(60))
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).type("JWT").build();
        String token = config.jwtEncoder(key).encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        assertThrows(JwtException.class, () -> service.decode(token));
    }

    @Test
    void invalidTokenIsRejected() {
        assertThrows(JwtException.class, () -> serviceWithTtl(Duration.ofHours(8)).decode("not-a-jwt"));
    }

    private JwtTokenService serviceWithTtl(Duration ttl) {
        return new JwtTokenService(config.jwtEncoder(key), config.jwtDecoder(key), ttl);
    }
}
