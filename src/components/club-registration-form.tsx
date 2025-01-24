import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './ui/toast';
import { Phone, Mail, Building, User, Stethoscope, Trophy, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface League {
  id: string;
  name: string;
}

const clubSchema = z.object({
  clubName: z.string().min(2, 'El nombre del club es requerido'),
  address: z.string().min(5, 'La dirección es requerida'),
  phone1: z.string().min(9, 'Teléfono 1 es requerido'),
  phone2: z.string().min(9, 'Teléfono 2 es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  presidentName: z.string().min(2, 'El nombre del presidente es requerido'),
  medicalService: z.string().min(2, 'El servicio médico es requerido'),
  leagueId: z.string().min(1, 'La liga es requerida'),
});

type ClubFormData = z.infer<typeof clubSchema>;

export function ClubRegistrationForm() {
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const navigate = useNavigate();
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
  });

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const leaguesRef = collection(db, 'leagues');
        const querySnapshot = await getDocs(leaguesRef);
        const leaguesData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((league: any) => league.active) as League[];
        setLeagues(leaguesData);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      }
    };

    fetchLeagues();
  }, []);

  const onSubmit = async (data: ClubFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      const selectedLeague = leagues.find(l => l.id === data.leagueId);
      
      await setDoc(doc(db, 'clubs', userCredential.user.uid), {
        clubName: data.clubName,
        address: data.address,
        phone1: data.phone1,
        phone2: data.phone2,
        email: data.email,
        presidentName: data.presidentName,
        medicalService: data.medicalService,
        leagueId: data.leagueId,
        leagueName: selectedLeague?.name,
        createdAt: new Date().toISOString(),
      });

      setToast({
        title: '¡Registro exitoso!',
        description: 'El club ha sido registrado correctamente.',
        type: 'success',
      });

      setTimeout(() => {
        navigate('/superadmin/dashboard/clubs');
      }, 2000);
    } catch (error) {
      console.error('Error during registration:', error);
      setToast({
        title: 'Error',
        description: 'Ha ocurrido un error durante el registro.',
        type: 'error',
      });
    }
  };

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Building className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Registro de Club Deportivo</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="clubName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Nombre del Club
                  </Label>
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
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Dirección
                  </Label>
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
                  <Label htmlFor="phone1" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono 1
                  </Label>
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
                  <Label htmlFor="phone2" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Teléfono 2
                  </Label>
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
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="mt-1"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="presidentName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre del Presidente
                  </Label>
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
                  <Label htmlFor="medicalService" className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Servicio Médico
                  </Label>
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

              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Registrar Club
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