import { Link } from 'react-router-dom';
import { Music, Calendar, Image, Mail, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 pt-16 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            DJ Josep
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Música electrónica que conecta almas. Experiencias únicas en cada set.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Play className="mr-2 h-4 w-4" />
              Escuchar Últimos Sets
            </Button>
            <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-purple-900">
              Ver Próximos Eventos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Music className="h-8 w-8 text-purple-400" />
                <CardTitle>Sets Exclusivos</CardTitle>
                <CardDescription className="text-gray-300">
                  Mezclas únicas y originales
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-400" />
                <CardTitle>Eventos</CardTitle>
                <CardDescription className="text-gray-300">
                  Próximas presentaciones en vivo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Image className="h-8 w-8 text-green-400" />
                <CardTitle>Galería</CardTitle>
                <CardDescription className="text-gray-300">
                  Momentos únicos capturados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardHeader>
                <Mail className="h-8 w-8 text-orange-400" />
                <CardTitle>Contacto</CardTitle>
                <CardDescription className="text-gray-300">
                  Conecta para colaboraciones
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-8 px-6 lg:px-8 border-t border-white/20">
        <div className="mx-auto max-w-4xl text-center">
          <Link
            to="/admin"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Acceso al Panel de Administración
          </Link>
        </div>
      </section>
    </div>
  );
}