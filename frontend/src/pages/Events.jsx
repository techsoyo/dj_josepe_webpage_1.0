import { useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDate, formatDateTime, formatTime, isUpcoming } from '../lib/utils';
import { toast } from 'sonner';

export default function Events() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const {
    data: events,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.events.getEvents, {
    limit: 10,
    sort: 'date',
    order: 'desc'
  });

  const { mutate: deleteEvent } = useMutation();
  const { mutate: updateEvent } = useMutation();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    updateParams({ status: status || undefined, page: 1 });
  }, [updateParams]);

  const handleDeleteEvent = useCallback(async (eventId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
    
    try {
      await deleteEvent(() => apiClient.events.deleteEvent(eventId));
      toast.success('Evento eliminado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar evento: ' + error.message);
    }
  }, [deleteEvent, refetch]);

  const handleToggleFeatured = useCallback(async (event) => {
    try {
      await updateEvent(() => 
        apiClient.events.updateEvent(event.id, { featured: !event.featured })
      );
      toast.success(event.featured ? 'Evento quitado de destacados' : 'Evento marcado como destacado');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar evento: ' + error.message);
    }
  }, [updateEvent, refetch]);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setShowEditor(true);
  }, []);

  const handleNewEvent = useCallback(() => {
    setEditingEvent(null);
    setShowEditor(true);
  }, []);

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showEditor) {
    return <EventEditor event={editingEvent} onClose={() => setShowEditor(false)} onSave={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600">
            Organiza y gestiona tus próximos eventos
          </p>
        </div>
        
        <Button onClick={handleNewEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('upcoming')}
              >
                Próximos
              </Button>
              <Button
                variant={statusFilter === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('past')}
              >
                Pasados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay eventos
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primer evento para comenzar
            </p>
            <Button onClick={handleNewEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const upcoming = isUpcoming(event.date);
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <Badge variant={upcoming ? 'default' : 'secondary'}>
                          {upcoming ? 'Próximo' : 'Pasado'}
                        </Badge>
                        {event.featured && (
                          <Badge className="bg-yellow-500 text-white">
                            Destacado
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-3">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        
                        {event.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(event.date)}</span>
                          </div>
                        )}
                        
                        {event.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                      </div>

                      {event.city && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {event.city}
                          </Badge>
                          {event.eventType && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {event.eventType}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeatured(event)}
                      >
                        <Star className={`h-4 w-4 ${event.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => updateParams({ page: pagination.page - 1 })}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() => updateParams({ page: pagination.page + 1 })}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

// Event Editor Component
function EventEditor({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    venue: event?.venue || '',
    address: event?.address || '',
    city: event?.city || '',
    eventType: event?.eventType || '',
    ticketUrl: event?.ticketUrl || '',
    price: event?.price || '',
    featured: event?.featured || false
  });

  const { mutate: saveEvent, loading } = useMutation();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        price: formData.price ? parseFloat(formData.price) : null
      };

      if (event) {
        await saveEvent(() => apiClient.events.updateEvent(event.id, eventData));
        toast.success('Evento actualizado correctamente');
      } else {
        await saveEvent(() => apiClient.events.createEvent(eventData));
        toast.success('Evento creado correctamente');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar evento: ' + error.message);
    }
  }, [formData, event, saveEvent, onSave, onClose]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {event ? 'Editar Evento' : 'Nuevo Evento'}
        </h1>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Nombre del evento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descripción del evento"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => handleChange('eventType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="club">Club</option>
                  <option value="festival">Festival</option>
                  <option value="private">Evento Privado</option>
                  <option value="wedding">Boda</option>
                  <option value="corporate">Corporativo</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue/Local
              </label>
              <Input
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="Nombre del local o venue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ciudad
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ciudad"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Tickets
                </label>
                <Input
                  type="url"
                  value={formData.ticketUrl}
                  onChange={(e) => handleChange('ticketUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Evento destacado
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (event ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  );
}

