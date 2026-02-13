import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, FolderOpen, DollarSign, Eye, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationsPaginated, useNotificationMutations } from '@/hooks/useNotifications';

const TIPO_ICONS: Record<string, React.ElementType> = {
  tarefa_atribuida: CheckSquare,
  prazo_proximo: Clock,
  estado_processo: FolderOpen,
  transacao_financeira: DollarSign,
  processo_privado: Eye,
  geral: Bell,
};

const TIPO_LABELS: Record<string, string> = {
  tarefa_atribuida: 'Tarefa',
  prazo_proximo: 'Prazo',
  estado_processo: 'Processo',
  transacao_financeira: 'Financeiro',
  processo_privado: 'Privacidade',
  geral: 'Geral',
};

function getNavigationPath(linkTipo?: string, linkId?: number): string | null {
  if (!linkTipo || !linkId) return null;
  switch (linkTipo) {
    case 'processo': return `/processos?abrir=${linkId}`;
    case 'tarefa': return `/tarefas?abrir=${linkId}`;
    default: return null;
  }
}

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: notifications, isLoading } = useNotificationsPaginated(page * limit, limit, apenasNaoLidas);
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const handleNotificationClick = (notif: any) => {
    if (!notif.lida) {
      markAsRead.mutate(notif.id);
    }
    const path = getNavigationPath(notif.link_tipo, notif.link_id);
    if (path) navigate(path);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={apenasNaoLidas ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setApenasNaoLidas(!apenasNaoLidas); setPage(0); }}
          >
            {apenasNaoLidas ? 'Mostrar Todas' : 'Apenas Não Lidas'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Marcar Todas Lidas
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">A carregar...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {apenasNaoLidas ? 'Sem notificações por ler.' : 'Sem notificações.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => {
                const Icon = TIPO_ICONS[notif.tipo] || Bell;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex gap-4 items-start ${
                      !notif.lida ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${!notif.lida ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${!notif.lida ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {TIPO_LABELS[notif.tipo] || notif.tipo}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(notif.criado_em).toLocaleDateString('pt-PT')} {new Date(notif.criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-sm ${!notif.lida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.titulo}
                      </p>
                      {notif.mensagem && (
                        <p className="text-xs text-gray-500 mt-0.5">{notif.mensagem}</p>
                      )}
                    </div>
                    {!notif.lida && (
                      <div className="flex-shrink-0 mt-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {notifications && notifications.length === limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-500 flex items-center px-3">Página {page + 1}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
            Seguinte
          </Button>
        </div>
      )}
    </div>
  );
};
