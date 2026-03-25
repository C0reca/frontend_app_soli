import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface RegistoAutomovel {
  id: number;
  entidade_id?: number;
  comprador_id?: number;
  vendedor_id?: number;
  tipo: string;
  pago_por?: string;
  estado_pagamento: string;
  estado: string;
  stand_semana_id?: number;
  outras_observacoes?: string;
  data_criacao?: string;
  criado_por_id?: number;

  // Pedido
  numero_pedido?: string;
  data_pedido?: string;
  data_publicacao?: string;
  data_venda_facto?: string;
  data_contrato?: string;

  // Ato
  numero_apresentacao?: string;
  data_apresentacao?: string;
  numero_conta?: string;
  valor?: number;
  despacho?: string;

  // Emolumentos
  emolumento_valor?: number;
  agravamento_valor?: number;
  reducao_valor?: number;

  // Pagamento IRN
  entidade_pagamento?: string;
  referencia_pagamento?: string;
  montante?: number;
  valor_pago?: number;
  data_limite_pagamento?: string;
  data_pagamento?: string;

  // Veiculo
  matricula?: string;
  marca?: string;
  quota_parte?: string;
  quadro_numero?: string;

  // Atos requeridos
  registo_inicial_propriedade?: boolean;
  procedimento_especial?: boolean;
  transferencia_locacao?: boolean;
  declaracao_compra_venda?: boolean;
  reserva_propriedade?: boolean;
  rent_a_car?: boolean;
  locacao_financeira?: boolean;
  hipoteca?: boolean;
  penhora?: boolean;
  arresto?: boolean;
  usufruto?: boolean;
  extincao_registo?: boolean;
  mudanca_residencia?: boolean;
  alteracao_nome?: boolean;
  pedido_2via?: boolean;
  conversao_arresto_penhora?: boolean;
  conversao_registo?: boolean;
  apreensao?: boolean;
  acao?: boolean;

  // Extras atos
  quantia_reserva?: number;
  clausula_penal?: string;
  outras_causas_indicar?: string;
  locacao_inicio?: string;
  locacao_fim?: string;
  hipoteca_quantia?: number;
  hipoteca_tribunal_processo?: string;

  // Sujeito Ativo
  sa_nome?: string;
  sa_nif?: string;
  sa_morada?: string;
  sa_codigo_postal?: string;
  sa_localidade?: string;
  sa_doc_identificacao?: string;
  sa_numero_identificacao?: string;
  sa_certidao_online?: string;
  sa_email?: string;
  sa_telemovel?: string;

  // Sujeito Passivo
  sp_nome?: string;
  sp_nif?: string;
  sp_morada?: string;
  sp_codigo_postal?: string;
  sp_localidade?: string;
  sp_doc_identificacao?: string;
  sp_numero_identificacao?: string;
  sp_certidao_online?: string;
  sp_email?: string;
  sp_telemovel?: string;

  // Declaracoes
  declaracao_vendedor_confirma?: boolean;
  declaracao_entrega_exemplar?: boolean;
  declaracao_aprovacao_sp?: boolean;

  // Relationships
  entidade?: { id: number; nome: string; nif?: string };
  comprador?: { id: number; nome: string; nif?: string };
  vendedor?: { id: number; nome: string; nif?: string };
  criado_por?: { id: number; nome: string };
  anexos?: { id: number; registo_automovel_id: number; nome_original: string; tipo?: string; criado_em?: string }[];
}

