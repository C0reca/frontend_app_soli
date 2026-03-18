import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Layers, ShieldCheck, FileCheck, Lock, CheckSquare, ArrowRight,
  ChevronDown, ChevronRight, Search, Workflow, FileText, Users,
  Settings, FolderOpen, Briefcase, Bot,
} from 'lucide-react';

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  badge?: string;
  content: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: 'tipos-processo',
    icon: Layers,
    title: 'Tipos de Processo',
    badge: 'Base',
    content: (
      <div className="space-y-3 text-sm">
        <p>Os <strong>Tipos de Processo</strong> são templates configuráveis que definem como cada tipo de trabalho funciona no escritório.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como criar um Tipo de Processo:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Ir a <strong>Templates</strong> na barra lateral</li>
            <li>Clicar em <strong>"Novo Tipo"</strong></li>
            <li>Definir o nome (ex: "DPA - Compra e Venda de Imóvel")</li>
            <li>Configurar as 5 abas: Wizard, Workflow, Checklist/Tarefas, Orçamento, Documentos</li>
            <li>Guardar</li>
          </ol>
        </div>
        <p>Quando um utilizador cria um novo processo e escolhe este tipo, o sistema aplica automaticamente toda a configuração: checklist, tarefas, documentos, orçamento e validações.</p>
      </div>
    ),
  },
  {
    id: 'wizard',
    icon: Workflow,
    title: 'Wizard de Criação (Blocos)',
    content: (
      <div className="space-y-3 text-sm">
        <p>O <strong>Wizard</strong> define o formulário passo a passo que aparece quando se cria um processo deste tipo.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como funciona:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Blocos disponíveis</strong> — arrastar campos da paleta para os passos (cliente, título, descrição, estado, responsável, titular, valor, localização)</li>
            <li><strong>Passos</strong> — criar vários passos com nomes personalizados (ex: "Partes", "Imóvel", "Fiscalidade")</li>
            <li><strong>Campos personalizados</strong> — criar campos extras como texto, número, data, lista ou área de texto</li>
            <li><strong>Obrigatório/Opcional</strong> — definir quais campos são obrigatórios em cada passo</li>
          </ul>
        </div>
        <div className="border-l-4 border-blue-400 pl-3 text-muted-foreground">
          <strong>Exemplo prático:</strong> Para um DPA de Compra e Venda, criar 4 passos: "Entidade e Arquivo" → "Dados do Imóvel" (campos custom: descrição predial, artigo matricial) → "Fiscalidade" (campos: IMT, IS) → "Condições" (valor, observações).
        </div>
      </div>
    ),
  },
  {
    id: 'workflow',
    icon: ArrowRight,
    title: 'Workflow (Estados Personalizados)',
    badge: 'Novo',
    content: (
      <div className="space-y-3 text-sm">
        <p>O <strong>Workflow</strong> define os estados pelos quais um processo passa, do início ao fim.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como configurar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Na aba <strong>"Workflow"</strong> do tipo de processo, secção <strong>"Estados Workflow"</strong></li>
            <li>Adicionar estados por ordem (ex: Rascunho → Em Validação → Validado → Autenticado → Registado)</li>
            <li>Reordenar com as setas</li>
          </ol>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como funciona no processo:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Ao criar o processo, o estado começa no primeiro da lista</li>
            <li>Na aba <strong>"Workflow"</strong> do processo, clicar num estado para avançar</li>
            <li>Se houver bloqueios configurados, o sistema impede o avanço e mostra o motivo</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'validacoes',
    icon: ShieldCheck,
    title: 'Regras de Validação',
    badge: 'Novo',
    content: (
      <div className="space-y-3 text-sm">
        <p>As <strong>Regras de Validação</strong> são itens que devem ser verificados durante o processo. Cada regra fica com um semáforo visual.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Categorias disponíveis:</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Identidade</Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">Poderes/Representação</Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Fiscal</Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">Registral</Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Compliance/AML</Badge>
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 text-xs">Documental</Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">Geral</Badge>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Semáforo:</p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-yellow-400 inline-block" /> <strong>Pendente</strong> — ainda não verificado</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500 inline-block" /> <strong>Validado</strong> — verificado e conforme</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500 inline-block" /> <strong>Rejeitado</strong> — problema identificado</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-gray-300 inline-block" /> <strong>N/A</strong> — não aplicável a este processo</div>
          </div>
        </div>
        <div className="border-l-4 border-purple-400 pl-3 text-muted-foreground">
          <strong>Regras condicionais:</strong> Pode definir que uma regra só aparece se um campo personalizado tiver um valor específico. Exemplo: "Consentimento conjugal" só aparece se o campo "Estado Civil" = "Casado".
        </div>
      </div>
    ),
  },
  {
    id: 'docs-obrigatorios',
    icon: FileCheck,
    title: 'Documentos Obrigatórios',
    badge: 'Novo',
    content: (
      <div className="space-y-3 text-sm">
        <p>Define quais documentos devem estar anexados ao processo antes de poder avançar para um determinado estado.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como configurar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Na aba Workflow → secção <strong>"Docs Obrigatórios"</strong></li>
            <li>Adicionar documento: nome, keyword de verificação, e para que estado é obrigatório</li>
          </ol>
        </div>
        <div className="border-l-4 border-amber-400 pl-3 text-muted-foreground">
          <strong>Como funciona a verificação:</strong> O sistema procura nos documentos anexados ao processo se algum contém a keyword no nome do ficheiro. Exemplo: keyword "certidão" verifica se existe um documento cujo nome contenha "certidão".
        </div>
      </div>
    ),
  },
  {
    id: 'bloqueios',
    icon: Lock,
    title: 'Bloqueios de Avanço',
    badge: 'Novo',
    content: (
      <div className="space-y-3 text-sm">
        <p>Os <strong>Bloqueios</strong> impedem que um processo avance para um estado sem cumprir determinadas condições.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">3 tipos de bloqueio:</p>
          <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
            <li><strong>Checklist 100% completa</strong> — todos os itens da checklist têm de estar concluídos</li>
            <li><strong>Todas as validações concluídas</strong> — todas as regras de validação devem estar "Validado" ou "N/A"</li>
            <li><strong>Documentos obrigatórios anexados</strong> — todos os docs obrigatórios devem estar presentes</li>
          </ul>
        </div>
        <div className="border-l-4 border-red-400 pl-3 text-muted-foreground">
          <strong>Exemplo:</strong> Configurar "Todas as validações concluídas" para bloquear o estado "Autenticado". Assim, o processo não pode ser autenticado enquanto houver validações pendentes (identidade, fiscal, etc.).
        </div>
      </div>
    ),
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    title: 'Checklist Automática',
    content: (
      <div className="space-y-3 text-sm">
        <p>Cada tipo de processo pode ter uma <strong>checklist predefinida</strong> que é criada automaticamente quando o processo é aberto.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como usar:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Configurar itens na aba "Checklist/Tarefas" do tipo de processo</li>
            <li>Ao criar um processo com este tipo, os itens são criados automaticamente</li>
            <li>Na aba "Geral" do processo, marcar cada item como concluído</li>
            <li>O sistema regista quem concluiu e quando</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'documentos-auto',
    icon: FileText,
    title: 'Documentos Automáticos',
    content: (
      <div className="space-y-3 text-sm">
        <p>Templates de documentos associados ao tipo de processo são <strong>gerados automaticamente</strong> quando o processo é criado.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como funciona:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Criar templates em <strong>Templates Docs</strong> com variáveis (ex: {"{{entidade.nome}}"})</li>
            <li>Associar templates ao tipo de processo na aba "Documentos"</li>
            <li>Ao criar um processo, os documentos são gerados com os dados preenchidos</li>
            <li>Os documentos ficam na aba "Documentos" do processo</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: 'responsavel-titular',
    icon: Users,
    title: 'Responsável e Titular',
    content: (
      <div className="space-y-3 text-sm">
        <p>Cada processo pode ter um <strong>Responsável</strong> (quem trata) e um <strong>Titular</strong> (quem é dono/supervisor).</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como alterar:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Na aba "Geral" dos detalhes do processo</li>
            <li>Usar os dropdowns de <strong>Responsável</strong> e <strong>Titular</strong></li>
            <li>A alteração é guardada automaticamente ao selecionar</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'ia',
    icon: Bot,
    title: 'Assistente IA',
    content: (
      <div className="space-y-3 text-sm">
        <p>O <strong>Assistente IA</strong> é um chat contextual que conhece o processo, o cliente e toda a informação associada.</p>
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="font-medium">Como usar:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Abrir os detalhes de um processo</li>
            <li>Clicar no botão <strong>IA</strong> (ícone de robot) no cabeçalho</li>
            <li>O chat abre ao lado do processo</li>
            <li>Usar as sugestões rápidas ou escrever uma pergunta</li>
          </ul>
        </div>
        <p className="text-muted-foreground">Exemplos: "Quais são os próximos passos?", "Que documentos faltam?", "Resume este processo".</p>
      </div>
    ),
  },
  {
    id: 'exemplo-dpa',
    icon: Briefcase,
    title: 'Exemplo: DPA Compra e Venda',
    badge: 'Exemplo',
    content: (
      <div className="space-y-3 text-sm">
        <p>Exemplo completo de como configurar um tipo "DPA - Compra e Venda de Imóvel":</p>

        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-blue-900">1. Wizard (4 passos):</p>
          <ul className="list-disc list-inside text-blue-800 text-xs space-y-0.5">
            <li>Passo 1 "Partes": cliente, título, responsável, titular</li>
            <li>Passo 2 "Imóvel": campos custom — descrição predial, artigo matricial, licença utilização</li>
            <li>Passo 3 "Fiscalidade": campos custom — IMT pago (sim/não), valor IMT, IS pago</li>
            <li>Passo 4 "Condições": valor, descrição, observações</li>
          </ul>
        </div>

        <div className="bg-green-50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-green-900">2. Workflow (5 estados):</p>
          <p className="text-green-800 text-xs">Rascunho → Em Validação → Validado → Autenticado → Registado</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-purple-900">3. Regras de Validação:</p>
          <ul className="list-disc list-inside text-purple-800 text-xs space-y-0.5">
            <li>[Identidade] Identidade do comprador verificada</li>
            <li>[Identidade] Identidade do vendedor verificada</li>
            <li>[Poderes] Certidão permanente da sociedade (se aplicável)</li>
            <li>[Poderes] Consentimento conjugal (condição: estado_civil = casado)</li>
            <li>[Fiscal] IMT liquidado e comprovativo anexado</li>
            <li>[Fiscal] Imposto do Selo liquidado</li>
            <li>[Registral] Descrição predial confirmada</li>
            <li>[Registral] Certificado energético válido</li>
            <li>[Compliance] Verificação de beneficiário efetivo (RCBE)</li>
          </ul>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-amber-900">4. Docs Obrigatórios:</p>
          <ul className="list-disc list-inside text-amber-800 text-xs space-y-0.5">
            <li>Certidão Predial (keyword: "certidão", para estado: "Validado")</li>
            <li>Comprovativo IMT (keyword: "imt", para estado: "Validado")</li>
            <li>Certificado Energético (keyword: "energético", para estado: "Autenticado")</li>
          </ul>
        </div>

        <div className="bg-red-50 rounded-lg p-3 space-y-2">
          <p className="font-medium text-red-900">5. Bloqueios:</p>
          <ul className="list-disc list-inside text-red-800 text-xs space-y-0.5">
            <li>Validações completas → bloqueia "Autenticado"</li>
            <li>Checklist completa → bloqueia "Autenticado"</li>
            <li>Docs obrigatórios → bloqueia "Validado"</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <p className="font-medium">6. Checklist:</p>
          <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
            <li>Verificar identidade das partes</li>
            <li>Confirmar poderes de representação</li>
            <li>Validar situação fiscal do prédio</li>
            <li>Confirmar inexistência de ónus/encargos</li>
            <li>Preparar minuta DPA</li>
            <li>Agendar autenticação</li>
            <li>Promover registo predial</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export const AjudaRapida: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['tipos-processo']));

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(sections.map(s => s.id)));
  const collapseAll = () => setExpanded(new Set());

  const filtered = sections.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajuda Rápida</h1>
        <p className="text-muted-foreground mt-1">Como usar o sistema de gestão de processos e workflow</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground">Expandir tudo</button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground">Recolher tudo</button>
      </div>

      <div className="space-y-2">
        {filtered.map((section) => {
          const Icon = section.icon;
          const isOpen = expanded.has(section.id);
          return (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggle(section.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium flex-1">{section.title}</CardTitle>
                  {section.badge && (
                    <Badge variant={section.badge === 'Novo' ? 'default' : 'secondary'} className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="pt-0 px-4 pb-4 pl-12">
                  {section.content}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
