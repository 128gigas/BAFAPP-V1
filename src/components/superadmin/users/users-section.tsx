import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Users, Plus, Trash2, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { AdminUser, DEFAULT_ADMIN_PERMISSIONS } from '@/lib/models/admin';

interface Club {
  id: string;
  clubName: string;
}

interface AdminUserWithClub extends AdminUser {
  id: string;
  clubId: string;
  clubName: string;
}

export function UsersSection() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserWithClub[]>([]);
  const [newUser, setNewUser] = useState({
    email: '',
    clubId: ''
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch clubs
      const clubsRef = collection(db, 'clubs');
      const clubsSnap = await getDocs(clubsRef);
      const clubsData = clubsSnap.docs.map(doc => ({
        id: doc.id,
        clubName: doc.data().clubName
      }));
      setClubs(clubsData);

      // Fetch admin users for each club
      const allAdminUsers: AdminUserWithClub[] = [];
      for (const club of clubsData) {
        const adminUsersRef = collection(db, `clubs/${club.id}/adminUsers`);
        const adminUsersSnap = await getDocs(adminUsersRef);
        adminUsersSnap.docs.forEach(doc => {
          allAdminUsers.push({
            id: doc.id,
            clubId: club.id,
            clubName: club.clubName,
            ...doc.data()
          } as AdminUserWithClub);
        });
      }

      setAdminUsers(allAdminUsers);
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

  const handleAddUser = async () => {
    if (!newUser.email.trim() || !newUser.clubId) {
      setToast({
        title: 'Error',
        description: 'El email y el club son requeridos',
        type: 'error'
      });
      return;
    }

    try {
      // Verificar si el usuario ya existe como admin
      const existingAdmin = adminUsers.find(admin => admin.email === newUser.email);
      if (existingAdmin) {
        setToast({
          title: 'Error',
          description: 'Este usuario ya es administrador de un club',
          type: 'error'
        });
        return;
      }

      // Crear el usuario en Firebase Auth
      try {
        await createUserWithEmailAndPassword(auth, newUser.email, 'password');
      } catch (authError: any) {
        // Si el usuario ya existe en Auth, eso está bien - solo agregaremos permisos de admin
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError;
        }
      }

      // Crear el documento de admin user
      const adminUserRef = doc(db, `clubs/${newUser.clubId}/adminUsers`, newUser.email);
      const adminData: AdminUser = {
        email: newUser.email,
        firstLogin: true,
        permissions: DEFAULT_ADMIN_PERMISSIONS,
        createdAt: new Date().toISOString()
      };

      await setDoc(adminUserRef, adminData);

      setNewUser({ email: '', clubId: '' });
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Usuario administrador agregado correctamente. La contraseña inicial es "password"',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding admin user:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el usuario administrador',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (email: string, clubId: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este usuario administrador?')) return;

    try {
      const adminUserRef = doc(db, `clubs/${clubId}/adminUsers`, email);
      await deleteDoc(adminUserRef);
      
      fetchData();
      setToast({
        title: 'Éxito',
        description: 'Usuario administrador eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting admin user:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario administrador',
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
          <h2 className="text-2xl font-bold text-gray-900">Usuarios Administradores</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para agregar nuevo usuario */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-end">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="club">Club</Label>
                <Select
                  value={newUser.clubId}
                  onValueChange={(value) => setNewUser({ ...newUser, clubId: value })}
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
                <button
                  onClick={handleAddUser}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Usuario
                </button>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Club
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
                  {adminUsers.map((user) => (
                    <tr key={`${user.clubId}-${user.email}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{user.clubName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.firstLogin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.firstLogin ? 'Pendiente primer inicio' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.email, user.clubId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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