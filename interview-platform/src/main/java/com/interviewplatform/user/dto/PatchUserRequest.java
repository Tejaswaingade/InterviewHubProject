package com.interviewplatform.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for partially updating a user profile")
public class PatchUserRequest {

    @Schema(description = "Updated full name of the user (optional)", example = "John Doe Updated")
    private String name;

    @Email(message = "Invalid email format")
    @Schema(description = "Updated email of the user (optional)", example = "john.updated@example.com")
    private String email;

    @Schema(description = "Base64 data URI or image URL for profile photo (optional)", example = "data:image/png;base64,...")
    private String profilePhoto;
}
