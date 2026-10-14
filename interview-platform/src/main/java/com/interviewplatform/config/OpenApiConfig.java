package com.interviewplatform.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import jakarta.servlet.http.HttpServletRequest;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerIndexTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Configuration
public class OpenApiConfig {

    public static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI interviewPlatformOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Interview Platform API")
                        .version("1.0.0")
                )
                .servers(Collections.emptyList())
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token (e.g., Bearer <token> or <token>)")));
    }

    @Bean
    public OpenApiCustomizer removeServersCustomizer() {
        return openApi -> openApi.setServers(Collections.emptyList());
    }

    @Bean
    @Primary
    public SwaggerIndexTransformer customSwaggerIndexTransformer(
            SwaggerUiConfigProperties swaggerUiConfig,
            SwaggerUiOAuthProperties swaggerUiOAuthProperties,
            SwaggerWelcomeCommon swaggerWelcomeCommon,
            ObjectMapperProvider objectMapperProvider
    ) {
        return new SwaggerIndexPageTransformer(swaggerUiConfig, swaggerUiOAuthProperties, swaggerWelcomeCommon, objectMapperProvider) {
            @Override
            public Resource transform(HttpServletRequest request, Resource resource, ResourceTransformerChain transformerChain) throws IOException {
                Resource transformed = super.transform(request, resource, transformerChain);
                String html = new String(transformed.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                String customCss = "<style>"
                        + ".swagger-ui .info .title small.version-stamp, .swagger-ui .info small.version-stamp, .swagger-ui .info .version, .swagger-ui .version-pragma, .swagger-ui .version-pragma__message { display: none !important; } "
                        + ".swagger-ui .schemes-server-container, .swagger-ui .servers, .swagger-ui .servers-title, .swagger-ui .servers-wrapper, .swagger-ui .servers-container, .swagger-ui .schemes > .servers { display: none !important; } "
                        + ".swagger-ui .scheme-container .schemes { display: flex !important; justify-content: flex-end !important; } "
                        + ".swagger-ui .response-control-media-type, .swagger-ui .body-param-options label:has(select) { display: none !important; } "
                        + ".swagger-ui section.models { display: none !important; } "
                        + ".swagger-ui .tab li:last-of-type, .swagger-ui .tab li:first-of-type:after { display: none !important; } "
                        + ".swagger-ui .responses-inner:has(.live-responses-table) .responses-table:not(.live-responses-table), .swagger-ui .responses-inner:has(.live-responses-table) > div > h4:last-child, .swagger-ui .opblock-body:has(.live-responses-table) .responses-inner > .responses-table:not(.live-responses-table), .swagger-ui .opblock-body:has(.live-responses-table) .responses-inner > div > h4:last-child, .swagger-ui .opblock-body:has(.live-responses-table) .responses-inner > .responses-table, .swagger-ui .opblock-body:has(.live-responses-table) .responses-inner > h4 { display: none !important; } "
                        + "</style>";
                html = html.replace("</head>", customCss + "</head>");
                return new TransformedResource(transformed, html.getBytes(StandardCharsets.UTF_8));
            }
        };
    }
}
