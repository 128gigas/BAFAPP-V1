import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Plus, Receipt, Check, X, Search } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment, PaymentMethod, PaymentStatus } from '@/lib/models/payment';
import { paymentService } from '@/lib/services/payment-service';
import { generatePendingPayments } from '@/lib/payment-utils';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: string;
  fullName: string;
  categoryId: string;
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    if (!auth.currentUser) return;

    try {
      // Fetch categories
      const categoriesRef = collection(db, `clubs/${auth.currentUser.uid}/categories`);
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active) as Category[];
      setCategories(categoriesData);

      // Fetch active players
      const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
      const playersSnap = await getDocs(playersRef);
      const activePlayers = playersSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((player: any) => player.active) as Player[];

      // Generate pending payments for each active player
      for (const player of activePlayers) {
        await generatePendingPayments(auth.currentUser.uid, player.id);
      }

      // Fetch payments for the selected month
      await fetchPayments();

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        type: 'error'
      });
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!auth.currentUser) return;

    try {
      const payments = await paymentService.getMonthlyPayments(auth.currentUser.uid, selectedMonth);
      setPayments(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setToast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos',
        type: 'error'
      });
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: PaymentStatus) => {
    if (!auth.currentUser) return;

    try {
      const paymentRef = doc(db, `clubs/${auth.currentUser.uid}/payments`, paymentId);
      await updateDoc(paymentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await fetchPayments();
      setToast({
        title: 'Éxito',
        description: 'Estado actualizado correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        type: 'error'
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    const categoryMatch = selectedCategory === 'all' || payment.categoryId === selectedCategory;
    const statusMatch = selectedStatus === 'all' || payment.status === selectedStatus;
    const searchMatch = searchTerm === '' || 
      payment.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && statusMatch && searchMatch;
  });

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.OVERDUE:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Pagado';
      case PaymentStatus.PENDING:
        return 'Pendiente';
      case PaymentStatus.OVERDUE:
        return 'Vencido';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Receipt className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Pagos</h2>
          </div>
          <button
            onClick={() => navigate('/club/dashboard/payments/list')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Registrar Pago
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Mes</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                fetchPayments();
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Categoría</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Pagados</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pendientes</SelectItem>
                <SelectItem value={PaymentStatus.OVERDUE}>Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Buscar</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                placeholder="Buscar por nombre..."
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jugador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Pago
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.playerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {payment.categoryName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {payment.paymentMethod === PaymentMethod.CASH ? 'Efectivo' :
                         payment.paymentMethod === PaymentMethod.TRANSFER ? 'Transferencia' :
                         payment.paymentMethod === PaymentMethod.CARD ? 'Tarjeta' : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {payment.status !== PaymentStatus.PAID && (
                          <button
                            onClick={() => handleStatusChange(payment.id, PaymentStatus.PAID)}
                            className="text-green-600 hover:text-green-900"
                            title="Marcar como pagado"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        {payment.status !== PaymentStatus.PENDING && (
                          <button
                            onClick={() => handleStatusChange(payment.id, PaymentStatus.PENDING)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Marcar como pendiente"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        {payment.status !== PaymentStatus.OVERDUE && (
                          <button
                            onClick={() => handleStatusChange(payment.id, PaymentStatus.OVERDUE)}
                            className="text-red-600 hover:text-red-900"
                            title="Marcar como vencido"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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