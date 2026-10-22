# GridCast Technical Documentation

## 1. PROJECT OVERVIEW
**Project Name**: GridCast  
**Alternative Name**: AI-Based Smart Electricity Demand Forecasting and Grid Decision Support System

**Concept**: GridCast is a web-based platform designed to assist electricity grid operators and analysts in managing energy grids. It addresses the critical problem of balancing electricity supply and demand. By utilizing artificial intelligence (planned) and analyzing historical telemetry data, the system predicts peak electricity demand.

**Why Forecasting is Useful**: Electricity grids operate in real-time. Power cannot be easily stored in large quantities; therefore, supply must exactly match demand. If demand spikes unexpectedly (e.g., during a heatwave when air conditioners run simultaneously), the grid can fail, resulting in blackouts. Forecasting allows grid operators to proactively secure additional power, preventing outages and reducing wasted generation.

**Purpose**: GridCast acts as the central intelligence hub, storing historical grid telemetry (load and weather) and acting as the interface for predictive modeling results. 

**Current Scope**: The project currently focuses on establishing the secure foundational architecture (backend, database, authentication, and role authorization pipelines). The application is structurally ready for data ingestion and integration with an external machine learning service.

**Forecasting vs. Grid Decision Support**: Forecasting merely provides numbers (e.g., "Demand will be 500 MW"). Decision support takes those numbers and provides actionable insights (e.g., "Demand will exceed capacity; spin up backup generators"). GridCast aims to provide both.

---

## 2. PROJECT OBJECTIVES
* **Electricity Load Forecasting** (Planned): Predict future electricity usage in Megawatts (MW).
* **Peak Demand Forecasting** (Planned): Identify when the maximum stress on the grid will occur.
* **Weather-Aware Forecasting** (Planned): Correlate temperature and humidity with electricity demand.
* **Uncertainty-Aware Forecasting** (Planned): Provide ranges of expected demand (upper and lower bounds) rather than just a single point prediction, allowing for safer planning.
* **Grid Decision Support** (Planned): Help operators make choices based on forecasted stress.
* **Historical Data Analysis** (Partially Implemented): The database architecture for storing historical telemetry is fully completed.
* **Secure Role-Based Access** (Implemented): Robust, cryptographically secure JWT authentication and role-based middleware has been successfully integrated.

---

## 3. SYSTEM USERS AND ROLES
Authentication proves *who* a user is (identity). Authorization proves *what* a user is allowed to do (permissions).

| Role | Purpose | Current Authorization Status |
| :--- | :--- | :--- |
| **Admin** | System configuration, user management, and overall platform administration. | Implemented via `requireRole('Admin')` |
| **Grid Operator** | Real-time monitoring, evaluating forecasts, and making grid operation decisions. | Implemented via `requireRole('Grid Operator')` |
| **Energy Analyst** | Reviewing historical data, tweaking forecasting model versions, and generating reports. | Implemented via `requireRole('Energy Analyst')` |

---

## 4. SYSTEM ARCHITECTURE
The system employs a standard 3-tier web architecture, heavily utilizing a MERN-like stack (React, Express, Node.js, MongoDB), supplemented by a planned Python ML component.

```text
       [Users]
          |
          v
  [React Frontend] (Vite + Tailwind)
          |
          | HTTP/REST (JSON)
          v
  [Node.js + Express Backend]
          |
    +-----+-----+
    |           |
    v           v
[MongoDB]    [Python ML] (PLANNED)
 (Atlas)     (FastAPI)
```

**React Frontend**: The client-side application running in the user's browser, responsible for the UI.
**Node.js + Express Backend**: The central API server handling routing, security, database interaction, and business logic.
**MongoDB Atlas**: The cloud-hosted NoSQL database storing users, historical grid data, and forecast results.
**Python ML Service (Planned)**: An external service that will pull historical data, run XGBoost algorithms, and return predictive metrics back to the Node.js server.

---

## 5. PROJECT FOLDER STRUCTURE
**`client/`** (Frontend React Application)
Contains Vite configuration, React components, and TailwindCSS layouts (currently foundational placeholders).

