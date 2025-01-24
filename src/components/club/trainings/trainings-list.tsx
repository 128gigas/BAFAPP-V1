import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Dumbbell } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTrainingStatistics, deleteTrainingStatistics } from '@/lib/statistics';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Training {
  id: string;
  date: string;
  time: string;
  location: string;
  categoryId: string;
  description: string;
  active: boolean;
  attendance?: { [key: string]: boolean };
}

interface Player {
  id: string;
  playerId: string;
  fullName: string;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CategoryStats {
  [key: string]: {
    total: number;
    averageAttendance: number;
  };
}

export function TrainingsList() {
  const { clubId, permissions } = useClubAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player[] }>({});
  const [attendance, setAttendance] = useState<{ [key: string]: boolean }>({});
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const [newTraining, setNewTraining] = useState({
    date: '',
    time: '',
    location: 'Nuestra Cancha',
    categoryId: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    if (clubId) {
      fetchTrainings();
      fetchCategories();
    }
  }, [clubId]);

  useEffect(() => {
    const loadPlayersAndCalculateStats = async () => {
      for (const category of categories) {
        if (!players[category.id]) {
          await fetchPlayers(category.id);
        }
      }
      calculateCategoryStats();
    };

    if (categories.length > 0) {
      loadPlayersAndCalculateStats();
    }
  }, [categories, trainings]);

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

