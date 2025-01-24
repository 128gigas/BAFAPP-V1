import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Calendar, MapPin, Shield, Trophy } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { useNavigate, useParams } from 'react-router-dom';
import { MatchForm } from './match-form';
import { updateMatchStatistics, deleteMatchStatistics } from '@/lib/statistics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface Category {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  fullName: string;
  active: boolean;
}

interface Player {
  id: string;
  fullName: string;
  categoryId: string;
  active: boolean;
}

export function DivisionMatches() {
  const { seasonId, leagueId, divisionId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (seasonId && leagueId && divisionId) {
      fetchData();
    }
  }, [seasonId, leagueId, divisionId]);

  const fetchData = async () => {
    if (!seasonId || !leagueId || !divisionId || !auth.currentUser) return;

    try {
      // Fetch matches
      const matchesRef = collection(db, `seasons/${seasonId}/leagues/${leagueId}/divisions/${divisionId}/matches`);
      const matchesSnap = await getDocs(matchesRef);
      const matchesData = matchesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];
      setMatches(matchesData);

      // Fetch categories
      const categoriesRef = collection(db, `clubs/${auth.currentUser.uid}/categories`);
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((cat: any) => cat.active) as Category[];
      setCategories(categoriesData);

      // Fetch coaches
      const coachesRef = collection(db, `clubs/${auth.currentUser.uid}/coaches`);
      const coachesSnap = await getDocs(coachesRef);
      const coachesData = coachesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((coach: any) => coach.active) as Coach[];
      setCoaches(coachesData);

      // Fetch players
      const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
      const playersSnap = await getDocs(playersRef);
      const playersData = playersSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((player: any) => player.active) as Player[];
      setPlayers(playersData);

      // Fetch teams from season data
      const seasonRef = doc(db, 'seasons', seasonId);
      const seasonSnap = await getDoc(seasonRef);
      if (seasonSnap.exists()) {
        const seasonData = seasonSnap.data();
        const divisionTeams = seasonData.leagueConfigs?.[leagueId]?.divisions?.[divisionId]?.clubs || [];
        
        // Fetch team details
        const teamsData = [];
        for (const teamId of divisionTeams) {
          if (teamId !== auth.currentUser.uid) {
            const teamDoc = await getDoc(doc(db, 'clubs', teamId));
            if (teamDoc.exists()) {
              teamsData.push({
                id: teamId,
                clubName: teamDoc.data().clubName
              });
            }
          }
        }
        setTeams(teamsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleUpdateMatch = async (matchId: string, updatedData: any) => {
    if (!seasonId || !leagueId || !divisionId || !auth.currentUser) return;

    try {
      const matchRef = doc(db, `seasons/${seasonId}/leagues/${leagueId}/divisions/${divisionId}/matches/${matchId}`);
      
      // Prepare updated data
      const matchData = {
        ...updatedData,
        score: {
          home: updatedData.goals.filter((goal: any) => 
            (goal.teamType === 'home' && goal.type !== 'own_goal') || 
            (goal.teamType === 'away' && goal.type === 'own_goal')
          ).length,
          away: updatedData.goals.filter((goal: any) => 
            (goal.teamType === 'away' && goal.type !== 'own_goal') || 
            (goal.teamType === 'home' && goal.type === 'own_goal')
          ).length
        },
        status: updatedData.goals.length > 0 ? 'completed' : 'scheduled',
        coachId: updatedData.coachId,
        assistantId: updatedData.assistantId,
        seasonId,
        leagueId,
        divisionId,
        updatedAt: new Date().toISOString()
      };

      // Update match
      await updateDoc(matchRef, matchData);

      // Update statistics
      await updateMatchStatistics(auth.currentUser.uid, {
        id: matchId,
        ...matchData
      });

      setShowEditModal(false);
      setEditingMatch(null);
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Partido actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating match:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el partido',
        type: 'error'
      });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!seasonId || !leagueId || !divisionId || !auth.currentUser) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este partido?')) return;

    try {
      const matchRef = doc(db, `seasons/${seasonId}/leagues/${leagueId}/divisions/${divisionId}/matches/${matchId}`);
      await deleteDoc(matchRef);
      
      // Delete statistics
      await deleteMatchStatistics(auth.currentUser.uid, matchId);
      
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Partido eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting match:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el partido',
        type: 'error'
      });
    }
  };

  const filteredMatches = matches.filter(match => 
    selectedCategory === 'all' || match.categoryId === selectedCategory
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/club/dashboard/matches')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <div className="flex items-center space-x-4">
            <div className="w-64">
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
            <button
              onClick={() => navigate(`new`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Partido
            </button>
          </div>
        </div>

        {/* Estadísticas de Partidos */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-100 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Victorias</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredMatches.filter(m => 
                    m.status === 'completed' && 
                    ((m.homeTeamId === auth.currentUser?.uid && m.score.home > m.score.away) ||
                     (m.awayTeamId === auth.currentUser?.uid && m.score.away > m.score.home))
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-100 rounded-full">
                <Trophy className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Derrotas</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredMatches.filter(m => 
                    m.status === 'completed' && 
                    ((m.homeTeamId === auth.currentUser?.uid && m.score.home < m.score.away) ||
                     (m.awayTeamId === auth.currentUser?.uid && m.score.away < m.score.home))
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Empates</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredMatches.filter(m => 
                    m.status === 'completed' && m.score.home === m.score.away
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No hay partidos programados</p>
            </div>
          ) : (
            filteredMatches
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((match) => (
                <div 
                  key={match.id} 
                  className="group relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Banda superior decorativa */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                  
                  <div className="p-6">
                    {/* Encabezado del partido */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <p className="font-medium text-gray-900">{new Date(match.date).toLocaleDateString()}</p>
                          <p className="text-sm">{match.time}</p>
                        </div>
                      </div>
                      <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>

                    {/* Información del partido */}
                    <div className="space-y-4">
                      {/* Equipos y resultado */}
                      <div className="flex items-center justify-between py-4 border-t border-gray-100">
                        <div className="text-center flex-1">
                          <p className="font-medium text-gray-900">
                            {match.homeTeamId === auth.currentUser?.uid ? 'Mi equipo' : 
                              teams.find(t => t.id === match.homeTeamId)?.clubName || 'Equipo Local'}
                          </p>
                        </div>
                        <div className="mx-4 px-4 py-2 bg-gray-50 rounded-lg">
                          <div className="text-xl font-bold text-gray-900">
                            {match.status === 'completed' ? 
                              `${match.score.home} - ${match.score.away}` : 
                              'vs'
                            }
                          </div>
                        </div>
                        <div className="text-center flex-1">
                          <p className="font-medium text-gray-900">
                            {match.awayTeamId === auth.currentUser?.uid ? 'Mi equipo' : 
                              teams.find(t => t.id === match.awayTeamId)?.clubName || 'Equipo Visitante'}
                          </p>
                        </div>
                      </div>

                      {/* Ubicación */}
                      <div className="flex items-center space-x-2 text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{match.location}</span>
                      </div>

                      {/* Estado y acciones */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' :
                          match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.status === 'completed' ? 'Finalizado' :
                           match.status === 'in_progress' ? 'En Progreso' :
                           'Programado'}
                        </span>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`${match.id}`)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMatch(match);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-full transition-colors"
                            title="Editar partido"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar partido"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Partido</h3>
                <MatchForm
                  match={editingMatch}
                  onSubmit={(data) => handleUpdateMatch(editingMatch.id, data)}
                  onCancel={() => {
                    setShowEditModal(false);
                    setEditingMatch(null);
                  }}
                  categories={categories}
                  divisions={[{ id: divisionId, teams }]}
                  coaches={coaches}
                  players={players}
                />
              </div>
            </div>
          </div>
        )}
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