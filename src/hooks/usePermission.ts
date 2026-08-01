'use client';

import { useAuth } from '@/hooks/useStore';
import type { UserRole } from '@/types/api';

type RoleHierarchy = Record<UserRole, number>;

const ROLE_HIERARCHY: RoleHierarchy = {
  super_admin: 3,
  manager: 2,
  viewer: 1,
};

/**
 * Hook for checking user permissions/roles.
 * Used for client-side UX gating only — backend is the real security boundary.
 */
export function usePermission() {
  const { user, hasRole } = useAuth();

  const userRoleLevel = user ? ROLE_HIERARCHY[user.role] ?? 0 : 0;

  /** Check if user has exactly the specified role(s) */
  const isRole = (roles: UserRole | UserRole[]) => hasRole(roles);

  /** Check if user's role is at or above the required level */
  const hasMinRole = (minRole: UserRole): boolean => {
    if (!user) return false;
    return userRoleLevel >= ROLE_HIERARCHY[minRole];
  };

  /** Check if user can perform create actions */
  const canCreate = hasMinRole('manager');

  /** Check if user can perform edit actions */
  const canEdit = hasMinRole('manager');

  /** Check if user can perform delete actions */
  const canDelete = hasMinRole('super_admin');

  /** Check if user can manage settings */
  const canManageSettings = hasMinRole('super_admin');

  /** Check if user can manage users */
  const canManageUsers = hasMinRole('super_admin');

  /** Check if user can view financial data */
  const canViewFinancials = hasMinRole('manager');

  return {
    user,
    userRole: user?.role,
    isRole,
    hasMinRole,
    canCreate,
    canEdit,
    canDelete,
    canManageSettings,
    canManageUsers,
    canViewFinancials,
  };
}
