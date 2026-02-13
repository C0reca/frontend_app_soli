import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

interface Profile {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  telefone?: string;
  cor?: string;
  role: string;
  criado_em?: string;
  last_login?: string;
}

interface ProfileUpdate {
  nome?: string;
  email?: string;
  telefone?: string;
  cor?: string;
}

interface PasswordChange {
  senha_atual: string;
  nova_senha: string;
}

export function useProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/perfil');
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (dados: ProfileUpdate) => {
      const { data } = await api.put('/perfil', dados);
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (dados: PasswordChange) => {
      const { data } = await api.put('/perfil/password', dados);
      return data;
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
    changePassword,
  };
}
