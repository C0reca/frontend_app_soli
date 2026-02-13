import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { useRegistosPrediais } from '@/hooks/useRegistosPrediais';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';

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
  const { tasks } = useTasks();
  const { processes } = useProcesses();
  const { registos } = useRegistosPrediais();
  const { data: employees = [] } = useEmployeeList();
  const { user } = useAuth();

  const employeeColors = useMemo(() => {
    const fallback = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16', '#ec4899'];
    const map = new Map<number, string>();
    employees.forEach((emp, idx) => {
      const color = (emp as any).cor || fallback[idx % fallback.length];
      map.set(emp.id, color);
    });
    return map;
  }, [employees]);

  const [visibleEmployees, setVisibleEmployees] = useState<Record<number, boolean>>({});
  useEffect(() => {
    const next: Record<number, boolean> = {};
    employees.forEach(e => { next[e.id] = true; });
    setVisibleEmployees(next);
  }, [employees]);

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

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
          responsibleName: undefined,
          isUserResponsible,
        });
      }
    });

    processes?.forEach(process => {
      if (process.criado_em) {
        const isUserResponsible = user && process.funcionario_id === parseInt(user.id);
        const respName = process.funcionario_id
          ? (employees.find(e => e.id === process.funcionario_id)?.nome || 'Não atribuído')
          : 'Não atribuído';
        calendarEvents.push({
          id: `process-${process.id}`,
          title: process.titulo,
          description: process.descricao,
          date: parseISO(process.criado_em),
          type: 'process',
          status: process.estado,
          responsibleId: process.funcionario_id,
          responsibleName: respName,
          isUserResponsible,
        });
      }
    });

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

  const fcEvents = useMemo(() => {
    return events
      .filter(ev => ev.responsibleId == null || visibleEmployees[ev.responsibleId])
      .map(ev => ({
        id: ev.id,
        title: ev.title,
        start: ev.date,
        allDay: true,
        extendedProps: ev,
        backgroundColor: ev.type === 'task' && ev.responsibleId != null ? (employeeColors.get(ev.responsibleId) || '#64748b') : (ev.type === 'process' ? '#64748b' : ev.type === 'registo' ? '#94a3b8' : undefined),
        borderColor: ev.type === 'task' && ev.responsibleId != null ? (employeeColors.get(ev.responsibleId) || '#64748b') : (ev.type === 'process' ? '#64748b' : ev.type === 'registo' ? '#94a3b8' : undefined),
        textColor: '#ffffff',
      }));
  }, [events, visibleEmployees, employeeColors]);

  const selectedDateEvents = events.filter(event => isSameDay(event.date, selectedDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Calendário</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full min-h-[600px]">
        {/* Estilos FullCalendar para combinar com a estética do programa */}
        <style>{`
          .fc .fc-button {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border: none;
            border-radius: 0.375rem;
            padding: 0.375rem 0.75rem;
          }
          .fc .fc-button:hover {
            filter: brightness(0.95);
          }
          .fc .fc-button:disabled {
            background-color: hsl(var(--muted));
            color: hsl(var(--muted-foreground));
            opacity: .8;
          }
          .fc .fc-toolbar-title {
            font-weight: 600;
            color: hsl(var(--foreground));
          }
          .fc .fc-daygrid-day.fc-day-today {
            background: hsl(var(--accent));
          }
          .fc .fc-daygrid-event, .fc .fc-timegrid-event {
            border-radius: 0.375rem;
          }
          /* Bordas arredondadas no calendário em si */
          .fc .fc-scrollgrid, .fc .fc-daygrid, .fc .fc-timegrid, .fc .fc-view-harness {
            border-radius: 0.5rem;
            overflow: hidden;
          }
          .fc .fc-col-header, .fc .fc-daygrid-body, .fc .fc-timegrid-body {
            border-radius: 0.5rem;
          }
        `}</style>
        <Card className="lg:col-span-1 xl:col-span-2 h-full flex flex-col">
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 min-h-[560px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listYear' }}
              locale={ptLocale}
              height="100%"
              events={fcEvents}
              navLinks={true}
              selectable={true}
              dayMaxEventRows={3}
              nowIndicator={true}
              eventClick={(info) => {
                const ev = info.event.extendedProps as any;
                if (ev?.date) setSelectedDate(new Date(ev.date));
                if (ev) setSelectedEvent(ev);
              }}
              dateClick={(arg) => {
                setSelectedDate(arg.date);
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 xl:col-span-1 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Eventos de</span>
                <span className="text-primary">{format(selectedDate, 'dd/MM', { locale: ptBR })}</span>
              </div>
              <div className="text-xs text-muted-foreground">{selectedDateEvents.length} evento{selectedDateEvents.length !== 1 ? 's' : ''}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Responsáveis</h4>
              <div className="flex flex-wrap gap-2">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded border" style={{ borderColor: employeeColors.get(emp.id) || '#CBD5E1' }}>
                    <input
                      type="checkbox"
                      checked={!!visibleEmployees[emp.id]}
                      onChange={(e) => setVisibleEmployees(prev => ({ ...prev, [emp.id]: e.target.checked }))}
                    />
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: employeeColors.get(emp.id) || '#64748b' }} />
                    <span>{emp.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 h-full">
              {selectedDateEvents.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground text-sm text-center">Nenhum evento nesta data.</p>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      event.isUserResponsible ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h4 className={`font-medium text-sm ${event.isUserResponsible ? 'text-blue-700' : ''}`}>{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {event.description.length > 80 ? `${event.description.substring(0, 80)}...` : event.description}
                          </p>
                        )}
                        {event.responsibleName && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Responsável:</span> {event.responsibleName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'task' ? 'Tarefa' : event.type === 'process' ? 'Processo' : 'Registo'}
                        </Badge>
                        {event.isUserResponsible && (
                          <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 bg-blue-50">Minha</Badge>
                        )}
                        {event.status && (
                          <Badge variant="outline" className="text-xs">
                            {event.status === 'concluida' ? 'Concluída' : event.status}
                          </Badge>
                        )}
                        {event.priority && (
                          <Badge
                            variant={event.priority === 'alta' ? 'destructive' : event.priority === 'media' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {event.priority === 'alta' ? 'Alta' : event.priority === 'media' ? 'Média' : 'Baixa'}
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

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {selectedEvent?.type === 'task' ? 'Tarefa' : selectedEvent?.type === 'process' ? 'Processo' : 'Registo'}
              </Badge>
              {selectedEvent?.isUserResponsible && (
                <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 bg-blue-50">Minha</Badge>
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
                  <p className="text-sm">{format(selectedEvent.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                {selectedEvent.responsibleName && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Responsável:</h4>
                    <p className="text-sm">{selectedEvent.responsibleName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};