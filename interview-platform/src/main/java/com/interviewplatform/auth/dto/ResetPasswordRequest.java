package com.interviewplatform.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request body to verify reset code and set a new password")
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "User's registered email address", example = "interviewhub21@gmail.com")
    private String email;

    @NotBlank(message = "Reset code is required")
    @Schema(description = "6-digit OTP code received in email", example = "482910")
    private String resetToken;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Schema(description = "New password", example = "MyNewPassword123")
    private String newPassword;
}