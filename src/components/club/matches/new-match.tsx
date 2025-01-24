import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ArrowLeft } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { MatchForm } from './match-form';
import { updateMatchStatistics } from '@/lib/statistics';

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
  categoryId: string;
}

interface Team {
  id: string;
  clubName: string;
}

export function NewMatch() {
  const { seasonId, leagueId, divisionId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (auth.currentUser && seasonId && leagueId && divisionId) {
      fetchData();
    }
  }, [auth.currentUser, seasonId, leagueId, divisionId]);

  const fetchData = async () => {
    if (!auth.currentUser || !seasonId || !leagueId || !divisionId) return;

    try {
      // Fetch season data to get teams
      const seasonRef = doc(db, 'seasons', seasonId);
      const seasonSnap = await getDoc(seasonRef);
      
      if (seasonSnap.exists()) {
        const seasonData = seasonSnap.data();
        const leagueConfig = seasonData.leagueConfigs[leagueId];
        const divisionConfig = leagueConfig?.divisions[divisionId];

        if (divisionConfig) {
          // Fetch teams data
          const teamsData: Team[] = [];
          for (const clubId of divisionConfig.clubs) {
            if (clubId !== auth.currentUser.uid) { // Exclude current club
              const clubDoc = await getDoc(doc(db, 'clubs', clubId));
              if (clubDoc.exists()) {
                teamsData.push({
                  id: clubId,
                  clubName: clubDoc.data().clubName
                });
              }
            }
          }
          setTeams(teamsData);
        }
      }

      // Fetch categories
      const categoriesRef = collection(db, `clubs/${auth.currentUser.uid}/categories`);
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active) as Category[];
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

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los datos necesarios',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!seasonId || !leagueId || !divisionId || !auth.currentUser) return;

    try {
      // Preparar datos del partido
      const matchData = {
        date: data.date,
        time: data.time,
        location: data.location,
        categoryId: data.categoryId,
        coachId: data.coachId,
        assistantId: data.assistantId,
        homeTeamId: data.isHome ? auth.currentUser.uid : data.opponent,
        awayTeamId: data.isHome ? data.opponent : auth.currentUser.uid,
        players: data.players || {},
        goals: data.goals || [],
        score: {
          home: data.goals.filter((goal: any) => 
            (goal.teamType === 'home' && goal.type !== 'own_goal') || 
            (goal.teamType === 'away' && goal.type === 'own_goal')
          ).length,
          away: data.goals.filter((goal: any) => 
            (goal.teamType === 'away' && goal.type !== 'own_goal') || 
            (goal.teamType === 'home' && goal.type === 'own_goal')
          ).length
        },
        status: data.goals.length > 0 ? 'completed' : 'scheduled',
        seasonId,
        leagueId,
        divisionId,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid
      };

      // Crear el partido
      const matchesRef = collection(db, `seasons/${seasonId}/leagues/${leagueId}/divisions/${divisionId}/matches`);
      const matchDoc = await addDoc(matchesRef, matchData);

      // Actualizar estadísticas
      await updateMatchStatistics(auth.currentUser.uid, {
        id: matchDoc.id,
        ...matchData
      });

      setToast({
        title: 'Éxito',
        description: 'Partido creado correctamente',
        type: 'success'
      });

      setTimeout(() => {
        navigate(`/club/dashboard/matches/${seasonId}/${leagueId}/${divisionId}`);
      }, 2000);
    } catch (error) {
      console.error('Error creating match:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo crear el partido',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Partido</h2>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <MatchForm
              onSubmit={handleSubmit}
              categories={categories}
              divisions={[{ id: divisionId, name: 'División Actual', teams }]}
              coaches={coaches}
              players={players}
            />
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