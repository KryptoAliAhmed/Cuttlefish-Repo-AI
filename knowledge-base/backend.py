
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from memory import ChromaMemory

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

agents = [{"id":"arch1","name":"ArchitectAgent","status":"idle","lastTask":"N/A"}]
tasks = [{"id":"task1","description":"Generate site plan","agent":"ArchitectAgent","status":"completed"}]

@app.get("/api/agents")
def get_agents():
    return agents

@app.get("/api/tasks")
def get_tasks():
    return tasks

@app.get("/api/outputs")
def get_outputs():
    files = list(Path("outputs").glob("*.md"))
    return [{"file": f.name, "path": f"/outputs/{f.name}"} for f in files]

@app.get("/api/memory")
def get_memory(query: str = ""):
    mem = ChromaMemory()
    return mem.query(query, n_results=3)
