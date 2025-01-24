import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, Award, Flag, Plus, Layers } from 'lucide-react';
import { Card, Title, BarChart } from '@tremor/react';

interface Club {
  id: string;
  clubName: string;
  leagueName: string;
  createdAt: string;
}

interface League {
  id: string;
  name: string;
  active: boolean;
}

interface Division {
  id: string;
  name: string;
  active: boolean;
}

export function DashboardOverview() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch clubs
      const clubsRef = collection(db, 'clubs');
      const clubsSnap = await getDocs(clubsRef);
      const clubsData = clubsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Club[];
      setClubs(clubsData);

      // Fetch leagues
      const leaguesRef = collection(db, 'leagues');
      const leaguesSnap = await getDocs(leaguesRef);
      const leaguesData = leaguesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as League[];
      setLeagues(leaguesData);

      // Fetch divisions
      const divisionsRef = collection(db, 'divisions');
      const divisionsSnap = await getDocs(divisionsRef);
      const divisionsData = divisionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Division[];
      setDivisions(divisionsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Nuevo Club',
      description: 'Registrar un nuevo club deportivo',
      icon: Trophy,
      href: '/superadmin/dashboard/clubs/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Nueva Liga',
      description: 'Crear una nueva liga',
      icon: Award,
      href: '/superadmin/dashboard/leagues',
      color: 'bg-purple-500'
    },
    {
      title: 'Nueva División',
      description: 'Agregar una nueva división',
      icon: Layers,
      href: '/superadmin/dashboard/divisions',
      color: 'bg-green-500'
    },
    {
      title: 'Nuevo Torneo',
      description: 'Crear un nuevo torneo',
      icon: Flag,
      href: '/superadmin/dashboard/tournaments',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 rounded-full">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Clubes Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {clubs.filter(club => club.active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 rounded-full">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Ligas Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {leagues.filter(league => league.active).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 rounded-full">
              <Layers className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Divisiones Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {divisions.filter(division => division.active).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Clubs by League Chart */}
      <Card>
        <Title>Clubes por Liga</Title>
        <BarChart
          className="mt-6"
          data={leagues
            .filter(league => league.active)
            .map(league => ({
              name: league.name,
              'Clubes': clubs.filter(club => club.leagueName === league.name).length
            }))}
          index="name"
          categories={['Clubes']}
          colors={['blue']}
        />
      </Card>
    </div>
  );
}