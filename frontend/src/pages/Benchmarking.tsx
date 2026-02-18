import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Download,
  Medal,
  BarChart2,
  CalendarDays,
  DollarSign,
  Home,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Property {
  id: string;
  name: string;
  price_per_night: number | null;
}

interface Booking {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
}

interface PropertyMetrics {
  property: Property;
  revenue: number;
  bookingCount: number;
  bookedNights: number;
  availableNights: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  avgStay: number;
}

type PeriodKey = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear';

function getPeriodRange(period: PeriodKey): { start: string; end: string; days: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (period) {
    case 'thisMonth': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days: end.getDate() };
    }
    case 'lastMonth': {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days: end.getDate() };
    }
    case 'last3Months': {
      const start = new Date(y, m - 2, 1);
      const end = new Date(y, m + 1, 0);
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days };
    }
    case 'last6Months': {
      const start = new Date(y, m - 5, 1);
      const end = new Date(y, m + 1, 0);
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days };
    }
    case 'thisYear': {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], days };
    }
  }
}

const PROPERTY_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

const PODIUM_STYLES = [
  { label: '1st', color: 'from-yellow-500 to-amber-400', textColor: 'text-yellow-300', icon: <Trophy className="w-6 h-6 text-yellow-400" />, height: 'h-24' },
  { label: '2nd', color: 'from-slate-400 to-slate-300', textColor: 'text-slate-300', icon: <Medal className="w-5 h-5 text-slate-400" />, height: 'h-16' },
  { label: '3rd', color: 'from-orange-600 to-amber-700', textColor: 'text-orange-400', icon: <Medal className="w-5 h-5 text-orange-500" />, height: 'h-12' },
];

