import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star, Calendar, Edit, Activity } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Card, Title, BarChart, LineChart } from '@tremor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PlayerStatisticsPanelProps {
  playerId: string;
  clubId: string;
  isEditable: boolean;
}

interface Statistics {
  matches: {
    total: number;
    won: number;
    lost: number;
    tied: number;
    minutesPlayed: number;
    participated: number;
  };
  goals: {
    total: number;
    byType: { [key: string]: number };
  };
  trainings: {
    total: number;
    attended: number;
    attendanceRate: number;
  };
}

interface Season {
  id: string;
  name: string;
  year: string;
}

export function PlayerStatisticsPanel({ playerId, clubId, isEditable }: PlayerStatisticsPanelProps) {
  const [statistics, setStatistics] = useState<Statistics>({
    matches: { 
      total: 0, 
      won: 0, 
      lost: 0, 
      tied: 0, 
      minutesPlayed: 0,
      participated: 0
    },
    goals: { 
      total: 0, 
      byType: {} 
    },
    trainings: { 
      total: 0, 
      attended: 0, 
      attendanceRate: 0 
    }
  });
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [playerId, clubId, selectedSeason]);

  const fetchSeasons = async () => {
    try {
      // Get all seasons where the club participates
      const seasonsRef = collection(db, 'seasons');
      const seasonsSnap = await getDocs(seasonsRef);
      const seasonsData = seasonsSnap.docs
        .map(doc => {
          const data = doc.data();
          // Check if club is in any division of any league
          const isClubInSeason = Object.values(data.leagueConfigs || {}).some((league: any) =>
            Object.values(league.divisions || {}).some((division: any) =>
              division.clubs.includes(clubId)
            )
          );
          if (isClubInSeason) {
            return {
              id: doc.id,
              name: data.name,
              year: data.year
            };
          }
          return null;
        })
        .filter((season): season is Season => season !== null)
        .sort((a, b) => b.year.localeCompare(a.year));

      setSeasons(seasonsData);
      if (seasonsData.length > 0) {
        setSelectedSeason(seasonsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las temporadas',
        type: 'error'
      });
    }
  };

  const fetchStatistics = async () => {
    try {
      // Initialize statistics collection if it doesn't exist
      const statsRef = doc(db, 'statistics', clubId);
      const statsDoc = await getDoc(statsRef);
      if (!statsDoc.exists()) {
        await setDoc(statsRef, {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Get player's category
      const playerRef = doc(db, `clubs/${clubId}/players`, playerId);
      const playerDoc = await getDoc(playerRef);
      
      if (!playerDoc.exists()) {
        throw new Error('No se encontró el jugador');
      }
      
      const playerCategoryId = playerDoc.data()?.categoryId;

      if (!playerCategoryId) {
        throw new Error('No se pudo obtener la categoría del jugador');
      }

      // Get matches statistics
      const matchStatsRef = collection(db, `statistics/${clubId}/matches`);
      let matchQuery = query(matchStatsRef, where('categoryId', '==', playerCategoryId));
      
      if (selectedSeason !== 'all') {
        matchQuery = query(matchQuery, where('seasonId', '==', selectedSeason));
      }
      
      const matchStatsSnap = await getDocs(matchQuery);
      const matches = matchStatsSnap.docs.map(doc => doc.data());
      
      // Calculate match statistics
      let totalMatches = matches.length;
      let wonMatches = 0;
      let lostMatches = 0;
      let tiedMatches = 0;
      let totalMinutes = 0;
      let totalGoals = 0;
      let participatedMatches = 0;
      const goalsByType = {};

      matches.forEach(match => {
        const playerMinutes = match.players?.[playerId]?.minutes || 0;
        totalMinutes += playerMinutes;
        
        if (playerMinutes > 0) {
          participatedMatches++;

          if (match.result === 'won') wonMatches++;
          else if (match.result === 'lost') lostMatches++;
          else if (match.result === 'tied') tiedMatches++;
        }

        if (Array.isArray(match.goals)) {
          const playerGoals = match.goals.filter(g => g.playerId === playerId);
          totalGoals += playerGoals.length;
          playerGoals.forEach(goal => {
            goalsByType[goal.type] = (goalsByType[goal.type] || 0) + 1;
          });
        }
      });

      // Get training statistics
      const trainingsRef = collection(db, `statistics/${clubId}/trainings`);
      const trainingsQuery = query(trainingsRef, where('categoryId', '==', playerCategoryId));
      const trainingsSnap = await getDocs(trainingsQuery);
      const trainings = trainingsSnap.docs.map(doc => doc.data());
      
      let totalTrainings = 0;
      let attendedTrainings = 0;

      trainings.forEach(training => {
        if (training.players && typeof training.players[playerId] !== 'undefined') {
          totalTrainings++;
          if (training.players[playerId]) {
            attendedTrainings++;
          }
        }
      });

      setStatistics({
        matches: {
          total: totalMatches,
          won: wonMatches,
          lost: lostMatches,
          tied: tiedMatches,
          minutesPlayed: totalMinutes,
          participated: participatedMatches
        },
        goals: {
          total: totalGoals,
          byType: goalsByType
        },
        trainings: {
          total: totalTrainings,
          attended: attendedTrainings,
          attendanceRate: totalTrainings > 0 ? (attendedTrainings / totalTrainings) * 100 : 0
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

  if (loading) {
    return <div className="flex justify-center items-center h-32">
      <div className="animate-pulse text-gray-500">Cargando estadísticas...</div>
    </div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        {/* Season Filter */}
        <div className="w-full sm:w-64">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione temporada" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las temporadas</SelectItem>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} ({season.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Ganados</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {statistics.matches.won}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Perdidos</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  {statistics.matches.lost}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Empatados</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {statistics.matches.tied}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Second Row of Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Goles</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {statistics.goals.total}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Asistencia Entrenamientos</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {Math.round(statistics.trainings.attendanceRate)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-full">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Asistencia Partidos</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600">
                  {statistics.matches.total > 0 
                    ? Math.round((statistics.matches.participated / statistics.matches.total) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Title>Distribución de Goles</Title>
            <div className="mt-6 h-[300px] sm:h-[400px]">
              <BarChart
                className="h-full"
                data={Object.entries(statistics.goals.byType).map(([type, count]) => ({
                  type: type === 'inside_box' ? 'Dentro del área' :
                        type === 'outside_box' ? 'Fuera del área' :
                        type === 'penalty' ? 'Penal' :
                        type === 'free_kick' ? 'Tiro libre' :
                        type === 'header' ? 'Cabeza' :
                        type === 'own_goal' ? 'Gol en contra' : type,
                  cantidad: count
                }))}
                index="type"
                categories={["cantidad"]}
                colors={["blue"]}
              />
            </div>
          </Card>

          <Card>
            <Title>Resultados de Partidos</Title>
            <div className="mt-6 h-[300px] sm:h-[400px]">
              <BarChart
                className="h-full"
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
            </div>
          </Card>
        </div>
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