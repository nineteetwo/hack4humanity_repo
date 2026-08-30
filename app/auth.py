"""
Parol heç vaxt açıq (plaintext) saxlanılmır — bcrypt ilə hash edilir.
Bcrypt "salt" özündə daşıyır, ona görə eyni parol iki fərqli user-də
fərqli hash verir (rainbow table hücumlarına qarşı qoruma).

JWT (JSON Web Token) stateless auth üçündür: server session saxlamır,
əvəzinə hər sorğuda client "Authorization: Bearer <token>" göndərir,
server onu imza (signature) ilə yoxlayır. jwt_secret sızarsa, hər kəs
özü üçün token "saxtalaşdıra" bilər — buna görə .env-də saxlanılır,
kodda yox.
"""

from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    """Token düzgündürsə user_id qaytarır, deyilsə None (expired/tampered/invalid)."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        return None
