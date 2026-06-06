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

Conéctate mediante la terminal a tu EC2 (`ssh -i "llave.pem" ubuntu@TU_IP`) y sigue este flujo para actualizar el servidor:

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
scp -i "llave.pem" -r C:\Users\alexa\Desktop\Fairgreen\frontend\dist\angular-app\browser\* ubuntu@TU_IP_PUBLICA:/var/www/fairgreen/html/
```

### 3. Dar permisos a los archivos transferidos (En el Servidor EC2)
```bash
sudo find /var/www/fairgreen/html -type d -exec chmod 755 {} \;
sudo find /var/www/fairgreen/html -type f -exec chmod 644 {} \;
```
