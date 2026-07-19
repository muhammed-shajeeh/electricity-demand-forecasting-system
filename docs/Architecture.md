# System Architecture Blueprint

## Project Title
**AI-Based Smart Electricity Demand Forecasting and Grid Decision Support System**

---

## 1. Overall Software Architecture

The system utilizes a **Layered Monolithic Architecture** with a decoupled **Machine Learning Execution Service**. This approach ensures separation of concerns and clear boundary interfaces while avoiding the overhead of fully distributed microservices, making it ideal for a B.Tech final-year project.

```
+-------------------------------------------------------------+
|                     PRESENTATION LAYER                      |
|            React.js SPA / Tailwind CSS (Client)             |
+------------------------------+------------------------------+
                               | HTTPS / JSON / WebSockets
                               v
+-------------------------------------------------------------+
|                       BUSINESS LAYER                        |
|        Express.js Backend / Controllers & Services          |
+-------------------+---------------------+-------------------+
                    |                     |
                    | localhost HTTP      | Mongoose ODM
                    v                     v
+-------------------+---------+   +-------+-------------------+
|             ML LAYER        |   |     PERSISTENCE LAYER     |
|      Python Inference Host  |   |       MongoDB (Data)      |
+-----------------------------+   +---------------------------+
```

### Explanation of Layers:
* **Presentation Layer**: Client-facing web interfaces built with React.js and Tailwind CSS. It is entirely stateless, managing view-state and formatting raw metrics for display.
* **Business Layer**: The core orchestrator built with Node.js and Express.js. It handles routing, authorization rules, telemetry validations, and decides when to trigger inference pipelines or alert sequences.
* **ML Layer**: The computational core containing Python script modules and XGBoost models. It operates as a local execution service, keeping model weights hot in memory to generate forecasts on demand.
* **Persistence Layer**: Document-oriented data storage running on MongoDB, managed via Mongoose ODM for validation and object mapping.
* **Infrastructure Layer**: Cross-cutting utilities containing the logging subsystem, file exporting services, cryptographic functions, and scheduling engines.

---

## 2. Layered Architecture Deep Dive

```
                                      +-------------------------+
                                      |   Presentation Layer    |
                                      |  (React SPA / Context)  |
                                      +------------+------------+
                                                   |
                                                   | HTTP REST / JSON
                                                   v
+--------------------------------------------------+--------------------------------------------------+
| Business Layer (Node/Express API Gateway)                                                           |
|                                                                                                     |
|    +------------------------+      +------------------------+      +------------------------+       |
|    |      Routing & auth    | ---> |   Business Services    | ---> |      Data Models       |       |
|    |      (Controllers)     |      |    (GridLogic, Recs)   |      |    (Mongoose Schemas)  |       |
|    +------------------------+      +------------------------+      +------------------------+       |
+--------------------------------------------------+-----------------------------+--------------------+
                                                   |                             |
                                                   | Local REST API              | MongoDB Protocol
                                                   v                             v
                                      +------------+------------+   +------------+------------+
                                      |         ML Layer        |   |    Persistence Layer    |
                                      |     (Python Service)    |   |     (MongoDB Instance)  |
                                      +-------------------------+   +-------------------------+
```

### 2.1 Presentation Layer
* **Responsibilities**: 
  * Render dashboards, interactive load-curve visualizations, alert dialogs, and model training forms.
  * Manage local client sessions (JWT extraction and storage in memory).
  * Validate UI input formats before making API calls.
* **Key Design Rules**: Zero database or ML library direct dependencies. Communication occurs solely via the Business Layer API.

### 2.2 Business Layer
* **Responsibilities**:
  * Execute route mappings, decrypt/verify incoming user tokens, and enforce RBAC (Role-Based Access Control) policies.
  * Ingest telemetry variables, interpolate missing readings, and initiate database writes.
  * Forward inference requirements to the ML layer and run recommendation heuristic engines on the predictions returned.
