import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, FolderOpen, DollarSign, Eye, Clock, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationCount, useNotifications, useNotificationMutations } from '@/hooks/useNotifications';

const TIPO_ICONS: Record<string, React.ElementType> = {
  tarefa_atribuida: CheckSquare,
  prazo_proximo: Clock,
  estado_processo: FolderOpen,
  transacao_financeira: DollarSign,
  processo_privado: Eye,
  geral: Bell,
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return date.toLocaleDateString('pt-PT');
}

function getNavigationPath(linkTipo?: string, linkId?: number): string | null {
  if (!linkTipo || !linkId) return null;
  switch (linkTipo) {
    case 'processo': return `/processos?abrir=${linkId}`;
    case 'tarefa': return `/tarefas?abrir=${linkId}`;
    default: return null;
  }
}

export const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: countData } = useNotificationCount();
  const { data: notifications } = useNotifications(open);
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const unreadCount = countData?.nao_lidas ?? 0;

  const handleNotificationClick = (notif: any) => {
    if (!notif.lida) {
      markAsRead.mutate(notif.id);
    }
    const path = getNavigationPath(notif.link_tipo, notif.link_id);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Sem notificações
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = TIPO_ICONS[notif.tipo] || Bell;
              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 ${
                    !notif.lida ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${!notif.lida ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notif.lida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.titulo}
                    </p>
                    {notif.mensagem && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.mensagem}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.criado_em)}</p>
                  </div>
                  {!notif.lida && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            type="button"
            onClick={() => { setOpen(false); navigate('/notificacoes'); }}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1"
          >
            Ver todas as notificações
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
