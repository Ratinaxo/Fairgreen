# FairGreen — Modelo Relacional de Base de Datos

---

## Diagrama de entidades

```
┌─────────────────────┐          ┌──────────────────────────┐
│       Sección       │          │       Punto crítico       │
├─────────────────────┤          ├──────────────────────────┤
│ PK  IdSección       │──────────│ PK  IdPuntoCritico        │
│     Polígono        │  1    ∞  │ FK  IdSección             │
│     Tipo de Tierra  │          │     Ubicacion             │
│     Numero de Hoyo  │          └────────────┬─────────────┘
└──────────┬──────────┘                       │ 0..1
           │ 1                                │
           │ ∞                                │ ∞
           │         ┌────────────────────────┘
           │         │
           └─────────┴──────────────────────────────────────┐
                                                             │
┌─────────────────────┐        ┌───────────────────────┐    │
│      Usuario        │        │        Muestra        │    │
├─────────────────────┤        ├───────────────────────┤    │
│ PK  RUT             │──────∞─│ PK  IdMuestra         │◄───┘
│     Nombre          │  1     │ FK  IdSección         │
│     Apellido        │        │ FK  IdPuntoCritico NULL│    ┌──────────────────┐
│     Correo electr.  │        │ FK  RutUsuario        │    │       Foto       │
│     Contraseña      │        │     Salinidad         │    ├──────────────────┤
│     Rol             │        │     Humedad           │────│ PK  IdFoto       │
│     RutaFoto        │        │     Conductividad     │ 1∞ │ FK  IdMuestra    │
└─────────────────────┘        │     Temperatura       │    │     RutaArchivo  │
                                │     Ubicacion         │    │     fecha_hora_  │
                                │     Recomendaciones   │    │     captura      │
                                │     Fecha_Hora        │    └──────────────────┘
                                └───────────────────────┘
```

---

## Tablas

### `Sección`

Representa cada zona geográfica del campo de golf (greens, fairways, roughs, tees). Almacena el polígono que delimita la zona en el mapa.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdSección` | `INT` | `PK` | Identificador único de la sección |
| `Polígono` | `GEOMETRY(Polygon, 4326)` | `NOT NULL` | Coordenadas del polígono en WGS84 |
| `Tipo de Tierra` | `VARCHAR(50)` | `NOT NULL` | Clasificación de la zona (Green, Fairway, Rough, Tee) |
| `Numero de Hoyo` | `INT` | | Número del hoyo asociado a la sección |

**Relaciones:**
- Una sección puede tener **muchos** puntos críticos.
- Una sección puede tener **muchas** muestras registradas.

---

### `Punto crítico`

Ubicaciones fijas dentro de una sección donde se realizan mediciones recurrentes. Son los puntos de referencia georreferenciados del campo.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdPuntoCritico` | `INT` | `PK` | Identificador único del punto crítico |
| `IdSección` | `INT` | `FK → Sección.IdSección` | Sección a la que pertenece el punto |
| `Ubicacion` | `GEOMETRY(Point, 4326)` | `NOT NULL` | Coordenada geográfica del punto (lat/lon) |

**Relaciones:**
- Pertenece a exactamente **una** sección.
- Puede estar asociado a **cero o muchas** muestras (una muestra puede o no estar ligada a un punto crítico específico).

---

### `Muestra`

Registro central del sistema. Cada vez que un agrónomo o canchero toma una medición en campo, se crea una fila en esta tabla.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdMuestra` | `INT` | `PK` | Identificador único de la muestra |
| `IdSección` | `INT` | `FK → Sección.IdSección` | Sección donde se tomó la muestra |
| `IdPuntoCritico` | `INT` | `FK → PuntoCritico.IdPuntoCritico`, `NULL` | Punto crítico asociado (opcional) |
| `RutUsuario` | `VARCHAR(12)` | `FK → Usuario.RUT` | Usuario que registró la muestra |
| `Salinidad` | `DECIMAL(5,3)` | | Nivel de salinidad en dS/m |
| `Humedad` | `DECIMAL(4,2)` | | Nivel de humedad (escala 1–5) |
| `Conductividad` | `DECIMAL(5,3)` | | Conductividad eléctrica en dS/m |
| `Temperatura` | `DECIMAL(5,2)` | | Temperatura del suelo en °C |
| `Ubicacion` | `GEOMETRY(Point, 4326)` | | Coordenada exacta donde se tomó la muestra |
| `Recomendaciones` | `TEXT` | | Indicaciones o notas del responsable |
| `Fecha_Hora` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha y hora del registro |

**Relaciones:**
- Pertenece a exactamente **una** sección.
- Puede estar ligada a un punto crítico (campo **nullable** — la muestra puede tomarse fuera de un punto crítico establecido).
- Fue registrada por exactamente **un** usuario.
- Puede tener **una o muchas** fotos adjuntas.

---

### `Foto`

Evidencia fotográfica adjunta a una muestra. Una muestra puede tener múltiples fotos.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdFoto` | `INT` | `PK` | Identificador único de la foto |
| `IdMuestra` | `INT` | `FK → Muestra.IdMuestra` | Muestra a la que pertenece la foto |
| `RutaArchivo` | `TEXT` | `NOT NULL` | Path o URL del archivo almacenado |
| `fecha_hora_captura` | `TIMESTAMPTZ` | | Fecha y hora en que se capturó la imagen |

**Relaciones:**
- Pertenece a exactamente **una** muestra.

---

### `Usuario`

Personas que acceden al sistema. El RUT actúa como clave primaria natural.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `RUT` | `VARCHAR(12)` | `PK` | RUT del usuario (ej: `12345678-9`) |
| `Nombre` | `VARCHAR(100)` | `NOT NULL` | Nombre del usuario |
| `Apellido` | `VARCHAR(100)` | `NOT NULL` | Apellido del usuario |
| `Correo electrónico` | `VARCHAR(150)` | `UNIQUE`, `NOT NULL` | Email de acceso al sistema |
| `Contraseña` | `TEXT` | `NOT NULL` | Hash de la contraseña (bcrypt) |
| `Rol` | `VARCHAR(20)` | `NOT NULL` | Nivel de acceso: `admin`, `agronomo`, `canchero` |
| `RutaFoto` | `TEXT` | | URL o path del avatar del usuario |

**Relaciones:**
- Un usuario puede registrar **muchas** muestras.

---

## Relaciones entre tablas (resumen)

| Tabla origen | Cardinalidad | Tabla destino | Campo de unión | Notas |
|---|---|---|---|---|
| `Sección` | 1 → N | `PuntoCritico` | `IdSección` | Una sección tiene múltiples puntos críticos |
| `Sección` | 1 → N | `Muestra` | `IdSección` | Una sección tiene múltiples muestras |
| `PuntoCritico` | 0..1 → N | `Muestra` | `IdPuntoCritico` | El punto es opcional en la muestra |
| `Usuario` | 1 → N | `Muestra` | `RutUsuario / RUT` | Un usuario registra múltiples muestras |
| `Muestra` | 1 → N | `Foto` | `IdMuestra` | Una muestra puede tener varias fotos |

---
