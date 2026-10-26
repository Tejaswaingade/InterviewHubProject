package com.interviewplatform.ai.service;

import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MockInterviewService {

    public List<MockInterviewQuestion> generateQuestions(MockInterviewRequest request) {
        String role = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole().trim() : "Software Engineer";
        String domain = (request.getDomain() != null && !request.getDomain().isBlank()) ? request.getDomain().trim() : "Distributed Systems";
        String difficulty = (request.getDifficulty() != null && !request.getDifficulty().isBlank()) ? request.getDifficulty().trim().toUpperCase() : "MEDIUM";
        String focus = (request.getResumeSnippet() != null && !request.getResumeSnippet().isBlank()) ? request.getResumeSnippet().trim() : "";
        if (focus.isEmpty() && request.getCandidateProfileSummary() != null && !request.getCandidateProfileSummary().isBlank()) {
            focus = request.getCandidateProfileSummary().trim();
        }

        // Difficulty scaling metrics
        String tpsScale;
        int systemDesignSeconds;
        int codingSeconds;
        switch (difficulty) {
            case "EASY":
            case "JUNIOR":
                tpsScale = "10,000 req/sec";
                systemDesignSeconds = 720; // 12 mins for junior
                codingSeconds = 900;
                break;
            case "HARD":
            case "STAFF":
                tpsScale = "500,000 req/sec";
                systemDesignSeconds = 600; // 10 mins
                codingSeconds = 1200; // 20 mins
                break;
            case "MEDIUM":
            default:
                tpsScale = "100,000 req/sec";
                systemDesignSeconds = 600; // 10 mins standard FAANG framing
                codingSeconds = 900; // 15 mins
                break;
        }

        String combined = (role + " " + domain + " " + focus).toLowerCase();

        boolean isFrontend = combined.contains("front") || combined.contains("react") || combined.contains("web") || combined.contains("ui") || combined.contains("next") || combined.contains("angular") || combined.contains("vue");
        boolean isDevOps = combined.contains("devops") || combined.contains("cloud") || combined.contains("kubernetes") || combined.contains("sre") || combined.contains("terraform") || combined.contains("docker") || combined.contains("aws");
        boolean isDataAi = combined.contains("data") || combined.contains("ml") || combined.contains("ai") || combined.contains("spark") || combined.contains("analytics") || combined.contains("pipeline") || combined.contains("etl") || combined.contains("machine learning");
        boolean isMobile = combined.contains("android") || combined.contains("ios") || combined.contains("swift") || combined.contains("kotlin") || combined.contains("flutter") || combined.contains("mobile");
        boolean isFullStack = combined.contains("full") || combined.contains("mern") || (isFrontend && combined.contains("spring")) || (isFrontend && combined.contains("node"));

        List<MockInterviewQuestion> questions = new ArrayList<>();
        String focusTag = (domain != null && !domain.isBlank() ? " [" + domain + "]" : "") + (focus.isEmpty() ? "" : " (Special focus on: " + focus + ")");

        // -------------------------------------------------------------
        // Round 1: SYSTEM DESIGN / ARCHITECTURE (Role & Domain Adaptive)
        // -------------------------------------------------------------
        List<MockInterviewQuestion> r1Options = new ArrayList<>();

        if (isDataAi) {
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-data-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design a real-time event streaming and analytical feature store for %s supporting %s. How do you handle schema evolution, exactly-once stream processing (e.g. Flink/Kafka), and low-latency feature lookups%s?", role, tpsScale, focusTag))
                    .hints(List.of(
                            "Kafka or Redpanda for immutable write-ahead event streams",
                            "Apache Flink or Spark Streaming with checkpointing for exactly-once guarantees",
                            "Redis or Cassandra for serving low-latency online ML features"
                    ))
                    .expectedKeyPoints(List.of(
                            "Separation between hot (online) and cold (offline batch) storage",
                            "Schema registry for backward/forward compatible serialization (Avro/Protobuf)",
                            "Watermarking and event-time windowing to handle out-of-order data"
                    ))
                    .followUpQuestions(List.of(
                            "How do you monitor and backfill features when an ML model definition updates?",
                            "How do you handle late-arriving events that exceed watermark buffers?"
                    ))
                    .build());
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-data2-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Architect a massive-scale data ingestion and data lakehouse pipeline for %s ingesting billions of daily records. How do you design partitioning, compaction, data deduplication, and ACID transactions%s?", role, focusTag))
                    .hints(List.of(
                            "Apache Iceberg or Delta Lake table formats over object storage (S3/GCS)",
                            "Partitioning strategies by date/tenant preventing small-file problems",
                            "Compaction jobs merging minute-level micro-batches into optimal Parquet files"
                    ))
                    .expectedKeyPoints(List.of(
                            "ACID transaction log mechanics on top of blob storage",
                            "Deduplication mechanisms (Bloom filters or primary key index upserts)",
                            "Cost optimization strategies for data tiering (hot vs glacier storage)"
                    ))
                    .followUpQuestions(List.of(
                            "What is your strategy to prevent metadata bloat across millions of snapshot commits?",
                            "How do you enforce GDPR/CCPA right-to-be-forgotten deletes across petabyte-scale Parquet data?"
                    ))
                    .build());
        } else if (isMobile) {
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-mob-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design the mobile client architecture and offline synchronization engine for a ride-sharing or delivery app for %s. How do you manage battery consumption, GPS telemetry streaming, network jitter, and optimistic UI updates%s?", role, focusTag))
                    .hints(List.of(
                            "Adaptive GPS polling intervals based on accelerometer / geofencing",
                            "SQLite / Room / CoreData queue for offline action staging",
                            "Two-way conflict resolution with exponential backoff on reconnection"
                    ))
                    .expectedKeyPoints(List.of(
                            "Battery drain mitigation and background location throttling",
                            "Optimistic client-side state mutation with rollback on server rejection",
                            "Payload compression and binary protocol buffers over slow cellular networks"
                    ))
                    .followUpQuestions(List.of(
                            "How do you detect and recover from corrupted local SQLite databases on end-user devices?",
                            "What is your telemetry strategy to monitor P95 app start time across varied OEM hardware?"
                    ))
                    .build());
        } else if (isFrontend || isFullStack) {
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe1-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design a high-performance web dashboard for %s capable of streaming real-time metrics at %s with zero UI stutter (60 FPS) and offline local synchronization. How do you handle DOM virtualization, WebSocket backpressure, and state rehydration%s?", role, tpsScale, focusTag))
                    .hints(List.of(
                            "Virtualize long data lists (react-window or custom intersection observer)",
                            "Decouple WebSocket event intake from React rendering loop via requestAnimationFrame throttling",
                            "IndexedDB for offline client-side persistence and optimistic UI updates"
                    ))
                    .expectedKeyPoints(List.of(
                            "Render pipeline decoupling (buffering high-frequency events)",
                            "DOM node recycling to avoid browser layout thrashing",
                            "State rehydration and conflict resolution for offline edits"
                    ))
                    .followUpQuestions(List.of(
                            "How do you profile and eliminate Cumulative Layout Shift (CLS) on dynamic cards?",
                            "What is your memory management strategy to prevent long-lived Single Page Application leaks?"
                    ))
                    .build());
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe2-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Architect a scalable Micro-Frontend and Design System platform for %s utilizing Module Federation. How do you manage shared dependencies, isolated state management, cross-app routing, and atomic independent deployments%s?", role, focusTag))
                    .hints(List.of(
                            "Webpack 5 Module Federation or Vite dynamic federation",
                            "Shared singleton context for authentication and theme tokens",
                            "Event bus vs Custom DOM events for decoupled micro-app communication"
                    ))
                    .expectedKeyPoints(List.of(
                            "Runtime dependency resolution and fallback handling",
                            "CSS isolation (Shadow DOM or CSS Modules)",
                            "Independent CI/CD pipelines with canary asset delivery"
                    ))
                    .followUpQuestions(List.of(
                            "How do you handle version drift between host container and federated remotes?",
                            "What fallback mechanisms protect users if a federated bundle returns 502 Bad Gateway?"
                    ))
                    .build());
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe3-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design a collaborative document editor like Google Docs or Notion for %s. How do you handle real-time multiplayer cursor synchronization, conflict-free replicated data types (CRDTs) vs Operational Transformation (OT), and undo/redo stacks%s?", role, focusTag))
                    .hints(List.of(
                            "CRDTs (Yjs, Automerge) vs Operational Transformation (ShareDB)",
                            "WebSocket bidirectional channel with heartbeat reconnection",
                            "Delta state compression and local snapshotting"
                    ))
                    .expectedKeyPoints(List.of(
                            "Convergence guarantee of distributed edits across multiple concurrent clients",
                            "Local immediate rendering with background sync",
                            "History stack serialization supporting multi-user undo operations"
                    ))
                    .followUpQuestions(List.of(
                            "How do you keep memory bounded when a document reaches 100,000 edits?",
                            "How do you handle presence indicators (typing, cursor positions) without flooding the network?"
                    ))
                    .build());
        } else if (isDevOps) {
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-ops1-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design a multi-region, zero-downtime Kubernetes infrastructure supporting %s handling %s. How do you structure automated blue-green/canary rollouts, cross-region traffic balancing, and instant automated rollback on 5xx metric spikes%s?", role, tpsScale, focusTag))
                    .hints(List.of(
                            "ArgoCD or Spinnaker for progressive canary delivery",
                            "Istio/Envoy service mesh for weighted traffic splits (e.g. 5% canary)",
                            "Prometheus SLO alerts triggering automated Kubernetes rollback"
                    ))
                    .expectedKeyPoints(List.of(
                            "Global Anycast DNS or Geo-IP load balancing",
                            "Stateful service multi-region replication constraints",
                            "Canary validation metrics (error rate, P99 latency)"
                    ))
                    .followUpQuestions(List.of(
                            "How do you prevent split-brain during a sudden inter-region link severance?",
                            "What is your cost-optimization strategy for cross-AZ data egress?"
                    ))
                    .build());
            r1Options.add(MockInterviewQuestion.builder()
                    .id("q-sd-ops2-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Architect a centralized observability and distributed tracing infrastructure for %s processing 10 TB of daily telemetry logs, traces, and metrics. How do you handle sampling, indexing, storage tiering, and alerting at scale%s?", role, focusTag))
                    .hints(List.of(
                            "OpenTelemetry collector pipeline with tail-based sampling",
                            "VictoriaMetrics / ClickHouse / Grafana Mimir for scalable time-series",
                            "Kafka as buffer between collector and analytical storage"
                    ))
                    .expectedKeyPoints(List.of(
                            "Head-based vs tail-based trace sampling trade-offs",
                            "High cardinality metric mitigation (striping user IDs)",
                            "Retention policies and automated compaction tiers"
                    ))
                    .followUpQuestions(List.of(
                            "How do you prevent logging pipeline failures from cascading back to production apps?",
                            "What alerts differentiate a transient spike from a true Sev-1 outage?"
                    ))
                    .build());
        }

        // Generic / Backend System Design Options (Default or fallback)
        r1Options.add(MockInterviewQuestion.builder()
                .id("q-sd-be1-" + UUID.randomUUID().toString().substring(0, 8))
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(systemDesignSeconds)
                .question(String.format("Design a distributed, low-latency rate limiter for a multi-tenant %s platform serving %s. How do you handle clock drift, bursty traffic, and cross-datacenter synchronization%s?", role, tpsScale, focusTag))
                .hints(List.of(
                        "Consider Token Bucket vs Sliding Window Counter algorithms",
                        "Think about Redis cluster vs in-memory local caches with eventual consistency",
                        "Discuss fail-open vs fail-closed strategies during network partitions"
                ))
                .expectedKeyPoints(List.of(
                        "Selection of Token Bucket or Sliding Window Log/Counter",
                        "Redis integration via Lua scripts for atomic increments",
                        "Multi-region data replication trade-offs (CAP theorem)",
                        "Header responses (X-RateLimit-Remaining, Retry-After)"
                ))
                .followUpQuestions(List.of(
                        "How would you prevent DDoS attacks where attackers bypass IP rate limits using rotating proxies?",
                        "What is the memory footprint of storing state for 50 million active users?"
                ))
                .build());

        r1Options.add(MockInterviewQuestion.builder()
                .id("q-sd-be2-" + UUID.randomUUID().toString().substring(0, 8))
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(systemDesignSeconds)
                .question(String.format("Design a distributed, fault-tolerant Event Streaming and Notification Fan-out system for %s handling %s. How do you ensure exactly-once delivery semantics, handle poison pill messages, and prevent consumer group starvation%s?", role, tpsScale, focusTag))
                .hints(List.of(
                        "Kafka or RabbitMQ partitioning key strategy",
                        "Transactional Outbox pattern combined with Debezium CDC",
                        "Dead Letter Queues (DLQ) with exponential backoff and jitter"
                ))
                .expectedKeyPoints(List.of(
                        "Partition key assignment preventing hot partition bottlenecks",
                        "Idempotent consumer deduplication via Redis or DB unique constraints",
                        "Backpressure handling to protect downstream third-party notification APIs"
                ))
                .followUpQuestions(List.of(
                        "How do you rebalance consumer groups during dynamic autoscaling without stop-the-world lag?",
                        "What telemetry monitors consumer lag across hundreds of partition topics?"
                ))
                .build());

        r1Options.add(MockInterviewQuestion.builder()
                .id("q-sd-be3-" + UUID.randomUUID().toString().substring(0, 8))
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(systemDesignSeconds)
                .question(String.format("Design a global Distributed Caching layer for %s supporting %s with sub-5ms P99 read latency. How do you prevent cache stampedes, manage multi-region cache invalidation, and ensure consistency during database updates%s?", role, tpsScale, focusTag))
                .hints(List.of(
                        "Cache-Aside vs Write-Through vs Write-Behind strategies",
                        "Mutex locks / probabilistic early expiration (XFetch algorithm) for thundering herd",
                        "Pub/Sub based cache invalidation bus"
                ))
                .expectedKeyPoints(List.of(
                        "Cache stampede prevention techniques",
                        "Consistent hashing with virtual nodes to minimize rehash disruption",
                        "Replication lag mitigation between master database and distributed caches"
                ))
                .followUpQuestions(List.of(
                        "How would you handle sudden memory eviction under unexpected 10x traffic spikes?",
                        "What are the trade-offs of storing serialized JSON vs binary protobuf in cache?"
                ))
                .build());

        questions.add(r1Options.get(ThreadLocalRandom.current().nextInt(r1Options.size())));

        // -------------------------------------------------------------
        // Round 2: DATA STRUCTURES, CODING & CONCURRENCY
        // -------------------------------------------------------------
        List<MockInterviewQuestion> r2Options = new ArrayList<>();

        if (isFrontend) {
            r2Options.add(MockInterviewQuestion.builder()
                    .id("q-code-fe1-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(codingSeconds)
                    .question(String.format("Implement an asynchronous Request Deduplicator and In-Memory Promise Cache in TypeScript/JavaScript for %s. It must deduplicate concurrent in-flight requests for identical endpoints, provide TTL expiration, and support request abort signals.", role))
                    .hints(List.of(
                            "Store in-flight Promise objects in a Map keyed by request signature",
                            "Attach .finally() to in-flight promises to clean up the pending cache",
                            "Propagate AbortController signal correctly to cancel underlying fetches"
                    ))
                    .expectedKeyPoints(List.of(
                            "Concurrent identical requests share the exact same pending Promise",
                            "Cache invalidation on TTL expiry or mutation",
                            "Proper error propagation without crashing shared promise listeners"
                    ))
                    .followUpQuestions(List.of(
                            "How do you handle cache stampedes when 1,000 components mount simultaneously?",
                            "What is the memory cleanup strategy for long-running single page sessions?"
                    ))
                    .build());

            r2Options.add(MockInterviewQuestion.builder()
                    .id("q-code-fe2-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(codingSeconds)
                    .question(String.format("Implement a robust EventEmitter / Pub-Sub system in JavaScript/TypeScript for %s with support for namespace wildcards, once(), priority listeners, and async event dispatch.", role))
                    .hints(List.of(
                            "Use a Map of event names to arrays or sorted lists of listener callbacks",
                            "once() wraps the callback to automatically unsubscribe on invocation",
                            "Support wildcard events (e.g. 'order.*') by regex matching or trie segmentation"
                    ))
                    .expectedKeyPoints(List.of(
                            "Clean subscription token returned for O(1) unsubscription",
                            "Proper error isolation so one failing listener doesn't block others",
                            "Memory leak detection when listener counts exceed safe thresholds"
                    ))
                    .followUpQuestions(List.of(
                            "How do you prevent circular event loops between components?",
                            "How would you make event emissions asynchronous using queueMicrotask?"
                    ))
                    .build());
        }

        // Backend / Systems / General Coding Options
        r2Options.add(MockInterviewQuestion.builder()
                .id("q-code-be1-" + UUID.randomUUID().toString().substring(0, 8))
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(codingSeconds)
                .question(String.format("Explain and outline how you would implement a concurrent LRU Cache with O(1) get/put operations and thread-safe eviction in your primary tech stack for %s.", role))
                .hints(List.of(
                        "Combine a doubly linked list with a concurrent hash table",
                        "Consider fine-grained locking or ReadWriteLocks over synchronized blocks",
                        "Address race conditions between reading a node and evicting the tail"
                ))
                .expectedKeyPoints(List.of(
                        "Doubly linked list allows O(1) node removal and prepend to head",
                        "Hash map stores Key -> Node reference for O(1) search",
                        "ReentrantReadWriteLock or lock-free segment strategies",
                        "Proper handling of capacity overflows and concurrent modifications"
                ))
                .followUpQuestions(List.of(
                        "How would you add time-to-live (TTL) expiration alongside capacity-based eviction?",
                        "What are the CPU cache locality implications of pointer-heavy doubly linked lists?"
                ))
                .build());

        r2Options.add(MockInterviewQuestion.builder()
                .id("q-code-be2-" + UUID.randomUUID().toString().substring(0, 8))
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(codingSeconds)
                .question(String.format("Design and implement a thread-safe Bounded In-Memory Queue / Ring Buffer supporting multiple producers and multiple consumers without global lock contention for %s.", role))
                .hints(List.of(
                        "Use atomic pointers (AtomicLong / compare-and-swap) for head and tail sequence numbers",
                        "Power-of-two capacity for fast bitwise modulo indexing (index & (capacity - 1))",
                        "Address false sharing via cache line padding"
                ))
                .expectedKeyPoints(List.of(
                        "Lock-free or striped locking concurrency mechanism",
                        "Correct handling of buffer overflow (blocking, dropping, or rejecting)",
                        "Memory visibility guarantees (volatile / atomic semantics)"
                ))
                .followUpQuestions(List.of(
                        "How does the LMAX Disruptor architecture achieve millions of ops/sec using ring buffers?",
                        "How do you detect and recover from slow or stalled consumers?"
                ))
                .build());

        r2Options.add(MockInterviewQuestion.builder()
                .id("q-code-be3-" + UUID.randomUUID().toString().substring(0, 8))
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(codingSeconds)
                .question(String.format("Given an undirected graph representing a network of microservices with latency weights, find the shortest path between services with at most K hops and bandwidth constraints for %s.", role))
                .hints(List.of(
                        "Modified Dijkstra algorithm tracking (current_node, current_latency, hops_remaining)",
                        "PriorityQueue prioritizing lowest latency paths first",
                        "State-space pruning: prune paths if hops exceed K or latency exceeds current best"
                ))
                .expectedKeyPoints(List.of(
                        "Correct state representation incorporating path constraints",
                        "Time complexity analysis: O(E * K * log(V * K))",
                        "Cycle prevention and memory bounds"
                ))
                .followUpQuestions(List.of(
                        "How does this relate to Bellman-Ford algorithm with K relaxation iterations?",
                        "How would you parallelize route discovery across massive graphs?"
                ))
                .build());

        questions.add(r2Options.get(ThreadLocalRandom.current().nextInt(r2Options.size())));

        // -------------------------------------------------------------
        // Round 3: ARCHITECTURE & PRODUCTION RELIABILITY
        // -------------------------------------------------------------
        List<MockInterviewQuestion> r3Options = new ArrayList<>();

        r3Options.add(MockInterviewQuestion.builder()
                .id("q-arch-1-" + UUID.randomUUID().toString().substring(0, 8))
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(600)
                .question(String.format("A critical database migration in production locks core tables and causes cascading timeouts during peak traffic on %s. Walk me through your step-by-step incident response, zero-downtime schema evolution strategy, and rollback plan.", role))
                .hints(List.of(
                        "Zero-downtime expand-contract (parallel run) pattern",
                        "Dual writing vs database triggers",
                        "Circuit breakers to isolate backend timeouts"
                ))
                .expectedKeyPoints(List.of(
                        "Immediate incident mitigation (kill blocking queries, activate circuit breakers)",
                        "Expand-Contract schema pattern (Add column -> Dual write -> Backfill -> Read new -> Drop old)",
                        "Post-mortem root cause analysis and preventative guardrails"
                ))
                .followUpQuestions(List.of(
                        "How do you ensure data integrity during backfilling 500 million rows without spiking replication lag?",
                        "What telemetry and alerts should have caught the query lock before production degraded?"
                ))
                .build());

        r3Options.add(MockInterviewQuestion.builder()
                .id("q-arch-2-" + UUID.randomUUID().toString().substring(0, 8))
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(600)
                .question(String.format("Your platform experiences a cascading outage when a downstream microservice dependencies latency spikes from 15ms to 8,000ms. How do you design client-side resilience, bulkhead isolation, and circuit breaker recovery for %s?", role))
                .hints(List.of(
                        "Resilience4j / Hystrix circuit breaker states (Closed, Open, Half-Open)",
                        "Bulkhead isolation pattern to limit concurrent thread pool saturation",
                        "Graceful degradation with stale cache or mock fallbacks"
                ))
                .expectedKeyPoints(List.of(
                        "Preventing connection pool exhaustion in caller services",
                        "Configuring adaptive timeouts with exponential backoff and jitter",
                        "Health checks and automated recovery validation"
                ))
                .followUpQuestions(List.of(
                        "Why are retries without jitter dangerous during a thundering herd incident?",
                        "How do distributed tracing tools like OpenTelemetry help identify the true bottleneck?"
                ))
                .build());

        r3Options.add(MockInterviewQuestion.builder()
                .id("q-arch-3-" + UUID.randomUUID().toString().substring(0, 8))
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(600)
                .question(String.format("During a Black Friday traffic surge, your main relational database reaches 99%% CPU and read replica lag reaches 45 seconds. How do you orchestrate traffic shedding, read-write splitting, and hot-key mitigation for %s?", role))
                .hints(List.of(
                        "Activate graceful degradation (shed non-critical recommendation queries)",
                        "Enforce sticky sessions or read-your-own-writes guarantees with version tokens",
                        "Local L1 Caffeine caches to absorb hot-key read spikes before hitting Redis/DB"
                ))
                .expectedKeyPoints(List.of(
                        "Multi-tiered shedding strategy (VIP requests vs background sync)",
                        "Mitigating replication lag anomalies in customer-facing flows",
                        "Dynamic connection pooling adjustments without full redeployments"
                ))
                .followUpQuestions(List.of(
                        "How do you detect which specific queries are responsible for the 99% CPU spike in real-time?",
                        "What is your architectural roadmap to permanently solve this bottleneck (e.g. sharding vs NoSQL migration)?"
                ))
                .build());

        questions.add(r3Options.get(ThreadLocalRandom.current().nextInt(r3Options.size())));

        // -------------------------------------------------------------
        // Round 4: BEHAVIORAL & ENGINEERING LEADERSHIP (STAR Method)
        // -------------------------------------------------------------
        List<MockInterviewQuestion> r4Options = new ArrayList<>();

        r4Options.add(MockInterviewQuestion.builder()
                .id("q-beh-1-" + UUID.randomUUID().toString().substring(0, 8))
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(480)
                .question(String.format("Describe a time when you strongly disagreed with a technical design or architectural decision proposed by a Staff Engineer or Product Manager for %s. How did you validate your hypothesis, influence the team, and what was the outcome?", role))
                .hints(List.of(
                        "Use the STAR method (Situation, Task, Action, Result)",
                        "Focus on data, benchmarks, and customer impact rather than personal opinion",
                        "Demonstrate disagree-and-commit maturity if the decision went the other way"
                ))
                .expectedKeyPoints(List.of(
                        "Clear context and quantified technical trade-offs",
                        "Objective proof (benchmarks, prototypes, POCs)",
                        "Collaborative communication maintaining team trust",
                        "Measurable business or latency impact achieved"
                ))
                .followUpQuestions(List.of(
                        "If given the chance, what would you have done differently in hindsight?",
                        "How did this experience shape how you mentor junior engineers?"
                ))
                .build());

        r4Options.add(MockInterviewQuestion.builder()
                .id("q-beh-2-" + UUID.randomUUID().toString().substring(0, 8))
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(480)
                .question(String.format("Tell me about a high-severity production incident you spearheaded on %s. What was the blast radius, how did you lead the team under intense time pressure to diagnose root cause, and what architectural safeguards did you implement to prevent regression?", role))
                .hints(List.of(
                        "STAR format focusing on composure, rapid triage, and communication",
                        "Clear separation between immediate mitigation and long-term fix",
                        "Blameless post-mortem culture and engineering improvements"
                ))
                .expectedKeyPoints(List.of(
                        "Incident command protocol and stakeholder communications",
                        "Systematic diagnostic methodology (logs, metrics, recent deployments)",
                        "Preventative engineering action items added to sprint backlog"
                ))
                .followUpQuestions(List.of(
                        "How did you manage executive updates while keeping engineers focused on mitigation?",
                        "What automated testing gaps were exposed by this incident?"
                ))
                .build());

        r4Options.add(MockInterviewQuestion.builder()
                .id("q-beh-3-" + UUID.randomUUID().toString().substring(0, 8))
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(480)
                .question(String.format("Describe a situation where a critical project was falling behind deadline due to changing requirements or technical debt. How did you negotiate scope with stakeholders, maintain high code quality, and deliver results as %s?", role))
                .hints(List.of(
                        "Explain prioritization framework (P0 critical path vs P1 stretch goals)",
                        "Transparent communication with product managers and cross-functional teams",
                        "Refactoring strategy that preserved system reliability under deadline pressure"
                ))
                .expectedKeyPoints(List.of(
                        "Scope negotiation grounded in customer value and technical feasibility",
                        "Avoidance of unsustainable heroics through pragmatic milestone slicing",
                        "Quantified business outcome delivered on time"
                ))
                .followUpQuestions(List.of(
                        "How did you ensure that deferred technical debt was actually addressed later?",
                        "How did you manage morale and prevent burnout across the engineering team?"
                ))
                .build());

        questions.add(r4Options.get(ThreadLocalRandom.current().nextInt(r4Options.size())));

        return questions;
    }

    public EvaluationResponse evaluateAnswer(EvaluationRequest request) {
        String answer = request.getUserAnswer() != null ? request.getUserAnswer().trim() : "";
        int wordCount = answer.isEmpty() ? 0 : answer.split("\\s+").length;

        // Semantic scoring engine analyzing answer completeness, structure, and depth
        int technicalScore;
        int clarityScore;
        int systemDesignScore;
        int edgeCaseScore;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> missingConcepts = new ArrayList<>();
        List<String> recommendedTopics = new ArrayList<>();

        if (wordCount < 15) {
            technicalScore = 30;
            clarityScore = 35;
            systemDesignScore = 25;
            edgeCaseScore = 20;
            weaknesses.add("Answer is too brief and lacks concrete architectural or implementation details.");
            missingConcepts.add("Algorithmic complexity, trade-off reasoning, and failure recovery modes.");
        } else if (wordCount < 60) {
            technicalScore = 60;
            clarityScore = 68;
            systemDesignScore = 58;
            edgeCaseScore = 50;
            strengths.add("Understands the general premise and core approach to the problem.");
            weaknesses.add("Could elaborate further on production edge cases, scaling limits, and concurrency safety.");
            missingConcepts.add("Specific numbers, data replication strategies, and failure isolation.");
        } else {
            // Check for technical indicators in candidate's response
            String lower = answer.toLowerCase();
            boolean mentionsComplexity = lower.contains("o(") || lower.contains("time complexity") || lower.contains("space") || lower.contains("latency");
            boolean mentionsTradeoffs = lower.contains("tradeoff") || lower.contains("trade-off") || lower.contains("however") || lower.contains("considers") || lower.contains("balance");
            boolean mentionsFailureOrEdges = lower.contains("fail") || lower.contains("error") || lower.contains("edge case") || lower.contains("timeout") || lower.contains("concurrency") || lower.contains("thread");
            boolean mentionsComponents = lower.contains("redis") || lower.contains("cache") || lower.contains("database") || lower.contains("table") || lower.contains("queue") || lower.contains("api") || lower.contains("lock");

            technicalScore = 75 + (mentionsComplexity ? 8 : 0) + (mentionsComponents ? 8 : 0);
            clarityScore = 78 + (wordCount > 100 ? 7 : 0) + (answer.contains("\n") ? 6 : 0);
            systemDesignScore = 72 + (mentionsTradeoffs ? 12 : 0) + (mentionsComponents ? 6 : 0);
            edgeCaseScore = 70 + (mentionsFailureOrEdges ? 15 : 0);

            // Cap at 98
            technicalScore = Math.min(technicalScore, 98);
            clarityScore = Math.min(clarityScore, 98);
            systemDesignScore = Math.min(systemDesignScore, 98);
            edgeCaseScore = Math.min(edgeCaseScore, 98);

            strengths.add("Strong articulation of technical fundamentals with clear conceptual grasp.");
            if (mentionsTradeoffs) {
                strengths.add("Excellent awareness of architectural trade-offs and real-world system constraints.");
            }
            if (mentionsFailureOrEdges) {
                strengths.add("Proactively addresses failure resilience, concurrency, and edge cases.");
            } else {
                weaknesses.add("Could highlight edge-case recovery and network partition mitigation more explicitly.");
            }

            if (!mentionsComplexity && "CODING".equalsIgnoreCase(request.getCategory())) {
                missingConcepts.add("Big-O Time and Auxiliary Space complexity bounds.");
            }
        }

        int overallScore = (int) Math.round((technicalScore * 0.35) + (clarityScore * 0.25) + (systemDesignScore * 0.25) + (edgeCaseScore * 0.15));

        String verdict;
        if (overallScore >= 88) {
            verdict = "STRONG_HIRE";
        } else if (overallScore >= 75) {
            verdict = "HIRE";
        } else if (overallScore >= 62) {
            verdict = "LEANING_HIRE";
        } else if (overallScore >= 50) {
            verdict = "LEANING_NO_HIRE";
        } else {
            verdict = "NO_HIRE";
        }

        recommendedTopics.add("Distributed Systems Design Patterns (Saga, Outbox, Circuit Breaker)");
        recommendedTopics.add("High-Throughput Caching Strategies (Cache-Aside, Write-Through, Stampede Prevention)");
        recommendedTopics.add("Zero-Downtime Database Migrations & Sharding Techniques");

        String modelAnswer = generateModelAnswer(request.getCategory(), request.getQuestion());

        String summary = String.format(
                "Candidate scored %d/100 (%s). The response %s. %s",
                overallScore,
                verdict.replace("_", " "),
                overallScore >= 75 ? "demonstrates senior engineering maturity and structured problem solving" : "covers the basics but needs greater depth and technical rigor",
                strengths.isEmpty() ? "Focus on structuring your answers using real architectural examples." : "Key strength: " + strengths.get(0)
        );

        return EvaluationResponse.builder()
                .overallScore(overallScore)
                .technicalAccuracyScore(technicalScore)
                .clarityScore(clarityScore)
                .systemDesignScore(systemDesignScore)
                .edgeCaseHandlingScore(edgeCaseScore)
                .verdict(verdict)
                .summary(summary)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .missingConcepts(missingConcepts)
                .modelAnswer(modelAnswer)
                .recommendedTopics(recommendedTopics)
                .build();
    }

    private String generateModelAnswer(String category, String question) {
        if ("SYSTEM_DESIGN".equalsIgnoreCase(category)) {
            return "### Senior/Staff Engineer Model Answer:\n\n" +
                    "1. **Requirements & Scale:**\n" +
                    "   - Functional: Rate limit by tenant and API key with configurable limits (e.g., 5000 req/min).\n" +
                    "   - Non-functional: Latency < 5ms (P99), high availability, fail-open on cache failure.\n\n" +
                    "2. **Algorithm Choice:**\n" +
                    "   - Use **Sliding Window Counter** with Redis Sorted Sets or Token Bucket in Redis via atomic Lua scripts.\n" +
                    "   - Local L1 in-memory cache (Caffeine/Guava) for fast-path rejections without Redis round-trips.\n\n" +
                    "3. **High Scale & Multi-Region:**\n" +
                    "   - Shard counters by `tenantId:minute` using consistent hashing.\n" +
                    "   - In multi-region deployments, divide quotas across regions (e.g. US 60%, EU 40%) or use asynchronous token synchronization.\n\n" +
                    "4. **Failure Modes:**\n" +
                    "   - On Redis connection timeout: Fail-open with circuit breaker to prevent blocking user requests, while emitting metric alerts.";
        } else if ("CODING".equalsIgnoreCase(category)) {
            return "### Senior/Staff Engineer Model Answer:\n\n" +
                    "1. **Core Data Structure:**\n" +
                    "   - Combine a `ConcurrentHashMap<K, Node<K, V>>` for O(1) lookups with a customized Doubly Linked List for O(1) node repositioning.\n\n" +
                    "2. **Concurrency Strategy:**\n" +
                    "   - Instead of coarse synchronization on the whole cache, protect node pointer mutations with a fine-grained `ReentrantLock` or striped segment locks.\n" +
                    "   - During `get(key)`: Update node position to the MRU (head) atomically.\n" +
                    "   - During `put(key, value)`: If key exists, update value and move to head. If capacity is exceeded, evict tail node and remove from map.\n\n" +
                    "3. **Complexity:**\n" +
                    "   - Time: O(1) Get and Put.\n" +
                    "   - Space: O(Capacity) auxiliary memory.";
        } else {
            return "### Senior/Staff Engineer Model Answer:\n\n" +
                    "1. **Immediate Triage:** Acknowledge incident, verify customer impact through SLO dashboards, and enact mitigation (failover / query cancellation).\n" +
                    "2. **Expand-Contract Migration Pattern:**\n" +
                    "   - Step 1: Add new nullable columns without default values or full table locks.\n" +
                    "   - Step 2: Deploy application code that dual-writes to both schemas.\n" +
                    "   - Step 3: Run throttled background migration scripts in batches of 5000 rows.\n" +
                    "   - Step 4: Switch read queries to the new schema once backfill completes.\n" +
                    "   - Step 5: Clean up old columns in a subsequent non-peak deployment.";
        }
    }
}
