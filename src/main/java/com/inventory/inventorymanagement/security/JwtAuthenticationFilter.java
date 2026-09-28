package com.inventory.inventorymanagement.security;

import com.inventory.inventorymanagement.entity.AppUser;
import com.inventory.inventorymanagement.entity.UserStatus;
import com.inventory.inventorymanagement.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Objects;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenService tokenService;
    private final ObjectProvider<UserRepository> userRepositoryProvider;
    private final AuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtTokenService tokenService, ObjectProvider<UserRepository> userRepositoryProvider,
                                   RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.tokenService = tokenService;
        this.userRepositoryProvider = userRepositoryProvider;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/v1/auth/register") || path.equals("/api/v1/auth/login");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authorization.substring(7);
            if (token.isBlank()) {
                throw new JwtException("Missing bearer token");
            }
            Jwt jwt = tokenService.decode(token);
            Number userIdClaim = jwt.getClaim("uid");
            String roleClaim = jwt.getClaimAsString("role");
            if (userIdClaim == null || roleClaim == null) {
                throw new JwtException("Required claims are missing");
            }

            UserRepository userRepository = userRepositoryProvider.getIfAvailable();
            if (userRepository == null) {
                throw new JwtException("User repository is unavailable");
            }
            AppUser user = userRepository.findById(userIdClaim.longValue())
                    .filter(found -> found.getStatus() == UserStatus.ACTIVE)
                    .filter(found -> Objects.equals(found.getEmail(), jwt.getSubject()))
                    .filter(found -> Objects.equals(found.getRole().name(), roleClaim))
                    .orElseThrow(() -> new JwtException("User is unavailable"));

            UserPrincipal principal = UserPrincipal.from(user);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            authenticationEntryPoint.commence(request, response,
                    new org.springframework.security.authentication.BadCredentialsException("Invalid access token"));
        }
    }
}
