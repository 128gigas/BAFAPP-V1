import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Card, Title, BarChart, DonutChart } from '@tremor/react';
import { DollarSign, Users, Calendar, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentStatus } from '@/lib/models/payment';
import { paymentService } from '@/lib/services/payment-service';
import { useNavigate } from 'react-router-dom';

interface PaymentSummary {
  totalCollected: number;
  pendingPayments: number;
  activeMembers: number;
  overduePayments: number;
  paymentsByCategory: {
    [key: string]: number;
  };
  statusDistribution: {
    upToDate: number;
    pending: number;
    overdue: number;
  };
}

export function PaymentsDashboard() {
  const [summary, setSummary] = useState<PaymentSummary>({
    totalCollected: 0,
    pendingPayments: 0,
    activeMembers: 0,
    overduePayments: 0,
    paymentsByCategory: {},
    statusDistribution: {
      upToDate: 0,
      pending: 0,
      overdue: 0
    }
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      fetchSummary();
    }
  }, [selectedMonth]);

  const fetchSummary = async () => {
    if (!auth.currentUser) return;

    try {
      // Get all payments for the selected month
      const payments = await paymentService.getMonthlyPayments(auth.currentUser.uid, selectedMonth);

      // Get active players count
      const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
      const playersSnapshot = await getDocs(query(playersRef, where('active', '==', true)));
      const activePlayers = playersSnapshot.docs.length;

      // Calculate summary
      const paymentsByCategory = {};
      let totalCollected = 0;
      let pendingPayments = 0;
      let overduePayments = 0;

      payments.forEach(payment => {
        if (payment.status === PaymentStatus.PAID) {
          totalCollected += payment.amount;
          paymentsByCategory[payment.categoryId] = (paymentsByCategory[payment.categoryId] || 0) + payment.amount;
        } else if (payment.status === PaymentStatus.PENDING) {
          pendingPayments++;
        } else if (payment.status === PaymentStatus.OVERDUE) {
          overduePayments++;
        }
      });

      // Calculate status distribution
      const totalPayments = payments.length || 1; // Avoid division by zero
      const paidPayments = payments.filter(p => p.status === PaymentStatus.PAID).length;
      const pendingCount = payments.filter(p => p.status === PaymentStatus.PENDING).length;
      const overdueCount = payments.filter(p => p.status === PaymentStatus.OVERDUE).length;

      setSummary({
        totalCollected,
        pendingPayments,
        activeMembers: activePlayers,
        overduePayments,
        paymentsByCategory,
        statusDistribution: {
          upToDate: (paidPayments / totalPayments) * 100,
          pending: (pendingCount / totalPayments) * 100,
          overdue: (overdueCount / totalPayments) * 100
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Pagos</h2>
        </div>
        <div className="w-48">
          <Label>Mes</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/club/dashboard/payments/list')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Recaudado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary.totalCollected.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/club/dashboard/payments/list?status=pending')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.pendingPayments}
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/club/dashboard/payments/list?status=overdue')}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagos Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.overduePayments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jugadores Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.activeMembers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Distribución de Estado de Pagos</Title>
          <DonutChart
            className="mt-6"
            data={[
              {
                name: 'Al día',
                value: summary.statusDistribution.upToDate
              },
              {
                name: 'Pendientes',
                value: summary.statusDistribution.pending
              },
              {
                name: 'Vencidos',
                value: summary.statusDistribution.overdue
              }
            ]}
            category="value"
            index="name"
            colors={['green', 'yellow', 'red']}
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />
        </Card>

        <Card>
          <Title>Pagos por Categoría</Title>
          <BarChart
            className="mt-6"
            data={Object.entries(summary.paymentsByCategory).map(([category, amount]) => ({
              category,
              amount
            }))}
            index="category"
            categories={['amount']}
            colors={['blue']}
            valueFormatter={(value) => `$${value.toLocaleString()}`}
          />
        </Card>
      </div>
    </div>
  );
}