# Database Architecture Review Report

**Project Title**: AI-Based Smart Electricity Demand Forecasting and Grid Decision Support System  
**Review Date**: August 2, 2026  
**Auditor**: Principal Software Architect & Senior Database Review Committee  

---

## 1. Evaluation of Existing Collections

As a review committee, we challenged the previous database design to eliminate enterprise over-engineering and optimize it for a B.Tech final-year project scale while maintaining strict technical standards.

```
+------------------+     +------------------+     +------------------+
|      users       |     |   substations    |     |    telemetry     |
| (Keep - Auth)    |     | (Keep - Assets)  |     | (Merged - Metrics|
+------------------+     +--------+---------+     +--------+---------+
                                  |                        |
                                  v                        v
                         +--------+---------+     +--------+---------+
                         |    forecasts     |     | recommendations  |
                         | (Keep - History) |     | (Keep - DSS state|
                         +------------------+     +------------------+
```

### 1.1 `users`
* **Purpose**: Manages credential storage, sessions, and roles.
* **Necessity**: **Yes**. Required to secure endpoints, restrict configurations, and audit operator actions.
* **Simplification**: Retained. Role structure is simplified to an enum directly on the user document.

### 1.2 `substations`
* **Purpose**: Stores substation profile details and physical capacity limits (MW).
* **Necessity**: **Yes**. Storing capacity limits is essential so that the backend can dynamically compare forecasts and trigger peak exceedance recommendations.
* **Simplification**: Retained as a simple reference collection. We rejected hardcoding capacity limits in environment variables because grid layouts dynamically change.

### 1.3 `telemetry` (Unified Load & Weather Data)
* **Purpose**: Stores hourly load readings and co-located weather parameters.
* **Necessity**: **Yes**. This is the core dataset required to train the XGBoost model and plot historical curves.
* **Simplification**: **Merged**. We evaluated separating load readings and weather records into two collections but rejected it. Merging them into a single chronological `telemetry` document avoids heavy `$lookup` queries, facilitating fast data fetching for ML training.

### 1.4 `forecasts` (Prediction History)
* **Purpose**: Logs forecasting runs, predicted demand curves, and confidence limits.
* **Necessity**: **Yes**. Necessary to fulfill the objective of storing prediction history and displaying historical vs. predicted demand on the frontend.
* **Simplification**: Retained. Model metrics are embedded as simple strings, avoiding a separate `models` metadata collection.

### 1.5 `recommendations`
* **Purpose**: Tracks operational grid recommendations and operator responses.
* **Necessity**: **Yes**. A Grid Decision Support System requires saving recommendation states (Accepted/Rejected) to close the operator feedback loop.
* **Simplification**: Retained but simplified. Reduced relationship parameters to simple references, storing only active decisions.

### 1.6 `audit_logs`
* **Necessity**: **No**.
* **Reason for Removal**: **Removed**. For a B.Tech project, audit logging can be managed via standard application text files (using `Winston` or `Morgan` log streams) rather than adding database write load.

### 1.7 `reports`
* **Necessity**: **No**.
* **Reason for Removal**: **Removed**. Storing built binary files (like PDFs) in MongoDB is a database anti-pattern. Reports must be generated dynamically on-the-fly by the backend.

---

## 2. Approved Collection List & Relationships

The database architecture is streamlined down to **5 essential collections**:

```
1. users           --> Authentication, user settings
2. substations     --> Grid assets metadata & capacity limits
3. telemetry       --> Ingested historical load and weather variables
4. forecasts       --> Chronological demand prediction outputs
5. recommendations --> Decision support logs and operator actions
```

### Collection Relationships:
* `telemetry` refers to `substations` via `substationId` ($m:1$)
* `forecasts` refers to `substations` via `substationId` ($m:1$)
* `recommendations` refers to `substations` via `substationId` ($m:1$) and `forecasts` via `forecastId` ($m:1$)

---

## 3. Streamlined Schema Fields Definitions

### 3.1 `users`
* `_id`: `ObjectId` (Required, Unique)
* `name`: `String` (Required)
* `email`: `String` (Required, Unique, lowercase)
* `passwordHash`: `String` (Required)
* `role`: `String` (Required, Enum: `['Admin', 'Operator', 'Analyst']`)
* `isActive`: `Boolean` (Required, Default: `true`)

