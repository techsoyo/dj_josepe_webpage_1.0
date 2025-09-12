# DJ Josepe - Frontend Refactorizado

Panel de administración simplificado para la aplicación web de DJ Josepe, transformado de arquitectura multiusuario a usuario único administrativo.

## 🚀 Características

- **Dashboard simplificado**: Enfoque en herramientas de gestión directa
- **Interfaz intuitiva**: Sin complejidad de roles o permisos
- **Rendimiento optimizado**: Lazy loading, code splitting y bundle ligero
- **Responsive design**: Compatible con desktop y móvil
- **Código limpio**: Componentes reutilizables y hooks personalizados

## 📁 Estructura del Proyecto

```
frontend_refactored/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes UI de shadcn/ui
│   │   └── Layout.jsx         # Layout principal con navegación
│   ├── pages/
│   │   ├── Dashboard.jsx      # Dashboard principal
│   │   ├── Gallery.jsx        # Gestión de galería
│   │   ├── Content.jsx        # Editor de contenido/blog
│   │   ├── Sets.jsx           # Gestión de sets musicales
│   │   ├── Events.jsx         # Gestión de eventos
│   │   ├── Messages.jsx       # Mensajes de contacto
│   │   ├── Testimonials.jsx   # Gestión de testimonios
│   │   └── Settings.jsx       # Configuración del sitio
│   ├── hooks/
│   │   └── useApi.js          # Hooks personalizados para API
│   ├── lib/
│   │   ├── api.js             # Cliente API centralizado
│   │   └── utils.js           # Utilidades generales
│   ├── App.jsx                # Componente principal
│   ├── App.css                # Estilos globales
│   └── main.jsx               # Punto de entrada
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Instalación

1. **Instalar dependencias**:
```bash
pnpm install
```

2. **Configurar variables de entorno**:
```bash
# Crear archivo .env.local
VITE_API_URL=http://localhost:3000/api
```

3. **Iniciar servidor de desarrollo**:
```bash
pnpm run dev
```

4. **Build para producción**:
```bash
pnpm run build
```

## 🎯 Páginas y Funcionalidades

### Dashboard Principal
- **Vista general** del sitio
- **Acciones rápidas** para tareas comunes
- **Actividad reciente** (eventos, mensajes)
- **Estadísticas básicas** (fotos, eventos, mensajes)

### Gestión de Galería
- **Upload múltiple** de fotos con drag & drop
- **Vista grid/lista** configurable
- **Edición de metadatos** (título, descripción, alt text)
- **Gestión de categorías** y tags
- **Fotos destacadas** para homepage

### Editor de Contenido
- **Editor de blog** con Markdown
- **Preview en tiempo real**
- **SEO optimizado** (meta title, description)
- **Gestión de estados** (borrador, publicado, archivado)
- **Programación de publicación**

### Sets de Música
- **Upload de sets** con tracklist
- **Integración con SoundCloud/Spotify**
- **Gestión de géneros** musicales
- **Portadas personalizadas**
- **Sets destacados**

### Gestión de Eventos
- **Calendario integrado**
- **Información completa** (fecha, hora, venue, precio)
- **Estados de evento** (próximo, pasado, cancelado)
- **Integración con mapas**
- **Eventos destacados**

### Mensajes de Contacto
- **Bandeja de entrada** organizada
- **Filtros por estado** (leído/no leído)
- **Respuesta directa** desde el panel
- **Gestión de consultas**
- **Estadísticas de contacto**

### Testimonios
- **Gestión de reseñas** de clientes
- **Sistema de calificación** (estrellas)
- **Categorización por evento**
- **Testimonios destacados**
- **Moderación de contenido**

### Configuración del Sitio
- **Información general** (nombre, descripción, logo)
- **Datos de contacto** (email, teléfono, dirección)
- **Redes sociales** (Instagram, Facebook, YouTube, etc.)
- **SEO y metadatos** (title, description, keywords)
- **Analytics** (Google Analytics, Search Console)

## ⚡ Optimizaciones de Rendimiento

### Code Splitting
```javascript
// Lazy loading de páginas
const Gallery = lazy(() => import('./pages/Gallery'));
const Content = lazy(() => import('./pages/Content'));
// ... más páginas
```

### Bundle Optimization
- **Tree shaking** automático con Vite
- **Compresión** de assets
- **Minificación** de CSS/JS
- **Optimización de imágenes**

### Métricas Objetivo
- **Bundle inicial**: < 244KB
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s

### Técnicas Aplicadas
- **Lazy loading** de componentes
- **Memoización** con React.memo
- **Debouncing** en búsquedas
- **Paginación eficiente**
- **Cache de API** con React Query patterns

## 🎨 Diseño y UX

### Sistema de Diseño
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
- **Lucide React** para iconos
- **Framer Motion** para animaciones

### Responsive Design
```css
/* Mobile First */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

