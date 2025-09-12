import { useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Star, Quote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDate, truncate } from '../lib/utils';
import { toast } from 'sonner';

export default function Testimonials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  const {
    data: testimonials,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.content.getTestimonials, {
    limit: 12,
    sort: 'createdAt',
    order: 'desc'
  });

  const { mutate: deleteTestimonial } = useMutation();
  const { mutate: updateTestimonial } = useMutation();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleDeleteTestimonial = useCallback(async (testimonialId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este testimonio?')) return;
    
    try {
      await deleteTestimonial(() => apiClient.content.deleteTestimonial(testimonialId));
      toast.success('Testimonio eliminado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar testimonio: ' + error.message);
    }
  }, [deleteTestimonial, refetch]);

  const handleToggleFeatured = useCallback(async (testimonial) => {
    try {
      await updateTestimonial(() => 
        apiClient.content.updateTestimonial(testimonial.id, { featured: !testimonial.featured })
      );
      toast.success(testimonial.featured ? 'Testimonio quitado de destacados' : 'Testimonio marcado como destacado');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar testimonio: ' + error.message);
    }
  }, [updateTestimonial, refetch]);

  const handleEditTestimonial = useCallback((testimonial) => {
    setEditingTestimonial(testimonial);
    setShowEditor(true);
  }, []);

  const handleNewTestimonial = useCallback(() => {
    setEditingTestimonial(null);
    setShowEditor(true);
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading && testimonials.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showEditor) {
    return <TestimonialEditor testimonial={editingTestimonial} onClose={() => setShowEditor(false)} onSave={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonios</h1>
          <p className="text-gray-600">
            Gestiona las reseñas y testimonios de tus clientes
          </p>
        </div>
        
        <Button onClick={handleNewTestimonial}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Testimonio
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar testimonios..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Grid */}
      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Quote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay testimonios
            </h3>
            <p className="text-gray-500 mb-4">
              Añade el primer testimonio de tus clientes
            </p>
            <Button onClick={handleNewTestimonial}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Testimonio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {renderStars(testimonial.rating || 5)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFeatured(testimonial)}
                    >
                      <Star className={`h-4 w-4 ${testimonial.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTestimonial(testimonial)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTestimonial(testimonial.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="relative mb-4">
                  <Quote className="absolute -top-2 -left-2 h-6 w-6 text-gray-300" />
                  <p className="text-gray-700 italic pl-4">
                    {truncate(testimonial.content, 150)}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {testimonial.clientName}
                      </h4>
                      {testimonial.eventType && (
                        <p className="text-sm text-gray-500">
                          {testimonial.eventType}
                        </p>
                      )}
                      {testimonial.eventDate && (
                        <p className="text-xs text-gray-400">
                          {formatDate(testimonial.eventDate)}
                        </p>
                      )}
                    </div>
                    
                    {testimonial.featured && (
                      <Badge className="bg-yellow-500 text-white">
                        Destacado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

// Testimonial Editor Component
function TestimonialEditor({ testimonial, onClose, onSave }) {
  const [formData, setFormData] = useState({
    clientName: testimonial?.clientName || '',
    content: testimonial?.content || '',
    rating: testimonial?.rating || 5,
    eventType: testimonial?.eventType || '',
    eventDate: testimonial?.eventDate ? new Date(testimonial.eventDate).toISOString().slice(0, 10) : '',
    featured: testimonial?.featured || false
  });

  const { mutate: saveTestimonial, loading } = useMutation();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      const testimonialData = {
        ...formData,
        eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : null,
        rating: parseInt(formData.rating)
      };

      if (testimonial) {
        await saveTestimonial(() => apiClient.content.updateTestimonial(testimonial.id, testimonialData));
        toast.success('Testimonio actualizado correctamente');
      } else {
        await saveTestimonial(() => apiClient.content.createTestimonial(testimonialData));
        toast.success('Testimonio creado correctamente');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar testimonio: ' + error.message);
    }
  }, [formData, testimonial, saveTestimonial, onSave, onClose]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {testimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
        </h1>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente *
              </label>
              <Input
                value={formData.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="Boda">Boda</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Evento Corporativo">Evento Corporativo</option>
                  <option value="Fiesta Privada">Fiesta Privada</option>
                  <option value="Club">Club</option>
                  <option value="Festival">Festival</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Evento
                </label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleChange('eventDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testimonio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calificación *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleChange('rating', star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= formData.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} de 5 estrellas
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido del Testimonio *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Escribe el testimonio del cliente..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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
                Testimonio destacado
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (testimonial ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  );
}