**`server/`** (Backend Express Application)
* **`src/`**
  * **`config/index.js`**: Centralized environment variable loading and validation (e.g., checking for `JWT_SECRET`).
  * **`database/connection.js`**: Mongoose logic to establish the connection to MongoDB Atlas.
  * **`middleware/`**
    * **`auth.middleware.js`**: Contains `verifyAuth` to validate JWT Bearer tokens.
    * **`role.middleware.js`**: Contains `requireRole` to enforce RBAC.
    * **`errorHandler.js`**: Centralized, formatted error catching.
  * **`models/`**: Mongoose Schema definitions (`User.js`, `Telemetry.js`, `Forecast.js`).
  * **`routes/v1/`**: API endpoint definitions (currently containing `health.js`).
  * **`utils/`**: Reusable modules (`jwt.js`, `password.js`, `ApiError.js`, `ApiResponse.js`).
  * **`index.js`**: The main application entry point that bootstraps Express.
* **`scripts/createAdmin.js`**: The secure one-time database seeding script for the initial Administrator.
* **`.env`**: Local environment variables (Ignored by Git).

---

## 6. BACKEND ARCHITECTURE
The backend utilizes Express.js for routing and Mongoose for database modeling. It follows a highly modular, controller-service-route pattern.

**Request Flow**:
```text
Client Request
      ↓
[Express App]
      ↓
[Middleware] (e.g., verifyAuth, requireRole)
      ↓
[API Route] (e.g., /api/v1/telemetry)
      ↓
[Controller] (Logic and validation)
      ↓
[Database] (Mongoose Models)
      ↓
[Response] (JSON formatted via ApiResponse)
```
The architecture features centralized error handling, ensuring no stack traces leak to the client.

---

## 7. DATABASE ARCHITECTURE
GridCast uses a strictly focused, 3-collection database architecture to prevent unnecessary complexity. 

**Collections**:
1. `users`
2. `telemetry`
3. `forecasts`

```text
[users]
 - Identity and roles

[telemetry] 
 - Historical grid state
 - { timestamp (UNIQUE) }

[forecasts]
 - Predictive results
 - { targetTime (NON-UNIQUE) }
```
**Important Design Decisions**:
* **Combined Telemetry**: Historical load (MW) and weather (temperature/humidity) are stored in the same document because they are chronologically linked and will be queried together by the ML service.
* **Non-Unique Forecast Target**: `targetTime` is non-unique because the system may generate multiple forecasts for the same future hour using different `modelVersion` algorithms.
* **Dynamic Analytics**: We intentionally omitted `reports` and `recommendations` collections; these will be generated dynamically based on active data rather than taking up stale storage space.

---

## 8. USER MODEL
**Collection**: `users`
**Schema Fields**:
* `name` (String, required)
* `email` (String, required, unique, validated)
* `passwordHash` (String, required): Stores the `bcrypt` hashed output, never the plaintext password.
* `role` (Enum: Admin, Grid Operator, Energy Analyst, required)
* `isActive` (Boolean, default: true): Allows soft-suspension of accounts without deleting historical ties.
* `timestamps` (createdAt, updatedAt implicitly tracked by Mongoose)

---

## 9. TELEMETRY MODEL
**Collection**: `telemetry`
**Schema Fields**:
* `timestamp` (Date, required, indexed `1`, unique): Represents the exact hour of the reading.
* `actualLoadMW` (Number, required, min: 0): The grid consumption. Cannot be negative.
* `temperatureC` (Number, required): Can be negative for winter conditions.
* `humidity` (Number, required, min: 0, max: 100): Percentage metric.

---

## 10. FORECAST MODEL
**Collection**: `forecasts`
**Schema Fields**:
* `targetTime` (Date, required, indexed `-1`): The future time being predicted.
* `forecastTime` (Date, required, default: now): When the prediction was actually calculated.
* `predictedLoadMW` (Number, required, min: 0)
* `confidenceLowerMW` (Number, required, min: 0)
* `confidenceUpperMW` (Number, required, min: 0)
* `modelVersion` (String, required, default: '1.0.0')

