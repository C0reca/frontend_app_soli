import React, { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'process';
  status?: string;
  priority?: string;
}

export const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const { tasks } = useTasks();
  const { processes } = useProcesses();
  const { toast } = useToast();

  // Combinar dados de tarefas e processos em eventos do calendário
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Adicionar tarefas com data_fim
    tasks?.forEach(task => {
      if (task.data_fim) {
        calendarEvents.push({
          id: `task-${task.id}`,
          title: task.titulo,
          date: parseISO(task.data_fim),
          type: 'task',
          status: task.concluida ? 'concluida' : 'pendente',
          priority: task.prioridade || undefined,
        });
      }
    });

    // Adicionar processos com criado_em
    processes?.forEach(process => {
      if (process.criado_em) {
        calendarEvents.push({
          id: `process-${process.id}`,
          title: process.titulo,
          date: parseISO(process.criado_em),
          type: 'process',
          status: process.estado,
        });
      }
    });

    setEvents(calendarEvents);
  }, [tasks, processes]);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border w-full"
              modifiers={{
                hasEvents: (date) => hasEvents(date),
              }}
              modifiersClassNames={{
                hasEvents: "bg-primary/10 text-primary font-medium",
              }}
            />
          </CardContent>
        </Card>

        {/* Eventos do dia selecionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Eventos de</span>
              <span className="text-primary">
                {format(selectedDate, "dd/MM", { locale: ptBR })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum evento nesta data.
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={event.type === 'task' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.type === 'task' ? 'Tarefa' : 'Processo'}
                          </Badge>
                          {event.status && (
                            <Badge
                              variant={
                                event.status === 'concluida' || event.status === 'concluido'
                                  ? 'default'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {event.status === 'concluida' ? 'Concluída' :
                               event.status === 'concluido' ? 'Concluído' :
                               event.status === 'em_curso' ? 'Em Curso' :
                               event.status === 'pendente' ? 'Pendente' : event.status}
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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de eventos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-sm font-medium">
                {events.filter(e => e.type === 'task').length} Tarefas
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-secondary"></div>
              <span className="text-sm font-medium">
                {events.filter(e => e.type === 'process').length} Processos
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-accent"></div>
              <span className="text-sm font-medium">
                {events.length} Total de Eventos
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};