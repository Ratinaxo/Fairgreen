# Guía de Inicio: Cómo Ejecutar Fairgreen Frontend con Docker

Esta guía está diseñada para que cualquier persona en el equipo, independientemente de sus conocimientos técnicos sobre contenedores, pueda encender y visualizar la aplicación frontend de Fairgreen en su computadora.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu computadora:

1. **Docker Desktop:** Es el motor que permite correr los contenedores.
   - [Descargar Docker Desktop para Windows / Mac](https://www.docker.com/products/docker-desktop/)
   - *Nota: Asegúrate de instalarlo, abrirlo y dejarlo ejecutándose en segundo plano (verás el icono de una ballena en tu barra de tareas).*

2. **Git / Terminal:** Necesitas una consola de comandos (Símbolo del sistema, PowerShell, o Git Bash) para escribir las instrucciones.

---

## 🚀 Pasos para Iniciar la Aplicación

Sigue estos 3 simples pasos cada vez que quieras trabajar o ver el frontend:

### Paso 1: Abre Docker Desktop
Antes de teclear ningún comando, **busca "Docker Desktop"** en tu menú de inicio y ábrelo. 
Espera un par de minutos hasta que la aplicación te indique que está lista o en color verde ("Engine running").

### Paso 2: Abre la consola y ubícate en la carpeta del frontend
Abre tu consola de comandos y navega hasta la carpeta `frontend` dentro del proyecto de Fairgreen. Puedes hacerlo con el comando `cd` (Change Directory).

Ejemplo:
```bash
cd D:\Usuario\Documents\githubstuff\Fairgreen\frontend
```

### Paso 3: Ejecuta el comando mágico de Docker
Una vez que estés dentro de la carpeta `frontend`, escribe el siguiente comando y presiona `Enter`:

```bash
docker-compose up -d --build
```

**¿Qué hace este comando?**
- Descarga todo lo necesario automáticamente.
- Construye la aplicación de Angular.
- Levanta un servidor web para que puedas verla.
- El `-d` hace que se ejecute en segundo plano, así que podrás seguir usando tu consola.

*Nota: La primera vez que lo ejecutes puede tardar un par de minutos porque descargará imágenes de internet. Las siguientes veces será casi instantáneo.*

---

## 👀 Cómo ver la aplicación funcionando

Una vez que el comando del Paso 3 termine y no muestre errores, abre tu navegador web favorito (Chrome, Edge, Firefox, Safari) y visita esta dirección:

👉 **http://localhost:4200**

¡Listo! Verás la pantalla de inicio de sesión de Fairgreen.

---

## 🛑 Cómo apagar la aplicación

Cuando termines tu jornada de trabajo y quieras apagar el servidor para que no consuma recursos de tu computadora, vuelve a tu consola (asegurándote de seguir en la carpeta `frontend`) y escribe:

```bash
docker-compose down
```

Esto apagará y limpiará los contenedores de forma segura.

---

## 💡 Solución de Problemas Comunes

- **Error: `error during connect` o `failed to connect to the docker API`**
  - **Causa:** Docker Desktop no está encendido.
  - **Solución:** Abre la aplicación Docker Desktop desde tu menú de inicio y espera a que inicie completamente antes de lanzar el comando.

- **La página `localhost:4200` no carga:**
  - **Causa:** El contenedor pudo haber fallado o aún está cargando.
  - **Solución:** Ve a la aplicación Docker Desktop, entra a la sección "Containers" (Contenedores), busca `fairgreen-frontend` y asegúrate de que tiene un estado "Running" (en verde). Si está en gris o rojo, puedes hacer clic en él para ver los errores.
