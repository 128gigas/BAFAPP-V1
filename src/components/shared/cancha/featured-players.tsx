import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star } from 'lucide-react';

interface FeaturedPlayer {
  id: string;
  fullName: string;
  photoUrl?: string;
  categoryName: string;
  stats: {
    goals: number;
    matches: number;
    attendance: number;
  };
}

interface FeaturedPlayersProps {
  clubId: string;
}

export function FeaturedPlayers({ clubId }: FeaturedPlayersProps) {
  const [players, setPlayers] = useState<FeaturedPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPlayers = async () => {
      try {
        // Get all active players
        const playersRef = collection(db, `clubs/${clubId}/players`);
        const playersQuery = query(playersRef, where('active', '==', true));
        const playersSnap = await getDocs(playersQuery);
        
        // Get categories for names
        const categoriesRef = collection(db, `clubs/${clubId}/categories`);
        const categoriesSnap = await getDocs(categoriesRef);
        const categories = new Map(
          categoriesSnap.docs.map(doc => [doc.id, doc.data().name])
        );

        // Get statistics for each player
        const statsRef = collection(db, `statistics/${clubId}/players`);
        const featuredPlayers: FeaturedPlayer[] = [];

        for (const playerDoc of playersSnap.docs) {
          const playerData = playerDoc.data();
          const statsQuery = query(statsRef, where('playerId', '==', playerDoc.id));
          const statsSnap = await getDocs(statsQuery);

          let goals = 0;
          let matches = 0;
          let totalAttendance = 0;

          statsSnap.docs.forEach(doc => {
            const data = doc.data();
            goals += data.goals || 0;
            matches += 1;
            totalAttendance += data.minutesPlayed > 0 ? 1 : 0;
          });

          featuredPlayers.push({
            id: playerDoc.id,
            fullName: playerData.fullName,
            photoUrl: playerData.photoUrl,
            categoryName: categories.get(playerData.categoryId) || 'Sin categoría',
            stats: {
              goals,
              matches,
              attendance: matches > 0 ? Math.round((totalAttendance / matches) * 100) : 0
            }
          });
        }

        // Sort by goals and get top 5
        const topPlayers = featuredPlayers
          .sort((a, b) => b.stats.goals - a.stats.goals)
          .slice(0, 5);

        setPlayers(topPlayers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured players:', error);
        setLoading(false);
      }
    };

    fetchFeaturedPlayers();
  }, [clubId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Jugadores Destacados
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
        Jugadores Destacados
      </h3>
      <div className="space-y-4">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50">
            <div className="relative">
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {player.fullName.charAt(0)}
                </div>
              )}
              {index === 0 && (
                <div className="absolute -top-1 -right-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{player.fullName}</h4>
                  <p className="text-sm text-gray-500">{player.categoryName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{player.stats.goals} goles</p>
                  <p className="text-xs text-gray-500">{player.stats.attendance}% asistencia</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}