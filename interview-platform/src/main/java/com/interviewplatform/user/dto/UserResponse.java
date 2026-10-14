package com.interviewplatform.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewplatform.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phoneNumber;
    private String profilePhoto;
    private LocalDateTime createdAt;
}
