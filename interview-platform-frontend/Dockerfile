# ==============================================================================
# Stage 1: Build React Vite SPA Production Bundle
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source and build optimized static assets
COPY . .

# Set production API URL during build (can be overridden via build arg)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ==============================================================================
# Stage 2: Serve via High-Performance Nginx Alpine
# ==============================================================================
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
