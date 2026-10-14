package com.interviewplatform.company.dto;

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
public class UpdateCompanyRequest {

    @NotBlank(message = "Company name is required")
    private String name;

    private String logo;

    @Pattern(
            regexp = "^$|^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z0-9-]+(:[0-9]+)?(/.*)?$",
            message = "Invalid website URL format"
    )
    private String website;

    private String description;
}
