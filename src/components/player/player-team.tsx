import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserCircle } from 'lucide-react';
import { PlayerLayout } from './player-layout';
import { usePositions } from '@/hooks/use-positions';

interface TeamPlayer {
  id: string;
  playerId: string;
  fullName: string;
  position: string;
  photoUrl: string;
}

export function PlayerTeam() {
  const [teammates, setTeammates] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerCategoryId, setPlayerCategoryId] = useState<string | null>(null);
  const { positions } = usePositions();
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    const fetchPlayerCategory = async () => {
      if (!playerId) return;

      try {
        // First, get the current player's category
        const clubsRef = collection(db, 'clubs');
        const clubs = await getDocs(clubsRef);
        
        for (const clubDoc of clubs.docs) {
          const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
          const q = query(playersRef, where('playerId', '==', playerId));
          const playerSnapshot = await getDocs(q);
          
          if (!playerSnapshot.empty) {
            const playerData = playerSnapshot.docs[0].data();
            setPlayerCategoryId(playerData.categoryId);
            break;
          }
        }
      } catch (error) {
        console.error('Error fetching player category:', error);
      }
    };

    fetchPlayerCategory();
  }, [playerId]);

  useEffect(() => {
    const fetchTeammates = async () => {
      if (!playerCategoryId) return;

      try {
        const clubsRef = collection(db, 'clubs');
        const clubs = await getDocs(clubsRef);
        const teammatesData: TeamPlayer[] = [];

        for (const clubDoc of clubs.docs) {
          const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
          const q = query(playersRef, where('categoryId', '==', playerCategoryId));
          const playersSnapshot = await getDocs(q);

          playersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.playerId !== playerId && data.active) {
              teammatesData.push({
                id: doc.id,
                playerId: data.playerId,
                fullName: data.fullName,
                position: data.position,
                photoUrl: data.photoUrl,
              });
            }
          });
        }

        setTeammates(teammatesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching teammates:', error);
        setLoading(false);
      }
    };

    if (playerCategoryId) {
      fetchTeammates();
    }
  }, [playerCategoryId, playerId]);

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">Cargando...</div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Mi Equipo</h2>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Compañeros de Equipo
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
            {teammates.map((teammate) => (
              <div
                key={teammate.id}
                className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    {teammate.photoUrl ? (
                      <img
                        src={teammate.photoUrl}
                        alt={teammate.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="h-12 w-12 text-gray-400" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {teammate.fullName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {positions.find(p => p.id === teammate.position)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PlayerLayout>
  );
}