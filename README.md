# Hotel Employee Management System (HRMS)

A clean, production-grade Hotel Employee Management System built as a technical challenge submission. The system manages hotel departments, roles, staff profiles, 24/7 rotational shifts, shift scheduling, real-time punch attendance with automated late-status derivation, and analytical reporting.

---

## 1. Architecture Overview

The application is structured into a decoupled, layered client-server architecture. The frontend Single Page Application communicates via typed RESTful HTTP endpoints with the backend Express API. Business logic (such as auto-deriving tardiness based on shift start times and grace periods) is strictly encapsulated within isolated service modules rather than controllers. Prisma ORM mediates all transactions and aggregations with the underlying PostgreSQL container.

```
+-----------------------------------------------------------------------+
|                    React Frontend SPA (Vite + Tailwind)               |
|         [Employee Directory] [Attendance] [Shifts] [Reports Chart]    |
+-----------------------------------+-----------------------------------+
                                    |
                            HTTP / REST JSON
                                    |
+-----------------------------------v-----------------------------------+
|                        Node.js + Express API                          |
|  [Zod Validation] -> [Controllers] -> [Isolated Business Services]    |
|                  -> [Centralized Error Middleware]                    |
+-----------------------------------+-----------------------------------+
                                    |
                              Prisma Client
                                    |
+-----------------------------------v-----------------------------------+
|                       PostgreSQL 16 Database                          |
|         (Enforced DB-Level Unique Constraints & Foreign Keys)          |
+-----------------------------------------------------------------------+
```

---

## 2. Database Design & Entity Relationship Diagram

### Mermaid ERD

```mermaid
erDiagram
    Department ||--o{ Employee : "has staff"
    Role ||--o{ Employee : "assigned to"
    Employee ||--o{ ShiftAssignment : "scheduled for"
    Employee ||--o{ Attendance : "records punch"
    Shift ||--o{ ShiftAssignment : "defines hours"
    ShiftAssignment ||--o| Attendance : "actualized by"

    Department {
        Int id PK
        String name UK
        String description
    }

    Role {
        Int id PK
        String title UK
        String description
    }

    Shift {
        Int id PK
        String name
        String startTime
        String endTime
    }

    Employee {
        Int id PK
        String firstName
        String lastName
        String email UK
        String phone
        DateTime hireDate
        EmployeeStatus status
        Int departmentId FK
        Int roleId FK
        DateTime createdAt
        DateTime updatedAt
    }

    ShiftAssignment {
        Int id PK
        Int employeeId FK
        Int shiftId FK
        DateTime date
    }

    Attendance {
        Int id PK
        Int employeeId FK
        DateTime date
        AttendanceStatus status
        DateTime checkIn
        DateTime checkOut
        Int shiftAssignmentId FK,UK
    }
```

### Core Design Decisions

1. **Single Department & Role FKs with Evolutionary Path:**
   - *Current Design:* `Employee` holds direct foreign keys to `Department` and `Role`. This deliberate scope decision ensures zero overhead and clean queries for a 1-day system.
   - *Future Evolution:* In a larger enterprise scale, this would evolve to `EmployeeDepartmentHistory` and `EmployeeRoleHistory` tables with `startDate`, `endDate`, and `isCurrent` flags to track promotions and inter-department transfers across time.
2. **Soft-Delete for Employees (`status: INACTIVE`):**
   - When an employee departs or is deleted, their record is updated to `status: INACTIVE` instead of executing a physical SQL `DELETE`. This preserves historical attendance, timesheet, and shift reporting data integrity without orphaned records.
3. **Compound Unique Constraints at the Database Level:**
   - Both `ShiftAssignment` and `Attendance` enforce `@@unique([employeeId, date])`. This guarantees at the database level that an employee cannot be double-booked on the same calendar day or submit duplicate attendance entries.
