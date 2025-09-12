import { useState, useCallback } from 'react';
import { Search, Mail, MailOpen, Trash2, Reply, Archive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { usePaginatedApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { formatDateTime, truncate } from '../lib/utils';
import { toast } from 'sonner';

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReply, setShowReply] = useState(false);

  const {
    data: messages,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(apiClient.contact.getMessages, {
    limit: 20,
    sort: 'createdAt',
    order: 'desc'
  });

  const { mutate: deleteMessage } = useMutation();
  const { mutate: updateMessage } = useMutation();
  const { mutate: replyMessage } = useMutation();

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    updateParams({ q: query, page: 1 });
  }, [updateParams]);

  const handleStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    updateParams({ status: status || undefined, page: 1 });
  }, [updateParams]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) return;
    
    try {
      await deleteMessage(() => apiClient.contact.deleteMessage(messageId));
      toast.success('Mensaje eliminado correctamente');
      refetch();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error('Error al eliminar mensaje: ' + error.message);
    }
  }, [deleteMessage, refetch, selectedMessage]);

  const handleMarkAsRead = useCallback(async (messageId) => {
    try {
      await updateMessage(() => apiClient.contact.markAsRead(messageId));
      refetch();
    } catch (error) {
      toast.error('Error al marcar como leído: ' + error.message);
    }
  }, [updateMessage, refetch]);

  const handleMarkAsUnread = useCallback(async (messageId) => {
    try {
      await updateMessage(() => apiClient.contact.markAsUnread(messageId));
      refetch();
    } catch (error) {
      toast.error('Error al marcar como no leído: ' + error.message);
    }
  }, [updateMessage, refetch]);

  const handleSelectMessage = useCallback(async (message) => {
    setSelectedMessage(message);
    if (!message.read) {
      await handleMarkAsRead(message.id);
    }
  }, [handleMarkAsRead]);

  const handleReply = useCallback(async (messageId, replyContent) => {
    try {
      await replyMessage(() => apiClient.contact.reply(messageId, { content: replyContent }));
      toast.success('Respuesta enviada correctamente');
      setShowReply(false);
      refetch();
    } catch (error) {
      toast.error('Error al enviar respuesta: ' + error.message);
    }
  }, [replyMessage, refetch]);

  if (loading && messages.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes de Contacto</h1>
          <p className="text-gray-600">
            Gestiona las consultas y mensajes de tus clientes
          </p>
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
                  placeholder="Buscar mensajes..."
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
                variant={statusFilter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('unread')}
              >
                No leídos
              </Button>
              <Button
                variant={statusFilter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('read')}
              >
                Leídos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay mensajes
                </h3>
                <p className="text-gray-500">
                  Los mensajes de contacto aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                  } ${!message.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {message.read ? (
                          <MailOpen className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        <h4 className="font-medium text-gray-900 truncate">
                          {message.name}
                        </h4>
                      </div>
                      {!message.read && (
                        <Badge variant="default" className="text-xs">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {message.subject || 'Sin asunto'}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {truncate(message.message, 80)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDateTime(message.createdAt)}</span>
                      {message.email && (
                        <span className="truncate ml-2">{message.email}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => updateParams({ page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => updateParams({ page: pagination.page + 1 })}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedMessage.subject || 'Sin asunto'}
                      {!selectedMessage.read && (
                        <Badge variant="default" className="text-xs">
                          Nuevo
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      De: {selectedMessage.name} ({selectedMessage.email})
                    </CardDescription>
                    <CardDescription>
                      {formatDateTime(selectedMessage.createdAt)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedMessage.read 
                        ? handleMarkAsUnread(selectedMessage.id)
                        : handleMarkAsRead(selectedMessage.id)
                      }
                    >
                      {selectedMessage.read ? (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Marcar no leído
                        </>
                      ) : (
                        <>
                          <MailOpen className="h-4 w-4 mr-2" />
                          Marcar leído
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReply(!showReply)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {selectedMessage.phone && (
                    <div>
                      <strong>Teléfono:</strong> {selectedMessage.phone}
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>

                  {showReply && (
                    <ReplyForm 
                      messageId={selectedMessage.id}
                      onReply={handleReply}
                      onCancel={() => setShowReply(false)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un mensaje
                </h3>
                <p className="text-gray-500">
                  Elige un mensaje de la lista para ver su contenido completo
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Reply Form Component
function ReplyForm({ messageId, onReply, onCancel }) {
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      await onReply(messageId, replyContent);
      setReplyContent('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  }, [messageId, replyContent, onReply]);

  return (
    <div className="border-t pt-4">
      <h4 className="font-medium text-gray-900 mb-3">Responder mensaje</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Escribe tu respuesta..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !replyContent.trim()}>
            {loading ? 'Enviando...' : 'Enviar Respuesta'}
          </Button>
        </div>
      </form>
    </div>
  );
}

