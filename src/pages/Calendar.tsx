import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, MapPin, User, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { useRegistosPrediais } from '@/hooks/useRegistosPrediais';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isSameDay, isToday, isTomorrow, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: 'task' | 'process' | 'registo' | 'diligencia';
  status?: string;
  priority?: string;
  responsibleId?: number | null;
  responsibleName?: string;
  isUserResponsible?: boolean;
  local?: string;
  horaInicio?: string;
  horaFim?: string;
  concluida?: boolean;
}

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  task: { label: 'Tarefa', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  diligencia: { label: 'Diligência', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  process: { label: 'Processo', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
  registo: { label: 'Registo', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

export const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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
      map.set(emp.id, (emp as any).cor || fallback[idx % fallback.length]);
    });
    return map;
  }, [employees]);

  const [visibleEmployees, setVisibleEmployees] = useState<Record<number, boolean>>({});
  useEffect(() => {
    const next: Record<number, boolean> = {};
    employees.forEach(e => { next[e.id] = true; });
    setVisibleEmployees(next);
  }, [employees]);

  const events = useMemo(() => {
    const cal: CalendarEvent[] = [];

    tasks?.forEach((task: any) => {
      const isUser = user && task.responsavel_id === parseInt(user.id);
      if (task.servico_externo && task.data_agendamento && task.hora_inicio) {
        const dateStr = task.data_agendamento.slice(0, 10);
        cal.push({
          id: `diligencia-${task.id}`,
          title: task.titulo,
          description: task.descricao,
          date: new Date(`${dateStr}T${task.hora_inicio}:00`),
          endDate: task.hora_fim ? new Date(`${dateStr}T${task.hora_fim}:00`) : undefined,
          type: 'diligencia',
          status: task.concluida ? 'concluida' : 'pendente',
          priority: task.prioridade || undefined,
          responsibleId: task.responsavel_id,
          isUserResponsible: !!isUser,
          local: task.local,
          horaInicio: task.hora_inicio,
          horaFim: task.hora_fim,
          concluida: task.concluida,
        });
      }
      if (task.data_fim) {
        cal.push({
          id: `task-${task.id}`,
          title: task.titulo,
          description: task.descricao,
          date: parseISO(task.data_fim),
          type: 'task',
          status: task.concluida ? 'concluida' : 'pendente',
          priority: task.prioridade || undefined,
          responsibleId: task.responsavel_id,
          isUserResponsible: !!isUser,
          concluida: task.concluida,
        });
      }
    });

    processes?.forEach(p => {
      if (p.criado_em) {
        cal.push({
          id: `process-${p.id}`,
          title: p.titulo,
          description: p.descricao,
          date: parseISO(p.criado_em),
          type: 'process',
          status: p.estado,
          responsibleId: p.funcionario_id,
          responsibleName: p.funcionario?.nome,
          isUserResponsible: user ? p.funcionario_id === parseInt(user.id) : false,
        });
      }
    });

    registos?.forEach(r => {
      if (r.data) {
        cal.push({
          id: `registo-${r.id}`,
          title: `${r.numero_processo}`,
          description: `${r.predio || ''} ${r.freguesia || ''}`.trim(),
          date: parseISO(r.data),
          type: 'registo',
          status: r.estado,
        });
      }
    });

    return cal;
  }, [tasks, processes, registos, user, employees]);

  const fcEvents = useMemo(() => {
    return events
      .filter(ev => ev.responsibleId == null || visibleEmployees[ev.responsibleId])
      .map(ev => {
        const isTimed = ev.type === 'diligencia';
        const color = ev.concluida ? '#94a3b8'
          : ev.type === 'diligencia' ? '#dc2626'
          : ev.responsibleId != null ? (employeeColors.get(ev.responsibleId) || '#64748b')
          : ev.type === 'process' ? '#64748b' : '#94a3b8';
        return {
          id: ev.id,
          title: ev.title,
          start: ev.date,
          end: ev.endDate,
          allDay: !isTimed,
          extendedProps: ev,
          backgroundColor: color,
          borderColor: color,
          textColor: '#fff',
          classNames: ev.concluida ? ['opacity-50'] : [],
        };
      });
  }, [events, visibleEmployees, employeeColors]);

  const selectedDateEvents = useMemo(() =>
    events
      .filter(e => isSameDay(e.date, selectedDate) && (e.responsibleId == null || visibleEmployees[e.responsibleId]))
      .sort((a, b) => {
        if (a.type === 'diligencia' && b.type !== 'diligencia') return -1;
        if (b.type === 'diligencia' && a.type !== 'diligencia') return 1;
        return a.date.getTime() - b.date.getTime();
      }),
    [events, selectedDate, visibleEmployees],
  );

  // Mini-resumo: hoje + amanhã
  const todayCount = events.filter(e => isToday(e.date) && !e.concluida).length;
  const tomorrowCount = events.filter(e => isTomorrow(e.date) && !e.concluida).length;

  const dateLabel = isToday(selectedDate) ? 'Hoje' : isTomorrow(selectedDate) ? 'Amanhã' : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Calendário</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Hoje: <strong>{todayCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Amanhã: <strong>{tomorrowCount}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4" style={{ minHeight: '75vh' }}>
        {/* FullCalendar (3/4) */}
        <style>{`
          .fc { font-family: inherit; }
          .fc .fc-button { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border: none; border-radius: 0.375rem; padding: 0.375rem 0.75rem; font-size: 0.8rem; }
          .fc .fc-button:hover { filter: brightness(0.95); }
          .fc .fc-button:disabled { background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground)); opacity: .8; }
          .fc .fc-button-active { background-color: hsl(var(--primary)) !important; filter: brightness(0.9); }
          .fc .fc-toolbar-title { font-weight: 600; font-size: 1.1rem; color: hsl(var(--foreground)); }
          .fc .fc-daygrid-day.fc-day-today { background: hsl(var(--accent) / 0.5); }
          .fc .fc-daygrid-event, .fc .fc-timegrid-event { border-radius: 0.25rem; font-size: 0.75rem; }
          .fc .fc-scrollgrid { border-radius: 0.5rem; overflow: hidden; }
          .fc .fc-daygrid-day-number { font-size: 0.8rem; padding: 4px 6px; }
          .fc .fc-col-header-cell { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
          .fc .fc-daygrid-day-frame { min-height: 80px; }
        `}</style>
        <Card className="xl:col-span-3 flex flex-col">
          <CardContent className="p-3 flex-1">
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
              dateClick={(arg) => setSelectedDate(arg.date)}
            />
          </CardContent>
        </Card>

        {/* Painel lateral (1/4) */}
        <div className="space-y-4 flex flex-col">
          {/* Data selecionada */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="capitalize">{dateLabel}</span>
                <Badge variant="outline" className="text-xs">{selectedDateEvents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2 p-3 pt-0">
              {selectedDateEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Sem eventos</p>
                </div>
              ) : (
                selectedDateEvents.map(ev => {
                  const cfg = typeConfig[ev.type] || typeConfig.task;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${ev.concluida ? 'opacity-50' : ''} ${ev.isUserResponsible ? cfg.bg : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${ev.concluida ? 'line-through' : ''}`}>{ev.title}</p>
                          {ev.horaInicio && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {ev.horaInicio}{ev.horaFim ? `–${ev.horaFim}` : ''}
                            </p>
                          )}
                          {ev.local && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.local}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Filtro responsáveis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Responsáveis</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex flex-wrap gap-1.5">
                {employees.map(emp => {
                  const color = employeeColors.get(emp.id) || '#64748b';
                  const active = !!visibleEmployees[emp.id];
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setVisibleEmployees(p => ({ ...p, [emp.id]: !p[emp.id] }))}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${active ? 'bg-white' : 'opacity-40'}`}
                      style={{ borderColor: color }}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate max-w-[80px]">{emp.nome.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de detalhe */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <Badge variant="outline" className={typeConfig[selectedEvent.type]?.color}>
                  {typeConfig[selectedEvent.type]?.label}
                </Badge>
              )}
              {selectedEvent?.isUserResponsible && (
                <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">Minha</Badge>
              )}
              {selectedEvent?.concluida && (
                <Badge variant="secondary">Concluída</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
              {selectedEvent.description && <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Data</span>
                  <p className="font-medium">{format(selectedEvent.date, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                {selectedEvent.horaInicio && (
                  <div>
                    <span className="text-muted-foreground text-xs">Horário</span>
                    <p className="font-medium">{selectedEvent.horaInicio}{selectedEvent.horaFim ? ` – ${selectedEvent.horaFim}` : ''}</p>
                  </div>
                )}
                {selectedEvent.local && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Local</span>
                    <p className="font-medium">{selectedEvent.local}</p>
                  </div>
                )}
                {selectedEvent.responsibleName && (
                  <div>
                    <span className="text-muted-foreground text-xs">Responsável</span>
                    <p className="font-medium">{selectedEvent.responsibleName}</p>
                  </div>
                )}
                {selectedEvent.priority && (
                  <div>
                    <span className="text-muted-foreground text-xs">Prioridade</span>
                    <p className="font-medium capitalize">{selectedEvent.priority}</p>
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
