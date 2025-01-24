import { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, Trophy, Settings, LogOut, Menu, X, Layers, Gamepad, Calendar, Award, Flag } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs } from '@/lib/firebase';
import { ClubsList } from './clubs/clubs-list';
import { ClubDetails } from './clubs/club-details';
import { ClubEdit } from './clubs/club-edit';
import { ClubRegistrationForm } from '../club-registration-form';
import { DashboardOverview } from './dashboard/dashboard-overview';
import { CollaboratorsList } from './collaborators/collaborators-list';
import { SettingsSection } from './settings/settings-section';
import { DivisionsList } from './divisions/divisions-list';
import { PositionsList } from './positions/positions-list';
import { SeasonsList } from './seasons/seasons-list';
import { LeaguesList } from './leagues/leagues-list';
import { TournamentsList } from './tournaments/tournaments-list';
import { Logo } from '@/components/ui/logo';

const navigation = [
  { name: 'Dashboard', href: '/superadmin/dashboard', icon: Shield },
  { name: 'Clubes', href: '/superadmin/dashboard/clubs', icon: Trophy },
  { name: 'Divisiones', href: '/superadmin/dashboard/divisions', icon: Layers },
  { name: 'Posiciones', href: '/superadmin/dashboard/positions', icon: Gamepad },
  { name: 'Temporadas', href: '/superadmin/dashboard/seasons', icon: Calendar },
  { name: 'Ligas', href: '/superadmin/dashboard/leagues', icon: Award },
  { name: 'Torneos', href: '/superadmin/dashboard/tournaments', icon: Flag },
  { name: 'Colaboradores', href: '/superadmin/dashboard/collaborators', icon: Users },
  { name: 'Configuración', href: '/superadmin/dashboard/settings', icon: Settings },
];

export function SuperAdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 h-full w-64 bg-[#26294e] shadow-lg">
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center px-4 py-6 border-b border-white/10">
            <Logo />
            <h1 className="text-xl font-bold text-white mt-4">Portal Admin</h1>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
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
      </div>

      <div className="ml-64 flex-1 overflow-auto">
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="clubs" element={<ClubsList />} />
            <Route path="clubs/new" element={<ClubRegistrationForm />} />
            <Route path="clubs/view/:id" element={<ClubDetails />} />
            <Route path="clubs/edit/:id" element={<ClubEdit />} />
            <Route path="divisions" element={<DivisionsList />} />
            <Route path="positions" element={<PositionsList />} />
            <Route path="seasons" element={<SeasonsList />} />
            <Route path="leagues" element={<LeaguesList />} />
            <Route path="tournaments" element={<TournamentsList />} />
            <Route path="collaborators" element={<CollaboratorsList />} />
            <Route path="settings" element={<SettingsSection />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}