**Uncertainty Validation**: A strict Mongoose `pre('validate')` hook mathematically enforces `confidenceLowerMW <= predictedLoadMW <= confidenceUpperMW`. 

---

## 11. AUTHENTICATION ARCHITECTURE
The system employs JWT (JSON Web Tokens) for stateless authentication. 
**Cryptographic Stack**: `bcrypt` (Passwords), `jsonwebtoken` (HMAC SHA-256 Signatures).

```text
[Client]
   | (1) POST /login { email, password }
   v
[Express API] -> bcrypt.compare() -> Valid?
   | (2) Generate JWT { userId, role }
   v
[Client] stores JWT locally.
   | (3) GET /protected + Header: "Authorization: Bearer <JWT>"
   v
[verifyAuth Middleware] -> Validates Signature & Expiration
```
Currently, the utilities (`password.js`, `jwt.js`) and the verification middleware exist. The public `/login` endpoint is scheduled for future implementation.

---

## 12. SECURE INITIAL ADMIN CREATION
**Implementation**: Milestone 7.2.1 (`server/scripts/createAdmin.js`)
To prevent severe security vulnerabilities, public registration is omitted. Instead, the first Administrator is bootstrapped via a server-side terminal script. 
* The script pulls credentials locally from `.env`.
* It hashes the password and pushes the Admin into the database.
* It features idempotency safeguards (`User.findOne`), silently safely aborting if an Admin already exists to prevent duplication.

---

## 13. JWT AUTHENTICATION MIDDLEWARE
**Component**: `verifyAuth` (`auth.middleware.js`)
This middleware protects endpoints by enforcing cryptographic token validation.
* **Header Inspection**: Strictly requires `Bearer ` schemes.
* **Payload Constraints**: Refuses valid JWTs if they lack a `userId` payload.
* **Statelessness**: It relies entirely on the HMAC signature to verify identity. It does **not** execute any MongoDB `User.findById()` lookups. This dramatically improves API response times.
* **Security**: Automatically obfuscates native errors (`TokenExpiredError`) into generic HTTP `401 Unauthorized` responses to stop enumeration attacks.

---

## 14. ROLE-BASED AUTHORIZATION
**Component**: `requireRole` (`role.middleware.js`)
This middleware answers "Is this user allowed here?" and operates immediately after `verifyAuth`.

```text
[JWT] -> [verifyAuth] -> req.user -> [requireRole('Admin')]
                                          |
                                   (Does req.user.role === 'Admin'?)
                                     /                         \
                                   YES                          NO
                                    |                           |
                                  next()                    HTTP 403
```
* **Separation of Concerns**: HTTP `401` implies "We don't know who you are." HTTP `403` implies "We know who you are, but you are not allowed."

---

## 15. SECURITY DESIGN
**Current Implementations**:
* Passwords hashed via 10-round `bcrypt`.
* Stateless Bearer JWT authentication (no session hijacking).
* Role-based Route Guarding.
* Blind `401/403` responses to prevent side-channel reconnaissance.
* Fatal backend startup traps if `JWT_SECRET` is missing in environment variables.
* Completely hidden `.env` configurations (Ignored by Git).

**Known Limitations**:
* Token revocation (blacklisting) is not yet implemented. If an account is suspended, their current JWT remains active until its explicit chronological expiration (`1d`).

---

## 16. API DESIGN
*(Endpoints currently active in the repository)*
**Method**: `GET`
**Endpoint**: `/api/v1/health`
**Purpose**: Validate backend online status and database connectivity.
**Auth Required**: No.
**Response**: `{ "success": true, "message": "Backend Running" }`

---

## 17. TESTING AND VALIDATION
Tests successfully completed and verified during development:

* **Database / Models**:
  * Forecast bounds: Verified that `lowerBound > predictedLoad` throws validation errors.
  * Telemetry load: Verified negative `actualLoadMW` is rejected.
  * User integrity: Verified duplicate emails throw MongoDB `E11000` errors.
