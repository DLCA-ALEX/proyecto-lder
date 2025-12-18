# Proyecto Líder - Sistema de Gestión y Dashboard

Sistema completo de gestión empresarial con backend en NestJS y frontend en Next.js, diseñado para administrar usuarios, suscripciones, facturación, servidores y más.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Prerrequisitos](#-prerrequisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API](#-api)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### Backend (NestJS)
- 🔐 **Autenticación y Autorización**: Sistema completo de autenticación JWT con roles y permisos
- 👥 **Gestión de Usuarios**: CRUD completo de usuarios con diferentes roles
- 💳 **Facturación**: Sistema de gestión de facturas y pagos
- 📦 **Suscripciones**: Gestión de planes y suscripciones de usuarios
- 🖥️ **Servidores**: Administración de servidores y recursos
- 📢 **Anuncios**: Sistema de anuncios y comunicaciones
- 📄 **Documentos Legales**: Gestión de EULAs y NDAs
- 🚨 **Alertas**: Sistema de notificaciones y alertas
- 👨‍💼 **Panel de Administración**: Panel completo para administradores
- 📊 **Registro de Actividades**: Sistema de registro y auditoría

### Frontend (Next.js)
- 🎨 **Interfaz Moderna**: Dashboard basado en TailAdmin con diseño profesional
- 🌙 **Modo Oscuro**: Soporte completo para tema claro/oscuro
- 📱 **Responsive**: Diseño completamente adaptable a dispositivos móviles
- 📈 **Visualización de Datos**: Gráficos y tablas interactivas con ApexCharts
- 🔄 **Estado Global**: Gestión de estado con React Query
- 🎯 **Formularios**: Validación de formularios con React Hook Form y Zod
- 🗓️ **Calendario**: Integración con FullCalendar
- 📤 **Subida de Archivos**: Sistema de gestión de archivos con drag & drop

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS 11.x
- **Lenguaje**: TypeScript 5.7
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM 0.3
- **Autenticación**: JWT (Passport.js)
- **Validación**: class-validator, class-transformer
- **Seguridad**: bcryptjs para hash de contraseñas

### Frontend
- **Framework**: Next.js 15.2.3
- **Librería UI**: React 19
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4.0
- **Gráficos**: ApexCharts
- **Formularios**: React Hook Form + Zod
- **Estado**: TanStack React Query
- **Calendario**: FullCalendar
- **Iconos**: Heroicons, Lucide React

## 📦 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: 18.x o superior (recomendado 20.x o superior)
- **npm** o **yarn**: Gestor de paquetes
- **PostgreSQL**: 12.x o superior
- **Git**: Para clonar el repositorio

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyecto-lider
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

> **Nota para Windows**: Si encuentras problemas con las dependencias, usa el flag `--legacy-peer-deps`:
> ```bash
> npm install --legacy-peer-deps
> ```

## ⚙️ Configuración

### Backend

1. Crear archivo `.env` en la carpeta `backend/`:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASS=tu_contraseña
DB_NAME=nombre_base_datos

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000

# Otros
NODE_ENV=development
```

2. Asegúrate de que PostgreSQL esté corriendo y que la base de datos exista.

### Frontend

1. Crear archivo `.env.local` en la carpeta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🎯 Uso

### Desarrollo

#### Iniciar el Backend

```bash
cd backend
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000` (o el puerto configurado en `.env`).

#### Iniciar el Frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:3001` (puerto por defecto de Next.js).

### Producción

#### Compilar el Backend

```bash
cd backend
npm run build
npm run start:prod
```

#### Compilar el Frontend

```bash
cd frontend
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
proyecto-lider/
├── backend/                 # Aplicación NestJS
│   ├── src/
│   │   ├── admin/          # Módulo de administración
│   │   ├── admin-auth/     # Autenticación de administradores
│   │   ├── alerts/         # Sistema de alertas
│   │   ├── announcements/  # Anuncios
│   │   ├── auth/           # Autenticación principal
│   │   ├── billing/        # Facturación
│   │   ├── eulas/          # EULAs
│   │   ├── invoices/       # Facturas
│   │   ├── nda/            # NDAs
│   │   ├── registration/   # Registro
│   │   ├── servers/        # Servidores
│   │   ├── session/        # Sesiones
│   │   ├── subscriptions/  # Suscripciones
│   │   ├── users/          # Usuarios
│   │   ├── app.module.ts   # Módulo principal
│   │   └── main.ts         # Punto de entrada
│   ├── test/               # Tests e2e
│   └── package.json
│
└── frontend/               # Aplicación Next.js
    ├── src/
    │   ├── app/            # Páginas y rutas (App Router)
    │   ├── components/     # Componentes reutilizables
    │   ├── config/         # Configuración
    │   ├── context/        # Context API
    │   ├── hooks/          # Custom hooks
    │   ├── icons/          # Iconos SVG
    │   ├── layout/         # Layouts
    │   └── lib/            # Utilidades
    ├── public/             # Archivos estáticos
    └── package.json
```

## 🔌 API

### Endpoints Principales

El backend expone una API REST bajo el prefijo `/api`. Algunos endpoints principales:

- **Autenticación**: `/api/auth/*`
- **Usuarios**: `/api/users/*`
- **Facturación**: `/api/billing/*`
- **Suscripciones**: `/api/subscriptions/*`
- **Servidores**: `/api/servers/*`
- **Anuncios**: `/api/announcements/*`
- **Admin**: `/api/admin/*`

### Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT. Incluye el token en el header:

```
Authorization: Bearer <tu_token_jwt>
```

## 💻 Desarrollo

### Scripts Disponibles

#### Backend

```bash
npm run build          # Compilar el proyecto
npm run start          # Iniciar en modo producción
npm run start:dev      # Iniciar en modo desarrollo (watch)
npm run start:debug    # Iniciar en modo debug
npm run lint           # Ejecutar ESLint
npm run test           # Ejecutar tests unitarios
npm run test:e2e       # Ejecutar tests e2e
npm run test:cov       # Tests con cobertura
```

#### Frontend

```bash
npm run dev            # Iniciar servidor de desarrollo
npm run build          # Compilar para producción
npm run start          # Iniciar servidor de producción
npm run lint           # Ejecutar ESLint
```

### Convenciones de Código

- **TypeScript**: Se utiliza TypeScript estricto en todo el proyecto
- **ESLint**: Configurado para mantener la consistencia del código
- **Prettier**: Formateo automático del código
- **Naming**: 
  - Componentes: PascalCase
  - Archivos: kebab-case
  - Variables y funciones: camelCase

## 🧪 Testing

### Backend

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de código
npm run test:cov
```

### Frontend

Los tests del frontend pueden ejecutarse según la configuración de testing implementada.

## 🚢 Despliegue

### Backend

1. Compilar el proyecto:
```bash
cd backend
npm run build
```

2. Configurar variables de entorno en producción
3. Ejecutar migraciones de base de datos si es necesario
4. Iniciar con PM2 o similar:
```bash
npm run start:prod
```

### Frontend

1. Compilar el proyecto:
```bash
cd frontend
npm run build
```

2. Configurar variables de entorno de producción
3. Iniciar el servidor:
```bash
npm start
```

### Recomendaciones

- Usar un proceso manager como PM2 para Node.js
- Configurar un reverse proxy (Nginx) para el frontend
- Habilitar HTTPS en producción
- Configurar backups regulares de la base de datos
- Implementar monitoreo y logging

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y de uso interno.

## 📞 Soporte

Para soporte, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

**Desarrollado con ❤️ usando NestJS y Next.js**

