import os
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Import your helpers and models
from PostgresSql.database import get_db, Base, engine
from PostgresSql import models
from HelperFunction import JasonWebToken
from HelperFunction.Cryptography import EncryptData, comparePassword
from HelperFunction.Validation import isEmail, isPassword
from schemas import Register, Login

# Load environment variables
load_dotenv()

# JWT / security setup
security = HTTPBearer()
TOKEN_EXPIRY_TIME_MINUTES = int(os.getenv("TOKEN_EXPIRY_TIME_MINUTES", 60))

# Initialize database tables if not exists
models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    filename=r'E:\Class Book\Secure-Software-Design-And-Engineering\Project\Backend\logs.log',
    filemode='a',
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# SlowAPI limiter
limiter = Limiter(key_func=get_remote_address)
router.state.limiter = limiter
router.add_middleware(SlowAPIMiddleware)

# Rate limit exception handler
def _rate_limit_exceeded_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."}
    )

router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ------------------ Endpoints ------------------

@router.post("/auth/register")
@limiter.limit("5/minute")
def register_user(user: Register, db: Session = Depends(get_db)):
    if not isEmail(user.email):
        raise HTTPException(status_code=400, detail="Invalid email")

    if not isPassword(user.password):
        raise HTTPException(status_code=400, detail="Weak password")

    try:
        hash_password = EncryptData(user.password)
        user_detail = models.User(
            username=user.username,
            email=user.email,
            password_hash=hash_password,
            role=user.role,
        )
        db.add(user_detail)
        db.commit()
        db.refresh(user_detail)

        logger.info(f"User {user.email} registered successfully")
        return {"status": 201, "message": "User registered successfully", "user_id": user_detail.id}

    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/login")
@limiter.limit("5/minute")
def login_user(user: Login, db: Session = Depends(get_db)):
    if not user.email:
        logger.warning("Login attempt without email")
        raise HTTPException(status_code=400, detail="Please provide an email address")
    if not user.password:
        logger.warning(f"Login attempt without password for email {user.email}")
        raise HTTPException(status_code=400, detail="Please provide a password")

    try:
        # Fetch user
        query = text("SELECT * FROM users WHERE email = :email")
        result = db.execute(query, {"email": user.email})
        try:
            data = result.mappings().one()
        except Exception:
            logger.warning(f"Login failed - user not found: {user.email}")
            raise HTTPException(status_code=404, detail="User not found")

        # Verify password
        if not comparePassword(data["password_hash"], user.password):
            logger.warning(f"Login failed - invalid password for {user.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate JWT
        token = JasonWebToken.create_jwt_access_token(
            {"id": data["id"], "email": data["email"]}
        )
        expiry = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_TIME_MINUTES)
        query = text(
            "INSERT INTO RefreshToken(user_id, token, expires_at) VALUES(:user_id, :token, :expiry)"
        )
        db.execute(query, {"user_id": data["id"], "token": token, "expiry": expiry})
        db.commit()

        logger.info(f"User logged in successfully: {user.email}")
        return {"status": 200, "message": "User logged in successfully", "token": token}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/auth/logout")
@limiter.limit("5/minute")
def logout_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = JasonWebToken.verifyAccessToken(token)
        if not payload["status"]:
            logger.warning(f"Invalid or expired token during logout: {payload['message']}")
            raise HTTPException(status_code=401, detail=payload["message"])

        user_id = payload["data"]["id"]

        query = text("DELETE FROM RefreshToken WHERE user_id = :id")
        db.execute(query, {"id": user_id})
        db.commit()

        logger.info(f"User {user_id} logged out successfully")
        return {"status": 200, "message": "Logged out successfully"}

    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/auth/me")
@limiter.limit("5/minute")
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = JasonWebToken.verifyAccessToken(token)
        if not payload["status"]:
            logger.warning(f"Invalid or expired token when fetching user info: {payload['message']}")
            raise HTTPException(status_code=401, detail=payload["message"])

        user_id = payload["data"]["id"]

        query = text("SELECT * FROM users WHERE id = :id")
        result = db.execute(query, {"id": user_id})
        row = result.mappings().first()

        if not row:
            logger.warning(f"User not found: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        logger.info(f"Fetched info for user {user_id}")
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "created_at": row["created_at"]
        }

    except Exception as e:
        logger.error(f"Error fetching current user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")