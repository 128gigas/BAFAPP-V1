import { Link } from 'react-router-dom';
import { UserCircle, Trophy, ArrowRight, Users, Calendar, Bell, BarChart as ChartBar, DollarSign, Shield, Activity, Check } from 'lucide-react';
import { Logo } from './ui/logo';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-16">
            <Logo className="h-10 sm:h-12 w-auto" />
            <div className="flex items-center space-x-4">
              <Link
                to="/player"
                className="px-4 py-2 text-white hover:text-blue-200 transition-colors"
              >
                Portal Jugador
              </Link>
              <Link
                to="/club"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
              >
                Portal Club
              </Link>
            </div>
          </nav>

          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 animate-fade-in">
              Gestión Deportiva Integral
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mb-8 sm:mb-12 animate-fade-in-up">
              Una plataforma completa para clubes y jugadores. Gestiona equipos, partidos, estadísticas y más.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-200">
              <Link
                to="/player"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white rounded-lg text-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105 text-center"
              >
                Acceso Jugadores
              </Link>
              <Link
                to="/club"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-all transform hover:scale-105 text-center"
              >
                Acceso Clubes
              </Link>
            </div>
          </div>

          {/* Wave Separator */}
          <div className="relative h-16 sm:h-24 -mb-16 sm:-mb-24">
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,32L80,42.7C160,53,320,75,480,74.7C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,74L1360,74C1280,74,1120,74,960,74C800,74,640,74,480,74C320,74,160,74,80,74L0,74Z" fill="white"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Features Section (White Background) */}
      <div className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12 sm:mb-16">
            Todo lo que necesitas para tu club
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="bg-blue-50 p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Gestión de Equipos</h3>
              <p className="text-gray-600">
                Administra categorías, jugadores y cuerpo técnico de manera eficiente y organizada.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="bg-purple-50 p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Calendario Deportivo</h3>
              <p className="text-gray-600">
                Organiza partidos, entrenamientos y eventos con un calendario integrado y notificaciones.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="bg-green-50 p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChartBar className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Estadísticas Avanzadas</h3>
              <p className="text-gray-600">
                Seguimiento detallado del rendimiento de jugadores y equipos con análisis en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Club Portal Section (Gradient Background) */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
            <div className="flex-1 text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Portal del Club</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-lg">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                  <span className="text-white">Gestión completa de jugadores y categorías</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                  <span className="text-white">Control de accesos y permisos</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-lg">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                  <span className="text-white">Estadísticas y reportes detallados</span>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-lg">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                  <span className="text-white">Gestión de pagos y cuotas</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto">
              <div className="bg-white rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-transform shadow-xl">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/baf-ub.appspot.com/o/dashboard-preview.png?alt=media" 
                  alt="Dashboard Preview" 
                  className="rounded-lg shadow-2xl w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Portal Section (White Background) */}
      <div className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 sm:gap-12">
            <div className="flex-1 text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Portal del Jugador</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-gray-700">Perfil personal y estadísticas individuales</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-gray-700">Calendario de partidos y entrenamientos</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-gray-700">Notificaciones y comunicaciones del club</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-gray-700">Seguimiento de logros y progreso</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto">
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-transform shadow-lg">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/baf-ub.appspot.com/o/player-preview.png?alt=media" 
                  alt="Player Portal Preview" 
                  className="rounded-lg shadow-2xl w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section (Gradient Background) */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 sm:mb-16">
            Beneficios de nuestra plataforma
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[
              "Ahorro de tiempo en gestión administrativa",
              "Comunicación efectiva entre club y jugadores",
              "Seguimiento en tiempo real del rendimiento",
              "Organización optimizada de eventos deportivos",
              "Control financiero simplificado",
              "Acceso a estadísticas detalladas"
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white/10 backdrop-blur-lg p-4 rounded-lg">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0" />
                <span className="text-white">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action (White Background) */}
      <div className="bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Comienza a gestionar tu club de manera profesional
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Únete a los clubes que ya están optimizando su gestión deportiva con nuestra plataforma
          </p>
          <Link
            to="/club"
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            Comenzar ahora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <Logo className="h-6 sm:h-8 w-auto mx-auto mb-4" />
          <p className="text-gray-600">© 2025 baf. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }

        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </div>
  );
}