* **Authentication (`verifyAuth`)**:
  * Missing headers, wrong schemes (e.g., `Basic`), tampered payloads, and explicitly expired tokens natively return `401`.
* **Authorization (`requireRole`)**:
  * Verified Admin can access Admin routes.
  * Verified Energy Analyst accessing Grid Operator routes natively returns `403`.
  * Verified empty `req.user.role` natively returns `403`.

---

## 18. DESIGN DECISIONS
**1. MongoDB Atlas instead of local MongoDB**
* *Reason*: Cloud hosting removes local installation complexity.
* *Benefit*: Easier team collaboration and simplified production deployment.

**2. Three collections instead of many**
* *Reason*: Over-normalizing data creates complex `JOIN` (lookup) pipelines.
* *Benefit*: Rapid querying, which is vital for ML ingestion speeds.

**3. Telemetry combines load + weather**
* *Reason*: Weather dictates electricity demand. They are chronologically intertwined.
* *Benefit*: A single query pulls all variables needed for the ML model.

**4. Non-unique forecast targetTime**
* *Reason*: Predictive models change. We may forecast 5:00 PM tomorrow using Model 1.0 today, and forecast 5:00 PM tomorrow using Model 2.0 tomorrow.
* *Benefit*: Preserves a historical audit trail of forecasting accuracy.

**5. Stateless verifyAuth (No DB query)**
* *Reason*: Querying the database on every single HTTP request just to verify a session is incredibly slow.
* *Benefit*: Instantaneous route protection leveraging CPU cryptography over I/O networking.

---

## 19. CURRENT SYSTEM FLOW
```text
[INITIALIZATION]
.env Credentials -> scripts/createAdmin.js -> MongoDB (Admin Created)

[HTTP PIPELINE]
Request -> Express -> verifyAuth -> requireRole -> (Controller/DB)
```

---

## 20. CURRENT IMPLEMENTATION STATUS
| Component | Status | Notes |
| :--- | :--- | :--- |
| Project Foundation | ✅ Implemented | Git, Folder structure |
| Frontend Foundation | ✅ Implemented | React, Vite, Tailwind UI |
| Backend Foundation | ✅ Implemented | Express, Morgan, Error Handlers |
| Database | ✅ Implemented | Mongoose, Atlas Connection |
| User / Telemetry / Forecast Models | ✅ Implemented | Schemas and Validation hooks |
| JWT Utilities / Initial Admin | ✅ Implemented | Secure bootstrapping |
| `verifyAuth` / `requireRole` | ✅ Implemented | Authentication & Authorization Guarding |
| Login API | ⏳ Planned | Controller pending |
| Telemetry / Forecast APIs | ⏳ Planned | Read/Write interfaces pending |
| ML Service / Dashboard | ⏳ Planned | External Python / React UI pending |
| Live Weather API | ⏳ Planned | Deferred for simplicity |

---

## 21. PROJECT DEVELOPMENT TIMELINE
| Milestone | Component | What was built | Status |
| :--- | :--- | :--- | :--- |
| **1-4** | Infrastructure | React UI, Express App, MongoDB connection | ✅ Done |
| **5** | DB Arch | Architectural planning for Collections | ✅ Done |
| **6.1 - 6.3** | Mongoose Models | `User`, `Telemetry`, `Forecast` schemas | ✅ Done |
| **7.1** | Auth Utils | `bcrypt` and `jwt` utilities | ✅ Done |
| **7.2.1** | Initial Admin | Server-side secure bootstrap script | ✅ Done |
| **7.2.2** | Auth Middleware | Stateless `verifyAuth` JWT checking | ✅ Done |
| **7.2.3** | RBAC Middleware | `requireRole` array checking | ✅ Done |

---

