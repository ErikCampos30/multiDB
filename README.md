# API REST para Sistema de Gestión de Librerías

Este proyecto consiste en una aplicación web tipo Web Service REST desarrollada con el framework NestJS. El sistema implementa una arquitectura de persistencia políglota diseñada para la gestión integral de inventario, usuarios y transacciones de una librería.

El objetivo del sistema es demostrar la integración eficiente de tres motores de base de datos distintos para resolver problemáticas específicas: integridad relacional, auditoría documental y optimización de lecturas mediante caché.

## Arquitectura y Tecnologías

El proyecto utiliza el siguiente stack tecnológico:

* **Entorno de Ejecución:** Node.js (TypeScript).
* **Framework Backend:** NestJS.
* **Base de Datos Relacional (PostgreSQL):** Almacenamiento de información transaccional y relacional (Libros, Autores, Socios, Categorías, Editoriales). Gestionada mediante TypeORM.
* **Base de Datos Documental (MongoDB):** Almacenamiento de logs de auditoría (Bitácora de operaciones) y datos no estructurados. Gestionada mediante Mongoose.
* **Almacenamiento Clave-Valor (Redis):** Caché de consultas frecuentes (Patrón Cache-Aside) para optimización de tiempos de respuesta.
* **Contenedores:** Docker y Docker Compose para la orquestación de la infraestructura.

## Prerrequisitos

Para ejecutar este proyecto, asegúrese de disponer de:

* **Node.js** (Versión 18 o superior).
* **Docker Desktop** (o Docker Engine + Docker Compose).
* **Git** (Control de versiones).
* **Cliente HTTP** (Postman, Insomnia) para pruebas de integración.

## Instalación y Configuración

Siga los pasos descritos a continuación para inicializar el proyecto en su entorno local:

1.  **Clonar el repositorio**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd backend-api
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Cree un archivo `.env` en la raíz del proyecto con la siguiente configuración:
    ```env
    PORT=3000

    # PostgreSQL (Puerto externo 5434 para evitar conflictos locales)
    DB_HOST=localhost
    DB_PORT=5434
    DB_USER=admin
    DB_PASSWORD=adminpassword
    DB_NAME=libreria_db

    # MongoDB
    MONGO_URI=mongodb://localhost:27017/libreria_logs

    # Redis
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_TTL=60
    ```

4.  **Despliegue de Infraestructura**
    Levante los servicios de base de datos mediante Docker:
    ```bash
    docker-compose up -d
    ```

5.  **Ejecución de la Aplicación**
    Inicie el servidor en modo desarrollo:
    ```bash
    npm run start:dev
    ```
    La API estará disponible en: `http://localhost:3000/api`

## Documentación de Recursos (Endpoints)

La API expone operaciones CRUD estándar (GET, POST, PATCH, DELETE) para los siguientes recursos. Todos los métodos de escritura (POST, PATCH, DELETE) generan automáticamente un registro de auditoría en MongoDB e invalidan la caché de Redis correspondiente.

### 1. Gestión de Inventario (`/api/libros`)
Gestión del catálogo principal.
* **GET** `/`: Listado optimizado con caché Redis.
* **POST** `/`: Creación de libro con validación de ISBN y stock.
* **DELETE** `/:id`: Borrado lógico (`is_active: false`).

### 2. Gestión de Usuarios (`/api/socios`)
Administración de los miembros de la librería.
* **POST** `/`: Registro de socios.
    * *Validación:* El correo electrónico debe ser único.
    * *Automatización:* El sistema genera automáticamente un número de socio único.
* **DELETE** `/:id`: Borrado lógico.

### 3. Catálogos y Metadatos
Recursos de apoyo para la clasificación y atribución de libros.

* **Autores** (`/api/autores`):
    * Gestión de datos biográficos y nacionalidad de los autores.
* **Categorías** (`/api/categorias`):
    * Clasificación temática (ej. Novela, Ciencia Ficción). Campo `nombre` único.
* **Editoriales** (`/api/editoriales`):
    * Gestión de casas editoriales, incluyendo sitio web y país de origen.

## Estructura del Proyecto

El código fuente sigue una estructura modular bajo el directorio `src/`:

* `app.module.ts`: Orquestador principal y configuración de DBs.
* `libros/`: Módulo principal de inventario.
* `socios/`: Módulo de gestión de usuarios y generación de credenciales.
* `autores/`: Módulo de gestión de autores.
* `categorias/`: Módulo de taxonomía de libros.
* `editoriales/`: Módulo de gestión de proveedores/editoriales.
    * Cada módulo contiene sus respectivos `dto/`, `entities/` (SQL), `schemas/` (NoSQL), `services` y `controllers`.