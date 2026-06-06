FROM postgres:16

# Instalar PostGIS usando los paquetes oficiales de Debian (disponibles nativamente para ARM64)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       postgresql-16-postgis-3 \
       postgresql-16-postgis-3-scripts \
    && rm -rf /var/lib/apt/lists/*

# Copiar script de inicialización para crear las extensiones automáticamente
COPY ./initdb-postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh
RUN sed -i 's/\r$//' /docker-entrypoint-initdb.d/10_postgis.sh \
    && chmod +x /docker-entrypoint-initdb.d/10_postgis.sh

