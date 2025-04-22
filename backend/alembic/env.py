import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.database import Base
import app.models # models.py를 임포트하여 Base.metadata에 모델들이 등록되도록 함

target_metadata = Base.metadata

# --- 데이터베이스 URL 설정 (alembic.ini에서 환경 변수 참조 시) ---
from dotenv import load_dotenv
# .env 파일 위치를 현재 env.py 기준이 아닌, alembic 명령어 실행 위치(backend) 기준으로 설정
# load_dotenv(os.path.join(project_dir, '.env')) -> 아래와 같이 수정
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env')) # env.py -> alembic -> backend -> .env

config_section = context.config.get_section(context.config.config_ini_section)
config_section["DATABASE_URL"] = os.getenv("DATABASE_URL")

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# target_metadata = None

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # connectable = engine_from_config(
    #     config.get_section(config.config_ini_section, {}),
    #     prefix="sqlalchemy.",
    #     poolclass=pool.NullPool,
    # )
    configuration = config.get_section(config.config_ini_section)
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL 환경 변수를 찾을 수 없습니다. .env 파일을 확인하세요.")
    configuration['sqlalchemy.url'] = db_url
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

# 1. backend/app/models.py 파일에서 SQLAlchemy 모델을 수정합니다. (예: 새로운 컬럼 추가)
# 2. alembic revision --autogenerate -m "새 컬럼 추가 등 변경 사항 설명" 명령어를 실행하여 변경 사항을 감지하고 새로운 마이그레이션 스크립트를 생성합니다.
# 3. 생성된 새 스크립트를 검토합니다.
# 4. alembic upgrade head 명령어를 실행하여 새로운 스크립트에 정의된 변경 사항을 실제 데이터베이스에 적용합니다.