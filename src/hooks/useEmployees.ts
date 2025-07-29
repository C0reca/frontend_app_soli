
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export const useEmployees = () => {
  const queryClient = useQueryClient();

  const {
    data: employees = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get('/funcionarios/');
      return response.data;
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
      const response = await api.post('/funcionarios', employee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...employee }: Partial<Employee> & { id: string }) => {
      const response = await api.put(`/funcionarios/${id}`, employee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
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
