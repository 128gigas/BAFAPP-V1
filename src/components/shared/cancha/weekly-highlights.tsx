import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star, Calendar } from 'lucide-react';

interface Highlight {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'match' | 'training' | 'achievement';
  imageUrl?: string;
}

interface WeeklyHighlightsProps {
  clubId: string;
}

export function WeeklyHighlights({ clubId }: WeeklyHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Get matches from the last week
        const matchesRef = collection(db, `statistics/${clubId}/matches`);
        const matchesQuery = query(
          matchesRef,
          where('date', '>=', oneWeekAgo.toISOString()),
          orderBy('date', 'desc')
        );
        const matchesSnap = await getDocs(matchesQuery);

        const weeklyHighlights: Highlight[] = [];

        // Process matches
        matchesSnap.docs.forEach(doc => {
          const match = doc.data();
          if (match.result === 'won') {
            weeklyHighlights.push({
              id: doc.id,
              title: '¡Victoria!',
              description: `Victoria ${match.goalsScored}-${match.goalsConceded}`,
              date: match.date,
              type: 'match'
            });
          }
        });

        // Get top performances
        const playersRef = collection(db, `statistics/${clubId}/players`);
        const playersQuery = query(
          playersRef,
          where('date', '>=', oneWeekAgo.toISOString()),
          orderBy('date', 'desc')
        );
        const playersSnap = await getDocs(playersQuery);

        playersSnap.docs.forEach(doc => {
          const stats = doc.data();
          if (stats.goals > 1) {
            weeklyHighlights.push({
              id: doc.id,
              title: 'Destacado',
              description: `${stats.playerName} anotó ${stats.goals} goles`,
              date: stats.date,
              type: 'achievement'
            });
          }
        });

        // Sort by date and get top 5
        const sortedHighlights = weeklyHighlights
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);

        setHighlights(sortedHighlights);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching highlights:', error);
        setLoading(false);
      }
    };

    fetchHighlights();
  }, [clubId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          Destacados de la Semana
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          Destacados de la Semana
        </h3>
        <p className="text-gray-500 text-center py-4">
          No hay destacados esta semana
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Star className="h-5 w-5 text-yellow-500 mr-2" />
        Destacados de la Semana
      </h3>
      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <div className={`p-2 rounded-full ${
              highlight.type === 'match' ? 'bg-green-100' :
              highlight.type === 'training' ? 'bg-blue-100' :
              'bg-yellow-100'
            }`}>
              {highlight.type === 'match' ? '⚽️' :
               highlight.type === 'training' ? '🏃' :
               '🌟'}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{highlight.title}</h4>
              <p className="text-sm text-gray-600">{highlight.description}</p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(highlight.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}