import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Users, Trophy, Settings, LogOut, Menu, X, Layers, Gamepad, Calendar, Activity, Bell, DollarSign, CircleDot } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Logo } from '@/components/ui/logo';
import { useClubAuth } from '@/hooks/use-club-auth';
import { ROLE_PERMISSIONS } from '@/lib/models/collaborator';

interface ClubLayoutProps {
  children: React.ReactNode;
}

export function ClubLayout({ children }: ClubLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, role } = useClubAuth();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/club/dashboard', 
      icon: Shield,
      show: true,
      restricted: false
    },
    { 
      name: 'Cancha', 
      href: '/club/dashboard/cancha', 
      icon: CircleDot,
      show: true,
      restricted: false
    },
    { 
      name: 'Jugadores', 
      href: '/club/dashboard/players', 
      icon: Users,
      show: permissions.canViewPlayers || permissions.canManageTeam,
      restricted: false
    },
    { 
      name: 'Categorías', 
      href: '/club/dashboard/categories', 
      icon: Layers,
      show: permissions.canViewCategories || permissions.canManageTeam,
      restricted: !permissions.canManageTeam
    },
    { 
      name: 'Entrenadores', 
      href: '/club/dashboard/coaches', 
      icon: Trophy,
      show: permissions.canViewCoaches || permissions.canManageCoaches || permissions.canManageTeam,
      restricted: !permissions.canManageCoaches && !permissions.canManageTeam
    },
    { 
      name: 'Entrenamientos', 
      href: '/club/dashboard/trainings', 
      icon: Activity,
      show: permissions.canViewTrainings || permissions.canManageTrainings,
      restricted: !permissions.canManageTrainings
    },
    { 
      name: 'Partidos', 
      href: '/club/dashboard/matches', 
      icon: Calendar,
      show: permissions.canViewMatches || permissions.canManageMatches,
      restricted: !permissions.canManageMatches
    },
    { 
      name: 'Estadísticas', 
      href: '/club/dashboard/statistics', 
      icon: Activity,
      show: permissions.canViewStatistics || permissions.canManageTeam,
      restricted: false
    },
    { 
      name: 'Notificaciones', 
      href: '/club/dashboard/notifications', 
      icon: Bell,
      show: permissions.canViewNotifications || permissions.canManageTeam,
      restricted: false
    },
    { 
      name: 'Pagos', 
      href: '/club/dashboard/payments', 
      icon: DollarSign,
      show: permissions.canViewFinances || permissions.canManageFinances,
      restricted: false
    },
    { 
      name: 'Configuración', 
      href: '/club/dashboard/edit', 
      icon: Settings,
      show: permissions.canManageTeam,
      restricted: true
    }
  ];

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const filteredNavigation = navigation.filter(item => item.show);

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
        <div className="w-10" />
      </div>

      {/* Sidebar */}
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
            <h1 className="text-xl font-bold text-white mt-4">Portal {role}</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.restricted ? '#' : item.href}
                  onClick={(e) => {
                    if (item.restricted) {
                      e.preventDefault();
                    } else {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/5'
                  } ${item.restricted ? 'cursor-not-allowed opacity-50' : ''}`}
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

      {/* Main Content */}
      <div className="lg:pl-64 min-h-screen w-full">
        <div className="p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}