import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumoTab } from '@/components/financeiro/ResumoTab';
import { MovimentosTab } from '@/components/financeiro/MovimentosTab';
import { ContasCorrentesTab } from '@/components/financeiro/ContasCorrentesTab';
import { useSearchParams } from 'react-router-dom';

// Lazy-import the heavy Caixa content inline — it reuses the existing page as a component
import { Caixa as CaixaContent } from '@/pages/Caixa';

export const Financeiro: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'resumo';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Gestao financeira unificada — caixa, transacoes, contas correntes e reconciliacao
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
          <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
          <TabsTrigger value="contas">Contas Correntes</TabsTrigger>
          <TabsTrigger value="reconciliacao">Reconciliacao</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <ResumoTab onNavigateTab={handleTabChange} />
        </TabsContent>

        <TabsContent value="caixa">
          <CaixaContent embedded />
        </TabsContent>

        <TabsContent value="movimentos">
          <MovimentosTab />
        </TabsContent>

        <TabsContent value="contas">
          <ContasCorrentesTab />
        </TabsContent>

        <TabsContent value="reconciliacao">
          <CaixaContent embedded defaultTab="reconciliacao" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
