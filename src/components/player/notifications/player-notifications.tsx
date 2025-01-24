import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Calendar } from 'lucide-react';
import { PlayerLayout } from '../player-layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Notification {
  id: string;
  title: string;
  message: string;
  categoryId: string;
  createdAt: string;
}

export function PlayerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const playerId = sessionStorage.getItem('playerId');

  useEffect(() => {
    if (playerId) {
      fetchNotifications();
    }
  }, [playerId, selectedMonth]);

  const fetchNotifications = async () => {
    if (!playerId) return;

    try {
      // Find the club that has this player
      const clubsRef = collection(db, 'clubs');
      const clubs = await getDocs(clubsRef);
      
      for (const clubDoc of clubs.docs) {
        const playersRef = collection(db, `clubs/${clubDoc.id}/players`);
        const q = query(playersRef, where('playerId', '==', playerId));
        const playerSnapshot = await getDocs(q);
        
        if (!playerSnapshot.empty) {
          const playerData = playerSnapshot.docs[0].data();
          
          // Get notifications for this player's category
          const notificationsRef = collection(db, `clubs/${clubDoc.id}/notifications`);
          const notificationsSnapshot = await getDocs(notificationsRef);
          
          const notificationsData = notificationsSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(notification => 
              notification.categoryId === 'all' || notification.categoryId === playerData.categoryId
            )
            .filter(notification => {
              const notificationMonth = new Date(notification.createdAt).toISOString().slice(0, 7);
              return selectedMonth === 'all' || notificationMonth === selectedMonth;
            }) as Notification[];

          // Sort by date, most recent first
          notificationsData.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setNotifications(notificationsData);
          break;
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'Todos los meses' }];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Generate options for the last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }

    return options;
  };

  if (loading) {
    return (
      <PlayerLayout>
        <div className="flex justify-center items-center h-64">Cargando...</div>
      </PlayerLayout>
    );
  }

  return (
    <PlayerLayout>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Bell className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notificaciones</h2>
          </div>

          <div className="w-full sm:w-64">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione mes" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 break-words">{notification.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-600 break-words">{notification.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notificaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                No tienes notificaciones para mostrar en este momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </PlayerLayout>
  );
}