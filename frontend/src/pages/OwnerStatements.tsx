import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    FileText, Users, DollarSign, TrendingDown,
    ChevronDown, ChevronUp, Building2, Calendar,
    Download,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToPDF, exportToCSV } from '../lib/exportUtils';
import { useUserAvatar } from '../hooks/useUserAvatar';

// ─── Types ────────────────────────────────────────────
interface Property {
    id: string;
    name: string;
    owner_id: string;
}

interface Booking {
    id: string;
    guest_name: string;
    total_price: number;
    platform: string;
    status: string;
    start_date: string;
    end_date: string;
    property_id: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    property_id: string | null;
    date: string;
}

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface OwnerStatement {
    owner: Owner;
    properties: Property[];
    bookings: Booking[];
    expenses: Expense[];
    grossRevenue: number;
    platformFees: number;
    agencyCommission: number;
    propertyExpenses: number;
    netPayout: number;
}

// ─── Constants ────────────────────────────────────────
const AGENCY_RATE = 0.20;
const PLATFORM_RATES: Record<string, number> = {
    AIRBNB: 0.03,
    BOOKING_COM: 0.15,
    'BOOKING.COM': 0.15,
    DIRECT: 0.03,
    VRBO: 0.05,
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmt = (v: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2
}).format(v);

