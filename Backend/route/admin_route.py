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


@router.get('/api/admin/users')
@limiter.limit('5/minute')
def getAllUser(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    # Verify token
    payload = JasonWebToken.verifyAccessToken(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    userEmail = payload['data']['email']

    # Get role
    query = text('SELECT role FROM users WHERE email = :email')
    result = db.execute(query, {'email': userEmail}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    role = result[0]

    # Check admin
    if role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")

    # Get all users
    query = text('SELECT * FROM users')
    users = db.execute(query).mappings().all()

    return users

@router.get('/api/admin/users/{user_id}')
@limiter.limit('5/minute')
def get_user(
    user_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    # Verify token
    payload = JasonWebToken.verifyAccessToken(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = payload['data']['email']

    # Get role of current user
    query = text('SELECT role FROM users WHERE email = :email')
    result = db.execute(query, {'email': user_email}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    role = result[0]

    # Check admin access
    if role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch requested user
    query = text('SELECT * FROM users WHERE id = :id')
    user = db.execute(query, {'id': user_id}).mappings().fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Requested user not found")
    return user

@router.get('/api/admin/logs')
@limiter.limit('5/minute')
def logs(credentials:HTTPAuthorizationCredentials = Depends(security),db:Session=Depends(get_db)):
    
    token = credentials.credentials
    # Verify token
    payload = JasonWebToken.verifyAccessToken(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = payload['data']['email']

    # Get role of current user
    query = text('SELECT role FROM users WHERE email = :email')
    result = db.execute(query, {'email': user_email}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    role = result[0]

    # Check admin access
    if role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")
    
    with open(r'E:\Class Book\Secure-Software-Design-And-Engineering\Project\Backend\logs.log','r') as fs:
        data = fs.read()
    
    return {'logs' : data}


@router.get('/api/admin/rooms')
@limiter.limit('5/minute')
def get_chat_rooms(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = JasonWebToken.verifyAccessToken(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_email = payload['data']['email']

    result = db.execute(
        text('SELECT role FROM users WHERE email = :email'),
        {'email': user_email}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    role = result[0]
    if role != 'admin':
        raise HTTPException(status_code=403, detail="Access denied")

    rooms = db.execute(text('SELECT * FROM chat_rooms')).mappings().fetchall()
    return rooms