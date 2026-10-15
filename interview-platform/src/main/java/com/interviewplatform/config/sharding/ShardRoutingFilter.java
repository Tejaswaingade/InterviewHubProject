package com.interviewplatform.config.sharding;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Intercepts incoming HTTP requests and assigns the optimal database shard
 * based on authenticated user identity or request hints.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10)
public class ShardRoutingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ShardRoutingFilter.class);
    private final ShardRouter shardRouter;

    public ShardRoutingFilter(ShardRouter shardRouter) {
        this.shardRouter = shardRouter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userIdentifier = null;

            if (auth != null && auth.isAuthenticated() && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
                userIdentifier = auth.getName();
            } else {
                // Check optional shard hint header for routing
                String hint = request.getHeader("X-Shard-Hint");
                if (hint != null && !hint.isBlank()) {
                    userIdentifier = hint;
                }
            }

            if (userIdentifier != null) {
                ShardId assignedShard = shardRouter.getShardForUser(userIdentifier);
                ShardContextHolder.setShard(assignedShard);
                log.debug("[ShardRoutingFilter] Routed URI [{}] for user [{}] to {}", request.getRequestURI(), userIdentifier, assignedShard);
            } else {
                ShardContextHolder.setShard(ShardId.PRIMARY);
            }

            filterChain.doFilter(request, response);
        } finally {
            ShardContextHolder.clear();
        }
    }
}
