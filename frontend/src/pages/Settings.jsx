import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Upload, Eye, Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useApi, useMutation } from '../hooks/useApi';
import { apiClient } from '../lib/api';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { mutate: updateSettings } = useMutation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.settings.getAll();
        
        // Convert array of settings to object for easier handling
        const settingsObj = {};
        response.data.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        
        setSettings(settingsObj);
      } catch (error) {
        toast.error('Error al cargar configuración: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      // Convert settings object to array format for batch update
      const configs = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      await updateSettings(() => apiClient.settings.batchUpdate(configs));
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [settings, updateSettings]);

  const handleReset = useCallback(async (key) => {
    if (!confirm('¿Estás seguro de que quieres restablecer esta configuración?')) return;
    
    try {
      await apiClient.settings.reset(key);
      toast.success('Configuración restablecida');
      
      // Refresh settings
      const response = await apiClient.settings.getAll();
      const settingsObj = {};
      response.data.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(settingsObj);
    } catch (error) {
      toast.error('Error al restablecer configuración: ' + error.message);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
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
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sitio</h1>
          <p className="text-gray-600">
            Personaliza la información y apariencia de tu sitio web
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>
                Configuración básica de tu sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Sitio
                </label>
                <Input
                  value={settings.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="DJ Josepe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline/Eslogan
                </label>
                <Input
                  value={settings.site_tagline || ''}
                  onChange={(e) => handleChange('site_tagline', e.target.value)}
                  placeholder="Tu DJ profesional para eventos únicos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Sitio
                </label>
                <textarea
                  value={settings.site_description || ''}
                  onChange={(e) => handleChange('site_description', e.target.value)}
                  placeholder="Descripción breve de tus servicios..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <Input
                  type="url"
                  value={settings.site_logo || ''}
                  onChange={(e) => handleChange('site_logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Hero/Banner
                </label>
                <Input
                  type="url"
                  value={settings.hero_image || ''}
                  onChange={(e) => handleChange('hero_image', e.target.value)}
                  placeholder="https://example.com/hero.jpg"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Servicios</CardTitle>
              <CardDescription>
                Información sobre tus servicios de DJ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Años de Experiencia
                </label>
                <Input
                  type="number"
                  value={settings.years_experience || ''}
                  onChange={(e) => handleChange('years_experience', e.target.value)}
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Géneros Musicales (separados por comas)
                </label>
                <Input
                  value={settings.music_genres || ''}
                  onChange={(e) => handleChange('music_genres', e.target.value)}
                  placeholder="House, Techno, Pop, Rock, Reggaeton"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipos de Eventos (separados por comas)
                </label>
                <Input
                  value={settings.event_types || ''}
                  onChange={(e) => handleChange('event_types', e.target.value)}
                  placeholder="Bodas, Cumpleaños, Eventos Corporativos, Fiestas Privadas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Base (€)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.base_price || ''}
                  onChange={(e) => handleChange('base_price', e.target.value)}
                  placeholder="300.00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Datos de contacto que aparecerán en tu sitio web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Contacto
                </label>
                <Input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="info@djjosepe.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+34 600 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <Input
                  type="tel"
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                  placeholder="+34 600 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  value={settings.contact_address || ''}
                  onChange={(e) => handleChange('contact_address', e.target.value)}
                  placeholder="Calle Ejemplo 123, 28001 Madrid, España"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horario de Atención
                </label>
                <Input
                  value={settings.business_hours || ''}
                  onChange={(e) => handleChange('business_hours', e.target.value)}
                  placeholder="Lunes a Viernes: 9:00 - 18:00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>
                Enlaces a tus perfiles en redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <Input
                  type="url"
                  value={settings.instagram_url || ''}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/djjosepe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <Input
                  type="url"
                  value={settings.facebook_url || ''}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/djjosepe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube
                </label>
                <Input
                  type="url"
                  value={settings.youtube_url || ''}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/@djjosepe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SoundCloud
                </label>
                <Input
                  type="url"
                  value={settings.soundcloud_url || ''}
                  onChange={(e) => handleChange('soundcloud_url', e.target.value)}
                  placeholder="https://soundcloud.com/djjosepe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spotify
                </label>
                <Input
                  type="url"
                  value={settings.spotify_url || ''}
                  onChange={(e) => handleChange('spotify_url', e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok
                </label>
                <Input
                  type="url"
                  value={settings.tiktok_url || ''}
                  onChange={(e) => handleChange('tiktok_url', e.target.value)}
                  placeholder="https://tiktok.com/@djjosepe"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO y Metadatos</CardTitle>
              <CardDescription>
                Configuración para motores de búsqueda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título SEO
                </label>
                <Input
                  value={settings.seo_title || ''}
                  onChange={(e) => handleChange('seo_title', e.target.value)}
                  placeholder="DJ Josepe - DJ Profesional para Bodas y Eventos"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 60 caracteres. Actual: {(settings.seo_title || '').length}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción SEO
                </label>
                <textarea
                  value={settings.seo_description || ''}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  placeholder="DJ profesional especializado en bodas y eventos. Música de calidad y experiencia garantizada."
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 160 caracteres. Actual: {(settings.seo_description || '').length}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Palabras Clave (separadas por comas)
                </label>
                <Input
                  value={settings.seo_keywords || ''}
                  onChange={(e) => handleChange('seo_keywords', e.target.value)}
                  placeholder="dj, bodas, eventos, música, fiesta, madrid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Analytics ID
                </label>
                <Input
                  value={settings.google_analytics_id || ''}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Search Console
                </label>
                <Input
                  value={settings.google_search_console || ''}
                  onChange={(e) => handleChange('google_search_console', e.target.value)}
                  placeholder="Código de verificación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Open Graph
                </label>
                <Input
                  type="url"
                  value={settings.og_image || ''}
                  onChange={(e) => handleChange('og_image', e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Imagen que aparece cuando compartes tu sitio en redes sociales (1200x630px recomendado)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button (Fixed) */}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}

