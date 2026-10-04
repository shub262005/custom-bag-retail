package com.inventory.inventorymanagement.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

@Configuration
@Import({JwtAuthenticationFilter.class, JwtTokenService.class, RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class})
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecretKey jwtSecretKey(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/public/storefront/**").permitAll()
                        .requestMatchers("/api/v1/auth/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/custom-bag-requests")
                            .hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/v1/custom-bag-requests/mine/**")
                            .hasRole("CUSTOMER")
                        .requestMatchers("/api/v1/custom-bag-requests/admin", "/api/v1/custom-bag-requests/admin/**")
                            .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER", "CASHIER")
                        .requestMatchers("/api/v1/products/**")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers("/api/v1/categories/**", "/api/v1/brands/**",
                                "/api/v1/inventory-transactions/**", "/api/v1/suppliers/**",
                                "/api/v1/purchases/**")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers("/api/v1/sales/dashboard")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER", "CASHIER")
                        .requestMatchers("/api/v1/sales/reports/**")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/sales/*/cancel")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER")
                        .requestMatchers("/api/v1/sales/**")
                            .hasAnyRole("ADMIN", "INVENTORY_MANAGER", "CASHIER")
                        .anyRequest().denyAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
