# MongoDB Database Architecture Design

## Project Title
**AI-Based Smart Electricity Demand Forecasting and Grid Decision Support System**

---

## 1. Database Paradigm & Naming Conventions

### 1.1 Document-Oriented Paradigm
The system utilizes **MongoDB Atlas** as its persistence layer. The document model is optimized for high-write time-series telemetry data (load and weather metrics) and relational metadata (user roles, grid asset configurations, operational logs). 

### 1.2 Naming Conventions
* **Database Name**: `electricity_forecasting`
* **Collection Names**: Plural, lowercase, snake_case (e.g., `audit_logs`).
* **Field Names**: CamelCase, lowercase first letter (e.g., `predictedLoadMW`).
* **ID Fields**: Primary keys utilize MongoDB’s native `_id` field (represented as standard BSON `ObjectId`). Foreign keys use the referenced collection name in singular format suffixed with `Id` (e.g., `substationId`).
* **Timestamps**: All temporal fields utilize the ISO 8601 UTC format (`YYYY-MM-DDTHH:mm:ss.sssZ`) to prevent timezone offset discrepancies.

---

## 2. Entity-Relationship Model (Conceptual)

Although MongoDB is non-relational, data integrity is maintained using Mongoose-enforced references:

```
                  +-------------------+
                  |       users       |
                  +---------+---------+
                            |
                            | (resolvedBy / userId)
                            v
+-----------------+1      m+-------------------+
|   substations   +------->+     telemetry     |
+--------+--------+        +-------------------+
         |
         | 1
         v m
+--------+--------+1      m+-------------------+
|    forecasts    +------->+  recommendations  |
+-----------------+        +-------------------+
```

* **substations $\rightarrow$ telemetry**: One-to-Many ($1:\infty$) reference. One substation holds millions of hourly telemetry documents.
* **substations $\rightarrow$ forecasts**: One-to-Many ($1:\infty$) reference. One substation has many generated forecasting entries.
* **forecasts $\rightarrow$ recommendations**: One-to-Many ($1:\infty$) reference. One forecast exceedance triggers specific operational recommendations.
* **users $\rightarrow$ recommendations**: One-to-Many ($1:\infty$) reference tracking which Operator accepted/rejected the recommendation.
* **users $\rightarrow$ audit_logs**: One-to-Many ($1:\infty$) tracking admin/operator action trails.

---

## 3. Detailed Collection Schemas

### 3.1 `users` Collection
Stores credential, authorization, and status metadata for the system users.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `name` | `String` | Yes | No | None | Trimmed, minimum length: 2 chars |
| `email` | `String` | Yes | Yes | None | Regular expression validation for email formatting, lowercase |
| `passwordHash`| `String` | Yes | No | None | Hashed with bcrypt (60 characters) |
| `role` | `String` | Yes | No | None | Enum: `['Admin', 'Grid Operator', 'Energy Analyst']` |
| `isActive` | `Boolean` | Yes | No | `true` | Allows deactivating users without deleting historical logs |
| `createdAt` | `Date` | Yes | No | Current Date | Timestamp of account registration |
| `updatedAt` | `Date` | Yes | No | Current Date | Timestamp of last metadata change |

---

### 3.2 `substations` Collection
Stores metadata of physical substations and transmission hubs, including maximum Megawatt capacities.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `name` | `String` | Yes | Yes | None | Trimmed, e.g., `"Substation North-Sector 01"` |
| `code` | `String` | Yes | Yes | None | Capitalized alphanumeric, e.g., `"SUB_NORTH_01"` |
| `capacityMW` | `Number` | Yes | No | None | Floating point, must be greater than `0` |
| `location` | `Object` | No | No | None | Nested coordinates object containing: |
| `location.lat`| `Number` | Yes* | No | None | *Required if location object exists. Range: `-90` to `90` |
| `location.lng`| `Number` | Yes* | No | None | *Required if location object exists. Range: `-180` to `180` |
| `createdAt` | `Date` | Yes | No | Current Date | Timestamp of record creation |
| `updatedAt` | `Date` | Yes | No | Current Date | Timestamp of last rating configuration change |

