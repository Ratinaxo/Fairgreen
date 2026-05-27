# Fairgreen API

Fairgreen es una API REST backend construida con **Django 5.2**, **Django REST Framework** y **GeoDjango** (PostgreSQL + PostGIS) para el manejo de datos espaciales.

El entorno de desarrollo está 100% dockerizado para eliminar problemas de compatibilidad y dependencias complejas (como GDAL/GEOS).

---

## 🚀 Guía de Inicio Rápido (Onboarding)

Si acabas de clonar este repositorio y quieres empezar a desarrollar, **solo necesitas tener instalado Docker**. No necesitas instalar Python, PostgreSQL ni configurar entornos virtuales en tu máquina.

Sigue estos 4 pasos:

### 1. Requisitos Previos
* Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows/Mac) o Docker Engine (en Linux).
* Asegúrate de que Docker esté ejecutándose.

### 2. Configurar el Entorno
El proyecto necesita un archivo con las credenciales locales para Docker.
1. Haz una copia del archivo `.env.example` y renómbralo a `.env.docker`.
2. *(Opcional)* Genera una `SECRET_KEY` segura y colócala en `.env.docker` si lo deseas, aunque para desarrollo local el valor por defecto es suficiente.

### 3. Construir y Levantar el Proyecto
Abre tu terminal en la carpeta raíz del proyecto y ejecuta:

```bash
docker-compose up --build
```
*¿Qué hace esto?* Descargará una base de datos PostGIS, instalará las dependencias complejas de mapas (GDAL/GEOS), instalará las librerías de Python y levantará el servidor de Django. 

*Nota: La primera vez tardará un par de minutos. Las siguientes veces levantará en segundos.*

### 4. Crear el Superusuario
En una terminal nueva (mientras el paso anterior sigue corriendo), ejecuta este comando para crear tu usuario administrador:

```bash
docker-compose exec web python manage.py createsuperuser
```
Sigue las instrucciones en pantalla para poner tu correo y contraseña.

**¡Listo!** Ya puedes acceder a:
* La API local: `http://localhost:8000/`
* El panel de administración: `http://localhost:8000/admin/`

---

## 💻 Flujo de Desarrollo del Día a Día

El proyecto está configurado con **Hot-Reloading**. Esto significa que:

1. Mantienes la terminal con `docker-compose up` corriendo de fondo.
2. Abres tu editor de código (ej. VSCode) en tu sistema operativo normal.
3. Editas los archivos de Python.
4. Al guardar (Ctrl+S), Docker detecta el cambio e instantáneamente recarga el servidor. No necesitas reiniciar nada.

### Comandos Frecuentes

**Crear una nueva migración (si cambiaste models.py):**
```bash
docker-compose exec web python manage.py makemigrations
```

**Aplicar las migraciones a la base de datos:**
*(Nota: El contenedor aplica las migraciones automáticamente al arrancar, pero si haces cambios mientras está corriendo, puedes usar este comando)*
```bash
docker-compose exec web python manage.py migrate
```

**Apagar el entorno al terminar el día:**
```bash
docker-compose down
```

**Apagar y RESETEAR la base de datos por completo (borrará todo):**
```bash
docker-compose down -v
```
