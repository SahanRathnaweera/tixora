
# Tixora: Event Booking & Reservation System

A full-stack event booking platform with **QR code ticket verification**. Guests browse events and reserve seats, receive a unique QR ticket, and staff verify tickets at the entrance.

## Features
- JWT authentication with `USER` and `ADMIN` roles
- Event catalogue with search, price filter and sorting
- Seat booking with automatic, concurrency-safe seat deduction (row locking)
- QR ticket generated on every booking (ZXing)
- "My tickets" dashboard: upcoming, used/past and cancelled bookings, cancellation with seat release
- Admin: create / edit / delete events with image upload, and a ticket verification page (double scans are rejected)
- Dark and light themes, responsive premium UI

## Tech stack
| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, PostgreSQL, ZXing, Maven |
| Frontend | React, Vite, TypeScript, Tailwind CSS, Axios, Lucide icons |

## Getting started

### Prerequisites
JDK 17, Node.js 20+, PostgreSQL 15+

### 1. Database
Create an empty database named `tixora`.

### 2. Backend
Create `backend/src/main/resources/application-local.properties` (it is git-ignored):

    spring.datasource.password=YOUR_POSTGRES_PASSWORD

Then run:

    cd backend
    ./mvnw spring-boot:run

The API starts on http://localhost:8080. A default admin is created on first run.

### 3. Frontend
    cd frontend
    npm install
    npm run dev

Open http://localhost:5173

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@tixora.com | Admin@12345 |
| User | register your own account on the Sign in page | |

## API overview
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/events`, `/api/events/{id}` | Public |
| POST / PUT / DELETE | `/api/events`, `/api/events/{id}` | Admin |
| POST | `/api/uploads` | Admin |
| POST | `/api/bookings` | Authenticated |
| GET | `/api/bookings/my` | Authenticated |
| POST | `/api/bookings/{id}/cancel` | Owner |
| POST | `/api/tickets/verify` | Admin |

## Roadmap
- Simulated checkout with timed seat holds
- Automated API and UI tests
'@ | Set-Content -Path README.md -Encoding utf8
