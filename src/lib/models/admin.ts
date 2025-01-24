// Admin user types and permissions
export interface AdminPermissions {
  manageTeam: boolean;
  manageCategories: boolean;
  manageCoaches: boolean;
  manageTrainings: boolean;
  manageMatches: boolean;
  manageStatistics: boolean;
  manageNotifications: boolean;
  managePayments: boolean;
}

export interface AdminUser {
  email: string;
  firstLogin: boolean;
  permissions: AdminPermissions;
  createdAt: string;
  updatedAt?: string;
}

// Todos los administradores tienen permisos completos por defecto
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  manageTeam: true,
  manageCategories: true,
  manageCoaches: true,
  manageTrainings: true,
  manageMatches: true,
  manageStatistics: true,
  manageNotifications: true,
  managePayments: true
};