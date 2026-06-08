# Security Contracts Application

A web app for managing security contracts and tools, with reporting dashboards.

---

## Option 1 — Run locally (fastest)

### Requirements
- Python 3.11+
- Node.js 18+

### Steps

**1. Install backend dependencies**
```bash
pip install -r requirements.txt
```

**2. Start the backend**
```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://localhost:8000`.

**3. Seed the database (first time only)**

Copy your CSV files into the project root, then run:
```bash
python -m backend.csv_seed          # contracts
python -m backend.tools_csv_seed    # security tools
```

**4. Install frontend dependencies**
```bash
cd frontend
npm install
```

**5. Start the frontend**
```bash
npm run dev
```
Open `http://localhost:5173` (or the port shown in the terminal) in your browser.

---

## Option 2 — Run with Docker (includes PostgreSQL)

### Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Steps

**1. Copy your CSV files into the `data/` folder**
```
data/
  Security Contracts(contracts).csv
  Security Tool Stack(Security Tools Current).csv
```

**2. Start all services**
```bash
docker compose up --build
```

**3. Seed the database (first time only)**

In a separate terminal, while the containers are running:
```bash
docker compose exec backend python -m backend.csv_seed
docker compose exec backend python -m backend.tools_csv_seed
```

**4. Open the app**

Go to `http://localhost` in your browser.

To stop: `docker compose down`  
To stop and delete all data: `docker compose down -v`

---

## Pages

| Page | URL |
|------|-----|
| Dashboard | `/` |
| Contracts | `/contracts` |
| Security Tools | `/tools` |
| Reports | `/reports` |
