package com.interviewplatform.config.sharding;

/**
 * ThreadLocal context holder for dynamic database shard routing.
 * Ensures each incoming user request or background task is routed to its allocated database shard.
 */
public final class ShardContextHolder {

    private static final ThreadLocal<ShardId> CURRENT_SHARD = new ThreadLocal<>();

    private ShardContextHolder() {}

    public static void setShard(ShardId shardId) {
        if (shardId == null) {
            CURRENT_SHARD.set(ShardId.PRIMARY);
        } else {
            CURRENT_SHARD.set(shardId);
        }
    }

    public static ShardId getShard() {
        ShardId shard = CURRENT_SHARD.get();
        return shard != null ? shard : ShardId.PRIMARY;
    }

    public static void clear() {
        CURRENT_SHARD.remove();
    }
}
