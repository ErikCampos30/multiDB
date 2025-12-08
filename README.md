# API REST para Sistema de Gestión de Librerías

Este proyecto consiste en una aplicación web tipo Web Service REST desarrollada con el framework NestJS. El sistema implementa una arquitectura de persistencia políglota diseñada para la gestión de inventario, usuarios y transacciones de una librería.

El objetivo del sistema es demostrar la integración eficiente de tres motores de base de datos distintos para resolver problemáticas específicas: integridad relacional, auditoría documental y optimización de lecturas mediante caché.

## Arquitectura y Tecnologías

El proyecto utiliza el siguiente stack tecnológico:

* **Entorno de Ejecución:** Node.js (TypeScript).
* **Framework Backend:** NestJS.
* **Base de Datos Relacional (PostgreSQL):** Utilizada para almacenar la información estructurada y relacional (Libros, Autores, Socios, Préstamos). Gestionada mediante TypeORM.
* **Base de Datos Documental (MongoDB):** Utilizada para el almacenamiento de logs de auditoría (Bitácora de operaciones) y reseñas. Gestionada mediante Mongoose.
* **Almacenamiento Clave-Valor (Redis):** Utilizada para el caché de consultas frecuentes (Patrón Cache-Aside) y gestión de sesiones.
* **Contenedores:** Docker y Docker Compose para la orquestación de la infraestructura de datos.

## Prerrequisitos

Para ejecutar este proyecto en un entorno local, asegúrese de tener instalado el siguiente software:

* **Node.js** (Versión 18 o superior).
* **Docker Desktop** (o Docker Engine + Docker Compose).
* **Git** (Sistema de control de versiones).
* **Cliente HTTP** (Postman, Insomnia o similar) para pruebas de los endpoints.

## Instalación y Configuración

Siga los pasos descritos a continuación para inicializar el proyecto en su entorno local:

1.  **Clonar el repositorio**
    Descargue el código fuente desde el repositorio remoto:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd backend-api
    ```

2.  **Instalar dependencias**
    Ejecute el gestor de paquetes para descargar las librerías necesarias:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Cree un archivo llamado `.env` en la raíz del directorio del proyecto. Copie la siguiente configuración (alineada con el archivo `docker-compose.yml` incluido):
    ```env
    # Configuración de la Aplicación
    PORT=3000

    # Base de Datos Relacional (PostgreSQL)
    # Nota: Puerto externo 5434 para evitar conflictos.
    DB_HOST=localhost
    DB_PORT=5434
    DB_USER=admin
    DB_PASSWORD=adminpassword
    DB_NAME=libreria_db

    # Base de Datos Documental (MongoDB)
    MONGO_URI=mongodb://localhost:27017/libreria_logs

    # Caché (Redis)
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_TTL=60
    ```

4.  **Despliegue de Infraestructura**
    Utilice Docker Compose para levantar los servicios de base de datos (PostgreSQL, MongoDB y Redis):
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

La API expone operaciones CRUD estándar. A continuación se detallan las operaciones disponibles para el recurso principal.

### Recurso: Libros (`/api/libros`)

* **GET** `/api/libros`: Recupera el listado de libros.
    * *Lógica:* Consulta prioritaria en Redis. Si no existe caché, consulta PostgreSQL y almacena el resultado.
* **POST** `/api/libros`: Registra un nuevo libro.
    * *Side-effect:* Registra la operación en MongoDB (Auditoría) e invalida la caché de Redis.
* **GET** `/api/libros/:id`: Recupera el detalle de un libro específico por su UUID.
* **PATCH** `/api/libros/:id`: Actualiza parcialmente los datos de un libro.
    * *Side-effect:* Invalida la caché de Redis y registra los cambios en MongoDB.
* **DELETE** `/api/libros/:id`: Realiza un borrado lógico del recurso.
    * *Lógica:* Establece el campo `is_active` a `false`. El registro permanece en la base de datos pero se omite en consultas.

## Estructura del Proyecto

El código fuente se encuentra bajo el directorio `src/` y sigue una estructura modular:

* `app.module.ts`: Módulo raíz y configuración de conexiones.
* `libros/`: Módulo del recurso Libros.
    * `dto/`: Objetos de Transferencia de Datos.
    * `entities/`: Modelos ORM (SQL).
    * `schemas/`: Modelos ODM (NoSQL).
    * `libros.service.ts`: Lógica de negocio.
    * `libros.controller.ts`: Controladores REST.