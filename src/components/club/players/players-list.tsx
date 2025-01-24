import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Eye, Users } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Link, useNavigate } from 'react-router-dom';
import { usePositions } from '@/hooks/use-positions';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Player {
  id: string;
  playerId: string;
  fullName: string;
  position: string;
  birthDate: string;
  healthCardExpiry: string;
  categoryId: string;
  active: boolean;
  photoUrl: string;
}

interface Category {
  id: string;
  name: string;
}

export function PlayersList() {
  const { clubId, permissions } = useClubAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const { positions } = usePositions();
  const navigate = useNavigate();

  const [newPlayer, setNewPlayer] = useState({
    playerId: '',
    fullName: '',
    position: '',
    birthDate: '',
    healthCardExpiry: '',
    categoryId: '',
    active: true,
    photoUrl: ''
  });

  useEffect(() => {
    if (clubId) {
      fetchPlayers();
      fetchCategories();
    }
  }, [clubId]);

  const fetchCategories = async () => {
    if (!clubId) return;
    
    try {
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      const querySnapshot = await getDocs(categoriesRef);
      const categoriesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!clubId) return;
    
    try {
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const querySnapshot = await getDocs(playersRef);
      const playersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      setPlayers(playersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los jugadores',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!clubId || permissions.canViewOnly) {
      setToast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para agregar jugadores',
        type: 'error'
      });
      return;
    }

    if (!newPlayer.playerId || !newPlayer.fullName || !newPlayer.position || !newPlayer.categoryId) {
      setToast({
        title: 'Error',
        description: 'Por favor complete todos los campos requeridos',
        type: 'error'
      });
      return;
    }

    try {
      // 1. Create player in club's collection
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const playerDoc = await addDoc(playersRef, {
        ...newPlayer,
        createdAt: new Date().toISOString(),
      });

      // 2. Create player in global players collection
      await setDoc(doc(db, 'players', newPlayer.playerId), {
        playerId: newPlayer.playerId,
        password: newPlayer.playerId, // Initial password same as ID
        firstLogin: true,
        active: true,
        createdAt: new Date().toISOString()
      });

      setNewPlayer({
        playerId: '',
        fullName: '',
        position: '',
        birthDate: '',
        healthCardExpiry: '',
        categoryId: '',
        active: true,
        photoUrl: ''
      });
      setShowAddForm(false);
      fetchPlayers();
      setToast({
        title: 'Éxito',
        description: 'Jugador agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding player:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el jugador',
        type: 'error'
      });
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!clubId || permissions.canViewOnly) {
      setToast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para eliminar jugadores',
        type: 'error'
      });
      return;
    }

    if (!window.confirm('¿Está seguro de que desea eliminar este jugador?')) return;

    try {
      const playerRef = doc(db, `clubs/${clubId}/players`, playerId);
      await deleteDoc(playerRef);
      
      fetchPlayers();
      setToast({
        title: 'Éxito',
        description: 'Jugador eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el jugador',
        type: 'error'
      });
    }
  };

  const filteredPlayers = selectedCategory === 'all' 
    ? players 
    : players.filter(player => player.categoryId === selectedCategory);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!permissions.canViewFinances) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para ver la información de jugadores. Esta sección está reservada para personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Jugadores</h2>
          </div>
          {!permissions.canViewOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              {showAddForm ? 'Cancelar' : 'Agregar Jugador'}
            </button>
          )}
        </div>

        <div className="w-full sm:w-64">
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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            {showAddForm && (
              <div className="mb-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="playerId">ID del Jugador</Label>
                    <Input
                      id="playerId"
                      value={newPlayer.playerId}
                      onChange={(e) => setNewPlayer({ ...newPlayer, playerId: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      value={newPlayer.fullName}
                      onChange={(e) => setNewPlayer({ ...newPlayer, fullName: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">Posición</Label>
                    <Select
                      value={newPlayer.position}
                      onValueChange={(value) => setNewPlayer({ ...newPlayer, position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una posición" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newPlayer.categoryId}
                      onValueChange={(value) => setNewPlayer({ ...newPlayer, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newPlayer.birthDate}
                      onChange={(e) => setNewPlayer({ ...newPlayer, birthDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="healthCardExpiry">Vencimiento Carné de Salud</Label>
                    <Input
                      id="healthCardExpiry"
                      type="date"
                      value={newPlayer.healthCardExpiry}
                      onChange={(e) => setNewPlayer({ ...newPlayer, healthCardExpiry: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="active">Activo</Label>
                    <Switch
                      id="active"
                      checked={newPlayer.active}
                      onCheckedChange={(checked) => setNewPlayer({ ...newPlayer, active: checked })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Foto</Label>
                  <PhotoUpload
                    onFileSelect={(base64) => setNewPlayer({ ...newPlayer, photoUrl: base64 })}
                    currentPhotoUrl={newPlayer.photoUrl}
                    onRemovePhoto={() => setNewPlayer({ ...newPlayer, photoUrl: '' })}
                  />
                </div>

                <div>
                  <button
                    onClick={handleAddPlayer}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Jugador
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 hidden lg:table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Foto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posición
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlayers.map((player) => (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{player.playerId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{player.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {positions.find(p => p.id === player.position)?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {categories.find(c => c.id === player.categoryId)?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            player.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {player.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/club/dashboard/players/view/${player.id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            {!permissions.canViewOnly && (
                              <>
                                <Link
                                  to={`/club/dashboard/players/${player.id}`}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Editar jugador"
                                >
                                  <Edit className="h-5 w-5" />
                                </Link>
                                <button
                                  onClick={() => handleDeletePlayer(player.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-white rounded-lg shadow p-4 border border-gray-100"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{player.fullName}</h3>
                          <p className="text-sm text-gray-500">ID: {player.playerId}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Posición:</span>
                          <span className="text-sm font-medium">
                            {positions.find(p => p.id === player.position)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Categoría:</span>
                          <span className="text-sm font-medium">
                            {categories.find(c => c.id === player.categoryId)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Estado:</span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            player.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {player.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 border-t pt-4">
                        <Link
                          to={`/club/dashboard/players/view/${player.id}`}
                          className="p-2 text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        {!permissions.canViewOnly && (
                          <>
                            <Link
                              to={`/club/dashboard/players/${player.id}`}
                              className="p-2 text-yellow-600 hover:text-yellow-900"
                              title="Editar jugador"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="p-2 text-red-600 hover:text-red-900"
                              title="Eliminar jugador"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
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