* **Key Design Rules**: Fully decoupled from Python dependency execution. Any Python interactions are abstracted through service utilities.

### 2.3 ML Layer
* **Responsibilities**:
  * Perform mathematical preprocessing (lag generation, time-encoding, min-max normalization).
  * Load and query model files to produce output predictions and calculate confidence boundaries.
  * Train and optimize model parameters, and output metrics reports (RMSE, MAPE).
* **Key Design Rules**: Keep inference engines decoupled from MongoDB access by receiving all required data in JSON input arrays from the Business Layer.

### 2.4 Persistence Layer
* **Responsibilities**:
  * Store grid metrics, user profiles, model weights, recommendation states, and audit trails.
  * Enforce schema configurations and maintain query indexes on timestamp and location fields.
* **Key Design Rules**: Accessible only by the Business Layer. The ML Layer should write model weights to files or output streams, which the Business Layer then catalogs in MongoDB.

### 2.5 Infrastructure Layer
* **Responsibilities**:
  * Execute cross-cutting requirements: logging, background timers, JWT signature creation, and output report compilation.
* **Key Design Rules**: Must remain independent of domain logic, acting purely as utility services.

---

## 3. Communication Flow

The system runs a **Synchronous Control Flow** for configuration commands, and a **Decoupled Asynchronous Processing Flow** for numerical modeling tasks.

```
[React Client] --------( 1. HTTPS POST /telemetry )--------> [Express Backend]
                                                                   |
                                                                   | ( 2. Write Actuals )
                                                                   v
                                                            [(MongoDB Volume)]
                                                                   |
                                                                   | ( 3. Acknowledge )
                                                                   v
[React Client] <-------( 4. Ingestion Successful )----------- [Express Backend]

--------------------------------------------------------------------------------

[Express Backend] -----( 5. Local POST /forecast )---------> [Python ML Engine]
                                                                   |
                                                                   | ( 6. Load Weights & Run XGBoost )
                                                                   v
[Express Backend] <----( 7. Return Forecast Matrix JSON )---- [Python ML Engine]
       |
       | ( 8. Save Forecasts & Compute Alerts )
       v
[(MongoDB Volume)]
```

### Sequential Pipeline:
1. **React $\rightarrow$ Express**: The client sends a payload containing recent telemetry via a secure HTTP request, or requests a new forecast.
2. **Express $\rightarrow$ MongoDB**: The backend validates the input structures, writes actual telemetry rows to MongoDB, and returns an ingestion success status to the client.
3. **Express $\rightarrow$ Python ML**: To generate a forecast, the backend posts actual sequences (e.g., the last 72 hours of load and weather covariates) to a local Python daemon running on a localhost port.
4. **Python ML Processing**: The ML daemon builds lag vectors, runs the active XGBoost model, calculates prediction intervals, and returns a JSON payload to the Express server.
5. **Express $\rightarrow$ MongoDB**: Express saves the generated forecast records and compares them to maximum grid capacities to determine if any thresholds are breached.
6. **Response Delivery**: Express returns the completed forecast array to the React client, and broadcasts any threshold breach alerts via a live WebSocket connection.

---

## 4. Authentication & Authorization Flow

The system utilizes stateless **JSON Web Tokens (JWT)** to manage authentication, enforcing Role-Based Access Control (RBAC) at the middleware level on the backend.

```
User (Browser)               React Application               Express API Gateway               MongoDB
      |                              |                               |                            |
      |--- 1. Credentials (Login) -->|                               |                            |
      |                              |--- 2. POST /api/auth/login -->|                            |
      |                              |                               |--- 3. Find User By Email ->|
      |                              |                               |<-- 4. Return Hashed User --|
      |                              |                               |                            |
      |                              |                               |-- 5. Compare Password      |
      |                              |                               |      (bcrypt)              |
      |                              |                               |                            |
      |                              |                               |-- 6. Sign JWT with Role    |
      |                              |<-- 7. Return Token & Role ----|                            |
      |                              |       (JSON Response)         |                            |
      |<-- 8. Save Token in Memory --|                               |                            |
```

