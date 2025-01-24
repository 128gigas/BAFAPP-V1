import { z } from 'zod';

export enum CollaboratorRole {
  DELEGATE = 'delegate',
  READ_ONLY = 'read_only', 
  ACCOUNTANT = 'accountant',
  CLUB_ADMIN = 'club_admin'
}

export const ROLE_LABELS: Record<CollaboratorRole, string> = {
  [CollaboratorRole.DELEGATE]: 'Delegado',
  [CollaboratorRole.READ_ONLY]: 'Solo Lectura',
  [CollaboratorRole.ACCOUNTANT]: 'Contable',
  [CollaboratorRole.CLUB_ADMIN]: 'Admin Club'
};

export const ROLE_PERMISSIONS = {
  [CollaboratorRole.DELEGATE]: {
    canManageTeam: true,
    canManageMatches: true,
    canManageTrainings: true,
    canViewFinances: true,
    canManageFinances: false,
    canManageCollaborators: false,
    canViewPlayers: true,
    canViewNotifications: true,
    canViewStatistics: true,
    canManageCoaches: true
  },
  [CollaboratorRole.READ_ONLY]: {
    canManageTeam: false,
    canManageMatches: false,
    canManageTrainings: false,
    canViewFinances: true,
    canManageFinances: false,
    canManageCollaborators: false,
    canViewPlayers: true,
    canViewNotifications: true,
    canViewStatistics: true,
    canManageCoaches: false,
    canViewOnly: true,
    canViewMatches: true,
    canViewCategories: true,
    canViewCoaches: true,
    canViewTrainings: true
  },
  [CollaboratorRole.ACCOUNTANT]: {
    canManageTeam: false,
    canManageMatches: false,
    canManageTrainings: false,
    canViewFinances: true,
    canManageFinances: true,
    canManageCollaborators: false,
    canViewPlayers: true,
    canViewNotifications: true,
    canViewStatistics: true
  },
  [CollaboratorRole.CLUB_ADMIN]: {
    canManageTeam: true,
    canManageMatches: true,
    canManageTrainings: true,
    canViewFinances: true,
    canManageFinances: true,
    canManageCollaborators: true,
    canViewPlayers: true,
    canViewNotifications: true,
    canViewStatistics: true
  }
};

export interface Collaborator {
  id: string;
  email: string;
  clubId: string;
  role: CollaboratorRole;
  firstName: string;
  lastName: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const collaboratorSchema = z.object({
  email: z.string().email('Email inválido'),
  clubId: z.string().min(1, 'El club es requerido'),
  role: z.nativeEnum(CollaboratorRole),
  firstName: z.string().min(2, 'El nombre es requerido'),
  lastName: z.string().min(2, 'El apellido es requerido'),
  active: z.boolean()
});