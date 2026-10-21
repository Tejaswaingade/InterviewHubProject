package com.interviewplatform.ai.service;

import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MockInterviewService {

    public List<MockInterviewQuestion> generateQuestions(MockInterviewRequest request) {
        String role = (request.getRole() != null && !request.getRole().isBlank()) ? request.getRole() : "Software Engineer";
        String domain = (request.getDomain() != null && !request.getDomain().isBlank()) ? request.getDomain() : "Full-Stack";
        String difficulty = (request.getDifficulty() != null && !request.getDifficulty().isBlank()) ? request.getDifficulty() : "MEDIUM";

        List<MockInterviewQuestion> questions = new ArrayList<>();

        // Question 1: System Design / Scalability
        questions.add(MockInterviewQuestion.builder()
                .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                .category("SYSTEM_DESIGN")
                .difficulty(difficulty)
                .timeLimitSeconds(600)
                .question(String.format("Design a distributed, low-latency rate limiter for a multi-tenant %s platform serving 100,000 requests/sec. How do you handle clock drift, bursty traffic, and cross-datacenter synchronization?", role))
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

        // Question 2: Data Structures & Core Logic
        questions.add(MockInterviewQuestion.builder()
                .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                .category("CODING")
                .difficulty(difficulty)
                .timeLimitSeconds(900)
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

        // Question 3: Architecture & Reliability
        questions.add(MockInterviewQuestion.builder()
                .id("q-" + UUID.randomUUID().toString().substring(0, 8))
                .category("ARCHITECTURE")
                .difficulty(difficulty)
                .timeLimitSeconds(600)
                .question(String.format("A critical database migration in production locks tables and causes cascading timeouts during peak traffic. Walk me through your step-by-step incident response, zero-downtime schema evolution strategy, and rollback plan.", role))
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

        // Question 4: Behavioral & Engineering Leadership
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
