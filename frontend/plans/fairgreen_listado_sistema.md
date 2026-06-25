# Listado completo del sistema Fairgreen

## Roles de usuario

El sistema debe contar con tres tipos de usuarios, cada uno con permisos distintos:

- **Administrador:** Tiene todos los privilegios de la agrónoma, además puede crear usuarios, asignarles roles, modificar sus perfiles y supervisar el sistema en general.
- **Agrónoma:** Es la usuaria principal en terreno. Puede registrar muestras, marcar puntos críticos, subir evidencias fotográficas, editar registros y consultar datos históricos.
- **Canchero:** Tiene un perfil de solo lectura. Puede consultar el estado actual de los sectores, revisar el historial y leer las recomendaciones dejadas por la agrónoma.

---

## Autenticación y gestión de usuarios

- El sistema debe tener una pantalla de inicio de sesión donde el usuario ingresa su correo y contraseña.
- La contraseña debe tener mínimo 8 caracteres, incluir al menos un número y un carácter especial.
- No existe un registro público; solo el administrador puede crear cuentas desde un panel especial.
- El administrador puede asignar una foto tipo carnet a cada usuario.
- El administrador puede agregar nombre, apellido y RUT a cada usuario.
- El administrador puede asignar o cambiar el rol de un usuario (Agrónoma o Canchero).
- El sistema debe reconocer el rol del usuario que inicia sesión y adaptar la interfaz según sus permisos.
- Las contraseñas deben almacenarse encriptadas en la base de datos.

---

## Mapa interactivo

- La pantalla principal del sistema debe mostrar un mapa interactivo del campo de golf.
- El mapa debe representar fielmente los 10 hoyos del campo, incluyendo las zonas de Green y Fairway de cada hoyo.
- El mapa debe permitir hacer clic sobre cualquier punto del terreno para iniciar el registro de una muestra.
- Al hacer clic, el sistema debe capturar automáticamente las coordenadas geográficas del punto seleccionado.
- El sistema debe identificar de forma automática si el punto pertenece a una zona de Green o a una de Fairway.
- Los puntos del campo deben diferenciarse visualmente mediante marcadores o pines en el mapa.
- Los puntos marcados como Punto Crítico deben tener un marcador visualmente distinto para alertar al Canchero y a la Agrónoma a simple vista.
- Al seleccionar una sección o un Punto Crítico en el mapa, debe desplegarse una barra lateral (sidebar) con la información del sector, sin redirigir a otra página ni abrir ventanas emergentes.
- La barra lateral debe mostrar el estado actual del sector, los parámetros técnicos, comentarios de mantenimiento y los datos del último riego.

---

## Registro de muestras

- La agrónoma debe poder registrar una muestra haciendo clic sobre el punto exacto en el mapa.
- El formulario de registro debe incluir los cuatro parámetros técnicos: humedad, temperatura, salinidad y conductividad eléctrica.
- El sistema debe validar en tiempo real que los parámetros ingresados sean numéricos y estén dentro de rangos aceptables.
- El botón de guardar debe deshabilitarse dinámicamente si hay campos obligatorios vacíos o con datos incorrectos.
- El sistema debe guardar automáticamente la fecha y hora exacta en que se realiza el registro.
- El sistema debe permitir marcar una muestra como Punto Crítico.
- Si la muestra es marcada como Punto Crítico, es obligatorio adjuntar al menos una fotografía.
- El sistema debe permitir agregar un campo de texto libre con recomendaciones o instrucciones de cuidado dirigidas a los cancheros.
- El sistema solo debe guardar el registro si todos los campos obligatorios están completos.
- Cada muestra debe quedar asociada automáticamente a la sección del campo (Green o Fairway) según las coordenadas del clic.
- Cada muestra debe quedar asociada al usuario que la registró.

---

## Evidencia fotográfica

- El sistema debe permitir subir mínimo una fotografía por cada registro de muestra.
- El sistema debe permitir agregar una breve descripción a cada fotografía adjunta.
- Las fotografías deben almacenarse en un repositorio de archivos externo (Amazon S3), no directamente en la base de datos.
- La base de datos debe guardar únicamente la ruta de acceso al archivo de imagen en S3.

---

## Edición de muestras

