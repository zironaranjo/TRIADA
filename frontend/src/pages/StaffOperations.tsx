import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import {
    Users, ClipboardCheck, Plus, X, Search, Star,
    Phone, Mail, MapPin, FileText, Clock,
    CheckCircle2, Circle, Trash2, Edit3,
    DollarSign,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────
interface StaffMember {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    document_id: string | null;
    contract_type: 'full_time' | 'part_time' | 'freelance';
    salary: number;
    salary_type: 'monthly' | 'per_service';
    start_date: string | null;
    end_date: string | null;
    status: 'active' | 'inactive';
    assigned_properties: string[];
    notes: string | null;
    created_at: string;
}

interface StaffTask {
    id: string;
    staff_member_id: string;
    property_id: string | null;
    booking_id: string | null;
    task_type: 'cleaning' | 'maintenance' | 'inspection' | 'laundry' | 'other';
    scheduled_date: string;
    checklist: ChecklistItem[];
    photos: string[];
    time_start: string | null;
    time_end: string | null;
    hours_worked: number;
    status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
    rating: number | null;
    cost: number;
    notes: string | null;
    created_at: string;
    staff_members?: { full_name: string } | null;
    properties?: { name: string } | null;
}

interface ChecklistItem {
    item: string;
    completed: boolean;
    photo_url?: string;
}

interface Property {
    id: string;
    name: string;
}

// ─── Constants ────────────────────────────────────────
const CONTRACT_TYPES: readonly ('full_time' | 'part_time' | 'freelance')[] = ['full_time', 'part_time', 'freelance'];
const TASK_TYPES: readonly ('cleaning' | 'maintenance' | 'inspection' | 'laundry' | 'other')[] = ['cleaning', 'maintenance', 'inspection', 'laundry', 'other'];

const TASK_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
    cleaning: { icon: '🧹', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    maintenance: { icon: '🔧', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    inspection: { icon: '🔍', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    laundry: { icon: '👕', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    other: { icon: '📋', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    verified: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    cancelled: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

type TabId = 'staff' | 'tasks' | 'payroll';

// ─── Main Component ──────────────────────────────────
export default function StaffOperations() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabId>('staff');
    const [members, setMembers] = useState<StaffMember[]>([]);
    const [tasks, setTasks] = useState<StaffTask[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { fetchAll(true); }, []);

    const fetchAll = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const [membersRes, tasksRes, propsRes] = await Promise.allSettled([
                supabase.from('staff_members').select('*').order('full_name'),
                supabase.from('staff_tasks').select('*, staff_members(full_name), properties(name)').order('scheduled_date', { ascending: false }),
                supabase.from('properties').select('id, name').eq('status', 'active'),
            ]);
            if (membersRes.status === 'fulfilled' && !membersRes.value.error) setMembers(membersRes.value.data || []);
            if (tasksRes.status === 'fulfilled' && !tasksRes.value.error) setTasks(tasksRes.value.data || []);
            if (propsRes.status === 'fulfilled' && !propsRes.value.error) setProperties(propsRes.value.data || []);
        } catch (err) {
            console.error('Error fetching staff data:', err);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const deleteMember = async (id: string) => {
        if (!confirm(t('staffOps.confirmDeleteMember'))) return;
        await supabase.from('staff_members').delete().eq('id', id);
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const deleteTask = async (id: string) => {
        if (!confirm(t('staffOps.confirmDeleteTask'))) return;
        await supabase.from('staff_tasks').delete().eq('id', id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const updateTaskStatus = async (taskId: string, status: string) => {
        await supabase.from('staff_tasks').update({ status }).eq('id', taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status as StaffTask['status'] } : t));

        // Auto-create expense when task is completed
        if (status === 'completed') {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.cost > 0) {
                const member = members.find(m => m.id === task.staff_member_id);
                const categoryMap: Record<string, string> = { cleaning: 'CLEANING', maintenance: 'MAINTENANCE', laundry: 'LAUNDRY', inspection: 'OTHER', other: 'OTHER' };
                await supabase.from('expenses').insert({
                    category: categoryMap[task.task_type] || 'OTHER',
                    amount: task.cost,
                    description: `${member?.full_name || 'Staff'} — ${t(`staffOps.taskType.${task.task_type}`)}`,
                    property_id: task.property_id,
                    date: task.scheduled_date,
                });
            }
        }
    };

    const rateTask = async (taskId: string, rating: number) => {
        await supabase.from('staff_tasks').update({ rating, status: 'verified' }).eq('id', taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, rating, status: 'verified' as const } : t));
    };

    const fmt = (v: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

    const activeMembers = members.filter(m => m.status === 'active');
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'verified');
    const totalLabourCost = tasks.reduce((s, t) => s + Number(t.cost || 0), 0);

    const TABS: { id: TabId; icon: React.ElementType; labelKey: string }[] = [
        { id: 'staff', icon: Users, labelKey: 'staffOps.tabStaff' },
        { id: 'tasks', icon: ClipboardCheck, labelKey: 'staffOps.tabTasks' },
        { id: 'payroll', icon: DollarSign, labelKey: 'staffOps.tabPayroll' },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">{t('common.loading')}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                            {t('staffOps.title')}
                        </motion.h1>
                        <p className="text-slate-400 text-sm sm:text-base">{t('staffOps.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder={t('staffOps.search')} className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 w-52" />
                        </div>
                        <button onClick={() => { activeTab === 'staff' ? setShowMemberModal(true) : setShowTaskModal(true); }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">{activeTab === 'staff' ? t('staffOps.addMember') : t('staffOps.addTask')}</span>
                        </button>
                    </div>
                </header>

                {/* KPIs */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <StatCard title={t('staffOps.kpiActiveStaff')} value={String(activeMembers.length)} icon={<Users className="h-5 w-5" />} color="bg-indigo-500" />
                    <StatCard title={t('staffOps.kpiTotalTasks')} value={String(tasks.length)} icon={<ClipboardCheck className="h-5 w-5" />} color="bg-blue-500" />
                    <StatCard title={t('staffOps.kpiCompleted')} value={String(completedTasks.length)} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-emerald-500" />
                    <StatCard title={t('staffOps.kpiLabourCost')} value={fmt(totalLabourCost)} icon={<DollarSign className="h-5 w-5" />} color="bg-amber-500" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <tab.icon className="h-4 w-4" />
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>

                {/* ─── Staff Tab ─────────────────────── */}
                {activeTab === 'staff' && (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {members.filter(m => !searchQuery || m.full_name.toLowerCase().includes(searchQuery.toLowerCase())).map(member => (
                            <GlassCard key={member.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                                            {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white text-sm">{member.full_name}</h4>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t(`staffOps.status.${member.status}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingMember(member); setShowMemberModal(true); }} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => deleteMember(member.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs text-slate-400">
                                    {member.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{member.email}</p>}
                                    {member.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{member.phone}</p>}
                                    {member.address && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{member.address}</p>}
                                    {member.document_id && <p className="flex items-center gap-1.5"><FileText className="h-3 w-3" />ID: {member.document_id}</p>}
                                </div>

                                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-xs">
                                        <span className="text-slate-500">{t(`staffOps.contract.${member.contract_type}`)}</span>
                                        <span className="mx-1 text-slate-700">·</span>
                                        <span className="text-emerald-400 font-semibold">
                                            {fmt(member.salary)}{member.salary_type === 'monthly' ? '/mo' : '/srv'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-600">{member.assigned_properties?.length || 0} props</span>
                                </div>
                            </GlassCard>
                        ))}
                        {members.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">{t('staffOps.noMembers')}</p>
                                <button onClick={() => setShowMemberModal(true)} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">{t('staffOps.addFirst')}</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Tasks Tab ─────────────────────── */}
                {activeTab === 'tasks' && (
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                            {tasks.filter(tk => !searchQuery || tk.staff_members?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || tk.properties?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(task => {
                                const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.other;
                                const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                                const completedItems = (task.checklist || []).filter(c => c.completed).length;
                                const totalItems = (task.checklist || []).length;
                                return (
                                    <div key={task.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className={`p-2 rounded-lg ${typeConf.bg} text-lg flex-shrink-0`}>{typeConf.icon}</div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-white">{t(`staffOps.taskType.${task.task_type}`)}</p>
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                                                            {t(`staffOps.taskStatus.${task.status}`)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {task.staff_members?.full_name || '—'} · {task.properties?.name || '—'} · {new Date(task.scheduled_date).toLocaleDateString()}
                                                    </p>
                                                    {totalItems > 0 && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(completedItems / totalItems) * 100}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-slate-500">{completedItems}/{totalItems}</span>
                                                        </div>
                                                    )}
                                                    {task.hours_worked > 0 && (
                                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" /> {task.hours_worked}h · {fmt(task.cost)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {task.status === 'completed' && !task.rating && (
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <button key={s} onClick={() => rateTask(task.id, s)} className="text-slate-600 hover:text-amber-400 transition-colors">
                                                                <Star className="h-3.5 w-3.5" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {task.rating && (
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <Star key={s} className={`h-3.5 w-3.5 ${s <= task.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                                                        ))}
                                                    </div>
                                                )}
                                                {task.status === 'pending' && (
                                                    <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors" title="Start">
                                                        <Circle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {task.status === 'in_progress' && (
                                                    <button onClick={() => updateTaskStatus(task.id, 'completed')} className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="Complete">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {tasks.length === 0 && (
                                <div className="p-12 text-center">
                                    <ClipboardCheck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">{t('staffOps.noTasks')}</p>
                                    <button onClick={() => setShowTaskModal(true)} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">{t('staffOps.addFirstTask')}</button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                )}

                {/* ─── Payroll Tab ────────────────────── */}
                {activeTab === 'payroll' && (
                    <div className="space-y-4">
                        <GlassCard className="p-0 overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <h3 className="font-semibold text-white">{t('staffOps.payrollSummary')}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-[#1e293b]/50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                                        <tr>
                                            <th className="p-3 pl-4">{t('staffOps.payrollName')}</th>
                                            <th className="p-3">{t('staffOps.payrollContract')}</th>
                                            <th className="p-3 text-right">{t('staffOps.payrollBase')}</th>
                                            <th className="p-3 text-right">{t('staffOps.payrollTasks')}</th>
                                            <th className="p-3 text-right">{t('staffOps.payrollTotal')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {members.filter(m => m.status === 'active').map(member => {
                                            const memberTasks = tasks.filter(t => t.staff_member_id === member.id && (t.status === 'completed' || t.status === 'verified'));
                                            const tasksCost = memberTasks.reduce((s, t) => s + Number(t.cost || 0), 0);
                                            const totalHours = memberTasks.reduce((s, t) => s + Number(t.hours_worked || 0), 0);
                                            return (
                                                <tr key={member.id} className="hover:bg-white/[0.02]">
                                                    <td className="p-3 pl-4">
                                                        <p className="text-sm font-medium text-white">{member.full_name}</p>
                                                        <p className="text-[10px] text-slate-500">{totalHours}h worked</p>
                                                    </td>
                                                    <td className="p-3 text-slate-400">{t(`staffOps.contract.${member.contract_type}`)}</td>
                                                    <td className="p-3 text-right text-white">{fmt(member.salary)}</td>
                                                    <td className="p-3 text-right text-amber-400">{fmt(tasksCost)}</td>
                                                    <td className="p-3 text-right text-emerald-400 font-bold">{fmt(member.salary + tasksCost)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-indigo-500/5 border-t-2 border-indigo-500/20">
                                        <tr>
                                            <td colSpan={4} className="p-3 pl-4 text-sm font-bold text-indigo-400">{t('staffOps.payrollGrandTotal')}</td>
                                            <td className="p-3 text-right text-lg font-bold text-indigo-400">
                                                {fmt(members.filter(m => m.status === 'active').reduce((s, m) => {
                                                    const tc = tasks.filter(t => t.staff_member_id === m.id && (t.status === 'completed' || t.status === 'verified')).reduce((ss, t) => ss + Number(t.cost || 0), 0);
                                                    return s + m.salary + tc;
                                                }, 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>

            {/* ─── Add/Edit Member Modal ────────────── */}
            <AnimatePresence>
                {showMemberModal && (
                    <MemberModal
                        member={editingMember}
                        onClose={() => { setShowMemberModal(false); setEditingMember(null); }}
                        onSuccess={() => { fetchAll(); setShowMemberModal(false); setEditingMember(null); }}
                    />
                )}
            </AnimatePresence>

            {/* ─── Add Task Modal ───────────────────── */}
            <AnimatePresence>
                {showTaskModal && (
                    <TaskModal
                        members={members.filter(m => m.status === 'active')}
                        properties={properties}
                        onClose={() => setShowTaskModal(false)}
                        onSuccess={() => { fetchAll(); setShowTaskModal(false); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────
function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className={`inline-flex items-center justify-center rounded-lg ${color} p-1.5 sm:p-2 shadow-lg`}>
                    <div className="text-white">{icon}</div>
                </div>
                <p className="text-[10px] sm:text-sm font-medium text-slate-400">{title}</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
        </motion.div>
    );
}

// ─── Member Modal ─────────────────────────────────────
function MemberModal({ member, onClose, onSuccess }: {
    member: StaffMember | null; onClose: () => void; onSuccess: () => void;
}) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<{
        full_name: string; email: string; phone: string; address: string; document_id: string;
        contract_type: 'full_time' | 'part_time' | 'freelance'; salary: string;
        salary_type: 'monthly' | 'per_service'; start_date: string; end_date: string;
        status: 'active' | 'inactive'; assigned_properties: string[]; notes: string;
    }>({
        full_name: member?.full_name || '',
        email: member?.email || '',
        phone: member?.phone || '',
        address: member?.address || '',
        document_id: member?.document_id || '',
        contract_type: member?.contract_type || 'freelance',
        salary: member?.salary?.toString() || '0',
        salary_type: member?.salary_type || 'per_service',
        start_date: member?.start_date || new Date().toISOString().split('T')[0],
        end_date: member?.end_date || '',
        status: member?.status || 'active',
        assigned_properties: member?.assigned_properties || [],
        notes: member?.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name.trim()) return;
        setSaving(true);
        try {
            const payload = { ...form, salary: parseFloat(form.salary) || 0, end_date: form.end_date || null, email: form.email || null, phone: form.phone || null, address: form.address || null, document_id: form.document_id || null, notes: form.notes || null };
            const { error } = member
                ? await supabase.from('staff_members').update(payload).eq('id', member.id)
                : await supabase.from('staff_members').insert(payload);
            if (error) {
                console.error('Supabase error:', error);
                alert(error.message);
                return;
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving member:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                    <h2 className="text-lg font-bold text-white">{member ? t('staffOps.editMember') : t('staffOps.addMember')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldName')}</label>
                            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldEmail')}</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldPhone')}</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldAddress')}</label>
                            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldDocId')}</label>
                            <input value={form.document_id} onChange={e => setForm({ ...form, document_id: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldContract')}</label>
                            <select value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value as 'full_time' | 'part_time' | 'freelance' })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                {CONTRACT_TYPES.map(c => <option key={c} value={c} className="bg-slate-800">{t(`staffOps.contract.${c}`)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldSalary')}</label>
                            <input type="number" step="0.01" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldSalaryType')}</label>
                            <select value={form.salary_type} onChange={e => setForm({ ...form, salary_type: e.target.value as 'monthly' | 'per_service' })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                <option value="monthly" className="bg-slate-800">{t('staffOps.salaryMonthly')}</option>
                                <option value="per_service" className="bg-slate-800">{t('staffOps.salaryPerService')}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldStartDate')}</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldEndDate')}</label>
                            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">{t('common.cancel')}</button>
                        <button type="submit" disabled={saving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {saving ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ─── Task Modal ───────────────────────────────────────
function TaskModal({ members, properties, onClose, onSuccess }: {
    members: StaffMember[]; properties: Property[]; onClose: () => void; onSuccess: () => void;
}) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        staff_member_id: members[0]?.id || '',
        property_id: '',
        task_type: 'cleaning' as string,
        scheduled_date: new Date().toISOString().split('T')[0],
        cost: '0',
        notes: '',
        checklist: [
            { item: t('staffOps.checklistBedrooms'), completed: false },
            { item: t('staffOps.checklistBathrooms'), completed: false },
            { item: t('staffOps.checklistKitchen'), completed: false },
            { item: t('staffOps.checklistLinens'), completed: false },
            { item: t('staffOps.checklistTrash'), completed: false },
        ] as ChecklistItem[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.staff_member_id || !form.scheduled_date) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('staff_tasks').insert({
                staff_member_id: form.staff_member_id,
                property_id: form.property_id || null,
                task_type: form.task_type,
                scheduled_date: form.scheduled_date,
                cost: parseFloat(form.cost) || 0,
                notes: form.notes || null,
                checklist: form.checklist,
                status: 'pending',
            });
            if (error) {
                console.error('Supabase error:', error);
                alert(error.message);
                return;
            }
            onSuccess();
        } catch (err) {
            console.error('Error creating task:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                    <h2 className="text-lg font-bold text-white">{t('staffOps.addTask')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldAssignTo')}</label>
                            <select value={form.staff_member_id} onChange={e => setForm({ ...form, staff_member_id: e.target.value })} required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                {members.map(m => <option key={m.id} value={m.id} className="bg-slate-800">{m.full_name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldProperty')}</label>
                            <select value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                <option value="" className="bg-slate-800">— {t('staffOps.noProperty')} —</option>
                                {properties.map(p => <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldTaskType')}</label>
                            <select value={form.task_type} onChange={e => setForm({ ...form, task_type: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                {TASK_TYPES.map(tt => <option key={tt} value={tt} className="bg-slate-800">{t(`staffOps.taskType.${tt}`)}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldDate')}</label>
                            <input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">{t('staffOps.fieldCost')} (€)</label>
                            <input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">{t('staffOps.checklist')}</label>
                        {form.checklist.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="text" value={item.item}
                                    onChange={e => { const cl = [...form.checklist]; cl[i] = { ...cl[i], item: e.target.value }; setForm({ ...form, checklist: cl }); }}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                <button type="button" onClick={() => { const cl = form.checklist.filter((_, idx) => idx !== i); setForm({ ...form, checklist: cl }); }}
                                    className="text-slate-600 hover:text-red-400"><X className="h-4 w-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setForm({ ...form, checklist: [...form.checklist, { item: '', completed: false }] })}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="h-3 w-3" />{t('staffOps.addChecklistItem')}</button>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">{t('common.cancel')}</button>
                        <button type="submit" disabled={saving}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                            {saving ? t('common.saving') : t('staffOps.createTask')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
