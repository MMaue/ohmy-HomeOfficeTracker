from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import csv
import os
import sys
from pathlib import Path
from typing import List

app = FastAPI(title="Home Office Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Path resolution ────────────────────────────────────────────────────────────
#
#   Frozen (EXE)                 | Normal (dev)
#   ─────────────────────────────┼─────────────────────────────────────────────
#   sys.executable → path/to.exe │ __file__ → backend/main.py
#   sys._MEIPASS   → temp bundle │ no _MEIPASS
#
#   DATA_DIR   = writable folder next to the .exe  (CSV lives here, persists)
#   STATIC_DIR = read-only React build inside the bundle

if getattr(sys, 'frozen', False):
    DATA_DIR   = Path(os.path.dirname(sys.executable))
    STATIC_DIR = Path(sys._MEIPASS) / "dist"
else:
    DATA_DIR   = Path(__file__).parent
    STATIC_DIR = Path(__file__).parent.parent / "frontend" / "dist"

CSV_FILE = DATA_DIR / "work_hours.csv"
FIELDS   = ["date", "home_hours", "company_hours"]


# ── CSV helpers ────────────────────────────────────────────────────────────────
def ensure_csv():
    CSV_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not CSV_FILE.exists():
        with open(CSV_FILE, "w", newline="") as f:
            csv.DictWriter(f, fieldnames=FIELDS).writeheader()


def read_all() -> List[dict]:
    ensure_csv()
    rows = []
    try:
        with open(CSV_FILE, "r", newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rows.append({
                    "date":          row["date"].strip(),
                    "home_hours":    float(row.get("home_hours",    0) or 0),
                    "company_hours": float(row.get("company_hours", 0) or 0),
                })
    except Exception as e:
        print(f"CSV read error: {e}")
    return rows


def write_all(entries: List[dict]):
    with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(entries)


# ── Pydantic model ─────────────────────────────────────────────────────────────
class EntryIn(BaseModel):
    date:          str
    home_hours:    float
    company_hours: float


# ── API routes  (must be registered BEFORE the static catch-all) ───────────────
@app.get("/api/entries")
def get_entries():
    entries = read_all()
    entries.sort(key=lambda x: x["date"])
    return entries


@app.post("/api/entries")
def upsert_entry(entry: EntryIn):
    entries = read_all()
    updated = False
    for e in entries:
        if e["date"] == entry.date:
            e["home_hours"]    = entry.home_hours
            e["company_hours"] = entry.company_hours
            updated = True
            break
    if not updated:
        entries.append({
            "date":          entry.date,
            "home_hours":    entry.home_hours,
            "company_hours": entry.company_hours,
        })
    entries.sort(key=lambda x: x["date"])
    write_all(entries)
    return {"status": "ok", "updated": updated}


@app.delete("/api/entries/{entry_date}")
def delete_entry(entry_date: str):
    entries  = read_all()
    filtered = [e for e in entries if e["date"] != entry_date]
    if len(filtered) == len(entries):
        raise HTTPException(status_code=404, detail="Entry not found")
    write_all(filtered)
    return {"status": "ok", "deleted": entry_date}


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Static file serving  (registered last — catches everything else) ───────────
#
#   /assets/*  → Vite-generated JS/CSS bundles (served directly)
#   /*         → SPA fallback: return index.html so React Router works

if STATIC_DIR.exists() and (STATIC_DIR / "assets").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(STATIC_DIR / "assets")),
        name="vite-assets",
    )


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Serve the React SPA.
    - Known static files (favicon, manifest, …) are returned directly.
    - Everything else (React routes) falls back to index.html.
    - When the dist folder doesn't exist (dev without a build), returns a hint.
    """
    if not STATIC_DIR.exists():
        return {
            "detail": (
                "Frontend not built. "
                "Run  npm run build  inside the frontend/ directory."
            )
        }

    target = STATIC_DIR / full_path
    if target.is_file():
        return FileResponse(str(target))

    # SPA fallback
    return FileResponse(str(STATIC_DIR / "index.html"))
