# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

# .env 파일 로드 (uvicorn 실행 전에 환경변수 설정 시 생략 가능)
load_dotenv()

# 환경 변수에서 DB URL 읽기 (예시)
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Database URL: {DATABASE_URL}")  # 로드 확인용 출력

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


class Todo(BaseModel):
    title: str
    description: str
    completed: bool


@app.get("/api")
def read_root():
    # DB 연결 테스트 등 추가 가능
    return {"message": "FastAPI Backend is running!", "db_url": DATABASE_URL}


# TODO: 여기에 /api/todos 라우터 및 DB 연동 로직 추가 예정

@app.get("/api/todos")
def get_todos():
    return {"message": "Todos fetched successfully"}

@app.post("/api/todos")
def create_todo(todo: Todo):
    return {"message": "Todo created successfully"}

@app.put("/api/todos/{todo_id}")
def update_todo(todo_id: int, todo: Todo):
    return {"message": "Todo updated successfully"}

@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int):
    return {"message": "Todo deleted successfully"}

