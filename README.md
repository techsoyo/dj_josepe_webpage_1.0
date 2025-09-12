# 🎵 DJ Josep - Panel de Administración

Panel de administración monousuario para el sitio web de DJ Josep. Aplicación refactorizada de sistema multiusuario a usuario único.

## 🚀 Características

- **Sistema Monousuario**: Eliminación completa del sistema de autenticación multiusuario
- **Stack Moderno**: Vite + React 19 + TypeScript + Tailwind CSS
- **Backend Simplificado**: Node.js + Express + Prisma con SQLite/PostgreSQL
- **Componentes UI**: Radix UI con diseño moderno
- **Optimización**: Lazy loading, code splitting, y optimizaciones de rendimiento

## 📁 Estructura del Proyecto

```
dj-josep-admin/
├── frontend/                 # Aplicación React (Vite)
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── lib/            # Utilidades y configuración
│   │   ├── hooks/          # Custom React hooks
│   │   └── assets/         # Recursos estáticos
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middleware personalizado
│   │   └── utils/          # Utilidades del backend
│   ├── prisma/             # Esquema y migraciones de DB
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── docs/                    # Documentación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js >= 18.0.0
- npm/pnpm/yarn
- Git

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/dj-josep-admin.git
cd dj-josep-admin
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Configurar base de datos
npm run prisma:migrate
npm run prisma:generate

# Poblar datos iniciales (opcional)
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (ejecutar `npm run prisma:studio`)

## 🔧 Variables de Entorno

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./src/db/database.sqlite"
JWT_SECRET=tu_jwt_secret_super_seguro
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SITE_URL=http://localhost:3000
VITE_SITE_NAME="DJ Josep"
```

## 📝 Scripts Disponibles

### Backend

```bash
npm run dev          # Servidor de desarrollo con nodemon
npm run start        # Servidor de producción
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio
npm run seed         # Poblar datos iniciales
npm run lint         # Verificar código con ESLint
npm run format       # Formatear código con Prettier
```

### Frontend

```bash
npm run dev          # Servidor de desarrollo Vite
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Verificar código con ESLint
npm run format       # Formatear código con Prettier
npm run type-check   # Verificar tipos TypeScript
```

## 🎯 Funcionalidades

### ✅ Implementadas

- **Dashboard**: Vista general con estadísticas
- **Galería**: Gestión de fotos con upload y optimización
- **Contenido**: Blog posts, sets musicales y testimonios
- **Eventos**: Gestión de eventos y calendario
- **Mensajes**: Sistema de contacto y consultas
- **Configuración**: Ajustes del sitio y SEO
- **Analytics**: Seguimiento básico de métricas

### 🚧 Pendientes

- [ ] Sistema de backup automático
- [ ] Notificaciones push
- [ ] Editor WYSIWYG avanzado
- [ ] Integración con redes sociales
- [ ] API para mobile app

## 🔒 Seguridad

- Rate limiting en API endpoints
- Sanitización de inputs
- Headers de seguridad con Helmet
- Validación con Zod/Express Validator
- CORS configurado correctamente

## 🚀 Despliegue

### Frontend (Vercel/Netlify)

1. Conectar repositorio
2. Configurar variables de entorno
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend (Railway/Render)

1. Conectar repositorio
2. Configurar variables de entorno
3. Start command: `npm start`
4. Configurar PostgreSQL (recomendado para producción)

## 📊 Tecnologías Utilizadas

### Frontend
- **React 19** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Radix UI** - Componentes accesibles
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM y gestión de DB
- **SQLite/PostgreSQL** - Base de datos
- **Nodemailer** - Envío de emails
- **Sharp** - Procesamiento de imágenes
- **Helmet** - Headers de seguridad

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👥 Soporte

Para soporte y consultas:

- **Email**: admin@djjosep.com
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/dj-josep-admin/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/dj-josep-admin/wiki)

## 🎉 Agradecimientos

- **manus.ai** - Por la refactorización inicial del sistema multiusuario
- **MiniMax Agent** - Por la auditoría y correcciones del código
- Comunidad open source por las increíbles herramientas utilizadas

---

**Desarrollado con ❤️ para DJ Josep**
