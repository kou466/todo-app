# backend/app/main.py
import os
import zoneinfo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, field_serializer
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from . import models, database
from typing import List
from datetime import datetime
from zoneinfo import ZoneInfo

# .env 파일 로드 (uvicorn 실행 전에 환경변수 설정 시 생략 가능)
load_dotenv()

# 환경 변수에서 DB URL 읽기 (예시)
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")  # 로드 확인용 출력

kst = ZoneInfo("Asia/Seoul")


class TodoBase(BaseModel):
    title: str
    description: str | None = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(TodoBase):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None


class Todo(TodoBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        # naive datetime이면 UTC로 지정
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=kst)
        return dt.isoformat()

    @field_serializer("updated_at")
    def serialize_updated_at(self, dt: datetime, _info):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=kst)
        return dt.isoformat()

    class Config:
        from_attributes = True


app = FastAPI()

# 로컬 개발 환경을 위한 CORS 설정
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1",
    "http://127.0.0.1:8080",
    "null",  # file:/// 접근 허용 (주의)
    "http://127.0.0.1:5500",  # VS Code Live Server 기본 포트
    "http://localhost:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
def read_root():
    # DB 연결 테스트 등 추가 가능
    return {"message": "Connected"}


# TODO: 여기에 /api/todos 라우터 및 DB 연동 로직 추가 예정


@app.get("/api/todos", response_model=List[Todo])
def get_todos(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    todos = db.query(models.Todo).offset(skip).limit(limit).all()
    return todos


@app.post("/api/todos")
def create_todo(todo: TodoCreate, db: Session = Depends(database.get_db)):
    db_todo = models.Todo(**todo.model_dump())
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


@app.put("/api/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(database.get_db)):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    update_data = todo.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_todo, key, value)

    db.commit()
    db.refresh(db_todo)
    return db_todo


@app.delete("/api/todos/{todo_id}", response_model=dict)
def delete_todo(todo_id: int, db: Session = Depends(database.get_db)):
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    db.delete(db_todo)
    db.commit()
    return {"message": "Todo deleted successfully"}