4. **Separation of Intent vs. Reality (`ShiftAssignment` vs. `Attendance`):**
   - `ShiftAssignment` represents the planned roster (schedule intent).
   - `Attendance` represents what actually occurred (punch timestamps and actual status).
   - Linking via `shiftAssignmentId` allows cross-referencing scheduled shift start time against actual punch-in time to compute automated punctuality metrics.

---

## 3. Important Decisions & Tradeoffs

- **Framework & Simplicity:** Implemented with Express + TypeScript for clear architecture and direct control over error mapping.
- **Auto-Derived Late Logic as a Pure Function:** `deriveAttendanceStatus()` in `attendance.service.ts` is decoupled from HTTP concerns and database state, making it fast and unit-testable in milliseconds.
- **Pagination Defaults:** All list endpoints (`/api/employees`, `/api/attendance`, `/api/shift-assignments`) support `?page=&pageSize=`. Even with small sample datasets, this ensures API contract scalability and prevents unbounded memory consumption in production.
- **Tradeoffs for 1-Day Budget:**
  - *Authentication & RBAC:* Auth is omitted in accordance with prompt guidelines. In production, JWT middleware with role-based permissions (`ADMIN`, `HR_MANAGER`, `STAFF`) would protect sensitive routes.
  - *Multi-department Shift Coverage:* Currently staff belong to one home department. A hotel with cross-trained banquet servers could extend `ShiftAssignment` to allow assigning staff to shifts outside their primary department.

---

## 4. The Non-Trivial Report: `/api/reports/attendance-rate`

The flagship analytical query is served at:
```http
GET /api/reports/attendance-rate?department=&month=YYYY-MM
```

### Why it is Non-Trivial:
Calculating true hotel department attendance rate requires:
1. **Multi-Table Relational Join:** Joining `Attendance` records with `Employee` and `Department` entities while filtering by active employee status and specific calendar month boundaries (`startDate` to `endDate`).
2. **Grouped Statistical Aggregation:** Aggregating total shifts recorded, present counts, late arrivals, absences, and approved leaves per department.
3. **Operational Attendance Rate Formula:**
   $$\text{Attendance Rate (\%)} = \frac{\text{Present Count} + \text{Late Count}}{\text{Total Records} - \text{On-Leave Count}} \times 100$$
   Approved leaves (`ON_LEAVE`) are excluded from expected working days so employees taking legitimate paid time off do not penalize their department's operational readiness score.
4. **Punctuality Metric:**
   $$\text{On-Time Rate (\%)} = \frac{\text{Present Count}}{\text{Total Records} - \text{On-Leave Count}} \times 100$$

---

## 5. How to Run the Project

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- npm

### 1. Start PostgreSQL Database
From the project root:
```bash
docker-compose up -d
```

### 2. Setup & Run Backend API
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
Backend API will start at: `http://localhost:5000`
Interactive Swagger OpenAPI Docs: `http://localhost:5000/api-docs`

### 3. Run Unit Tests (Late-Derivation Logic)
```bash
cd backend
npm test
```

### 4. Setup & Run Frontend Web App
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend Web Application will be available at: `http://localhost:3000`

---

## 6. API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/employees` | List with filters & pagination / Create employee |
| `GET/PUT/DELETE` | `/api/employees/:id` | Get details / Update / Soft-delete (`INACTIVE`) |
| `GET/POST` | `/api/departments` | List departments / Create department |
| `GET/PUT/DELETE` | `/api/departments/:id` | Get / Update / Delete department |
| `GET/POST` | `/api/roles` | List roles / Create role |
| `GET/PUT/DELETE` | `/api/roles/:id` | Get / Update / Delete role |
| `GET/POST` | `/api/shifts` | List shifts / Create shift definition |
| `GET/PUT/DELETE` | `/api/shifts/:id` | Get / Update / Delete shift |
| `POST` | `/api/shift-assignments` | Assign shift to employee for date |
| `GET` | `/api/shift-assignments` | Filter by `date`, `employeeId`, `departmentId` |
| `POST` | `/api/attendance` | Record punch-in/out (auto-evaluates 10-min grace period) |
| `GET` | `/api/attendance` | List attendance history with date range & status filters |
| `GET` | `/api/reports/attendance-rate` | Monthly per-department attendance rates & statistics |
| `GET` | `/api/reports/absenteeism` | Top employees ranked by absent + late occurrences |
| `GET` | `/api/reports/roster` | Shift roster for date grouped by department & shift |

