import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Image, 
  FileText, 
  Calendar, 
  Mail, 
  Settings,
  Music,
  MessageSquare,
  Upload,
  Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Vista general'
  },
  {
    name: 'Galería',
    href: '/gallery',
    icon: Image,
    description: 'Gestión de fotos'
  },
  {
    name: 'Contenido',
    href: '/content',
    icon: FileText,
    description: 'Blog y artículos'
  },
  {
    name: 'Sets de Música',
    href: '/sets',
    icon: Music,
    description: 'Gestión de sets'
  },
  {
    name: 'Eventos',
    href: '/events',
    icon: Calendar,
    description: 'Gestión de eventos'
  },
  {
    name: 'Mensajes',
    href: '/messages',
    icon: Mail,
    description: 'Contacto y consultas'
  },
  {
    name: 'Testimonios',
    href: '/testimonials',
    icon: MessageSquare,
    description: 'Reseñas de clientes'
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    description: 'Ajustes del sitio'
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navigation.find(item => item.href === location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">DJ Josepe Admin</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">DJ Josepe Admin</h1>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentPage?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentPage?.description || 'Panel de administración'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a 
                  href="http://localhost:3000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver sitio
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

