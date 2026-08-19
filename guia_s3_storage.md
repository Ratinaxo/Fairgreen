# Guía de Configuración de Amazon S3 para Almacenamiento de Muestras

Esta guía te guiará paso a paso en la creación de un bucket en **Amazon S3**, la generación de las credenciales de seguridad en **AWS IAM**, y la modificación del backend de Django para subir y servir las imágenes directamente desde la nube.

---

## 1. El Tamaño del Bucket
* **No requiere definir un tamaño:** A diferencia de un disco duro tradicional o una instancia EC2, un bucket de Amazon S3 tiene **capacidad ilimitada y dinámica**. Crece de manera automática según vayas subiendo archivos.
* **Costo:** Solo pagas por los Gigabytes reales que ocupes al mes. AWS incluye una **capa gratuita de 5 GB** de almacenamiento al mes durante los primeros 12 meses.

---

## 2. Paso a Paso: Crear el Bucket en AWS

1. Inicia sesión en la [Consola de AWS](https://aws.amazon.com/).
2. En la barra de búsqueda de arriba, escribe **S3** y entra al servicio.
3. Haz clic en el botón naranja **Crear bucket (Create bucket)**.
4. Configura los siguientes campos:
   * **Nombre del bucket:** Debe ser único a nivel global (por ejemplo: `fairgreen-muestras-storage`). Solo usa minúsculas, números y guiones.
   * **Región de AWS:** Selecciona la misma región donde está tu servidor EC2 (por ejemplo, `us-east-1` o `us-east-2`).
5. **Propiedad de objetos (Object Ownership):**
   * Selecciona **ACL habilitadas (ACLs enabled)**.
   * Selecciona **Propietario del bucket preferido (Bucket owner preferred)**.
6. **Configuración de bloqueo de acceso público (Block Public Access settings):**
   * Como las imágenes de las muestras deben ser visibles en el navegador del frontend de tus usuarios, **desmarca** la opción "Bloquear todo el acceso público (Block all public access)".
   * Marca la casilla de advertencia abajo que dice: *"Reconozco que la configuración actual puede dar lugar a que este bucket y los objetos que contiene pasen a ser públicos"*.
7. Deja el resto de opciones por defecto y haz clic abajo en **Crear bucket (Create bucket)**.

---

## 3. Paso a Paso: Crear el Usuario y las Credenciales (AWS IAM)

Por seguridad, nunca debes usar tus claves de administrador global de AWS en el código. Crearemos un usuario restringido que solo pueda usar este bucket específico.

1. En la consola de AWS, busca arriba **IAM** (Identity and Access Management).
2. En el panel izquierdo haz clic en **Usuarios (Users)** y luego en **Crear usuario (Create user)**.
3. Configura el usuario:
   * **Nombre de usuario:** `fairgreen-s3-user`.
   * Deja desmarcada la opción de dar acceso a la consola web de AWS (este usuario solo se usará mediante código). Haz clic en **Siguiente**.
4. **Establecer permisos:**
   * Selecciona **Asociar políticas directamente (Attach policies directly)**.
   * Haz clic en el botón **Crear política (Create policy)** (se abrirá una pestaña nueva).
5. En la pestaña de creación de políticas:
   * Haz clic en el botón **JSON** a la derecha.
   * Borra el contenido existente y pega la siguiente política (reemplaza `fairgreen-muestras-storage` con el nombre exacto de tu bucket):
     ```json
     {
         "Version": "2012-10-17",
         "Statement": [
             {
                 "Effect": "Allow",
                 "Action": [
                     "s3:PutObject",
                     "s3:PutObjectAcl",
                     "s3:GetObject",
                     "s3:GetObjectAcl",
                     "s3:DeleteObject"
                 ],
                 "Resource": [
                     "arn:aws:s3:::fairgreen-muestras-storage",
                     "arn:aws:s3:::fairgreen-muestras-storage/*"
                 ]
             }
         ]
     }
     ```
   * Haz clic en **Siguiente**. Ponle un nombre a la política (por ejemplo: `fairgreen-s3-policy`) y haz clic en **Crear política**.
6. Regresa a la pestaña anterior de creación de usuario, dale al botón de actualizar políticas, busca `fairgreen-s3-policy`, selecciónala y haz clic en **Siguiente** y luego en **Crear usuario**.
7. **Obtener las Claves de Acceso:**
   * Haz clic en el usuario que acabas de crear (`fairgreen-s3-user`).
   * Ve a la pestaña **Credenciales de seguridad (Security credentials)**.
   * Desplázate hacia abajo hasta **Claves de acceso (Access keys)** y haz clic en **Crear clave de acceso (Create access key)**.
   * Selecciona la opción **Application running outside AWS** (Aplicación fuera de AWS) y haz clic en **Siguiente**.
   * Haz clic en **Crear clave de acceso**.
   * **IMPORTANTE:** Copia y guarda a buen recaudo la **Access Key ID** y la **Secret Access Key** (esta última solo se muestra una vez y no se puede recuperar después).

---

## 4. Modificar el Backend de Django en Producción

### Paso A: Agregar credenciales al archivo `.env.prod` (En el servidor)
Abre tu archivo `.env.prod` y añade tus nuevas claves de AWS:
```ini
AWS_ACCESS_KEY_ID=tu_access_key_id_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
AWS_STORAGE_BUCKET_NAME=fairgreen-muestras-storage
AWS_S3_REGION_NAME=tu_region_aqui (ej: us-east-1)
```

### Paso B: Modificar `settings.py` de Django
Abre tu `backend/fairgreen_api/settings.py` y asegúrate de agregar las importaciones necesarias y la lógica de S3 al final de la sección de almacenamiento de archivos:

```python
# settings.py

# ... (Configuración anterior de static y media) ...

if not DEBUG:
    # 1. Configuración de django-storages para S3
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
    
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME', 'us-east-1')
    
    # Esto asegura que las imágenes subidas a S3 puedan leerse públicamente en la App
    AWS_S3_OBJECT_PARAMETERS = {
        'ACL': 'public-read',
    }
    
    # Usar las URLs absolutas de S3 para servir los archivos de media
    MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/'
else:
    # Configuración local para desarrollo en PC
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

### Paso C: Actualizar las dependencias
Asegúrate de agregar `django-storages` y `boto3` en el archivo `backend/requirements.txt`:
```text
django-storages[s3]==1.14.4
boto3==1.34.115
```

Al reiniciar el contenedor con `docker compose up -d --build`, Django cambiará de forma automática a S3 en producción.
