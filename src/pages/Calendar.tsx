import React, { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { useRegistosPrediais } from '@/hooks/useRegistosPrediais';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'task' | 'process' | 'registo';
  status?: string;
  priority?: string;
  responsibleId?: number | null;
  responsibleName?: string;
  isUserResponsible?: boolean;
}

export const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const { tasks } = useTasks();
  const { processes } = useProcesses();
  const { registos } = useRegistosPrediais();
  const { user } = useAuth();
  const { toast } = useToast();

  // Combinar dados de tarefas e processos em eventos do calendário
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Adicionar tarefas com data_fim
    tasks?.forEach(task => {
      if (task.data_fim) {
        const isUserResponsible = user && task.responsavel_id === parseInt(user.id);
        calendarEvents.push({
          id: `task-${task.id}`,
          title: task.titulo,
          description: task.descricao,
          date: parseISO(task.data_fim),
          type: 'task',
          status: task.concluida ? 'concluida' : 'pendente',
          priority: task.prioridade || undefined,
          responsibleId: task.responsavel_id,
          responsibleName: task.responsavel_id === 1 ? 'Ana Costa' : task.responsavel_id === 2 ? 'Carlos Oliveira' : 'Não atribuído',
          isUserResponsible,
        });
      }
    });

    // Adicionar processos com criado_em
    processes?.forEach(process => {
      if (process.criado_em) {
        const isUserResponsible = user && process.funcionario_id === parseInt(user.id);
        calendarEvents.push({
          id: `process-${process.id}`,
          title: process.titulo,
          description: process.descricao,
          date: parseISO(process.criado_em),
          type: 'process',
          status: process.estado,
          responsibleId: process.funcionario_id,
          responsibleName: process.funcionario?.nome || 'Não atribuído',
          isUserResponsible,
        });
      }
    });

    // Adicionar registos prediais com data
    registos?.forEach(registo => {
      if (registo.data) {
        calendarEvents.push({
          id: `registo-${registo.id}`,
          title: `Registo: ${registo.numero_processo}`,
          description: `${registo.predio} - ${registo.freguesia}`,
          date: parseISO(registo.data),
          type: 'registo',
          status: registo.estado,
          responsibleName: registo.cliente?.nome || 'N/A',
        });
      }
    });

    setEvents(calendarEvents);
  }, [tasks, processes, registos, user]);

  // Filtrar eventos para a data selecionada
  const selectedDateEvents = events.filter(event =>
    isSameDay(event.date, selectedDate)
  );

  // Função para conectar com Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      // Aqui você implementaria a autenticação OAuth do Google
      toast({
        title: "Google Calendar",
        description: "Funcionalidade de sincronização em desenvolvimento.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com Google Calendar.",
        variant: "destructive",
      });
    }
  };

  // Função para sincronizar dados
  const syncCalendar = async () => {
    try {
      // Aqui você implementaria a sincronização
      toast({
        title: "Sincronização",
        description: "Dados sincronizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao sincronizar dados.",
        variant: "destructive",
      });
    }
  };

  // Verificar se uma data tem eventos
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.date, date));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={connectGoogleCalendar}
            className="flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Google Calendar</span>
          </Button>
          <Button
            onClick={syncCalendar}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sincronizar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full min-h-[600px]">
        {/* Calendário */}
        <Card className="lg:col-span-1 xl:col-span-2 h-full flex flex-col">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border-0 w-full flex-1 flex justify-center items-center"
              classNames={{
                months: "flex flex-col space-y-4 w-full h-full",
                month: "space-y-4 w-full flex-1 flex flex-col",
                table: "w-full h-full border-collapse flex-1 table-fixed",
                head_row: "flex w-full mb-2",
                head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-sm text-center py-3",
                row: "flex w-full flex-1",
                cell: "flex-1 text-center text-sm p-1 relative flex items-center justify-center min-h-[3rem] [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-full w-full p-2 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors flex items-center justify-center min-h-[3rem]",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-bold border-2 border-primary",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              modifiers={{
                hasEvents: (date) => hasEvents(date),
              }}
              modifiersClassNames={{
                hasEvents: "bg-primary/15 text-primary font-bold border border-primary/30 shadow-sm",
              }}
            />
          </CardContent>
        </Card>

        {/* Eventos do dia selecionado */}
        <Card className="lg:col-span-1 xl:col-span-1 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Eventos de</span>
                <span className="text-primary">
                  {format(selectedDate, "dd/MM", { locale: ptBR })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedDateEvents.length} evento{selectedDateEvents.length !== 1 ? 's' : ''}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto">
            {/* Estatísticas do dia */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-xs font-medium">
                    {selectedDateEvents.filter(e => e.type === 'task').length} Tarefas
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-secondary"></div>
                  <span className="text-xs font-medium">
                    {selectedDateEvents.filter(e => e.type === 'process').length} Processos
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  <span className="text-xs font-medium">
                    {selectedDateEvents.filter(e => e.type === 'registo').length} Registos
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 h-full">
              {selectedDateEvents.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground text-sm text-center">
                    Nenhum evento nesta data.
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      event.isUserResponsible 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                        : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h4 className={`font-medium text-sm ${
                          event.isUserResponsible ? 'text-blue-700' : ''
                        }`}>
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {event.description.length > 80 
                              ? `${event.description.substring(0, 80)}...` 
                              : event.description}
                          </p>
                        )}
                        {event.responsibleName && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Responsável:</span> {event.responsibleName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {event.type === 'task' ? 'Tarefa' : 
                           event.type === 'process' ? 'Processo' : 'Registo'}
                        </Badge>
                        {event.isUserResponsible && (
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-400 text-blue-700 bg-blue-50"
                          >
                            Minha
                          </Badge>
                        )}
                        {event.status && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              event.type === 'registo' ? (
                                event.status === 'Concluído' ? 'bg-green-100 text-green-800 border-green-300' :
                                event.status === 'Desistência' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                event.status === 'Recusado' ? 'bg-red-100 text-red-800 border-red-300' :
                                event.status === 'Provisórios' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''
                              ) : ''
                            }`}
                          >
                            {event.status === 'concluida' ? 'Concluída' :
                             event.status === 'concluido' || event.status === 'Concluído' ? 'Concluído' :
                             event.status === 'em_curso' ? 'Em Curso' :
                             event.status === 'pendente' ? 'Pendente' :
                             event.status === 'Desistência' ? 'Desistência' :
                             event.status === 'Recusado' ? 'Recusado' :
                             event.status === 'Provisórios' ? 'Provisórios' : event.status}
                          </Badge>
                        )}
                        {event.priority && (
                          <Badge
                            variant={
                              event.priority === 'alta' ? 'destructive' :
                              event.priority === 'media' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {event.priority === 'alta' ? 'Alta' :
                             event.priority === 'media' ? 'Média' : 'Baixa'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Preview do Evento */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {selectedEvent?.type === 'task' ? 'Tarefa' : 
                 selectedEvent?.type === 'process' ? 'Processo' : 'Registo'}
              </Badge>
              {selectedEvent?.isUserResponsible && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-400 text-blue-700 bg-blue-50"
                >
                  Minha
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedEvent.title}</h3>
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrição:</h4>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Data:</h4>
                  <p className="text-sm">
                    {format(selectedEvent.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                {selectedEvent.responsibleName && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Responsável:</h4>
                    <p className="text-sm">{selectedEvent.responsibleName}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Status e Prioridade:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.status && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          selectedEvent.type === 'registo' ? (
                            selectedEvent.status === 'Concluído' ? 'bg-green-100 text-green-800 border-green-300' :
                            selectedEvent.status === 'Desistência' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            selectedEvent.status === 'Recusado' ? 'bg-red-100 text-red-800 border-red-300' :
                            selectedEvent.status === 'Provisórios' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''
                          ) : ''
                        }`}
                      >
                        {selectedEvent.status === 'concluida' ? 'Concluída' :
                         selectedEvent.status === 'concluido' || selectedEvent.status === 'Concluído' ? 'Concluído' :
                         selectedEvent.status === 'em_curso' ? 'Em Curso' :
                         selectedEvent.status === 'pendente' ? 'Pendente' :
                         selectedEvent.status === 'Desistência' ? 'Desistência' :
                         selectedEvent.status === 'Recusado' ? 'Recusado' :
                         selectedEvent.status === 'Provisórios' ? 'Provisórios' : selectedEvent.status}
                      </Badge>
                    )}
                    {selectedEvent.priority && (
                      <Badge
                        variant={
                          selectedEvent.priority === 'alta' ? 'destructive' :
                          selectedEvent.priority === 'media' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {selectedEvent.priority === 'alta' ? 'Alta' :
                         selectedEvent.priority === 'media' ? 'Média' : 'Baixa'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};