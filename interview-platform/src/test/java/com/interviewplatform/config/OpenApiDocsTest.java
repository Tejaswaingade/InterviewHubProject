package com.interviewplatform.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OpenApiDocsTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should serve OpenAPI docs publicly with API title, version, and JWT Bearer security scheme")
    void shouldServeOpenApiDocs() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", startsWith("3.")))
                .andExpect(jsonPath("$.info.title", is("Interview Platform API")))
                .andExpect(jsonPath("$.info.version", is("1.0.0")))
                .andExpect(jsonPath("$.info.description").doesNotExist())
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.type", is("http")))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.scheme", is("bearer")))
                .andExpect(jsonPath("$.components.securitySchemes.BearerAuth.bearerFormat", is("JWT")))
                .andExpect(jsonPath("$.security[0].BearerAuth", notNullValue()))
                // Verify all 6 documented tags exist in paths
                .andExpect(jsonPath("$.paths['/api/auth/register']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/auth/login']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/users']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/users/me']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/companies']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/companies/search']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/experiences']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/experiences/all']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/rounds']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/experiences/{experienceId}/rounds']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/questions']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/rounds/{roundId}/questions']", notNullValue()));
    }

    @Test
    @DisplayName("Should allow public access to Swagger UI endpoints and hide servers box")
    void shouldAllowPublicAccessToSwaggerUi() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(".swagger-ui .version-pragma")))
                .andExpect(content().string(containsString(".swagger-ui .schemes-server-container")))
                .andExpect(content().string(containsString(".swagger-ui .response-control-media-type")))
                .andExpect(content().string(containsString(".swagger-ui section.models")));
    }
}
