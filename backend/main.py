import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google.genai import errors as genai_errors
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator

load_dotenv() # Reload environment variables from .env

from services import db
from routers import analyze, history, chat

ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]

 
@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect_db()
    yield
    await db.close_db()


app = FastAPI(title="LegalEase API", version="1.0.0", lifespan=lifespan)

# Add Prometheus instrumentation
Instrumentator().instrument(app).expose(app)


@app.exception_handler(genai_errors.APIError)
async def genai_exception_handler(request: Request, exc: genai_errors.APIError):
    if exc.code == 429:
        return JSONResponse(
            status_code=429,
            content={"detail": "AI Quota exceeded. Please wait a few minutes or try again later."},
        )
    return JSONResponse(
        status_code=exc.code or 500,
        content={"detail": f"AI Service Error: {exc.message}"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, tags=["Analysis"])
app.include_router(history.router, tags=["History"])
app.include_router(chat.router, tags=["Chat"])


@app.get("/")
async def root():
    return {"message": "LegalEase API is running"}
