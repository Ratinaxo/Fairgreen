# Guía de Instalación desde Cero (AWS EC2)

Esta guía detalla el proceso paso a paso para montar el proyecto **FairGreen** en una instancia EC2 completamente nueva, dejando la base de datos oficial limpia y lista para producción (solo con el mapa dibujado).

---

## 1. Preparación del Servidor EC2 (Ubuntu)

Una vez que hayas creado tu nueva instancia EC2 en AWS y te conectes por SSH, lo primero es actualizar el sistema e instalar las herramientas necesarias (Docker, Nginx y Git).

```bash
# Actualizar los paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx y Git
sudo apt install nginx git -y

# Instalar Docker
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu  # Otorga permisos al usuario ubuntu para usar docker

# Instalar Docker Compose
sudo apt install docker-compose-v2 -y
```
> [!NOTE]
> Cierra sesión en tu servidor (`exit`) y vuelve a entrar por SSH para que los permisos de Docker surtan efecto.

---

## 2. Clonar el Proyecto

Necesitas traer tu código al servidor. Si tu repositorio es privado, deberás generar una llave SSH en el servidor (`ssh-keygen`) y agregarla a tu GitHub.

```bash
# Clonar el proyecto en la carpeta del usuario
git clone git@github.com:TU_USUARIO/Fairgreen.git
cd Fairgreen

# Cambiar a la rama de producción
git checkout produccion
```

---

## 3. Configuración de Variables de Entorno

El servidor necesita saber las contraseñas de la base de datos, credenciales de AWS, etc.

```bash
# Crear el archivo .env.prod (reemplaza los valores con los tuyos reales)
nano .env.prod
```

Pega el siguiente contenido y ajusta los valores:
```env
DEBUG=False
DJANGO_SECRET_KEY=tu_secreto_largo_y_seguro
DATABASE_URL=postgres://fairgreen_admin:TU_CONTRASEÑA@db:5432/fairgreen_db

POSTGRES_DB=fairgreen_db
POSTGRES_USER=fairgreen_admin
POSTGRES_PASSWORD=TU_CONTRASEÑA

AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_STORAGE_BUCKET_NAME=fairgreen-muestras-storage
```
Guarda y sal del editor (Ctrl+O, Enter, Ctrl+X).

---

## 4. Construir y Levantar el Backend (Docker)

Con el código y las variables listas, procedemos a construir los contenedores.

```bash
# Construir y levantar los contenedores en segundo plano
docker compose up -d --build
```
Espera un par de minutos a que PostgreSQL (la base de datos) inicie correctamente. Puedes verificar que todo esté encendido con:
```bash
docker compose ps
```

---

## 5. Cargar la Base de Datos Oficial (Greens y Fairways)

Aquí es donde configuramos la base de datos para que esté limpia pero con los polígonos del mapa listos.

```bash
# 1. Crear las tablas vacías en la base de datos
docker compose exec backend python manage.py migrate

# 2. Cargar ÚNICAMENTE los Greens y Fairways (el mapa)
docker compose exec backend python manage.py loaddata secciones.json

# 3. Crear tu usuario Administrador oficial (te pedirá Rut, Correo y Contraseña)
docker compose exec backend python manage.py createsuperuser
```
> [!IMPORTANT]
> El usuario que acabas de crear será el que uses para iniciar sesión en el frontend por primera vez.

---

## 6. Configurar Nginx y Permisos

Debemos preparar la carpeta pública donde Nginx servirá el Frontend y los archivos estáticos de Django.

```bash
# Crear las carpetas si no existen
sudo mkdir -p /var/www/fairgreen/html
sudo mkdir -p /var/www/fairgreen/static

# Dar permisos a la carpeta static para que Django pueda escribir ahí
sudo chmod 777 /var/www/fairgreen/static

# Recolectar archivos estáticos del panel de admin de Django
docker compose exec backend python manage.py collectstatic --noinput
```

*(La configuración específica del archivo `/etc/nginx/sites-available/fairgreen` dependerá de tus dominios DuckDNS/FreeDNS y la debes mantener como la tienes actualmente).*

---

## 7. Desplegar el Frontend por Primera Vez

En este punto, el servidor está listo esperando los archivos compilados de Angular.

**En tu PC LOCAL (no en el servidor):**
```bash
# 1. Compilar Angular
cd C:\Users\alexa\Desktop\Fairgreen\frontend
npm run build

# 2. Transferir al servidor (reemplaza TU_IP y tu llave)
scp -i "llave-fairgreen.pem" -r C:\Users\alexa\Desktop\Fairgreen\frontend\dist\angular-app\browser\* ubuntu@TU_IP:/var/www/fairgreen/html/
```

**De vuelta en el SERVIDOR EC2:**
```bash
# Ajustar los permisos de los archivos recién subidos
sudo find /var/www/fairgreen/html -type d -exec chmod 755 {} \;
sudo find /var/www/fairgreen/html -type f -exec chmod 644 {} \;
```

¡Felicidades! 🎉 Tu servidor de producción está montado desde cero, con una base de datos limpia y el mapa configurado.
