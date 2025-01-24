import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, Title, BarChart, LineChart } from '@tremor/react';
import { Trophy, Users, Calendar, Award, Timer, Activity, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useClubAuth } from '@/hooks/use-club-auth';

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
    attendance: number;
  };
  trainings: {
    total: number;
    averageAttendance: number;
    attendanceByMonth: {
      month: string;
      attendance: number;
    }[];
  };
  goals: {
    byType: { [key: string]: number };
    byPlayer: { [key: string]: number };
    conceded: {
      byType: { [key: string]: number };
      byOpponent: { [key: string]: number };
    };
  };
  topStats: {
    scorers: Array<{ player: string; goals: number }>;
    matchAttendance: Array<{ player: string; percentage: number }>;
    trainingAttendance: Array<{ player: string; percentage: number }>;
  };
}

export function StatisticsDashboard() {
  const { clubId, permissions } = useClubAuth();
  const [statistics, setStatistics] = useState<StatisticsSummary>({
    matches: { total: 0, won: 0, lost: 0, tied: 0, goalsScored: 0, goalsConceded: 0 },
    players: { total: 0, byCategory: {}, attendance: 0 },
    trainings: { total: 0, averageAttendance: 0, attendanceByMonth: [] },
    goals: { 
      byType: {}, 
      byPlayer: {},
      conceded: {
        byType: {},
        byOpponent: {}
      }
    },
    topStats: { scorers: [], matchAttendance: [], trainingAttendance: [] }
  });
  const [seasons, setSeasons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  if (!permissions.canViewStatistics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para ver las estadísticas del club. Esta sección está reservada para personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (clubId) {
      fetchInitialData();
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) {
      fetchStatistics();
    }
  }, [clubId, selectedSeason, selectedCategory]);

  const fetchInitialData = async () => {
    if (!clubId) return;

    try {
      // Fetch seasons where the club participates
      const seasonsRef = collection(db, 'seasons');
      const seasonsSnap = await getDocs(seasonsRef);
      const seasonsData = seasonsSnap.docs
        .map(doc => {
          const data = doc.data();
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
        .filter((season): season is Season => season !== null);

      setSeasons(seasonsData);

      // Fetch categories
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchStatistics = async () => {
    if (!clubId) return;
    setLoading(true);

    try {
      // Primero, obtener todos los jugadores del club
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const playersSnap = await getDocs(playersRef);
      const playersData = playersSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = {
          id: doc.id,
          fullName: doc.data().fullName,
          active: doc.data().active
        };
        return acc;
      }, {});

      // Luego obtener las estadísticas
      const statsRef = doc(db, 'statistics', clubId);
      const statsDoc = await getDoc(statsRef);

      if (!statsDoc.exists()) {
        setLoading(false);
        return;
      }

      // Fetch matches statistics
      const matchesRef = collection(statsRef, 'matches');
      const matchesSnap = await getDocs(matchesRef);
      const matchesData = matchesSnap.docs.map(doc => doc.data());

      // Filter by season and category if selected
      const filteredMatches = matchesData.filter(match => {
        const seasonMatch = selectedSeason === 'all' || match.seasonId === selectedSeason;
        const categoryMatch = selectedCategory === 'all' || match.categoryId === selectedCategory;
        return seasonMatch && categoryMatch;
      });

      // Calculate match statistics
      const matchStats = filteredMatches.reduce((acc, match) => ({
        total: acc.total + 1,
        won: acc.won + (match.result === 'won' ? 1 : 0),
        lost: acc.lost + (match.result === 'lost' ? 1 : 0),
        tied: acc.tied + (match.result === 'tied' ? 1 : 0),
        goalsScored: acc.goalsScored + (match.goalsScored || 0),
        goalsConceded: acc.goalsConceded + (match.goalsConceded || 0)
      }), { total: 0, won: 0, lost: 0, tied: 0, goalsScored: 0, goalsConceded: 0 });

      // Calculate goals statistics
      const goalsByType = {};
      const goalsByPlayer = {};
      const goalsConcededByType = {};
      const goalsConcededByOpponent = {};

      filteredMatches.forEach(match => {
        // Goles a favor
        (match.goals || []).forEach(goal => {
          if (goal.type) {
            goalsByType[goal.type] = (goalsByType[goal.type] || 0) + 1;
          }
          if (goal.playerId && playersData[goal.playerId]) {
            goalsByPlayer[goal.playerId] = (goalsByPlayer[goal.playerId] || 0) + 1;
          }
        });

        // Goles en contra
        (match.concededGoals || []).forEach(goal => {
          if (goal.type) {
            goalsConcededByType[goal.type] = (goalsConcededByType[goal.type] || 0) + 1;
          }
          if (goal.rivalPlayerName) {
            goalsConcededByOpponent[goal.rivalPlayerName] = (goalsConcededByOpponent[goal.rivalPlayerName] || 0) + 1;
          }
        });
      });

      // Calculate top scorers
      const scorers = Object.entries(goalsByPlayer)
        .map(([playerId, goals]) => ({
          player: playersData[playerId]?.fullName || 'Desconocido',
          goals: goals as number
        }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 8);

      // Calculate match attendance
      const playerMatchAttendance = {};
      filteredMatches.forEach(match => {
        Object.entries(match.players || {}).forEach(([playerId, data]) => {
          if (playersData[playerId]?.active) {
            if (!playerMatchAttendance[playerId]) {
              playerMatchAttendance[playerId] = { attended: 0, total: 0 };
            }
            playerMatchAttendance[playerId].total++;
            if ((data as any).minutes > 0) {
              playerMatchAttendance[playerId].attended++;
            }
          }
        });
      });

      const matchAttendance = Object.entries(playerMatchAttendance)
        .map(([playerId, data]) => ({
          player: playersData[playerId]?.fullName || 'Desconocido',
          percentage: Math.round((data.attended / data.total) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 8);

      // Fetch trainings statistics
      const trainingsRef = collection(statsRef, 'trainings');
      const trainingsSnap = await getDocs(trainingsRef);
      const trainingsData = trainingsSnap.docs
        .map(doc => doc.data())
        .filter(training => selectedCategory === 'all' || training.categoryId === selectedCategory);

      // Calculate training attendance
      const playerTrainingAttendance = {};
      trainingsData.forEach(training => {
        Object.entries(training.players || {}).forEach(([playerId, attended]) => {
          if (playersData[playerId]?.active) {
            if (!playerTrainingAttendance[playerId]) {
              playerTrainingAttendance[playerId] = { attended: 0, total: 0 };
            }
            playerTrainingAttendance[playerId].total++;
            if (attended) {
              playerTrainingAttendance[playerId].attended++;
            }
          }
        });
      });

      const trainingAttendance = Object.entries(playerTrainingAttendance)
        .map(([playerId, data]) => ({
          player: playersData[playerId]?.fullName || 'Desconocido',
          percentage: Math.round((data.attended / data.total) * 100)
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 8);

      // Calculate monthly attendance
      const monthlyAttendance = trainingsData.reduce((acc, training) => {
        const month = new Date(training.date).toLocaleString('default', { month: 'long' });
        const monthData = acc.find(m => m.month === month);
        
        if (monthData) {
          monthData.attendance += training.attendance || 0;
          monthData.count = (monthData.count || 0) + 1;
        } else {
          acc.push({ month, attendance: training.attendance || 0, count: 1 });
        }
        return acc;
      }, []).map(month => ({
        month: month.month,
        attendance: Math.round(month.attendance / month.count)
      }));

      const averageAttendance = trainingsData.length > 0
        ? Math.round(trainingsData.reduce((sum, t) => sum + (t.attendance || 0), 0) / trainingsData.length)
        : 0;

      setStatistics({
        matches: matchStats,
        players: {
          total: Object.values(playersData).filter(p => p.active).length,
          byCategory: {},
          attendance: averageAttendance
        },
        trainings: {
          total: trainingsData.length,
          averageAttendance,
          attendanceByMonth: monthlyAttendance
        },
        goals: {
          byType: goalsByType,
          byPlayer: goalsByPlayer,
          conceded: {
            byType: goalsConcededByType,
            byOpponent: goalsConcededByOpponent
          }
        },
        topStats: {
          scorers,
          matchAttendance,
          trainingAttendance
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Activity className="h-8 w-8 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estadísticas</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
          <div className="w-full sm:w-48">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las temporadas" />
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

          <div className="w-full sm:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Resumen de Partidos */}
      <Card>
        <Title>Resumen de Partidos</Title>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Ganados</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{statistics.matches.won}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Perdidos</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{statistics.matches.lost}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Empatados</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{statistics.matches.tied}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Goles a Favor</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{statistics.matches.goalsScored}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Goles en Contra</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{statistics.matches.goalsConceded}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Goles Realizados y Recibidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title>Goles Realizados</Title>
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
          <Title>Goles Recibidos</Title>
          <div className="mt-6 h-[300px] sm:h-[400px]">
            <BarChart
              className="h-full"
              data={Object.entries(statistics.goals.conceded.byType).map(([type, count]) => ({
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
              colors={["red"]}
            />
          </div>
        </Card>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Goleadores */}
        <Card>
          <Title>Top Goleadores</Title>
          <div className="mt-4 space-y-2">
            {statistics.topStats.scorers.map((scorer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-gray-700">{index + 1}.</span>
                  <span className="font-medium text-sm sm:text-base">{scorer.player}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">{scorer.goals} goles</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Asistencia a Partidos */}
        <Card>
          <Title>Top Asistencia a Partidos</Title>
          <div className="mt-4 space-y-2">
            {statistics.topStats.matchAttendance.map((attendance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-gray-700">{index + 1}.</span>
                  <span className="font-medium text-sm sm:text-base">{attendance.player}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">{attendance.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Asistencia a Entrenamientos */}
        <Card>
          <Title>Top Asistencia a Entrenamientos</Title>
          <div className="mt-4 space-y-2">
            {statistics.topStats.trainingAttendance.map((attendance, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-base sm:text-lg font-semibold text-gray-700">{index + 1}.</span>
                  <span className="font-medium text-sm sm:text-base">{attendance.player}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">{attendance.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráfico de Asistencia a Entrenamientos */}
      <Card>
        <Title>Asistencia a Entrenamientos</Title>
        <div className="mt-6 h-[300px] sm:h-[400px]">
          <LineChart
            className="h-full"
            data={statistics.trainings.attendanceByMonth}
            index="month"
            categories={["attendance"]}
            colors={["blue"]}
            valueFormatter={(value) => `${Math.round(value)}%`}
            yAxisWidth={40}
          />
        </div>
      </Card>
    </div>
  );
}