---

### 3.3 `telemetry` Collection
Contains the hourly actual load telemetry (MW) and corresponding weather covariates.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `substationId`| `ObjectId` | Yes | No | None | Refers to `substations._id` (indexed) |
| `timestamp` | `Date` | Yes | No | None | Normalized hourly interval marker, UTC timezone |
| `actualLoadMW`| `Number` | Yes | No | None | Must be non-negative. Boundary limits checked |
| `weather` | `Object` | Yes | No | None | Nested weather parameters: |
| `weather.tempC`| `Number` | Yes | No | None | Temperature in Celsius (e.g., `-30.0` to `60.0`) |
| `weather.humidity`| `Number`| Yes | No | None | Relative humidity percentage (Range: `0` to `100`) |
| `weather.solar`| `Number` | No | No | `0.0` | Solar irradiance index in $W/m^2$ (Positive value) |
| `weather.wind` | `Number` | No | No | `0.0` | Wind speed in $m/s$ (Positive value) |
| `isInterpolated`| `Boolean`| Yes | No | `false` | Set to `true` if raw data gaps were linearly filled |
| `createdAt` | `Date` | Yes | No | Current Date | Database timestamp of record insertion |

---

### 3.4 `forecasts` Collection
Stores rolling hourly predictions and boundaries generated by the XGBoost pipeline.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `substationId`| `ObjectId` | Yes | No | None | Refers to `substations._id` (indexed) |
| `forecastTime`| `Date` | Yes | No | None | Timestamp when the ML engine ran prediction queries |
| `targetTime` | `Date` | Yes | No | None | Target timestamp being predicted |
| `predictedLoadMW`| `Number` | Yes | No | None | Predicted demand value in Megawatts |
| `confidenceLowerMW`| `Number`| Yes | No | None | Lower 95% prediction interval (must be $\le$ predicted) |
| `confidenceUpperMW`| `Number`| Yes | No | None | Upper 95% prediction interval (must be $\ge$ predicted) |
| `modelVersion`| `String` | Yes | No | None | Model identification identifier, e.g., `"model_v2.0.3"` |
| `createdAt` | `Date` | Yes | No | Current Date | Insertion timestamp |

---

### 3.5 `recommendations` Collection
Stores system warnings and operational mitigation cards resolved by Operators.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `substationId`| `ObjectId` | Yes | No | None | Refers to `substations._id` |
| `forecastId` | `ObjectId` | Yes | No | None | Refers to `forecasts._id` mapping the exceedance trigger |
| `triggerTime` | `Date` | Yes | No | None | Timestamp of the warning limit breach calculation |
| `targetTime` | `Date` | Yes | No | None | Date and hour block where capacity is predicted to fail |
| `predictedPeakLoadMW`| `Number`| Yes | No | None | Max predicted demand value during targetTime |
| `thresholdLimitMW`| `Number` | Yes | No | None | Substation limit when warning triggered (capacity rating) |
| `actionType` | `String` | Yes | No | None | Enum: `['Load Shedding', 'Generator Startup', 'Battery Dispatch']` |
| `suggestedReductionMW`| `Number`| Yes | No | None | Amount of load to reduce (in MW) to clear threshold |
| `status` | `String` | Yes | No | `"Unresolved"`| Enum: `['Unresolved', 'Accepted', 'Rejected', 'Executed']` |
| `operatorNotes`| `String` | No | No | None | Optional text entered during response |
| `resolvedBy` | `ObjectId` | No | No | None | Refers to `users._id` of responder |
| `resolvedAt` | `Date` | No | No | None | Timestamp when operator logged action |
| `createdAt` | `Date` | Yes | No | Current Date | Timestamp when system logged card |
| `updatedAt` | `Date` | Yes | No | Current Date | Update timestamp |

---

### 3.6 `audit_logs` Collection
Immutable record tracking system access and critical configuration revisions.

