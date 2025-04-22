from pydantic import BaseModel, field_serializer, ConfigDict
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

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

    @field_serializer("created_at", "updated_at")
    def serialize_datetime_as_kst(self, dt: datetime, _info):
        # DB에서 읽어온 datetime 객체가 naive라면 UTC로 간주
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        kst_dt = dt.astimezone(kst)
        return kst_dt.isoformat()

    model_config = ConfigDict(from_attributes=True)
