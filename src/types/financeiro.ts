// ============================
// Transacao Financeira
// ============================

export type TipoTransacao = 'custo' | 'pagamento' | 'reembolso' | 'honorario' | 'despesa';
export type EstadoReconciliacao = 'pendente' | 'reconciliado' | 'parcial';
export type MetodoPagamento = 'dinheiro' | 'mb' | 'transferencia' | 'cheque' | 'outro';

export interface TransacaoAnexo {
  id: number;
  nome_original: string;
  tipo?: string;
  criado_em: string;
}

export interface TransacaoFinanceira {
  id: number;
  processo_id?: number | null;
  cliente_id: number;
  tipo: TipoTransacao;
  valor: number;
  descricao?: string;
  data?: string;
  metodo_pagamento?: MetodoPagamento;
  referencia?: string;
  estado_reconciliacao: EstadoReconciliacao;
  caixa_movimento_id?: number;
  tarefa_id?: number;
  transacao_original_id?: number;
  criado_por_id?: number;
  criado_em: string;
  atualizado_em?: string;
  toconline_doc_id?: string;
  toconline_estado?: string;
  registo_predial_id?: number | null;
  anexos: TransacaoAnexo[];
}

export interface TransacaoFinanceiraCreate {
  processo_id?: number | null;
  cliente_id: number;
  tipo: TipoTransacao;
  valor: number;
  descricao?: string;
  data?: string;
  metodo_pagamento?: MetodoPagamento;
  referencia?: string;
  tarefa_id?: number;
  transacao_original_id?: number;
  criado_por_id?: number;
  gerar_movimento_caixa?: boolean;
  dias_lembrete?: number;
  registo_predial_id?: number | null;
}

export interface TransacaoFinanceiraUpdate {
  tipo?: TipoTransacao;
  valor?: number;
  descricao?: string;
  data?: string;
  metodo_pagamento?: MetodoPagamento;
  referencia?: string;
  estado_reconciliacao?: EstadoReconciliacao;
}

// ============================
// Conta Corrente
// ============================

export interface ContaCorrenteProcesso {
  processo_id: number;
  processo_titulo: string;
  total_custos: number;
  total_pagamentos: number;
  total_reembolsos: number;
  saldo: number;
}

export interface ContaCorrenteCliente {
  cliente_id: number;
  cliente_nome: string;
  processos: ContaCorrenteProcesso[];
  total_custos: number;
  total_pagamentos: number;
  total_reembolsos: number;
  saldo_total: number;
}

export interface ResumoFinanceiroProcesso {
  processo_id: number;
  total_custos: number;
  total_pagamentos: number;
  total_reembolsos: number;
  saldo: number;
  transacoes: TransacaoFinanceira[];
}

export interface ResumoGeral {
  total_custos: number;
  total_pagamentos: number;
  total_reembolsos: number;
  saldo_total: number;
  total_clientes_com_saldo: number;
}

// ============================
// Movimento Bancario
// ============================

export interface MovimentoBancario {
  id: number;
  data: string;
  data_valor?: string;
  descricao?: string;
  valor: number;
  saldo?: number;
  referencia?: string;
  reconciliado: boolean;
  transacao_id?: number;
  importado_em: string;
}

export interface ReconciliacaoRequest {
  movimento_bancario_id: number;
  transacao_id: number;
}

// ============================
// Email Cobranca
// ============================

export interface EmailCobrancaCreate {
  cliente_id: number;
  destinatario: string;
  processos_ids?: number[];
  assunto?: string;
  conteudo?: string;
}

// ============================
// TOConline
// ============================

export interface TOConlineConfig {
  configurado: boolean;
  ambiente: string;
  mensagem?: string;
  api_key?: string;
  empresa_id?: string;
}

export interface EmailCobranca {
  id: number;
  cliente_id: number;
  destinatario: string;
  assunto: string;
  valor_total?: number;
  processos_ids?: string;
  enviado_em: string;
  estado: string;
}

// ============================
// Cobranca Preview
// ============================

export interface CobrancaPreview {
  destinatario: string;
  assunto: string;
  corpo: string;
  conteudo?: string;
  valor_total: number;
}
