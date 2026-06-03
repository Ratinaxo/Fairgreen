# Fairgreen API

Fairgreen es una API REST backend construida con **Django 5.2**, **Django REST Framework** y **GeoDjango** (PostgreSQL + PostGIS) para el manejo de datos espaciales.

El entorno de desarrollo está 100% dockerizado para eliminar problemas de compatibilidad y dependencias complejas (como GDAL/GEOS).

---

## 🚀 Guía de Inicio Rápido (Onboarding)

Si acabas de clonar este repositorio y quieres empezar a desarrollar, **solo necesitas tener instalado Docker**. No necesitas instalar Node.js, Python, PostgreSQL ni configurar entornos virtuales en tu máquina.

### 1. Requisitos Previos
* Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows/Mac) o Docker Engine (en Linux).
* Asegúrate de que Docker esté ejecutándose (el icono de la ballena debe aparecer en tu barra de tareas).

### 2. Levantar el Backend (API en Django + Base de Datos)
El backend requiere una configuración inicial básica de credenciales.
1. Abre tu terminal y navega a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Haz una copia del archivo `.env.example` y renómbralo a `.env.docker`.
3. Ejecuta el siguiente comando para construir y levantar los contenedores:
   ```bash
   docker-compose up -d --build
   ```
   *Nota: La primera vez tardará un par de minutos. Las siguientes veces levantará en segundos.*
4. *(Solo la primera vez)* Crea un usuario administrador para el panel de Django:
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```
   Sigue las instrucciones en pantalla.

El backend ahora estará corriendo en:
* API local: `http://localhost:8000/`
* Panel de administración: `http://localhost:8000/admin/`

### 3. Levantar el Frontend (Aplicación Angular)
El frontend también está dockerizado para evitar problemas de versiones y dependencias locales.
1. Abre **otra** terminal (o usa la misma si usaste el modo `-d` antes) y navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Ejecuta el comando para construir y levantar el contenedor del frontend:
   ```bash
   docker-compose up -d --build
   ```

El frontend ahora estará disponible y funcionando en tu navegador en:
👉 **http://localhost:4200**

---

## 🛑 Cómo apagar la aplicación
Cuando termines de trabajar, es recomendable apagar los contenedores para liberar recursos.

Para apagar el backend (desde la carpeta `backend`):
```bash
docker-compose down
```

Para apagar el frontend (desde la carpeta `frontend`):
```bash
docker-compose down
```

**Apagar y RESETEAR la base de datos por completo (borrará todo, usar con cuidado):**
Desde la carpeta `backend`:
```bash
docker-compose down -v
```

---

## 💻 Flujo de Desarrollo del Día a Día

El proyecto está configurado con **Hot-Reloading** tanto para el backend como para el frontend. Esto significa que:

1. Mantienes los contenedores corriendo de fondo.
2. Abres tu editor de código (ej. VSCode) en la carpeta raíz del proyecto.
3. Editas los archivos de código (Angular o Django).
4. Al guardar (Ctrl+S), Docker detecta el cambio e instantáneamente recarga la aplicación correspondiente. No necesitas reiniciar nada manualmente.

### Comandos Frecuentes (Backend)

*Asegúrate de estar en la carpeta `backend` para ejecutar estos comandos.*

**Crear una nueva migración (si cambiaste models.py):**
```bash
docker-compose exec web python manage.py makemigrations
```

**Aplicar las migraciones a la base de datos:**
*(Nota: El contenedor aplica las migraciones automáticamente al arrancar, pero si haces cambios mientras está corriendo, puedes usar este comando)*
```bash
docker-compose exec web python manage.py migrate
```
