# Software Requirements Specification (SRS)
## Project: EN2H Booking Platform REST API
**Version:** 1.0  
**Author:** Backend Engineering Candidate  
**Date:** July 11, 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the EN2H Booking Platform REST API. The system provides a backend engine that enables users to manage services and customer booking schedules, protecting business logic and database constraints.

### 1.2 Document Conventions
This document follows standard software engineering documentation guidelines. Requirements are grouped by functional areas. HTTP methods and API path conventions follow strict RESTful standards.

### 1.3 Project Scope
The Booking Platform REST API serves as the backend infrastructure for a booking scheduling system. It manages service providers (authenticated staff) and customer bookings. Customer bookings can be scheduled publicly, while service creation and list updates are restricted to authenticated service providers.

---

## 2. Overall Description

### 2.1 Product Perspective
The API is built using NestJS and TypeORM, acting as a modular, stateless microservice. It is configured to run with local SQLite out-of-the-box for testing and seamlessly integrates with PostgreSQL for production workloads.

### 2.2 Product Functions
- **User Authentication:** JWT-based user registration, login, logout, and token refresh rotation.
- **Service Management:** CRUD endpoints for services (restricted to authenticated service providers).
- **Booking Management:** Guest-facing booking creation and booking cancellation. Staff-facing booking status management (complete/confirm) and booking list queries.

### 2.3 User Classes and Characteristics
- **Service Providers (Staff/Admins):** Authenticated users who manage the listing of services and oversee booking statuses.
- **Customers (Guests):** Public users who can query active services, create bookings, and cancel their specific bookings without login.

### 2.4 Design and Implementation Constraints
- **Framework Constraint:** Must be implemented in NestJS with TypeScript.
- **Security Constraint:** Passwords must be hashed using bcrypt before database insertion. JWT keys must be verified via authorization headers.
- **Database Constraint:** Relational database support (PostgreSQL/SQLite) using TypeORM.

---

## 3. System Features & Functional Requirements

### 3.1 User Authentication
- **Requirement 3.1.1 (Register):** The system shall allow users to register with an email, name, and password. Duplicate emails must be rejected with an HTTP `409 Conflict`.
- **Requirement 3.1.2 (Login):** Registered users can login to obtain a JWT access token (short-lived) and a JWT refresh token (long-lived).
- **Requirement 3.1.3 (Refresh Token Rotation):** Authenticated users can exchange a valid refresh token for a new access/refresh token pair. Used refresh tokens are rotated and invalidated immediately.
- **Requirement 3.1.4 (Logout):** The system shall revoke the user's refresh token in the database upon logout, preventing further refresh attempts.

### 3.2 Service Management
- **Requirement 3.2.1 (Access Control):** Only authenticated users with a valid JWT token can create, update, or delete services.
- **Requirement 3.2.2 (CRUD operations):**
  - `POST /services`: Create a service with title, description, duration (minutes), price, and isActive flag.
  - `PUT /services/:id`: Update existing service properties.
  - `DELETE /services/:id`: Delete a service.
  - `GET /services`: Retrieve a paginated list of services (publicly accessible).
  - `GET /services/:id`: Retrieve a specific service by ID.

### 3.3 Booking Management & Business Rules
- **Requirement 3.3.1 (Service Verification):** A booking must belong to an existing, active service (`isActive = true`). Bookings pointing to non-existent services must throw `404 Not Found`. Bookings pointing to inactive services must throw `400 Bad Request`.
- **Requirement 3.3.2 (Future Scheduling):** Booking dates and times must strictly be in the future. Past bookings must throw `400 Bad Request`.
- **Requirement 3.3.3 (Double-Booking Prevention):** The system must prevent duplicate bookings for the same service, date, and time. Active bookings matching these properties must throw `409 Conflict`. Cancelled bookings are excluded from this validation.
- **Requirement 3.3.4 (Status Management):**
  - Booking statuses are defined by the enum: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.
  - Cancelled bookings cannot be marked as completed (throws `400 Bad Request`).
  - Completed bookings cannot be cancelled (throws `400 Bad Request`).

---

## 4. Database Schema & Data Models

### 4.1 User Model
- `id`: UUID (Primary Key)
- `email`: Varchar (Unique, lowercase)
- `name`: Varchar
- `password`: Varchar (Hashed)
- `currentHashedRefreshToken`: Varchar (Hashed, Nullable)
- `createdAt` / `updatedAt`: Timestamp

### 4.2 Service Model
- `id`: UUID (Primary Key)
- `title`: Varchar
- `description`: Text (Nullable)
- `duration`: Integer (Minutes)
- `price`: Decimal (10, 2)
- `isActive`: Boolean (Default: true)
- `createdAt` / `updatedAt`: Timestamp

### 4.3 Booking Model
- `id`: UUID (Primary Key)
- `customerName`: Varchar
- `customerEmail`: Varchar
- `customerPhone`: Varchar
- `serviceId`: UUID (Foreign Key referencing Services)
- `bookingDate`: Varchar (`YYYY-MM-DD`)
- `bookingTime`: Varchar (`HH:MM`)
- `status`: Varchar (Enum: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`)
- `notes`: Text (Nullable)
- `createdAt` / `updatedAt`: Timestamp

---

## 5. Non-Functional Requirements

### 5.1 Security
- Password credentials must be securely salted and hashed using `bcrypt` (10 rounds).
- Access control must be enforced on management APIs via standard JWT bearer strategies.

### 5.2 Performance & Scalability
- Service and Booking list endpoints must support page-based pagination to prevent memory overhead during high-volume database queries.
- Database index optimization on query filters (like `serviceId`, `bookingDate`, `bookingTime`).
