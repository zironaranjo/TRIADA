import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, ClipboardList, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface StaffMember {
  id: string;
  name: string;
  salary: number | null;
  contract_type: string | null;
}

interface Task {
  id: string;
  title: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  cost: number | null;
}

export default function WorkerEarnings() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [worker, setWorker] = useState<StaffMember | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => { if (profile?.email) loadData(profile.email); }, [profile]);

  async function loadData(email: string) {
    setLoading(true);
    const { data: workerData } = await supabase
      .from('staff_members')
      .select('id, name, salary, contract_type')
      .eq('email', email)
      .maybeSingle();

    if (!workerData) { setLoading(false); return; }
    setWorker(workerData as StaffMember);

    const { data: tasksData } = await supabase
      .from('staff_tasks')
      .select('id, title, task_type, status, scheduled_date, cost')
      .eq('assigned_to', workerData.id)
      .order('scheduled_date', { ascending: false });

    setTasks((tasksData || []) as Task[]);
    setLoading(false);
  }

  const monthStart = startOfMonth(selectedMonth).toISOString().split('T')[0];
  const monthEnd = endOfMonth(selectedMonth).toISOString().split('T')[0];

  const monthTasks = tasks.filter(t =>
    t.scheduled_date >= monthStart && t.scheduled_date <= monthEnd
  );
  const completedTasks = monthTasks.filter(t => t.status === 'completed' || t.status === 'verified');
  const taskIncome = completedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);
  const baseSalary = worker?.salary || 0;
  const totalEarnings = baseSalary + taskIncome;

  const allCompletedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'verified');
  const allTimeIncome = allCompletedTasks.reduce((sum, t) => sum + (t.cost || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-cyan-400" />
          {t('worker.myEarnings')}
        </h1>
        {worker && <p className="text-slate-400 mt-1">{worker.name} · <span className="capitalize">{worker.contract_type || 'freelance'}</span></p>}
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 transition">‹</button>
        <span className="text-white font-medium flex-1 text-center">{format(selectedMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 transition">›</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: t('worker.baseSalary'),  value: formatCurrency(baseSalary),  icon: <DollarSign className="w-4 h-4 text-cyan-400" />, color: 'border-cyan-700/40' },
          { label: t('worker.taskIncome'),  value: formatCurrency(taskIncome),  icon: <ClipboardList className="w-4 h-4 text-emerald-400" />, color: 'border-emerald-700/40' },
          { label: t('worker.totalMonth'),  value: formatCurrency(totalEarnings), icon: <TrendingUp className="w-4 h-4 text-violet-400" />, color: 'border-violet-700/40 col-span-2' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-slate-800/60 border rounded-xl p-4 ${card.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{card.label}</span>
              {card.icon}
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Task breakdown */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">{t('worker.taskBreakdown')} — {format(selectedMonth, 'MMM yyyy')}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{completedTasks.length} {t('worker.completedTasks')}</p>
        </div>

        {completedTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">{t('worker.noCompletedTasks')}</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {completedTasks.map(task => (
              <div key={task.id} className="px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{task.title}</p>
                  <p className="text-slate-500 text-xs">{task.scheduled_date} · <span className="capitalize">{task.task_type}</span></p>
                </div>
                <span className="text-emerald-400 font-semibold text-sm shrink-0">
                  {task.cost ? `+${formatCurrency(task.cost)}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All-time stats */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('worker.allTimeTaskIncome')}</p>
          <p className="text-white font-bold">{formatCurrency(allTimeIncome)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{t('worker.totalCompletedTasks')}</p>
          <p className="text-white font-bold">{allCompletedTasks.length}</p>
        </div>
      </div>
    </div>
  );
}
