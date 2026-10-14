package com.interviewplatform.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for creating a company")
public class CreateCompanyRequest {

    @NotBlank(message = "Company name is required")
    @Schema(description = "Name of the company", example = "Google")
    private String name;

    @Schema(description = "Company logo URL", example = "https://example.com/logo.png")
    private String logo;

    @Pattern(
            regexp = "^$|^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z0-9-]+(:[0-9]+)?(/.*)?$",
            message = "Invalid website URL format"
    )
    @Schema(description = "Company website URL", example = "https://careers.google.com")
    private String website;

    @Schema(description = "Company description", example = "Multinational technology company specializing in online services.")
    private String description;
}
