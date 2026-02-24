import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectOptionsManager } from '@/components/settings/SelectOptionsManager';
import { UserPermissionsManager } from '@/components/settings/UserPermissionsManager';
import { SolicitadorManager } from '@/components/settings/SolicitadorManager';
import { Settings as SettingsIcon, Shield, UserCog } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Definições</h1>

      <Tabs defaultValue="opcoes" className="w-full">
        <TabsList>
          <TabsTrigger value="opcoes" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Opções de Seleção
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões de Utilizadores
          </TabsTrigger>
          <TabsTrigger value="solicitadores" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Perfis de Solicitador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opcoes" className="mt-6">
          <SelectOptionsManager />
        </TabsContent>

        <TabsContent value="permissoes" className="mt-6">
          <UserPermissionsManager />
        </TabsContent>

        <TabsContent value="solicitadores" className="mt-6">
          <SolicitadorManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
