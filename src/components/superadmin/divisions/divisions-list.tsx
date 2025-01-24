import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Layers } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Division {
  id: string;
  name: string;
  description: string;
  active: boolean;
  leagueId: string;
}

interface League {
  id: string;
  name: string;
  active: boolean;
}

export function DivisionsList() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [newDivision, setNewDivision] = useState({ 
    name: '', 
    description: '', 
    active: true,
    leagueId: ''
  });
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDivisions();
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const leaguesRef = collection(db, 'leagues');
      const querySnapshot = await getDocs(leaguesRef);
      const leaguesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as League[];
      setLeagues(leaguesData.filter(league => league.active));
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const divisionsRef = collection(db, 'divisions');
      const querySnapshot = await getDocs(divisionsRef);
      const divisionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Division[];
      setDivisions(divisionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching divisions:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las divisiones',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddDivision = async () => {
    if (!newDivision.name.trim() || !newDivision.leagueId) {
      setToast({
        title: 'Error',
        description: 'El nombre y la liga son requeridos',
        type: 'error'
      });
      return;
    }

    try {
      const divisionsRef = collection(db, 'divisions');
      await addDoc(divisionsRef, {
        name: newDivision.name.trim(),
        description: newDivision.description.trim(),
        active: newDivision.active,
        leagueId: newDivision.leagueId,
        createdAt: new Date().toISOString(),
      });

      setNewDivision({ name: '', description: '', active: true, leagueId: '' });
      fetchDivisions();
      setToast({
        title: 'Éxito',
        description: 'División agregada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding division:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar la división',
        type: 'error'
      });
    }
  };

  const handleUpdateDivision = async (divisionId: string, updatedDivision: Division) => {
    if (!updatedDivision.leagueId) {
      setToast({
        title: 'Error',
        description: 'La liga es requerida',
        type: 'error'
      });
      return;
    }

    try {
      const divisionRef = doc(db, 'divisions', divisionId);
      await updateDoc(divisionRef, {
        name: updatedDivision.name.trim(),
        description: updatedDivision.description.trim(),
        active: updatedDivision.active,
        leagueId: updatedDivision.leagueId,
        updatedAt: new Date().toISOString(),
      });

      setEditingDivision(null);
      fetchDivisions();
      setToast({
        title: 'Éxito',
        description: 'División actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating division:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la división',
        type: 'error'
      });
    }
  };

  const handleDeleteDivision = async (divisionId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta división?')) return;

    try {
      const divisionRef = doc(db, 'divisions', divisionId);
      await deleteDoc(divisionRef);
      
      fetchDivisions();
      setToast({
        title: 'Éxito',
        description: 'División eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting division:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la división',
        type: 'error'
      });
    }
  };

  const getLeagueName = (leagueId: string) => {
    return leagues.find(league => league.id === leagueId)?.name || 'Liga no encontrada';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Layers className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Divisiones</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nueva división */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
              <div>
                <Label htmlFor="name">Nombre de la División</Label>
                <Input
                  id="name"
                  value={newDivision.name}
                  onChange={(e) => setNewDivision({ ...newDivision, name: e.target.value })}
                  placeholder="Ej: Primera División"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newDivision.description}
                  onChange={(e) => setNewDivision({ ...newDivision, description: e.target.value })}
                  placeholder="Descripción de la división"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="league">Liga</Label>
                <Select
                  value={newDivision.leagueId}
                  onValueChange={(value) => setNewDivision({ ...newDivision, leagueId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione una liga" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagues.map((league) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activa</Label>
                <Switch
                  id="active"
                  checked={newDivision.active}
                  onCheckedChange={(checked) => setNewDivision({ ...newDivision, active: checked })}
                />
              </div>
              <div>
                <button
                  onClick={handleAddDivision}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar División
                </button>
              </div>
            </div>

            {/* Lista de divisiones */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liga
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
                  {divisions.map((division) => (
                    <tr key={division.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingDivision?.id === division.id ? (
                          <Input
                            value={editingDivision.name}
                            onChange={(e) => setEditingDivision({ ...editingDivision, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{division.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingDivision?.id === division.id ? (
                          <Input
                            value={editingDivision.description}
                            onChange={(e) => setEditingDivision({ ...editingDivision, description: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{division.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingDivision?.id === division.id ? (
                          <Select
                            value={editingDivision.leagueId}
                            onValueChange={(value) => setEditingDivision({ ...editingDivision, leagueId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una liga" />
                            </SelectTrigger>
                            <SelectContent>
                              {leagues.map((league) => (
                                <SelectItem key={league.id} value={league.id}>
                                  {league.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-gray-900">{getLeagueName(division.leagueId)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingDivision?.id === division.id ? (
                          <Switch
                            checked={editingDivision.active}
                            onCheckedChange={(checked) => setEditingDivision({ ...editingDivision, active: checked })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            division.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {division.active ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingDivision?.id === division.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateDivision(division.id, editingDivision)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingDivision(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingDivision(division)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDivision(division.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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