import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Card } from '@tremor/react';

export function SettingsSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Settings className="h-8 w-8 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Configuración</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración General</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">
                Esta sección está en desarrollo. Próximamente podrás configurar:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Preferencias de notificaciones
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Configuración de privacidad
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Personalización de la interfaz
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Integración con otros servicios
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Cuenta</h3>
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">
                Próximamente podrás gestionar:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                  Cambio de contraseña
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                  Información de contacto
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                  Preferencias de comunicación
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                  Configuración de seguridad
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* System Settings */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Sistema</h3>
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600">
                Próximas funcionalidades:
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  Copias de seguridad
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  Exportación de datos
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  Configuración de roles y permisos
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  Personalización de reportes
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}