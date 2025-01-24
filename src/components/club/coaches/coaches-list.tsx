import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Link } from 'react-router-dom';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Coach {
  id: string;
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

export function CoachesList() {
  const { clubId, permissions } = useClubAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  const [newCoach, setNewCoach] = useState({
    fullName: '',
    phone: '',
    email: '',
    notes: '',
    active: true,
    photoUrl: '',
    categories: [],
  });

  useEffect(() => {
    if (clubId) {
      fetchCoaches();
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

  const fetchCoaches = async () => {
    if (!clubId) return;
    
    try {
      const coachesRef = collection(db, `clubs/${clubId}/coaches`);
      const querySnapshot = await getDocs(coachesRef);
      const coachesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coach[];
      setCoaches(coachesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los entrenadores',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddCoach = async () => {
    if (!clubId || !newCoach.fullName.trim() || !newCoach.categories.length) {
      setToast({
        title: 'Error',
        description: 'El nombre y la categoría son requeridos',
        type: 'error'
      });
      return;
    }

    try {
      const coachesRef = collection(db, `clubs/${clubId}/coaches`);
      await addDoc(coachesRef, {
        ...newCoach,
        fullName: newCoach.fullName.trim(),
        createdAt: new Date().toISOString(),
      });

      setNewCoach({
        fullName: '',
        phone: '',
        email: '',
        notes: '',
        active: true,
        photoUrl: '',
        categories: [],
      });
      setShowAddForm(false);
      fetchCoaches();
      setToast({
        title: 'Éxito',
        description: 'Entrenador agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding coach:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el entrenador',
        type: 'error'
      });
    }
  };

  const handleDeleteCoach = async (coachId: string) => {
    if (!clubId || !window.confirm('¿Está seguro de que desea eliminar este entrenador?')) return;

    try {
      const coachRef = doc(db, `clubs/${clubId}/coaches`, coachId);
      await deleteDoc(coachRef);
      
      fetchCoaches();
      setToast({
        title: 'Éxito',
        description: 'Entrenador eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting coach:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el entrenador',
        type: 'error'
      });
    }
  };

  if (!permissions.canManageCoaches && !permissions.canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para gestionar los entrenadores del club. Esta sección está reservada para delegados y personal autorizado.
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Entrenadores</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            {showAddForm ? 'Cancelar' : 'Agregar Entrenador'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6">
            {showAddForm && (
              <div className="mb-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <Label>Foto</Label>
                    <PhotoUpload
                      onFileSelect={(base64) => setNewCoach({ ...newCoach, photoUrl: base64 })}
                      currentPhotoUrl={newCoach.photoUrl}
                      onRemovePhoto={() => setNewCoach({ ...newCoach, photoUrl: '' })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input
                      id="fullName"
                      value={newCoach.fullName}
                      onChange={(e) => setNewCoach({ ...newCoach, fullName: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={newCoach.phone}
                      onChange={(e) => setNewCoach({ ...newCoach, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCoach.email}
                      onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categories">Categorías</Label>
                    <Select
                      value={newCoach.categories[0]}
                      onValueChange={(value) => setNewCoach({ ...newCoach, categories: [value] })}
                    >
                      <SelectTrigger className="mt-1">
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
                      value={newCoach.notes}
                      onChange={(e) => setNewCoach({ ...newCoach, notes: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="active">Activo</Label>
                    <Switch
                      id="active"
                      checked={newCoach.active}
                      onCheckedChange={(checked) => setNewCoach({ ...newCoach, active: checked })}
                    />
                  </div>

                  <div className="col-span-full">
                    <button
                      onClick={handleAddCoach}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Agregar Entrenador
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Foto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorías
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
                    {coaches.map((coach) => (
                      <tr key={coach.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {coach.photoUrl ? (
                            <img
                              src={coach.photoUrl}
                              alt={coach.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{coach.fullName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{coach.phone}</div>
                          <div className="text-sm text-gray-500">{coach.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {coach.categories.map(categoryId => {
                              const category = categories.find(c => c.id === categoryId);
                              return category ? category.name : '';
                            }).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            coach.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {coach.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/club/dashboard/coaches/${coach.id}`}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar entrenador"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCoach(coach.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coaches.map((coach) => (
                  <div key={coach.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <div className="flex items-center space-x-4 mb-4">
                      {coach.photoUrl ? (
                        <img
                          src={coach.photoUrl}
                          alt={coach.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{coach.fullName}</h3>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coach.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {coach.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Contacto:</p>
                        <p className="text-sm font-medium">{coach.phone}</p>
                        <p className="text-sm font-medium">{coach.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Categorías:</p>
                        <p className="text-sm font-medium">
                          {coach.categories.map(categoryId => {
                            const category = categories.find(c => c.id === categoryId);
                            return category ? category.name : '';
                          }).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      <Link
                        to={`/club/dashboard/coaches/${coach.id}`}
                        className="p-2 text-yellow-600 hover:text-yellow-900"
                        title="Editar entrenador"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteCoach(coach.id)}
                        className="p-2 text-red-600 hover:text-red-900"
                        title="Eliminar entrenador"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
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