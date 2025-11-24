# How to Start Chroma DB

## ✅ Chroma DB is Installed!

A virtual environment has been created with Chroma DB installed.

## To Start Chroma DB:

**Option 1: Using the script (Recommended)**
```bash
cd backend
./start-chroma.sh
```

**Option 2: Manual start**
```bash
cd backend
source venv/bin/activate
python -m chromadb.cli run --host localhost --port 8000 --path ./chroma-data
```

## Verify It's Running:

Open a **new terminal** and run:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

You should see: `{"nanosecond heartbeat": ...}`

## Stop Chroma DB:

Press `Ctrl+C` in the terminal where Chroma is running.

## For Your Backend:

Once Chroma is running, connect to: **http://localhost:8000**

---

**Quick Start Command:**
```bash
cd backend && ./start-chroma.sh
```

