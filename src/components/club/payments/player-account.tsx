import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Card, Title } from '@tremor/react';
import { DollarSign, Calendar, AlertCircle, ArrowLeft, Edit, Check, X } from 'lucide-react';
import { Payment, PaymentStatus, PaymentMethod } from '@/lib/models/payment';
import { paymentService } from '@/lib/services/payment-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface PlayerData {
  fullName: string;
  categoryId: string;
  categoryName?: string;
}

interface EditingPayment extends Payment {
  isEditing: boolean;
}

export function PlayerAccount() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [payments, setPayments] = useState<EditingPayment[]>([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (auth.currentUser && playerId) {
      fetchData();
    }
  }, [playerId]);

  const fetchData = async () => {
    if (!auth.currentUser || !playerId) return;

    try {
      // Fetch player data
      const playerDoc = await getDoc(doc(db, `clubs/${auth.currentUser.uid}/players`, playerId));
      if (!playerDoc.exists()) {
        navigate('/club/dashboard/payments');
        return;
      }

      const playerData = playerDoc.data();
      const categoryDoc = await getDoc(doc(db, `clubs/${auth.currentUser.uid}/categories`, playerData.categoryId));
      
      setPlayerData({
        ...playerData,
        categoryName: categoryDoc.exists() ? categoryDoc.data().name : 'Sin categoría'
      } as PlayerData);

      // Fetch payments
      const payments = await paymentService.getPlayerPayments(auth.currentUser.uid, playerId);
      
      // Sort by date, most recent first
      payments.sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

      // Add editing state
      const paymentsWithEdit = payments.map(p => ({ ...p, isEditing: false }));

      // Calculate summary
      const summary = payments.reduce((acc, payment) => ({
        totalPaid: acc.totalPaid + (payment.status === PaymentStatus.PAID ? payment.amount : 0),
        totalPending: acc.totalPending + (payment.status === PaymentStatus.PENDING ? payment.amount : 0),
        totalOverdue: acc.totalOverdue + (payment.status === PaymentStatus.OVERDUE ? payment.amount : 0)
      }), {
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0
      });

      setPayments(paymentsWithEdit);
      setSummary(summary);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleEdit = (paymentId: string) => {
    setPayments(payments.map(p => ({
      ...p,
      isEditing: p.id === paymentId
    })));
  };

  const handleCancel = (paymentId: string) => {
    setPayments(payments.map(p => ({
      ...p,
      isEditing: false
    })));
  };

  const handleSave = async (payment: EditingPayment) => {
    if (!auth.currentUser) return;

    try {
      const paymentRef = doc(db, `clubs/${auth.currentUser.uid}/payments`, payment.id);
      const { isEditing, ...paymentData } = payment;
      
      await updateDoc(paymentRef, {
        ...paymentData,
        updatedAt: new Date().toISOString()
      });

      setToast({
        title: 'Éxito',
        description: 'Pago actualizado correctamente',
        type: 'success'
      });

      await fetchData();
    } catch (error) {
      console.error('Error updating payment:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar el pago',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (!playerData) {
    return <div>Jugador no encontrado</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h2>
        </div>

        {/* Player Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{playerData.fullName}</h3>
              <p className="text-sm text-gray-500">{playerData.categoryName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Saldo Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalPending + summary.totalOverdue)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Pagado</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Pendiente</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Vencido</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summary.totalOverdue)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <Card>
          <Title>Historial de Pagos</Title>
          <div className="mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.month + '-01').toLocaleDateString('es', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Input
                          type="number"
                          value={payment.amount}
                          onChange={(e) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, amount: parseFloat(e.target.value) || 0 } : p
                          ))}
                          className="w-32"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Select
                          value={payment.status}
                          onValueChange={(value: PaymentStatus) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, status: value } : p
                          ))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PaymentStatus.PAID}>Pagado</SelectItem>
                            <SelectItem value={PaymentStatus.PENDING}>Pendiente</SelectItem>
                            <SelectItem value={PaymentStatus.OVERDUE}>Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === PaymentStatus.PAID ? 'bg-green-100 text-green-800' :
                          payment.status === PaymentStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === PaymentStatus.PAID ? 'Pagado' :
                           payment.status === PaymentStatus.PENDING ? 'Pendiente' :
                           'Vencido'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Input
                          type="date"
                          value={payment.dueDate.slice(0, 10)}
                          onChange={(e) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, dueDate: new Date(e.target.value).toISOString() } : p
                          ))}
                        />
                      ) : (
                        <div className="text-sm text-gray-500">
                          {formatDate(payment.dueDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Input
                          type="date"
                          value={payment.paymentDate?.slice(0, 10) || ''}
                          onChange={(e) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, paymentDate: e.target.value ? new Date(e.target.value).toISOString() : undefined } : p
                          ))}
                        />
                      ) : (
                        <div className="text-sm text-gray-500">
                          {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Select
                          value={payment.paymentMethod}
                          onValueChange={(value: PaymentMethod) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, paymentMethod: value } : p
                          ))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PaymentMethod.CASH}>Efectivo</SelectItem>
                            <SelectItem value={PaymentMethod.TRANSFER}>Transferencia</SelectItem>
                            <SelectItem value={PaymentMethod.CARD}>Tarjeta</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod === PaymentMethod.CASH ? 'Efectivo' :
                           payment.paymentMethod === PaymentMethod.TRANSFER ? 'Transferencia' :
                           payment.paymentMethod === PaymentMethod.CARD ? 'Tarjeta' : '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.isEditing ? (
                        <Input
                          value={payment.notes || ''}
                          onChange={(e) => setPayments(payments.map(p => 
                            p.id === payment.id ? { ...p, notes: e.target.value } : p
                          ))}
                          placeholder="Agregar notas..."
                        />
                      ) : (
                        <div className="text-sm text-gray-500">
                          {payment.notes || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {payment.isEditing ? (
                          <>
                            <button
                              onClick={() => handleSave(payment)}
                              className="text-green-600 hover:text-green-900"
                              title="Guardar cambios"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleCancel(payment.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEdit(payment.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar pago"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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