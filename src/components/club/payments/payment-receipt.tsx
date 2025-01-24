import { useState } from 'react';
import { DollarSign } from 'lucide-react';

interface PaymentReceiptProps {
  payment: {
    id: string;
    playerName: string;
    categoryName: string;
    amount: number;
    month: string;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  };
  clubName: string;
}

export function PaymentReceipt({ payment, clubName }: PaymentReceiptProps) {
  const [receiptNumber] = useState(() => Math.floor(Math.random() * 1000000).toString().padStart(6, '0'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto print:shadow-none">
      {/* Header */}
      <div className="text-center border-b pb-4 mb-6">
        <div className="flex items-center justify-center mb-4">
          <DollarSign className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{clubName}</h1>
        <p className="text-gray-500">Recibo de Pago</p>
        <p className="text-sm text-gray-400">N° {receiptNumber}</p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Fecha de Pago</p>
            <p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Período</p>
            <p className="font-medium">
              {new Date(payment.month + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Jugador</p>
              <p className="font-medium">{payment.playerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-medium">{payment.categoryName}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium">
                {payment.paymentMethod === 'cash' ? 'Efectivo' :
                 payment.paymentMethod === 'transfer' ? 'Transferencia' :
                 'Tarjeta'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto</p>
              <p className="font-medium text-xl">${payment.amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Notas</p>
            <p className="text-gray-600">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Este documento es un comprobante válido de pago</p>
        <p className="mt-1">{new Date().toISOString()}</p>
      </div>

      {/* Print Button - Hidden when printing */}
      <div className="mt-6 text-center print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Imprimir Recibo
        </button>
      </div>
    </div>
  );
}