  const fetchPlayers = async (categoryId: string) => {
    if (!clubId) return;
    
    try {
      const playersRef = collection(db, `clubs/${clubId}/players`);
      const querySnapshot = await getDocs(playersRef);
      const playersData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(player => player.categoryId === categoryId && player.active) as Player[];
      
      setPlayers(prev => ({
        ...prev,
        [categoryId]: playersData
      }));

      return playersData;
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  };

  const fetchTrainings = async () => {
    if (!clubId) return;
    
    try {
      const trainingsRef = collection(db, `clubs/${clubId}/trainings`);
      const querySnapshot = await getDocs(trainingsRef);
      const trainingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Training[];
      setTrainings(trainingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los entrenamientos',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const calculateCategoryStats = () => {
    const stats: CategoryStats = {};
    
    for (const category of categories) {
      const categoryPlayers = players[category.id] || [];
      const totalPlayersInCategory = categoryPlayers.length;

      const categoryTrainings = trainings.filter(t => t.categoryId === category.id);
      
      if (totalPlayersInCategory > 0 && categoryTrainings.length > 0) {
        const trainingAttendances = categoryTrainings.map(training => {
          if (training.attendance) {
            const presentPlayers = Object.values(training.attendance).filter(attended => attended).length;
            return (presentPlayers / totalPlayersInCategory) * 100;
          }
          return 0;
        });

        const averageAttendance = Math.round(
          trainingAttendances.reduce((sum, attendance) => sum + attendance, 0) / categoryTrainings.length
        );

        stats[category.id] = {
          total: categoryTrainings.length,
          averageAttendance: averageAttendance
        };
      } else {
        stats[category.id] = {
          total: categoryTrainings.length,
          averageAttendance: 0
        };
      }
    }

    setCategoryStats(stats);
  };

  const handleAddTraining = async () => {
    if (!clubId || !newTraining.date || !newTraining.time || !newTraining.categoryId) return;

    try {
      const trainingRef = await addDoc(collection(db, `clubs/${clubId}/trainings`), {
        ...newTraining,
        createdAt: new Date().toISOString(),
      });

      await updateTrainingStatistics(clubId, {
        id: trainingRef.id,
        ...newTraining
      });

      setNewTraining({
        date: '',
        time: '',
        location: 'Nuestra Cancha',
        categoryId: '',
        description: '',
        active: true,
      });
      setShowAddForm(false);
      fetchTrainings();
      setToast({
        title: 'Éxito',
        description: 'Entrenamiento agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding training:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el entrenamiento',
        type: 'error'
      });
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!clubId || !window.confirm('¿Está seguro de que desea eliminar este entrenamiento?')) return;

    try {
      const trainingRef = doc(db, `clubs/${clubId}/trainings`, trainingId);
      await deleteDoc(trainingRef);
      
      await deleteTrainingStatistics(clubId, trainingId);
      
      fetchTrainings();
      setToast({
        title: 'Éxito',
        description: 'Entrenamiento eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting training:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el entrenamiento',
        type: 'error'
      });
    }
  };

  const handleShowAttendance = async (training: Training) => {
    if (!players[training.categoryId]) {
      await fetchPlayers(training.categoryId);
    }
    setAttendance(training.attendance || {});
    setShowAttendanceForm(training.id);
  };

  const handleUpdateAttendance = async (trainingId: string) => {
    if (!clubId) return;

    try {
      const trainingRef = doc(db, `clubs/${clubId}/trainings`, trainingId);
      await updateDoc(trainingRef, {
        attendance,
        updatedAt: new Date().toISOString(),
      });
      
      const training = trainings.find(t => t.id === trainingId);
      if (training) {
        await updateTrainingStatistics(clubId, {
          id: trainingId,
          ...training,
          attendance
        });
      }
      
      fetchTrainings();
      setShowAttendanceForm(null);
      setToast({
        title: 'Éxito',
        description: 'Asistencia actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating attendance:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la asistencia',
        type: 'error'
      });
    }
  };

  const filteredTrainings = trainings.filter(training => 
    selectedCategory === 'all' || training.categoryId === selectedCategory
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!permissions.canManageTrainings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para gestionar los entrenamientos del club. Esta sección está reservada para entrenadores y personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Entrenamientos</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            {showAddForm ? 'Cancelar' : 'Agregar Entrenamiento'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas por Categoría</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const stats = categoryStats[category.id] || { total: 0, averageAttendance: 0 };
              return (
                <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      Total de entrenamientos: {stats.total}
                    </p>
                    <p className="text-sm text-gray-600">
                      Asistencia promedio: {stats.averageAttendance}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTraining.date}
                      onChange={(e) => setNewTraining({ ...newTraining, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newTraining.time}
                      onChange={(e) => setNewTraining({ ...newTraining, time: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Lugar</Label>
                    <Input
                      id="location"
                      value={newTraining.location}
                      onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={newTraining.categoryId}
                      onValueChange={(value) => setNewTraining({ ...newTraining, categoryId: value })}
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
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newTraining.description}
                      onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="active">Activo</Label>
                    <Switch
                      id="active"
                      checked={newTraining.active}
                      onCheckedChange={(checked) => setNewTraining({ ...newTraining, active: checked })}
                    />
                  </div>

                  <div className="col-span-full">
                    <button
                      onClick={handleAddTraining}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Agregar Entrenamiento
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lugar
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
                    {filteredTrainings.map((training) => (
                      <tr key={training.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(training.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">{training.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{training.location}</div>
                          {training.description && (
                            <div className="text-sm text-gray-500">{training.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {categories.find(c => c.id === training.categoryId)?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            training.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {training.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {new Date(training.date) < new Date() && (
                              <button
                                onClick={() => handleShowAttendance(training)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTraining(training.id)}
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

              <div className="lg:hidden grid grid-cols-1 gap-4">
                {filteredTrainings.map((training) => (
                  <div key={training.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(training.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">{training.time}</div>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        training.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {training.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Lugar:</p>
                        <p className="text-sm font-medium">{training.location}</p>
                        {training.description && (
                          <p className="text-sm text-gray-500 mt-1">{training.description}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Categoría:</p>
                        <p className="text-sm font-medium">
                          {categories.find(c => c.id === training.categoryId)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t">
                      {new Date(training.date) < new Date() && (
                        <button
                          onClick={() => handleShowAttendance(training)}
                          className="p-2 text-blue-600 hover:text-blue-900"
                          title="Registrar asistencia"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTraining(training.id)}
                        className="p-2 text-red-600 hover:text-red-900"
                        title="Eliminar entrenamiento"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showAttendanceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-lg w-full p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Registro de Asistencia</h3>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {players[trainings.find(t => t.id === showAttendanceForm)?.categoryId || '']?.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{player.fullName}</span>
                        <Switch
                          checked={attendance[player.id] || false}
                          onCheckedChange={(checked) => setAttendance(prev => ({
                            ...prev,
                            [player.id]: checked
                          }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAttendanceForm(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => handleUpdateAttendance(showAttendanceForm)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Guardar Asistencia
                    </button>
                  </div>
                </div>
              </div>
            )}
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