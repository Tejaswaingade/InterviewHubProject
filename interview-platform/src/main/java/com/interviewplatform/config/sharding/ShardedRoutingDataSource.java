package com.interviewplatform.config.sharding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * Dynamic DataSource router that directs database connections to the appropriate
 * shard based on the active thread's ShardContextHolder.
 */
public class ShardedRoutingDataSource extends AbstractRoutingDataSource {

    private static final Logger log = LoggerFactory.getLogger(ShardedRoutingDataSource.class);

    @Override
    protected Object determineCurrentLookupKey() {
        ShardId shardId = ShardContextHolder.getShard();
        log.trace("[ShardedRoutingDataSource] Routing connection to shard: {}", shardId);
        return shardId;
    }
}
