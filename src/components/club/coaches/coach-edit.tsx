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

interface CoachData {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  active: boolean;
  photoUrl: string;
  categories: string[];
}

interface Category {
  id: string;
  name: string;
}

export function CoachEdit() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, [coachId]);

  const fetchData = async () => {
    if (!auth.currentUser || !coachId) return;

    try {
      // Fetch coach data
      const coachRef = doc(db, `clubs/${auth.currentUser.uid}/coaches`, coachId);
      const coachSnap = await getDoc(coachRef);
      
      if (!coachSnap.exists()) {
        setToast({
          title: 'Error',
          description: 'No se encontró el entrenador',
          type: 'error'
        });
        return;
      }

      setCoachData(coachSnap.data() as CoachData);

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
    if (!auth.currentUser || !coachId || !coachData) return;

    try {
      const coachRef = doc(db, `clubs/${auth.currentUser.uid}/coaches`, coachId);
      await updateDoc(coachRef, {
        ...coachData,
        updatedAt: new Date().toISOString()
      });

      setToast({
        title: 'Éxito',
        description: 'Entrenador actualizado correctamente',
        type: 'success'
      });

      setTimeout(() => {
        navigate('/club/dashboard/coaches');
      }, 2000);
    } catch (error) {
      console.error('Error updating coach:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el entrenador',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!coachData) {
    return <div>No se encontró el entrenador</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/club/dashboard/coaches')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Editar Entrenador</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="col-span-full">
                <Label>Foto</Label>
                <PhotoUpload
                  onFileSelect={(base64) => setCoachData({ ...coachData, photoUrl: base64 })}
                  currentPhotoUrl={coachData.photoUrl}
                  onRemovePhoto={() => setCoachData({ ...coachData, photoUrl: '' })}
                />
              </div>

              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={coachData.fullName}
                  onChange={(e) => setCoachData({ ...coachData, fullName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={coachData.phone}
                  onChange={(e) => setCoachData({ ...coachData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={coachData.email}
                  onChange={(e) => setCoachData({ ...coachData, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="categories">Categorías</Label>
                <Select
                  value={coachData.categories[0]}
                  onValueChange={(value) => setCoachData({ ...coachData, categories: [value] })}
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

              <div className="col-span-full">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={coachData.notes}
                  onChange={(e) => setCoachData({ ...coachData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={coachData.active}
                  onCheckedChange={(checked) => setCoachData({ ...coachData, active: checked })}
                />
              </div>

              <div className="col-span-full flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/club/dashboard/coaches')}
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