---

## 7. Future Enhancements (Deliberately Scoped Out)

The following capabilities were considered during system design but deliberately scoped out to keep this technical challenge submission concise, maintainable, and aligned with the 1-day time budget. Each item outlines the specific architectural component required for implementation:

### 📅 Scheduling & Staffing
- **Minimum staffing thresholds per shift (with understaffed shifts report):** Would require a `minStaffCount` field on the `Shift` model (or a `DepartmentShiftRequirement` table) and an aggregation service query comparing scheduled assignments against minimum requirements.
- **Minimum rest period enforcement between consecutive shifts:** Would require a scheduling validation check in `ShiftAssignmentService` querying an employee's prior-day and next-day shift end/start times to enforce an 8-to-11 hour mandatory rest buffer (e.g., preventing a Morning shift immediately after a Night shift).
- **Shift swap requests between employees:** Would require a `ShiftSwapRequest` model (`requesterId`, `targetEmployeeId`, `shiftAssignmentId`, `status: PENDING|APPROVED|REJECTED`) and an atomic Prisma `$transaction` swapping both assignment records upon manager approval.

### ⏱️ Attendance & Payroll-Adjacent
- **Computed hours-worked per employee from checkIn/checkOut:** Would require a timesheet service calculating the exact millisecond duration between `checkIn` and `checkOut` (deducting scheduled unpaid meal breaks) aggregated across weekly or monthly pay periods.
- **Overtime detection against shift durations and weekly thresholds:** Would require an overtime rules engine comparing daily computed hours against scheduled shift length or weekly standard thresholds (e.g., > 40 hours/week).
- **Escalation notifications for repeated lateness/absence patterns:** Would require an asynchronous worker (e.g., Redis/BullMQ queue or cron schedule) scanning rolling 30-day infraction counts and dispatching automated alerts to department heads upon reaching 3+ tardiness events.

### 🌴 Leave Management Depth
- **Leave balance & annual quota tracking per employee:** Would require an `EmployeeLeaveQuota` table (`employeeId`, `year`, `totalDays`, `usedDays`, `remainingDays`) and transactional validation rejecting leave requests that exceed remaining available balance.
- **Differentiated leave types with distinct quota rules:** Would require expanding the schema with a `LeaveType` enum (`SICK`, `ANNUAL_VACATION`, `MATERNITY`, `UNPAID`) and separate allocation balances per category.

### 👥 Employee Lifecycle
- **Probation period logic derived from hireDate:** Would require a utility method checking whether `today < hireDate + 90 days`, optionally gating probation-restricted operations like paid leave requests.
- **Full department and role transfer history:** Would require an `EmployeeAssignmentHistory` table with `employeeId`, `departmentId`, `roleId`, `effectiveStartDate`, and `effectiveEndDate` instead of directly overwriting foreign key columns.
- **Explicit offboarding cascade flow:** Would require an offboarding routine wrapped in a Prisma `$transaction` that sets `Employee.status = INACTIVE` and automatically deletes or cancels all future `ShiftAssignment` records where `date > today`.

### 📊 Reporting Depth
- **Department headcount and attrition trends over time:** Would require querying historical hire dates, deactivation timestamps, and status change audit logs grouped by monthly and quarterly intervals.
- **Shift coverage matrix across date ranges:** Would require a multi-day matrix query cross-referencing required staffing quotas against actual scheduled assignments across selected calendar weeks.

