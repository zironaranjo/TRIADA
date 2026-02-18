import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Check,
  RefreshCw,
  Flame,
  Snowflake,
  Sun,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Property {
  id: string;
  name: string;
  price_per_night: number | null;
  status: string;
}

interface Booking {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
}

interface SeasonRule {
  id: string;
  name: string;
  start: string; // MM-DD
  end: string;   // MM-DD
  multiplier: number;
  type: 'high' | 'mid' | 'low';
}

interface PriceSuggestion {
  property: Property;
  currentPrice: number;
  suggestedPrice: number;
  occupancyRate: number;
  reasonKey: string;
  change: number;
}

const STORAGE_KEY = 'triadak_season_rules';

const seasonIcons = {
  high: <Flame className="w-3.5 h-3.5 text-orange-400" />,
  mid: <Sun className="w-3.5 h-3.5 text-yellow-400" />,
  low: <Snowflake className="w-3.5 h-3.5 text-blue-400" />,
};

const seasonColors = {
  high: 'bg-orange-900/20 border-orange-800 text-orange-300',
  mid: 'bg-yellow-900/20 border-yellow-800 text-yellow-300',
  low: 'bg-blue-900/20 border-blue-800 text-blue-300',
};

function mmdd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function isDateInRule(date: Date, rule: SeasonRule): boolean {
  const current = mmdd(date);
  const { start, end } = rule;
  if (start <= end) return current >= start && current <= end;
  // Wraps year-end (e.g. Dec–Jan)
  return current >= start || current <= end;
}

function getSuggestedPrice(basePrice: number, date: Date, rules: SeasonRule[], occupancy: number): { price: number; reasonKey: string } {
  let multiplier = 1;
  let reasonKey = 'base';

  // Apply season rule
  const matched = rules.find(r => isDateInRule(date, r));
  if (matched) {
    multiplier = matched.multiplier;
    reasonKey = matched.type === 'high' ? 'highSeason' : matched.type === 'low' ? 'lowSeason' : 'midSeason';
  }

  // Occupancy adjustment
  if (occupancy >= 0.8) {
    multiplier *= 1.15;
    reasonKey = 'highOccupancy';
  } else if (occupancy < 0.3) {
    multiplier *= 0.85;
    reasonKey = 'lowOccupancy';
  }

  // Weekend premium (+10%)
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    multiplier *= 1.1;
    if (reasonKey === 'base') reasonKey = 'weekend';
  }

  return { price: Math.round(basePrice * multiplier), reasonKey };
}

