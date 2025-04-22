import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL 환경변수가 설정되지 않았습니다")

# SQLAlchemy 설정
# create_engine은 SQLAlchemy의 핵심 인터페이스입니다.
# 데이터베이스 서버와의 연결 풀을 관리합니다.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

# 데이터베이스 세션 생성
# sessionmaker는 Session 클래스를 만드는 팩토리 함수입니다.
# autocommit=False: 변경 사항을 명시적으로 commit 해야 DB에 반영됩니다.
# autoflush=False: 쿼리 전에 자동으로 flush(임시 변경 사항을 DB에 반영 시도)하지 않습니다.
# bind=engine: 이 세션 생성기가 사용할 엔진을 지정합니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 기본 모델 클래스 생성
# declarative_base()는 모델 클래스들이 상속받을 기본 클래스를 반환합니다.
# 이 Base 클래스를 상속받는 클래스들은 SQLAlchemy에 의해 테이블과 매핑됩니다.
Base = declarative_base()


# 데이터베이스 세션을 가져오는 함수 (DI)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
