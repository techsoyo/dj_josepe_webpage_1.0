import { useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Play, Music, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDate, formatDateTime, truncate } from '../lib/utils';
import { toast } from 'sonner';

export default function Sets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingSet, setEditingSet] = useState(null);

  const {
    data: sets,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.content.getMusicSets, {
    limit: 10,
    sort: 'createdAt',
    order: 'desc'
  });

  const { mutate: deleteSet } = useMutation();
  const { mutate: updateSet } = useMutation();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleDeleteSet = useCallback(async (setId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este set?')) return;
    
    try {
      await deleteSet(() => apiClient.content.deleteMusicSet(setId));
      toast.success('Set eliminado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar set: ' + error.message);
    }
  }, [deleteSet, refetch]);

  const handleToggleFeatured = useCallback(async (set) => {
    try {
      await updateSet(() => 
        apiClient.content.updateMusicSet(set.id, { featured: !set.featured })
      );
      toast.success(set.featured ? 'Set quitado de destacados' : 'Set marcado como destacado');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar set: ' + error.message);
    }
  }, [updateSet, refetch]);

  const handleEditSet = useCallback((set) => {
    setEditingSet(set);
    setShowEditor(true);
  }, []);

  const handleNewSet = useCallback(() => {
    setEditingSet(null);
    setShowEditor(true);
  }, []);

  if (loading && sets.length === 0) {
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
    return <SetEditor set={editingSet} onClose={() => setShowEditor(false)} onSave={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sets de Música</h1>
          <p className="text-gray-600">
            Gestiona tus sets y mezclas musicales
          </p>
        </div>
        
        <Button onClick={handleNewSet}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Set
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar sets..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sets List */}
      {sets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay sets de música
            </h3>
            <p className="text-gray-500 mb-4">
              Sube tu primer set para comenzar
            </p>
            <Button onClick={handleNewSet}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Card key={set.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative">
                {set.coverImage ? (
                  <img
                    src={set.coverImage}
                    alt={set.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center">
                    <Music className="h-12 w-12 text-white" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-t-lg">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      {set.audioUrl && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(set.audioUrl, '_blank')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleFeatured(set)}
                      >
                        <Star className={`h-4 w-4 ${set.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {set.featured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-500 text-white">
                      Destacado
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1">
                    {set.title}
                  </h3>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {set.genre || 'Sin género'}
                  </Badge>
                </div>

                {set.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {truncate(set.description, 100)}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{formatDate(set.createdAt)}</span>
                  {set.duration && (
                    <span>{set.duration} min</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSet(set)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSet(set.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

// Set Editor Component
function SetEditor({ set, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: set?.title || '',
    description: set?.description || '',
    genre: set?.genre || '',
    duration: set?.duration || '',
    audioUrl: set?.audioUrl || '',
    coverImage: set?.coverImage || '',
    featured: set?.featured || false,
    tracklist: set?.tracklist || []
  });

  const { mutate: saveSet, loading } = useMutation();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      if (set) {
        await saveSet(() => apiClient.content.updateMusicSet(set.id, formData));
        toast.success('Set actualizado correctamente');
      } else {
        await saveSet(() => apiClient.content.createMusicSet(formData));
        toast.success('Set creado correctamente');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar set: ' + error.message);
    }
  }, [formData, set, saveSet, onSave, onClose]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTracklistChange = useCallback((value) => {
    // Parse tracklist from textarea (one track per line)
    const tracks = value.split('\n').filter(track => track.trim()).map((track, index) => ({
      id: index + 1,
      title: track.trim(),
      order: index + 1
    }));
    setFormData(prev => ({ ...prev, tracklist: tracks }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {set ? 'Editar Set' : 'Nuevo Set'}
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
                placeholder="Nombre del set"
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
                placeholder="Descripción del set"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Género
                </label>
                <Input
                  value={formData.genre}
                  onChange={(e) => handleChange('genre', e.target.value)}
                  placeholder="House, Techno, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archivos y Enlaces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Audio
              </label>
              <Input
                type="url"
                value={formData.audioUrl}
                onChange={(e) => handleChange('audioUrl', e.target.value)}
                placeholder="https://soundcloud.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de Portada (URL)
              </label>
              <Input
                type="url"
                value={formData.coverImage}
                onChange={(e) => handleChange('coverImage', e.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracklist</CardTitle>
            <CardDescription>
              Escribe una canción por línea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.tracklist.map(track => track.title).join('\n')}
              onChange={(e) => handleTracklistChange(e.target.value)}
              placeholder="Artist - Track Name&#10;Artist 2 - Track Name 2&#10;..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Set destacado
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (set ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  );
}

