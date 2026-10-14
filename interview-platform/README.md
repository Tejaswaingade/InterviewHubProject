# Interview Platform - Backend API

A production-ready Spring Boot backend for an Interview Experience sharing platform. The application allows candidates and professionals to share, discover, and search real-world interview experiences, interview rounds, and interview questions across various top companies.

---

## 1. Project Description

The Interview Platform is designed to help job seekers prepare effectively for technical and behavioral interviews. Users can browse interview experiences by company, role, difficulty, and keywords, or contribute their own interview journeys, rounds (e.g. Online Assessment, Technical, System Design, HR), and detailed questions.

### Core Features
- **Authentication & Security**: Stateless JWT-based authentication with BCrypt password hashing, role-based authorization (USER / ADMIN), and strict ownership checks.
- **Interview Experience Management**: Full CRUD for interview experiences with difficulty levels (`EASY`, `MEDIUM`, `HARD`), statuses (`SELECTED`, `REJECTED`, `WAITING`, `WITHDRAWN`, `UNKNOWN`), and years of experience.
- **Round & Question Breakdown**: Hierarchical structure where each experience contains ordered rounds, and each round contains typed questions (DSA, System Design, Spring Boot, Java, etc.) with answers.
- **Search & Filtering Engine**: JPA Criteria API / Specification-based dynamic search supporting company filtering, difficulty filtering, role matching, case-insensitive keyword search, and pagination.
- **Clean Architecture & Centralized Error Handling**: Standardized JSON responses (`ApiResponse<T>` and `PagedResponse<T>`) and exception handling without leaking stack traces.
- **DevOps & Container Ready**: Multi-stage Docker build, health check monitoring via Spring Boot Actuator, and automated PostgreSQL orchestration with Docker Compose.

---

## 2. Architecture

The application follows a clean, layered architectural pattern:

```
                  ┌───────────────────────────────┐
                  │    Client (React / Swagger)   │
                  └───────────────┬───────────────┘
                                  │ HTTP / JSON (JWT)
                                  ▼
                  ┌───────────────────────────────┐
                  │          Controllers          │  (REST Endpoints, Thin, Validation)
                  └───────────────┬───────────────┘
                                  │ Constructor Injection
                                  ▼
                  ┌───────────────────────────────┐
                  │           Services            │  (Business Logic, Ownership, Auth Checks)
                  └───────────────┬───────────────┘
                                  │ DTO Mapping / Transactions
                                  ▼
                  ┌───────────────────────────────┐
                  │         Repositories          │  (Spring Data JPA & Specifications)
                  └───────────────┬───────────────┘
                                  │ SQL / Hibernate ORM
                                  ▼
                  ┌───────────────────────────────┐
                  │      PostgreSQL Database      │  (Relational Tables with Foreign Keys & Indexes)
                  └───────────────────────────────┘
```

- **Controllers**: Thin presentation layer handling input validation (`@Valid`), HTTP status codes, and delegating immediately to services.
- **Services**: Encapsulate all business logic, authorization rules, ownership validations, transactions, and entity-to-DTO conversions.
- **Repositories**: Standard Spring Data JPA interfaces and JPA Specification executors for database interactions.
- **Database**: PostgreSQL with indexed foreign keys and query columns for performance.

---

## 3. Technologies Used

- **Language & Runtime**: Java 21 LTS
- **Framework**: Spring Boot 3.4.3
- **Security**: Spring Security 6 (Stateless JWT Authentication, BCrypt)
- **Persistence**: Spring Data JPA & Hibernate 6
- **Database**: PostgreSQL 16 (H2 Database in memory for automated tests)
- **Documentation**: Springdoc OpenAPI / Swagger UI 2.8.5
- **Monitoring**: Spring Boot Actuator (Health & Metrics)
- **Utilities**: Project Lombok
- **Testing**: JUnit 5, Mockito, Spring Boot Test, MockMvc
- **Containerization**: Docker (Multi-stage Temurin JRE 21), Docker Compose

---

## 4. Folder Structure