function shortName(name: string, max = 14): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export default function Benchmarking() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('thisMonth');
  const [activeChart, setActiveChart] = useState<'revenue' | 'occupancy' | 'adr' | 'revpar'>('revenue');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: propsData }, { data: bookData }] = await Promise.all([
      supabase.from('properties').select('id, name, price_per_night'),
      supabase.from('bookings').select('id, property_id, start_date, end_date, total_price, status').neq('status', 'cancelled'),
    ]);
    setProperties((propsData || []) as Property[]);
    setBookings((bookData || []) as Booking[]);
    setLoading(false);
  }

  const metrics = useMemo((): PropertyMetrics[] => {
    const { start, end, days } = getPeriodRange(period);

    return properties.map(prop => {
      const propBookings = bookings.filter(b =>
        b.property_id === prop.id &&
        b.start_date <= end &&
        b.end_date >= start
      );

      const revenue = propBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

      let bookedNights = 0;
      propBookings.forEach(b => {
        const bStart = new Date(Math.max(new Date(b.start_date).getTime(), new Date(start).getTime()));
        const bEnd = new Date(Math.min(new Date(b.end_date).getTime(), new Date(end).getTime()));
        bookedNights += Math.max(0, Math.ceil((bEnd.getTime() - bStart.getTime()) / 86400000));
      });

      const occupancyRate = days > 0 ? Math.min(bookedNights / days, 1) : 0;
      const adr = bookedNights > 0 ? revenue / bookedNights : 0;
      const revpar = days > 0 ? revenue / days : 0;
      const avgStay = propBookings.length > 0 ? bookedNights / propBookings.length : 0;

      return {
        property: prop,
        revenue,
        bookingCount: propBookings.length,
        bookedNights,
        availableNights: days,
        occupancyRate,
        adr,
        revpar,
        avgStay,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [properties, bookings, period]);

  const avgMetrics = useMemo(() => {
    if (!metrics.length) return { revenue: 0, occupancy: 0, adr: 0, revpar: 0 };
    return {
      revenue: metrics.reduce((s, m) => s + m.revenue, 0) / metrics.length,
      occupancy: metrics.reduce((s, m) => s + m.occupancyRate, 0) / metrics.length,
      adr: metrics.reduce((s, m) => s + m.adr, 0) / metrics.length,
      revpar: metrics.reduce((s, m) => s + m.revpar, 0) / metrics.length,
    };
  }, [metrics]);

  const chartData = useMemo(() => {
    return metrics.map((m, i) => ({
      name: shortName(m.property.name),
      fullName: m.property.name,
      revenue: Math.round(m.revenue),
      occupancy: Math.round(m.occupancyRate * 100),
      adr: Math.round(m.adr),
      revpar: Math.round(m.revpar),
      color: PROPERTY_COLORS[i % PROPERTY_COLORS.length],
    }));
  }, [metrics]);

  const chartConfig: Record<string, { key: string; label: string; formatter: (v: number) => string }> = {
    revenue: { key: 'revenue', label: t('benchmarking.charts.revenueTitle'), formatter: v => `€${v.toLocaleString()}` },
    occupancy: { key: 'occupancy', label: t('benchmarking.charts.occupancyTitle'), formatter: v => `${v}%` },
    adr: { key: 'adr', label: t('benchmarking.charts.adrTitle'), formatter: v => `€${v}` },
    revpar: { key: 'revpar', label: t('benchmarking.charts.revparTitle'), formatter: v => `€${v}` },
  };

  function exportCsv() {
    const headers = ['Property', 'Revenue', 'Bookings', 'Booked Nights', 'Occupancy %', 'ADR', 'RevPAR', 'Avg Stay'];
    const rows = metrics.map(m => [
      m.property.name,
      m.revenue.toFixed(2),
      m.bookingCount,
      m.bookedNights,
      (m.occupancyRate * 100).toFixed(1),
      m.adr.toFixed(2),
      m.revpar.toFixed(2),
      m.avgStay.toFixed(1),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmarking-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const top3 = metrics.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : top3;
  const podiumStyleMap = top3.length >= 3 ? [PODIUM_STYLES[1], PODIUM_STYLES[0], PODIUM_STYLES[2]] : top3.length === 2 ? [PODIUM_STYLES[1], PODIUM_STYLES[0]] : [PODIUM_STYLES[0]];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow-400" />
            {t('benchmarking.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('benchmarking.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as PeriodKey)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            {(['thisMonth', 'lastMonth', 'last3Months', 'last6Months', 'thisYear'] as PeriodKey[]).map(p => (
              <option key={p} value={p}>{t(`benchmarking.periods.${p}`)}</option>
            ))}
          </select>
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm flex items-center gap-2 transition">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('benchmarking.exportCsv')}</span>
          </button>
          <button onClick={loadData} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('benchmarking.noData')}</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {t('benchmarking.topPerformers')}
              </h2>
              <div className="flex items-end justify-center gap-4 sm:gap-8">
                {podiumOrder.map((m, idx) => {
                  const style = podiumStyleMap[idx];
                  const rank = metrics.indexOf(m);
                  return (
                    <motion.div key={m.property.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center gap-2 flex-1 max-w-[160px]"
                    >
                      <div className="text-center">
                        {style.icon}
                        <p className={`text-sm font-bold mt-1 ${style.textColor}`}>{PODIUM_STYLES[rank]?.label}</p>
                        <p className="text-white text-xs font-medium text-center leading-tight mt-1 px-1">
                          {shortName(m.property.name, 18)}
                        </p>
                        <p className="text-emerald-400 font-bold text-sm mt-1">€{m.revenue.toLocaleString()}</p>
                        <p className="text-slate-500 text-xs">{(m.occupancyRate * 100).toFixed(0)}% occ.</p>
                      </div>
                      <div className={`w-full ${style.height} bg-gradient-to-t ${style.color} rounded-t-xl opacity-80`} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart tabs */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
            <div className="flex flex-wrap gap-2 mb-5">
              {(['revenue', 'occupancy', 'adr', 'revpar'] as const).map(chart => (
                <button key={chart} onClick={() => setActiveChart(chart)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
                    activeChart === chart
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
                  }`}>
                  {chartConfig[chart].label}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={v => activeChart === 'occupancy' ? `${v}%` : `€${v}`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, _name: any, props: any) => [
                    chartConfig[activeChart].formatter(Number(value ?? 0)),
                    props?.payload?.fullName ?? '',
                  ]}
                />
                <Bar dataKey={chartConfig[activeChart].key} radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed metrics table */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-violet-400" />
                {t('benchmarking.metrics')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-5 py-3 text-slate-400 font-medium w-8">#</th>
                    <th className="text-left px-3 py-3 text-slate-400 font-medium">{t('benchmarking.property')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium">{t('benchmarking.revenue')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium hidden sm:table-cell">{t('benchmarking.bookings')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium">{t('benchmarking.occupancy')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium hidden md:table-cell">{t('benchmarking.adr')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium hidden md:table-cell">{t('benchmarking.revpar')}</th>
                    <th className="text-right px-3 py-3 text-slate-400 font-medium hidden lg:table-cell">{t('benchmarking.avgStay')}</th>
                    <th className="text-right px-5 py-3 text-slate-400 font-medium hidden lg:table-cell">{t('benchmarking.vsAvg')}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, i) => {
                    const color = PROPERTY_COLORS[i % PROPERTY_COLORS.length];
                    const revDiff = avgMetrics.revenue > 0 ? ((m.revenue - avgMetrics.revenue) / avgMetrics.revenue) * 100 : 0;
                    const isTop = i === 0;
                    const isBottom = i === metrics.length - 1 && metrics.length > 1;
                    return (
                      <motion.tr key={m.property.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition ${
                          isTop ? 'bg-yellow-500/5' : isBottom ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-slate-500 font-mono text-xs">{i + 1}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div>
                              <p className="text-white font-medium leading-tight">{m.property.name}</p>
                              {isTop && (
                                <span className="text-xs text-yellow-400 flex items-center gap-1">
                                  <Trophy className="w-2.5 h-2.5" /> {t('benchmarking.best')}
                                </span>
                              )}
                              {isBottom && (
                                <span className="text-xs text-red-400">{t('benchmarking.worst')}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <span className="text-emerald-400 font-bold">€{m.revenue.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3.5 text-right hidden sm:table-cell">
                          <div className="flex items-center justify-end gap-1 text-slate-300">
                            <CalendarDays className="w-3 h-3 text-slate-500" />
                            {m.bookingCount}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <OccupancyBadge value={m.occupancyRate} />
                        </td>
                        <td className="px-3 py-3.5 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-1 text-slate-300">
                            <DollarSign className="w-3 h-3 text-slate-500" />
                            {m.adr.toFixed(0)}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-1 text-blue-300">
                            <BarChart2 className="w-3 h-3 text-slate-500" />
                            {m.revpar.toFixed(0)}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right text-slate-400 hidden lg:table-cell">
                          {m.avgStay.toFixed(1)}n
                        </td>
                        <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                          <VsAvgBadge diff={revDiff} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary cards bottom */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('benchmarking.property'), value: metrics.length, icon: <Home className="w-4 h-4 text-slate-400" />, sub: t('common.total') || 'Total' },
              { label: t('benchmarking.revenue'), value: `€${metrics.reduce((s, m) => s + m.revenue, 0).toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-emerald-400" />, sub: t('benchmarking.periods.' + period) },
              { label: t('benchmarking.bookings'), value: metrics.reduce((s, m) => s + m.bookingCount, 0), icon: <CalendarDays className="w-4 h-4 text-blue-400" />, sub: t('benchmarking.periods.' + period) },
              { label: `Ø ${t('benchmarking.occupancy')}`, value: `${(avgMetrics.occupancy * 100).toFixed(1)}%`, icon: <BarChart2 className="w-4 h-4 text-violet-400" />, sub: t('benchmarking.periods.' + period) },
            ].map((card, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{card.label}</span>
                  {card.icon}
                </div>
                <p className="text-xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OccupancyBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{pct}%</span>;
}

function VsAvgBadge({ diff }: { diff: number }) {
  if (Math.abs(diff) < 1) return <span className="text-slate-500 text-xs flex items-center justify-end gap-1"><Minus className="w-3 h-3" /> 0%</span>;
  return diff > 0
    ? <span className="text-emerald-400 text-xs flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3" />+{diff.toFixed(0)}%</span>
    : <span className="text-red-400 text-xs flex items-center justify-end gap-1"><TrendingDown className="w-3 h-3" />{diff.toFixed(0)}%</span>;
}
