import os
from datetime import timezone
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import bcrypt

# Import your helpers and models
from PostgresSql.database import get_db, Base, engine
from PostgresSql import models
from HelperFunction import JasonWebToken
from HelperFunction.Cryptography import EncryptData,comparePassword
from HelperFunction.Validation import isEmail, isPassword
from schemas import Register, Login

# Load environment variables
load_dotenv()

# JWT / security setup
security = HTTPBearer()
TOKEN_EXPIRY_TIME_MINUTES = int(os.getenv("TOKEN_EXPIRY_TIME_MINUTES", 60))


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

# ------------------ Endpoints ------------------

@router.post("/auth/register")
async def register_user(user: Register, db: Session = Depends(get_db)):
    if not isEmail(user.email):
        raise HTTPException(status_code=400, detail="Invalid email")
    if not isPassword(user.password):
        raise HTTPException(status_code=400, detail="Weak password")

    try:
        hash_password = EncryptData(user.password)
        user_detail = models.User(
            username=user.username,
            email=user.email,
            password=hash_password,
            role=user.role or 'user',
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
async def login_user(user: Login, db: Session = Depends(get_db)):
    if not user.email or not user.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    try:
        # --- 1. Admin Check ---
        admin = db.query(models.AdminCredentials).filter(models.AdminCredentials.email == user.email).first()
        
        # Admin found? Verify using raw bcrypt (requires bytes)
        if admin:
            if bcrypt.checkpw(user.password.encode('utf-8'), admin.password_hash.encode('utf-8')):
                token_payload = {"id": admin.id, "email": admin.email, "role": "admin"}
                token = JasonWebToken.create_jwt_access_token(token_payload)
                return {"status": 200, "message": "Admin logged in", "token": token, "redirect": "/admin/dashboard"}
            else:
                raise HTTPException(status_code=401, detail="Invalid Admin credentials")

        # --- 2. Normal User Check ---
        query = text("SELECT * FROM users WHERE email = :email")
        result = db.execute(query, {"email": user.email})
        data = result.mappings().one_or_none() # Safer than one()

        if not data:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify using your Fernet comparePassword function
        if not comparePassword(data['password'], user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # --- 3. Token Management (Reuse or Create) ---
        user_id = data["id"]
        # Check if a valid token already exists in the refresh_tokens table
        now = datetime.now(timezone.utc)
        existing_token_query = text("""
            SELECT token FROM refresh_tokens 
            WHERE user_id = :user_id AND expires_at > :now 
            ORDER BY expires_at DESC LIMIT 1
        """)
        existing_token_result = db.execute(existing_token_query, {"user_id": user_id, "now": now}).mappings().one_or_none()

        if existing_token_result:
            # Reuse the old valid token so their session persists
            token = existing_token_result["token"]
        else:
            # Create new token if none found or all expired
            token_payload = {"id": user_id, "email": data["email"], "role": "user"}
            token = JasonWebToken.create_jwt_access_token(token_payload)
            expiry = now + timedelta(minutes=TOKEN_EXPIRY_TIME_MINUTES)
            
            db.execute(
                text("INSERT INTO refresh_tokens(user_id, token, expires_at) VALUES(:user_id, :token, :expiry)"),
                {"user_id": user_id, "token": token, "expiry": expiry}
            )
            db.commit()

        return {"status": 200, "message": "User logged in", "token": token}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/auth/logout")
async def logout_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = JasonWebToken.verifyAccessToken(token)
        if not payload["status"]:
            raise HTTPException(status_code=401, detail=payload["message"])
        user_id = payload["data"]["id"]
        db.execute(text("DELETE FROM refresh_tokens WHERE user_id = :id"), {"id": user_id})
        db.commit()
        return {"status": 200, "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/auth/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = JasonWebToken.verifyAccessToken(token)
        if not payload["status"]:
            raise HTTPException(status_code=401, detail=payload["message"])
        user_id = payload["data"]["id"]
        query = text("SELECT * FROM users WHERE id = :id")
        result = db.execute(query, {"id": user_id})
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "role": row["role"],
            "created_at": row["created_at"]
        }
    except Exception as e:
        logger.error(f"Fetch user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")