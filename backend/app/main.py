import os
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .routers import todos
from .database import Base, engine, get_db
from sqlalchemy import text
from sqlalchemy.orm import Session

# .env 파일 로드
load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI()

# CORS 설정 (배포 환경)
origins = ["https://ceres.pe.kr"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def read_root(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.error("Database connection error: %s", e)
        db_status = "error"

    return {
        "message": "Connected",
        "database_status": db_status,
    }


# 라우터 포함
# tags 는 Swagger UI 에서 그룹화 해주는 역할
app.include_router(todos.router, prefix="/api", tags=["Todos"])