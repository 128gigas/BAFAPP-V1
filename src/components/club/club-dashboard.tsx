import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Trophy, Bell, UserPlus, Dumbbell, Calendar, Users, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, Title, BarChart } from '@tremor/react';
import { useClubAuth } from '@/hooks/use-club-auth';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface ClubData {
  clubName: string;
}

interface StatisticsSummary {
  matches: {
    total: number;
    won: number;
    lost: number;
    tied: number;
    goalsScored: number;
    goalsConceded: number;
  };
  players: {
    total: number;
    byCategory: { [key: string]: number };
    matchAttendance: number;
    trainingAttendance: number;
  };
  trainings: {
    total: number;
    averageAttendance: number;
    attendanceByMonth: {
      month: string;
      attendance: number;
    }[];
  };
}

interface MedicalCard {
  playerId: string;
  playerName: string;
  categoryName: string;
  expiryDate: string;
}

export function ClubDashboard() {
  const { clubId, clubData } = useClubAuth();
  const [statistics, setStatistics] = useState<StatisticsSummary>({
    matches: { total: 0, won: 0, lost: 0, tied: 0, goalsScored: 0, goalsConceded: 0 },
    players: { total: 0, byCategory: {}, matchAttendance: 0, trainingAttendance: 0 },
    trainings: { total: 0, averageAttendance: 0, attendanceByMonth: [] }
  });
  const [expiringMedicalCards, setExpiringMedicalCards] = useState<MedicalCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (clubId) {
      fetchStatistics();
      fetchMedicalCards();
    }
  }, [clubId]);

  const fetchStatistics = async () => {
    if (!clubId) return;

    try {
      // Get matches statistics
      const matchesRef = collection(db, `statistics/${clubId}/matches`);
      const matchesSnap = await getDocs(matchesRef);
      const matches = matchesSnap.docs.map(doc => doc.data());

      // Calculate match statistics
      const matchStats = matches.reduce((acc, match) => ({
        total: acc.total + 1,
        won: acc.won + (match.result === 'won' ? 1 : 0),
        lost: acc.lost + (match.result === 'lost' ? 1 : 0),
        tied: acc.tied + (match.result === 'tied' ? 1 : 0),
        goalsScored: acc.goalsScored + (match.goalsScored || 0),
        goalsConceded: acc.goalsConceded + (match.goalsConceded || 0)
      }), { total: 0, won: 0, lost: 0, tied: 0, goalsScored: 0, goalsConceded: 0 });

      // Get players statistics
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const playersSnap = await getDocs(query(playersRef, where('active', '==', true)));
      const totalPlayers = playersSnap.docs.length;

      // Calculate match attendance
      let totalMatchParticipations = 0;
      let totalPossibleParticipations = totalPlayers * matchStats.total;
      matches.forEach(match => {
        Object.values(match.players || {}).forEach((player: any) => {
          if (player.minutes > 0) totalMatchParticipations++;
        });
      });
      const matchAttendanceRate = totalPossibleParticipations > 0 
        ? (totalMatchParticipations / totalPossibleParticipations) * 100 
        : 0;

      // Get trainings statistics
      const trainingsRef = collection(db, `statistics/${clubId}/trainings`);
      const trainingsSnap = await getDocs(trainingsRef);
      const trainings = trainingsSnap.docs.map(doc => doc.data());

      // Calculate training attendance
      let totalTrainingAttendance = 0;
      let totalPossibleTrainingAttendance = totalPlayers * trainings.length;
      trainings.forEach(training => {
        Object.values(training.players || {}).forEach((attended: any) => {
          if (attended) totalTrainingAttendance++;
        });
      });
      const trainingAttendanceRate = totalPossibleTrainingAttendance > 0 
        ? (totalTrainingAttendance / totalPossibleTrainingAttendance) * 100 
        : 0;

      setStatistics({
        matches: matchStats,
        players: {
          total: totalPlayers,
          byCategory: {},
          matchAttendance: Math.round(matchAttendanceRate),
          trainingAttendance: Math.round(trainingAttendanceRate)
        },
        trainings: {
          total: trainings.length,
          averageAttendance: trainingAttendanceRate,
          attendanceByMonth: []
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const fetchMedicalCards = async () => {
    if (!clubId) return;

    try {
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const playersSnap = await getDocs(query(playersRef, where('active', '==', true)));
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringCards: MedicalCard[] = [];

      for (const playerDoc of playersSnap.docs) {
        const playerData = playerDoc.data();
        const expiryDate = new Date(playerData.healthCardExpiry);

        if (expiryDate <= thirtyDaysFromNow) {
          // Get category name
          const categoryRef = doc(db, `clubs/${clubId}/categories`, playerData.categoryId);
          const categorySnap = await getDoc(categoryRef);
          const categoryName = categorySnap.exists() ? categorySnap.data().name : 'Sin categoría';

          expiringCards.push({
            playerId: playerDoc.id,
            playerName: playerData.fullName,
            categoryName,
            expiryDate: playerData.healthCardExpiry
          });
        }
      }

      // Sort by expiry date
      expiringCards.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      setExpiringMedicalCards(expiringCards);
    } catch (error) {
      console.error('Error fetching medical cards:', error);
    }
  };

  const quickActions = [
    {
      title: 'Nuevo Entrenamiento',
      description: 'Programar una sesión de entrenamiento',
      icon: Dumbbell,
      href: '/club/dashboard/trainings',
      color: 'bg-blue-500'
    },
    {
      title: 'Nueva Notificación',
      description: 'Enviar mensaje a los jugadores',
      icon: Bell,
      href: '/club/dashboard/notifications',
      color: 'bg-purple-500'
    },
    {
      title: 'Agregar Jugador',
      description: 'Registrar nuevo jugador',
      icon: UserPlus,
      href: '/club/dashboard/players',
      color: 'bg-green-500'
    },
    {
      title: 'Nuevo Partido',
      description: 'Registrar un partido',
      icon: Calendar,
      href: '/club/dashboard/matches',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Partidos Ganados</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.matches.won}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-100 rounded-full">
                <Trophy className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Partidos Perdidos</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics.matches.lost}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Partidos Empatados</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics.matches.tied}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-100 rounded-full">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Goles a Favor</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics.matches.goalsScored}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-100 rounded-full">
                <Trophy className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Goles en Contra</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statistics.matches.goalsConceded}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Match Results Chart */}
        <Card>
          <Title>Resultados de Partidos</Title>
          <BarChart
            className="mt-6"
            data={[
              {
                name: 'Resultados',
                'Ganados': statistics.matches.won,
                'Perdidos': statistics.matches.lost,
                'Empatados': statistics.matches.tied,
              }
            ]}
            index="name"
            categories={['Ganados', 'Perdidos', 'Empatados']}
            colors={['green', 'red', 'yellow']}
          />
        </Card>

        {/* Medical Cards Expiring */}
        <Card>
          <Title>Vencimientos de Carné de Salud</Title>
          <div className="mt-4">
            {expiringMedicalCards.length > 0 ? (
              <div className="space-y-4">
                {expiringMedicalCards.map((card) => (
                  <div
                    key={card.playerId}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{card.playerName}</p>
                      <p className="text-sm text-gray-500">{card.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        Vence: {new Date(card.expiryDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(card.expiryDate) <= new Date() ? 'Vencido' : 'Próximo a vencer'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No hay carnés de salud próximos a vencer
              </p>
            )}
          </div>
        </Card>
      </div>

      {toast && (
        <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}