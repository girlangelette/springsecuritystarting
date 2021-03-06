package com.web.app.security;

import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Set;

/**
 * An implementation of {@link UserDetails}, containing <strong>only</strong> {@code Spring Security} info,
 * thus I follow the <strong>SINGLE-RESPONSIBILITY PRINCIPLE</strong>
 * <p>
 * {@link AllArgsConstructor} generates constructor for all class's fields.
 *
 * @see org.springframework.security.core.userdetails.UserDetails
 * @see org.springframework.security.core.userdetails.UserDetailsService#loadUserByUsername(String)
 * and also, an implementation of {@code UserDetailsService}:
 * {@link com.web.app.security.UsersDetailsService}
 */
@AllArgsConstructor
public class UsersDetails implements UserDetails {

    private boolean enabled;

    private String username;

    private String password;

    private Set<? extends GrantedAuthority> authorities;

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    /* Accounts are never expired */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /* Accounts are never locked, but may be disabled */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /* Credentials are never expired */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public Set<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
}