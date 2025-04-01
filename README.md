# Chat App Server

Este es el backend para una aplicación de chat en tiempo real, construido con Node.js, Express, Socket.IO y MongoDB.

## Características Principales

* **Autenticación:**
    * Registro de usuarios.
    * Inicio de sesión seguro con JWT.
    * Autenticación basada en tokens JWT.
    * Cierre de Sesión.
* **Mensajería en Tiempo Real:**
    * Mensajes privados uno a uno.
    * Mensajes en salas grupales.
    * Soporte para compartir archivos adjuntos.
* **Notificaciones:**
    * Notificaciones en tiempo real de nuevos mensajes.
    * Notificaciones de eventos del sistema.
    * Marcado de notificaciones como leídas.
* **Gestión de Salas:**
    * Creación de salas públicas y privadas.
    * Gestión de miembros de salas (agregar, eliminar).
    * Listado de salas publicas y privadas del usuario.
* **Estado de Usuario:**
    * Indicador de estado en línea/fuera de línea de los usuarios.
* **Subida de Archivos:**
    * Soporte para subir imágenes, documentos y otros tipos de archivos.

## Requisitos Previos

* Node.js (versión 14.0.0 o superior)
* MongoDB (MongoDB Atlas o instancia local)

## Instalación

1.  **Clonar el Repositorio:**

    ```bash
    git clone [https://github.com/tu-usuario/chat-app-server.git](https://github.com/tu-usuario/chat-app-server.git)
    cd chat-app-server
    ```

2.  **Instalar Dependencias:**

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**

    * Copiar el archivo `.env.example` a `.env`.
    * Configurar las variables de entorno necesarias en el archivo `.env` (por ejemplo, la URL de MongoDB, la clave secreta de JWT).

    ```bash
    cp .env.example .env
    ```

4.  **Iniciar el Servidor:**

    * Modo de desarrollo:

        ```bash
        npm run dev
        ```

    * Modo de producción:

        ```bash
        npm start
        ```

## Endpoints de la API REST

### Autenticación

* `POST /api/auth/register`: Registrar un nuevo usuario.
* `POST /api/auth/login`: Iniciar sesión.
* `GET /api/auth/me`: Obtener información del usuario autenticado.
* `POST /api/auth/logout`: Cerrar sesión del usuario.

### Salas

* `GET /api/rooms/public`: Obtener todas las salas públicas.
* `GET /api/rooms/my`: Obtener las salas del usuario autenticado.
* `POST /api/rooms`: Crear una nueva sala.
* `GET /api/rooms/:roomId`: Obtener información de una sala específica.
* `POST /api/rooms/:roomId/members`: Agregar un miembro a una sala.
* `DELETE /api/rooms/:roomId/members/:userId`: Eliminar un miembro de una sala.

### Mensajes

* `GET /api/messages/room/:roomId`: Obtener mensajes de una sala.
* `GET /api/messages/private/:userId`: Obtener mensajes privados entre dos usuarios.
* `POST /api/messages/room/:roomId`: Enviar un mensaje a una sala.
* `POST /api/messages/private/:userId`: Enviar un mensaje privado a un usuario.

## WebSockets (Socket.IO)

El servidor utiliza Socket.IO para la comunicación en tiempo real. Los siguientes eventos son manejados:

* `connection`: Maneja las conexiones de los usuarios.
* `room:join`: Permite a un usuario unirse a una sala.
* `room:leave`: Permite a un usuario salir de una sala.
* `message:read`: Marca un mensaje como leído.
* `notification:read`: Marca una notificación como leída.

## Estructura del Proyecto

.
├── .env.example
├── .gitignore
├── index.js
├── package.json
├── README.md
├── middleware/
│   └── auth.js
├── models/
│   ├── Message.js
│   ├── Notification.js
│   ├── Room.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── messages.js
│   └── rooms.js
└── socketHandlers/
    ├── connectionHandler.js
    ├── messageHandler.js
    ├── notificationHandler.js
    └── roomHandler.js

## Tecnologías Utilizadas

* Node.js
* Express
* Socket.IO
* MongoDB
* Mongoose
* JWT
* Multer

## Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un error o tienes una mejora, por favor, abre un "issue" o envía un "pull request".

## Licencia

Este proyecto está bajo la licencia ISC.

## Creado por Sebastian Muñoz ⭐