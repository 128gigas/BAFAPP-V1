import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Shield, Castle as Whistle, Clock, Star } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface Match {
  id: string;
  date: string;
  time: string;
  homeTeamId: string;
  awayTeamId: string;
  location: string;
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
  name: string;
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

export function MatchDetail() {
  const { divisionId, matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<{ [key: string]: Team }>({});
  const [category, setCategory] = useState<Category | null>(null);
  const [coaches, setCoaches] = useState<{ [key: string]: Coach }>({});
  const [players, setPlayers] = useState<{ [key: string]: Player }>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (divisionId && matchId) {
      fetchMatchData();
    }
  }, [divisionId, matchId]);

  const fetchMatchData = async () => {
    if (!divisionId || !matchId || !auth.currentUser) return;

    try {
      // Fetch match details
      const matchRef = doc(db, `divisions/${divisionId}/matches/${matchId}`);
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

      // Fetch teams
      const teamsData: { [key: string]: Team } = {};
      const teamsRef = collection(db, `divisions/${divisionId}/teams`);
      const teamsSnap = await getDocs(teamsRef);
      teamsSnap.docs.forEach(doc => {
        teamsData[doc.id] = { id: doc.id, ...doc.data() } as Team;
      });
      setTeams(teamsData);

      // Fetch category
      if (matchData.categoryId) {
        const categoryRef = doc(db, `clubs/${auth.currentUser.uid}/categories/${matchData.categoryId}`);
        const categorySnap = await getDoc(categoryRef);
        if (categorySnap.exists()) {
          setCategory({ id: categorySnap.id, ...categorySnap.data() } as Category);
        }
      }

      // Fetch coaches
      const coachesData: { [key: string]: Coach } = {};
      const coachesRef = collection(db, `clubs/${auth.currentUser.uid}/coaches`);
      const coachesSnap = await getDocs(coachesRef);
      coachesSnap.docs.forEach(doc => {
        coachesData[doc.id] = { id: doc.id, ...doc.data() } as Coach;
      });
      setCoaches(coachesData);

      // Fetch players
      const playersData: { [key: string]: Player } = {};
      const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
      const playersSnap = await getDocs(playersRef);
      playersSnap.docs.forEach(doc => {
        playersData[doc.id] = { id: doc.id, ...doc.data() } as Player;
      });
      setPlayers(playersData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching match data:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del partido',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-yellow-100 text-yellow-800', text: 'Programado' },
      in_progress: { color: 'bg-blue-100 text-blue-800', text: 'En Progreso' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Finalizado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'penalty':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'free_kick':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'header':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getGoalTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      inside_box: 'Dentro del área',
      outside_box: 'Fuera del área',
      penalty: 'Penal',
      free_kick: 'Tiro libre',
      header: 'Cabeza',
      own_goal: 'Gol en contra'
    };
    return types[type] || type;
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
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/club/dashboard/matches/${divisionId}`)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div className="flex items-center space-x-3">
            {getStatusBadge(match.status)}
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Partido</h2>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with match info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 opacity-75" />
                <span className="text-lg">
                  {new Date(match.date).toLocaleDateString()} - {match.time}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 opacity-75" />
                <span className="text-lg">{match.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-12">
              <div className="text-center">
                <div className="text-2xl font-bold mb-3">{teams[match.homeTeamId]?.name}</div>
                <div className="text-5xl font-bold">{match.score.home}</div>
              </div>
              <div className="text-4xl font-light opacity-75">vs</div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-3">{teams[match.awayTeamId]?.name}</div>
                <div className="text-5xl font-bold">{match.score.away}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Match Info */}
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

                {/* Goals */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                    Goles
                  </h3>
                  <div className="space-y-3">
                    {match.goals.map((goal, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                          {getGoalTypeIcon(goal.type)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {goal.playerId ? players[goal.playerId]?.fullName : goal.rivalPlayerName}
                            </div>
                            <div className="text-sm text-gray-500">{getGoalTypeText(goal.type)}</div>
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

              {/* Right Column */}
              <div className="space-y-6">
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