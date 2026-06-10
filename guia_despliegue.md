# Guía de Despliegue en Producción (AWS EC2)

Esta guía detalla el flujo de trabajo correcto para actualizar el código local, pasarlo a la rama de `produccion` y desplegarlo de manera segura en el servidor AWS EC2 de Fairgreen sin perder consistencia en la base de datos.

---

## FASE 1: En tu Computadora Local (PC)

Cada vez que completes una característica en tu rama de desarrollo (`main`) y quieras subirla a producción, sigue este orden:

### 1. Guardar cambios en `main`
```bash
# 1. Asegúrate de estar en la rama de desarrollo
git checkout main

# 2. Agregar todos los cambios realizados
git add .

# 3. Guardar cambios
git commit -m "feat: descripción de los cambios realizados"

# 4. Enviar a GitHub
git push origin main
```

### 2. Llevar los cambios a la rama de `produccion`
```bash
# 1. Cambiar a la rama de producción
git checkout produccion

# 2. Traer (fusionar) lo que hay en main hacia produccion
git merge main

# 3. Subir los cambios de producción a GitHub
git push origin produccion

# 4. Volver a main para seguir desarrollando localmente
git checkout main
```

---

## FASE 2: En el Servidor AWS EC2 (Código y Backend)

Conéctate mediante la terminal a tu EC2 (`ssh -i "llave-fairgreen.pem" ubuntu@TU_IP`) y sigue este flujo para actualizar el servidor:

> [!WARNING]
> **Control de IPs y DNS (DuckDNS y FreeDNS/Afraid):**
> * Si detienes/apagas la instancia de EC2 y **no** tienes asociada una **IP Elástica (Elastic IP)** en AWS, la IP pública cambiará.
> * Si la IP pública cambia, debes actualizarla en tus proveedores de DNS para que los dominios sigan apuntando al servidor:
>   * **DuckDNS:** Actualiza `fairgreen.duckdns.org` con la nueva IP en [duckdns.org](https://www.duckdns.org/).
>   * **FreeDNS (Afraid.org):** Actualiza `fairgreen.crabdance.com` ingresando a [freedns.afraid.org](https://freedns.afraid.org/), ve a la sección *Subdomains* y actualiza el valor de la IP.
> * Se recomienda reservar y asociar una **IP Elástica** en AWS para evitar que la IP cambie.



### 1. Limpieza de seguridad (Solo si Git detecta conflictos locales)
Si realizaste modificaciones directas en el servidor y Git te bloquea el cambio de rama o el `pull`, corre esto para limpiar el estado del repositorio:
```bash
cd /var/www/fairgreen

# Deshace cualquier cambio en archivos existentes
git checkout -- .

# Elimina archivos/carpetas nuevas creadas temporalmente
git clean -fd
```
> [!NOTE]  
> Esto no afectará a tu archivo `.env.prod` ya que está ignorado en el `.gitignore`.

### 2. Cambiar a la rama `produccion` (Solo la primera vez)
```bash
git fetch origin
git checkout produccion
```

### 3. Descargar las actualizaciones
```bash
git pull origin produccion
```

### 4. Reconstruir contenedores de Docker (Django + Base de datos)
Si actualizaste modelos de base de datos o dependencias en `requirements.txt`:
```bash
docker compose up -d --build
```

### 5. IMPORTANTE: Solución de Permisos en el Servidor
Dado que al limpiar o recrear las carpetas Nginx y Django pueden perder acceso de escritura/lectura en el disco del servidor, ejecuta siempre estos comandos:

#### A. Para el Backend (Django static files)
Si el backend entra en bucle de reinicios por un error de `Permission denied: '/app/staticfiles/admin'`:
```bash
sudo chmod 777 /var/www/fairgreen/static
docker compose restart backend
```

#### B. Para el Frontend (Angular assets/imágenes)
Si el frontend carga bien, pero no se ven las imágenes o logos dentro de la aplicación:
```bash
sudo find /var/www/fairgreen/html -type d -exec chmod 755 {} \;
sudo find /var/www/fairgreen/html -type f -exec chmod 644 {} \;
```

---

## FASE 3: Actualizar el Frontend (PC Local -> Servidor)

Dado que Angular se sirve de manera estática directamente por Nginx (sin Docker), cada vez que actualices el frontend, corre esto desde tu **PC local**:

### 1. Compilar el Frontend
```bash
cd C:\Users\alexa\Desktop\Fairgreen\frontend
npm run build
```

### 2. Transferir los archivos compilados al servidor
```bash
scp -i "llave-fairgreen.pem" -r C:\Users\alexa\Desktop\Fairgreen\frontend\dist\angular-app\browser\* ubuntu@TU_IP_PUBLICA:/var/www/fairgreen/html/
```

### 3. Dar permisos a los archivos transferidos (En el Servidor EC2)
```bash
sudo find /var/www/fairgreen/html -type d -exec chmod 755 {} \;
sudo find /var/www/fairgreen/html -type f -exec chmod 644 {} \;
```

---

## FASE 4: Diagnóstico y Monitoreo del Servidor (Comandos Útiles)

Si notas lentitud, errores 500/502 (Bad Gateway), o simplemente quieres verificar que todo esté funcionando correctamente en el servidor EC2, utiliza los siguientes comandos:

### 1. Estado de Docker en General
```bash
# Ver el estado y tiempo de actividad de todos los contenedores
docker compose ps

# Monitorear el uso de CPU, Memoria y Red de los contenedores en tiempo real
docker stats

# Ver los logs combinados de todos los servicios (con seguimiento en tiempo real)
docker compose logs -f --tail=100
```

### 2. Estado y Logs del Backend (Django)
```bash
# Ver si el contenedor del backend está activo o si se está reiniciando
docker compose ps backend

# Ver logs en tiempo real del backend para depurar errores de Django o Nginx (ej. errores 502)
docker compose logs -f --tail=100 backend

# Entrar a la terminal interactiva del backend (útil para revisar archivos internos)
docker compose exec backend sh

# Verificar el estado de las migraciones de Django en la base de datos de producción
docker compose exec backend python manage.py showmigrations
```

### 3. Estado y Conexión de la Base de Datos (PostgreSQL)
```bash
# Ver si el contenedor de la base de datos está activo y saludable
docker compose ps db

# Ver logs del motor de base de datos PostgreSQL
docker compose logs -f --tail=100 db

# Verificar si la base de datos está lista y aceptando conexiones
docker compose exec db pg_isready -U fairgreen_admin -d fairgreen_db

# Entrar directamente a la consola interactiva psql de la base de datos para consultas SQL
docker compose exec db psql -U fairgreen_admin -d fairgreen_db
```

