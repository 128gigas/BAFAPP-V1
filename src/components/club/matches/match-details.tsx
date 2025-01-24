import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Calendar, MapPin, Shield, Users, Clock } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface Match {
  id: string;
  date: string;
  time: string;
  location: string;
  homeTeamId: string;
  awayTeamId: string;
  categoryId: string;
  coachId: string;
  assistantId?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  score: {
    home: number;
    away: number;
  };
  players: { [key: string]: { minutes: number } };
  goals: Goal[];
}

interface Goal {
  id: string;
  minute: number;
  playerId?: string;
  rivalPlayerName?: string;
  type: 'inside_box' | 'outside_box' | 'penalty' | 'free_kick' | 'header' | 'own_goal';
  teamType: 'home' | 'away';
}

interface Team {
  id: string;
  clubName: string;
}

interface Category {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  fullName: string;
}

interface Player {
  id: string;
  fullName: string;
}

export function MatchDetails() {
  const { seasonId, leagueId, divisionId, matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<{ [key: string]: Team }>({});
  const [category, setCategory] = useState<Category | null>(null);
  const [coaches, setCoaches] = useState<{ [key: string]: Coach }>({});
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (seasonId && leagueId && divisionId && matchId) {
      fetchMatchData();
    }
  }, [seasonId, leagueId, divisionId, matchId]);

  const fetchMatchData = async () => {
    if (!seasonId || !leagueId || !divisionId || !matchId) return;

    try {
      // Fetch match details
      const matchRef = doc(db, `seasons/${seasonId}/leagues/${leagueId}/divisions/${divisionId}/matches/${matchId}`);
      const matchSnap = await getDoc(matchRef);
      
      if (!matchSnap.exists()) {
        setToast({
          title: 'Error',
          description: 'No se encontró el partido',
          type: 'error'
        });
        return;
      }

      const matchData = { id: matchSnap.id, ...matchSnap.data() } as Match;
      setMatch(matchData);

      // Fetch teams data
      const teamsData: { [key: string]: Team } = {};
      const teamIds = [matchData.homeTeamId, matchData.awayTeamId];
      
      for (const teamId of teamIds) {
        const teamDoc = await getDoc(doc(db, 'clubs', teamId));
        if (teamDoc.exists()) {
          teamsData[teamId] = {
            id: teamId,
            clubName: teamDoc.data().clubName
          };
        }
      }
      setTeams(teamsData);

      // Fetch category
      if (matchData.categoryId) {
        const categoryRef = doc(db, `clubs/${matchData.homeTeamId}/categories/${matchData.categoryId}`);
        const categorySnap = await getDoc(categoryRef);
        if (categorySnap.exists()) {
          setCategory({ id: categorySnap.id, ...categorySnap.data() } as Category);
        }
      }

      // Fetch coaches
      const coachesData: { [key: string]: Coach } = {};
      const coachIds = [matchData.coachId];
      if (matchData.assistantId) coachIds.push(matchData.assistantId);

      for (const coachId of coachIds) {
        const coachDoc = await getDoc(doc(db, `clubs/${matchData.homeTeamId}/coaches/${coachId}`));
        if (coachDoc.exists()) {
          coachesData[coachId] = {
            id: coachId,
            ...coachDoc.data()
          } as Coach;
        }
      }
      setCoaches(coachesData);

      // Fetch players
      const playersData: { [key: string]: Player } = {};
      const playerIds = Object.keys(matchData.players);

      for (const playerId of playerIds) {
        const playerDoc = await getDoc(doc(db, `clubs/${matchData.homeTeamId}/players/${playerId}`));
        if (playerDoc.exists()) {
          playersData[playerId] = {
            id: playerId,
            ...playerDoc.data()
          } as Player;
        }
      }
      setPlayers(playersData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching match details:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles del partido',
        type: 'error'
      });
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!match) {
    return <div>No se encontró el partido</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div className="flex items-center space-x-3">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              match.status === 'completed' ? 'bg-green-100 text-green-800' :
              match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {match.status === 'completed' ? 'Finalizado' :
               match.status === 'in_progress' ? 'En Progreso' :
               'Programado'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Detalles del Partido</h2>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Match Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 opacity-75" />
                <span className="text-base sm:text-lg">
                  {new Date(match.date).toLocaleDateString()} - {match.time}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 opacity-75" />
                <span className="text-base sm:text-lg">{match.location}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold mb-3">{teams[match.homeTeamId]?.clubName}</div>
                <div className="text-3xl sm:text-5xl font-bold">{match.score.home}</div>
              </div>
              <div className="text-2xl sm:text-4xl font-light opacity-75">vs</div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold mb-3">{teams[match.awayTeamId]?.clubName}</div>
                <div className="text-3xl sm:text-5xl font-bold">{match.score.away}</div>
              </div>
            </div>
          </div>

          {/* Match Details */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Match Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Información del Partido
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Categoría</span>
                      <span className="font-medium text-gray-900">{category?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Entrenador</span>
                      <span className="font-medium text-gray-900">{coaches[match.coachId]?.fullName}</span>
                    </div>
                    {match.assistantId && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Asistente</span>
                        <span className="font-medium text-gray-900">{coaches[match.assistantId]?.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Players */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Jugadores
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(match.players).map(([playerId, data]) => (
                      <div key={playerId} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{players[playerId]?.fullName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{data.minutes} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Goles
                  </h3>
                  <div className="space-y-3">
                    {match.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {goal.playerId ? players[goal.playerId]?.fullName : goal.rivalPlayerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {goal.type === 'inside_box' && 'Dentro del área'}
                              {goal.type === 'outside_box' && 'Fuera del área'}
                              {goal.type === 'penalty' && 'Penal'}
                              {goal.type === 'free_kick' && 'Tiro libre'}
                              {goal.type === 'header' && 'Cabeza'}
                              {goal.type === 'own_goal' && 'Gol en contra'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{goal.minute}'</span>
                        </div>
                      </div>
                    ))}
                    {match.goals.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        No hay goles registrados
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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