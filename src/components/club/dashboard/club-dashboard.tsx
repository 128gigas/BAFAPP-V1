import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { Trophy, Bell, UserPlus, Dumbbell, Calendar, Users, AlertCircle } from 'lucide-react';
import { Card, Title, BarChart } from '@tremor/react';
import { useClubAuth } from '@/hooks/use-club-auth';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

export function ClubDashboard() {
  // ... existing state and hooks ...

  return (
    <ToastProvider>
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-4 sm:p-6">
                <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4`}>
                  <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{action.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Partidos Ganados</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {statistics.matches.won}
                </p>
              </div>
            </div>
          </Card>

          {/* Similar adjustments for other statistic cards */}
        </div>

        {/* Match Results Chart */}
        <Card>
          <Title>Resultados de Partidos</Title>
          <div className="mt-6 h-[300px] sm:h-[400px]">
            <BarChart
              className="h-full"
              data={[
                {
                  name: 'Resultados',
                  'Ganados': statistics.matches.won,
                  'Perdidos': statistics.matches.lost,
                  'Empatados': statistics.matches.tied,
                }
              ]}
              index="name"
              categories={['Ganados', 'Perdidos', 'Empatados']}
              colors={['green', 'red', 'yellow']}
            />
          </div>
        </Card>

        {/* Medical Cards Expiring */}
        <Card>
          <Title>Vencimientos de Carné de Salud</Title>
          <div className="mt-4">
            {expiringMedicalCards.length > 0 ? (
              <div className="space-y-4">
                {expiringMedicalCards.map((card) => (
                  <div
                    key={card.playerId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-red-50 rounded-lg"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="font-medium text-gray-900">{card.playerName}</p>
                      <p className="text-sm text-gray-500">{card.categoryName}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-red-600">
                        Vence: {new Date(card.expiryDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(card.expiryDate) <= new Date() ? 'Vencido' : 'Próximo a vencer'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No hay carnés de salud próximos a vencer
              </p>
            )}
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