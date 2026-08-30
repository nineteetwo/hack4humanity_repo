from fastapi import APIRouter, Depends

from app import models, schemas
from app.deps import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    """Frontend-dəki StatsPanel.state-in server versiyası: streak/hp/xp/gems
    burdan gəlir, artıq localStorage-dan deyil."""
    return current_user
