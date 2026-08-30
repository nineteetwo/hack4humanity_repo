from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=list[schemas.LeaderboardEntry])
def get_leaderboard(limit: int = Query(20, le=100), db: Session = Depends(get_db)):
    """Bu, frontend-in indiyə qədər HEÇ vaxt real şəkildə göstərə bilmədiyi
    panel — leaderboard localStorage-da olanda hər user yalnız öz brauzerini
    görürdü, "digər" istifadəçilər yox idi. İndi hamısı eyni DB-dən oxuyur."""
    users = (
        db.query(models.User)
        .order_by(models.User.xp.desc())
        .limit(limit)
        .all()
    )
    return [
        schemas.LeaderboardEntry(rank=i + 1, name=u.name or u.email.split("@")[0], xp=u.xp, streak=u.streak)
        for i, u in enumerate(users)
    ]
