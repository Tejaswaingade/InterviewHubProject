package com.interviewplatform.ai.service;

import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MockInterviewService {

    private static final Random RANDOM = new Random();

    public List<MockInterviewQuestion> generateQuestions(MockInterviewRequest request) {
        String role = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole().trim() : "Software Engineer";
        String domain = (request.getDomain() != null && !request.getDomain().isBlank()) ? request.getDomain().trim() : "Distributed Systems";
        String difficulty = (request.getDifficulty() != null && !request.getDifficulty().isBlank()) ? request.getDifficulty().trim().toUpperCase() : "MEDIUM";
        String focus = (request.getResumeSnippet() != null && !request.getResumeSnippet().isBlank()) ? request.getResumeSnippet().trim() : "";

        // Scale factor & TPS based on difficulty
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

        List<MockInterviewQuestion> questions = new ArrayList<>();
        boolean isFrontend = role.toLowerCase().contains("front") || domain.toLowerCase().contains("react") || domain.toLowerCase().contains("web");
        boolean isDevOps = role.toLowerCase().contains("devops") || role.toLowerCase().contains("cloud") || domain.toLowerCase().contains("kubernetes");
        boolean isStaff = role.toLowerCase().contains("staff") || role.toLowerCase().contains("architect") || difficulty.contains("STAFF") || difficulty.contains("HARD");

        // -------------------------------------------------------------
        // Round 1: SYSTEM DESIGN / SCALABILITY (Role & Domain Adaptive)
        // -------------------------------------------------------------
        int sysDesignVariant = RANDOM.nextInt(3);
        if (isFrontend) {
            if (sysDesignVariant == 0) {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("SYSTEM_DESIGN")
                        .difficulty(difficulty)
                        .timeLimitSeconds(systemDesignSeconds)
                        .question(String.format("Design a high-performance web dashboard for %s capable of streaming real-time metrics at %s with zero UI stutter (60 FPS) and offline local synchronization. How do you handle DOM virtualization, WebSocket backpressure, and state rehydration%s?", role, tpsScale, focus.isEmpty() ? "" : " with focus on " + focus))
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
            } else {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("SYSTEM_DESIGN")
                        .difficulty(difficulty)
                        .timeLimitSeconds(systemDesignSeconds)
                        .question(String.format("Architect a scalable Micro-Frontend platform for %s utilizing Module Federation. How do you manage shared dependencies, isolated state management, cross-app routing, and atomic independent deployments?", role))
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
            }
        } else if (isDevOps) {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("SYSTEM_DESIGN")
                    .difficulty(difficulty)
                    .timeLimitSeconds(systemDesignSeconds)
                    .question(String.format("Design a multi-region, zero-downtime Kubernetes infrastructure supporting %s handling %s. How do you structure automated blue-green/canary rollouts, cross-region traffic balancing, and instant automated rollback on 5xx metric spikes?", role, tpsScale))
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
        } else {
            // Backend & General Systems
            if (sysDesignVariant == 0) {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("SYSTEM_DESIGN")
                        .difficulty(difficulty)
                        .timeLimitSeconds(systemDesignSeconds)
                        .question(String.format("Design a distributed, low-latency rate limiter for a multi-tenant %s platform serving %s. How do you handle clock drift, bursty traffic, and cross-datacenter synchronization%s?", role, tpsScale, focus.isEmpty() ? "" : " with special attention to " + focus))
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
            } else if (sysDesignVariant == 1) {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("SYSTEM_DESIGN")
                        .difficulty(difficulty)
                        .timeLimitSeconds(systemDesignSeconds)
                        .question(String.format("Design a distributed, fault-tolerant Event Streaming and Notification Fan-out system for %s handling %s. How do you ensure exactly-once delivery semantics, handle poison pill messages, and prevent consumer group starvation?", role, tpsScale))
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
            } else {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("SYSTEM_DESIGN")
                        .difficulty(difficulty)
                        .timeLimitSeconds(systemDesignSeconds)
                        .question(String.format("Design a global Distributed Caching layer for %s supporting %s with sub-5ms P99 read latency. How do you prevent cache stampedes, manage multi-region cache invalidation, and ensure consistency during backend database updates?", role, tpsScale))
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
            }
        }

        // -------------------------------------------------------------
        // Round 2: DATA STRUCTURES & CORE LOGIC (Coding & Concurrency)
        // -------------------------------------------------------------
        int codingVariant = RANDOM.nextInt(2);
        if (isFrontend) {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
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
        } else {
            if (codingVariant == 0) {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                        .category("CODING")
                        .difficulty(difficulty)
                        .timeLimitSeconds(codingSeconds)
                        .question(String.format("Explain how you would implement a concurrent LRU Cache with O(1) get/put operations and thread-safe eviction in your primary tech stack for %s.", role))
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
            } else {
                questions.add(MockInterviewQuestion.builder()
                        .id("q-" + UUID.randomUUID().toString().substring(0, 8))
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
            }
        }

        // -------------------------------------------------------------
        // Round 3: ARCHITECTURE & PRODUCTION RELIABILITY
        // -------------------------------------------------------------
        int archVariant = RANDOM.nextInt(2);
        if (archVariant == 0 || isStaff) {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
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
        } else {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
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
        }

        // -------------------------------------------------------------
        // Round 4: BEHAVIORAL & ENGINEERING LEADERSHIP (STAR Method)
        // -------------------------------------------------------------
        int behavVariant = RANDOM.nextInt(2);
        if (behavVariant == 0) {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("BEHAVIORAL")
                    .difficulty(difficulty)
                    .timeLimitSeconds(480)
                    .question("Describe a time when you strongly disagreed with a technical design or architectural decision proposed by a Staff Engineer or Product Manager. How did you validate your hypothesis, influence the team, and what was the outcome?")
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
        } else {
            questions.add(MockInterviewQuestion.builder()
                    .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                    .category("BEHAVIORAL")
                    .difficulty(difficulty)
                    .timeLimitSeconds(480)
                    .question("Tell me about a high-severity production incident you spearheaded. What was the blast radius, how did you lead the team under intense time pressure to diagnose root cause, and what architectural safeguards did you implement to prevent regression?")
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
        }

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
