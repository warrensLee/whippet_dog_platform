FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

RUN useradd backend --system --create-home && \
    chown -R backend:backend /app /home/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

USER backend 
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost:8000/api/health || exit 1


# Run the application
CMD ["gunicorn", "-b","0.0.0.0:8000", "--timeout", "500", "main:app"]