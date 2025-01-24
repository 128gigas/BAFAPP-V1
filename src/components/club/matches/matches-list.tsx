import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Calendar, ArrowRight, Shield } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Season {
  id: string;
  name: string;
  year: string;
  description: string;
  active: boolean;
  leagueConfigs: {
    [leagueId: string]: {
      divisions: {
        [divisionId: string]: {
          clubs: string[];
          tournaments: string[];
        };
      };
    };
  };
}

interface League {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
}

export function MatchesList() {
  const navigate = useNavigate();
  const { clubId, permissions } = useClubAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<{ [key: string]: League }>({});
  const [divisions, setDivisions] = useState<{ [key: string]: Division }>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (clubId) {
      fetchData();
    }
  }, [clubId]);

  const fetchData = async () => {
    if (!clubId) return;

    try {
      // Fetch active seasons where the club participates
      const seasonsRef = collection(db, 'seasons');
      const seasonsSnapshot = await getDocs(seasonsRef);
      const allSeasons = seasonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Season[];

      // Filter seasons where the club participates
      const clubSeasons = allSeasons.filter(season => {
        return Object.entries(season.leagueConfigs || {}).some(([_, leagueConfig]) => {
          return Object.entries(leagueConfig.divisions || {}).some(([_, divisionConfig]) => {
            return divisionConfig.clubs.includes(clubId);
          });
        });
      });

      // Fetch leagues and divisions data
      const leaguesData: { [key: string]: League } = {};
      const divisionsData: { [key: string]: Division } = {};

      for (const season of clubSeasons) {
        for (const [leagueId, leagueConfig] of Object.entries(season.leagueConfigs || {})) {
          if (!leaguesData[leagueId]) {
            const leagueDoc = await getDoc(doc(db, 'leagues', leagueId));
            if (leagueDoc.exists()) {
              leaguesData[leagueId] = {
                id: leagueId,
                ...leagueDoc.data()
              } as League;
            }
          }

          for (const [divisionId] of Object.entries(leagueConfig.divisions || {})) {
            if (!divisionsData[divisionId]) {
              const divisionDoc = await getDoc(doc(db, 'divisions', divisionId));
              if (divisionDoc.exists()) {
                divisionsData[divisionId] = {
                  id: divisionId,
                  ...divisionDoc.data()
                } as Division;
              }
            }
          }
        }
      }

      setSeasons(clubSeasons);
      setLeagues(leaguesData);
      setDivisions(divisionsData);
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

  if (!permissions.canManageMatches) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para gestionar los partidos del club. Esta sección está reservada para entrenadores y personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Partidos</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seasons.length > 0 ? (
            seasons.map((season) => (
              <div key={season.id} className="group relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Banda superior decorativa */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="p-6">
                  {/* Encabezado de la temporada */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{season.name}</h3>
                      <p className="text-sm text-gray-500">{season.year}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>

                  {/* Lista de ligas y divisiones */}
                  <div className="space-y-4">
                    {Object.entries(season.leagueConfigs || {}).map(([leagueId, leagueConfig]) => {
                      const league = leagues[leagueId];
                      if (!league) return null;

                      return (
                        <div key={leagueId} className="border-t pt-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Shield className="h-5 w-5 text-gray-400" />
                            <h4 className="font-medium text-gray-900">{league.name}</h4>
                          </div>
                          
                          <div className="space-y-2 pl-7">
                            {Object.entries(leagueConfig.divisions || {}).map(([divisionId, divisionConfig]) => {
                              const division = divisions[divisionId];
                              if (!division || !divisionConfig.clubs.includes(clubId)) return null;

                              return (
                                <div 
                                  key={divisionId}
                                  onClick={() => navigate(`/club/dashboard/matches/${season.id}/${leagueId}/${divisionId}`)}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group/item"
                                >
                                  <span className="text-sm text-gray-600">{division.name}</span>
                                  <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transform group-hover/item:translate-x-1 transition-all" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-gray-500">No hay temporadas activas para este club</p>
            </div>
          )}
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