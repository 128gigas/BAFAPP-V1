import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerLayout } from './player-layout';
import { PlayerStatisticsPanel } from './statistics/player-statistics-panel';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface PlayerData {
  id: string;
  clubId: string;
  fullName: string;
  categoryId: string;
  photoUrl?: string;
  bannerUrl?: string;
}

export function PlayerDashboard() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      try {
        // Find the club that has this player
        const clubsRef = collection(db, 'clubs');
        const clubs = await getDocs(clubsRef);
        
        for (const clubDoc of clubs.docs) {
          const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
          const q = query(playersRef, where('playerId', '==', playerId));
          const playerSnapshot = await getDocs(q);
          
          if (!playerSnapshot.empty) {
            const playerDoc = playerSnapshot.docs[0];
            setPlayerData({
              id: playerDoc.id,
              clubId: clubDoc.id,
              fullName: playerDoc.data().fullName,
              categoryId: playerDoc.data().categoryId,
              photoUrl: playerDoc.data().photoUrl,
              bannerUrl: playerDoc.data().bannerUrl
            });
            break;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching player data:', error);
        setToast({
          title: 'Error',
          description: 'Error al cargar los datos del jugador',
          type: 'error'
        });
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Cargando...</div>
        </div>
      </PlayerLayout>
    );
  }

  if (!playerData) {
    return (
      <PlayerLayout>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <p className="text-lg text-gray-500 mb-4">No se encontraron datos del jugador</p>
            <p className="text-sm text-gray-400">Por favor, verifica tu inicio de sesión</p>
          </div>
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <ToastProvider>
        <div className="space-y-6">
          {/* Banner Section */}
          <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden">
            {playerData.bannerUrl ? (
              <img
                src={playerData.bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <p className="text-white text-lg">Cancha</p>
              </div>
            )}

            {/* Profile Photo - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                {playerData.photoUrl ? (
                  <img
                    src={playerData.photoUrl}
                    alt={playerData.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl text-white">
                      {playerData.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player Info and Stats */}
          <div className="mt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {playerData.fullName}
              </h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <PlayerStatisticsPanel 
                  playerId={playerData.id} 
                  clubId={playerData.clubId} 
                  isEditable={false}
                />
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
    </PlayerLayout>
  );
}