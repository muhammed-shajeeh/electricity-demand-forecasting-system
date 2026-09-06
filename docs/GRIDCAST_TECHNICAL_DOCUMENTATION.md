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