.grid {
  @apply grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
}
```

### Accesibilidad
- **Navegación por teclado**
- **Screen reader** compatible
- **Contraste adecuado**
- **Focus indicators**
- **ARIA labels**

## 🔧 Hooks Personalizados

### useApi
```javascript
// Hook para llamadas API simples
const { data, loading, error, refetch } = useApi(
  () => apiClient.content.getBlogPosts()
);
```

### usePaginatedApi
```javascript
// Hook para datos paginados
const {
  data,
  pagination,
  loading,
  updateParams
} = usePaginatedApi(apiClient.events.getEvents, {
  limit: 10,
  sort: 'date'
});
```

### useMutation
```javascript
// Hook para operaciones de escritura
const { mutate, loading, error } = useMutation();

const handleSave = async () => {
  await mutate(() => apiClient.content.createBlogPost(data));
};
```

### useFileUpload
```javascript
// Hook para upload de archivos
const { upload, uploading, progress } = useFileUpload();

const handleUpload = async (files) => {
  await upload(apiClient.media.uploadPhotos, files);
};
```

## 🧹 Código Limpio

### Principios Aplicados

1. **Componentes Pequeños**:
```javascript
// Un componente, una responsabilidad
const PhotoCard = ({ photo, onEdit, onDelete }) => {
  // Lógica específica de la tarjeta
};
```

2. **Hooks Reutilizables**:
```javascript
// Lógica compartida en hooks
const usePhotoManagement = () => {
  // Lógica de gestión de fotos
  return { photos, uploadPhoto, deletePhoto };
};
```

3. **Utilidades Centralizadas**:
```javascript
// Funciones de utilidad reutilizables
export const formatDate = (date) => { /* ... */ };
export const truncate = (text, length) => { /* ... */ };
```

### Estructura de Componentes
```javascript
// Estructura consistente
const Component = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useApi();
  
  // 2. Handlers
  const handleAction = useCallback(() => {
    // Lógica del handler
  }, [dependencies]);
  
  // 3. Effects
  useEffect(() => {
    // Efectos secundarios
  }, [dependencies]);
  
  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

## 🔄 Estado y Gestión de Datos

### Patrón de Estado Local
```javascript
// Estado local para formularios
const [formData, setFormData] = useState({
  title: '',
  content: '',
  published: false
});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Optimistic Updates
```javascript
// Actualizaciones optimistas para mejor UX
const handleToggleFeatured = async (item) => {
  // Actualizar UI inmediatamente
  setItems(prev => prev.map(i => 
    i.id === item.id ? { ...i, featured: !i.featured } : i
  ));
  
  try {
    // Confirmar en servidor
    await apiClient.updateItem(item.id, { featured: !item.featured });
  } catch (error) {
    // Revertir en caso de error
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, featured: item.featured } : i
    ));
  }
};
```

## 🚀 Despliegue

### Build de Producción
```bash
# Generar build optimizado
pnpm run build

# Preview del build
pnpm run preview
```

### Variables de Entorno
```bash
# .env.production
VITE_API_URL=https://api.djjosepe.com/api
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Optimizaciones de Build
- **Minificación** automática
- **Tree shaking** de dependencias no usadas
- **Compresión gzip**
- **Cache busting** con hashes

## 📱 Responsive Breakpoints

```javascript
// Breakpoints de Tailwind
const breakpoints = {
  sm: '640px',   // Tablet pequeña
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop pequeño
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Desktop grande
};
```

## 🧪 Testing

### Estructura de Tests
```javascript
// Ejemplo de test de componente
describe('Dashboard', () => {
  it('should render quick actions', () => {
    render(<Dashboard />);
    expect(screen.getByText('Subir Fotos')).toBeInTheDocument();
  });
});
```

### Testing de Hooks
```javascript
// Test de hook personalizado
describe('useApi', () => {
  it('should fetch data correctly', async () => {
    const { result } = renderHook(() => useApi(mockApiCall));
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## 🔧 Configuración de Desarrollo

### ESLint
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'error'
  }
};
```

### Vite Config
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico:
- Crear issue en GitHub
- Email: soporte@djjosepe.com
- Documentación: [docs.djjosepe.com](https://docs.djjosepe.com)