// ─── Main Component ──────────────────────────────────
export default function OwnerStatements() {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [expandedOwner, setExpandedOwner] = useState<string | null>(null);
    const userAvatar = useUserAvatar();

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);


    const fetchData = async () => {
        setLoading(true);
        try {
            const monthStr = String(selectedMonth + 1).padStart(2, '0');
            const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            const startDate = `${selectedYear}-${monthStr}-01`;
            const endDate = `${selectedYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

            const [ownersRes, propsRes, bookingsRes, expensesRes] = await Promise.allSettled([
                supabase.from('owner').select('*'),
                supabase.from('properties').select('id, name, owner_id'),
                supabase.from('bookings').select('*').gte('start_date', startDate).lte('start_date', endDate).neq('status', 'cancelled'),
                supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate),
            ]);

            if (ownersRes.status === 'fulfilled') setOwners(ownersRes.value.data || []);
            if (propsRes.status === 'fulfilled') setProperties(propsRes.value.data || []);
            if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data || []);
            if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value.data || []);
        } catch (err) {
            console.error('Error fetching statement data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Compute statements per owner ─────────────────
    const statements: OwnerStatement[] = useMemo(() => {
        return owners.map(owner => {
            const ownerProps = properties.filter(p => p.owner_id === owner.id);
            const propIds = ownerProps.map(p => p.id);

            const ownerBookings = bookings.filter(b => propIds.includes(b.property_id));
            const ownerExpenses = expenses.filter(e => e.property_id && propIds.includes(e.property_id));

            const grossRevenue = ownerBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
            const platformFees = ownerBookings.reduce((s, b) => {
                const rate = PLATFORM_RATES[b.platform?.toUpperCase()] || 0.03;
                return s + (Number(b.total_price || 0) * rate);
            }, 0);
            const agencyCommission = grossRevenue * AGENCY_RATE;
            const propertyExpenses = ownerExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
            const netPayout = grossRevenue - platformFees - agencyCommission - propertyExpenses;

            return {
                owner,
                properties: ownerProps,
                bookings: ownerBookings,
                expenses: ownerExpenses,
                grossRevenue,
                platformFees,
                agencyCommission,
                propertyExpenses,
                netPayout,
            };
        }).filter(s => s.properties.length > 0).sort((a, b) => b.grossRevenue - a.grossRevenue);
    }, [owners, properties, bookings, expenses]);

    const totalPayout = statements.reduce((s, st) => s + st.netPayout, 0);
    const totalRevenue = statements.reduce((s, st) => s + st.grossRevenue, 0);

    // ─── Export Functions ─────────────────────────────
    const exportStatementsPDF = () => {
        const period = `${MONTHS[selectedMonth]} ${selectedYear}`;
        exportToPDF({
            title: 'Owner Statements',
            subtitle: period,
            headers: ['Owner', 'Properties', 'Bookings', 'Gross Revenue', 'Platform Fees', 'Agency (20%)', 'Expenses', 'Net Payout'],
            rows: statements.map(st => [
                `${st.owner.firstName} ${st.owner.lastName}`,
                st.properties.map(p => p.name).join(', '),
                st.bookings.length,
                fmt(st.grossRevenue),
                fmt(st.platformFees),
                fmt(st.agencyCommission),
                fmt(st.propertyExpenses),
                fmt(st.netPayout),
            ]),
            summaryRows: [
                { label: 'Period', value: period },
                { label: 'Total Revenue', value: fmt(totalRevenue) },
                { label: 'Total Owner Payouts', value: fmt(totalPayout), bold: true },
                { label: 'Owners', value: String(statements.length) },
            ],
            filename: `owner-statements-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`,
        });
    };

    const exportStatementsCSV = () => {
        exportToCSV(
            `owner-statements-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`,
            ['Owner', 'Properties', 'Bookings', 'Gross Revenue', 'Platform Fees', 'Agency Commission', 'Expenses', 'Net Payout'],
            statements.map(st => [
                `${st.owner.firstName} ${st.owner.lastName}`,
                st.properties.map(p => p.name).join(' | '),
                st.bookings.length,
                st.grossRevenue.toFixed(2),
                st.platformFees.toFixed(2),
                st.agencyCommission.toFixed(2),
                st.propertyExpenses.toFixed(2),
                st.netPayout.toFixed(2),
            ])
        );
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">Loading Statements...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-1"
                        >
                            Owner Statements
                        </motion.h1>
                        <p className="text-slate-400 text-sm sm:text-base">Monthly settlement reports for property owners</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i} className="bg-slate-800">{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} className="bg-slate-800">{y}</option>
                            ))}
                        </select>
                        {statements.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={exportStatementsPDF}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">PDF</span>
                                </button>
                                <button
                                    onClick={exportStatementsCSV}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">CSV</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <SummaryCard label="Total Revenue" value={fmt(totalRevenue)} icon={DollarSign} color="text-indigo-400" />
                    <SummaryCard label="Total Payouts" value={fmt(totalPayout)} icon={Users} color="text-emerald-400" />
                    <SummaryCard label="Owners" value={String(statements.length)} icon={Building2} color="text-amber-400" />
                    <SummaryCard label="Bookings" value={String(bookings.length)} icon={Calendar} color="text-blue-400" />
                </div>

                {/* Statements */}
                {statements.length > 0 ? (
                    <div className="space-y-3">
                        {statements.map(st => {
                            const isExpanded = expandedOwner === st.owner.id;
                            return (
                                <motion.div
                                    key={st.owner.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden"
                                >
                                    {/* Owner Header */}
                                    <button
                                        onClick={() => setExpandedOwner(isExpanded ? null : st.owner.id)}
                                        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {userAvatar ? (
                                                    <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-sm sm:text-lg font-bold text-white">
                                                        {st.owner.firstName?.charAt(0)}{st.owner.lastName?.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm sm:text-base font-semibold text-white">
                                                    {st.owner.firstName} {st.owner.lastName}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-slate-500">
                                                    {st.properties.length} {st.properties.length === 1 ? 'property' : 'properties'} · {st.bookings.length} bookings
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Net Payout</p>
                                                <p className={`text-base sm:text-xl font-bold ${st.netPayout >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {fmt(st.netPayout)}
                                                </p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                                        </div>
                                    </button>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="border-t border-white/5"
                                        >
                                            {/* Settlement Table */}
                                            <div className="p-4 sm:p-5">
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Settlement - {MONTHS[selectedMonth]} {selectedYear}
                                                </h4>
                                                <div className="bg-black/20 rounded-xl overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <tbody className="divide-y divide-white/5">
                                                            <tr>
                                                                <td className="px-4 py-2.5 text-slate-300">Gross Revenue</td>
                                                                <td className="px-4 py-2.5 text-right text-white font-semibold">{fmt(st.grossRevenue)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-4 py-2.5 text-slate-400">− Platform Fees (OTA/Stripe)</td>
                                                                <td className="px-4 py-2.5 text-right text-rose-400">-{fmt(st.platformFees)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-4 py-2.5 text-slate-400">− Agency Commission (20%)</td>
                                                                <td className="px-4 py-2.5 text-right text-amber-400">-{fmt(st.agencyCommission)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-4 py-2.5 text-slate-400">− Property Expenses</td>
                                                                <td className="px-4 py-2.5 text-right text-rose-400">-{fmt(st.propertyExpenses)}</td>
                                                            </tr>
                                                            <tr className="bg-emerald-500/5">
                                                                <td className="px-4 py-3 text-emerald-400 font-bold">= Net Payout to Owner</td>
                                                                <td className="px-4 py-3 text-right text-emerald-400 font-bold text-base">{fmt(st.netPayout)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Bookings Breakdown */}
                                            {st.bookings.length > 0 && (
                                                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Bookings Detail
                                                    </h4>
                                                    <div className="space-y-1.5">
                                                        {st.bookings.map(b => {
                                                            const prop = st.properties.find(p => p.id === b.property_id);
                                                            const nights = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24));
                                                            return (
                                                                <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/10 text-xs sm:text-sm">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="text-white font-medium truncate">{b.guest_name}</span>
                                                                        <span className="text-slate-600 hidden sm:inline">·</span>
                                                                        <span className="text-slate-500 hidden sm:inline truncate">{prop?.name}</span>
                                                                        <span className="text-slate-600 hidden sm:inline">·</span>
                                                                        <span className="text-slate-500 hidden sm:inline">{nights}n</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">{b.platform || 'DIRECT'}</span>
                                                                        <span className="text-emerald-400 font-semibold">{fmt(b.total_price)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expenses Breakdown */}
                                            {st.expenses.length > 0 && (
                                                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <TrendingDown className="h-3.5 w-3.5" />
                                                        Expenses Detail
                                                    </h4>
                                                    <div className="space-y-1.5">
                                                        {st.expenses.map(e => (
                                                            <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/10 text-xs sm:text-sm">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="text-white font-medium truncate">{e.description || e.category}</span>
                                                                    <span className="text-slate-600 hidden sm:inline">·</span>
                                                                    <span className="text-slate-500 hidden sm:inline">{new Date(e.date).toLocaleDateString()}</span>
                                                                </div>
                                                                <span className="text-rose-400 font-semibold flex-shrink-0">-{fmt(e.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Properties */}
                                            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    Properties
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {st.properties.map(p => (
                                                        <span key={p.id} className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center">
                        <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No statements for this period</p>
                        <p className="text-slate-600 text-xs mt-1">Create owners and assign properties to see statements here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Summary Card ─────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-[10px] sm:text-xs text-slate-500">{label}</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-white">{value}</p>
        </div>
    );
}
