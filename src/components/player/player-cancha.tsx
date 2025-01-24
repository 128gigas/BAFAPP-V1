import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlayerLayout } from './player-layout';
import { CanchaFeed } from '../shared/cancha/cancha-feed';

interface ClubData {
  id: string;
  photoUrl?: string;
  canchaHeaderUrl?: string;
}

export function PlayerCancha() {
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    const fetchPlayerClub = async () => {
      if (!playerId) {
        console.log('No player ID found in session');
        return;
      }

      try {
        // Buscar el club al que pertenece el jugador
        const clubsRef = collection(db, 'clubs');
        const clubsSnap = await getDocs(clubsRef);
        
        for (const clubDoc of clubsSnap.docs) {
          const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
          const q = query(playersRef, where('playerId', '==', playerId));
          const playerSnap = await getDocs(q);
          
          if (!playerSnap.empty) {
            console.log('Found player in club:', clubDoc.id);
            const clubData = clubDoc.data();
            setClubData({
              id: clubDoc.id,
              photoUrl: clubData.photoUrl,
              canchaHeaderUrl: clubData.canchaHeaderUrl
            });
            break;
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching player club:', error);
        setLoading(false);
      }
    };

    fetchPlayerClub();
  }, [playerId]);

  if (!playerId) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">
          No hay sesión iniciada
        </div>
      </PlayerLayout>
    );
  }

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">
          Cargando...
        </div>
      </PlayerLayout>
    );
  }

  if (!clubData) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">
          No se encontró el club
        </div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div className="space-y-6">
        {/* Banner Section with Logo */}
        <div className="relative h-64 mb-20">
          {/* Banner Background */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            {clubData.canchaHeaderUrl ? (
              <img
                src={clubData.canchaHeaderUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <p className="text-white text-lg">Cancha</p>
              </div>
            )}
          </div>
          
          {/* Club Logo Container - Positioned at bottom center */}
          <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-1/2 bottom-0 z-10">
            <div className="w-32 h-32 rounded-full bg-white shadow-xl p-2">
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
        <CanchaFeed clubId={clubData.id} />
      </div>
    </PlayerLayout>
  );
}