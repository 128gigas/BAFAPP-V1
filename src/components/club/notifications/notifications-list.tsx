import { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Plus, Trash2, Bell } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  categoryId: string | 'all';
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export function NotificationsList() {
  const { clubId, permissions } = useClubAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    categoryId: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (clubId) {
      fetchNotifications();
      fetchCategories();
    }
  }, [clubId]);

  const fetchCategories = async () => {
    if (!clubId) return;
    
    try {
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      const querySnapshot = await getDocs(categoriesRef);
      const categoriesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active) as Category[];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!clubId) return;
    
    try {
      const notificationsRef = collection(db, `clubs/${clubId}/notifications`);
      const querySnapshot = await getDocs(notificationsRef);
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Sort by creation date, most recent first
      notificationsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(notificationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddNotification = async () => {
    if (!clubId || permissions.canViewOnly) {
      setToast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para crear notificaciones',
        type: 'error'
      });
      return;
    }

    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      setToast({
        title: 'Error',
        description: 'El título y el mensaje son requeridos',
        type: 'error'
      });
      return;
    }

    try {
      const notificationsRef = collection(db, `clubs/${clubId}/notifications`);
      await addDoc(notificationsRef, {
        ...newNotification,
        title: newNotification.title.trim(),
        message: newNotification.message.trim(),
        createdAt: new Date().toISOString(),
      });

      setNewNotification({
        title: '',
        message: '',
        categoryId: 'all'
      });
      fetchNotifications();
      setToast({
        title: 'Éxito',
        description: 'Notificación enviada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding notification:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo enviar la notificación',
        type: 'error'
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!clubId || permissions.canViewOnly) {
      setToast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para eliminar notificaciones',
        type: 'error'
      });
      return;
    }

    if (!window.confirm('¿Está seguro de que desea eliminar esta notificación?')) return;

    try {
      const notificationRef = doc(db, `clubs/${clubId}/notifications`, notificationId);
      await deleteDoc(notificationRef);
      
      fetchNotifications();
      setToast({
        title: 'Éxito',
        description: 'Notificación eliminada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!permissions.canViewFinances) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-yellow-50 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Acceso Restringido</h3>
          <p className="text-yellow-600">
            No tienes permisos para ver las notificaciones. Esta sección está reservada para personal autorizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Bell className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Formulario para nueva notificación */}
            {!permissions.canViewOnly && (
              <div className="mb-6 space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Título de la notificación"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensaje</Label>
                  <Input
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Contenido del mensaje"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Destinatarios</Label>
                  <Select
                    value={newNotification.categoryId}
                    onValueChange={(value) => setNewNotification({ ...newNotification, categoryId: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccione los destinatarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los jugadores</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  onClick={handleAddNotification}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Enviar Notificación
                </button>
              </div>
            )}

            {/* Lista de notificaciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Historial de Notificaciones</h3>
              
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay notificaciones enviadas</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="bg-gray-50 rounded-lg p-4 relative hover:bg-gray-100 transition-colors"
                    >
                      <div className="pr-8">
                        <h4 className="text-lg font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                          <span>
                            Enviado a: {notification.categoryId === 'all' 
                              ? 'Todos los jugadores' 
                              : categories.find(c => c.id === notification.categoryId)?.name || 'Categoría desconocida'}
                          </span>
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {!permissions.canViewOnly && (
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="absolute top-4 right-4 text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
  );
}