## 21.5. LOGIN API (Milestone 7.2.4)
**Endpoint**: POST /api/v1/auth/login
**Request Format**:
`json
{
  "email": "<ADMIN_EMAIL>",
  "password": "<PASSWORD>"
}
`
**Response Format**:
`json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "<USER_ID>",
      "name": "System Administrator",
      "email": "<ADMIN_EMAIL>",
      "role": "Admin"
    }
  }
}
`
**Authentication Flow**:
`	ext
User
 ?
POST /api/v1/auth/login
 ?
Validate request (email & password present)
 ?
Find user (by email)
 ?
Compare password (using bcrypt utility)
 ?
Check isActive (must be true)
 ?
Generate JWT
 ?
Return JWT
 ?
Client
`

**Security Decisions**:
* The API returns generic 401 Unauthorized: Invalid email or password for unknown emails, wrong passwords, and disabled accounts to completely prevent user enumeration.
* The API never returns the password or passwordHash in the response payload.
* The JWT generation strictly references existing utilities; no duplicate cryptographic implementations are introduced.

**Automated & Postman Test Results**:
Automated tests confirmed 17 boundary checks including successful generation (200), wrong credentials (401), missing payloads (400), and missing JWT sensitive fields. Postman testing confirmed the token could be decoded properly and utilized in Authorization: Bearer <JWT_TOKEN> headers.
## 21.6. PROTECTED API INTEGRATION (Milestone 7.2.5)
**Purpose**:
This milestone validated the entire authentication and authorization architecture end-to-end via an ephemeral HTTP test endpoint. It proved that the system correctly rejects unauthorized access and safely routes authorized access without leaking sensitive data or database secrets.

**Middleware Execution Order**:
The pipeline strictly enforces the following sequence:
`	ext
verifyAuth -> requireRole -> Endpoint Handler
`
* erifyAuth establishes *Identity* (Who is this user?) via JWT cryptography.
* 
equireRole establishes *Permissions* (Are they allowed here?) by inspecting the identity.

**Authentication vs Authorization Behavior**:
* **HTTP 401 (Authentication Failed)**: The token is missing, tampered with, expired, or malformed.
* **HTTP 403 (Authorization Failed)**: The token is mathematically valid, the user identity is known, but they lack the required role privileges.

**Integration Flow**:
`	ext
User
 ?
Login (POST /api/v1/auth/login)
 ?
JWT Token Generated
 ?
Bearer Token attached to Authorization Header
 ?
verifyAuth (Cryptographic Verification)
 ?
req.user populated
 ?
requireRole (Role Inspection)
 ?
Protected Resource Granted
`

**Automated Integration & Postman Testing Results**:

| Test | Expected | Actual | Status |
| :--- | :--- | :--- | :--- |
| No Authorization header | 401 | 401 | ? Passed |
| Invalid / Malformed token | 401 | 401 | ? Passed |
| Missing userId payload | 401 | 401 | ? Passed |
| Valid Admin JWT on Admin route | 200 | 200 | ? Passed |
| Valid Grid Operator JWT on Admin route | 403 | 403 | ? Passed |
| Valid Energy Analyst JWT on Admin route | 403 | 403 | ? Passed |

*(Note: The temporary test endpoint /api/v1/test/protected was safely removed from the repository after validation to maintain production hygiene).*
## 21.7. TELEMETRY API (Milestone 8.1)
**Purpose**:
The Telemetry API establishes the first major data ingestion pipeline for GridCast. It allows authorized users and authorized application clients to submit historical or real-time measurements combining electricity load and weather conditions.

**Endpoint**: POST /api/v1/telemetry

**Request Format**:
`json
{
  "timestamp": "2026-09-28T10:00:00.000Z",
  "actualLoadMW": 520.5,
  "temperatureC": 29.4,
  "humidity": 72
}
`

**Response Format** (HTTP 201 Created):
`json
{
  "success": true,
  "message": "Telemetry created successfully",
  "data": {
    "id": "<OBJECT_ID>",
    "timestamp": "2026-09-28T10:00:00.000Z",
    "actualLoadMW": 520.5,
    "temperatureC": 29.4,
    "humidity": 72
  }
}
`

