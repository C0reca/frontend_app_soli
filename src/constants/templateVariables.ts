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

export const TEMPLATE_VARIABLES: TemplateVariableGroup[] = [
  {
    grupo: 'Entidade',
    prefixo: 'entidade',
    campos: [
      { campo: 'nome', label: 'Nome', tipo: 'texto' },
      { campo: 'designacao', label: 'Designação', tipo: 'texto' },
      { campo: 'email', label: 'Email', tipo: 'texto' },
      { campo: 'telefone', label: 'Telefone', tipo: 'texto' },
      { campo: 'morada', label: 'Morada (rua)', tipo: 'texto' },
      { campo: 'codigo_postal', label: 'Código Postal', tipo: 'texto' },
      { campo: 'localidade', label: 'Localidade', tipo: 'texto' },
      { campo: 'distrito', label: 'Distrito', tipo: 'texto' },
      { campo: 'pais', label: 'País', tipo: 'texto' },
      { campo: 'morada_completa', label: 'Morada Completa', tipo: 'texto' },
      { campo: 'nif', label: 'NIF', tipo: 'texto' },
      { campo: 'data_nascimento', label: 'Data de Nascimento', tipo: 'data' },
      { campo: 'estado_civil', label: 'Estado Civil', tipo: 'texto' },
      { campo: 'profissao', label: 'Profissão', tipo: 'texto' },
      { campo: 'num_cc', label: 'N.º Cartão de Cidadão', tipo: 'texto' },
      { campo: 'validade_cc', label: 'Validade CC', tipo: 'data' },
      { campo: 'num_ss', label: 'N.º Segurança Social', tipo: 'texto' },
      { campo: 'num_sns', label: 'N.º SNS', tipo: 'texto' },
      { campo: 'num_ident_civil', label: 'N.º Identificação Civil', tipo: 'texto' },
      { campo: 'nacionalidade', label: 'Nacionalidade', tipo: 'texto' },
      { campo: 'nome_empresa', label: 'Nome Empresa', tipo: 'texto' },
      { campo: 'nif_empresa', label: 'NIF Empresa', tipo: 'texto' },
      { campo: 'forma_juridica', label: 'Forma Jurídica', tipo: 'texto' },
      { campo: 'data_constituicao', label: 'Data Constituição', tipo: 'data' },
      { campo: 'registo_comercial', label: 'Registo Comercial', tipo: 'texto' },
      { campo: 'cae', label: 'CAE', tipo: 'texto' },
      { campo: 'capital_social', label: 'Capital Social', tipo: 'texto' },
      { campo: 'representante_nome', label: 'Representante - Nome', tipo: 'texto' },
      { campo: 'representante_nif', label: 'Representante - NIF', tipo: 'texto' },
      { campo: 'representante_email', label: 'Representante - Email', tipo: 'texto' },
      { campo: 'representante_telemovel', label: 'Representante - Telemóvel', tipo: 'texto' },
      { campo: 'representante_cargo', label: 'Representante - Cargo', tipo: 'texto' },
      { campo: 'iban', label: 'IBAN', tipo: 'texto' },
      { campo: 'certidao_permanente', label: 'Certidão Permanente', tipo: 'texto' },
      { campo: 'observacoes', label: 'Observações', tipo: 'texto' },
      { campo: 'incapacidade', label: 'Incapacidade (%)', tipo: 'numero' },
    ],
  },
  {
    grupo: 'Processo',
    prefixo: 'processo',
    campos: [
      { campo: 'titulo', label: 'Título', tipo: 'texto' },
      { campo: 'descricao', label: 'Descrição', tipo: 'texto' },
      { campo: 'tipo', label: 'Tipo', tipo: 'texto' },
      { campo: 'onde_estao', label: 'Onde Estão', tipo: 'texto' },
      { campo: 'estado', label: 'Estado', tipo: 'texto' },
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
