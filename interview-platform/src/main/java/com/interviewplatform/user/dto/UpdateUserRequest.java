package com.interviewplatform.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @NotBlank(message = "Name cannot be blank")
    @Schema(description = "Updated full name of the user", example = "John Doe Updated")
    private String name;

    @Schema(description = "Mobile/Phone number of the candidate", example = "+91 9876543210")
    private String phoneNumber;

    @Schema(description = "Base64 data URI or image URL for profile photo", example = "data:image/png;base64,...")
    private String profilePhoto;
}
