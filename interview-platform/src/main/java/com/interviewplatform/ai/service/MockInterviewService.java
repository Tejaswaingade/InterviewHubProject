package com.interviewplatform.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class MockInterviewService {

    private static final Logger log = LoggerFactory.getLogger(MockInterviewService.class);

    @Value("${ai.api-key:}")
    private String aiApiKey;

    @Value("${ai.provider:auto}")
    private String aiProvider;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Track recently served question IDs per role/domain session to guarantee non-repeating questions
    private final ConcurrentHashMap<String, Set<String>> recentQuestionHistory = new ConcurrentHashMap<>();

    public MockInterviewService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public List<MockInterviewQuestion> generateQuestions(MockInterviewRequest request) {
        String role = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole().trim() : "Senior Backend Engineer";
        String domain = (request.getDomain() != null && !request.getDomain().isBlank()) ? request.getDomain().trim() : "Distributed Systems & Microservices";
        String difficulty = (request.getDifficulty() != null && !request.getDifficulty().isBlank()) ? request.getDifficulty().trim().toUpperCase() : "MEDIUM";
        String focus = (request.getResumeSnippet() != null && !request.getResumeSnippet().isBlank()) ? request.getResumeSnippet().trim() : "";
        if (focus.isEmpty() && request.getCandidateProfileSummary() != null && !request.getCandidateProfileSummary().isBlank()) {
            focus = request.getCandidateProfileSummary().trim();
        }

        String effectiveKey = (request.getApiKey() != null && !request.getApiKey().isBlank()) ? request.getApiKey().trim() : aiApiKey;

        // 1. If an external AI API key is configured or provided, generate real-time dynamic questions
        if (effectiveKey != null && !effectiveKey.isBlank() && !effectiveKey.startsWith("${")) {
            try {
                List<MockInterviewQuestion> aiQuestions = generateViaExternalAi(effectiveKey, role, domain, difficulty, focus);
                if (aiQuestions != null && aiQuestions.size() >= 4) {
                    log.info("[MockInterviewService] Real-time external AI generated {} dynamic questions for role='{}'", aiQuestions.size(), role);
                    return aiQuestions;
                }
            } catch (Exception ex) {
                log.warn("[MockInterviewService] External AI question generation failed: {}. Falling back to tailored non-repeating question pool.", ex.getMessage());
            }
        }

        // 2. Dynamic, role-tailored question library with non-repeating rotating pools
        return generateDiverseQuestions(role, domain, difficulty, focus);
    }

    private List<MockInterviewQuestion> generateDiverseQuestions(String role, String domain, String difficulty, String focus) {
        String tpsScale;
        int systemDesignSeconds;
        int codingSeconds;
        switch (difficulty) {
            case "EASY":
            case "JUNIOR":
                tpsScale = "10,000 req/sec";
                systemDesignSeconds = 720;
                codingSeconds = 900;
                break;
            case "HARD":
            case "STAFF":
                tpsScale = "500,000 req/sec";
                systemDesignSeconds = 600;
                codingSeconds = 1200;
                break;
            case "MEDIUM":
            default:
                tpsScale = "100,000 req/sec";
                systemDesignSeconds = 600;
                codingSeconds = 900;
                break;
        }

        String focusTag = (domain != null && !domain.isBlank() ? " [" + domain + "]" : "")
                + (focus.isEmpty() ? "" : " (Special Focus: " + focus + ")");

        String sessionKey = (role + "::" + domain).toLowerCase();
        Set<String> recentSet = recentQuestionHistory.computeIfAbsent(sessionKey, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()));

        List<MockInterviewQuestion> result = new ArrayList<>();

        // Round 1: System Design / Architecture
        List<MockInterviewQuestion> r1Pool = buildSystemDesignPool(role, domain, difficulty, tpsScale, systemDesignSeconds, focusTag);
        result.add(selectNonRepeating(r1Pool, recentSet));

        // Round 2: Data Structures, Algorithms & Concurrency
        List<MockInterviewQuestion> r2Pool = buildCodingPool(role, domain, difficulty, codingSeconds);
        result.add(selectNonRepeating(r2Pool, recentSet));

        // Round 3: Architecture & Production Reliability
        List<MockInterviewQuestion> r3Pool = buildArchitecturePool(role, domain, difficulty, 600);
        result.add(selectNonRepeating(r3Pool, recentSet));

        // Round 4: Behavioral & Engineering Leadership (STAR Method)
        List<MockInterviewQuestion> r4Pool = buildBehavioralPool(role, difficulty, 480);
        result.add(selectNonRepeating(r4Pool, recentSet));

        return result;
    }

    private MockInterviewQuestion selectNonRepeating(List<MockInterviewQuestion> pool, Set<String> recentSet) {
        if (pool == null || pool.isEmpty()) {
            return MockInterviewQuestion.builder()
                    .id("q-fallback-" + UUID.randomUUID().toString().substring(0, 8))
                    .question("Walk me through the end-to-end architecture and scale trade-offs of your most complex project.")
                    .category("ARCHITECTURE")
                    .difficulty("MEDIUM")
                    .timeLimitSeconds(600)
                    .hints(List.of("State requirements", "Outline bottlenecks", "Discuss failover"))
                    .build();
        }

        List<MockInterviewQuestion> fresh = new ArrayList<>();
        for (MockInterviewQuestion q : pool) {
            if (!recentSet.contains(q.getId())) {
                fresh.add(q);
            }
        }

        // If candidate has seen all questions in this category pool, reset history to allow re-cycling
        if (fresh.isEmpty()) {
            recentSet.clear();
            fresh.addAll(pool);
        }

        MockInterviewQuestion chosen = fresh.get(ThreadLocalRandom.current().nextInt(fresh.size()));
        recentSet.add(chosen.getId());
        return chosen;
    }

    private List<MockInterviewQuestion> buildSystemDesignPool(String role, String domain, String difficulty, String tpsScale, int seconds, String focusTag) {
        String combined = (role + " " + domain).toLowerCase();
        List<MockInterviewQuestion> list = new ArrayList<>();

        // Frontend Specialized Questions
        if (combined.contains("front") || combined.contains("react") || combined.contains("ui") || combined.contains("web")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe-1")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design a high-frequency real-time analytics web dashboard for %s capable of updating at %s with zero UI frame drops (60 FPS). How do you handle DOM recycling, WebSocket backpressure, and local offline persistence%s?", role, tpsScale, focusTag))
                    .hints(List.of("Decouple WebSocket ingress from React rendering via requestAnimationFrame", "Windowing/virtualization for 100,000+ data rows", "IndexedDB with Web Workers for offline aggregation"))
                    .expectedKeyPoints(List.of("Microtask vs animation frame timing", "Virtual DOM memory constraints", "Optimistic state rehydration"))
                    .followUpQuestions(List.of("How do you profile and prevent Cumulative Layout Shift (CLS)?", "What is your memory cleanup strategy for long-lived tabs?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe-2")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Architect a scalable Micro-Frontend and Design System platform for %s utilizing Webpack 5 Module Federation. How do you govern shared runtime singletons, version drift, cross-app routing, and atomic independent deploys%s?", role, focusTag))
                    .hints(List.of("Module federation shared scope for React and theme tokens", "Isolated CSS via Shadow DOM or CSS Modules", "Event-driven inter-app communication without global window pollution"))
                    .expectedKeyPoints(List.of("Fault isolation if a remote bundle returns 502", "Canary routing for federated remotes", "Performance budget enforcement across 10+ decoupled teams"))
                    .followUpQuestions(List.of("How do you prevent duplicate bundle downloads?", "How do you coordinate cross-microfrontend state during logout?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-fe-3")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design a collaborative multiplayer document editor (like Google Docs or Figma) for %s. How do you handle real-time concurrent typing, CRDTs vs OT, cursor position telemetry, and undo/redo stacks%s?", role, focusTag))
                    .hints(List.of("Conflict-Free Replicated Data Types (Yjs / Automerge)", "WebSocket delta compression", "Local immediate echo with background consensus"))
                    .expectedKeyPoints(List.of("Convergence guarantees without server locks", "Throttling presence telemetry", "Memory bounding on 50,000 edits"))
                    .followUpQuestions(List.of("How do you handle offline editing and conflict resolution?", "What is your fallback if WebSockets fail over corporate proxies?"))
                    .build());
            return list;
        }

        // DevOps & Cloud Specialized Questions
        if (combined.contains("devops") || combined.contains("cloud") || combined.contains("sre") || combined.contains("infra")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-ops-1")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design a multi-region, active-active zero-downtime Kubernetes infrastructure supporting %s handling %s. How do you structure progressive canary delivery, cross-region traffic routing, and instant automated rollback on 5xx metric spikes%s?", role, tpsScale, focusTag))
                    .hints(List.of("ArgoCD/Flux with progressive canary analysis (Flagger)", "Global Anycast DNS or Cloudflare Geo-steering", "Prometheus SLO alerts triggering automated rollback"))
                    .expectedKeyPoints(List.of("Multi-region state replication trade-offs", "Canary validation criteria (P99 latency, error rate)", "Disaster recovery failover automation"))
                    .followUpQuestions(List.of("How do you prevent split-brain during inter-region link failure?", "What is your cost optimization strategy for cross-AZ data egress?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-ops-2")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Architect a centralized observability and distributed tracing platform for %s processing 10 TB of daily telemetry logs, traces, and metrics. How do you design sampling, indexing, tiering, and alerting%s?", role, focusTag))
                    .hints(List.of("OpenTelemetry collector pipeline with tail-based sampling", "ClickHouse / VictoriaMetrics for cost-effective time-series", "Kafka buffer between collectors and storage"))
                    .expectedKeyPoints(List.of("Head vs tail sampling trade-offs", "Mitigating high cardinality tags", "Automated index lifecycle management"))
                    .followUpQuestions(List.of("How do you prevent telemetry pipeline failures from affecting production apps?", "How do you detect alert fatigue across on-call engineers?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-ops-3")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design an automated multi-tenant GitOps continuous delivery pipeline with zero-trust mTLS service mesh (Istio/Linkerd) for %s. How do you manage secret rotation, canary traffic shifting, and ephemeral staging previews%s?", role, focusTag))
                    .hints(List.of("External Secrets Operator + HashiCorp Vault", "Istio VirtualService weight routing", "Karpenter dynamic autoscaling"))
                    .expectedKeyPoints(List.of("Automated secret rotation without pod downtime", "Progressive canary analysis verification", "Zero-trust network policy enforcement"))
                    .followUpQuestions(List.of("How do you secure container images against supply chain CVEs?", "What is your disaster recovery RTO and RPO?"))
                    .build());
            return list;
        }

        // Data / AI / ML Specialized Questions
        if (combined.contains("data") || combined.contains("ai") || combined.contains("ml") || combined.contains("lake")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-data-1")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design a real-time feature store and low-latency model inference engine for %s serving %s. How do you guarantee sub-10ms P99 latency, handle schema evolution, and prevent training-serving skew%s?", role, tpsScale, focusTag))
                    .hints(List.of("Dual-storage feature store (Redis for online, Iceberg/Delta for offline)", "Kafka/Flink streaming feature pipelines", "Model versioning and shadow canary deployments"))
                    .expectedKeyPoints(List.of("Zero training-serving skew validation", "Feature backfilling and time-travel querying", "Fallback inference on model timeout"))
                    .followUpQuestions(List.of("How do you detect feature drift in real-time?", "How do you scale vector similarity search for embedding features?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-data-2")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Architect a massive-scale Data Lakehouse on Apache Iceberg / Delta Lake for %s ingesting billions of daily records. How do you design partitioning, compaction, data deduplication, and ACID transactions%s?", role, focusTag))
                    .hints(List.of("Hidden partitioning and metadata snapshot management", "Asynchronous compaction jobs avoiding small file problems", "Bloom filters for upsert deduplication"))
                    .expectedKeyPoints(List.of("ACID snapshot isolation mechanics", "Cost optimization for storage tiers", "Enforcing GDPR/CCPA right-to-be-forgotten deletes"))
                    .followUpQuestions(List.of("How do you prevent metadata bloat on 100,000 commits?", "What is your strategy for cross-region data replication?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-data-3")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design an end-to-end LLM RAG (Retrieval-Augmented Generation) production pipeline for %s serving 50,000 queries/hour. How do you handle document chunking, hybrid vector/keyword search, prompt caching, and hallucination guardrails%s?", role, focusTag))
                    .hints(List.of("Hierarchical chunking with metadata enrichment", "Qdrant / Milvus vector index with HNSW graph", "vLLM with speculative decoding and prompt prefix caching"))
                    .expectedKeyPoints(List.of("Vector index recall vs latency trade-offs", "Evaluation metrics: Faithfulness and Context Relevance", "Sub-second response streaming"))
                    .followUpQuestions(List.of("How do you secure private enterprise documents from leaking across tenants in RAG?", "How do you handle model deprecation without pipeline downtime?"))
                    .build());
            return list;
        }

        // Mobile Specialized Questions
        if (combined.contains("mobile") || combined.contains("android") || combined.contains("ios")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-mob-1")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design an offline-first mobile client architecture with seamless cloud synchronization for %s. How do you handle local relational caching (SQLite/Room), conflict resolution, optimistic UI updates, and battery conservation%s?", role, focusTag))
                    .hints(List.of("CRDT or timestamped mutation queue", "WorkManager / BackgroundTasks for opportunistic network sync", "Exponential backoff with network type constraints"))
                    .expectedKeyPoints(List.of("Optimistic local updates with rollback", "Data payload delta compression", "Battery and cellular bandwidth preservation"))
                    .followUpQuestions(List.of("How do you migrate local client databases across major app versions?", "How do you prevent UI freezing during large data imports?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-sd-mob-2")
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Architect a dynamic feature flag and remote configuration system for mobile %s supporting millions of daily active devices. How do you design client evaluation, instant kill switches, and zero-latency startup%s?", role, focusTag))
                    .hints(List.of("Client-side rule evaluation engine with bundled defaults", "Delta payload sync over CDN", "Cryptographic signature validation of flag configurations"))
                    .expectedKeyPoints(List.of("Zero-latency startup via cached disk snapshot", "Targeted user segmentation (OS version, geo, app build)", "Instant emergency feature disabling without App Store releases"))
                    .followUpQuestions(List.of("How do you prevent race conditions between startup flags and app init?", "What telemetry monitors crash rate spikes on new flags?"))
                    .build());
            return list;
        }

        // Core Backend & Distributed Systems Architecture (Default for Backend, Full-Stack, Staff Systems)
        list.add(MockInterviewQuestion.builder()
                .id("q-sd-be-1")
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Design a distributed, fault-tolerant Rate Limiter for a multi-tenant %s platform serving %s. How do you handle clock drift, bursty spikes, cross-datacenter synchronization, and fail-open resilience%s?", role, tpsScale, focusTag))
                .hints(List.of("Token Bucket vs Sliding Window Counter algorithms", "Redis cluster with atomic Lua scripts", "Local L1 in-memory cache for fast-path rejections"))
                .expectedKeyPoints(List.of("Atomic counter increment mechanics", "Multi-region quota allocation strategies", "Fail-open circuit breaker behavior"))
                .followUpQuestions(List.of("How do you prevent DDoS attackers from bypassing IP limits via rotating proxies?", "What is the memory footprint of storing state for 50 million active users?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-sd-be-2")
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Design an Event Streaming and Notification Fan-out system for %s delivering millions of real-time messages at %s. How do you guarantee exactly-once processing, manage poison pills, and prevent consumer lag%s?", role, tpsScale, focusTag))
                .hints(List.of("Kafka partition key strategy", "Transactional Outbox pattern with Debezium CDC", "Dead Letter Queues (DLQ) with exponential backoff and jitter"))
                .expectedKeyPoints(List.of("Partition key selection avoiding hot partition bottlenecks", "Idempotent consumer deduplication via Redis or DB unique constraints", "Backpressure handling to protect downstream notification APIs"))
                .followUpQuestions(List.of("How do you rebalance consumer groups during dynamic autoscaling without stop-the-world lag?", "What telemetry monitors consumer lag across hundreds of partition topics?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-sd-be-3")
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Design a global Distributed Caching layer for %s supporting %s with sub-5ms P99 read latency. How do you prevent cache stampedes, manage multi-region invalidation, and ensure consistency during database writes%s?", role, tpsScale, focusTag))
                .hints(List.of("Cache-Aside vs Write-Through vs Write-Behind", "Mutex locks / probabilistic early expiration (XFetch algorithm)", "Pub/Sub based cache invalidation bus"))
                .expectedKeyPoints(List.of("Consistent hashing with virtual nodes", "Cache stampede prevention under high concurrency", "Replication lag mitigation between master database and caches"))
                .followUpQuestions(List.of("How would you handle sudden memory eviction under unexpected 10x traffic spikes?", "What are the trade-offs of storing serialized JSON vs binary protobuf in cache?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-sd-be-4")
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Architect a Distributed Task Scheduling and Workflow Engine (like Temporal or Celery) for %s managing long-running asynchronous jobs. How do you handle node crashes, heartbeats, state checkpointing, and deduplication%s?", role, focusTag))
                .hints(List.of("Event sourcing state machine", "Distributed lease locks (etcd/Consul/Redis)", "Exponential retry backoff with dead-letter queue"))
                .expectedKeyPoints(List.of("Task recovery on worker node termination", "Idempotent task execution semantics", "Queue priority and worker starvation mitigation"))
                .followUpQuestions(List.of("How do you handle dependency DAG workflows where task C requires task A and B?", "What is your database schema for storing millions of daily execution states?"))
                .build());

        return list;
    }

    private List<MockInterviewQuestion> buildCodingPool(String role, String domain, String difficulty, int seconds) {
        String combined = (role + " " + domain).toLowerCase();
        List<MockInterviewQuestion> list = new ArrayList<>();

        // Frontend Specialized Coding
        if (combined.contains("front") || combined.contains("react") || combined.contains("web") || combined.contains("ui")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-code-fe-1")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement an asynchronous Request Deduplicator and In-Memory Promise Cache in TypeScript/JavaScript for %s. It must coalesce identical in-flight requests, support TTL expiration, and propagate AbortController signals cleanly.", role))
                    .hints(List.of("Map storing in-flight Promise instances keyed by request signature", "Attach .finally() to in-flight promises to purge pending cache", "Forward abort signal to underlying fetch call"))
                    .expectedKeyPoints(List.of("Concurrent requests share identical Promise reference", "Cache invalidation on TTL expiry", "Graceful error propagation to all listeners"))
                    .followUpQuestions(List.of("How do you prevent cache stampedes when 1,000 components mount at once?", "What is your memory cleanup strategy for long-lived sessions?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-code-fe-2")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement a robust EventEmitter / Pub-Sub system in JavaScript/TypeScript for %s with support for namespace wildcards ('order.*'), once(), priority listeners, and async event dispatch.", role))
                    .hints(List.of("Map of event patterns to listener arrays", "once() wraps callback to auto-unsubscribe", "Trie or regex for wildcard matching"))
                    .expectedKeyPoints(List.of("O(1) unsubscribe via returned subscription token", "Listener error isolation (one crash doesn't halt others)", "Memory leak warning threshold"))
                    .followUpQuestions(List.of("How do you prevent circular event cascades?", "How would you implement async dispatch using queueMicrotask?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-code-fe-3")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement a custom Deep Object Clone function in JavaScript for %s that accurately handles circular references, Dates, RegExp, Maps, Sets, and symbol keys without stack overflow.", role))
                    .hints(List.of("Use a WeakMap to track visited object references", "Recursive cloning with type-specific instantiators", "Reflect.ownKeys() to include symbol keys"))
                    .expectedKeyPoints(List.of("Circular reference detection and preservation", "Proper prototype and non-enumerable handling", "Stack depth protection for deeply nested trees"))
                    .followUpQuestions(List.of("Why is structuredClone() not always sufficient in older runtimes?", "What is the time and space complexity relative to object graph size?"))
                    .build());
            return list;
        }

        // DevOps Specialized Coding
        if (combined.contains("devops") || combined.contains("cloud") || combined.contains("infra")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-code-ops-1")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Write a high-performance streaming Log Parser and Metrics Aggregator for %s that reads lines from a log stream, filters 5xx HTTP responses, and computes sliding 60-second P99 latencies using a fixed memory footprint.", role))
                    .hints(List.of("Reservoir sampling or t-digest / HdrHistogram for memory-bounded percentiles", "Circular buffer of time buckets (e.g. 60 1-second buckets)", "Regex precompilation or string splitting optimization"))
                    .expectedKeyPoints(List.of("Memory safety under unbounded stream volume", "Time complexity: O(1) per incoming log event", "Proper window eviction on clock ticks"))
                    .followUpQuestions(List.of("How do you handle out-of-order log timestamps from distributed nodes?", "How do you scale this across multiple CPU cores?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-code-ops-2")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement a thread-safe Kubernetes Reconciler / Controller loop pattern in your preferred language for %s that synchronizes desired spec state with observed status, with exponential backoff on transient errors and debounce on rapid updates.", role))
                    .hints(List.of("WorkQueue with rate limiting and deduplication", "RequeueAfter pattern for delayed retries", "Atomic compare-and-swap on status updates to prevent conflict"))
                    .expectedKeyPoints(List.of("Idempotent reconcile execution", "Handling 409 Conflict with optimistic lock retry", "Graceful shutdown with in-flight drain"))
                    .followUpQuestions(List.of("How do you prevent a poison-pill CRD from blocking the entire controller queue?", "How do you implement leader election for active-passive controller replicas?"))
                    .build());
            return list;
        }

        // AI / ML / Data Specialized Coding
        if (combined.contains("data") || combined.contains("ai") || combined.contains("ml")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-code-data-1")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement a fast Vector Cosine Similarity Search algorithm for %s that finds the Top-K nearest neighbors from a collection of 500,000 embedding vectors (dimension D=1536) using a Min-Heap and SIMD/vectorized dot products.", role))
                    .hints(List.of("Cosine similarity formula: (A . B) / (||A|| * ||B||)", "Pre-normalize all vectors at indexing time to reduce cosine to pure dot product", "Min-Heap of size K maintaining highest similarity scores"))
                    .expectedKeyPoints(List.of("Complexity: O(N * D + N log K)", "Pre-normalization optimization eliminating runtime square root", "Memory locality: contiguous float arrays"))
                    .followUpQuestions(List.of("How does Hierarchical Navigable Small World (HNSW) reduce search time to O(log N)?", "What precision loss occurs when quantizing float32 embeddings to int8?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-code-data-2")
                    .category("CODING")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Implement an in-memory Sliding Window Rate Limiter & Token Counter for streaming data in %s that handles 100,000 events/sec with sub-millisecond evaluation and zero memory leaks.", role))
                    .hints(List.of("Ring buffer or deque of timestamp counts", "Sliding window counter algorithm (current window weight + previous window weight)", "Atomic counters for thread safety"))
                    .expectedKeyPoints(List.of("O(1) time and memory complexity per event", "Sliding window interpolation preventing boundary spikes", "Concurrency safety without heavy lock contention"))
                    .followUpQuestions(List.of("How would you adapt this for distributed streams across multiple nodes?", "What are the trade-offs between Token Bucket vs Leaky Bucket?"))
                    .build());
            return list;
        }

        // Backend / Systems / Algorithmic Coding Questions (Default)
        list.add(MockInterviewQuestion.builder()
                .id("q-code-be-1")
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Implement a thread-safe Concurrent LRU Cache with O(1) get/put operations and high concurrency eviction in your primary tech stack for %s.", role))
                .hints(List.of("Combine a doubly linked list with a concurrent hash table", "Fine-grained node locks or striped lock segments over synchronized blocks", "Handle race condition between reading a node and evicting the tail"))
                .expectedKeyPoints(List.of("Doubly linked list allows O(1) repositioning", "ConcurrentHashMap for O(1) key lookups", "Thread safety under concurrent reads and writes", "Proper capacity enforcement"))
                .followUpQuestions(List.of("How would you add time-to-live (TTL) expiration alongside capacity eviction?", "What are the CPU cache line implications of pointer-heavy linked lists?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-code-be-2")
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Design and implement a lock-free Bounded In-Memory Queue / Ring Buffer supporting multiple producers and multiple consumers without global lock contention for %s.", role))
                .hints(List.of("Atomic sequence pointers (AtomicLong / CAS)", "Power-of-two capacity for fast bitwise indexing (index & (capacity - 1))", "Cache line padding to eliminate false sharing"))
                .expectedKeyPoints(List.of("Lock-free compare-and-swap state progression", "Handling buffer overflow (blocking, dropping, or rejecting)", "Memory visibility and volatile semantics"))
                .followUpQuestions(List.of("How does the LMAX Disruptor achieve 10M+ ops/sec using ring buffers?", "How do you detect and recover from slow or stalled consumers?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-code-be-3")
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Given a directed graph representing microservice network calls with latency weights and error rates, find the lowest-latency path between two services with at most K hops and cumulative error probability < 1%% for %s.", role))
                .hints(List.of("Modified Dijkstra tracking (current_node, latency, hops, cumulative_reliability)", "PriorityQueue prioritizing lowest latency paths first", "State-space pruning if hops > K or error rate exceeds threshold"))
                .expectedKeyPoints(List.of("Multi-dimensional state representation", "Complexity: O(E * K * log(V * K))", "Cycle prevention and memory pruning"))
                .followUpQuestions(List.of("How does this algorithm adapt if network latencies fluctuate dynamically?", "How would you parallelize path finding across massive clusters?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-code-be-4")
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Design and implement an in-memory Sliding Window Rate Limiter using a Sorted Set / Token algorithm in your primary backend language for %s.", role))
                .hints(List.of("Store millisecond timestamps in a sorted set / deque", "Remove timestamps older than (current_time - window_size)", "Atomic check: if size < max_requests, append current timestamp"))
                .expectedKeyPoints(List.of("Sliding window accuracy vs fixed window boundary spikes", "Time and space complexity per request", "Thread safety and lock contention mitigation"))
                .followUpQuestions(List.of("How would you adapt this for 1,000 requests per millisecond without memory explosion?", "What are the trade-offs of Sliding Window Counter vs Leaky Bucket?"))
                .build());

        return list;
    }

    private List<MockInterviewQuestion> buildArchitecturePool(String role, String domain, String difficulty, int seconds) {
        String combined = (role + " " + domain).toLowerCase();
        List<MockInterviewQuestion> list = new ArrayList<>();

        // Frontend Specialized Architecture
        if (combined.contains("front") || combined.contains("react") || combined.contains("ui") || combined.contains("web")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-arch-fe-1")
                    .category("ARCHITECTURE")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Your Single Page Application suffers from severe bundle size bloat (initial bundle > 8 MB) leading to a 7-second Largest Contentful Paint (LCP) on mobile networks for %s. Walk me through your step-by-step diagnostic process, route-based code splitting, dynamic imports, asset tree-shaking, and CI performance budget enforcement.", role))
                    .hints(List.of("Webpack Bundle Analyzer / Source Map Explorer", "Dynamic React.lazy() with Suspense boundaries", "Image optimization with WebP/AVIF and CDN responsive resizing"))
                    .expectedKeyPoints(List.of("Identifying duplicate dependencies across node_modules", "Critical CSS inlining vs deferred loading", "Setting automated lighthouse performance gates in CI/CD"))
                    .followUpQuestions(List.of("How do you handle SSR or Static Generation (SSG) to improve First Contentful Paint?", "How do you monitor Core Web Vitals in real-time from real user sessions (RUM)?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-arch-fe-2")
                    .category("ARCHITECTURE")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("A memory leak in a long-lived dashboard tab causes Chrome to crash with 'Aw, Snap! Out of Memory' after 45 minutes of user interaction on %s. How do you reproduce, isolate, and debug this using Chrome DevTools Memory Profiler, WeakRefs, event cleanup, and automated CI memory regression testing?", role))
                    .hints(List.of("Heap snapshot comparison (Allocation instrumentation on timeline)", "Uncleaned event listeners on window or detached DOM nodes", "Dangling setInterval, WebSocket listeners, or closure references"))
                    .expectedKeyPoints(List.of("Detached DOM tree memory leak diagnosis", "Proper useEffect cleanup functions", "Automated memory leak detection via Playwright heap snapshots in CI"))
                    .followUpQuestions(List.of("What are the trade-offs of using WeakMap vs Map for caching DOM metadata?", "How do you profile garbage collection pauses affecting 60fps animations?"))
                    .build());
            return list;
        }

        // DevOps Specialized Architecture
        if (combined.contains("devops") || combined.contains("cloud") || combined.contains("infra")) {
            list.add(MockInterviewQuestion.builder()
                    .id("q-arch-ops-1")
                    .category("ARCHITECTURE")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("A catastrophic control plane failure in your primary cloud region drops the Kubernetes API server while worker nodes continue executing workloads for %s. How do you maintain operational continuity, prevent crash-looping ingress controllers, and orchestrate a multi-region failover?", role))
                    .hints(List.of("Worker node autonomy when kubelet loses API server connection", "Global DNS health-check failover to standby region", "State replication across regions (CockroachDB / RDS Aurora Global)"))
                    .expectedKeyPoints(List.of("Blast radius containment during cloud provider control plane outages", "Automated DNS / BGP traffic redirect without DNS caching staleness", "RTO / RPO trade-offs during active-passive vs active-active failover"))
                    .followUpQuestions(List.of("How do you test control plane failures using Chaos Mesh?", "What happens to in-flight StatefulSet persistent volumes?"))
                    .build());

            list.add(MockInterviewQuestion.builder()
                    .id("q-arch-ops-2")
                    .category("ARCHITECTURE")
                    .difficulty(difficulty)
                    .timeLimitSeconds(seconds)
                    .question(String.format("Design an automated, GitOps-driven compliance and vulnerability remediation pipeline that scans container images, Terraform IaC, and Kubernetes manifests for %s, automatically generating pull requests and blocking non-compliant production merges.", role))
                    .hints(List.of("Trivy / Snyk for container scanning in GitHub Actions", "Open Policy Agent (OPA) / Kyverno for admission control", "Renovate / Dependabot for automated PR vulnerability patching"))
                    .expectedKeyPoints(List.of("Shift-left security without impeding developer velocity", "Automated admission controller blocking unapproved images in cluster", "Immutable audit trails for SOC2 / ISO compliance"))
                    .followUpQuestions(List.of("How do you manage zero-day CVEs before upstream vendor patches exist?", "What is your secret scanning strategy preventing leaked API keys in Git history?"))
                    .build());
            return list;
        }

        // Backend / Systems Architecture (Default)
        list.add(MockInterviewQuestion.builder()
                .id("q-arch-1")
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("A high-scale database migration in production locks critical tables and causes cascading timeouts during peak traffic on %s. Walk me through your step-by-step incident response, zero-downtime expand-contract strategy, and rollback plan.", role))
                .hints(List.of("Immediate mitigation (terminate blocking queries, activate circuit breakers)", "Expand-Contract pattern (Add column -> Dual write -> Backfill -> Read new -> Drop old)", "Post-mortem root cause analysis"))
                .expectedKeyPoints(List.of("Zero-downtime schema evolution lifecycle", "Safe backfilling in throttled batches", "Database query kill protocols"))
                .followUpQuestions(List.of("How do you handle unique constraint backfills without full table locks?", "What automated safeguards prevent unindexed migrations in CI/CD?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-arch-2")
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("You are tasked with breaking a legacy monolithic payment service into independent microservices for %s. How do you maintain transactional consistency, avoid distributed monolith antipatterns, and manage data synchronization during the multi-month migration?", role))
                .hints(List.of("Strangler Fig pattern for progressive carving", "Saga pattern with compensating transactions vs 2PC", "Change Data Capture (CDC) with Debezium"))
                .expectedKeyPoints(List.of("Database-per-service isolation principles", "Orchestration vs Choreography Saga trade-offs", "API Gateway routing and traffic shadowing"))
                .followUpQuestions(List.of("How do you handle a compensating transaction failure in a Saga?", "How do you detect distributed deadlocks across service boundaries?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-arch-3")
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("A critical downstream payment gateway experiences 10x latency and begins returning 504 Gateway Timeouts for %s. Walk me through how your architecture isolates the failure using circuit breakers, bulkheads, retries with jitter, and customer-facing fallbacks.", role))
                .hints(List.of("Resilience4j / Envoy Circuit Breakers with sliding window error rates", "Bulkhead isolation preventing thread pool exhaustion", "Exponential backoff with full jitter preventing thundering herds"))
                .expectedKeyPoints(List.of("Thread pool vs Semaphore bulkhead trade-offs", "Half-open state probe traffic limits", "Graceful UI degradation and asynchronous order staging"))
                .followUpQuestions(List.of("How do you prevent retried requests from causing duplicate payments?", "How do you test this resilience in staging using Chaos Engineering?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-arch-4")
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Explain your comprehensive strategy for Zero-Trust API Security in %s. How do you architect JWT token lifecycles, refresh token rotation with race-condition handling, rate limiting per tenant, and SQL injection / XSS prevention?", role))
                .hints(List.of("Short-lived access tokens (15 mins) + rotating refresh tokens in HttpOnly cookies", "Family token tracking to revoke entire chains upon reuse", "Parameterized queries and content security policy (CSP)"))
                .expectedKeyPoints(List.of("Defense-in-depth across API Gateway and microservices", "Detecting and revoking stolen refresh tokens", "Strict validation and sanitization pipelines"))
                .followUpQuestions(List.of("How do you invalidate JWT tokens before expiration during emergency password resets?", "What are the trade-offs of storing revocation blacklists in Redis?"))
                .build());

        return list;
    }

    private List<MockInterviewQuestion> buildBehavioralPool(String role, String difficulty, int seconds) {
        List<MockInterviewQuestion> list = new ArrayList<>();

        list.add(MockInterviewQuestion.builder()
                .id("q-beh-1")
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Describe a time when you strongly disagreed with a technical design or architectural decision proposed by a Staff Engineer or Product Manager for %s. How did you validate your hypothesis, influence the team, and what was the outcome?", role))
                .hints(List.of("Use the STAR method (Situation, Task, Action, Result)", "Rely on objective data, benchmarks, and customer impact rather than opinion", "Demonstrate disagree-and-commit maturity"))
                .expectedKeyPoints(List.of("Quantified technical trade-offs", "Objective proof (benchmarks, POCs)", "Collaborative communication maintaining team trust", "Measurable outcome achieved"))
                .followUpQuestions(List.of("What would you have done differently in hindsight?", "How did this experience shape how you mentor other engineers?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-beh-2")
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Tell me about a high-severity production outage you spearheaded on %s. What was the blast radius, how did you lead the team under intense time pressure to diagnose root cause, and what architectural safeguards did you implement to prevent regression?", role))
                .hints(List.of("STAR format focusing on composure, rapid triage, and communication", "Clear separation between immediate mitigation and long-term fix", "Blameless post-mortem culture and engineering improvements"))
                .expectedKeyPoints(List.of("Incident command protocol and stakeholder communications", "Systematic diagnostic methodology (logs, metrics, recent deployments)", "Preventative engineering action items added to sprint backlog"))
                .followUpQuestions(List.of("How did you manage executive updates while keeping engineers focused on mitigation?", "What automated testing gaps were exposed by this incident?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-beh-3")
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Describe a situation where a critical project was falling behind deadline due to changing requirements or technical debt. How did you negotiate scope with stakeholders, maintain high code quality, and deliver results as %s?", role))
                .hints(List.of("Explain prioritization framework (P0 critical path vs P1 stretch goals)", "Transparent communication with product managers and cross-functional teams", "Pragmatic milestone slicing that preserved system reliability under deadline pressure"))
                .expectedKeyPoints(List.of("Scope negotiation grounded in customer value and technical feasibility", "Avoidance of unsustainable heroics through pragmatic milestone slicing", "Quantified business outcome delivered on time"))
                .followUpQuestions(List.of("How did you ensure that deferred technical debt was actually addressed later?", "How did you manage morale and prevent burnout across the engineering team?"))
                .build());

        list.add(MockInterviewQuestion.builder()
                .id("q-beh-4")
                .category("BEHAVIORAL")
                .difficulty(difficulty)
                .timeLimitSeconds(seconds)
                .question(String.format("Tell me about a time you identified a critical flaw, security vulnerability, or severe performance bottleneck that no one else had noticed for %s. How did you prioritize it, rally team support, and resolve it?", role))
                .hints(List.of("Proactive ownership and vigilance beyond immediate sprint tickets", "Building a business case for why it must be fixed now", "Measured impact after the fix (latency drop, cost savings, security audit pass)"))
                .expectedKeyPoints(List.of("Proactive engineering mindset", "Effective communication of risk to non-technical stakeholders", "Measurable engineering impact"))
                .followUpQuestions(List.of("How did you ensure similar blindspots aren't missed in future code reviews?", "How did you share knowledge across the organization?"))
                .build());

        return list;
    }

    private List<MockInterviewQuestion> generateViaExternalAi(String key, String role, String domain, String difficulty, String focus) throws Exception {
        String prompt = String.format("""
            You are a Principal Engineering Interviewer at Google/Meta.
            Generate exactly 4 comprehensive, top-tier technical interview questions for the role of '%s' in the domain of '%s' at '%s' difficulty level.
            Optional candidate focus: '%s'.

            Return ONLY valid JSON matching this structure:
            [
              {
                "id": "q-1",
                "question": "System Design / Architecture question text...",
                "category": "SYSTEM_DESIGN",
                "difficulty": "%s",
                "timeLimitSeconds": 600,
                "hints": ["hint 1", "hint 2"],
                "expectedKeyPoints": ["point 1", "point 2"],
                "followUpQuestions": ["follow-up 1", "follow-up 2"]
              },
              {
                "id": "q-2",
                "question": "Coding & Concurrency challenge...",
                "category": "CODING",
                "difficulty": "%s",
                "timeLimitSeconds": 900,
                "hints": ["hint 1", "hint 2"],
                "expectedKeyPoints": ["point 1", "point 2"],
                "followUpQuestions": ["follow-up 1", "follow-up 2"]
              },
              {
                "id": "q-3",
                "question": "Production Architecture & Outage incident...",
                "category": "ARCHITECTURE",
                "difficulty": "%s",
                "timeLimitSeconds": 600,
                "hints": ["hint 1", "hint 2"],
                "expectedKeyPoints": ["point 1", "point 2"],
                "followUpQuestions": ["follow-up 1", "follow-up 2"]
              },
              {
                "id": "q-4",
                "question": "Engineering Leadership & STAR Behavioral challenge...",
                "category": "BEHAVIORAL",
                "difficulty": "%s",
                "timeLimitSeconds": 480,
                "hints": ["hint 1", "hint 2"],
                "expectedKeyPoints": ["point 1", "point 2"],
                "followUpQuestions": ["follow-up 1", "follow-up 2"]
              }
            ]
            """, role, domain, difficulty, focus, difficulty, difficulty, difficulty, difficulty);

        // Google Gemini API
        if (key.startsWith("AIza")) {
            String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key;
            Map<String, Object> geminiPayload = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt + "\nOutput strictly JSON array only.")))
                    )
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(geminiUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(12))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(geminiPayload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
                return parseQuestionsFromJsonText(text, difficulty);
            }
            return null;
        }

        // Groq API (gsk_...) or OpenAI API (sk-...)
        String endpoint = key.startsWith("gsk_")
                ? "https://api.groq.com/openai/v1/chat/completions"
                : "https://api.openai.com/v1/chat/completions";
        String model = key.startsWith("gsk_") ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

        String jsonPayload = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an elite Staff Engineering Interviewer. Output JSON only."),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.7
        ));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Authorization", "Bearer " + key)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(12))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            String rawContent = root.path("choices").path(0).path("message").path("content").asText();
            return parseQuestionsFromJsonText(rawContent, difficulty);
        }
        return null;
    }

    private List<MockInterviewQuestion> parseQuestionsFromJsonText(String rawContent, String defaultDifficulty) {
        if (rawContent != null && rawContent.contains("[") && rawContent.contains("]")) {
            try {
                int start = rawContent.indexOf('[');
                int end = rawContent.lastIndexOf(']') + 1;
                String jsonArr = rawContent.substring(start, end);
                JsonNode arrNode = objectMapper.readTree(jsonArr);
                List<MockInterviewQuestion> list = new ArrayList<>();
                for (JsonNode item : arrNode) {
                    list.add(MockInterviewQuestion.builder()
                            .id("ai-q-" + UUID.randomUUID().toString().substring(0, 8))
                            .question(item.path("question").asText())
                            .category(item.path("category").asText("SYSTEM_DESIGN"))
                            .difficulty(item.path("difficulty").asText(defaultDifficulty))
                            .timeLimitSeconds(item.path("timeLimitSeconds").asInt(600))
                            .hints(parseList(item.path("hints")))
                            .expectedKeyPoints(parseList(item.path("expectedKeyPoints")))
                            .followUpQuestions(parseList(item.path("followUpQuestions")))
                            .build());
                }
                return list;
            } catch (Exception ex) {
                log.warn("[MockInterviewService] Failed to parse JSON from AI response: {}", ex.getMessage());
            }
        }
        return null;
    }

    private List<String> parseList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode n : node) {
                result.add(n.asText());
            }
        }
        return result;
    }

    public EvaluationResponse evaluateAnswer(EvaluationRequest request) {
        String answer = request.getUserAnswer() != null ? request.getUserAnswer().trim() : "";
        int wordCount = answer.isEmpty() ? 0 : answer.split("\\s+").length;

        int technicalScore;
        int clarityScore;
        int systemDesignScore;
        int edgeCaseScore;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> missingConcepts = new ArrayList<>();
        List<String> recommendedTopics = new ArrayList<>();

        if (wordCount < 15) {
            technicalScore = 32;
            clarityScore = 35;
            systemDesignScore = 25;
            edgeCaseScore = 20;
            weaknesses.add("Answer is too brief and lacks concrete architectural, code, or design depth.");
            missingConcepts.add("Algorithmic complexity, trade-off reasoning, and production failure recovery.");
        } else if (wordCount < 60) {
            technicalScore = 62;
            clarityScore = 68;
            systemDesignScore = 58;
            edgeCaseScore = 52;
            strengths.add("Understands the core premise and outlines a valid high-level approach.");
            weaknesses.add("Could elaborate further on edge cases, scaling bottlenecks, and concurrency safety.");
            missingConcepts.add("Specific performance bounds, cache eviction, and data replication guarantees.");
        } else {
            String lower = answer.toLowerCase();
            boolean mentionsComplexity = lower.contains("o(") || lower.contains("time complexity") || lower.contains("space") || lower.contains("latency") || lower.contains("throughput");
            boolean mentionsTradeoffs = lower.contains("tradeoff") || lower.contains("trade-off") || lower.contains("however") || lower.contains("balance") || lower.contains("whereas");
            boolean mentionsFailureOrEdges = lower.contains("fail") || lower.contains("error") || lower.contains("edge case") || lower.contains("timeout") || lower.contains("concurrency") || lower.contains("thread") || lower.contains("partition");
            boolean mentionsComponents = lower.contains("redis") || lower.contains("cache") || lower.contains("database") || lower.contains("queue") || lower.contains("kafka") || lower.contains("api") || lower.contains("lock") || lower.contains("index");

            technicalScore = 76 + (mentionsComplexity ? 8 : 0) + (mentionsComponents ? 8 : 0);
            clarityScore = 78 + (wordCount > 120 ? 7 : 0) + (answer.contains("\n") ? 6 : 0);
            systemDesignScore = 74 + (mentionsTradeoffs ? 12 : 0) + (mentionsComponents ? 6 : 0);
            edgeCaseScore = 72 + (mentionsFailureOrEdges ? 14 : 0);

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
                    "   - Functional: High-throughput request processing, horizontal sharding, sub-10ms P99 latency.\n" +
                    "   - Non-functional: High availability (99.99%), CAP theorem alignment (favoring AP with eventual consistency), fail-open resilience.\n\n" +
                    "2. **Core Architecture & Data Flow:**\n" +
                    "   - Ingress via Global Anycast DNS and Layer 7 Load Balancer (Envoy/Nginx).\n" +
                    "   - Partitioning via Consistent Hashing ring with virtual nodes to distribute key load uniformly.\n" +
                    "   - Multi-tier caching: Local L1 in-memory cache (Caffeine) + Distributed L2 Redis Cluster.\n" +
                    "   - Rate limiting algorithm: Token Bucket or Sliding Window Counter with atomic Redis Lua scripts.\n\n" +
                    "3. **Concurrency & Edge Cases:**\n" +
                    "   - Mutex locks and probabilistic early expiration (XFetch algorithm) to prevent cache stampedes.\n" +
                    "   - Idempotent request tokens stored in distributed lock/key-value with TTL.\n\n" +
                    "4. **Production Safeguards:**\n" +
                    "   - Circuit breakers on all external dependencies; graceful degradation to stale cached reads on timeout.";
        } else if ("CODING".equalsIgnoreCase(category)) {
            return "### Senior/Staff Engineer Model Answer:\n\n" +
                    "1. **Core Data Structure:**\n" +
                    "   - Combine a `ConcurrentHashMap<K, Node<K, V>>` for O(1) lookups with a customized Doubly Linked List for O(1) repositioning.\n\n" +
                    "2. **Concurrency Strategy:**\n" +
                    "   - Protect node pointer mutations with fine-grained segment locks or atomic CAS operations instead of coarse global synchronization.\n" +
                    "   - In `get(key)`: Update node position to the head (Most Recently Used) atomically.\n" +
                    "   - In `put(key, value)`: Update existing node or insert new node. If capacity exceeds limit, atomically prune tail node.\n\n" +
                    "3. **Complexity Analysis:**\n" +
                    "   - Time Complexity: O(1) for both read and write operations.\n" +
                    "   - Space Complexity: O(Capacity) auxiliary memory with zero memory leaks.";
        } else if ("ARCHITECTURE".equalsIgnoreCase(category)) {
            return "### Senior/Staff Engineer Model Answer:\n\n" +
                    "1. **Immediate Triage:** Acknowledge incident, verify customer impact via SLO dashboards, and enact mitigation (kill blocking queries, enable circuit breakers).\n" +
                    "2. **Zero-Downtime Expand-Contract Pattern:**\n" +
                    "   - Step 1: Add new nullable columns without table locks.\n" +
                    "   - Step 2: Deploy application code that dual-writes to both schemas.\n" +
                    "   - Step 3: Run throttled background backfill scripts in batches of 2,000 rows.\n" +
                    "   - Step 4: Switch read traffic to the new schema once backfill completes.\n" +
                    "   - Step 5: Deprecate and drop old columns in a subsequent non-peak maintenance release.";
        } else {
            return "### Senior/Staff Engineer Model Answer (STAR Method):\n\n" +
                    "1. **Situation:** Spearheaded a high-stakes migration where changing requirements and severe technical debt threatened delivery.\n" +
                    "2. **Task:** Align engineering and product stakeholders on a realistic scope without compromising architectural stability.\n" +
                    "3. **Action:** Prepared objective data-driven benchmarks, dissected requirements into P0 (critical path) and P1 (stretch) milestones, and implemented automated regression suites.\n" +
                    "4. **Result:** Delivered the core system on schedule with zero production incidents, reducing P99 latency by 45% and earning unanimous stakeholder buy-in.";
        }
    }
}
