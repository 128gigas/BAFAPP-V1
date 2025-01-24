import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Trophy } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Tournament {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function TournamentsList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newTournament, setNewTournament] = useState({ name: '', description: '', active: true });
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const tournamentsRef = collection(db, 'tournaments');
      const querySnapshot = await getDocs(tournamentsRef);
      const tournamentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tournament[];
      setTournaments(tournamentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los torneos',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddTournament = async () => {
    if (!newTournament.name.trim()) return;

    try {
      const tournamentsRef = collection(db, 'tournaments');
      await addDoc(tournamentsRef, {
        name: newTournament.name.trim(),
        description: newTournament.description.trim(),
        active: newTournament.active,
        createdAt: new Date().toISOString(),
      });

      setNewTournament({ name: '', description: '', active: true });
      fetchTournaments();
      setToast({
        title: 'Éxito',
        description: 'Torneo agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding tournament:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el torneo',
        type: 'error'
      });
    }
  };

  const handleUpdateTournament = async (tournamentId: string, updatedTournament: Tournament) => {
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tournamentRef, {
        name: updatedTournament.name.trim(),
        description: updatedTournament.description.trim(),
        active: updatedTournament.active,
        updatedAt: new Date().toISOString(),
      });

      setEditingTournament(null);
      fetchTournaments();
      setToast({
        title: 'Éxito',
        description: 'Torneo actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el torneo',
        type: 'error'
      });
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este torneo?')) return;

    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      await deleteDoc(tournamentRef);
      
      fetchTournaments();
      setToast({
        title: 'Éxito',
        description: 'Torneo eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting tournament:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el torneo',
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
          <h2 className="text-2xl font-bold text-gray-900">Torneos</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nuevo torneo */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  placeholder="Nombre del torneo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  placeholder="Descripción del torneo"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={newTournament.active}
                  onCheckedChange={(checked) => setNewTournament({ ...newTournament, active: checked })}
                />
              </div>
              <div>
                <button
                  onClick={handleAddTournament}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Torneo
                </button>
              </div>
            </div>

            {/* Lista de torneos */}
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
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingTournament?.id === tournament.id ? (
                          <Input
                            value={editingTournament.name}
                            onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{tournament.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingTournament?.id === tournament.id ? (
                          <Input
                            value={editingTournament.description}
                            onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{tournament.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingTournament?.id === tournament.id ? (
                          <Switch
                            checked={editingTournament.active}
                            onCheckedChange={(checked) => setEditingTournament({ ...editingTournament, active: checked })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tournament.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tournament.active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingTournament?.id === tournament.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateTournament(tournament.id, editingTournament)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingTournament(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingTournament(tournament)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTournament(tournament.id)}
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