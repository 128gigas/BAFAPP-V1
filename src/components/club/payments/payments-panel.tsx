import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Plus, Receipt, Check, X, Search, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment, PaymentMethod, PaymentStatus } from '@/lib/models/payment';
import { paymentService } from '@/lib/services/payment-service';
import { useNavigate } from 'react-router-dom';
import { useClubAuth } from '@/hooks/use-club-auth';

interface Category {
  id: string;
  name: string;
  active: boolean;
}

export function PaymentsPanel() {
  const { clubId, permissions } = useClubAuth();
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
    if (clubId) {
      fetchData();
    }
  }, [clubId, selectedMonth]);

  const fetchData = async () => {
    if (!clubId) return;

    try {
      // Fetch categories
      const categoriesRef = collection(db, `clubs/${clubId}/categories`);
      const categoriesSnap = await getDocs(categoriesRef);
      const categoriesData = categoriesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((category: any) => category.active) as Category[];
      setCategories(categoriesData);

      // Fetch payments for the selected month
      const payments = await paymentService.getMonthlyPayments(clubId, selectedMonth);
      setPayments(payments);

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

  const handleStatusChange = async (paymentId: string, newStatus: PaymentStatus) => {
    if (!clubId || permissions.canViewOnly) {
      setToast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para modificar pagos',
        type: 'error'
      });
      return;
    }

    try {
      const paymentRef = doc(db, `clubs/${clubId}/payments`, paymentId);
      await updateDoc(paymentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      await fetchData();
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

  // Calculate summary
  const summary = payments.reduce((acc, payment) => ({
    totalCollected: acc.totalCollected + (payment.status === PaymentStatus.PAID ? payment.amount : 0),
    pendingPayments: acc.pendingPayments + (payment.status === PaymentStatus.PENDING ? 1 : 0),
    overduePayments: acc.overduePayments + (payment.status === PaymentStatus.OVERDUE ? 1 : 0),
  }), {
    totalCollected: 0,
    pendingPayments: 0,
    overduePayments: 0
  });

  if (!permissions.canViewFinances) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Receipt className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Estado de Pagos</h2>
          </div>
          {!permissions.canViewOnly && (
            <button
              onClick={() => navigate('/club/dashboard/payments/fees')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Configurar Cuotas
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Total Recaudado</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  ${summary.totalCollected.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Pagos Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {summary.pendingPayments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Pagos Vencidos</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {summary.overduePayments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Mes</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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

        {/* Payments List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Desktop View */}
          <div className="hidden lg:block overflow-x-auto">
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
                  <tr 
                    key={payment.id}
                    onClick={() => navigate(`/club/dashboard/payments/account/${payment.playerId}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
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
                      {!permissions.canViewOnly && (
                        <div className="flex justify-end space-x-2">
                          {payment.status !== PaymentStatus.PAID && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(payment.id, PaymentStatus.PAID);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como pagado"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          {payment.status !== PaymentStatus.PENDING && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(payment.id, PaymentStatus.PENDING);
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Marcar como pendiente"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          {payment.status !== PaymentStatus.OVERDUE && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(payment.id, PaymentStatus.OVERDUE);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Marcar como vencido"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => navigate(`/club/dashboard/payments/account/${payment.playerId}`)}
                className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{payment.playerName}</h3>
                    <p className="text-sm text-gray-500">{payment.categoryName}</p>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Monto:</p>
                    <p className="font-medium">${payment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Método:</p>
                    <p className="font-medium">
                      {payment.paymentMethod === PaymentMethod.CASH ? 'Efectivo' :
                       payment.paymentMethod === PaymentMethod.TRANSFER ? 'Transferencia' :
                       payment.paymentMethod === PaymentMethod.CARD ? 'Tarjeta' : '-'}
                    </p>
                  </div>
                  {payment.paymentDate && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Fecha de pago:</p>
                      <p className="font-medium">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {!permissions.canViewOnly && (
                  <div className="flex justify-end space-x-2 pt-2 border-t">
                    {payment.status !== PaymentStatus.PAID && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(payment.id, PaymentStatus.PAID);
                        }}
                        className="p-2 text-green-600 hover:text-green-900"
                        title="Marcar como pagado"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    {payment.status !== PaymentStatus.PENDING && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(payment.id, PaymentStatus.PENDING);
                        }}
                        className="p-2 text-yellow-600 hover:text-yellow-900"
                        title="Marcar como pendiente"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    )}
                    {payment.status !== PaymentStatus.OVERDUE && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(payment.id, PaymentStatus.OVERDUE);
                        }}
                        className="p-2 text-red-600 hover:text-red-900"
                        title="Marcar como vencido"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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