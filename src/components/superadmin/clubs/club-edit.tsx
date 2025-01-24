import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trophy, Plus, Trash2 } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface League {
  id: string;
  name: string;
}

interface AdminUser {
  email: string;
  firstLogin: boolean;
  createdAt: string;
}

const clubSchema = z.object({
  clubName: z.string().min(2, 'El nombre del club es requerido'),
  address: z.string().min(5, 'La dirección es requerida'),
  phone1: z.string().min(9, 'Teléfono 1 es requerido'),
  phone2: z.string().min(9, 'Teléfono 2 es requerido'),
  presidentName: z.string().min(2, 'El nombre del presidente es requerido'),
  medicalService: z.string().min(2, 'El servicio médico es requerido'),
  leagueId: z.string().min(1, 'La liga es requerida'),
});

type ClubFormData = z.infer<typeof clubSchema>;

export function ClubEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        // Fetch club data
        const docRef = doc(db, 'clubs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          reset(docSnap.data() as ClubFormData);
        }

        // Fetch leagues
        const leaguesRef = collection(db, 'leagues');
        const querySnapshot = await getDocs(leaguesRef);
        const leaguesData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((league: any) => league.active) as League[];
        setLeagues(leaguesData);

        // Fetch admin users
        const adminUsersRef = collection(db, `clubs/${id}/adminUsers`);
        const adminUsersSnap = await getDocs(adminUsersRef);
        const adminUsersData = adminUsersSnap.docs.map(doc => ({
          email: doc.id,
          ...doc.data()
        })) as AdminUser[];
        setAdminUsers(adminUsersData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  const onSubmit = async (data: ClubFormData) => {
    if (!id) return;
    try {
      const selectedLeague = leagues.find(l => l.id === data.leagueId);
      
      await updateDoc(doc(db, 'clubs', id), {
        ...data,
        leagueName: selectedLeague?.name,
        updatedAt: new Date().toISOString(),
      });
      
      setToast({
        title: 'Éxito',
        description: 'Club actualizado correctamente',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/superadmin/dashboard/clubs');
      }, 2000);
    } catch (error) {
      console.error('Error updating club:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el club',
        type: 'error',
      });
    }
  };

  const handleAddAdminUser = async () => {
    if (!id || !newAdminEmail.trim()) return;

    try {
      // Validar formato de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminEmail)) {
        setToast({
          title: 'Error',
          description: 'El formato del email no es válido',
          type: 'error'
        });
        return;
      }

      // Verificar si el usuario ya existe
      if (adminUsers.some(user => user.email === newAdminEmail)) {
        setToast({
          title: 'Error',
          description: 'Este usuario ya es administrador',
          type: 'error'
        });
        return;
      }

      // Get club data to copy permissions
      const clubRef = doc(db, 'clubs', id);
      const clubDoc = await getDoc(clubRef);
      if (!clubDoc.exists()) {
        throw new Error('Club not found');
      }

      try {
        // Create the user in Firebase Auth with default password
        await createUserWithEmailAndPassword(auth, newAdminEmail, 'password');
      } catch (authError: any) {
        // If user already exists in Auth, that's fine - we'll just add admin rights
        if (authError.code !== 'auth/email-already-in-use') {
          throw authError;
        }
      }

      // Create the admin user document with same permissions as club
      const adminUserRef = doc(db, `clubs/${id}/adminUsers`, newAdminEmail);
      await setDoc(adminUserRef, {
        email: newAdminEmail,
        firstLogin: true, // Force password change on first login
        createdAt: new Date().toISOString(),
        permissions: {
          manageTeam: true,
          manageCategories: true,
          manageCoaches: true,
          manageTrainings: true,
          manageMatches: true,
          manageStatistics: true,
          manageNotifications: true,
          managePayments: true
        }
      });

      // Update local state
      setAdminUsers([...adminUsers, {
        email: newAdminEmail,
        firstLogin: true,
        createdAt: new Date().toISOString()
      }]);

      setNewAdminEmail('');
      setToast({
        title: 'Éxito',
        description: 'Usuario administrador agregado correctamente. La contraseña inicial es "password"',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding admin user:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo agregar el usuario administrador. Por favor, intente nuevamente.',
        type: 'error'
      });
    }
  };

  const handleRemoveAdminUser = async (email: string) => {
    if (!id || !window.confirm('¿Está seguro de que desea eliminar este usuario administrador?')) return;

    try {
      // Get reference to admin user document
      const adminUserRef = doc(db, `clubs/${id}/adminUsers`, email);

      // Check if document exists before deleting
      const adminUserDoc = await getDoc(adminUserRef);
      if (!adminUserDoc.exists()) {
        setToast({
          title: 'Error',
          description: 'El usuario administrador no existe',
          type: 'error'
        });
        return;
      }

      // Delete the document
      await deleteDoc(adminUserRef);

      // Update local state
      setAdminUsers(adminUsers.filter(user => user.email !== email));
      
      setToast({
        title: 'Éxito',
        description: 'Usuario administrador eliminado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error removing admin user:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario administrador. Por favor, intente nuevamente.',
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
          <Link
            to="/superadmin/dashboard/clubs"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Editar Club</h2>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="clubName">Nombre del Club</Label>
                  <Input
                    id="clubName"
                    {...register('clubName')}
                    className="mt-1"
                  />
                  {errors.clubName && (
                    <p className="mt-1 text-sm text-red-600">{errors.clubName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    className="mt-1"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone1">Teléfono 1</Label>
                  <Input
                    id="phone1"
                    {...register('phone1')}
                    className="mt-1"
                  />
                  {errors.phone1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone1.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone2">Teléfono 2</Label>
                  <Input
                    id="phone2"
                    {...register('phone2')}
                    className="mt-1"
                  />
                  {errors.phone2 && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone2.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="presidentName">Nombre del Presidente</Label>
                  <Input
                    id="presidentName"
                    {...register('presidentName')}
                    className="mt-1"
                  />
                  {errors.presidentName && (
                    <p className="mt-1 text-sm text-red-600">{errors.presidentName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="medicalService">Servicio Médico</Label>
                  <Input
                    id="medicalService"
                    {...register('medicalService')}
                    className="mt-1"
                  />
                  {errors.medicalService && (
                    <p className="mt-1 text-sm text-red-600">{errors.medicalService.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="league" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Liga
                  </Label>
                  <Controller
                    name="leagueId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    )}
                  />
                  {errors.leagueId && (
                    <p className="mt-1 text-sm text-red-600">{errors.leagueId.message}</p>
                  )}
                </div>
              </div>

              {/* Sección de Usuarios Administradores */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usuarios Administradores</h3>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Correo electrónico del nuevo administrador"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdminUser}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  {adminUsers.length > 0 ? (
                    <div className="space-y-2">
                      {adminUsers.map((user) => (
                        <div
                          key={user.email}
                          className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                        >
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              {user.firstLogin ? 'Pendiente primer inicio de sesión' : 'Activo'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdminUser(user.email)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay usuarios administradores registrados
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to="/superadmin/dashboard/clubs"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
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