- La agrónoma puede editar cualquier campo de un registro de muestra ya guardado.
- El sistema debe validar que ningún campo quede vacío al confirmar los cambios.
- Los cambios deben reflejarse de forma inmediata al confirmarse.
- La edición solo está disponible durante las primeras dos semanas después de creado el registro; pasado ese tiempo, el sistema bloquea automáticamente la opción de editar.

---

## Puntos críticos

- El sistema debe almacenar los puntos críticos como sectores específicos dentro de una sección del campo.
- Cada punto crítico debe tener una ubicación georreferenciada dentro de su sección correspondiente.
- Un punto crítico debe estar asociado a una sección del campo.
- Una muestra puede estar asociada a un punto crítico, o bien pertenecer a una zona sana (en cuyo caso el campo de punto crítico queda vacío).

---

## Consulta de datos históricos

- Cualquier usuario puede hacer clic sobre un sector del mapa para ver el historial de muestras de ese punto.
- Al seleccionar un punto, el sistema debe listar todos los registros de muestras recolectadas en ese lugar.
- El usuario puede seleccionar uno de esos registros para ver el detalle completo de esa muestra en particular.

---

## Gráficos y reportes

- El sistema debe generar gráficos de línea por cada punto del campo, mostrando la evolución histórica de los parámetros técnicos (humedad, temperatura, salinidad y conductividad).
- El administrador y la agrónoma deben poder generar documentos descargables con los datos históricos en formatos PDF, Word y Excel.

---

## Notificaciones y alertas

- El sistema debe contar con un panel de alertas centralizado para los usuarios.
- El sistema debe generar una notificación automática cuando se registre un nuevo Punto Crítico.
- El sistema debe generar una notificación automática si los datos de riego diario no han sido actualizados en la plataforma.
- Cada notificación debe tener un título, un mensaje, la fecha y hora en que fue generada, un tipo, y un indicador de si ya fue leída o no.
- Las notificaciones deben estar asociadas al usuario destinatario, y opcionalmente a una sección o a una muestra.

---

## Base de datos y almacenamiento

- El motor de base de datos debe ser PostgreSQL en el entorno de producción.
- En el entorno de desarrollo local se puede usar SQLite.
- La base de datos debe almacenar: usuarios, secciones del campo, puntos críticos, muestras, fotos y notificaciones.
- Las coordenadas georreferenciadas de cada muestra y las coordenadas de los puntos críticos deben persistir en la base de datos.
- Todos los registros históricos deben poder consultarse en cualquier momento posterior.

---

## Arquitectura e infraestructura

- El frontend debe desarrollarse con Angular.
- El backend debe desarrollarse con Python usando el framework Django, incluyendo GeoDjango para el procesamiento espacial de los polígonos del campo.
- Los archivos estáticos del frontend deben distribuirse mediante Amazon CloudFront (CDN).
- El backend debe alojarse en una instancia de Amazon EC2.
- La base de datos debe gestionarse en Amazon RDS.
- Las imágenes y archivos binarios deben almacenarse en Amazon S3.
- La comunicación entre el frontend y el backend debe realizarse mediante peticiones REST en formato JSON.

---

## Rendimiento y disponibilidad

- El tiempo de respuesta para guardar un registro de muestra debe ser menor a 3 segundos.
- La carga de cualquier gráfico comparativo o listado histórico debe ser menor a 5 segundos.
- El sistema debe estar disponible el 99% del tiempo.

---

## Seguridad y accesos

- El sistema debe implementar control de acceso basado en roles (RBAC).
- Solo el administrador puede crear usuarios y asignar roles.
- Solo la agrónoma puede registrar muestras y marcar puntos críticos.
- El canchero solo puede consultar información, sin modificar datos.
- El sistema no debe recolectar datos personales más allá del RUT, correo y nombre del usuario interno.
- El RUT se usa exclusivamente para autenticación, control de acceso y trazabilidad de muestras.

---

## Usabilidad e interfaz

- La interfaz debe estar diseñada con enfoque Mobile-First, optimizada para su uso en terreno desde dispositivos móviles Android.
- La interfaz debe ser intuitiva y no requerir conocimientos informáticos avanzados para ser utilizada.
- El registro de una muestra debe activarse con un solo clic sobre el mapa, minimizando la cantidad de interacciones necesarias.
- El formulario de registro debe validar los datos en tiempo real, antes de intentar enviarlos al servidor.
- La plataforma debe ser accesible desde navegadores web.