### 4.1 Login Process & Token Issuance
1. The user inputs their username and password into the React client.
2. The client submits a POST request containing credentials over HTTPS.
3. The Express controller retrieves the user record from MongoDB, checks account status, and compares the password using `bcrypt`.
4. If valid, the server signs a JWT payload containing:
   * `userId`: Unique database reference
   * `role`: User classification (`Admin`, `Operator`, `Analyst`)
   * `exp`: Expiration epoch timestamp (8 hours from generation)
5. The server returns the signed token and user role payload in a JSON response. The React client stores this token in memory (or secure session storage) for subsequent API requests.

### 4.2 Protected Routes & Middleware
* **React Route Guard**: A client-side router wrapper checks the user's role before mounting protected routes. Users attempting unauthorized access are redirected to the Login page.
* **Express Authentication Middleware**: Evaluates incoming headers. If the request lacks an `Authorization: Bearer <Token>` header, or if the token has expired, it returns an `HTTP 401 Unauthorized` response.
* **Express RBAC Authorization Middleware**: Evaluates the role embedded in the decrypted token. If the endpoint requires `Admin` clearance and the token lists `Operator`, it returns an `HTTP 403 Forbidden` response.

---

## 5. Forecasting Flow

```
[Dataset Upload] ---> [API Controller] ---> [Validation Service] ---> [MongoDB Log]
                                                                            |
                                                                            v
[Python ML Daemon] <-- (Send Lag Features) <-- [Inference Service] <--------+
        |
        +---> [XGBoost Model Pipeline] ---> [Generate Predictions & Confidence Limits]
                                                                            |
                                                                            v
[React UI Dashboard] <--- (HTTP Response JSON) <--- [Express Controller] <--+
```

