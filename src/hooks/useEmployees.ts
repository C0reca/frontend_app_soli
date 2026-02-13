
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export type EmployeeRole = 'admin' | 'manager' | 'funcionario';

export interface Employee {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  cor?: string;
  role: EmployeeRole;
  is_active: boolean;
  criado_em: string;
}

interface CreateEmployeePayload {
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  cor?: string;
  role: EmployeeRole;
  is_active: boolean;
  senha: string;
}

interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> {
  id: number;
  senha?: string;
}

export interface EmployeeListItem {
  id: number;
  nome: string;
  cor?: string;
}

/**
 * Hook leve para dropdowns de seleção de funcionário.
 * Usa GET /funcionarios/lista — acessível a qualquer utilizador autenticado.
 */
export const useEmployeeList = () => {
  return useQuery<EmployeeListItem[]>({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const response = await api.get('/funcionarios/lista');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
};

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const {
    data: employees = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/funcionarios');
      return response.data;
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (employee: CreateEmployeePayload) => {
      const response = await api.post('/funcionarios', employee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...employee }: UpdateEmployeePayload) => {
      const response = await api.put(`/funcionarios/${id}`, employee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/funcionarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
