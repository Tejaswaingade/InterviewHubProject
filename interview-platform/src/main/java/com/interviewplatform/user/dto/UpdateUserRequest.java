package com.interviewplatform.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    @Pattern(regexp = "^$|^\\+?[0-9\\s\\-()]{7,20}$", message = "Phone number must be a valid format (7-20 digits)")
    @Schema(description = "Mobile/Phone number of the candidate", example = "+91 9876543210")
    private String phoneNumber;

    @Schema(description = "Base64 data URI or image URL for profile photo", example = "data:image/png;base64,...")
    private String profilePhoto;
}
