import { useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDate, formatDateTime, truncate } from '../lib/utils';
import { toast } from 'sonner';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800'
};

const statusLabels = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado'
};

export default function Content() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const {
    data: posts,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.content.getBlogPosts, {
    limit: 10,
    sort: 'createdAt',
    order: 'desc'
  });

  const { mutate: deletePost } = useMutation();
  const { mutate: updatePost } = useMutation();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    updateParams({ status: status || undefined, page: 1 });
  }, [updateParams]);

  const handleDeletePost = useCallback(async (postId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo?')) return;
    
    try {
      await deletePost(() => apiClient.content.deleteBlogPost(postId));
      toast.success('Artículo eliminado correctamente');
      refetch();
    } catch (error) {
      toast.error('Error al eliminar artículo: ' + error.message);
    }
  }, [deletePost, refetch]);

  const handleTogglePublished = useCallback(async (post) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      await updatePost(() => 
        apiClient.content.updateBlogPost(post.id, { 
          status: newStatus,
          published: newStatus === 'published',
          publishedAt: newStatus === 'published' ? new Date().toISOString() : null
        })
      );
      toast.success(newStatus === 'published' ? 'Artículo publicado' : 'Artículo despublicado');
      refetch();
    } catch (error) {
      toast.error('Error al actualizar artículo: ' + error.message);
    }
  }, [updatePost, refetch]);

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setShowEditor(true);
  }, []);

  const handleNewPost = useCallback(() => {
    setEditingPost(null);
    setShowEditor(true);
  }, []);

  if (loading && posts.length === 0) {
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
    return <ContentEditor post={editingPost} onClose={() => setShowEditor(false)} onSave={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Contenido</h1>
          <p className="text-gray-600">
            Crea y gestiona artículos para tu blog
          </p>
        </div>
        
        <Button onClick={handleNewPost}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Artículo
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
                  placeholder="Buscar artículos..."
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
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('published')}
              >
                Publicados
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('draft')}
              >
                Borradores
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay artículos
            </h3>
            <p className="text-gray-500 mb-4">
              Crea tu primer artículo para comenzar
            </p>
            <Button onClick={handleNewPost}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Artículo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {post.title}
                      </h3>
                      <Badge className={statusColors[post.status]}>
                        {statusLabels[post.status]}
                      </Badge>
                      {post.featured && (
                        <Badge variant="secondary">
                          Destacado
                        </Badge>
                      )}
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-3">
                        {truncate(post.excerpt, 150)}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {post.publishedAt 
                          ? `Publicado ${formatDate(post.publishedAt)}`
                          : `Creado ${formatDate(post.createdAt)}`
                        }
                      </span>
                      {post.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.viewCount} vistas
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant={post.status === 'published' ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleTogglePublished(post)}
                    >
                      {post.status === 'published' ? 'Despublicar' : 'Publicar'}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

// Simple Content Editor Component
function ContentEditor({ post, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    tags: post?.tags || '',
    status: post?.status || 'draft',
    featured: post?.featured || false,
    published: post?.published || false
  });

  const { mutate: savePost, loading } = useMutation();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      if (post) {
        await savePost(() => apiClient.content.updateBlogPost(post.id, formData));
        toast.success('Artículo actualizado correctamente');
      } else {
        await savePost(() => apiClient.content.createBlogPost(formData));
        toast.success('Artículo creado correctamente');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar artículo: ' + error.message);
    }
  }, [formData, post, savePost, onSave, onClose]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !post) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [post]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {post ? 'Editar Artículo' : 'Nuevo Artículo'}
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
                placeholder="Título del artículo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="url-amigable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extracto
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Breve descripción del artículo"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Contenido del artículo (Markdown soportado)"
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO y Metadatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título SEO
              </label>
              <Input
                value={formData.seo_title}
                onChange={(e) => handleChange('seo_title', e.target.value)}
                placeholder="Título para motores de búsqueda"
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción SEO
              </label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => handleChange('seo_description', e.target.value)}
                placeholder="Descripción para motores de búsqueda"
                rows={2}
                maxLength={160}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
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
                Artículo destacado
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (post ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </div>
  );
}

