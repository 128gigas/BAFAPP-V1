import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { DollarSign, Plus, Trash2, Save, Users, X } from 'lucide-react';
import { CategoryFeeConfig, MonthlyFee } from '@/lib/models/payment';
import { paymentService } from '@/lib/services/payment-service';
import { getMonthOptions } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  active: boolean;
}

interface Player {
  id: string;
  fullName: string;
  categoryId: string;
  active: boolean;
}

export function CategoryFees() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<{ [key: string]: Player[] }>({});
  const [feeConfigs, setFeeConfigs] = useState<{ [key: string]: CategoryFeeConfig }>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; description: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch players for each category
      const playersData: { [key: string]: Player[] } = {};
      for (const category of categoriesData) {
        const playersRef = collection(db, `clubs/${auth.currentUser.uid}/players`);
        const playersSnap = await getDocs(playersRef);
        playersData[category.id] = playersSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((player: any) => player.active && player.categoryId === category.id) as Player[];
      }
      setPlayers(playersData);

      // Fetch fee configurations
      const configs: { [key: string]: CategoryFeeConfig } = {};
      for (const category of categoriesData) {
        const config = await paymentService.getCategoryFeeConfig(auth.currentUser.uid, category.id);
        if (config) {
          configs[category.id] = config;
        }
      }
      setFeeConfigs(configs);
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

  const handleAddMonthlyFee = (categoryId: string) => {
    const config = feeConfigs[categoryId];
    if (!config) return;

    const currentFees = Array.isArray(config.monthlyFees) ? config.monthlyFees : [];
    const today = new Date();
    let nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    while (currentFees.some(fee => fee.month === nextMonth.toISOString().slice(0, 7))) {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    }
    
    const newFee: MonthlyFee = {
      month: nextMonth.toISOString().slice(0, 7),
      amount: config.baseAmount,
      dueDay: config.dueDay,
      description: ''
    };

    setFeeConfigs(prev => ({
      ...prev,
      [categoryId]: {
        ...config,
        monthlyFees: [...currentFees, newFee]
      }
    }));
  };

  const handleRemoveMonthlyFee = (categoryId: string, month: string) => {
    const config = feeConfigs[categoryId];
    if (!config) return;

    const currentFees = Array.isArray(config.monthlyFees) ? config.monthlyFees : [];

    setFeeConfigs(prev => ({
      ...prev,
      [categoryId]: {
        ...config,
        monthlyFees: currentFees.filter(fee => fee.month !== month)
      }
    }));
  };

  const handleUpdateMonthlyFee = (
    categoryId: string,
    month: string,
    updates: Partial<MonthlyFee>
  ) => {
    const config = feeConfigs[categoryId];
    if (!config) return;

    const currentFees = Array.isArray(config.monthlyFees) ? config.monthlyFees : [];

    if (updates.month && updates.month !== month) {
      const monthExists = currentFees.some(fee => fee.month === updates.month);
      if (monthExists) {
        setToast({
          title: 'Error',
          description: 'Ya existe una cuota para el mes seleccionado',
          type: 'error'
        });
        return;
      }
    }

    setFeeConfigs(prev => ({
      ...prev,
      [categoryId]: {
        ...config,
        monthlyFees: currentFees.map(fee =>
          fee.month === month ? { ...fee, ...updates } : fee
        )
      }
    }));
  };

  const handleTogglePlayer = (categoryId: string, playerId: string) => {
    const config = feeConfigs[categoryId];
    if (!config) return;

    setFeeConfigs(prev => ({
      ...prev,
      [categoryId]: {
        ...config,
        players: {
          ...config.players,
          [playerId]: {
            active: !config.players[playerId]?.active,
            customAmount: config.players[playerId]?.customAmount
          }
        }
      }
    }));
  };

  const handleUpdateConfig = async (categoryId: string) => {
    if (!auth.currentUser) return;

    try {
      const config = feeConfigs[categoryId];
      if (!config) return;

      if (!Array.isArray(config.monthlyFees)) {
        config.monthlyFees = [];
      }
      
      config.monthlyFees.sort((a, b) => a.month.localeCompare(b.month));
      
      const uniqueFees = new Map();
      config.monthlyFees.forEach(fee => {
        uniqueFees.set(fee.month, fee);
      });
      config.monthlyFees = Array.from(uniqueFees.values());

      await paymentService.saveCategoryFeeConfig(auth.currentUser.uid, config);
      
      setToast({
        title: 'Éxito',
        description: 'Configuración actualizada correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating config:', error);
      setToast({
        title: 'Error',
        description: 'No se pudo actualizar la configuración',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuración de Cuotas</h2>
        </div>

        <div className="space-y-6">
          {categories.map((category) => {
            const config = feeConfigs[category.id];
            const categoryPlayers = players[category.id] || [];
            if (!config) return null;

            return (
              <div key={category.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  <button
                    onClick={() => handleUpdateConfig(category.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Configuración Base */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>Cuota Base Mensual</Label>
                      <Input
                        type="number"
                        value={config.baseAmount}
                        onChange={(e) => setFeeConfigs({
                          ...feeConfigs,
                          [category.id]: {
                            ...config,
                            baseAmount: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Día de Vencimiento por Defecto</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={config.dueDay}
                        onChange={(e) => setFeeConfigs({
                          ...feeConfigs,
                          [category.id]: {
                            ...config,
                            dueDay: parseInt(e.target.value) || 1
                          }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label>Monto Variable por Mes</Label>
                      <Switch
                        checked={config.isVariableAmount}
                        onCheckedChange={(checked) => setFeeConfigs({
                          ...feeConfigs,
                          [category.id]: {
                            ...config,
                            isVariableAmount: checked
                          }
                        })}
                      />
                    </div>
                  </div>

                  {/* Selección de Jugadores */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium">Jugadores</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPlayers.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{player.fullName}</span>
                          <Switch
                            checked={config.players[player.id]?.active || false}
                            onCheckedChange={() => handleTogglePlayer(category.id, player.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cuotas Mensuales */}
                  {config.isVariableAmount && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-medium">Cuotas Mensuales</h4>
                        <button
                          onClick={() => handleAddMonthlyFee(category.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Mes
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(config.monthlyFees || []).map((fee) => (
                          <div key={fee.month} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <Label>Mes</Label>
                              <Input
                                type="month"
                                value={fee.month}
                                onChange={(e) => handleUpdateMonthlyFee(
                                  category.id,
                                  fee.month,
                                  { month: e.target.value }
                                )}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Monto</Label>
                              <Input
                                type="number"
                                value={fee.amount}
                                onChange={(e) => handleUpdateMonthlyFee(
                                  category.id,
                                  fee.month,
                                  { amount: parseFloat(e.target.value) || 0 }
                                )}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Día de Vencimiento</Label>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                value={fee.dueDay}
                                onChange={(e) => handleUpdateMonthlyFee(
                                  category.id,
                                  fee.month,
                                  { dueDay: parseInt(e.target.value) || 1 }
                                )}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleRemoveMonthlyFee(category.id, fee.month)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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