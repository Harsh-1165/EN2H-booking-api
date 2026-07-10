# EN2H Booking Platform REST API

A production-grade, highly scalable Booking Platform REST API built with NestJS, TypeScript, and TypeORM. Designed and structured for reliability, secure authentication, and precise booking workflows.

---

## 🚀 Project Overview

This repository implements a robust backend booking engine. It provides secure APIs for user registration/login, service management, and customer booking scheduling, fully validating business rules.

### Key Architectural Highlights
- **Framework:** NestJS (v10) with strict TypeScript mode enabled.
- **Database:** TypeORM with support for **SQLite** (out-of-the-box local setup) and **PostgreSQL** (production/docker setup).
- **Authentication:** JWT Access tokens & Refresh tokens with Rotation and Invalidation support.
- **Validation:** Strict class-validator parsing (stripping unwhitelisted payload fields automatically).
- **Global Error Handling:** Custom HttpExceptionFilter mapping exceptions to unified error structures.
- **API Documentation:** Auto-generated, interactive Swagger UI OpenAPI documentation.
- **Docker Ready:** Multistage build Dockerfile and Compose setup.

---

## 🛠️ Installation Steps

Follow these steps to get your environment up and running locally:

### 1. Prerequisites
- **Node.js:** v18 or higher (v22 recommended)
- **NPM:** v10 or higher
- **Docker / Docker Compose** (Optional, for postgres/containerized setup)

### 2. Clone and Setup Workspace
```bash
git clone <repository-url> en2h-booking-api
cd en2h-booking-api
```

### 3. Install Dependencies
```bash
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory based on the `.env.example` template:

```env
# Application Settings
PORT=3000
NODE_ENV=development

# Database Configuration (sqlite or postgres)
DATABASE_TYPE=sqlite
DATABASE_NAME=database.sqlite

# Optional PostgreSQL Configuration (used if DATABASE_TYPE=postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=booking_db

# JWT Configuration
JWT_SECRET=super_secret_access_key_change_me_in_production
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=super_secret_refresh_key_change_me_in_production
JWT_REFRESH_EXPIRATION=7d
```

---

## 🗄️ Database Setup & Running Migrations

By default, the application is configured to run with **SQLite** out-of-the-box. This means that launching the application will automatically create and initialize the local database file `database.sqlite` in the root folder. No external database engines or database installations are needed.

### Running with PostgreSQL
1. Set `DATABASE_TYPE=postgres` in `.env`.
2. Provide your Postgres connection credentials.
3. Start the Postgres instance (or run `docker-compose up postgres`).

### Running Schema Synchronization & Migrations
In development/test modes, TypeORM `synchronize: true` is enabled to automatically keep tables in sync with database entity schemas. For production deployments:
- Configure `synchronize: false`.
- Run migrations using TypeORM CLI commands:
  ```bash
  # Generate migration file
  npx typeorm migration:generate src/migrations/initial -d dist/db/data-source.js
  
  # Run migrations
  npx typeorm migration:run -d dist/db/data-source.js
  ```

---

## 🚀 Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Run using Docker Compose
The easiest way to boot the complete stack (NestJS App + PostgreSQL Database) in isolation:
```bash
docker-compose up --build
```
*Note: By default, the application inside Docker will connect to PostgreSQL as configured in the docker-compose environment section.*

---

## 🧪 Running Tests
Unit tests have been written with Jest to cover core business validation rules and API actions:

```bash
# Run unit tests
npm run test

# Run tests with coverage output
npm run test:cov
```

#### 3. End-to-End Integration Tests
We provide a complete automated E2E integration test script that spins through 19 test scenarios validating auth registration, JWT refresh rotation, DTO validation errors, service creation, guest booking creation, duplicate checks, status flow limits, and logouts.
*(Note: Ensure the local API server is running before executing this script)*
```bash
npm run test:integration
```

---

## 📖 API Documentation

Interactive OpenAPI 3.0 specs are served directly from the application container.
- **URL:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Format:** Supports Bearer Authorization headers (input your JWT Access Token in the top-right button).

### Available Endpoints Summary

| Tag | Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new user | No |
| | `POST` | `/api/auth/login` | Login and return Access & Refresh tokens | No |
| | `POST` | `/api/auth/refresh`| Rotate tokens using Refresh token | No |
| | `POST` | `/api/auth/logout` | Revoke user's refresh token | **Yes** |
| **Services** | `POST` | `/api/services` | Create a new service | **Yes** |
| | `PUT` | `/api/services/:id` | Update an existing service | **Yes** |
| | `DELETE`| `/api/services/:id` | Delete a service | **Yes** |
| | `GET` | `/api/services` | Get all services (paginated/filtered) | No |
| | `GET` | `/api/services/:id`| Get a single service by ID | No |
| **Bookings** | `POST` | `/api/bookings` | Create a new booking | No |
| | `POST` | `/api/bookings/:id/cancel`| Cancel booking | No |
| | `GET` | `/api/bookings` | List all bookings (paginated/filtered/search) | **Yes** |
| | `GET` | `/api/bookings/:id`| Get a booking by ID | **Yes** |
| | `PATCH`| `/api/bookings/:id/status`| Update booking status | **Yes** |

---

## 🧠 Assumptions Made

1. **Role Scope:** Registration is open to service providers (users who manage the system). Bookings are created by end customers (guests) and thus booking creation is public.
2. **Double Booking Definition:** Duplicate bookings are defined as having the same `serviceId`, `bookingDate` (YYYY-MM-DD), and `bookingTime` (HH:MM). Cancelled bookings are ignored in the collision check, freeing up the slot for others.
3. **Cancellation Control:** Customers/guests are allowed to cancel their bookings publicly via booking ID. However, once a booking is marked as `COMPLETED` by staff, it cannot be cancelled.
4. **Timezone Validation:** Input times are parsed using local server time configuration. Validation checks ensure that booking times are strictly in the future compared to the execution moment.

---

## 📈 Future Improvements

If deployed to a wider production cluster, we recommend implementing:
1. **Rate Limiting:** Protect registration, login, and public booking endpoints using `@nestjs/throttler` to prevent abuse.
2. **Transactional Database Locking:** Use database Pessimistic Locking during duplicate validation checks to prevent race conditions during high-volume parallel bookings.
3. **Audit Trail:** Maintain history logs of booking status modifications including operator details.
4. **Event Emitter / Queue:** Dispatch booking confirmation emails or text messages asynchronously using `@nestjs/event-emitter` or BullMQ.
5. **Soft Deletion:** Soft-delete services (`isActive = false` or `deletedAt`) rather than hard deletion to preserve historical booking records that reference those services.
