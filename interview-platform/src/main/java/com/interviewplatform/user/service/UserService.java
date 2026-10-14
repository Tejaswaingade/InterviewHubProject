package com.interviewplatform.user.service;

import com.interviewplatform.common.exception.DuplicateResourceException;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.common.exception.UnauthorizedException;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.user.dto.PatchUserRequest;
import com.interviewplatform.user.dto.UpdateUserRequest;
import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final InterviewExperienceRepository experienceRepository;

    public UserService(UserRepository userRepository, InterviewExperienceRepository experienceRepository) {
        this.userRepository = userRepository;
        this.experienceRepository = experienceRepository;
    }

    public Optional<UserResponse> getUserById(Long id) {
        return userRepository.findById(id).map(this::mapToResponse);
    }

    public Optional<UserResponse> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::mapToResponse);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, String currentUserEmail, boolean isAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));

        if (!user.getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to update this profile");
        }

        user.setName(request.getName());
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }
        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }
        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    @Transactional
    public UserResponse patchUser(Long id, PatchUserRequest request, String currentUserEmail, boolean isAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));

        if (!user.getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to update this profile");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String trimmedEmail = request.getEmail().trim().toLowerCase();
            if (!trimmedEmail.equalsIgnoreCase(user.getEmail())) {
                if (userRepository.existsByEmail(trimmedEmail)) {
                    throw new DuplicateResourceException("Email is already in use: " + trimmedEmail);
                }
                user.setEmail(trimmedEmail);
            }
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }

        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto().isBlank() ? null : request.getProfilePhoto().trim());
        }

        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    @Transactional
    public UserResponse updateProfilePhoto(Long id, String profilePhoto, String currentUserEmail, boolean isAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));

        if (!user.getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to update this profile photo");
        }

        user.setProfilePhoto(profilePhoto != null && !profilePhoto.isBlank() ? profilePhoto.trim() : null);
        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteUser(Long id, String currentUserEmail, boolean isAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!isAdmin) {
            throw new UnauthorizedException("Only administrators can delete user accounts");
        }

        if (currentUserEmail != null && user.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new IllegalArgumentException("You cannot delete your own active administrator account");
        }

        // Clean up any interview experiences belonging to this user
        List<InterviewExperience> userExperiences = experienceRepository.findByUserId(id);
        if (userExperiences != null && !userExperiences.isEmpty()) {
            experienceRepository.deleteAll(userExperiences);
        }

        userRepository.delete(user);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .profilePhoto(user.getProfilePhoto())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
