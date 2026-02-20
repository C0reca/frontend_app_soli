import { useMemo } from 'react';
import { useMyPermissions } from './usePermissoes';

/**
 * Hook de conveniência para verificar permissões do utilizador logado.
 *
 * - Admin/manager → sempre true
 * - Sem row de permissão → true (retrocompatível)
 * - Com row → verifica pode_ver/pode_criar/pode_editar
 */
export function usePermissions() {
  const { data } = useMyPermissions();

  const permMap = useMemo(() => {
    const map = new Map<string, { pode_ver: boolean; pode_criar: boolean; pode_editar: boolean }>();
    if (data?.permissoes) {
      for (const p of data.permissoes) {
        map.set(p.modulo, { pode_ver: p.pode_ver, pode_criar: p.pode_criar, pode_editar: p.pode_editar });
      }
    }
    return map;
  }, [data]);

  // Get user role from localStorage JWT
  const role = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return 'funcionario';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'funcionario';
    } catch {
      return 'funcionario';
    }
  }, []);

  const isAdminOrManager = role === 'admin' || role === 'manager';

  const canView = (modulo: string): boolean => {
    if (isAdminOrManager) return true;
    const perm = permMap.get(modulo);
    // Sem row → acesso total (retrocompatível)
    if (!perm) return true;
    return perm.pode_ver;
  };

  const canCreate = (modulo: string): boolean => {
    if (isAdminOrManager) return true;
    const perm = permMap.get(modulo);
    if (!perm) return true;
    return perm.pode_criar;
  };

  const canEdit = (modulo: string): boolean => {
    if (isAdminOrManager) return true;
    const perm = permMap.get(modulo);
    if (!perm) return true;
    return perm.pode_editar;
  };

  return { canView, canCreate, canEdit, isAdminOrManager, role };
}
