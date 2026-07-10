#!/bin/bash

# =============================================================================
# Script de Respaldo de Base de Datos PostgreSQL y Subida a Amazon S3
# =============================================================================
# Este script se ejecuta en el servidor EC2 (host).
# 1. Obtiene las credenciales del archivo .env.prod (o el que se le pase por parámetro).
# 2. Hace un pg_dump de la base de datos dentro del contenedor de Docker.
# 3. Sube el archivo comprimido a S3 usando el contenedor amazon/aws-cli.
# 4. Elimina el archivo temporal local.
# =============================================================================

# Ir al directorio donde se encuentra este script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Archivo de entorno por defecto
ENV_FILE=".env.prod"

# Si se pasa un argumento, usarlo como archivo de entorno
if [ ! -z "$1" ]; then
    ENV_FILE="$1"
fi

# Validar que el archivo de entorno exista
if [ ! -f "$ENV_FILE" ]; then
    echo "[ERROR] El archivo de entorno '$ENV_FILE' no existe."
    exit 1
fi

echo "=== Iniciando proceso de respaldo: $(date) ==="
echo "Cargando variables desde $ENV_FILE..."

# Cargando variables de entorno de forma segura (soportando comillas y comentarios)
while IFS= read -r line || [ -n "$line" ]; do
    # Ignorar comentarios y líneas vacías
    if [[ ! "$line" =~ ^# ]] && [[ ! -z "$line" ]]; then
        key=$(echo "$line" | cut -d'=' -f1)
        val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export "$key=$val"
    fi
done < "$ENV_FILE"

# Validar variables críticas
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$AWS_STORAGE_BUCKET_NAME" ]; then
    echo "[ERROR] Faltan variables obligatorias (DB_NAME, DB_USER, AWS_STORAGE_BUCKET_NAME) en $ENV_FILE."
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp"
BACKUP_FILENAME="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "1. Respaldando base de datos '$DB_NAME' desde el contenedor..."
# Nota: Usamos -T para no requerir un TTY en ejecución cron interactiva
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_PATH"

if [ $? -ne 0 ] || [ ! -f "$BACKUP_PATH" ]; then
    echo "[ERROR] Falló la creación del dump de la base de datos."
    exit 1
fi

echo "Dump creado exitosamente en: $BACKUP_PATH ($(du -sh $BACKUP_PATH | cut -f1))"

echo "2. Subiendo respaldo a Amazon S3 (s3://$AWS_STORAGE_BUCKET_NAME/backups/$BACKUP_FILENAME)..."
docker run --rm \
  -v "${BACKUP_DIR}:${BACKUP_DIR}" \
  -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  -e AWS_DEFAULT_REGION="${AWS_S3_REGION_NAME:-us-east-1}" \
  amazon/aws-cli s3 cp "$BACKUP_PATH" "s3://${AWS_STORAGE_BUCKET_NAME}/backups/${BACKUP_FILENAME}"

if [ $? -eq 0 ]; then
    echo "[OK] Respaldo subido correctamente a S3."
    # 3. Limpieza de archivos temporales
    rm -f "$BACKUP_PATH"
    echo "Archivo temporal local eliminado."
else
    echo "[ERROR] Falló la subida a S3."
    rm -f "$BACKUP_PATH"
    exit 1
fi

echo "=== Proceso finalizado con éxito: $(date) ==="
