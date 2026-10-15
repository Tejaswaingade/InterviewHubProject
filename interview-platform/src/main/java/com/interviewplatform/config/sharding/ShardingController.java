package com.interviewplatform.config.sharding;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for inspecting and monitoring database sharding topology and request distribution.
 */
@RestController
@RequestMapping("/api/system/sharding")
@Tag(name = "System Architecture & Sharding", description = "Endpoints for inspecting database sharding topology and load-balancing strategy")
public class ShardingController {

    private final ShardRouter shardRouter;

    public ShardingController(ShardRouter shardRouter) {
        this.shardRouter = shardRouter;
    }

    @GetMapping
    @Operation(summary = "Get database sharding topology and current thread allocation")
    public ResponseEntity<Map<String, Object>> getShardingStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("shardingEnabled", true);
        status.put("strategy", "Consistent Hash Modulo Partitioning (User-Level Sharding)");
        status.put("activeShards", List.of(ShardId.PRIMARY.name(), ShardId.SHARD_1.name(), ShardId.SHARD_2.name()));
        status.put("totalShards", 3);
        status.put("currentRequestShard", ShardContextHolder.getShard().name());
        status.put("loadBalancingTarget", "Eliminate single database bottleneck by horizontally distributing read/write traffic across clustered shards");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/resolve")
    @Operation(summary = "Simulate shard resolution for any user email")
    public ResponseEntity<Map<String, Object>> resolveShard(@RequestParam String email) {
        ShardId shard = shardRouter.getShardForUser(email);
        Map<String, Object> result = new HashMap<>();
        result.put("email", email);
        result.put("allocatedShard", shard.name());
        result.put("hashModulus", Math.abs(email.trim().toLowerCase().hashCode()) % 2);
        return ResponseEntity.ok(result);
    }
}
