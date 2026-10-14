package com.interviewplatform.user.controller;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.config.OpenApiConfig;
import com.interviewplatform.user.dto.PatchUserRequest;
import com.interviewplatform.user.dto.UpdateUserRequest;
import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "User APIs", description = "Endpoints for user profile and account details")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(
            summary = "Get current user profile",
            description = "Retrieves profile information for the currently authenticated user based on the JWT token."
    )
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        UserResponse response = userService.getUserByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get user by ID",
            description = "Retrieves user details by their unique user ID."
    )
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "Unique ID of the user", example = "1", required = true)
            @PathVariable Long id
    ) {
        UserResponse response = userService.getUserById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update user profile",
            description = "Updates user profile information. Only the user or an ADMIN can perform this action."
    )
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @Parameter(description = "Unique ID of the user", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        UserResponse response = userService.updateUser(id, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }

    @PatchMapping("/{id}")
    @Operation(
            summary = "Partially update user profile",
            description = "Partially updates user profile information (only provided non-null fields are updated). Only the user or an ADMIN can perform this action."
    )
    public ResponseEntity<ApiResponse<UserResponse>> patchUser(
            @Parameter(description = "Unique ID of the user", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody PatchUserRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        UserResponse response = userService.patchUser(id, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("User partially updated successfully", response));
    }

    @PutMapping("/{id}/photo")
    @Operation(
            summary = "Update user profile photo",
            description = "Updates the candidate's profile photo and persists it directly in the database."
    )
    public ResponseEntity<ApiResponse<UserResponse>> updateProfilePhoto(
            @Parameter(description = "Unique ID of the user", example = "1", required = true)
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        String photo = body != null ? body.get("profilePhoto") : null;
        UserResponse response = userService.updateProfilePhoto(id, photo, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Profile photo updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete user account",
            description = "Permanently removes a candidate user account from the platform. Restricted to administrators."
    )
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @Parameter(description = "Unique ID of the user to delete", example = "1", required = true)
            @PathVariable Long id,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        userService.deleteUser(id, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("User account deleted successfully"));
    }

    @GetMapping
    @Operation(
            summary = "List all users",
            description = "Retrieves a list of all registered users."
    )
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }
}
