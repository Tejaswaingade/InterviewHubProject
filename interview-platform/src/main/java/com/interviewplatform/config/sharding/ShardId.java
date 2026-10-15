package com.interviewplatform.config.sharding;

/**
 * Identifies the logical or physical database shard.
 * Supports horizontal scale-out across multiple database instances/clusters.
 */
public enum ShardId {
    PRIMARY,
    SHARD_1,
    SHARD_2
}
