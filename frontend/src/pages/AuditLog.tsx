import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  Settings,
  UserCog,
  Download as DownloadIcon,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  CalendarDays,
  User,
  Package,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, isToday, isYesterday } from 'date-fns';

interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  created:          { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: <Plus className="w-3.5 h-3.5" /> },
  updated:          { color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',       icon: <Pencil className="w-3.5 h-3.5" /> },
  deleted:          { color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30',         icon: <Trash2 className="w-3.5 h-3.5" /> },
  login:            { color: 'text-violet-400',  bg: 'bg-violet-500/15 border-violet-500/30',   icon: <LogIn className="w-3.5 h-3.5" /> },
  settings_changed: { color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border-yellow-500/30',   icon: <Settings className="w-3.5 h-3.5" /> },
  role_changed:     { color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30',   icon: <UserCog className="w-3.5 h-3.5" /> },
  exported:         { color: 'text-cyan-400',    bg: 'bg-cyan-500/15 border-cyan-500/30',       icon: <DownloadIcon className="w-3.5 h-3.5" /> },
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  bookings:      <CalendarDays className="w-3.5 h-3.5" />,
  properties:    <Package className="w-3.5 h-3.5" />,
  contacts:      <User className="w-3.5 h-3.5" />,
  expenses:      <DownloadIcon className="w-3.5 h-3.5" />,
  owner:         <User className="w-3.5 h-3.5" />,
  staff_members: <User className="w-3.5 h-3.5" />,
  contracts:     <ShieldCheck className="w-3.5 h-3.5" />,
  settings:      <Settings className="w-3.5 h-3.5" />,
  session:       <LogIn className="w-3.5 h-3.5" />,
};

const PAGE_SIZE = 50;

function formatRelativeDate(dateStr: string, t: (k: string) => string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return t('audit.today');
  if (isYesterday(d)) return t('audit.yesterday');
  return format(d, 'dd MMM yyyy');
}

function getDiffKeys(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): string[] {
  if (!oldData || !newData) return [];
  return Object.keys(newData).filter(
    k => JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])
  ).filter(k => !['updated_at', 'created_at'].includes(k));
}

export default function AuditLog() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Expanded rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(async (reset = true) => {
    if (reset) { setLoading(true); setOffset(0); }
    else setLoadingMore(true);

    const currentOffset = reset ? 0 : offset;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (actionFilter) query = query.eq('action', actionFilter);
    if (entityFilter) query = query.eq('entity_type', entityFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data } = await query;
    const result = (data || []) as AuditEntry[];

    // Client-side search filter
    const filtered = search
      ? result.filter(e =>
          (e.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
          (e.entity_name || '').toLowerCase().includes(search.toLowerCase())
        )
      : result;

    if (reset) {
      setEntries(filtered);
    } else {
      setEntries(prev => [...prev, ...filtered]);
    }

    setHasMore(result.length === PAGE_SIZE);
    setOffset(currentOffset + PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }, [actionFilter, entityFilter, dateFrom, dateTo, search, offset]);

  useEffect(() => { loadEntries(true); }, [actionFilter, entityFilter, dateFrom, dateTo]);

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity Name', 'Entity ID'];
    const rows = entries.map(e => [
      new Date(e.created_at).toISOString(),
      e.user_email || '',
      e.action,
      e.entity_type,
      e.entity_name || '',
      e.entity_id || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actionOptions = ['created', 'updated', 'deleted', 'login', 'settings_changed', 'role_changed', 'exported'];
  const entityOptions = ['bookings', 'properties', 'contacts', 'expenses', 'owner', 'staff_members', 'contracts', 'settings', 'session'];

  // Group by day
  const grouped: { date: string; items: AuditEntry[] }[] = [];
  entries.forEach(entry => {
    const day = new Date(entry.created_at).toDateString();
    const existing = grouped.find(g => g.date === day);
    if (existing) existing.items.push(entry);
    else grouped.push({ date: day, items: [entry] });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-violet-400" />
            {t('audit.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('audit.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm flex items-center gap-2 transition">
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('audit.exportCsv')}</span>
          </button>
          <button onClick={() => loadEntries(true)} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadEntries(true)}
              placeholder={t('audit.filters.search')}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Action filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
              <option value="">{t('audit.filters.allActions')}</option>
              {actionOptions.map(a => <option key={a} value={a}>{t(`audit.actions.${a}`)}</option>)}
            </select>
          </div>

          {/* Entity filter */}
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
            <option value="">{t('audit.filters.allEntities')}</option>
            {entityOptions.map(e => <option key={e} value={e}>{t(`audit.entities.${e}`)}</option>)}
          </select>

          {/* Date range */}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
        </div>

        {entries.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">{t('audit.total')}: <span className="text-slate-300 font-medium">{entries.length}</span></p>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-7 h-7 text-violet-400 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-24">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">{t('audit.noLogs')}</p>
          <p className="text-slate-500 text-sm mt-1">{t('audit.noLogsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.date}>
              {/* Day separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-slate-700/60" />
                <span className="text-xs text-slate-500 font-medium px-2 py-1 rounded-full bg-slate-800 border border-slate-700">
                  {formatRelativeDate(group.items[0].created_at, t)}
                </span>
                <div className="h-px flex-1 bg-slate-700/60" />
              </div>

              {/* Entries */}
              <div className="space-y-2">
                {group.items.map((entry, idx) => {
                  const style = ACTION_STYLES[entry.action] || ACTION_STYLES['updated'];
                  const isExp = expanded.has(entry.id);
                  const diffKeys = getDiffKeys(entry.old_data, entry.new_data);
                  const hasDetails = (diffKeys.length > 0) || entry.old_data || entry.new_data;

                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                      className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden hover:border-slate-600 transition"
                    >
                      <div
                        className={`flex items-center gap-3 px-4 py-3 ${hasDetails ? 'cursor-pointer' : ''}`}
                        onClick={() => hasDetails && toggleExpanded(entry.id)}
                      >
                        {/* Action badge */}
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 ${style.bg} ${style.color}`}>
                          {style.icon}
                          {t(`audit.actions.${entry.action}`) || entry.action}
                        </span>

                        {/* Entity */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-slate-500">{ENTITY_ICONS[entry.entity_type] || <Package className="w-3.5 h-3.5" />}</span>
                          <span className="text-xs text-slate-400">{t(`audit.entities.${entry.entity_type}`) || entry.entity_type}</span>
                        </div>

                        {/* Entity name */}
                        {entry.entity_name && (
                          <span className="text-sm text-white font-medium truncate flex-1">{entry.entity_name}</span>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Who */}
                        <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1 shrink-0">
                          <User className="w-3 h-3" />
                          {entry.user_email || 'system'}
                        </span>

                        {/* When */}
                        <span className="text-xs text-slate-600 shrink-0 hidden md:block">
                          {format(new Date(entry.created_at), 'HH:mm')}
                        </span>

                        {/* Expand icon */}
                        {hasDetails && (
                          <span className="text-slate-600 shrink-0">
                            {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExp && hasDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-slate-700/60">
                              {diffKeys.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-500 font-medium mb-2">{t('audit.showChanges')}</p>
                                  {diffKeys.map(key => (
                                    <div key={key} className="grid grid-cols-[auto_1fr_1fr] gap-3 text-xs">
                                      <span className="text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">{key}</span>
                                      <div className="bg-red-900/20 border border-red-800/40 rounded px-2 py-1 text-red-300 font-mono truncate">
                                        {String(entry.old_data?.[key] ?? '—')}
                                      </div>
                                      <div className="bg-emerald-900/20 border border-emerald-800/40 rounded px-2 py-1 text-emerald-300 font-mono truncate">
                                        {String(entry.new_data?.[key] ?? '—')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {entry.old_data && (
                                    <div>
                                      <p className="text-xs text-red-400 font-medium mb-1">{t('audit.before')}</p>
                                      <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                                        {JSON.stringify(entry.old_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {entry.new_data && (
                                    <div>
                                      <p className="text-xs text-emerald-400 font-medium mb-1">{t('audit.after')}</p>
                                      <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                                        {JSON.stringify(entry.new_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <button onClick={() => loadEntries(false)} disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm flex items-center gap-2 transition disabled:opacity-50">
                {loadingMore ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {t('audit.loadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
