package com.interviewplatform.company.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatchCompanyRequest {

    @Schema(description = "Company name (optional)", example = "Google")
    private String name;

    @Schema(description = "Company logo URL (optional)", example = "https://example.com/logo.png")
    private String logo;

    @Pattern(
            regexp = "^$|^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z0-9-]+(:[0-9]+)?(/.*)?$",
            message = "Invalid website URL format"
    )
    @Schema(description = "Company website URL (optional)", example = "https://www.google.com")
    private String website;

    @Schema(description = "Company description (optional)", example = "Multinational technology company")
    private String description;
}
