import os
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

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
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# ***************************** update this endpoint only access this api endpoint first decrypt the jwt token and if the and verify the role is admin and email is same as Admincredentials model says then access endpoints 
# ── Reusable Auth Dependency ─────────────────────────────
# Extract this repeated block into ONE dependency function
def verify_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> str:
    """Verify JWT token and confirm user is an admin. Returns the admin email."""
    
    token = credentials.credentials
    
    # 1. Verify Token
    payload = JasonWebToken.verifyAccessToken(token)
    if not payload:
        logger.warning("AUTH FAILURE: JWT could not be verified.")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # 2. Extract Email
    try:
        user_email = payload['data']['email']
    except KeyError:
        logger.error(f"STRUCTURE ERROR: 'email' not found in payload. Keys: {payload.keys()}")
        raise HTTPException(status_code=422, detail="Token structure invalid")
    
    # 3. Check Admin Table
    query = text('SELECT EXISTS(SELECT 1 FROM admin_table WHERE LOWER(email) = LOWER(:email))')
    result = db.execute(query, {'email': user_email}).fetchone()
    exists = result[0] if result else False
    
    if not exists:
        logger.warning(f"PERMISSION DENIED: {user_email} is not an admin.")
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logger.info(f"ADMIN VERIFIED: {user_email}")
    return user_email


@router.get('/api/admin/users')
def getAllUser(
    admin_email: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    logger.info(f"GET ALL USERS — requested by {admin_email}")
    
    # Avoid SELECT * — only return safe columns
    query = text('SELECT id, username, email, created_at FROM users')
    users = db.execute(query).mappings().all()
    
    logger.info(f"RETURNED {len(users)} users")
    return users


@router.get('/api/admin/users/{user_id}')
def get_user(
    user_id: int,
    admin_email: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    logger.info(f"GET USER {user_id} — requested by {admin_email}")
    
    query = text('SELECT id, username, email, created_at FROM users WHERE id = :id')
    user = db.execute(query, {'id': user_id}).mappings().fetchone()
    
    if not user:
        logger.warning(f"USER NOT FOUND: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get('/api/admin/logs')
def get_logs(
    admin_email: str = Depends(verify_admin),
):
    logger.info(f"GET LOGS — requested by {admin_email}")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(BASE_DIR, '..', 'logs.log')
    log_path = os.path.normpath(log_path)
    
    logger.info(f"READING LOG FILE: {log_path}")
    
    try:
        # Try UTF-8 first, fall back to Windows-1252, replace any remaining bad bytes
        try:
            with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
                data = f.read()
        except Exception:
            with open(log_path, 'r', encoding='windows-1252', errors='replace') as f:
                data = f.read()

        logger.info("LOG FILE READ SUCCESSFUL")
        return {'logs': data}
    except FileNotFoundError:
        logger.error(f"FILE NOT FOUND: {log_path}")
        raise HTTPException(status_code=500, detail="Log file not found")
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR reading logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get('/api/admin/rooms')
def get_chat_rooms(
    admin_email: str = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    logger.info(f"GET ROOMS — requested by {admin_email}")
    
    rooms = db.execute(text('SELECT * FROM chat_rooms')).mappings().fetchall()
    
    logger.info(f"RETURNED {len(rooms)} rooms")
    return rooms