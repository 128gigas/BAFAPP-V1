import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Bell } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface PaymentNotification {
  id: string;
  playerId: string;
  playerName: string;
  categoryId: string;
  categoryName: string;
  type: 'reminder' | 'overdue' | 'confirmation';
  message: string;
  amount?: number;
  dueDate?: string;
  createdAt: string;
  read: boolean;
}

interface PaymentNotificationProps {
  playerId: string;
  categoryId: string;
}

export function PaymentNotification({ playerId, categoryId }: PaymentNotificationProps) {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      fetchNotifications();
    }
  }, [playerId]);

  const fetchNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      const notificationsRef = collection(db, `clubs/${auth.currentUser.uid}/notifications`);
      const q = query(
        notificationsRef,
        where('playerId', '==', playerId),
        where('categoryId', '==', categoryId)
      );
      const querySnapshot = await getDocs(q);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentNotification[];

      setNotifications(notificationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const createNotification = async (notification: Omit<PaymentNotification, 'id' | 'createdAt' | 'read'>) => {
    if (!auth.currentUser) return;

    try {
      const notificationsRef = collection(db, `clubs/${auth.currentUser.uid}/notifications`);
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: new Date().toISOString(),
        read: false
      });

      fetchNotifications();
      setToast({
        title: 'Éxito',
        description: 'Notificación enviada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo enviar la notificación',
        type: 'error'
      });
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'bg-blue-50 border-blue-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'confirmation':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${getNotificationStyle(notification.type)}`}
          >
            <div className="flex items-start space-x-3">
              <Bell className={`h-5 w-5 ${
                notification.type === 'reminder' ? 'text-blue-500' :
                notification.type === 'overdue' ? 'text-red-500' :
                'text-green-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.message}
                </p>
                {notification.amount && (
                  <p className="text-sm text-gray-600 mt-1">
                    Monto: ${notification.amount.toLocaleString()}
                  </p>
                )}
                {notification.dueDate && (
                  <p className="text-sm text-gray-600">
                    Vence: {new Date(notification.dueDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No hay notificaciones
          </div>
        )}
      </div>

      {toast && (
        <Toast className={toast.type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastDescription>{toast.description}</ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
}