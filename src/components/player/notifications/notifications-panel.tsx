import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  categoryId: string;
  createdAt: string;
}

interface NotificationsPanelProps {
  playerId: string;
  categoryId: string;
  clubId: string;
}

export function NotificationsPanel({ playerId, categoryId, clubId }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!clubId || !categoryId) {
        setLoading(false);
        return;
      }

      try {
        const notificationsRef = collection(db, `clubs/${clubId}/notifications`);
        const notificationsSnapshot = await getDocs(notificationsRef);
        const notificationsData = notificationsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(notification => 
            notification.categoryId === 'all' || notification.categoryId === categoryId
          ) as Notification[];

        // Ordenar por fecha de creación, más recientes primero
        notificationsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNotifications(notificationsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [clubId, categoryId]);

  if (loading) {
    return <div className="flex justify-center items-center h-24">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Notificaciones</h3>
        </div>
        {notifications.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {notifications.length}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay notificaciones nuevas</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <p className="text-gray-600 mt-1">{notification.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}