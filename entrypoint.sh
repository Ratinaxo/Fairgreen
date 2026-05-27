#!/bin/sh
# =============================================================================
# entrypoint.sh — Espera a Postgres, ejecuta migraciones, y arranca Gunicorn
# =============================================================================
set -e

echo "⏳ Esperando a que PostgreSQL esté listo..."
# Intentar conectar a Postgres hasta 30 veces (1 segundo entre intentos)
MAX_RETRIES=30
RETRIES=0
until python -c "
import os, sys
import psycopg2
try:
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'fairgreen'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'db'),
        port=os.environ.get('DB_PORT', '5432'),
    )
    sys.exit(0)
except psycopg2.OperationalError:
    sys.exit(1)
" 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
        echo "❌ No se pudo conectar a PostgreSQL después de $MAX_RETRIES intentos. Abortando."
        exit 1
    fi
    echo "   Intento $RETRIES/$MAX_RETRIES — Postgres no está listo, reintentando en 1s..."
    sleep 1
done

echo "✅ PostgreSQL está listo."

echo "🔄 Ejecutando migraciones..."
python manage.py migrate --noinput

echo "🚀 Iniciando Gunicorn..."
exec gunicorn fairgreen_api.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
