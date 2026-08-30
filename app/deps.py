"""
get_current_user: qorunan (protected) endpoint-lərdə istifadə olunan
dependency. FastAPI onu görəndə avtomatik "Authorization: Bearer ..."
header-ini gözləyir və Swagger UI-da kilid ikonası çıxarır.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import decode_access_token
from app import models

# tokenUrl sadəcə Swagger UI-nın "login" formunu göstərmək üçündür,
# faktiki login /auth/login-dədir.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Etibarsız və ya vaxtı bitmiş token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_error

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_error

    return user
