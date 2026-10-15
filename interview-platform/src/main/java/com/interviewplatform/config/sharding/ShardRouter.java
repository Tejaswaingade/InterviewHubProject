package com.interviewplatform.config.sharding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

/**
 * Enterprise Sharding Router service.
 * Applies consistent hash modulo partitioning to distribute incoming user traffic
 * and transactions evenly across available database shards.
 */
@Service
public class ShardRouter {

    private static final Logger log = LoggerFactory.getLogger(ShardRouter.class);

    /**
     * Resolves the target shard for a given user email or identifier.
     * Uses Math.abs(hashCode) % 2 to distribute across SHARD_1 and SHARD_2.
     */
    public ShardId getShardForUser(String userIdentifier) {
        if (userIdentifier == null || userIdentifier.trim().isBlank()) {
            return ShardId.PRIMARY;
        }

        int hash = Math.abs(userIdentifier.trim().toLowerCase().hashCode());
        ShardId targetShard = (hash % 2 == 0) ? ShardId.SHARD_1 : ShardId.SHARD_2;
        log.debug("[ShardRouter] User [{}] hashed to partition {} -> assigned to {}", userIdentifier, hash % 2, targetShard);
        return targetShard;
    }

    /**
     * Resolves the target shard for a numerical user ID.
     */
    public ShardId getShardForUserId(Long userId) {
        if (userId == null) {
            return ShardId.PRIMARY;
        }
        return (userId % 2 == 0) ? ShardId.SHARD_1 : ShardId.SHARD_2;
    }

    /**
     * Executes a task explicitly within the context of a specified shard.
     */
    public <T> T executeOnShard(ShardId targetShard, Supplier<T> task) {
        ShardId previousShard = ShardContextHolder.getShard();
        try {
            ShardContextHolder.setShard(targetShard);
            return task.get();
        } finally {
            ShardContextHolder.setShard(previousShard);
        }
    }
}
