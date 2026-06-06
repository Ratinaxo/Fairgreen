# Fairgreen API

Fairgreen es una API REST backend construida con **Django 5.2**, **Django REST Framework** y **GeoDjango** (PostgreSQL + PostGIS) para el manejo de datos espaciales.

El entorno de desarrollo está 100% dockerizado para eliminar problemas de compatibilidad y dependencias complejas (como GDAL/GEOS).

---

## 🚀 Guía de Inicio Rápido (Onboarding)

Si acabas de clonar este repositorio y quieres empezar a desarrollar, **solo necesitas tener instalado Docker**. No necesitas instalar Node.js, Python, PostgreSQL ni configurar entornos virtuales en tu máquina.

### 1. Requisitos Previos
* Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows/Mac) o Docker Engine (en Linux).
* Asegúrate de que Docker esté ejecutándose (el icono de la ballena debe aparecer en tu barra de tareas).

### 2. Levantar el Proyecto Completo (Backend + Frontend + Base de Datos)
Toda la orquestación está centralizada en la carpeta raíz.

1. Abre tu terminal en la carpeta **raíz** del proyecto (`Fairgreen`).
2. Configura las credenciales del backend:
   Crea una copia del archivo `backend/.env.example` y renómbrala a `backend/.env.docker`.
3. Ejecuta el comando para construir y levantar todos los contenedores:
   ```bash
   docker-compose up -d --build
   ```
   *Nota: La primera vez tardará varios minutos. Las siguientes veces levantará en segundos.*

El proyecto ahora estará disponible en tu navegador:
👉 **Frontend (Angular):** `http://localhost:4200`
👉 **Backend (Django API):** `http://localhost:8000/`
👉 **Panel de administración:** `http://localhost:8000/admin/`

---

## 🛑 Cómo apagar la aplicación
Cuando termines de trabajar, es recomendable apagar los contenedores para liberar recursos.

Desde la carpeta **raíz** del proyecto, ejecuta:
```bash
docker-compose down
```

**Apagar y RESETEAR la base de datos por completo (borrará todo, usar con cuidado):**
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

### Ejecutar partes específicas

Si alguna vez necesitas trabajar solo en una parte del proyecto, puedes decirle a Docker que levante solo ese contenedor (desde la carpeta raíz):
```bash
docker-compose up -d frontend   # Levanta solo el frontend
docker-compose up -d backend    # Levanta el backend y la base de datos
```

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
