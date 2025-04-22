# backend/Dockerfile
FROM python:3.13.2 # conda 환경과 유사한 버전

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app/app # app 폴더 전체 복사

# .env 파일을 이미지에 포함시키지 않도록 주의! (환경변수는 docker-compose에서 주입)

EXPOSE 8000

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# 개발 중에는 --reload 옵션이 유용하지만, 실제 이미지에는 빼는 것이 좋음
# 아래는 production용 실행 예시 (Gunicorn + Uvicorn worker) - 지금은 CMD 주석처리하고 로컬 실행 우선
# CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]
# 우선 uvicorn 기본 실행으로 정의
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]