```text
interview-platform/
├── .mvn/                               # Maven wrapper configuration
├── src/
│   ├── main/
│   │   ├── java/com/interviewplatform/
│   │   │   ├── InterviewPlatformApplication.java   # Spring Boot entrypoint
│   │   │   ├── auth/                               # Authentication & Registration
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── dto/                            # Auth DTOs (Login, Register, AuthResponse)
│   │   │   │   └── service/AuthService.java
│   │   │   ├── common/                             # Shared response wrappers and exceptions
│   │   │   │   ├── exception/                      # ResourceNotFound, BadRequest, Unauthorized
│   │   │   │   └── response/                       # ApiResponse<T>, PagedResponse<T>
│   │   │   ├── company/                            # Company management
│   │   │   │   ├── controller/CompanyController.java
│   │   │   │   ├── dto/                            # Company DTOs
│   │   │   │   ├── entity/Company.java
│   │   │   │   ├── repository/CompanyRepository.java
│   │   │   │   └── service/CompanyService.java
│   │   │   ├── config/                             # OpenAPI & Swagger configuration
│   │   │   ├── exception/                          # Centralized @RestControllerAdvice handler
│   │   │   ├── experience/                         # Interview experiences
│   │   │   │   ├── controller/InterviewExperienceController.java
│   │   │   │   ├── dto/                            # Experience DTOs
│   │   │   │   ├── entity/                         # InterviewExperience, Difficulty, ResultStatus
│   │   │   │   ├── repository/InterviewExperienceRepository.java
│   │   │   │   ├── service/InterviewExperienceService.java
│   │   │   │   └── specification/ExperienceSpecification.java
│   │   │   ├── question/                           # Interview questions
│   │   │   │   ├── controller/QuestionController.java
│   │   │   │   ├── dto/                            # Question DTOs
│   │   │   │   ├── entity/                         # Question, QuestionType
│   │   │   │   ├── repository/QuestionRepository.java
│   │   │   │   └── service/QuestionService.java
│   │   │   ├── round/                              # Interview rounds
│   │   │   │   ├── controller/InterviewRoundController.java
│   │   │   │   ├── dto/                            # Round DTOs
│   │   │   │   ├── entity/InterviewRound.java
│   │   │   │   ├── repository/InterviewRoundRepository.java
│   │   │   │   └── service/InterviewRoundService.java
│   │   │   ├── security/                           # Spring Security & JWT setup
│   │   │   │   ├── CustomUserDetailsService.java
│   │   │   │   ├── SecurityConfig.java             # CORS, CSRF, Route RBAC
│   │   │   │   └── jwt/                            # JwtService, JwtAuthenticationFilter
│   │   │   └── user/                               # User entity & profile management
│   │   │       ├── controller/UserController.java
│   │   │       ├── dto/                            # UserResponse, UpdateUserRequest
│   │   │       ├── entity/User.java, Role.java
│   │   │       ├── repository/UserRepository.java
│   │   │       └── service/UserService.java
│   │   └── resources/
│   │       ├── application.yml                     # Base configuration & active profile
│   │       ├── application-dev.yml                 # Local development profile (verbose SQL)
│   │       ├── application-prod.yml                # Production profile (quiet SQL, env vars)
│   │       └── static/custom-swagger.css           # Swagger UI styles
│   └── test/                                       # 160+ Unit & Integration tests
├── .dockerignore
├── .env.example                                    # Production environment variables template
├── docker-compose.yml                              # PostgreSQL & Backend multi-container setup
├── Dockerfile                                      # Multi-stage production build
├── mvnw / mvnw.cmd                                 # Maven wrapper scripts
├── pom.xml                                         # Maven dependencies and build plugins
└── README.md                                       # Comprehensive project documentation
```

---

## 5. Database Setup & Schema

### PostgreSQL Installation & Setup
Create a PostgreSQL database named `interview_app`:

```sql
CREATE DATABASE interview_app;
```

### Database Tables & Relationships
1. **`users`**
   - Columns: `id` (PK), `email` (UNIQUE), `name`, `password` (BCrypt), `role` (`USER` / `ADMIN`), `created_at`, `updated_at`.
2. **`companies`**
   - Columns: `id` (PK), `name` (UNIQUE), `logo`, `website`, `description`, `created_at`, `updated_at`.
