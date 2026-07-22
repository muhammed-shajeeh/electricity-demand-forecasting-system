# AI-Based Smart Electricity Demand Forecasting and Grid Decision Support System

An enterprise-grade Decision Support System (DSS) designed to help electricity boards and utility companies forecast future electrical demand using Machine Learning (XGBoost) and receive operational recommendations (peak shaving, load shedding, storage dispatch) to support grid management.

---

## 🚀 Technology Stack

* **Frontend**: React (Vite) + Tailwind CSS + shadcn/ui + Recharts
* **Backend**: Node.js + Express.js + Mongoose ODM
* **Machine Learning**: Python + FastAPI + Scikit-Learn + XGBoost
* **Database**: MongoDB
* **Authentication**: JWT-based stateless authentication

---

## 📁 Repository Structure

```
.
├── client/                 # React Frontend Application (Vite)
├── server/                 # Node.js / Express.js Backend Server
├── ml-service/             # Python / FastAPI Machine Learning Engine
├── docs/                   # Architectural & System Documentation
├── .editorconfig           # Editor configuration for style consistency
├── .gitattributes          # Git line normalization settings
├── .gitignore              # Ignored files configuration
├── PROJECT_PROGRESS.md     # Tracking milestones and task progress
└── README.md               # Root documentation
```

---

## 🛠️ Getting Started & Installation

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js** (v18.0.0 or higher)
* **NPM** (v9.0.0 or higher)
* **Python** (v3.10 or higher)
* **MongoDB** (running locally or via Atlas connection)

---

### 2. Service Initialization

#### A. Frontend Client (`/client`)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   * Copy `.env.example` to `.env` and fill in the required API endpoints.
4. Run the development server:
   ```bash
   npm run dev
   ```

#### B. Backend Server (`/server`)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   * Copy `.env.example` to `.env` and configure your database URI, port, and JWT secrets.
4. Run the backend server:
   * Development mode (with nodemon auto-reload):
     ```bash
     npm run dev
     ```
   * Production mode:
     ```bash
     npm start
     ```

#### C. Machine Learning Service (`/ml-service`)
1. Navigate to the ml-service directory:
   ```bash
   cd ml-service
   ```
2. Initialize and activate a Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up the environment variables:
   * Copy `.env.example` to `.env` and configure the service port.
5. Run the FastAPI development server:
   ```bash
   npm run dev
   # OR directly: uvicorn app.main:app --reload --port 8000
   ```

---

## 📊 Verification Checklist

To confirm the initialization was completed successfully:
- [ ] Frontend launches on `http://localhost:5173`
- [ ] Backend server runs on `http://localhost:5000`
- [ ] ML service API is reachable on `http://localhost:8000/docs` (FastAPI Swagger UI)
- [ ] MongoDB connection is established successfully by the backend
