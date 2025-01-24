import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';

const clubSchema = z.object({
  clubName: z.string().min(2, 'El nombre del club es requerido'),
  address: z.string().min(5, 'La dirección es requerida'),
  phone1: z.string().min(9, 'Teléfono 1 es requerido'),
  phone2: z.string().min(9, 'Teléfono 2 es requerido'),
  presidentName: z.string().min(2, 'El nombre del presidente es requerido'),
  medicalService: z.string().min(2, 'El servicio médico es requerido'),
});

type ClubFormData = z.infer<typeof clubSchema>;

export function ClubEdit() {
  const { permissions } = useClubAuth();
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
  });

  if (!permissions.canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para modificar la configuración del club. Esta sección está reservada para administradores.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchClubData = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'clubs', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          reset(data as ClubFormData);
          setPhotoUrl(data.photoUrl || '');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching club:', error);
        setLoading(false);
      }
    };

    fetchClubData();
  }, [reset]);

  const onSubmit = async (data: ClubFormData) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'clubs', auth.currentUser.uid), {
        ...data,
        photoUrl,
        updatedAt: new Date().toISOString(),
      });
      
      setToast({
        title: 'Éxito',
        description: 'Información actualizada correctamente',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/club/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating club:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la información',
        type: 'error',
      });
    }
  };

  const handlePhotoChange = (base64: string) => {
    setPhotoUrl(base64);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/club/dashboard')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Editar Información del Club</h2>
            </div>

            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Foto del Club */}
                  <div className="col-span-full">
                    <Label>Foto del Club</Label>
                    <div className="mt-2">
                      <PhotoUpload
                        onFileSelect={handlePhotoChange}
                        currentPhotoUrl={photoUrl}
                        onRemovePhoto={() => setPhotoUrl('')}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Sube una foto que represente a tu club. Esta foto será visible en tu perfil y publicaciones.
                    </p>
                  </div>

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
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate('/club/dashboard')}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
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