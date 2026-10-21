package com.interviewplatform.ai;

import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import com.interviewplatform.ai.service.MockInterviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MockInterviewServiceTest {

    private MockInterviewService mockInterviewService;

    @BeforeEach
    void setUp() {
        mockInterviewService = new MockInterviewService();
    }

    @Test
    void testGenerateQuestions() {
        MockInterviewRequest request = MockInterviewRequest.builder()
                .role("Senior Backend Engineer")
                .domain("Distributed Systems")
                .difficulty("HARD")
                .build();

        List<MockInterviewQuestion> questions = mockInterviewService.generateQuestions(request);

        assertThat(questions).isNotNull();
        assertThat(questions).hasSize(4);
        assertThat(questions.get(0).getCategory()).isEqualTo("SYSTEM_DESIGN");
        assertThat(questions.get(0).getHints()).isNotEmpty();
        assertThat(questions.get(0).getExpectedKeyPoints()).isNotEmpty();
    }

    @Test
    void testEvaluateAnswerBrief() {
        EvaluationRequest request = EvaluationRequest.builder()
                .question("Design a rate limiter")
                .category("SYSTEM_DESIGN")
                .userAnswer("I will use redis to rate limit.")
                .role("Backend Engineer")
                .build();

        EvaluationResponse response = mockInterviewService.evaluateAnswer(request);

        assertThat(response).isNotNull();
        assertThat(response.getOverallScore()).isLessThan(50);
        assertThat(response.getWeaknesses()).isNotEmpty();
        assertThat(response.getModelAnswer()).isNotBlank();
    }

    @Test
    void testEvaluateAnswerComprehensive() {
        EvaluationRequest request = EvaluationRequest.builder()
                .question("Design a rate limiter")
                .category("SYSTEM_DESIGN")
                .userAnswer("To build a high-throughput distributed rate limiter with O(1) latency, we will implement a Sliding Window Counter algorithm using Redis and atomic Lua scripts. " +
                        "We can use local in-memory caching with Caffeine for fast-path rejection to reduce Redis load. " +
                        "However, there is a trade-off between strict global accuracy and cross-region latency. " +
                        "For fault tolerance and edge cases, we implement a circuit breaker: if Redis times out or fails, we fail-open to avoid service disruption, while alerting the on-call engineer. " +
                        "We shard Redis keys by tenant and timestamp window to avoid hot-key contention and manage memory bounds.")
                .role("Senior Backend Engineer")
                .build();

        EvaluationResponse response = mockInterviewService.evaluateAnswer(request);

        assertThat(response).isNotNull();
        assertThat(response.getOverallScore()).isGreaterThanOrEqualTo(75);
        assertThat(response.getStrengths()).isNotEmpty();
        assertThat(response.getVerdict()).isIn("HIRE", "STRONG_HIRE");
        assertThat(response.getModelAnswer()).contains("Sliding Window Counter");
    }
}