export default function RevenueManagement() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [rules, setRules] = useState<SeasonRule[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', start: '', end: '', multiplier: '1.3', type: 'high' as SeasonRule['type'] });
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(rules)); }, [rules]);

  async function loadData() {
    setLoading(true);
    const [{ data: propsData }, { data: bookData }] = await Promise.all([
      supabase.from('properties').select('id, name, price_per_night, status').eq('status', 'active'),
      supabase.from('bookings').select('id, property_id, start_date, end_date, total_price, status').neq('status', 'cancelled'),
    ]);
    setProperties((propsData || []) as Property[]);
    setBookings((bookData || []) as Booking[]);
    setLoading(false);
  }

  // Occupancy for each property this month
  const occupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    properties.forEach(p => {
      const propBookings = bookings.filter(b =>
        b.property_id === p.id &&
        b.start_date <= monthEnd &&
        b.end_date >= monthStart
      );
      let bookedDays = 0;
      propBookings.forEach(b => {
        const start = new Date(Math.max(new Date(b.start_date).getTime(), new Date(monthStart).getTime()));
        const end = new Date(Math.min(new Date(b.end_date).getTime(), new Date(monthEnd).getTime()));
        bookedDays += Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      });
      map[p.id] = bookedDays / daysInMonth;
    });
    return map;
  }, [properties, bookings]);

  // Price suggestions
  const suggestions = useMemo((): PriceSuggestion[] => {
    const today = new Date();
    return properties
      .filter(p => selectedPropertyId === 'all' || p.id === selectedPropertyId)
      .map(p => {
        const base = p.price_per_night || 100;
        const occupancy = occupancyMap[p.id] || 0;
        const { price, reasonKey } = getSuggestedPrice(base, today, rules, occupancy);
        return {
          property: p,
          currentPrice: base,
          suggestedPrice: price,
          occupancyRate: occupancy,
          reasonKey,
          change: price - base,
        };
      });
  }, [properties, occupancyMap, rules, selectedPropertyId]);

  // KPIs
  const kpis = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const totalRevenue = bookings
      .filter(b => {
        const s = new Date(b.start_date);
        return s.getMonth() === calMonth && s.getFullYear() === calYear;
      })
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const totalAvailableNights = properties.length * daysInMonth;
    const revpar = totalAvailableNights > 0 ? totalRevenue / totalAvailableNights : 0;

    const allOccupancies = Object.values(occupancyMap);
    const avgOccupancy = allOccupancies.length > 0 ? allOccupancies.reduce((a, b) => a + b, 0) / allOccupancies.length : 0;

    const bookedNights = bookings.filter(b => {
      const s = new Date(b.start_date);
      return s.getMonth() === calMonth && s.getFullYear() === calYear;
    }).reduce((sum, b) => {
      const nights = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / 86400000);
      return sum + nights;
    }, 0);

    const adr = bookedNights > 0 ? totalRevenue / bookedNights : 0;

    const potentialRevenue = suggestions.reduce((sum, s) => sum + s.suggestedPrice * daysInMonth * s.occupancyRate, 0);

    return { revpar, adr, avgOccupancy, potentialRevenue };
  }, [bookings, properties, occupancyMap, calMonth, calYear, suggestions]);

  async function applyPrice(suggestion: PriceSuggestion) {
    setApplyingId(suggestion.property.id);
    await supabase.from('properties').update({ price_per_night: suggestion.suggestedPrice }).eq('id', suggestion.property.id);
    setApplyingId(null);
    setAppliedId(suggestion.property.id);
    setTimeout(() => setAppliedId(null), 2000);
    await loadData();
  }

  function addRule() {
    if (!newRule.name || !newRule.start || !newRule.end) return;
    const rule: SeasonRule = {
      id: crypto.randomUUID(),
      name: newRule.name,
      start: newRule.start,
      end: newRule.end,
      multiplier: parseFloat(newRule.multiplier) || 1,
      type: newRule.type,
    };
    setRules(prev => [...prev, rule]);
    setNewRule({ name: '', start: '', end: '', multiplier: '1.3', type: 'high' });
    setShowRuleModal(false);
  }

  function deleteRule(id: string) { setRules(prev => prev.filter(r => r.id !== id)); }

  // Calendar data
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const calendarData = useMemo(() => {
    const map: Record<number, { price: number; reasonKey: string; booked: boolean }> = {};
    const focusProp = properties.find(p => p.id === selectedPropertyId);
    const basePrice = focusProp?.price_per_night || (properties[0]?.price_per_night || 100);
    const propId = selectedPropertyId !== 'all' ? selectedPropertyId : properties[0]?.id;
    const occupancy = propId ? (occupancyMap[propId] || 0) : 0;

    for (let day = 1; day <= daysInCalMonth; day++) {
      const date = new Date(calYear, calMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const { price, reasonKey } = getSuggestedPrice(basePrice, date, rules, occupancy);
      const booked = bookings.some(b =>
        (propId ? b.property_id === propId : true) &&
        b.start_date <= dateStr && b.end_date >= dateStr
      );
      map[day] = { price, reasonKey, booked };
    }
    return map;
  }, [properties, bookings, selectedPropertyId, calMonth, calYear, rules, occupancyMap, daysInCalMonth]);

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
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            {t('revenue.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('revenue.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPropertyId}
            onChange={e => setSelectedPropertyId(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="all">{t('revenue.allProperties')}</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={loadData} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('revenue.kpi.revpar'), value: `€${kpis.revpar.toFixed(0)}`, desc: t('revenue.kpi.revparDesc'), icon: <BarChart2 className="w-5 h-5 text-blue-400" />, color: 'blue' },
          { label: t('revenue.kpi.adr'), value: `€${kpis.adr.toFixed(0)}`, desc: t('revenue.kpi.adrDesc'), icon: <DollarSign className="w-5 h-5 text-emerald-400" />, color: 'emerald' },
          { label: t('revenue.kpi.occupancy'), value: `${(kpis.avgOccupancy * 100).toFixed(0)}%`, desc: t('revenue.kpi.occupancyDesc'), icon: <Calendar className="w-5 h-5 text-violet-400" />, color: 'violet' },
          { label: t('revenue.kpi.potential'), value: `€${kpis.potentialRevenue.toFixed(0)}`, desc: t('revenue.kpi.potentialDesc'), icon: <TrendingUp className="w-5 h-5 text-orange-400" />, color: 'orange' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-slate-800/60 border border-slate-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs">{kpi.label}</span>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-slate-500 text-xs mt-1">{kpi.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Suggestions */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            {t('revenue.suggestions')}
          </h2>
          {suggestions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map(s => (
                <div key={s.property.id} className="bg-slate-900/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.property.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-slate-400 text-xs">€{s.currentPrice}/night</span>
                      <span className="text-slate-600">→</span>
                      <span className={`text-sm font-bold ${s.change > 0 ? 'text-emerald-400' : s.change < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                        €{s.suggestedPrice}
                      </span>
                      {s.change !== 0 && (
                        <span className={`flex items-center gap-0.5 text-xs ${s.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {s.change > 0 ? '+' : ''}{s.change}€
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500 text-xs">{(s.occupancyRate * 100).toFixed(0)}% occ.</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 text-xs italic">{t(`revenue.reasons.${s.reasonKey}`)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => applyPrice(s)}
                    disabled={s.change === 0 || applyingId === s.property.id}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      s.change === 0
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : appliedId === s.property.id
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {applyingId === s.property.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : appliedId === s.property.id ? (
                      <Check className="w-3 h-3" />
                    ) : null}
                    {appliedId === s.property.id ? t('revenue.priceApplied') : t('revenue.applyPrice')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Season Rules */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              {t('revenue.rules')}
            </h2>
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> {t('revenue.addRule')}
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Info className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">{t('revenue.noRules')}</p>
              <p className="text-slate-500 text-xs mt-1">{t('revenue.noRulesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${seasonColors[rule.type]}`}>
                  <div className="flex items-center gap-2">
                    {seasonIcons[rule.type]}
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs opacity-70">{rule.start} → {rule.end} · ×{rule.multiplier}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Calendar */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              {t('revenue.calendar')}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">{t('revenue.calendarDesc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { let m = calMonth - 1; let y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); }}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white text-sm font-medium w-28 text-center">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={() => { let m = calMonth + 1; let y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); }}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/60" /><span className="text-slate-400">{t('revenue.reasons.highSeason')}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500/40 border border-yellow-500/60" /><span className="text-slate-400">{t('revenue.reasons.midSeason')}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-500/60" /><span className="text-slate-400">{t('revenue.reasons.lowSeason')}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-600 border border-slate-500" /><span className="text-slate-400">{t('revenue.booked')}</span></div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-center text-xs text-slate-500 py-1 font-medium">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInCalMonth }).map((_, i) => {
            const day = i + 1;
            const data = calendarData[day];
            const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
            const bg = data?.booked ? 'bg-slate-700 border-slate-600' :
              data?.reasonKey === 'highSeason' || data?.reasonKey === 'highOccupancy' ? 'bg-orange-500/20 border-orange-500/40' :
              data?.reasonKey === 'lowSeason' || data?.reasonKey === 'lowOccupancy' ? 'bg-blue-500/20 border-blue-500/40' :
              data?.reasonKey === 'midSeason' ? 'bg-yellow-500/20 border-yellow-500/40' :
              data?.reasonKey === 'weekend' ? 'bg-purple-500/20 border-purple-500/40' :
              'bg-slate-800/40 border-slate-700/50';

            return (
              <div key={day} className={`rounded-lg border p-1.5 min-h-[56px] flex flex-col ${bg} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                <span className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{day}</span>
                {data && (
                  <span className={`text-xs font-bold mt-auto ${data.booked ? 'text-slate-400' : 'text-white'}`}>
                    €{data.price}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Rule Modal */}
      <AnimatePresence>
        {showRuleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRuleModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-white">{t('revenue.addRule')}</h3>
                <button onClick={() => setShowRuleModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{t('revenue.ruleName')}</label>
                  <input type="text" value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g. Summer High Season"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{t('revenue.ruleType')}</label>
                  <div className="flex gap-2">
                    {(['high', 'mid', 'low'] as const).map(type => (
                      <button key={type} onClick={() => setNewRule({ ...newRule, type })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition ${
                          newRule.type === type ? seasonColors[type] : 'bg-slate-700 border-slate-600 text-slate-400'
                        }`}>
                        {seasonIcons[type]} {t(`revenue.seasonTypes.${type}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{t('revenue.ruleStart')} (MM-DD)</label>
                    <input type="text" value={newRule.start} onChange={e => setNewRule({ ...newRule, start: e.target.value })}
                      placeholder="06-01"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">{t('revenue.ruleEnd')} (MM-DD)</label>
                    <input type="text" value={newRule.end} onChange={e => setNewRule({ ...newRule, end: e.target.value })}
                      placeholder="08-31"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">{t('revenue.ruleMultiplier')} (e.g. 1.5 = +50%)</label>
                  <input type="number" step="0.05" min="0.1" max="5" value={newRule.multiplier}
                    onChange={e => setNewRule({ ...newRule, multiplier: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                  <p className="text-xs text-slate-500 mt-1">
                    ×{newRule.multiplier} → base price {parseFloat(newRule.multiplier) > 1 ? `+${((parseFloat(newRule.multiplier) - 1) * 100).toFixed(0)}%` : `${((parseFloat(newRule.multiplier) - 1) * 100).toFixed(0)}%`}
                  </p>
                </div>
              </div>

              <button onClick={addRule} disabled={!newRule.name || !newRule.start || !newRule.end}
                className="w-full mt-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed">
                {t('revenue.addRule')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
