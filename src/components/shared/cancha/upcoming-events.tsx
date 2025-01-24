import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar, MapPin } from 'lucide-react';

interface Event {
  id: string;
  type: 'match' | 'training';
  date: string;
  time: string;
  location: string;
  description?: string;
  categoryName?: string;
}

interface UpcomingEventsProps {
  clubId: string;
}

export function UpcomingEvents({ clubId }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!clubId) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date();
        const events: Event[] = [];

        // Fetch upcoming trainings
        try {
          const trainingsRef = collection(db, `clubs/${clubId}/trainings`);
          const trainingsQuery = query(
            trainingsRef,
            where('date', '>=', today.toISOString().split('T')[0]),
            where('active', '==', true),
            orderBy('date'),
            limit(5)
          );
          const trainingsSnap = await getDocs(trainingsQuery);

          for (const doc of trainingsSnap.docs) {
            const training = doc.data();
            let categoryName = '';
            
            // Get category name if categoryId exists
            if (training.categoryId) {
              try {
                const categoryRef = doc(db, `clubs/${clubId}/categories/${training.categoryId}`);
                const categorySnap = await getDoc(categoryRef);
                categoryName = categorySnap.exists() ? categorySnap.data().name : '';
              } catch (error) {
                console.log('Error fetching category:', error);
              }
            }

            events.push({
              id: doc.id,
              type: 'training',
              date: training.date,
              time: training.time,
              location: training.location,
              description: training.description,
              categoryName
            });
          }
        } catch (error) {
          console.log('Error fetching trainings:', error);
        }

        // Fetch upcoming matches
        try {
          const matchesRef = collection(db, `clubs/${clubId}/matches`);
          const matchesQuery = query(
            matchesRef,
            where('date', '>=', today.toISOString().split('T')[0]),
            orderBy('date'),
            limit(5)
          );
          const matchesSnap = await getDocs(matchesQuery);

          for (const doc of matchesSnap.docs) {
            const match = doc.data();
            let categoryName = '';
            
            // Get category name if categoryId exists
            if (match.categoryId) {
              try {
                const categoryRef = doc(db, `clubs/${clubId}/categories/${match.categoryId}`);
                const categorySnap = await getDoc(categoryRef);
                categoryName = categorySnap.exists() ? categorySnap.data().name : '';
              } catch (error) {
                console.log('Error fetching category:', error);
              }
            }

            events.push({
              id: doc.id,
              type: 'match',
              date: match.date,
              time: match.time,
              location: match.location,
              description: match.description || `vs ${match.opponentName || 'Rival'}`,
              categoryName
            });
          }
        } catch (error) {
          console.log('Error fetching matches:', error);
        }

        // Sort by date and time
        const sortedEvents = events.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateA.getTime() - dateB.getTime();
        });

        setEvents(sortedEvents.slice(0, 5));
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [clubId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          Próximos Eventos
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

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Calendar className="h-5 w-5 text-blue-500 mr-2" />
        Próximos Eventos
      </h3>
      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No hay eventos programados
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg ${
                event.type === 'match'
                  ? 'bg-green-50 hover:bg-green-100'
                  : 'bg-blue-50 hover:bg-blue-100'
              } transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {event.type === 'match' ? '⚽️' : '🏃'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {event.type === 'match' ? 'Partido' : 'Entrenamiento'}
                      {event.categoryName && ` - ${event.categoryName}`}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="font-medium">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div>{event.time}</div>
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {event.location}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}