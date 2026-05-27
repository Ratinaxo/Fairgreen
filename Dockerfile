# =============================================================================
# Fairgreen — Dockerfile (producción)
# =============================================================================
# Imagen base ligera de Python 3.12
FROM python:3.12-slim AS base

# --- Variables de entorno de Python ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# --- Dependencias del sistema para psycopg2-binary ---
# libpq-dev es necesario en runtime para que psycopg2-binary encuentre libpq.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# --- Instalar dependencias de Python ---
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# --- Copiar código fuente ---
COPY . /app/

# --- Recoger archivos estáticos ---
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# --- Crear usuario no-root por seguridad ---
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup appuser

# --- Dar permisos al entrypoint ---
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# --- Cambiar a usuario no-root ---
USER appuser

# --- Puerto expuesto ---
EXPOSE 8000

# --- Punto de entrada ---
ENTRYPOINT ["/app/entrypoint.sh"]
