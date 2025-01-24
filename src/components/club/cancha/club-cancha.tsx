import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CanchaFeed } from '../../shared/cancha/cancha-feed';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Edit } from 'lucide-react';
import { useClubAuth } from '@/hooks/use-club-auth';

export function ClubCancha() {
  const { clubId } = useClubAuth();
  const [clubData, setClubData] = useState<{ photoUrl?: string; canchaHeaderUrl?: string }>({});
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchClubData = async () => {
      if (!clubId) return;
      
      try {
        const clubRef = doc(db, 'clubs', clubId);
        const clubDoc = await getDoc(clubRef);
        if (clubDoc.exists()) {
          const data = clubDoc.data();
          setClubData({
            photoUrl: data.photoUrl || '',
            canchaHeaderUrl: data.canchaHeaderUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching club data:', error);
        setToast({
          title: 'Error',
          description: 'No se pudo cargar la información del club',
          type: 'error'
        });
      }
    };

    fetchClubData();
  }, [clubId]);

  const handleUpdateBanner = async (base64: string) => {
    if (!clubId) return;

    try {
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        canchaHeaderUrl: base64,
        updatedAt: new Date().toISOString()
      });
      
      setClubData(prev => ({ ...prev, canchaHeaderUrl: base64 }));
      setIsEditingBanner(false);
      setToast({
        title: 'Éxito',
        description: 'Banner actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el banner',
        type: 'error'
      });
    }
  };

  if (!clubId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Debes iniciar sesión para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        {/* Banner Section */}
        <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden">
          {/* Banner Background */}
          <div className="absolute inset-0">
            {clubData.canchaHeaderUrl ? (
              <img
                src={clubData.canchaHeaderUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <p className="text-white text-lg">Agrega una imagen de banner</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsEditingBanner(true)}
            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <Edit className="h-5 w-5" />
          </button>

          {/* Club Logo Container - Centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full shadow-xl p-2">
              {clubData.photoUrl ? (
                <img
                  src={clubData.photoUrl}
                  alt="Club Logo"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl text-white">⚽️</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="mt-20">
          <CanchaFeed clubId={clubId} isAdmin={true} />
        </div>

        {/* Banner Edit Modal */}
        {isEditingBanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actualizar Banner</h3>
              <PhotoUpload
                onFileSelect={handleUpdateBanner}
                currentPhotoUrl={clubData.canchaHeaderUrl}
                onRemovePhoto={() => handleUpdateBanner('')}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsEditingBanner(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        )}
        <ToastViewport />
      </div>
    </ToastProvider>
  );
}