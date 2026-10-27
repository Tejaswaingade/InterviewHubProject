package com.interviewplatform.config.sharding;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Spring Configuration that provides a horizontally sharded dynamic DataSource.
 * Connects to Primary, Shard 1, and Shard 2 database instances.
 */
@Configuration
public class ShardedDataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(ShardedDataSourceConfig.class);

    @Value("${spring.datasource.url}")
    private String primaryUrl;

    @Value("${spring.datasource.username}")
    private String primaryUsername;

    @Value("${spring.datasource.password}")
    private String primaryPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    // Optional Shard 1 configurations with fallback to primary
    @Value("${sharding.datasource.shard1.url:${spring.datasource.shard1.url:#{null}}}")
    private String shard1Url;

    @Value("${sharding.datasource.shard1.username:${spring.datasource.shard1.username:#{null}}}")
    private String shard1Username;

    @Value("${sharding.datasource.shard1.password:${spring.datasource.shard1.password:#{null}}}")
    private String shard1Password;

    // Optional Shard 2 configurations with fallback to primary
    @Value("${sharding.datasource.shard2.url:${spring.datasource.shard2.url:#{null}}}")
    private String shard2Url;

    @Value("${sharding.datasource.shard2.username:${spring.datasource.shard2.username:#{null}}}")
    private String shard2Username;

    @Value("${sharding.datasource.shard2.password:${spring.datasource.shard2.password:#{null}}}")
    private String shard2Password;

    private static class ConnectionParams {
        String jdbcUrl;
        String username;
        String password;

        ConnectionParams(String jdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }
    }

    private ConnectionParams sanitizeConnection(String rawUrl, String defaultUser, String defaultPass) {
        String user = defaultUser;
        String pass = defaultPass;
        String url = rawUrl != null ? rawUrl.trim() : "";

        if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
            int schemeEnd = url.indexOf("://");
            String rest = url.substring(schemeEnd + 3);
            int atIdx = rest.indexOf("@");
            if (atIdx != -1) {
                String creds = rest.substring(0, atIdx);
                String hostAndDb = rest.substring(atIdx + 1);
                int colonIdx = creds.indexOf(":");
                if (colonIdx != -1) {
                    user = creds.substring(0, colonIdx);
                    pass = creds.substring(colonIdx + 1);
                } else {
                    user = creds;
                }
                url = "jdbc:postgresql://" + hostAndDb;
            } else {
                url = "jdbc:postgresql://" + rest;
            }
        } else if (url.startsWith("jdbc:postgresql://")) {
            String rest = url.substring("jdbc:postgresql://".length());
            int atIdx = rest.indexOf("@");
            if (atIdx != -1) {
                String creds = rest.substring(0, atIdx);
                String hostAndDb = rest.substring(atIdx + 1);
                int colonIdx = creds.indexOf(":");
                if (colonIdx != -1) {
                    user = creds.substring(0, colonIdx);
                    pass = creds.substring(colonIdx + 1);
                } else {
                    user = creds;
                }
                url = "jdbc:postgresql://" + hostAndDb;
            }
        }

        if (url != null) {
            // Clean up any libpq parameters that standard JDBC drivers do not consume
            url = url.replace("&channel_binding=require", "")
                     .replace("?channel_binding=require&", "?")
                     .replace("?channel_binding=require", "");
        }

        return new ConnectionParams(url, user, pass);
    }

    private HikariDataSource createDataSource(String poolName, String url, String username, String password) {
        ConnectionParams params = sanitizeConnection(url, username, password);
        HikariDataSource ds = new HikariDataSource();
        ds.setPoolName(poolName);
        ds.setJdbcUrl(params.jdbcUrl);
        ds.setUsername(params.username);
        ds.setPassword(params.password);
        ds.setDriverClassName(driverClassName);
        ds.setMaximumPoolSize(10);
        ds.setMinimumIdle(2);
        ds.setIdleTimeout(30000);
        ds.setConnectionTimeout(20000);
        log.info("[ShardedDataSourceConfig] Configured connection pool [{}] -> {} (user: {})", poolName, params.jdbcUrl, params.username);
        return ds;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        log.info("[ShardedDataSourceConfig] Initializing Horizontal Sharded Routing DataSource...");

        // 1. Primary DataSource
        HikariDataSource primaryDs = createDataSource("HikariPool-Primary", primaryUrl, primaryUsername, primaryPassword);

        // 2. Shard 1 DataSource (fallback to primary database if not explicitly set)
        String s1Url = (shard1Url != null && !shard1Url.isBlank()) ? shard1Url : primaryUrl;
        String s1User = (shard1Username != null && !shard1Username.isBlank()) ? shard1Username : primaryUsername;
        String s1Pass = (shard1Password != null && !shard1Password.isBlank()) ? shard1Password : primaryPassword;
        HikariDataSource shard1Ds = s1Url.equals(primaryUrl) ? primaryDs : createDataSource("HikariPool-Shard-1", s1Url, s1User, s1Pass);

        // 3. Shard 2 DataSource (fallback to primary database if not explicitly set)
        String s2Url = (shard2Url != null && !shard2Url.isBlank()) ? shard2Url : primaryUrl;
        String s2User = (shard2Username != null && !shard2Username.isBlank()) ? shard2Username : primaryUsername;
        String s2Pass = (shard2Password != null && !shard2Password.isBlank()) ? shard2Password : primaryPassword;
        HikariDataSource shard2Ds = s2Url.equals(primaryUrl) ? primaryDs : createDataSource("HikariPool-Shard-2", s2Url, s2User, s2Pass);

        // 4. Map Shards to Routing DataSource
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(ShardId.PRIMARY, primaryDs);
        targetDataSources.put(ShardId.SHARD_1, shard1Ds);
        targetDataSources.put(ShardId.SHARD_2, shard2Ds);

        ShardedRoutingDataSource routingDataSource = new ShardedRoutingDataSource();
        routingDataSource.setDefaultTargetDataSource(primaryDs);
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.afterPropertiesSet();

        log.info("[ShardedDataSourceConfig] Sharded Routing DataSource successfully configured with shards: [PRIMARY, SHARD_1, SHARD_2]");
        return routingDataSource;
    }
}
