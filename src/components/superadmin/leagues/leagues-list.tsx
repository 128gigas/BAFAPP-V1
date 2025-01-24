import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Trophy } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface League {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function LeaguesList() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [newLeague, setNewLeague] = useState({ name: '', description: '', active: true });
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const leaguesRef = collection(db, 'leagues');
      const querySnapshot = await getDocs(leaguesRef);
      const leaguesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as League[];
      setLeagues(leaguesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las ligas',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddLeague = async () => {
    if (!newLeague.name.trim()) return;

    try {
      const leaguesRef = collection(db, 'leagues');
      await addDoc(leaguesRef, {
        name: newLeague.name.trim(),
        description: newLeague.description.trim(),
        active: newLeague.active,
        createdAt: new Date().toISOString(),
      });

      setNewLeague({ name: '', description: '', active: true });
      fetchLeagues();
      setToast({
        title: 'Éxito',
        description: 'Liga agregada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding league:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar la liga',
        type: 'error'
      });
    }
  };

  const handleUpdateLeague = async (leagueId: string, updatedLeague: League) => {
    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      await updateDoc(leagueRef, {
        name: updatedLeague.name.trim(),
        description: updatedLeague.description.trim(),
        active: updatedLeague.active,
        updatedAt: new Date().toISOString(),
      });

      setEditingLeague(null);
      fetchLeagues();
      setToast({
        title: 'Éxito',
        description: 'Liga actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating league:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la liga',
        type: 'error'
      });
    }
  };

  const handleDeleteLeague = async (leagueId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta liga?')) return;

    try {
      const leagueRef = doc(db, 'leagues', leagueId);
      await deleteDoc(leagueRef);
      
      fetchLeagues();
      setToast({
        title: 'Éxito',
        description: 'Liga eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting league:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la liga',
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
          <Trophy className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Ligas</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nueva liga */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newLeague.name}
                  onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                  placeholder="Nombre de la liga"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newLeague.description}
                  onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
                  placeholder="Descripción de la liga"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activa</Label>
                <Switch
                  id="active"
                  checked={newLeague.active}
                  onCheckedChange={(checked) => setNewLeague({ ...newLeague, active: checked })}
                />
              </div>
              <div>
                <button
                  onClick={handleAddLeague}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Liga
                </button>
              </div>
            </div>

            {/* Lista de ligas */}
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
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leagues.map((league) => (
                    <tr key={league.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingLeague?.id === league.id ? (
                          <Input
                            value={editingLeague.name}
                            onChange={(e) => setEditingLeague({ ...editingLeague, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{league.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingLeague?.id === league.id ? (
                          <Input
                            value={editingLeague.description}
                            onChange={(e) => setEditingLeague({ ...editingLeague, description: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{league.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingLeague?.id === league.id ? (
                          <Switch
                            checked={editingLeague.active}
                            onCheckedChange={(checked) => setEditingLeague({ ...editingLeague, active: checked })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            league.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {league.active ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingLeague?.id === league.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateLeague(league.id, editingLeague)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingLeague(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingLeague(league)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLeague(league.id)}
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