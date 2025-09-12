import { useState, useCallback } from 'react';
import { Upload, Search, Filter, Grid, List, Trash2, Edit, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useFileUpload, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatFileSize, formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export default function Gallery() {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const {
    data: photos,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.media.getGallery, {
    limit: 20,
    sort: 'createdAt',
    order: 'desc'
  });

  const { upload, uploading, progress } = useFileUpload();
  const { mutate: deletePhoto } = useMutation();
  const { mutate: updatePhoto } = useMutation();

  const handleFileUpload = useCallback(async (files) => {
    try {
      await upload(apiClient.media.uploadPhotos, files);
      toast.success('Fotos subidas correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al subir fotos: ' + error.message);
    }
  }, [upload, refetch]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleCategoryFilter = useCallback((category) => {
    setCategoryFilter(category);
    updateParams({ category: category || undefined, page: 1 });
  }, [updateParams]);

  const handleDeletePhoto = useCallback(async (photoId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;
    
    try {
      await deletePhoto(() => apiClient.media.deletePhoto(photoId));
      toast.success('Foto eliminada correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar foto: ' + error.message);
    }
  }, [deletePhoto, refetch]);

  const handleToggleFeatured = useCallback(async (photo) => {
    try {
      await updatePhoto(() => 
        apiClient.media.updatePhoto(photo.id, { featured: !photo.featured })
      );
      toast.success(photo.featured ? 'Foto quitada de destacadas' : 'Foto marcada como destacada');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar foto: ' + error.message);
    }
  }, [updatePhoto, refetch]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedPhotos.length} fotos?`)) return;

    try {
      await apiClient.media.batchOperation('delete', selectedPhotos);
      toast.success('Fotos eliminadas correctamente');
      setSelectedPhotos([]);
      refetch();
    } catch (error) {
      toast.error('Error al eliminar fotos: ' + error.message);
    }
  }, [selectedPhotos, refetch]);

  if (loading && photos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galería de Fotos</h1>
          <p className="text-gray-600">
            Gestiona las fotos de tu sitio web
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? `Subiendo... ${progress}%` : 'Subir Fotos'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar fotos..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedPhotos.length} fotos seleccionadas
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar seleccionadas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Grid/List */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay fotos en la galería
            </h3>
            <p className="text-gray-500 mb-4">
              Sube tus primeras fotos para comenzar
            </p>
            <label htmlFor="photo-upload">
              <Button asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Fotos
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {photos.map((photo) => (
            <Card key={photo.id} className="group overflow-hidden">
              {viewMode === 'grid' ? (
                <>
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={photo.path}
                      alt={photo.alt || photo.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleToggleFeatured(photo)}
                          >
                            <Star className={`h-4 w-4 ${photo.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedPhotos.includes(photo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhotos(prev => [...prev, photo.id]);
                          } else {
                            setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
                          }
                        }}
                        className="rounded"
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {photo.title || 'Sin título'}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(photo.sizeOriginal)}
                      </span>
                      {photo.featured && (
                        <Badge variant="secondary" className="text-xs">
                          Destacada
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedPhotos.includes(photo.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhotos(prev => [...prev, photo.id]);
                          } else {
                            setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
                          }
                        }}
                        className="rounded"
                      />
                    </div>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={photo.path}
                        alt={photo.alt || photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {photo.title || 'Sin título'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {photo.description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatFileSize(photo.sizeOriginal)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(photo.createdAt)}
                        </span>
                        {photo.featured && (
                          <Badge variant="secondary" className="text-xs">
                            Destacada
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFeatured(photo)}
                      >
                        <Star className={`h-4 w-4 ${photo.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
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

