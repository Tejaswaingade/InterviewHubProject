package com.interviewplatform.user;

import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import com.interviewplatform.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User sampleUser1;
    private User sampleUser2;

    @BeforeEach
    void setUp() {
        sampleUser1 = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .password("hashed_pass_1")
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        sampleUser2 = User.builder()
                .id(2L)
                .name("Bob Admin")
                .email("bob@example.com")
                .password("hashed_pass_2")
                .role(Role.ADMIN)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GetUserById - User Exists: Returns Optional containing UserResponse")
    void getUserById_exists() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));

        Optional<UserResponse> result = userService.getUserById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
        assertThat(result.get().getName()).isEqualTo("Alice");
        assertThat(result.get().getEmail()).isEqualTo("alice@example.com");
        assertThat(result.get().getRole()).isEqualTo(Role.USER);
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("GetUserById - User Does Not Exist: Returns Optional.empty()")
    void getUserById_notExists() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<UserResponse> result = userService.getUserById(999L);

        assertThat(result).isEmpty();
        verify(userRepository).findById(999L);
    }

    @Test
    @DisplayName("GetUserByEmail - User Exists: Returns Optional containing UserResponse")
    void getUserByEmail_exists() {
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(sampleUser1));

        Optional<UserResponse> result = userService.getUserByEmail("alice@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Alice");
        assertThat(result.get().getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("GetUserByEmail - User Does Not Exist: Returns Optional.empty()")
    void getUserByEmail_notExists() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        Optional<UserResponse> result = userService.getUserByEmail("nonexistent@example.com");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("GetAllUsers - Returns mapped list of all users")
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser1, sampleUser2));

        List<UserResponse> users = userService.getAllUsers();

        assertThat(users).hasSize(2);
        assertThat(users.get(0).getName()).isEqualTo("Alice");
        assertThat(users.get(1).getName()).isEqualTo("Bob Admin");
        assertThat(users.get(1).getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    @DisplayName("ExistsByEmail - True when repository returns true")
    void existsByEmail_returnsTrue() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThat(userService.existsByEmail("alice@example.com")).isTrue();
    }

    @Test
    @DisplayName("ExistsByEmail - False when repository returns false")
    void existsByEmail_returnsFalse() {
        when(userRepository.existsByEmail("nobody@example.com")).thenReturn(false);

        assertThat(userService.existsByEmail("nobody@example.com")).isFalse();
    }

    @Test
    @DisplayName("UpdateUser - Owner Success: Updates user profile")
    void updateUser_ownerSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(sampleUser1));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.interviewplatform.user.dto.UpdateUserRequest request = com.interviewplatform.user.dto.UpdateUserRequest.builder()
                .name("Alice Updated")
                .build();

        UserResponse response = userService.updateUser(1L, request, "alice@example.com", false);

        assertThat(response.getName()).isEqualTo("Alice Updated");
        verify(userRepository).save(sampleUser1);
    }

    @Test
    @DisplayName("UpdateUser - Admin Success: Admin updates another user")
    void updateUser_adminSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(sampleUser2));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.interviewplatform.user.dto.UpdateUserRequest request = com.interviewplatform.user.dto.UpdateUserRequest.builder()
                .name("Alice Renamed By Admin")
                .build();

        UserResponse response = userService.updateUser(1L, request, "bob@example.com", true);

        assertThat(response.getName()).isEqualTo("Alice Renamed By Admin");
        verify(userRepository).save(sampleUser1);
    }

    @Test
    @DisplayName("UpdateUser - Unauthorized: Another user cannot update profile")
    void updateUser_unauthorized() {
        User otherUser = User.builder().id(3L).email("other@example.com").role(Role.USER).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser1));
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));

        com.interviewplatform.user.dto.UpdateUserRequest request = com.interviewplatform.user.dto.UpdateUserRequest.builder()
                .name("Hacked Name")
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(com.interviewplatform.common.exception.UnauthorizedException.class, () ->
                userService.updateUser(1L, request, "other@example.com", false));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("UpdateUser - User Not Found: Throws ResourceNotFoundException")
    void updateUser_notFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        com.interviewplatform.user.dto.UpdateUserRequest request = com.interviewplatform.user.dto.UpdateUserRequest.builder()
                .name("Ghost")
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(com.interviewplatform.common.exception.ResourceNotFoundException.class, () ->
                userService.updateUser(999L, request, "alice@example.com", false));
    }
}
