# Quick Start: Chroma DB (Local, No Docker)

## Step 1: Install Chroma DB

```bash
pip install chromadb
```

## Step 2: Start Chroma DB Server

**Option A: Using the provided script**
```bash
cd backend
./start-chroma.sh
```

**Option B: Using Python script**
```bash
cd backend
python start-chroma.py
```

**Option C: Manual command**
```bash
chroma run --host localhost --port 8000 --path ./chroma-data
```

## Step 3: Verify It's Running

Open a new terminal and run:
```bash
curl http://localhost:8000/api/v1/heartbeat
```

You should see a response like:
```json
{"nanosecond heartbeat": 1234567890}
```

## Step 4: Use in Your Backend

Chroma DB is now available at: **http://localhost:8000**

Your backend can connect to it using the Chroma client library.

## Stop the Server

Press `Ctrl+C` in the terminal where Chroma is running.

## Data Persistence

All data is stored in `./chroma-data` directory. This persists between restarts.

---

**That's it!** Chroma DB is now running locally and ready to use.
