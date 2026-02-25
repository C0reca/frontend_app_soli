export interface TemplateVariableField {
  campo: string;
  label: string;
  tipo: 'texto' | 'data' | 'numero';
}

export interface TemplateVariableGroup {
  grupo: string;
  prefixo: string;
  campos: TemplateVariableField[];
}

// Campos comuns a entidade principal e secundárias
const ENTIDADE_CAMPOS_BASE: TemplateVariableField[] = [
  // Dados comuns
  { campo: 'tipo', label: 'Tipo (singular/coletivo)', tipo: 'texto' },
  { campo: 'nome', label: 'Nome', tipo: 'texto' },
  { campo: 'designacao', label: 'Designação', tipo: 'texto' },
  { campo: 'email', label: 'Email', tipo: 'texto' },
  { campo: 'telefone', label: 'Telefone', tipo: 'texto' },

  // Morada
  { campo: 'morada', label: 'Morada (rua)', tipo: 'texto' },
  { campo: 'codigo_postal', label: 'Código Postal', tipo: 'texto' },
  { campo: 'localidade', label: 'Freguesia', tipo: 'texto' },
  { campo: 'concelho', label: 'Concelho', tipo: 'texto' },
  { campo: 'distrito', label: 'Distrito', tipo: 'texto' },
  { campo: 'pais', label: 'País', tipo: 'texto' },
  { campo: 'morada_completa', label: 'Morada Completa', tipo: 'texto' },

  // Pessoa Singular
  { campo: 'nif', label: 'NIF', tipo: 'texto' },
  { campo: 'data_nascimento', label: 'Data de Nascimento', tipo: 'data' },
  { campo: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
  { campo: 'profissao', label: 'Profissão', tipo: 'texto' },
  { campo: 'naturalidade_freguesia', label: 'Naturalidade (Freguesia)', tipo: 'texto' },
  { campo: 'naturalidade_concelho', label: 'Naturalidade (Concelho)', tipo: 'texto' },
  { campo: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto' },
  { campo: 'num_cc', label: 'N.º Cartão de Cidadão', tipo: 'texto' },
  { campo: 'validade_cc', label: 'Validade CC', tipo: 'data' },
  { campo: 'num_ss', label: 'N.º Segurança Social', tipo: 'texto' },
  { campo: 'num_sns', label: 'N.º SNS', tipo: 'texto' },
  { campo: 'num_ident_civil', label: 'N.º Identificação Civil', tipo: 'texto' },
  { campo: 'incapacidade', label: 'Incapacidade (%)', tipo: 'numero' },

  // Pessoa Coletiva
  { campo: 'nome_empresa', label: 'Nome Empresa', tipo: 'texto' },
  { campo: 'nif_empresa', label: 'NIF Empresa', tipo: 'texto' },
  { campo: 'forma_juridica', label: 'Forma Jurídica', tipo: 'texto' },
  { campo: 'data_constituicao', label: 'Data Constituição', tipo: 'data' },
  { campo: 'registo_comercial', label: 'Registo Comercial', tipo: 'texto' },
  { campo: 'cae', label: 'CAE', tipo: 'texto' },
  { campo: 'capital_social', label: 'Capital Social', tipo: 'texto' },
  { campo: 'codigo_rcbe', label: 'Código RCBE', tipo: 'texto' },

  // Representante legal (campos diretos do cliente)
  { campo: 'representante_nome', label: 'Representante - Nome', tipo: 'texto' },
  { campo: 'representante_nif', label: 'Representante - NIF', tipo: 'texto' },
  { campo: 'representante_email', label: 'Representante - Email', tipo: 'texto' },
  { campo: 'representante_telemovel', label: 'Representante - Telemóvel', tipo: 'texto' },
  { campo: 'representante_cargo', label: 'Representante - Cargo', tipo: 'texto' },

  // Sócios/Representantes legais (da relação representantes)
  { campo: 'representante_1_nome', label: 'Sócio 1 - Nome', tipo: 'texto' },
  { campo: 'representante_1_nif', label: 'Sócio 1 - NIF', tipo: 'texto' },
  { campo: 'representante_1_email', label: 'Sócio 1 - Email', tipo: 'texto' },
  { campo: 'representante_1_telemovel', label: 'Sócio 1 - Telemóvel', tipo: 'texto' },
  { campo: 'representante_1_cargo', label: 'Sócio 1 - Cargo', tipo: 'texto' },
  { campo: 'representante_1_quota', label: 'Sócio 1 - Quota (valor e tipo)', tipo: 'texto' },
  { campo: 'representante_1_quota_valor', label: 'Sócio 1 - Quota (valor)', tipo: 'texto' },
  { campo: 'representante_1_quota_percentagem', label: 'Sócio 1 - Quota (%)', tipo: 'texto' },

  { campo: 'representante_2_nome', label: 'Sócio 2 - Nome', tipo: 'texto' },
  { campo: 'representante_2_nif', label: 'Sócio 2 - NIF', tipo: 'texto' },
  { campo: 'representante_2_email', label: 'Sócio 2 - Email', tipo: 'texto' },
  { campo: 'representante_2_telemovel', label: 'Sócio 2 - Telemóvel', tipo: 'texto' },
  { campo: 'representante_2_cargo', label: 'Sócio 2 - Cargo', tipo: 'texto' },
  { campo: 'representante_2_quota', label: 'Sócio 2 - Quota (valor e tipo)', tipo: 'texto' },
  { campo: 'representante_2_quota_valor', label: 'Sócio 2 - Quota (valor)', tipo: 'texto' },
  { campo: 'representante_2_quota_percentagem', label: 'Sócio 2 - Quota (%)', tipo: 'texto' },

  { campo: 'representante_3_nome', label: 'Sócio 3 - Nome', tipo: 'texto' },
  { campo: 'representante_3_nif', label: 'Sócio 3 - NIF', tipo: 'texto' },
  { campo: 'representante_3_email', label: 'Sócio 3 - Email', tipo: 'texto' },
  { campo: 'representante_3_telemovel', label: 'Sócio 3 - Telemóvel', tipo: 'texto' },
  { campo: 'representante_3_cargo', label: 'Sócio 3 - Cargo', tipo: 'texto' },
  { campo: 'representante_3_quota', label: 'Sócio 3 - Quota (valor e tipo)', tipo: 'texto' },
  { campo: 'representante_3_quota_valor', label: 'Sócio 3 - Quota (valor)', tipo: 'texto' },
  { campo: 'representante_3_quota_percentagem', label: 'Sócio 3 - Quota (%)', tipo: 'texto' },

  { campo: 'representante_4_nome', label: 'Sócio 4 - Nome', tipo: 'texto' },
  { campo: 'representante_4_nif', label: 'Sócio 4 - NIF', tipo: 'texto' },
  { campo: 'representante_4_email', label: 'Sócio 4 - Email', tipo: 'texto' },
  { campo: 'representante_4_telemovel', label: 'Sócio 4 - Telemóvel', tipo: 'texto' },
  { campo: 'representante_4_cargo', label: 'Sócio 4 - Cargo', tipo: 'texto' },
  { campo: 'representante_4_quota', label: 'Sócio 4 - Quota (valor e tipo)', tipo: 'texto' },
  { campo: 'representante_4_quota_valor', label: 'Sócio 4 - Quota (valor)', tipo: 'texto' },
  { campo: 'representante_4_quota_percentagem', label: 'Sócio 4 - Quota (%)', tipo: 'texto' },

  // Documentos e outros
  { campo: 'iban', label: 'IBAN', tipo: 'texto' },
  { campo: 'certidao_permanente', label: 'Certidão Permanente', tipo: 'texto' },
  { campo: 'observacoes', label: 'Observações', tipo: 'texto' },
];

const ENTIDADE_SEC_CAMPOS: TemplateVariableField[] = [
  { campo: 'tipo_participacao', label: 'Tipo de Participação', tipo: 'texto' },
  ...ENTIDADE_CAMPOS_BASE,
];

function gerarGruposEntidadesSecundarias(count: number): TemplateVariableGroup[] {
  return Array.from({ length: count }, (_, i) => ({
    grupo: `Entidade Secundária ${i + 1}`,
    prefixo: `entidade_sec_${i + 1}`,
    campos: ENTIDADE_SEC_CAMPOS,
  }));
}

export const TEMPLATE_VARIABLES: TemplateVariableGroup[] = [
  {
    grupo: 'Entidade',
    prefixo: 'entidade',
    campos: ENTIDADE_CAMPOS_BASE,
  },
  ...gerarGruposEntidadesSecundarias(3),
  {
    grupo: 'Processo',
    prefixo: 'processo',
    campos: [
      { campo: 'titulo', label: 'Título', tipo: 'texto' },
      { campo: 'descricao', label: 'Descrição', tipo: 'texto' },
      { campo: 'tipo', label: 'Tipo', tipo: 'texto' },
      { campo: 'onde_estao', label: 'Onde Estão', tipo: 'texto' },
      { campo: 'estado', label: 'Estado', tipo: 'texto' },
      { campo: 'valor', label: 'Valor', tipo: 'numero' },
      { campo: 'criado_em', label: 'Data de Criação', tipo: 'data' },
    ],
  },
  {
    grupo: 'Dossiê',
    prefixo: 'dossie',
    campos: [
      { campo: 'numero', label: 'Número', tipo: 'texto' },
      { campo: 'nome', label: 'Nome', tipo: 'texto' },
      { campo: 'descricao', label: 'Descrição', tipo: 'texto' },
    ],
  },
  {
    grupo: 'Funcionário',
    prefixo: 'funcionario',
    campos: [
      { campo: 'nome', label: 'Nome', tipo: 'texto' },
      { campo: 'email', label: 'Email', tipo: 'texto' },
      { campo: 'cargo', label: 'Cargo', tipo: 'texto' },
      { campo: 'departamento', label: 'Departamento', tipo: 'texto' },
      { campo: 'telefone', label: 'Telefone', tipo: 'texto' },
    ],
  },
  {
    grupo: 'Sistema',
    prefixo: 'sistema',
    campos: [
      { campo: 'data_hoje', label: 'Data de Hoje', tipo: 'data' },
      { campo: 'dia', label: 'Dia', tipo: 'numero' },
      { campo: 'mes', label: 'Mês (número)', tipo: 'numero' },
      { campo: 'mes_nome', label: 'Mês (nome)', tipo: 'texto' },
      { campo: 'ano', label: 'Ano', tipo: 'numero' },
      { campo: 'hora', label: 'Hora', tipo: 'texto' },
      { campo: 'dia_semana', label: 'Dia da Semana', tipo: 'texto' },
      { campo: 'data_extenso', label: 'Data por Extenso', tipo: 'texto' },
      { campo: 'ano_corrente', label: 'Ano Corrente', tipo: 'numero' },
    ],
  },
];