export const useRegistosAutomoveis = (params?: {
  search?: string;
  tipo?: string;
  estado_pagamento?: string;
  data_inicio?: string;
  data_fim?: string;
  stand_entidade_id?: number;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: registos = [], isLoading, error } = useQuery({
    queryKey: ['registos-automoveis', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.set('search', params.search);
      if (params?.tipo) queryParams.set('tipo', params.tipo);
      if (params?.estado_pagamento) queryParams.set('estado_pagamento', params.estado_pagamento);
      if (params?.data_inicio) queryParams.set('data_inicio', params.data_inicio);
      if (params?.data_fim) queryParams.set('data_fim', params.data_fim);
      if (params?.stand_entidade_id) queryParams.set('stand_entidade_id', params.stand_entidade_id.toString());
      const qs = queryParams.toString();
      const response = await api.get(`/registos-automoveis${qs ? `?${qs}` : ''}`);
      return response.data || [];
    },
  });

  const createRegisto = useMutation({
    mutationFn: async (registo: Partial<RegistoAutomovel>) => {
      const response = await api.post('/registos-automoveis', registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      queryClient.invalidateQueries({ queryKey: ['stand-semanas'] });
      toast({ title: "Registo criado", description: "O registo automóvel foi criado com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro ao criar registo", description: "Não foi possível criar o registo automóvel.", variant: "destructive" });
    },
  });

  const updateRegisto = useMutation({
    mutationFn: async ({ id, ...registo }: Partial<RegistoAutomovel> & { id: number }) => {
      const response = await api.put(`/registos-automoveis/${id}`, registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      toast({ title: "Registo atualizado", description: "As alterações ao registo foram guardadas." });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar registo", description: "Não foi possível guardar as alterações.", variant: "destructive" });
    },
  });

  const deleteRegisto = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/registos-automoveis/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      queryClient.invalidateQueries({ queryKey: ['stand-semanas'] });
      toast({ title: "Registo eliminado", description: "O registo automóvel foi removido." });
    },
    onError: () => {
      toast({ title: "Erro ao eliminar registo", description: "Não foi possível remover o registo.", variant: "destructive" });
    },
  });

  const importPdf = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/registos-automoveis/importar-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onError: () => {
      toast({ title: "Erro ao importar PDF", description: "Não foi possível extrair os dados do PDF.", variant: "destructive" });
    },
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({ registoId, file, tipo }: { registoId: number; file: File; tipo?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      const params = tipo ? `?tipo=${tipo}` : '';
      const response = await api.post(`/registos-automoveis/${registoId}/anexo${params}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
    },
    onError: () => {
      toast({ title: "Erro ao carregar anexo", description: "Não foi possível enviar o ficheiro.", variant: "destructive" });
    },
  });

  const changeEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: string }) => {
      const response = await api.patch(`/registos-automoveis/${id}/estado?estado=${estado}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
    },
    onError: () => {
      toast({ title: "Erro ao alterar estado", description: "Não foi possível alterar o estado do registo.", variant: "destructive" });
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async ({ registoId, anexoId }: { registoId: number; anexoId: number }) => {
      await api.delete(`/registos-automoveis/${registoId}/anexo/${anexoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      toast({ title: "Anexo eliminado", description: "O ficheiro foi removido do registo." });
    },
    onError: () => {
      toast({ title: "Erro ao eliminar anexo", description: "Não foi possível remover o ficheiro.", variant: "destructive" });
    },
  });

  const togglePagamento = useMutation({
    mutationFn: async ({ id, pago }: { id: number; pago: boolean }) => {
      const endpoint = pago
        ? `/registos-automoveis/${id}/marcar-pago`
        : `/registos-automoveis/${id}/marcar-pendente`;
      const response = await api.patch(endpoint);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['auto-financeiro-dashboard'] });
      toast({
        title: variables.pago ? "Pagamento confirmado" : "Pagamento revertido",
        description: variables.pago ? "O registo foi marcado como pago." : "O registo foi marcado como pendente.",
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Erro ao alterar estado de pagamento.";
      toast({ title: "Erro ao alterar pagamento", description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: "destructive" });
    },
  });

  return {
    registos,
    isLoading,
    error,
    createRegisto,
    updateRegisto,
    deleteRegisto,
    importPdf,
    uploadAnexo,
    deleteAnexo,
    changeEstado,
    togglePagamento,
  };
};
