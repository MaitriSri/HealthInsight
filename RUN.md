# HealthInsight — Running Instructions

This guide provides the exact commands to run both the **Flask Backend** and the **Vite Frontend**.

---

## 1. Prerequisites (First Time Only)

Make sure you are in the project root directory:

```powershell
cd C:\Users\Maitri\OneDrive\Documents\HealthInsight
```

### Install Backend Dependencies:
```powershell
pip install -r backend/requirements.txt
```

### Install Frontend Dependencies:
```powershell
cd frontend
npm install
cd ..
```

---

## 2. Running the Application

Open **two terminal windows**:

### Terminal 1: Start Backend (Flask API)
From the project root:
```powershell
python backend/app.py
```
- **Backend URL:** `http://127.0.0.1:5000`
- **Health Check API:** `http://127.0.0.1:5000/api/health`

---

### Terminal 2: Start Frontend (Vite)
From the `frontend` folder:
```powershell
cd C:\Users\Maitri\OneDrive\Documents\HealthInsight\frontend
npm run dev
```
*(On Windows PowerShell, you can also use `npm.cmd run dev`)*

- **Frontend URL:** `http://localhost:5173/`

---

## 3. Application Access Points

Once both services are running, open your web browser to:

| Feature | URL | Description |
| :--- | :--- | :--- |
| **Main Dashboard & Reports** | [http://localhost:5173/](http://localhost:5173/) | Enter test values, run interpretation engine, view history & trends |
| **X-Ray / MRI Review** | [http://localhost:5173/xray.html](http://localhost:5173/xray.html) | Upload and review radiological scans |
| **API Health Check** | [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health) | Verifies Flask backend & SQLite database status |

---

## 4. Database Setup (Optional)

The SQLite database (`healthDB/healthinsight.db`) is already created and automatically maintained by `backend/app.py`.

If you ever wish to manually initialize or verify the database tables:
```powershell
python healthDB/init_db.py
```

---

## 5. Stopping the Servers

Press `Ctrl + C` in each terminal window to stop the servers.
