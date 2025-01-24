import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Calendar } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  active: boolean;
}

interface Division {
  id: string;
  name: string;
  leagueId: string;
  active: boolean;
}

interface Tournament {
  id: string;
  name: string;
  active: boolean;
}

interface Club {
  id: string;
  clubName: string;
}

export function SeasonsList() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newClubName, setNewClubName] = useState('');
  const [newSeason, setNewSeason] = useState<Season>({
    name: '',
    year: new Date().getFullYear().toString(),
    description: '',
    active: true,
    leagueConfigs: {}
  });
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch seasons
      const seasonsRef = collection(db, 'seasons');
      const seasonsSnapshot = await getDocs(seasonsRef);
      const seasonsData = seasonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Season[];
      setSeasons(seasonsData);

      // Fetch leagues
      const leaguesRef = collection(db, 'leagues');
      const leaguesSnapshot = await getDocs(leaguesRef);
      const leaguesData = leaguesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((league: any) => league.active) as League[];
      setLeagues(leaguesData);

      // Fetch divisions
      const divisionsRef = collection(db, 'divisions');
      const divisionsSnapshot = await getDocs(divisionsRef);
      const divisionsData = divisionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((division: any) => division.active) as Division[];
      setDivisions(divisionsData);

      // Fetch tournaments
      const tournamentsRef = collection(db, 'tournaments');
      const tournamentsSnapshot = await getDocs(tournamentsRef);
      const tournamentsData = tournamentsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((tournament: any) => tournament.active) as Tournament[];
      setTournaments(tournamentsData);

      // Fetch clubs - Important: No longer filtering by active status
      const clubsRef = collection(db, 'clubs');
      const clubsSnapshot = await getDocs(clubsRef);
      const clubsData = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        clubName: doc.data().clubName
      })) as Club[];
      setClubs(clubsData);

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

  const handleLeagueSelect = (leagueId: string) => {
    const updatedConfigs = { ...newSeason.leagueConfigs };
    
    if (updatedConfigs[leagueId]) {
      delete updatedConfigs[leagueId];
    } else {
      updatedConfigs[leagueId] = {
        divisions: {}
      };
      
      // Automatically add all divisions for this league
      const leagueDivisions = divisions.filter(d => d.leagueId === leagueId);
      leagueDivisions.forEach(division => {
        updatedConfigs[leagueId].divisions[division.id] = {
          clubs: [],
          tournaments: []
        };
      });
    }

    setNewSeason({
      ...newSeason,
      leagueConfigs: updatedConfigs
    });
  };

  const handleTournamentSelect = (leagueId: string, divisionId: string, tournamentId: string) => {
    const updatedConfigs = { ...newSeason.leagueConfigs };
    const tournaments = updatedConfigs[leagueId].divisions[divisionId].tournaments;
    
    if (tournaments.includes(tournamentId)) {
      updatedConfigs[leagueId].divisions[divisionId].tournaments = tournaments.filter(id => id !== tournamentId);
    } else {
      updatedConfigs[leagueId].divisions[divisionId].tournaments.push(tournamentId);
    }

    setNewSeason({
      ...newSeason,
      leagueConfigs: updatedConfigs
    });
  };

  const handleClubSelect = (leagueId: string, divisionId: string, clubId: string) => {
    const updatedConfigs = { ...newSeason.leagueConfigs };
    
    // Verificar si el club ya está asignado a otra división en cualquier liga
    let clubAlreadyAssigned = false;
    let existingDivision = '';
    let existingLeague = '';

    Object.entries(updatedConfigs).forEach(([currentLeagueId, leagueConfig]) => {
      Object.entries(leagueConfig.divisions).forEach(([currentDivisionId, divisionConfig]) => {
        if (divisionConfig.clubs.includes(clubId) && 
            (currentLeagueId !== leagueId || currentDivisionId !== divisionId)) {
          clubAlreadyAssigned = true;
          existingDivision = divisions.find(d => d.id === currentDivisionId)?.name || '';
          existingLeague = leagues.find(l => l.id === currentLeagueId)?.name || '';
        }
      });
    });

    if (clubAlreadyAssigned) {
      setToast({
        title: 'Error',
        description: `Este club ya está asignado a la división ${existingDivision} de la liga ${existingLeague}`,
        type: 'error'
      });
      return;
    }

    // Si el club no está asignado a otra división, proceder con la asignación
    const clubs = updatedConfigs[leagueId].divisions[divisionId].clubs;
    
    if (clubs.includes(clubId)) {
      updatedConfigs[leagueId].divisions[divisionId].clubs = clubs.filter(id => id !== clubId);
    } else {
      updatedConfigs[leagueId].divisions[divisionId].clubs.push(clubId);
    }

    setNewSeason({
      ...newSeason,
      leagueConfigs: updatedConfigs
    });
  };

  const handleAddNewClub = async (leagueId: string, divisionId: string) => {
    if (!newClubName.trim()) {
      setToast({
        title: 'Error',
        description: 'El nombre del club es requerido',
        type: 'error'
      });
      return;
    }

    try {
      // Crear nuevo club en Firestore
      const clubsRef = collection(db, 'clubs');
      const newClubRef = await addDoc(clubsRef, {
        clubName: newClubName.trim(),
        active: true,
        createdAt: new Date().toISOString()
      });

      // Agregar el nuevo club a la lista local
      const newClub = {
        id: newClubRef.id,
        clubName: newClubName.trim()
      };
      setClubs([...clubs, newClub]);

      // Asignar el nuevo club a la división
      handleClubSelect(leagueId, divisionId, newClubRef.id);

      setNewClubName('');
      setToast({
        title: 'Éxito',
        description: 'Club agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding new club:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el club',
        type: 'error'
      });
    }
  };

  const handleAddSeason = async () => {
    if (!newSeason.name.trim() || !newSeason.year) {
      setToast({
        title: 'Error',
        description: 'El nombre y el año son requeridos',
        type: 'error'
      });
      return;
    }

    try {
      const seasonsRef = collection(db, 'seasons');
      await addDoc(seasonsRef, {
        ...newSeason,
        name: newSeason.name.trim(),
        createdAt: new Date().toISOString(),
      });

      setNewSeason({
        name: '',
        year: new Date().getFullYear().toString(),
        description: '',
        active: true,
        leagueConfigs: {}
      });
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Temporada agregada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding season:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar la temporada',
        type: 'error'
      });
    }
  };

  const handleUpdateSeason = async (seasonId: string, updatedSeason: Season) => {
    try {
      const seasonRef = doc(db, 'seasons', seasonId);
      await updateDoc(seasonRef, {
        ...updatedSeason,
        name: updatedSeason.name.trim(),
        updatedAt: new Date().toISOString(),
      });

      setEditingSeason(null);
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Temporada actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating season:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la temporada',
        type: 'error'
      });
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta temporada?')) return;

    try {
      const seasonRef = doc(db, 'seasons', seasonId);
      await deleteDoc(seasonRef);
      
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Temporada eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting season:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la temporada',
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
        <div className="flex items-center space-x-4">
          <Calendar className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Temporadas</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nueva temporada */}
            <div className="mb-6 space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={newSeason.name}
                    onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                    placeholder="Nombre de la temporada"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newSeason.year}
                    onChange={(e) => setNewSeason({ ...newSeason, year: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newSeason.description}
                    onChange={(e) => setNewSeason({ ...newSeason, description: e.target.value })}
                    placeholder="Descripción de la temporada"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Selección de ligas y divisiones */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuración de Ligas y Divisiones</h3>
                
                {/* Lista de ligas */}
                <div className="space-y-4">
                  {leagues.map(league => (
                    <div key={league.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">{league.name}</h4>
                        <Switch
                          checked={!!newSeason.leagueConfigs[league.id]}
                          onCheckedChange={() => handleLeagueSelect(league.id)}
                        />
                      </div>

                      {newSeason.leagueConfigs[league.id] && (
                        <div className="space-y-4 pl-4">
                          {/* Lista de divisiones de la liga */}
                          {divisions
                            .filter(division => division.leagueId === league.id)
                            .map(division => (
                              <div key={division.id} className="border-l-2 pl-4">
                                <h5 className="font-medium mb-2">{division.name}</h5>
                                
                                {/* Selección de torneos */}
                                <div className="mb-4">
                                  <Label className="text-sm">Torneos</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {tournaments.map(tournament => (
                                      <button
                                        key={tournament.id}
                                        onClick={() => handleTournamentSelect(league.id, division.id, tournament.id)}
                                        className={`px-3 py-1 text-sm rounded-full ${
                                          newSeason.leagueConfigs[league.id]?.divisions[division.id]?.tournaments.includes(tournament.id)
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {tournament.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Selección de clubes */}
                                <div>
                                  <Label className="text-sm">Clubes</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {clubs.map(club => (
                                      <button
                                        key={club.id}
                                        onClick={() => handleClubSelect(league.id, division.id, club.id)}
                                        className={`px-3 py-1 text-sm rounded-full ${
                                          newSeason.leagueConfigs[league.id]?.divisions[division.id]?.clubs.includes(club.id)
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {club.clubName}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Agregar nuevo club */}
                                  <div className="mt-2 flex gap-2">
                                    <Input
                                      placeholder="Nombre del nuevo club"
                                      value={newClubName}
                                      onChange={(e) => setNewClubName(e.target.value)}
                                      className="flex-1"
                                    />
                                    <button
                                      onClick={() => handleAddNewClub(league.id, division.id)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                      <Plus className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddSeason}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Agregar Temporada
                </button>
              </div>
            </div>

            {/* Lista de temporadas */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Temporadas Existentes</h3>
              <div className="space-y-4">
                {seasons.map(season => (
                  <div key={season.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium">{season.name}</h4>
                        <p className="text-sm text-gray-500">{season.description}</p>
                        <p className="text-sm text-gray-500">Año: {season.year}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSeason(season)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeason(season.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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