### 3.2 `substations`
* `_id`: `ObjectId` (Required, Unique)
* `name`: `String` (Required, Unique)
* `code`: `String` (Required, Unique, uppercase)
* `capacityMW`: `Number` (Required, Positive)

### 3.3 `telemetry`
* `_id`: `ObjectId` (Required, Unique)
* `substationId`: `ObjectId` (Required, Ref: `substations`)
* `timestamp`: `Date` (Required, UTC hourly timestamp)
* `actualLoadMW`: `Number` (Required, Positive)
* `temperatureC`: `Number` (Required)
* `humidity`: `Number` (Required, Range: 0-100)
* `solarIrradiance`: `Number` (Optional, Default: 0)

### 3.4 `forecasts`
* `_id`: `ObjectId` (Required, Unique)
* `substationId`: `ObjectId` (Required, Ref: `substations`)
* `forecastTime`: `Date` (Required) - Generation timestamp
* `targetTime`: `Date` (Required) - Hour of predicted demand
* `predictedLoadMW`: `Number` (Required, Positive)
* `confidenceLowerMW`: `Number` (Required)
* `confidenceUpperMW`: `Number` (Required)
* `modelVersion`: `String` (Required, e.g., `"v1.0"`)

### 3.5 `recommendations`
* `_id`: `ObjectId` (Required, Unique)
* `substationId`: `ObjectId` (Required, Ref: `substations`)
* `forecastId`: `ObjectId` (Required, Ref: `forecasts`)
* `targetTime`: `Date` (Required) - Target hour of breach
* `predictedPeakMW`: `Number` (Required)
* `actionType`: `String` (Required, Enum: `['Load Shedding', 'Generator Startup', 'Battery Dispatch']`)
* `suggestedReductionMW`: `Number` (Required)
* `status`: `String` (Required, Enum: `['Unresolved', 'Accepted', 'Rejected'], Default: 'Unresolved'`)
* `resolvedBy`: `ObjectId` (Optional, Ref: `users`)
* `resolvedAt`: `Date` (Optional)

---

## 4. Minimal Performance Indexes

We recommend setting up only the indexes necessary to ensure fast query response times:

1. **`telemetry`**: `{ substationId: 1, timestamp: -1 }` (Compound Index)
   * *Purpose*: Speeds up chronological telemetry queries for dashboard rendering and ML training pipelines.
2. **`forecasts`**: `{ substationId: 1, targetTime: 1 }` (Compound Index)
   * *Purpose*: Speeds up queries comparing actual and predicted load curves.
3. **`users`**: `{ email: 1 }` (Unique Index)
   * *Purpose*: Resolves authentication queries instantly.

---

## 5. Document Validation Rules

Mongoose validations should be used to enforce basic data integrity:
* **Grid Values**: `actualLoadMW` and `predictedLoadMW` must be non-negative.
* **Humidities**: `humidity` must fall within the range `0` to `100`.
* **Roles**: User roles are constrained to `Admin`, `Operator`, and `Analyst`.
* **Lower Bounds**: `confidenceLowerMW` must be less than or equal to `predictedLoadMW`.

---

## 6. Scalability & Future Compatibility Review

* **Multi-Region Support**: The schema handles multiple regions using the `substationId` field in `telemetry` and `forecasts`, allowing the database to scale horizontally.
* **Exogenous Weather Variables**: Weather variables are stored as flat fields inside the `telemetry` collection, making it easy to integrate additional telemetry indicators (e.g. wind velocity) later.
* **Model Versioning**: Storing a simple `modelVersion` string in the `forecasts` collection allows the system to easily track forecasting runs across different ML configurations.
* **API Consumer Scalability**: Returning structured JSON documents from the database allows the Express backend to easily support future web, desktop, or mobile clients.

---

## 7. Architecture Review Score & Recommendation

* **Simplification Rating**: **9.5/10** (Unnecessary enterprise log and binary report collections were successfully removed, saving database writes).
* **Viva / Academic Presentation Fit**: **10/10** (The schema is simple, logical, and easy for students to explain to reviewers).

I recommend this design for implementation.
