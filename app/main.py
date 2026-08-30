from pathlib import Path
import webbrowser
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, lessons, leaderboard, chess, quests

# Dev üçün: cədvəllər yoxdursa yaradır. PRODUCTION-da bunun əvəzinə
# Alembic kimi migration aləti istifadə edin (schema dəyişəndə köhnə
# data itməsin deyə) — create_all() yalnız yeni cədvəl əlavə edir,
# mövcud cədvəli "migrate" etmir.
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    def open_browser():
        time.sleep(1.5) # Wait for uvicorn to fully start
        webbrowser.open("http://127.0.0.1:8000")
    
    threading.Thread(target=open_browser, daemon=True).start()
    yield

app = FastAPI(title="Dolphy API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers — bunlar HƏMİŞƏ static mount-dan ƏVVƏL qeydiyyatdan
# keçməlidir. Starlette route-ları qeydiyyat sırasına görə yoxlayır;
# "/" üzərində mount edilmiş StaticFiles hər uyğunlaşmayan sorğunu
# tutur, ona görə API path-ləri əvvəlcə əlavə olunmalıdır ki, məsələn
# "/auth/login" sorğusu statik fayl axtarışına düşməsin.
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(lessons.router)
app.include_router(leaderboard.router)
app.include_router(chess.router)
app.include_router(quests.router)


@app.get("/api/health", tags=["meta"])
def health():
    """Sağlamlıq yoxlaması. Diqqət: kök URL ("/") artıq frontend-i
    (public/index.html) qaytarır, ona görə health-check ayrıca
    /api/health-ə köçürülüb — əks halda ikisi eyni path-ə görə
    toqquşardı."""
    return {"status": "ok", "service": "dolphy-api"}


# ── Frontend static files ──────────────────────────────────────────
# Bütün HTML/CSS/JS faylları repo kökündəki public/ qovluğundadır.
# html=True olduğu üçün StaticFiles "/" sorğusunu avtomatik
# public/index.html ilə cavablandırır — ayrıca redirect yazmağa
# ehtiyac yoxdur. Backend mənbə kodu (app/, requirements.txt və s.)
# bu qovluqda olmadığı üçün təsadüfən ictimai açılmır.
PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"
app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="frontend")
