package com.interviewplatform.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
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

    @Pattern(regexp = "^$|^\\+?[0-9\\s\\-()]{7,20}$", message = "Phone number must be a valid format (7-20 digits)")
    @Schema(description = "Mobile/Phone number of the candidate (optional)", example = "+91 9876543210")
    private String phoneNumber;

    @Schema(description = "Base64 data URI or image URL for profile photo (optional)", example = "data:image/png;base64,...")
    private String profilePhoto;
}
