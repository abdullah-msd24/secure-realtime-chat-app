from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
TOKEN_EXPIRY_TIME_MINUTES = int(os.getenv('TOKEN_EXPIRY_TIME_MINUTES'))



def create_jwt_access_token(data: dict) -> str:
    to_encode = data.copy()

    expiry_time = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRY_TIME_MINUTES)
    to_encode.update({"exp": expiry_time})  # ✅ standard field

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verifyAccessToken(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        return {
            "status": True,
            "message": "Token is valid",
            "data": payload
        }

    except ExpiredSignatureError:
        return {
            "status": False,
            "message": "Token has expired"
        }

    except JWTError:
        return {
            "status": False,
            "message": "Invalid token"
        }