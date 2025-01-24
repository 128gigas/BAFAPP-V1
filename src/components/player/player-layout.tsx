import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UserCircle, LogOut, Menu, X, Home, Users, Settings, Bell, CircleDot } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface PlayerLayoutProps {
  children: React.ReactNode;
}

export function PlayerLayout({ children }: PlayerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/player/dashboard', icon: Home },
    { name: 'Mi Equipo', href: '/player/team', icon: Users },
    { name: 'Cancha', href: '/player/cancha', icon: CircleDot },
    { name: 'Notificaciones', href: '/player/notifications', icon: Bell },
    { name: 'Perfil', href: '/player/profile', icon: Settings },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('playerId');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-[#26294e] shadow-sm flex items-center justify-between px-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Logo className="h-8 w-auto" />
        <div className="w-10" /> {/* Spacer for centering logo */}
      </div>

      {/* Sidebar - Fixed on desktop, sliding on mobile */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 bg-[#26294e] shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-50 lg:z-30
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-md text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center px-4 py-6 border-b border-white/10">
            <Logo className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-white mt-4">Portal del Jugador</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-white/80 rounded-lg hover:bg-white/5"
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="whitespace-nowrap">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Pushed by fixed sidebar on desktop */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}