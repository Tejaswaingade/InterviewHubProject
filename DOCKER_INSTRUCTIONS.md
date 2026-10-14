# InterviewHub Docker Containerization Guide

This guide details both containerization topologies supported by the platform:

1. **Development Architecture** (PostgreSQL + Spring Boot Backend in Docker, React Frontend standalone on Host)
2. **Full-Stack Production Architecture** (Nginx React SPA + Spring Boot Backend + PostgreSQL in Docker)

---

## Architecture Topologies

### 1. Development Mode
In this configuration, database and backend services are containerized, while frontend developers enjoy instant Vite Hot Module Replacement (HMR) locally on the host:

```text
[ React Frontend (Host) ]
   http://localhost:5173
            ¦
      (HTTP REST API)
            ?
+-- Docker Network: app-network ----------------+
¦                                               ¦
¦  [ Spring Boot Backend ] :8080                ¦
¦            ¦                                  ¦
¦       (JDBC/JPA)                              ¦
¦            ?                                  ¦
¦  [ PostgreSQL 16 DB ] :5432                   ¦
¦                                               ¦
+-----------------------------------------------+
```

#### Running Development Mode:
1. Ensure `.env` is present in `interview-platform/` (copied from `.env.example`).
2. Start the database and backend:
   ```bash
   cd interview-platform
   docker compose up -d --build
   ```
3. In a separate terminal, launch the frontend dev server:
   ```bash
   cd interview-platform-frontend
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

### 2. Full-Stack Production Mode
In this configuration, the entire stack runs within Docker. Nginx serves the optimized production React build and acts as an internal reverse-proxy routing `/api/*` directly to the Spring Boot container.

```text
       Internet Traffic
             ¦
             ?
+-- Docker Network: app-network ----------------+
¦                                               ¦
¦  [ Nginx Container ] :80                      ¦
¦     +-- Serves React Static Assets (/)        ¦
¦     +-- Proxies /api/ requests --------+      ¦
¦                                        ¦      ¦
¦  [ Spring Boot Backend ] :8080 ?-------+      ¦
¦     +-- JDBC Connection                ¦      ¦
¦             ?                          ¦      ¦
¦  [ PostgreSQL 16 DB ] :5432 (Internal)        ¦
¦     +-- Volume: postgres_data                 ¦
¦                                               ¦
+-----------------------------------------------+
```

#### Running Full-Stack Production Mode:
1. From the project root (`InterviewHubProject/`):
   ```bash
   docker compose up -d --build
   ```
2. Check running status:
   ```bash
   docker compose ps
   ```
3. View logs:
   ```bash
   docker compose logs -f backend
   ```
4. Access the application at `http://localhost:80` (or your domain).

---

## Container Specifications

### Backend Container (`interview-platform/Dockerfile`)
- **Stage 1 (Builder)**: `maven:3.9.9-eclipse-temurin-21-alpine` compiles and packages the Spring Boot JAR with layer-cached dependencies.
- **Stage 2 (Runtime)**: `eclipse-temurin:21-jre-alpine` runs the executable JAR.
- **Security**: Runs under unprivileged non-root user `appuser:appgroup`.
- **Performance**: JVM container support enabled with `-XX:MaxRAMPercentage=75.0`.

### Frontend Container (`interview-platform-frontend/Dockerfile`)
- **Stage 1 (Builder)**: `node:20-alpine` runs `npm ci` and `npm run build`.
- **Stage 2 (Server)**: `nginx:alpine` serves static assets with Gzip compression, client-side SPA routing (`try_files $uri $uri/ /index.html`), and reverse proxy headers.

### Database Container (`postgres:16-alpine`)
- Persisted via named volume `postgres_data`.
- Built-in healthcheck: `pg_isready -U postgres -d interview_app`.

---

## Stopping & Teardown

To stop containers:
```bash
docker compose down
```

To stop and remove database volumes (fresh database initialization):
```bash
docker compose down -v
```
