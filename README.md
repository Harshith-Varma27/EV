# Smart EV Charging Optimization System

## Tech Stack
- **Frontend**: React.js 18, React Router 6, Recharts, Axios
- **Backend**: Spring Boot 3.2, Spring Security, JWT, JPA/Hibernate
- **Database**: MySQL 8

---

## Setup Instructions

### 1. Database Setup
```sql
-- Run in MySQL Workbench or CLI
source database/schema.sql
```
Default admin credentials: `admin@evcharging.com` / `admin123`

### 2. Backend Setup
```bash
cd ev-charging-backend

# Edit src/main/resources/application.properties
# Set your MySQL username/password

mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. Frontend Setup
```bash
cd ev-charging-frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## Default Login Credentials

| Role    | Email                     | Password |
|---------|---------------------------|----------|
| Admin   | admin@evcharging.com      | admin123 |
| Manager | (Create via Admin panel)  | —        |
| User    | (Register via Signup)     | —        |

---

## Project Structure

```
EV PROJECT/
├── database/
│   └── schema.sql                    ← MySQL schema + seed data
│
├── ev-charging-backend/              ← Spring Boot
│   └── src/main/java/com/evcharging/
│       ├── model/                    ← JPA Entities
│       │   ├── User.java
│       │   ├── Station.java
│       │   ├── Charger.java
│       │   ├── Slot.java
│       │   ├── Booking.java
│       │   └── Notification.java
│       ├── repository/               ← Spring Data JPA
│       ├── service/                  ← Business Logic
│       ├── controller/               ← REST Controllers
│       ├── dto/                      ← Request/Response DTOs
│       ├── security/                 ← JWT Auth
│       ├── config/                   ← Security + CORS Config
│       └── pattern/                  ← Design Patterns
│           ├── factory/              ← Charger Factory
│           ├── observer/             ← Booking Events → Notifications
│           ├── state/                ← Slot State Machine
│           └── strategy/             ← Slot Allocation
│
└── ev-charging-frontend/             ← React
    └── src/
        ├── pages/
        │   ├── auth/                 ← Landing, Login, Register
        │   ├── user/                 ← User Dashboard + Booking
        │   ├── manager/              ← Station Manager Dashboard
        │   └── admin/                ← Admin Dashboard
        ├── services/api.js           ← Axios + JWT interceptors
        ├── context/AuthContext.js    ← Auth state
        └── styles/global.css         ← Full design system
```

---

## API Endpoints

| Module  | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Auth    | /api/auth/login | POST | Login |
| Auth    | /api/auth/register | POST | Register user |
| User    | /api/user/stations/nearby?lat=&lng= | GET | Nearby stations |
| User    | /api/user/stations/city?city= | GET | Stations by city |
| User    | /api/user/stations/:id/chargers | GET | Station chargers + slots |
| User    | /api/user/bookings | POST | Create booking |
| User    | /api/user/bookings | GET | My bookings |
| User    | /api/user/notifications | GET | My notifications |
| Manager | /api/manager/station | GET | My station |
| Manager | /api/manager/chargers | POST | Add charger |
| Manager | /api/manager/chargers/:id/maintenance | PUT | Toggle maintenance |
| Manager | /api/manager/slots/:id/state | PUT | Change slot state |
| Manager | /api/manager/bookings/:id/status | PUT | Advance booking |
| Admin   | /api/admin/analytics | GET | Platform stats |
| Admin   | /api/admin/stations | GET/POST | Manage stations |
| Admin   | /api/admin/managers | GET/POST | Manage managers |
| Admin   | /api/admin/users | GET | All users |
| Admin   | /api/admin/bookings | GET | All bookings |

---

## Design Patterns

| Pattern   | Implementation | Where |
|-----------|---------------|-------|
| Factory   | ChargerFactory | Creates Fast/Normal/Super charger configs |
| Observer  | BookingEventPublisher | Fires notifications on booking events |
| State     | SlotStateManager | Enforces valid slot state transitions |
| Strategy  | SlotAllocationStrategy | FIFO / Smart slot allocation |
| Singleton | Spring Beans (default) | All @Service/@Component classes |
