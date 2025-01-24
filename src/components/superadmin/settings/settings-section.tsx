import { Settings } from 'lucide-react';

export function SettingsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Configuración</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Esta sección está en desarrollo. Próximamente podrás configurar las opciones del sistema.
        </p>
      </div>
    </div>
  );
}