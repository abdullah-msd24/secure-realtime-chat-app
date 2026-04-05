from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware 
import route


app = FastAPI()

origins = ['http://localhost:3000']

class CSPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # call_next is the function runs the route the actual route and return response
        response = await call_next(request)
        # add Content security policy

        # only load resources = default-src
        # script-src = only allow javascript from your own server 
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self';"
        return response

app.add_middleware(CSPMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Specific origins or ["*"] for all
    allow_credentials=True,         # Allows cookies/auth headers
    allow_methods=["*"],            # ["GET", "POST", etc.]
    allow_headers=["*"],            # Allows all headers
)
app.include_router(route.auth)
