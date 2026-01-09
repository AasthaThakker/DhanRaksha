Great — you’re on the right track 👍
I’ll **clean this up**, **fix small mistakes**, and give you a **production-quality README “Initialization” section** that your friend (or any developer) can follow **without getting stuck**.

I’ll also correct command typos and ordering.

---

# ✅ **README.md – Project Initialization**

## 🧩 Environment Setup

Create a file named **`.env`** in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/securebank?schema=public"

JWT_SECRET="super-secret-key-change-me-in-production"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

⚠️ **Do not commit `.env` to git**

---

## 🐳 Database Setup (PostgreSQL via Docker)

### 1️⃣ Install Docker Desktop

* Install Docker Desktop for your OS
* Open Docker Desktop
* Wait until status shows **“Running”**

---

### 2️⃣ Start the Database

From the project root:

```bash
docker compose up -d
```

Verify:

```bash
docker ps
```

You should see:

```
securebank-postgres   postgres:15   Up ...
```

---

## 📦 Backend Setup (Next.js + Prisma)

### 3️⃣ Install Dependencies

```bash
npm install
```

---

### 4️⃣ Run Database Migrations

```bash
npx prisma migrate dev
```

This will:

* Create database tables
* Generate Prisma Client

---

### 5️⃣ Seed Demo Data

```bash
npx prisma db seed
```

(Optional but recommended for demo)

---

### 6️⃣ Start the Application

```bash
npm run dev
```

App will be available at:

```
http://localhost:3000
```

---

## 🤖 AI / ML Service Setup

### 7️⃣ Navigate to AI Service Directory

```bash
cd ml-services
```

---

### 8️⃣ Install Python Dependencies

```bash
pip install -r requirements.txt
```

(Use `pip3` if needed)

---

### 9️⃣ Train AI Model

```bash
python train.py
```

---

### 🔟 Start AI API Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

AI service runs at:

```
http://localhost:8000
```

---

## 🔄 Recommended Startup Order

1. Start Docker (`docker compose up -d`)
2. Run Prisma migration & seed
3. Start Next.js app
4. Start AI service

---

## 🛠️ Common Issues & Fixes

### ❌ Docker not running

* Open Docker Desktop
* Wait until status = **Running**

---

### ❌ Port 5432 already in use

Edit `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

Update `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/securebank
```

---

### ❌ Prisma migration fails

```bash
npx prisma migrate reset
```

⚠️ This clears data (safe for dev).

---

## 🔐 Security Notes

* Change `JWT_SECRET` in production
* Use real Redis credentials in production
* Do not expose AI service publicly without auth

---

## ✅ System Requirements

* Node.js 18+
* Docker Desktop
* Python 3.9+
* Git

---

## 🎯 Final Notes

This project uses:

* Dockerized PostgreSQL
* Prisma ORM
* Next.js App Router
* AI microservice architecture

Designed as a **banking + AI behavioral verification showcase**.