3. **`interview_experiences`**
   - Columns: `id` (PK), `user_id` (FK -> `users`), `company_id` (FK -> `companies`), `job_role`, `experience_title`, `description`, `overall_difficulty` (`EASY`, `MEDIUM`, `HARD`), `result` (`SELECTED`, `REJECTED`, `WAITING`, `WITHDRAWN`, `UNKNOWN`), `years_of_experience`, `created_at`, `updated_at`.
   - **Indexes**: `user_id`, `company_id`, `overall_difficulty`, `created_at`.
4. **`interview_rounds`**
   - Columns: `id` (PK), `experience_id` (FK -> `interview_experiences`), `round_name`, `round_number`, `created_at`, `updated_at`.
   - **Indexes**: `experience_id`.
5. **`questions`**
   - Columns: `id` (PK), `round_id` (FK -> `interview_rounds`), `question_text`, `question_type` (`DSA`, `JAVA`, `SPRING_BOOT`, `DATABASE`, `SYSTEM_DESIGN`, `HR`, `BEHAVIORAL`, `OTHER`), `difficulty` (`EASY`, `MEDIUM`, `HARD`), `topic`, `answer`, `created_at`, `updated_at`.
   - **Indexes**: `round_id`, `difficulty`.

---

## 6. Environment Variables

| Variable | Description | Default (Local Dev) | Production Note |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active Spring configuration profile | `dev` | Set to `prod` |
| `DB_HOST` | Database host name or container service name | `localhost` | In Docker Compose: `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` | Typically `5432` |
| `DB_NAME` | Database catalog name | `interview_app` | Production DB name |
| `DB_USERNAME` | Database username | `postgres` | Production DB user |
| `DB_PASSWORD` | Database password | `tejas@2707` | Strong password (required in prod) |
| `JWT_SECRET` | 256-bit Secret key for signing JWTs | Default dev key | Must provide secure key in prod |
| `JWT_EXPIRATION` | JWT token lifetime in milliseconds | `86400000` (24h) | Optional override |

---

## 7. Commands to Run Locally

### Prerequisites
- JDK 21 installed
- PostgreSQL 14+ running locally on port 5432

### Steps
1. Clone the repository and navigate into directory:
   ```bash
   cd interview-platform
   ```
2. Execute all tests:
   ```bash
   ./mvnw clean test
   # On Windows PowerShell:
   .\mvnw.cmd clean test
   ```
3. Run the Spring Boot application locally:
   ```bash
   ./mvnw spring-boot:run
   # On Windows PowerShell:
   .\mvnw.cmd spring-boot:run
   ```
4. Access the application at `http://localhost:8080`.

---

## 8. Commands to Run with Docker

1. Copy `.env.example` to `.env` and configure your credentials:
   ```bash
   cp .env.example .env
   ```
2. Start both the PostgreSQL database and the Spring Boot backend:
   ```bash
   docker compose up -d --build
   ```
   *The backend will automatically wait for PostgreSQL to pass its health check (`pg_isready`) before starting.*
3. View logs:
   ```bash
   docker compose logs -f backend
   ```
4. Stop containers:
   ```bash
   docker compose down
   ```

---

## 9. API Documentation

*All API routes strictly use the canonical `/api/...` prefix with no `/v1`.*

### Authentication APIs (`/api/auth`)
- `POST /api/auth/register` - Register a new user (`name`, `email`, `password`). Returns created user profile.
- `POST /api/auth/login` - Authenticate user (`email`, `password`). Returns signed JWT access token.
- `GET /api/auth/me` - Get profile of the currently authenticated user (Bearer token required).

### User APIs (`/api/users`)
- `GET /api/users` - List all registered users (Authenticated).
- `GET /api/users/{id}` - Get user details by ID (Authenticated).
- `PUT /api/users/{id}` - Update user profile name. Restricted to the user themselves or ADMIN.
- `GET /api/users/me` - Get current user profile (Authenticated).

### Company APIs (`/api/companies`)
- `GET /api/companies` - List all registered companies (Authenticated).
- `GET /api/companies/{id}` - Get company details by ID (Authenticated).
- `GET /api/companies/search?search=Google` - Search companies by name (Authenticated).
- `POST /api/companies` - Create a new company (Requires `ROLE_ADMIN`).
- `PUT /api/companies/{id}` - Update company details (Requires `ROLE_ADMIN`).
- `DELETE /api/companies/{id}` - Delete company (Requires `ROLE_ADMIN`).