| Field | Data Type | Required | Unique | Default Value | Validation Rules / Notes |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `_id` | `ObjectId` | Yes | Yes | Auto-generated | Native BSON identifier |
| `userId` | `ObjectId` | Yes | No | None | Refers to `users._id` (actor) |
| `action` | `String` | Yes | No | None | Enum: `['USER_LOGIN', 'LIMIT_CONFIG', 'REC_RESOLVE', 'USER_PROVISION']` |
| `description` | `String` | Yes | No | None | Comprehensive textual details of modification |
| `ipAddress` | `String` | Yes | No | None | Client IP source string |
| `createdAt` | `Date` | Yes | No | Current Date | Execution timestamp (Read-Only) |

---

## 4. Indexing Recommendations

To maintain sub-second response times across large time-series datasets, the following indexing configuration must be set up in MongoDB:

```
[ Collection: telemetry ]
 ├── Index 1 (Compound): { substationId: 1, timestamp: -1 }  <-- Fetching historic sequences
 └── Index 2 (TTL):      { createdAt: 1 }                    <-- Automatic old records cleanup

[ Collection: forecasts ]
 └── Index 1 (Compound): { substationId: 1, targetTime: 1 }  <-- Fetching dashboard curves

[ Collection: recommendations ]
 └── Index 1 (Single):   { status: 1 }                       <-- Instant query for Unresolved alerts
```

### Indexing Specifications:
1. **`telemetry` $\rightarrow$ `{ substationId: 1, timestamp: -1 }` (Compound)**:
   * *Purpose*: Critical for loading dashboards and training pipelines. Avoids memory-heavy sorts by indexing on chronological sequences.
2. **`forecasts` $\rightarrow$ `{ substationId: 1, targetTime: 1 }` (Compound)**:
   * *Purpose*: Speeds up dashboard queries plotting the actual vs. predicted curves for a specific time range.
3. **`recommendations` $\rightarrow$ `{ status: 1 }` (Single)**:
   * *Purpose*: Allows the server to query only active, unresolved alerts to push over Websockets.
4. **`users` $\rightarrow$ `{ email: 1 }` (Single)**:
   * *Purpose*: Speeds up authentication checks during sign-in.

---

## 5. Document Validation Rules

MongoDB Schema Validation (JSON Schema) should be enforced at the database level to ensure data integrity:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": [ "substationId", "timestamp", "actualLoadMW" ],
    "properties": {
      "actualLoadMW": {
        "bsonType": "number",
        "minimum": 0,
        "description": "Must be a non-negative number representing load in Megawatts"
      },
      "weather": {
        "bsonType": "object",
        "required": [ "tempC", "humidity" ],
        "properties": {
          "humidity": {
            "bsonType": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Relative humidity percentage must be between 0 and 100"
          }
        }
      }
    }
  }
}
```

---

## 6. Future ML Compatibility

* **Lag Features Engineering**: The ML service requires reading consecutive load values to calculate lag sequences ($t-1, t-2, \dots, t-24$). This relies on the compound index `{ substationId: 1, timestamp: 1 }` to fetch chronological telemetry data efficiently.
* **Exogenous Weather Variables**: Weather variables are nested in `weather` subdocuments, allowing the Python service to easily extract features like solar index or temperature to use as prediction inputs in XGBoost.
* **Forecast Version Audits**: Storing the `modelVersion` string alongside prediction points allows for direct accuracy audits, making it easy to compare and flag model drift over time.

---

## 7. Scalability Configurations

For a final-year B.Tech project, standard collections are sufficient. However, to show system scalability:

* **MongoDB Time-Series Collections (Native)**: In production, configure the `telemetry` collection as a native MongoDB Time-Series collection using `substationId` as the metadata field and `timestamp` as the time field. This reduces disk storage usage and optimizes memory caching.
* **Data Lifespan Policy (TTL Indexes)**: Use a Time-To-Live (TTL) index on the `telemetry` collection to automatically archive or delete hourly telemetry older than 5 years, keeping index sizes within memory limits.
* **Partitioning Strategy (Sharding)**: If expanding to support regional grids, shard the collections using `substationId` as the shard key, distributing the read and write loads across multiple database instances.
