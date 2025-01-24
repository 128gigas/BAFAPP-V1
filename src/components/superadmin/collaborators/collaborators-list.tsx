import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Users } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collaboratorService } from '@/lib/services/collaborator-service';
import { Collaborator, CollaboratorRole, ROLE_LABELS } from '@/lib/models/collaborator';
import { collaboratorSchema } from '@/lib/models/collaborator';
import { db } from '@/lib/firebase';
import { collection, getDocs } from '@/lib/firebase';

interface Club {
  id: string;
  clubName: string;
}

export function CollaboratorsList() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newCollaborator, setNewCollaborator] = useState({
    email: '',
    clubId: '',
    role: CollaboratorRole.READ_ONLY,
    firstName: '',
    lastName: '',
    active: true
  });
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const [initialPassword, setInitialPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collaborators
      const collaboratorsData = await collaboratorService.getAllCollaborators();
      setCollaborators(collaboratorsData);

      // Fetch clubs
      const clubsRef = collection(db, 'clubs');
      const clubsSnap = await getDocs(clubsRef);
      const clubsData = clubsSnap.docs.map(doc => ({
        id: doc.id,
        clubName: doc.data().clubName
      }));
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

  const handleAddCollaborator = async () => {
    if (!initialPassword) {
      setToast({
        title: 'Error',
        description: 'La contraseña inicial es requerida',
        type: 'error'
      });
      return;
    }

    try {
      const validatedData = collaboratorSchema.parse(newCollaborator);
      await collaboratorService.createCollaborator(validatedData, initialPassword);
      
      setNewCollaborator({
        email: '',
        clubId: '',
        role: CollaboratorRole.READ_ONLY,
        firstName: '',
        lastName: '',
        active: true
      });
      setInitialPassword('');
      
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Colaborador agregado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo agregar el colaborador',
        type: 'error'
      });
    }
  };

  const handleUpdateCollaborator = async (id: string, updatedData: Partial<Collaborator>) => {
    try {
      await collaboratorService.updateCollaborator(id, updatedData);
      setEditingCollaborator(null);
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Colaborador actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating collaborator:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el colaborador',
        type: 'error'
      });
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este colaborador?')) return;

    try {
      await collaboratorService.deleteCollaborator(id);
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Colaborador eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el colaborador',
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
          <Users className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Colaboradores de Clubes</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nuevo colaborador */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={newCollaborator.firstName}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, firstName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={newCollaborator.lastName}
                  onChange={(e) => setNewCollaborator({ ...newCollaborator, lastName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="club">Club</Label>
                <Select
                  value={newCollaborator.clubId}
                  onValueChange={(value) => setNewCollaborator({ ...newCollaborator, clubId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un club" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.clubName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newCollaborator.role}
                  onValueChange={(value) => setNewCollaborator({ ...newCollaborator, role: value as CollaboratorRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="initialPassword">Contraseña Inicial</Label>
                <Input
                  id="initialPassword"
                  type="password"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  className="mt-1"
                  placeholder="Contraseña inicial"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={newCollaborator.active}
                  onCheckedChange={(checked) => setNewCollaborator({ ...newCollaborator, active: checked })}
                />
              </div>

              <div className="col-span-full">
                <button
                  onClick={handleAddCollaborator}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Colaborador
                </button>
              </div>
            </div>

            {/* Lista de colaboradores */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Club
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
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
                  {collaborators.map((collaborator) => (
                    <tr key={collaborator.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCollaborator?.id === collaborator.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editingCollaborator.firstName}
                              onChange={(e) => setEditingCollaborator({
                                ...editingCollaborator,
                                firstName: e.target.value
                              })}
                            />
                            <Input
                              value={editingCollaborator.lastName}
                              onChange={(e) => setEditingCollaborator({
                                ...editingCollaborator,
                                lastName: e.target.value
                              })}
                            />
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {collaborator.firstName} {collaborator.lastName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{collaborator.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCollaborator?.id === collaborator.id ? (
                          <Select
                            value={editingCollaborator.clubId}
                            onValueChange={(value) => setEditingCollaborator({
                              ...editingCollaborator,
                              clubId: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un club" />
                            </SelectTrigger>
                            <SelectContent>
                              {clubs.map((club) => (
                                <SelectItem key={club.id} value={club.id}>
                                  {club.clubName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {clubs.find(c => c.id === collaborator.clubId)?.clubName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCollaborator?.id === collaborator.id ? (
                          <Select
                            value={editingCollaborator.role}
                            onValueChange={(value) => setEditingCollaborator({
                              ...editingCollaborator,
                              role: value as CollaboratorRole
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                <SelectItem key={role} value={role}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-gray-900">
                            {ROLE_LABELS[collaborator.role]}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCollaborator?.id === collaborator.id ? (
                          <Switch
                            checked={editingCollaborator.active}
                            onCheckedChange={(checked) => setEditingCollaborator({
                              ...editingCollaborator,
                              active: checked
                            })}
                          />
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            collaborator.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {collaborator.active ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingCollaborator?.id === collaborator.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateCollaborator(collaborator.id, editingCollaborator)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setEditingCollaborator(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCollaborator(collaborator)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCollaborator(collaborator.id)}
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