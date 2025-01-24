import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { usePositions } from '@/hooks/use-positions';

interface PlayerData {
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

export function PlayerEdit() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const { positions } = usePositions();

  useEffect(() => {
    fetchData();
  }, [playerId]);

  const fetchData = async () => {
    if (!auth.currentUser || !playerId) return;

    try {
      // Fetch player data
      const playerRef = doc(db, `clubs/${auth.currentUser.uid}/players`, playerId);
      const playerSnap = await getDoc(playerRef);
      
      if (!playerSnap.exists()) {
        setToast({
          title: 'Error',
          description: 'No se encontró el jugador',
          type: 'error'
        });
        return;
      }

      setPlayerData(playerSnap.data() as PlayerData);

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

  const handleSubmit = async () => {
    if (!auth.currentUser || !playerId || !playerData) return;

    try {
      const playerRef = doc(db, `clubs/${auth.currentUser.uid}/players`, playerId);
      await updateDoc(playerRef, {
        ...playerData,
        updatedAt: new Date().toISOString()
      });

      setToast({
        title: 'Éxito',
        description: 'Jugador actualizado correctamente',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/club/dashboard/players');
      }, 2000);
    } catch (error) {
      console.error('Error updating player:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el jugador',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!playerData) {
    return <div>No se encontró el jugador</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/club/dashboard/players')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Editar Jugador</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="playerId">ID del Jugador</Label>
                <Input
                  id="playerId"
                  value={playerData.playerId}
                  onChange={(e) => setPlayerData({ ...playerData, playerId: e.target.value })}
                  className="mt-1"
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={playerData.fullName}
                  onChange={(e) => setPlayerData({ ...playerData, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">Posición</Label>
                <Select
                  value={playerData.position}
                  onValueChange={(value) => setPlayerData({ ...playerData, position: value })}
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
                  value={playerData.categoryId}
                  onValueChange={(value) => setPlayerData({ ...playerData, categoryId: value })}
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
                  value={playerData.birthDate}
                  onChange={(e) => setPlayerData({ ...playerData, birthDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="healthCardExpiry">Vencimiento Carné de Salud</Label>
                <Input
                  id="healthCardExpiry"
                  type="date"
                  value={playerData.healthCardExpiry}
                  onChange={(e) => setPlayerData({ ...playerData, healthCardExpiry: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={playerData.active}
                  onCheckedChange={(checked) => setPlayerData({ ...playerData, active: checked })}
                />
              </div>

              <div className="col-span-full">
                <Label>Foto</Label>
                <PhotoUpload
                  onFileSelect={(base64) => setPlayerData({ ...playerData, photoUrl: base64 })}
                  currentPhotoUrl={playerData.photoUrl}
                  onRemovePhoto={() => setPlayerData({ ...playerData, photoUrl: '' })}
                />
              </div>

              <div className="col-span-full flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/club/dashboard/players')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
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