**Authentication & Authorization**:
The endpoint relies on the previously tested middleware chain:
* erifyAuth: Enforces Bearer JWT verification.
* 
equireRole("Admin", "Grid Operator"): Energy Analysts are explicitly blocked (HTTP 403) from data ingestion, as their role is confined to data analysis and reporting.

**Validation Strategy**:
The API prevents garbage data at the controller level before it hits Mongoose. It ensures the timestamp is a valid chronological construct, ctualLoadMW is non-negative, 	emperatureC is a valid float, and humidity respects the strict 0-100 percentage bound.

**Duplicate Timestamp Behavior**:
Because the database defines a unique index on 	imestamp, Mongoose natively throws an E11000 duplicate key error when a collision occurs. The controller intentionally intercepts this and safely returns an HTTP 409 Conflict, preventing silent overwrites while preserving historical immutability.

**Telemetry API Request Flow**:
`	ext
Client
 ?
POST /api/v1/telemetry
 ?
verifyAuth (Cryptographic Verification)
 ?
requireRole (Admin, Grid Operator)
 ?
Request validation (Type & Bound checking)
 ?
Telemetry model validation (Mongoose)
 ?
MongoDB Atlas
 ?
201 Created
`

**Telemetry Validation Flow**:
`	ext
Request
 ?
Authentication
 ?
Authorization
 ?
Required fields?
 +-- No ? 400
 +-- Yes
       ?
Schema validation
       ?
Valid?
 +-- No ? 400
 +-- Yes
       ?
Duplicate timestamp?
 +-- Yes ? 409
 +-- No
       ?
MongoDB
       ?
201 Created
`

**Simple Telemetry Data Flow**:
`	ext
Electricity Load + Weather
          ?
       Telemetry
          ?
     MongoDB Atlas
          ?
 Historical Dataset
          ?
 Future ML Forecasting (PLANNED)
`

**Testing Results**:
* **Automated HTTP Integration Testing**: The API successfully passed all 17 automated integration tests covering the endpoint's validation behavior, duplicate timestamp conflicts, and role-based restrictions.
* **Manual Postman Testing**:
  1. Admin login ? 200 OK (Pass)
  2. Valid POST /api/v1/telemetry ? 201 Created (Pass)
  3. Negative actualLoadMW ? 400 Bad Request (Pass)
  4. Humidity = 120 ? 400 Bad Request (Pass)
  5. Duplicate timestamp ? 409 Conflict (Pass)
  6. No authentication ? 401 Unauthorized (Pass)
  7. *Note*: The Energy Analyst authorization restriction (403 Forbidden) was fully verified via automated tests but was NOT manually tested in Postman because an Energy Analyst account does not yet exist in the database.
## 22. VIVA-FRIENDLY EXPLANATIONS
**What is GridCast?**
* *Technical*: An integrated MERN+Python stack for time-series predictive analytics.
* *Simple*: A software tool that helps grid managers predict how much electricity people will use tomorrow.

**What is peak demand?**
* *Simple*: The time of day when the most electricity is being used at once (like 6 PM when everyone gets home and turns on the AC).

**What is telemetry?**
* *Simple*: The actual, real-world historical data measuring how much power was used and what the weather was like at that exact time.

**Why no database query in requireRole?**
* *Simple*: Because the JWT was cryptographically signed by our server. If the token hasn't been tampered with, we can perfectly trust the role embedded inside it without asking the database again.

**Difference between 401 and 403?**
* *Simple*: 401 means "I don't know who you are" (Invalid Token). 403 means "I know exactly who you are, but you aren't allowed in this room" (Invalid Role).

---

## 23. PLANNED/FUTURE IMPLEMENTATION
*(Note: These components are NOT yet implemented in the current repository)*
* **Authentication Controller**: API endpoints to exchange credentials for JWTs (`POST /api/v1/auth/login`).
* **CRUD Pipelines**: Interfaces to upload Telemetry and query Forecasts.
* **Python ML Microservice**: A FastAPI application housing `scikit-learn` or `XGBoost` for regression forecasting.
* **Interactive Dashboards**: React charting (e.g., Recharts) to visualize the uncertainty bounds visually on a graph.