1. **Upload Trigger**: An Analyst uploads a new load spreadsheet (CSV format) or updates telemetry via the React interface.
2. **File Ingestion**: The Express controller receives the payload, parses the records, runs validation checks, and saves the data to the MongoDB telemetry collection.
3. **Trigger Inference**: The system schedules an inference loop (or handles an analyst's manual request). The backend queries the database for the active model's metadata and retrieves the required input data.
4. **ML Inference execution**:
   * The backend forwards the input feature vectors to the local Python ML service.
   * The Python pipeline uses Pandas to process calendar variables and lag metrics.
   * The XGBoost model calculates prediction points, and standard error matrices determine the 95% confidence limits.
5. **Output Cataloging**: The Python service returns a JSON object array to the Express backend. The backend saves the prediction rows to MongoDB, linking them to the active model version.
6. **UI Render**: The backend sends the forecast records to the React dashboard, which plots the forecasted curves and confidence intervals.

---

## 6. Decision Support Flow

Recommendations are generated programmatically following a rule-based algorithm triggered by forecast updates.

```
       +------------------------------------+
       | New Forecast Array Saved to DB     |
       +-----------------+------------------+
                         |
                         v
       +-----------------+------------------+
       | Scan points for limit exceedances  |
       +-----------------+------------------+
                         |
      No Peak Predicted  |  Peak Detected (>90% Capacity)
      +------------------+------------------+
      |                                     |
      v                                     v
+-----+------+                +-------------+-------------+
| Do Nothing |                | Query Active Resource DB  |
+------------+                | (Generators, Batteries)   |
                              +-------------+-------------+
                                            |
                                            v
                              +-------------+-------------+
                              | Run Advisory Heuristics   |
                              | (Mitigation Plan)         |
                              +-------------+-------------+
                                            |
                                            v
                              +-------------+-------------+
                              | Save Recommendation Card  |
                              | & Alert websocket clients |
                              +---------------------------+
```

### Recommendation Generation Steps:
1. **Trigger Evaluation**: When a new forecast sequence is saved, the system checks each hour in the forecast against the substation's capacity limit.
2. **Detect Exceedance**: If a predicted hourly load exceeds 90% of capacity, the system triggers the Decision Support Engine (DSE).
3. **Query Resources**: The engine queries MongoDB for available mitigation resources:
   * Peak output limits of connected auxiliary generators.
   * Total state-of-charge capacity of grid batteries.
   * Contracted peak-load reduction agreements with industrial customers.
4. **Run Advisory Heuristics**:
   * *If Peak is between 90% and 95%*: Generate a battery dispatch plan to shave the peak.
   * *If Peak is between 95% and 98%*: Generate an auxiliary generator startup recommendation (specifying target MW and start time).
   * *If Peak is >98%*: Generate a combined backup generator and target circuit load-shedding proposal.
5. **Store & Broadcast**: The recommendation is saved to MongoDB in an `Unresolved` state. The backend pushes a WebSocket alert to the active Grid Operator dashboards, highlighting the recommendation card.

---

## 7. System Components

### 7.1 React Frontend Components
* **Dashboard View**: Plots the primary demand and forecast curves. Integrates chart controls for time ranges and target substation selection.
* **Alert Feed Component**: Displays persistent warnings for current and future peak overloads. Includes interaction buttons to open mitigation recommendations.
* **Model Configuration Form**: Allows analysts to view model performance metrics and input hyper-parameters for retraining.
* **User Management Console**: Admin-only panel for managing user accounts and updating substation capacity limits.

### 7.2 Express.js Backend Components
* **API Gateway Router**: Map client requests to their respective route controllers, enforcing CORS and rate-limiting rules.
* **Authentication Controller**: Coordinates user credentials, password encryption checks, and JWT token issuance.
* **Forecasting Controller**: Formulates data requests for the ML engine and saves forecasting records back to MongoDB.
* **Recommendation Engine**: Rules-based service that monitors forecast records and compiles mitigation proposals.
* **Websocket Alert Broadcast Manager**: Maintains active TCP socket connections to push real-time alerts to logged-in operators.

### 7.3 Python ML Pipeline Components
* **Flask/FastAPI Local Host**: A lightweight API wrapper that exposes local endpoints on the host server, keeping XGBoost in memory to avoid process startup delays.
* **Data Prep Pipeline**: Formats raw telemetry datasets into Pandas DataFrames, performing temporal feature engineering.
* **XGBoost Inference Module**: Loads model weights from files to generate demand predictions and confidence intervals.
* **XGBoost Retraining Module**: Fits the XGBoost model on historical data inputs and exports performance reports.

---

## 8. Background Jobs

To ensure consistent grid monitoring and prevent performance bottlenecks during user interactions, the system schedules several background jobs using a local scheduling utility (like `node-cron`):

1. **Telemetry Feed Polling (Hourly)**:
   * *Interval*: Every 60 minutes.
   * *Action*: Polls the simulated grid APIs or external CSV drop zones for new hourly actual load metrics, saving them to MongoDB.
2. **Forecast Update Cycle (Hourly)**:
   * *Interval*: Every hour (immediately following telemetry collection).
   * *Action*: Sends the last 72 hours of telemetry to the Python service to update the rolling 72-hour forecast, saving the outputs to MongoDB and checking for peak exceedances.
3. **Weather Metric Collection (Every 3 hours)**:
   * *Interval*: Every 180 minutes.
   * *Action*: Queries external weather APIs for actual and forecasted weather variables (temperature, humidity), caching them locally.
4. **Data Purging and Archiving (Monthly)**:
   * *Interval*: First day of each month.
   * *Action*: Compresses and archives historical hourly telemetry older than 5 years to lower active MongoDB index memory footprints.

---

## 9. Caching Strategy

To minimize database load and ensure responsive dashboard interactions, the system implements a caching strategy:

```
                  +--------------------------------+
                  |  Client Dashboard Request      |
                  +---------------+----------------+
                                  |
                                  v
                  +---------------+----------------+
                  |  Check Cache (Memory Store)    |
                  +---------------+----------------+
                                  |
                  Found In Cache  |  Cache Miss
                  +---------------+----------------+
                  |                                |
                  v                                v
       +----------+-----------+       +------------+-----------+
       | Return Cached Payload |       | Query MongoDB Database |
       +----------------------+       +------------+-----------+
                                                   |
                                                   v
                                      +------------+-----------+
                                      | Store in Cache & return|
                                      +------------------------+
```

### Implementation Guidelines:
* **Memory-Based Caching**: The Express backend uses an in-memory cache (like `node-cache`) to store read-heavy, low-write data.
* **Target Datasets**:
  * *Substation Configurations*: Cached indefinitely. The cache invalidates only when an administrator updates capacity ratings.
  * *Active Forecasting Plots*: Cached for 30 minutes. New inference runs invalidate the forecast cache immediately.
  * *Weather Observations*: Cached for 60 minutes, matching the external weather service API update frequency.

---

## 10. Logging Strategy

The logging infrastructure uses a centralized logging library (such as Winston for Node.js) to format logs for easy auditing and troubleshooting.

```
+-----------------------------------------------------------+
|                      Logging Pipeline                     |
+-----------------------------------------------------------+
    |
    +---> Standard Output (Console) -> Dev Debugging
    |
    +---> Application Log Storage:
             |
             +---> info.log (Info events, login actions)
             |
             +---> error.log (System errors, network drops)
             |
             +---> audit.log (User modifications, DB settings)
```

### Logging Configuration Guidelines:
* **Standardized JSON Format**: Every log entry includes: `timestamp` (UTC), `logLevel`, `serviceName`, `requestId` (for request tracing), and `message`.
* **Output Log Targets**:
  * *Console Stream*: Writes color-coded readable output for development debugging.
  * *`info.log`*: Logs application lifecycle milestones, user login activities, and forecasting cycles.
  * *`error.log`*: Logs database timeouts, Python execution errors, and invalid validation structures.
  * *`audit.log`*: Tracks security-sensitive actions (e.g., user creations, changes to capacity limits, and recommendation status updates).

---

## 11. Error Handling Strategy

The application enforces a **Centralized Error Handling Architecture** to catch exceptions at the boundaries of each layer, preventing app crashes and securing internal execution details.

```
       +------------------------------------+
       |  Request Handled in Route          |
       +-----------------+------------------+
                         |
                         | Exception Raised / Caught
                         v
       +-----------------+------------------+
       | Forward to Global Error Middleware |
       +-----------------+------------------+
                         |
                         v
       +-----------------+------------------+
       |   Parse Exception Class Type       |
       +-----------------+------------------+
                         |
     +-------------------+-------------------+
     |                   |                   |
     v                   v                   v
[Validation Error]   [Database Error]    [ML Pipeline Error]
  - Return HTTP 400    - Return HTTP 503   - Return HTTP 502
  - List field rules   - Mask DB schema    - Trigger backup forecast
                       - Log error stack
```

### Error Mitigation Policies:
* **Global Express Handler**: All routes are wrapped to catch exceptions. Unhandled errors are routed to a global Express error handler, preventing process crashes and returning standardized error JSON payloads.
* **ML Process Fault Recovery**: If the Python inference service crashes, the backend catches the error, logs the stack trace in `error.log`, and generates a fallback forecast using historical seasonal averages.
* **Database Disconnection Recovery**: If MongoDB disconnects, Mongoose queues incoming operations, while Express flags the system state as "Degraded - Offline Database Mode" and returns cached dashboard data.
* **Input Validation Exceptions**: If input data fails validation, Express rejects the request with an `HTTP 400 Bad Request` code, returning a structured JSON list of validation errors for the React client to display.

---

## 12. Security Architecture

```
                    +-----------------------------+
                    | Incoming Client Connection  |
                    +--------------+--------------+
                                   |
                                   v
                    +--------------+--------------+
                    | CORS & TLS 1.3 Checks       |
                    +--------------+--------------+
                                   |
                                   v
                    +--------------+--------------+
                    | Express Rate-Limiter        |
                    +--------------+--------------+
                                   |
                                   v
                    +--------------+--------------+
                    | Helmet HTTP Headers         |
                    +--------------+--------------+
                                   |
                                   v
                    +--------------+--------------+
                    | JSON Body Input Validation  |
                    +--------------+--------------+
                                   |
                                   v
                    +--------------+--------------+
                    | Controller Logic Execution  |
                    +-----------------------------+
```

### Key Security Policies:
* **Authentication**: Enforced using secure HTTP-only cookies to store JWT tokens, preventing Cross-Site Scripting (XSS) access.
* **Authorization**: Explicit RBAC middleware checks route-access permissions before executing business logic.
* **Validation**: Input payloads are verified against defined Mongoose schemas and sanitization libraries before processing.
* **Rate Limiting**: Limits API endpoints to 100 requests per 15-minute window per IP to defend against automated brute-force attempts.
* **CORS Policy**: Configured strictly to whitelist only the domains hosting the React frontend.
* **Input Sanitization**: Encodes raw input variables to block SQL/NoSQL injection and Cross-Site Scripting (XSS) scripts.

---

## 13. Deployment Architecture

For a final-year B.Tech project, we propose a clean **Virtual Private Server (VPS) Deployment** model, avoiding the complexity of Docker/Kubernetes while keeping development and production environments consistent.

### 13.1 Development Environment
* **Local Workspace**:
  * React client runs on `localhost:3000`.
  * Node/Express server runs on `localhost:5000`.
  * Python ML daemon runs on `localhost:8000`.
  * MongoDB runs locally as a community server instance on port `27017`.
* **Testing Execution**: Manual triggers via local client dashboards.

### 13.2 Production Deployment (Single-Instance VPS)
* **Hosting Platform**: A single Ubuntu Linux VPS (e.g., DigitalOcean, AWS EC2, Render).
* **PM2 Process Manager**: Manages both the Node.js backend processes and the Python ML service, monitoring resource footprints and automatically restarting processes if they crash.
* **Nginx Reverse Proxy**: Acts as the system's entry point, routing external requests to the Express server, managing TLS certificates, and serving built React static files directly from disk.
* **MongoDB Community Server**: Runs locally on the VPS, binding only to `127.0.0.1` to prevent direct external access.

```
       +---------------------------------------------+
       |               Virtual Private Server (VPS)  |
       |                                             |
       |  [ Nginx Proxy Server (TLS 1.3 / Port 443) ]|
       |                   |                         |
       |         +---------+---------+               |
       |         | Route REST        | Serve Static  |
       |         v                   v               |
       |    [PM2: Express]     [Built React Files]   |
       |         |                                   |
       |    +----+----+                              |
       |    |         |                              |
       |    v         v                              |
       |  [PM2: ML] [Local MongoDB]                  |
       +---------------------------------------------+
```

---

## 14. Third-Party Dependencies

To keep the project lightweight and robust, third-party integrations are kept to a minimum:

* **React Ecosystem**:
  * `axios`: Promise-based HTTP client for API communication.
  * `recharts`: D3-based interactive charting library.
* **Express Ecosystem**:
  * `mongoose`: MongoDB object modeling tool.
  * `bcryptjs`: Secure password hashing utility.
  * `jsonwebtoken`: JWT implementation for Node.js.
  * `cors` and `helmet`: Middleware libraries for API request security.
* **Python Ecosystem**:
  * `xgboost`: Machine learning model library.
  * `scikit-learn`: Data preprocessing and model scoring tools.
  * `pandas` and `numpy`: Numerical processing and tabular data analysis libraries.

---

## 15. Complete Architecture Diagram (Text)

```
========================================================================================
                                     REACT FRONTEND CLIENT
========================================================================================
[ Views ] Dashboard View   |   Model Configurations   |   Alert Logs   |   Admin Panels
             |                     |                        |               |
             +---------------------+------------------------+---------------+
                                   |
                             (State: React Context / Axio Client HTTP)
                                   |
========================================================================================
                                     EXPRESS API GATEWAY
========================================================================================
   [ Routers ]   ---> /api/auth    |    /api/forecasts     |    /api/recommendations
                       |                     |                        |
   [ Middleware ]      +---------- JWT Token Verification & RBAC Checks -------+
                       |                     |                        |
   [ Controllers ]     v                     v                        v
                 AuthController      ForecastController     RecommendationController
                       |                     |                        |
========================================================================================
                                 BUSINESS & ANALYTICS LAYER
========================================================================================
   [ Core Services ]  UserService |  TelemetryService  |  InferenceService  |  RecEngine
                                             |                  |                 |
   [ Persistence ]    +----------------------+                  |                 |
                      v                                         v                 v
                 [Mongoose ODM]                         [Local Python ML HTTP Service]
                      |                                         |
========================================================================================
                                      DATA STORAGE LAYER
========================================================================================
   [ Database ]  MongoDB Collections:
                   ├── actual_telemetry
                   ├── forecasted_telemetry
                   ├── recommendation_records
                   └── user_credentials
========================================================================================
```

---

## 16. Advantages of This Architecture

* **High Modularity**: The Python ML engine is decoupled from the Express backend, allowing you to update model features without changing the API server code.
* **Fast Dashboard Loading**: Caching configuration properties and running database queries on indexed timestamp fields ensures fast dashboard updates.
* **Process Separation**: Heavy calculations in Python are handled outside the Express event loop, keeping the Express server responsive to other API requests.
* **Simplified B.Tech Scope**: The deployment setup uses basic processes managed by PM2 on a single VPS, avoiding the complexity of Kubernetes or Docker orchestration while maintaining a professional design.

---

## 17. Possible Bottlenecks

* **XGBoost Training Memory**: Training models on very large datasets can consume significant server memory.
  * *Mitigation*: Limit background retraining datasets to the past 24 months, and trigger training during off-peak hours.
* **Large Time-Series Queries**: Fetching multi-year historical logs to plot charts can cause query delays.
  * *Mitigation*: Enable MongoDB indexes on timestamps and substations, and aggregate older historical actual data to daily levels.
* **Synchronous Python Invocation**: Launching Python execution processes for every API call can introduce processing latency.
  * *Mitigation*: Run the Python ML code as a persistent local background daemon that communicates via HTTP ports.

---

## 18. Future Scalability

* **Task Queue Integration**: As user traffic grows, long-running processes (like retraining tasks) can be queued using redis-based task engines (e.g., BullMQ) to improve processing reliability.
* **Decoupled Analytics Server**: The Python ML service can be moved to a dedicated GPU-enabled instance to handle larger, more complex modeling tasks.
* **SCADA Integrations**: Safe, unidirectional communications (using protocols like DNP3 or MQTT) can be added to read telemetry from grid equipment in real time.

---

## 19. Best Practices to Follow During Development

### 19.1 Frontend (React + Tailwind CSS)
* **Keep Components Modular**: Separate logic from visual styling, and use custom React hooks for database state calls.
* **Chart Performance**: Avoid rendering more than 1,000 data points on a single chart. Downsample the data on the backend before sending it to the client.

### 19.2 Backend (Node.js + Express)
* **Secure Session Handling**: Use HTTP-only cookies for JWT storage to prevent token access from client-side scripts.
* **Validate User Input**: Always check incoming request bodies using validation schemas (like Joi or Zod) to catch format errors before processing.

### 19.3 Machine Learning (Python + XGBoost)
* **Consistent Feature Engineering**: Make sure the preprocessing logic for training data is identical to the preprocessing logic used during inference.
* **Decouple Data Operations**: Do not query MongoDB directly from Python. Instead, have the Express backend retrieve the required data and send it as clean JSON arrays to the Python script.
