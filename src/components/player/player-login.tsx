import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserCircle, Lock } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const loginSchema = z.object({
  playerId: z.string().min(1, 'ID del jugador es requerido'),
  password: z.string().min(1, 'Contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function PlayerLogin() {
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleChangePassword = async () => {
    if (!newPassword) {
      setError('La nueva contraseña es requerida');
      return;
    }

    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, where('playerId', '==', currentPlayerId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Jugador no encontrado');
        return;
      }

      const playerDoc = querySnapshot.docs[0];
      
      await updateDoc(doc(db, 'players', playerDoc.id), {
        password: newPassword,
        firstLogin: false,
        updatedAt: new Date().toISOString()
      });

      sessionStorage.setItem('playerId', currentPlayerId);
      navigate('/player/dashboard');
    } catch (error) {
      console.error('Error updating password:', error);
      setError('No se pudo actualizar la contraseña');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, where('playerId', '==', data.playerId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Jugador no encontrado');
        return;
      }

      const playerDoc = querySnapshot.docs[0];
      const playerData = playerDoc.data();

      if (!playerData.active) {
        setError('Este jugador no está activo');
        return;
      }

      if (playerData.password !== data.password) {
        setError('Credenciales inválidas');
        return;
      }

      sessionStorage.setItem('playerId', data.playerId);

      if (playerData.firstLogin || data.password === data.playerId) {
        setCurrentPlayerId(data.playerId);
        setShowChangePassword(true);
      } else {
        navigate('/player/dashboard');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('Error al iniciar sesión');
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Cambiar Contraseña</h2>
              <p className="mt-2 text-sm text-gray-600">
                Por seguridad, debes cambiar tu contraseña en el primer inicio de sesión
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                  placeholder="********"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                onClick={handleChangePassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Guardar Nueva Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <UserCircle className="h-12 w-12 text-blue-600 mx-auto" />
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Portal del Jugador</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa con tu ID de jugador
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="playerId" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                ID del Jugador
              </Label>
              <Input
                id="playerId"
                {...register('playerId')}
                className="mt-1"
                placeholder="Ingresa tu ID"
              />
              {errors.playerId && (
                <p className="mt-1 text-sm text-red-600">{errors.playerId.message}</p>
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
                placeholder="********"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}