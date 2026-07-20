# Guía de Infraestructura y Arquitectura (Fairgreen)

Este documento detalla la arquitectura de infraestructura del proyecto Fairgreen en el entorno de producción, especificando la ubicación de cada componente y los flujos de comunicación interna y externa.

---

## 1. Arquitectura Base

La infraestructura de producción opera sobre una instancia de Amazon EC2 bajo el sistema operativo Ubuntu. La orquestación de servicios se gestiona mediante Nginx para el enrutamiento de tráfico HTTP y Docker para la contenerización y aislamiento de los servicios backend y de persistencia de datos.

---

## 2. Componentes y Despliegue

El sistema se compone de tres capas principales:

### A. Frontend (Angular)
* **Descripción:** Aplicación cliente que gestiona la interfaz de usuario.
* **Despliegue:** Se despliega de forma nativa mediante la compilación del código fuente. Los recursos estáticos generados se alojan directamente en el sistema de archivos del servidor host, específicamente en el directorio `/var/www/fairgreen/html`.

### B. Backend (Django + GeoDjango)
* **Descripción:** API REST y panel de administración encargados de la lógica de negocio y el procesamiento de datos geoespaciales.
* **Despliegue:** Se ejecuta como un servicio contenerizado a través de Docker. Los archivos estáticos propios del framework se exponen mediante un volumen de montaje en disco hacia la ruta `/var/www/fairgreen/static` del servidor anfitrión, optimizando su entrega.

### C. Base de Datos (PostgreSQL + PostGIS)
* **Descripción:** Sistema de gestión de bases de datos relacional con extensión geoespacial para el almacenamiento de entidades, usuarios y geometrías.
* **Despliegue:** Opera de manera aislada dentro de su propio contenedor Docker.
* **Persistencia de Datos:** Para garantizar la integridad y persistencia de los datos frente a reinicios o reconstrucciones del contenedor, el almacenamiento se gestiona mediante un volumen administrado por Docker. Este mecanismo mapea el directorio interno del contenedor (`/var/lib/postgresql/data/`) hacia una ubicación persistente en el sistema de archivos del servidor host. De esta manera, el ciclo de vida de los datos se independiza del ciclo de vida del contenedor, previniendo la pérdida de información en entornos efímeros.

---

## 3. Flujo de Tráfico y Enrutamiento

El servicio Nginx opera como proxy inverso principal, escuchando peticiones entrantes en el puerto 80 (HTTP) y distribuyendo el tráfico según la ruta solicitada:

1. **Tráfico Frontend (Raíz `/`):**
   Las peticiones dirigidas al dominio principal (ej. `fairgreen.cncs.cl`) son interceptadas por Nginx, el cual sirve los recursos estáticos de Angular directamente desde `/var/www/fairgreen/html`.

2. **Tráfico Backend (`/api` y `/admin`):**
   Las peticiones web que inician con el prefijo `/api` o `/admin` son derivadas por Nginx hacia el puerto local 8000. En este puerto escucha el contenedor de Django, el cual procesa la solicitud y retorna la respuesta.

3. **Comunicación Interna de Base de Datos:**
   Las consultas desde la aplicación Django hacia PostgreSQL no transitan por interfaces de red públicas. Ambos contenedores se comunican a través de una red interna definida por Docker Compose. La base de datos expone el puerto 5432 exclusivamente en esta red privada (localhost), garantizando que no existan accesos directos desde el exterior.


## 4. Almacenamiento Externo y Respaldo de Datos

El sistema implementa una estrategia dual de uso para Amazon S3:

* **Amazon S3 (Simple Storage Service):** 
  Se utiliza el bucket `fairgreen-muestras-storage` para dos propósitos críticos:
  1. **Almacenamiento de Imágenes:** Cuando los usuarios suben fotos (ej. imágenes de las muestras), el backend de Django las transfiere directamente a S3 y guarda solo la URL pública en la base de datos. Esto evita llenar el disco del servidor y previene la pérdida de archivos.
  2. **Respaldos de Base de Datos:** Los volcados (dumps) de PostgreSQL se exportan fuera del servidor EC2 hacia este mismo bucket. Este proceso se gestiona mediante el script `backup_db_s3.sh`, el cual está programado en el daemon cron del sistema operativo para ejecutarse en intervalos regulares de forma segura, asegurando redundancia de datos.
