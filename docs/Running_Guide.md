# Running & Deployment Guide
## Project: EN2H Booking Platform REST API
**Version:** 1.0  
**Author:** Backend Engineering Candidate  
**Date:** July 11, 2026

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js:** version 18.0.0 or higher (version 22 recommended)
- **NPM:** version 10.0.0 or higher
- **PostgreSQL Database** (Required if using PostgreSQL option)
- **Docker / Docker Compose** (Required if deploying via containers)

---

## 2. Local Installation & Configuration

### 2.1 Clone the Project
```bash
git clone <repository-url> en2h-booking-api
cd en2h-booking-api
```

### 2.2 Install Dependencies
Install all project dependencies (including `pg`, `sqlite3`, `bcrypt`, `passport-jwt`, and validation utilities):
```bash
npm install
```

### 2.3 Environment Settings
Create a `.env` file in the root of the project directory based on the `.env.example` file:
```env
# Application Settings
PORT=3000
NODE_ENV=development

# Database Settings (sqlite or postgres)
DATABASE_TYPE=sqlite
DATABASE_NAME=database.sqlite

# Optional PostgreSQL Connection (used only if DATABASE_TYPE=postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=booking_db

# JWT Parameters
JWT_SECRET=super_secret_access_key_change_me_in_production
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=super_secret_refresh_key_change_me_in_production
JWT_REFRESH_EXPIRATION=7d
```

---

## 3. Database Execution Modes

### 3.1 SQLite Execution (Default out-of-the-box mode)
Set `DATABASE_TYPE=sqlite` in `.env`.
No further database installations are needed. The SQLite file database will be initialized automatically in the root workspace as `database.sqlite` when starting the server.

### 3.2 PostgreSQL Execution
1. Ensure your PostgreSQL server is active (default port `5432`).
2. Create a database named `booking_db`.
3. Set `DATABASE_TYPE=postgres` in `.env`.
4. Fill in your `DB_USERNAME` and `DB_PASSWORD`.
5. When starting the application in development mode, TypeORM will automatically synchronize all schemas and create tables.

---

## 4. Running the Application

### 4.1 Running in Development (Hot-Reload Watch Mode)
```bash
npm run start:dev
```

### 4.2 Running in Production (Build & Execute)
```bash
# Build the TypeScript compiler outputs
npm run build

# Start compiled NestJS bundle
npm run start:prod
```

### 4.3 Running with Docker Compose
To boot the NestJS application along with a PostgreSQL container automatically:
```bash
docker-compose up --build
```
This runs the application inside Docker on port `3000` and configures access permissions to the database container automatically.

---

## 5. Running the Test Suites

### 5.1 Unit Tests (Jest)
Run unit tests validating CRUD logical outcomes:
```bash
npm run test
```

### 5.2 Unit Test Coverage
Generate code coverage reports:
```bash
npm run test:cov
```

### 5.3 End-to-End Integration Tests
Run E2E integration test flow (19 sequential test scenarios) validating registration, token refresh rotations, collisions, validation blocks, and logging out:
*(Note: Ensure your server is running via `npm run start:dev` before executing)*
```bash
npm run test:integration
```

---

## 6. Swagger API Documentation & JSON Specs
- **Swagger URL:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **JSON Specification:** The OpenAPI 3.0 specs can be retrieved directly at [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json). A pre-saved OpenAPI spec is included in your repository root as `swagger.json`.
