import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  RefreshCw,
  Home,
  CalendarDays,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

interface StaffMember {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  property_id: string | null;
  cost: number | null;
  notes: string | null;
  rating: number | null;
  checklist: { text: string; done: boolean }[] | null;
  properties?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:     { label: 'Pending',     color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
  in_progress: { label: 'In Progress', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',      icon: <RefreshCw className="w-3.5 h-3.5" /> },
  completed:   { label: 'Completed',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  verified:    { label: 'Verified',    color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', icon: <Star className="w-3.5 h-3.5" /> },
};

const TYPE_COLORS: Record<string, string> = {
  cleaning:    'bg-blue-500/20 text-blue-300',
  maintenance: 'bg-orange-500/20 text-orange-300',
  inspection:  'bg-violet-500/20 text-violet-300',
  laundry:     'bg-cyan-500/20 text-cyan-300',
};

export default function WorkerTasks() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [worker, setWorker] = useState<StaffMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { if (profile?.email) loadData(profile.email); }, [profile]);

  async function loadData(email: string) {
    setLoading(true);
    const { data: workerData } = await supabase
      .from('staff_members')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle();

    if (!workerData) { setLoading(false); return; }
    setWorker(workerData as StaffMember);

    const { data: tasksData } = await supabase
      .from('staff_tasks')
      .select('*, properties(name)')
      .eq('assigned_to', workerData.id)
      .order('scheduled_date', { ascending: true });

    setTasks((tasksData || []) as Task[]);
    setLoading(false);
  }

  async function updateStatus(taskId: string, newStatus: string) {
    setUpdatingId(taskId);
    await supabase.from('staff_tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    setUpdatingId(null);
  }

  async function toggleChecklistItem(task: Task, idx: number) {
    if (!task.checklist) return;
    const updated = task.checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    await supabase.from('staff_tasks').update({ checklist: updated }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, checklist: updated } : t));
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function getDateLabel(dateStr: string): { label: string; urgent: boolean } {
    const d = parseISO(dateStr);
    if (isToday(d)) return { label: t('worker.today'), urgent: true };
    if (isTomorrow(d)) return { label: t('worker.tomorrow'), urgent: false };
    if (isPast(d)) return { label: t('worker.overdue'), urgent: true };
    return { label: format(d, 'dd MMM'), urgent: false };
  }

  const filteredTasks = tasks.filter(task => {
    const d = parseISO(task.scheduled_date);
    if (filter === 'today') return isToday(d) && task.status !== 'completed' && task.status !== 'verified';
    if (filter === 'upcoming') return !isToday(d) && !isPast(d) && task.status !== 'completed' && task.status !== 'verified';
    if (filter === 'completed') return task.status === 'completed' || task.status === 'verified';
    return true;
  });

  const todayCount = tasks.filter(t => isToday(parseISO(t.scheduled_date)) && t.status !== 'completed' && t.status !== 'verified').length;
  const overdueCount = tasks.filter(t => isPast(parseISO(t.scheduled_date)) && t.status !== 'completed' && t.status !== 'verified' && !isToday(parseISO(t.scheduled_date))).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-cyan-400" />
          {t('worker.myTasks')}
        </h1>
        {worker && <p className="text-slate-400 mt-1">{t('worker.hello')}, <span className="text-white font-medium">{worker.name}</span></p>}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 border ${todayCount > 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
          <p className="text-2xl font-bold text-white">{todayCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('worker.tasksToday')}</p>
        </div>
        <div className={`rounded-xl p-4 border ${overdueCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/60 border-slate-700'}`}>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>{overdueCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">{t('worker.overdue')}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-slate-800/60 border border-slate-700 rounded-xl p-1">
        {(['today', 'upcoming', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t(`worker.filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <p className="text-slate-400">{t('worker.noTasks')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, i) => {
            const { label: dateLabel, urgent } = getDateLabel(task.scheduled_date);
            const statusStyle = STATUS_CONFIG[task.status] || STATUS_CONFIG['pending'];
            const isExp = expanded.has(task.id);
            const checklistDone = task.checklist?.filter(c => c.done).length || 0;
            const checklistTotal = task.checklist?.length || 0;

            return (
              <motion.div key={task.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden"
              >
                <div className="p-4" onClick={() => toggleExpand(task.id)} style={{ cursor: 'pointer' }}>
                  <div className="flex items-start gap-3">
                    {/* Type badge */}
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 mt-0.5 ${TYPE_COLORS[task.task_type] || 'bg-slate-700 text-slate-300'}`}>
                      {task.task_type}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {task.properties?.name && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Home className="w-3 h-3" /> {task.properties.name}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-medium ${urgent ? 'text-orange-400' : 'text-slate-400'}`}>
                          <CalendarDays className="w-3 h-3" /> {dateLabel}
                        </span>
                        {checklistTotal > 0 && (
                          <span className="text-xs text-slate-500">{checklistDone}/{checklistTotal}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${statusStyle.color}`}>
                        {statusStyle.icon} {t(`worker.status.${task.status}`) || task.status}
                      </span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div className="border-t border-slate-700/60 p-4 space-y-4">
                    {task.notes && (
                      <p className="text-sm text-slate-400 italic">{task.notes}</p>
                    )}

                    {/* Checklist */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{t('worker.checklist')}</p>
                        {task.checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <input type="checkbox" checked={item.done}
                              onChange={() => toggleChecklistItem(task, idx)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 cursor-pointer"
                            />
                            <span className={`text-sm transition ${item.done ? 'line-through text-slate-600' : 'text-slate-300 group-hover:text-white'}`}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Status actions */}
                    {task.status !== 'verified' && (
                      <div className="flex gap-2 flex-wrap">
                        {task.status === 'pending' && (
                          <button onClick={() => updateStatus(task.id, 'in_progress')} disabled={updatingId === task.id}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50">
                            {updatingId === task.id ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t('worker.startTask')}
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button onClick={() => updateStatus(task.id, 'completed')} disabled={updatingId === task.id}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50">
                            {updatingId === task.id ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : t('worker.markDone')}
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <div className="flex items-center gap-2 text-sm text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> {t('worker.awaitingVerification')}
                          </div>
                        )}
                      </div>
                    )}

                    {task.status === 'verified' && task.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < task.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                        ))}
                        <span className="text-xs text-slate-500 ml-1">{t('worker.rating')}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
