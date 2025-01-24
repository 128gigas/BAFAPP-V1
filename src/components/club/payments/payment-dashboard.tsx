import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Card, Title, BarChart, DonutChart } from '@tremor/react';
import { DollarSign, Calendar, AlertCircle } from 'lucide-react';

export function PaymentDashboard() {
  const [summary, setSummary] = useState({
    totalCollected: 0,
    pendingPayments: 0,
    overduePayments: 0,
    upcomingPayments: 0,
    paymentsByCategory: {},
    paymentsByMonth: []
  });

  useEffect(() => {
    if (auth.currentUser) {
      fetchPaymentSummary();
    }
  }, []);

  const fetchPaymentSummary = async () => {
    if (!auth.currentUser) return;

    try {
      const paymentsRef = collection(db, `clubs/${auth.currentUser.uid}/payments`);
      const querySnapshot = await getDocs(paymentsRef);
      const payments = querySnapshot.docs.map(doc => doc.data());

      // Calcular resumen
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const summary = payments.reduce((acc, payment) => {
        const dueDate = new Date(payment.dueDate);
        
        if (payment.status === 'paid') {
          acc.totalCollected += payment.amount;
        } else if (payment.status === 'pending') {
          acc.pendingPayments++;
          if (dueDate <= nextMonth) {
            acc.upcomingPayments++;
          }
        } else if (payment.status === 'overdue') {
          acc.overduePayments++;
        }

        // Agrupar por categoría
        if (!acc.paymentsByCategory[payment.categoryId]) {
          acc.paymentsByCategory[payment.categoryId] = 0;
        }
        if (payment.status === 'paid') {
          acc.paymentsByCategory[payment.categoryId] += payment.amount;
        }

        return acc;
      }, {
        totalCollected: 0,
        pendingPayments: 0,
        overduePayments: 0,
        upcomingPayments: 0,
        paymentsByCategory: {},
        paymentsByMonth: []
      });

      setSummary(summary);
    } catch (error) {
      console.error('Error fetching payment summary:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Recaudado</p>
              <p className="text-2xl font-bold">${summary.totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Próximos Vencimientos</p>
              <p className="text-2xl font-bold">{summary.upcomingPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-bold">{summary.pendingPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Pagos Vencidos</p>
              <p className="text-2xl font-bold">{summary.overduePayments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Title>Recaudación por Categoría</Title>
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

        <Card>
          <Title>Estado de Pagos</Title>
          <DonutChart
            className="mt-6"
            data={[
              { name: 'Al día', value: summary.totalCollected },
              { name: 'Pendientes', value: summary.pendingPayments },
              { name: 'Vencidos', value: summary.overduePayments }
            ]}
            category="value"
            index="name"
            colors={['green', 'yellow', 'red']}
            valueFormatter={(value) => `$${value.toLocaleString()}`}
          />
        </Card>
      </div>
    </div>
  );
}