### Experience APIs (`/api/experiences`)
- `POST /api/experiences` - Create an interview experience for authenticated user.
- `GET /api/experiences` - List experiences with optional filters (`companyId`, `difficulty`, `jobRole`) and pagination (`page`, `size`, `sort`).
- `GET /api/experiences/search?keyword=Spring` - Search experiences matching title or description.
- `GET /api/experiences/my` - Get all experiences authored by the authenticated user.
- `GET /api/experiences/all` - Get unpaginated list of all interview experiences.
- `GET /api/experiences/{id}` - Get detailed interview experience with its rounds and questions.
- `PUT /api/experiences/{id}` - Update interview experience (Owner or ADMIN only).
- `DELETE /api/experiences/{id}` - Delete interview experience (Owner or ADMIN only).

### Round APIs (`/api/experiences/{experienceId}/rounds` & `/api/rounds`)
- `POST /api/experiences/{experienceId}/rounds` - Add an interview round (Owner of experience or ADMIN).
- `GET /api/experiences/{experienceId}/rounds` - List all rounds for a specific experience.
- `GET /api/rounds` - List all interview rounds across the platform.
- `GET /api/rounds/{roundId}` - Get interview round details by ID.
- `PUT /api/rounds/{roundId}` - Update interview round (Owner of parent experience or ADMIN).
- `DELETE /api/rounds/{roundId}` - Delete interview round (Owner of parent experience or ADMIN).

### Question APIs (`/api/rounds/{roundId}/questions` & `/api/questions`)
- `POST /api/rounds/{roundId}/questions` - Add question to a round (Owner of parent experience or ADMIN).
- `GET /api/rounds/{roundId}/questions` - List all questions for a specific round.
- `GET /api/questions` - List all interview questions across the platform.
- `PUT /api/questions/{questionId}` - Update question (Owner of parent experience or ADMIN).
- `DELETE /api/questions/{questionId}` - Delete question (Owner of parent experience or ADMIN).

### Health & Monitoring (`/actuator`)
- `GET /actuator/health` - Health check endpoint (Public, returns `{"status":"UP"}`).
- `GET /actuator/info` - Application info.

---

## 10. Authentication & Authorization Instructions

1. **Register or Login**:
   Send a `POST` request to `/api/auth/login`:
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
2. **Obtain Token**:
   The response contains:
   ```json
   {
     "success": true,
     "message": "User authenticated successfully",
     "data": {
       "token": "eyJhbGciOiJIUzI1NiJ9...",
       "user": { ... }
     }
   }
   ```
3. **Send Authenticated Requests**:
   Include the token in the `Authorization` header with the `Bearer ` prefix:
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ```

---

## 11. Swagger UI & OpenAPI

- **Swagger UI Interactive Documentation**:
  [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **OpenAPI JSON Spec**:
  [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Testing in Swagger UI
1. Open [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
2. Execute `POST /api/auth/login` with valid credentials.
3. Copy the returned `token` value.
4. Click the green **Authorize** button at the top right of Swagger UI.
5. Enter the token (or `Bearer <token>`) and click **Authorize**.
6. All protected endpoints can now be executed directly via **Try it out** -> **Execute**.

---

## 12. Postman / cURL Testing Instructions

### 1. Health Check
```bash
curl -X GET http://localhost:8080/actuator/health
```

### 2. User Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }'
```

### 3. User Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "Password@123"
  }'
```

### 4. Create an Experience (Using JWT)
```bash
curl -X POST http://localhost:8080/api/experiences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "companyId": 1,
    "jobRole": "Senior Java Engineer",
    "experienceTitle": "Google L5 Backend Interview",
    "description": "Comprehensive 5-round loop focusing on distributed systems and algorithms.",
    "overallDifficulty": "HARD",
    "result": "SELECTED",
    "yearsOfExperience": 5.5
  }'
```

### 5. Search Experiences
```bash
curl -X GET "http://localhost:8080/api/experiences/search?keyword=Google&page=0&size=10" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 13. License

This project is licensed under the Apache 2.0 License.
