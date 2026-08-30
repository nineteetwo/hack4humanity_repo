from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, lessons, leaderboard, chess, quests

# Dev üçün: cədvəllər yoxdursa yaradır. PRODUCTION-da bunun əvəzinə
# Alembic kimi migration aləti istifadə edin (schema dəyişəndə köhnə
# data itməsin deyə) — create_all() yalnız yeni cədvəl əlavə edir,
# mövcud cədvəli "migrate" etmir.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Dolphy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(leaderboard.router)
app.include_router(chess.router)
app.include_router(quests.router)



@app.get("/")
def health():
    return {"status": "ok", "service": "dolphy-api"}
