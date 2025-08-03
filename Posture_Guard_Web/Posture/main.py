from fastapi import FastAPI
from database import engine, Base
from routers import auth, posture_analyzer,result,live_posture_ai_enhanced,contact,report_ai
from fastapi.middleware.cors import CORSMiddleware
from routers.chatbot import router as chatbot
import os

Base.metadata.create_all(bind=engine)
app = FastAPI(title="PostureGuard API", version="1.0.0")

# CORS origins - production and development
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://localhost:3001",
    "http://34.173.46.223",
    "http://34.173.46.223:80",
    "http://34.173.46.223:8000",
    "https://34.173.46.223",
    ]

# Add environment variable for additional origins
if os.getenv("CORS_ORIGINS"):
    additional_origins = os.getenv("CORS_ORIGINS").split(",")
    origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(posture_analyzer.router)
app.include_router(live_posture_ai_enhanced.router)
app.include_router(result.router)
app.include_router(report_ai.router)
app.include_router(contact.router)
app.include_router(chatbot)


@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "PostureGuard API is running!", "version": "1.0.0"}
