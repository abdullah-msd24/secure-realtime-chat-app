from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from starlette.middleware.base import BaseHTTPMiddleware
from PostgresSql.database import Base, engine
from PostgresSql import models


# Create all tables
Base.metadata.create_all(bind=engine)
# Import routers
from route.auth import router as authRouter
from route.admin_route import router as adminRouter
from route.chats import router as chatRouter

# Initialize app
app = FastAPI(title="Secure Software API")

# CORS setup
origins = ['http://localhost:3000']
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # CSP middleware
# class CSPMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request, call_next):
#         response = await call_next(request)
#         response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self';"
#         return response

# app.add_middleware(CSPMiddleware)

# Include routers
app.include_router(authRouter)
app.include_router(adminRouter)
app.include_router(chatRouter)