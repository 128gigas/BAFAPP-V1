import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Check, X, Gamepad } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Position {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function PositionsList() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState({ name: '', description: '', active: true });
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const positionsRef = collection(db, 'positions');
      const querySnapshot = await getDocs(positionsRef);
      const positionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Position[];
      setPositions(positionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las posiciones',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddPosition = async () => {
    if (!newPosition.name.trim()) return;

    try {
      const positionsRef = collection(db, 'positions');
      await addDoc(positionsRef, {
        name: newPosition.name.trim(),
        description: newPosition.description.trim(),
        active: newPosition.active,
        createdAt: new Date().toISOString(),
      });

      setNewPosition({ name: '', description: '', active: true });
      fetchPositions();
      setToast({
        title: 'Éxito',
        description: 'Posición agregada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding position:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar la posición',
        type: 'error'
      });
    }
  };

  const handleUpdatePosition = async (positionId: string, updatedPosition: Position) => {
    try {
      const positionRef = doc(db, 'positions', positionId);
      await updateDoc(positionRef, {
        name: updatedPosition.name.trim(),
        description: updatedPosition.description.trim(),
        active: updatedPosition.active,
        updatedAt: new Date().toISOString(),
      });

      setEditingPosition(null);
      fetchPositions();
      setToast({
        title: 'Éxito',
        description: 'Posición actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating position:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la posición',
        type: 'error'
      });
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta posición?')) return;

    try {
      const positionRef = doc(db, 'positions', positionId);
      await deleteDoc(positionRef);
      
      fetchPositions();
      setToast({
        title: 'Éxito',
        description: 'Posición eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting position:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la posición',
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
          <Gamepad className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Posiciones</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nueva posición */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="name">Nombre de la Posición</Label>
                <Input
                  id="name"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  placeholder="Ej: Delantero Centro"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newPosition.description}
                  onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                  placeholder="Descripción de la posición"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activa</Label>
                <Switch
                  id="active"
                  checked={newPosition.active}
                  onCheckedChange={(checked) => setNewPosition({ ...newPosition, active: checked })}
                />
              </div>
              <div>
                <button
                  onClick={handleAddPosition}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Posición
                </button>
              </div>
            </div>

            {/* Lista de posiciones */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
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
                  {positions.map((position) => (
                    <tr key={position.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPosition?.id === position.id ? (
                          <Input
                            value={editingPosition.name}
                            onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{position.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingPosition?.id === position.id ? (
                          <Input
                            value={editingPosition.description}
                            onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{position.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPosition?.id === position.id ? (
                          <Switch
                            checked={editingPosition.active}
                            onCheckedChange={(checked) => setEditingPosition({ ...editingPosition, active: checked })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            position.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {position.active ? 'Activa' : 'Inactiva'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingPosition?.id === position.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdatePosition(position.id, editingPosition)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingPosition(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingPosition(position)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(position.id)}
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