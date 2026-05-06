from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import json
from pathlib import Path

app = FastAPI(title="Mind at Ease API")

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage (for development)
# Later you can switch to MongoDB
DATA_FILE = Path("data.json")

def load_data():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())
    return {"moods": [], "journals": [], "quizzes": []}

def save_data(data):
    DATA_FILE.parent.mkdir(exist_ok=True)
    DATA_FILE.write_text(json.dumps(data, indent=2, default=str))

data = load_data()

# ====================== MODELS ======================
class MoodIn(BaseModel):
    client_id: str
    mood: str
    intensity: int
    note: Optional[str] = None

class JournalIn(BaseModel):
    client_id: str
    title: str
    content: str
    mood: Optional[str] = None

class QuizIn(BaseModel):
    client_id: str
    score: int
    percentage: int
    answers: List[int]

# ====================== ROUTES ======================

@app.post("/api/mood")
async def save_mood(mood: MoodIn):
    entry = mood.dict()
    entry["id"] = str(uuid.uuid4())
    entry["created_at"] = datetime.now().isoformat()
    data["moods"].append(entry)
    save_data(data)
    return {"status": "saved", "id": entry["id"]}

@app.get("/api/mood/history")
async def mood_history(client_id: str, limit: int = 30):
    entries = [e for e in data["moods"] if e["client_id"] == client_id]
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return entries[:limit]

@app.get("/api/mood/stats")
async def mood_stats(client_id: str):
    entries = [e for e in data["moods"] if e["client_id"] == client_id]
    total = len(entries)
    last7 = len([e for e in entries if (datetime.now() - datetime.fromisoformat(e["created_at"].replace("Z",""))).days < 7])
    
    from collections import Counter
    moods = [e["mood"] for e in entries]
    most_common = Counter(moods).most_common(1)[0][0] if moods else None
    
    return {"total": total, "last7": last7, "mostCommon": most_common}

@app.post("/api/journal")
async def save_journal(journal: JournalIn):
    entry = journal.dict()
    entry["id"] = str(uuid.uuid4())
    entry["created_at"] = datetime.now().isoformat()
    data["journals"].append(entry)
    save_data(data)
    return {"status": "saved"}

@app.get("/api/journal")
async def list_journal(client_id: str, limit: int = 20):
    entries = [e for e in data["journals"] if e["client_id"] == client_id]
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return entries[:limit]

@app.delete("/api/journal/{entry_id}")
async def delete_journal(entry_id: str, client_id: str):
    original_len = len(data["journals"])
    data["journals"] = [e for e in data["journals"] if not (e["id"] == entry_id and e["client_id"] == client_id)]
    if len(data["journals"]) < original_len:
        save_data(data)
        return {"status": "deleted"}
    raise HTTPException(404, "Entry not found")

@app.post("/api/quiz")
async def save_quiz(quiz: QuizIn):
    entry = quiz.dict()
    entry["id"] = str(uuid.uuid4())
    entry["created_at"] = datetime.now().isoformat()
    data["quizzes"].append(entry)
    save_data(data)
    return {"status": "saved"}

@app.get("/api/quiz/history")
async def quiz_history(client_id: str, limit: int = 10):
    entries = [e for e in data["quizzes"] if e["client_id"] == client_id]
    entries.sort(key=lambda x: x["created_at"], reverse=True)
    return entries[:limit]

@app.get("/api/insights")
async def insights(client_id: str):
    return {"message": "Insights coming soon"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
