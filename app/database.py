"""
SQLAlchemy engine + session. Bir dəfə qurulur, hər request öz session-unu
Depends(get_db) vasitəsilə alır və işi bitəndə avtomatik bağlanır.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: hər request üçün ayrıca DB session verir."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
