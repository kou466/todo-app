from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, func
from .database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.utc_timestamp())
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.utc_timestamp(),
        onupdate=func.utc_timestamp(),
    )
