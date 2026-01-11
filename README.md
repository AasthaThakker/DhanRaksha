# DhanRaksha - Smart Banking with Fraud Detection
 docker exec -it e5365e120129 psql -U postgres -d securebank
 cd ml-service 
 uvicorn main:app --reload
SecureBank AI is a modern banking application that integrates financial transactions with a real-time, hybrid AI fraud detection system. It combines a deterministic **Rules Engine** with a probabilistic **Machine Learning Model (Isolation Forest)** to identify and block suspicious activities.

## Working Principle: Hybrid Fraud Detection

The core innovation of this project is its **Hybrid Scoring Engine**, which evaluates every transaction capability before execution.

### 1. The Decision Flow
When a user attempts a transfer (`/api/transfer` or `/api/transfer/verify`), the system executes the following pipeline:

1.  **Data Gathering**:
    *   Fetches the user's historical transaction data (7-day average, 1-month velocity).
    *   Identifies the device and location context (mocked for this demo).

2.  **Phase 1: Deterministic Rules Engine (60% Weight)**
    *   Checks for known fraud patterns:
        *   Amount > 3x daily average.
        *   Sudden change in IP/Country.
        *   High transaction velocity (multiple transfers in 1 minute).
    *   **Output**: A base `ruleScore` (0-60).

3.  **Phase 2: ML Anomaly Detection (40% Weight)**
    *   The Next.js backend calls the **Python ML Microservice** (`ml-service`) via HTTP.
    *   **Model**: An **Isolation Forest** model trained on user behavior.
    *   **Features**:
        *   `avg_amount_7d`: Average spending over the last week.
        *   `tx_velocity_1h`: Transaction frequency in the last hour.
        *   `time_of_day_deviation`: How far the transaction time deviates from the user's usual habits.
    *   **Output**: An anomaly score normalized to an `mlScore` (0-40).

4.  **Phase 3: Unified Decision**
    *   Final Score = `ruleScore` + `mlScore`.
    *   **Action**:
        *   **< 30 (Safe)**: Transaction allowed.
        *   **30 - 70 (Suspicious)**: Transaction held for review (`PENDING`).
        *   **> 70 (High Risk)**: Transaction blocked immediately.

5.  **Caching**: To optimize performance, risk scores are cached in **Redis** (Upstash) for 10 minutes.

### 2. Automated Training Pipeline
The ML model is not static. The `ml-service/train.py` script:
1.  Connects directly to the PostgreSQL database.
2.  extracts all transaction history.
3.  Performs feature engineering (calculates rolling averages and time deviations).
4.  Retrains the Isolation Forest model.
5.  Saves the model artifact (`fraud_model.pkl`) for immediate use by the API.

---

## � Project Structure

A full-stack monorepo containing the Next.js frontend/backend and the Python ML microservice.

```text
/
├── app/                        # Next.js App Router (Frontend + API)
│   ├── (auth)/                 # Login & Register pages
│   ├── admin/                  # Admin Dashboard (Live metrics)
│   ├── dashboard/              # User Dashboard
│   │   ├── security/           # Real-time Security & Risk Logs
│   │   └── transfer/           # Transfer page with "Verify with AI"
│   └── api/                    # Backend API Routes
│       ├── transfer/verify/    # Pre-transfer risk assessment endpoint
│       └── user/security/      # Endpoint for user risk history
│
├── lib/                        # Shared Utilities
│   ├── fraud/                  # Fraud Engine Logic
│   │   ├── rules.ts            # Phase 1: Rules Engine
│   │   ├── ml.ts               # Connector to Python ML Service
│   │   ├── score.ts            # Phase 3: Unification Logic
│   │   └── decision.ts         # Final Allow/Block decision
│   ├── db.ts                   # Prisma DB Client (Singleton)
│   └── redisClient.ts          # Upstash Redis Client
│
├── ml-service/                 # 🐍 Python ML Microservice
│   ├── main.py                 # FastAPI Server (Exposes /score endpoint)
│   ├── train.py                # Automated Training Pipeline
│   ├── fraud_model.pkl         # Trained Model Artifact
│   └── requirements.txt        # Python dependencies
│
├── prisma/                     # Database
│   ├── schema.prisma           # PG Schema (User, Transaction, BehaviorSession)
│   └── seed.ts                 # Seeder for demo data
│
└── public/                     # Static assets
```

## � Getting Started

### 1. Prerequisites
*   Node.js & npm
*   Python 3.8+
*   PostgreSQL Database
*   Upstash Redis Account

### 2. Setup Environment
Create a `.env` file in the root:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="supersecret"
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 3. Install & Run
**Terminal 1: Next.js App**
```bash
npm install
npx prisma generate
npx prisma db seed
npm run dev
```

**Terminal 2: ML Service**
```bash
cd ml-service
pip install -r requirements.txt
python train.py      # Train initial model
uvicorn main:app --reload
```
