import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Image, 
  FileText, 
  Calendar, 
  Mail, 
  Music,
  MessageSquare,
  Upload,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/utils';

const quickActions = [
  {
    name: 'Subir Fotos',
    description: 'Añadir nuevas fotos a la galería',
    href: '/gallery',
    icon: Upload,
    color: 'bg-blue-500'
  },
  {
    name: 'Nuevo Artículo',
    description: 'Crear una nueva entrada de blog',
    href: '/content/new',
    icon: Plus,
    color: 'bg-green-500'
  },
  {
    name: 'Nuevo Evento',
    description: 'Añadir un próximo evento',
    href: '/events/new',
    icon: Calendar,
    color: 'bg-purple-500'
  },
  {
    name: 'Nuevo Set',
    description: 'Subir un nuevo set de música',
    href: '/sets/new',
    icon: Music,
    color: 'bg-orange-500'
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    gallery: { total: 0, featured: 0 },
    events: { total: 0, upcoming: 0 },
    messages: { total: 0, unread: 0 },
    content: { total: 0, published: 0 }
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats from different endpoints
        const [galleryStats, eventsStats, messagesStats, contentStats] = await Promise.all([
          apiClient.media.getStats().catch(() => ({ data: { total: 0, featured: 0 } })),
          apiClient.events.getStats().catch(() => ({ data: { total: 0, upcoming: 0 } })),
          apiClient.contact.getStats().catch(() => ({ data: { total: 0, unread: 0 } })),
          apiClient.content.getBlogPosts({ limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } }))
        ]);

        setStats({
          gallery: galleryStats.data,
          events: eventsStats.data,
          messages: messagesStats.data,
          content: { 
            total: contentStats.data.pagination?.total || 0,
            published: contentStats.data.pagination?.total || 0
          }
        });

        // Fetch recent activity (recent events, messages, etc.)
        const [recentEvents, recentMessages] = await Promise.all([
          apiClient.events.getEvents({ limit: 3, sort: 'createdAt', order: 'desc' }).catch(() => ({ data: { data: [] } })),
          apiClient.contact.getMessages({ limit: 3, sort: 'createdAt', order: 'desc' }).catch(() => ({ data: { data: [] } }))
        ]);

        const activity = [
          ...recentEvents.data.data.map(event => ({
            id: `event-${event.id}`,
            type: 'event',
            title: `Nuevo evento: ${event.title}`,
            description: `Programado para ${formatDate(event.date)}`,
            time: event.createdAt,
            icon: Calendar,
            href: `/events/${event.id}`
          })),
          ...recentMessages.data.data.map(message => ({
            id: `message-${message.id}`,
            type: 'message',
            title: `Mensaje de ${message.name}`,
            description: message.subject || 'Sin asunto',
            time: message.createdAt,
            icon: Mail,
            href: `/messages/${message.id}`,
            unread: !message.read
          }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Bienvenido al Panel de Administración!
        </h1>
        <p className="text-gray-600">
          Gestiona tu sitio web de DJ de forma sencilla y directa. Aquí tienes acceso a todas las herramientas necesarias.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fotos en Galería</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gallery.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.gallery.featured} destacadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.events.upcoming} próximos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.messages.unread} sin leer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artículos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.content.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.content.published} publicados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accede directamente a las tareas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                      {action.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas actualizaciones en tu sitio web
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <item.icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      {item.unread && (
                        <Badge variant="secondary" className="text-xs">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(item.time)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      to={item.href}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

