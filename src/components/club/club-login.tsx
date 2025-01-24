import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserCircle, Lock } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function ClubLogin() {
  const [error, setError] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [currentClubId, setCurrentClubId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleChangePassword = async () => {
    if (!newPassword || !currentEmail || !currentClubId) {
      setError('Datos incompletos para el cambio de contraseña');
      return;
    }

    try {
      // Update password in Firebase Auth
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado');
      }
      
      // Update firstLogin flag in admin user document
      const adminUserRef = doc(db, `clubs/${currentClubId}/adminUsers/${currentEmail}`);
      await updateDoc(adminUserRef, {
        firstLogin: false,
        updatedAt: new Date().toISOString()
      });

      navigate('/club/dashboard');
    } catch (error: any) {
      console.error('Error updating password:', error);
      let errorMessage = 'No se pudo actualizar la contraseña';
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por favor, cierre sesión y vuelva a iniciar sesión para cambiar su contraseña';
      }
      
      setError(errorMessage);
    }
  };

  const handleLoginError = (error: any) => {
    console.error('Auth error:', error);
    let errorMessage = 'Error al iniciar sesión. Por favor, intente nuevamente más tarde.';

    switch (error.code) {
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Por favor, espere unos minutos antes de intentar nuevamente.';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales incorrectas. Por favor, verifique su email y contraseña.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del email no es válido.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta.';
        break;
    }

    setError(errorMessage);
  };

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      // First check if it's a collaborator
      const collaboratorsRef = collection(db, 'clubCollaborators');
      const collaboratorQuery = query(collaboratorsRef, where('email', '==', data.email));
      const collaboratorSnap = await getDocs(collaboratorQuery);
      
      if (!collaboratorSnap.empty) {
        const collaboratorDoc = collaboratorSnap.docs[0];
        const collaboratorData = collaboratorDoc.data();
        
        try {
          await signInWithEmailAndPassword(auth, data.email, data.password);
          if (data.password === 'password') {
            setCurrentEmail(data.email);
            setCurrentClubId(collaboratorData.clubId);
            setShowChangePassword(true);
          } else {
            navigate('/club/dashboard');
          }
          return;
        } catch (authError) {
          handleLoginError(authError);
          return;
        }
      }

      // If not a collaborator, check if it's an admin user
      const clubsRef = collection(db, 'clubs');
      const clubsSnap = await getDocs(clubsRef);
      
      for (const clubDoc of clubsSnap.docs) {
        const adminUserRef = doc(db, `clubs/${clubDoc.id}/adminUsers/${data.email}`);
        const adminUserSnap = await getDoc(adminUserRef);
        
        if (adminUserSnap.exists()) {
          try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            
            if (data.password === 'password' && adminUserSnap.data().firstLogin) {
              setCurrentEmail(data.email);
              setCurrentClubId(clubDoc.id);
              setShowChangePassword(true);
            } else {
              navigate('/club/dashboard');
            }
            return;
          } catch (authError) {
            handleLoginError(authError);
            return;
          }
        }
      }

      // If not a collaborator or admin, check if it's a club
      const clubsQuery = query(clubsRef, where('email', '==', data.email));
      const clubsQuerySnap = await getDocs(clubsQuery);
      
      if (!clubsQuerySnap.empty) {
        try {
          await signInWithEmailAndPassword(auth, data.email, data.password);
          navigate('/club/dashboard');
        } catch (authError) {
          handleLoginError(authError);
        }
      } else {
        setError('No se encontró ningún club, administrador o colaborador con este email.');
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      handleLoginError(error);
    } finally {
      setIsSubmitting(false);
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
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Portal del Club</h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingrese sus credenciales para acceder
            </p>
          </div>

          <form onSubmit={handleSubmitLogin(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...registerLogin('email')}
                className="mt-1"
                placeholder="club@ejemplo.com"
                disabled={isSubmitting}
              />
              {loginErrors.email && (
                <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
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
                {...registerLogin('password')}
                className="mt-1"
                placeholder="********"
                disabled={isSubmitting}
              />
              {loginErrors.password && (
                <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}