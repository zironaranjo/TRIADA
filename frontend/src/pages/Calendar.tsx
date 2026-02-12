import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    Filter,
    Building2,
    User,
    Clock,
    X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────
interface Booking {
    id: string;
    guest_name: string;
    guest_email: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
    total_price: number;
    currency: string;
    platform: string;
    property_id: string;
    properties: { name: string; image_url: string | null } | null;
}

interface Property {
    id: string;
    name: string;
    status: string;
}

// ─── Status & Platform Colors ─────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    confirmed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    checked_in: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    completed: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
};

const PLATFORM_COLORS: Record<string, string> = {
    DIRECT: 'bg-indigo-500',
    AIRBNB: 'bg-rose-500',
    BOOKING_COM: 'bg-blue-600',
    VRBO: 'bg-violet-500',
};

// ─── Helpers ──────────────────────────────────────────
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
}

function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Main Calendar Component ──────────────────────────
export default function Calendar() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [bookingsRes, propertiesRes] = await Promise.all([
                    supabase
                        .from('bookings')
                        .select('*, properties (name, image_url)')
                        .neq('status', 'cancelled')
                        .order('start_date', { ascending: true }),
                    supabase
                        .from('properties')
                        .select('id, name, status')
                        .eq('status', 'active')
                        .order('name'),
                ]);

                if (bookingsRes.data) setBookings(bookingsRes.data);
                if (propertiesRes.data) setProperties(propertiesRes.data);
            } catch (err) {
                console.error('Error fetching calendar data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter bookings by property
    const filteredBookings = useMemo(() => {
        if (selectedProperty === 'all') return bookings;
        return bookings.filter(b => b.property_id === selectedProperty);
    }, [bookings, selectedProperty]);

    // Build a map: date string -> bookings for that day
    const bookingsByDate = useMemo(() => {
        const map: Record<string, Booking[]> = {};
        const daysInMonth = getDaysInMonth(year, month);

        filteredBookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);

            for (let d = 1; d <= daysInMonth; d++) {
                const cellDate = new Date(year, month, d);
                if (cellDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                    cellDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
                    const key = `${year}-${month}-${d}`;
                    if (!map[key]) map[key] = [];
                    map[key].push(booking);
                }
            }
        });

        return map;
    }, [filteredBookings, year, month]);

    // Navigation
    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const goToday = () => {
        setYear(today.getFullYear());
        setMonth(today.getMonth());
    };

    // Calendar grid
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const totalCells = firstDay + daysInMonth;
    const rows = Math.ceil(totalCells / 7);

    // Stats for the month
    const monthStats = useMemo(() => {
        const monthBookings = filteredBookings.filter(b => {
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            return start <= monthEnd && end >= monthStart;
        });

        const revenue = monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const nights = monthBookings.reduce((sum, b) => {
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            const mStart = new Date(year, month, 1);
            const mEnd = new Date(year, month + 1, 0);
            const effStart = start < mStart ? mStart : start;
            const effEnd = end > mEnd ? mEnd : end;
            return sum + Math.max(0, Math.ceil((effEnd.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }, 0);
        const occupancy = daysInMonth > 0 ? Math.round((nights / daysInMonth) * 100) : 0;

        return { total: monthBookings.length, revenue, occupancy: Math.min(occupancy, 100) };
    }, [filteredBookings, year, month, daysInMonth]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <CalendarDays className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-400" />
                        Calendar
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Visual overview of all your bookings</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'}`}
                    >
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Property Filter */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                >
                    <button
                        onClick={() => setSelectedProperty('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedProperty === 'all' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        All Properties
                    </button>
                    {properties.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProperty(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedProperty === p.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* Month Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Bookings</p>
                    <p className="text-xl sm:text-2xl font-bold text-white mt-1">{monthStats.total}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Revenue</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">€{monthStats.revenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Occupancy</p>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-400 mt-1">{monthStats.occupancy}%</p>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-white min-w-[180px] sm:min-w-[220px] text-center">
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
                <button
                    onClick={goToday}
                    className="text-xs sm:text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/10"
                >
                    Today
                </button>
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="rounded-xl border border-white/5 overflow-hidden bg-[#1e293b]/30">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-white/5 border-b border-white/5">
                        {DAY_NAMES.map((day, i) => (
                            <div key={day} className="px-1 sm:px-3 py-2 sm:py-3 text-center">
                                <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</span>
                                <span className="sm:hidden text-[10px] font-semibold text-slate-500 uppercase">{DAY_NAMES_SHORT[i]}</span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="grid grid-cols-7">
                        {Array.from({ length: rows * 7 }).map((_, idx) => {
                            const dayNum = idx - firstDay + 1;
                            const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                            const cellDate = isValidDay ? new Date(year, month, dayNum) : null;
                            const isToday = cellDate ? isSameDay(cellDate, today) : false;
                            const key = `${year}-${month}-${dayNum}`;
                            const dayBookings = isValidDay ? (bookingsByDate[key] || []) : [];
                            const isPast = cellDate ? cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[52px] sm:min-h-[90px] lg:min-h-[110px] border-b border-r border-white/5 relative group transition-colors ${
                                        isValidDay ? 'hover:bg-white/[0.02]' : 'bg-white/[0.01]'
                                    } ${isPast && isValidDay ? 'opacity-60' : ''}`}
                                >
                                    {isValidDay && (
                                        <>
                                            {/* Day number */}
                                            <div className={`flex items-center justify-center sm:justify-start sm:px-2 pt-1 sm:pt-2`}>
                                                <span className={`text-xs sm:text-sm font-medium inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full ${
                                                    isToday
                                                        ? 'bg-indigo-500 text-white font-bold'
                                                        : 'text-slate-400'
                                                }`}>
                                                    {dayNum}
                                                </span>
                                            </div>

                                            {/* Booking indicators */}
                                            <div className="px-0.5 sm:px-1.5 mt-0.5 sm:mt-1 space-y-0.5">
                                                {/* Mobile: dots only */}
                                                <div className="sm:hidden flex justify-center gap-0.5 flex-wrap">
                                                    {dayBookings.slice(0, 3).map((b) => (
                                                        <button
                                                            key={b.id}
                                                            onClick={() => setSelectedBooking(b)}
                                                            className={`w-2 h-2 rounded-full ${STATUS_COLORS[b.status]?.dot || 'bg-slate-400'}`}
                                                        />
                                                    ))}
                                                    {dayBookings.length > 3 && (
                                                        <span className="text-[8px] text-slate-500">+{dayBookings.length - 3}</span>
                                                    )}
                                                </div>

                                                {/* Desktop: booking bars */}
                                                <div className="hidden sm:block space-y-0.5">
                                                    {dayBookings.slice(0, 3).map((b) => {
                                                        const startDate = new Date(b.start_date);
                                                        const isStart = cellDate && isSameDay(cellDate, startDate);
                                                        return (
                                                            <button
                                                                key={b.id}
                                                                onClick={() => setSelectedBooking(b)}
                                                                className={`w-full text-left truncate text-[10px] lg:text-xs px-1.5 py-0.5 rounded ${STATUS_COLORS[b.status]?.bg || 'bg-slate-500/20'} ${STATUS_COLORS[b.status]?.text || 'text-slate-400'} hover:brightness-125 transition-all cursor-pointer`}
                                                                title={`${b.guest_name} - ${b.properties?.name || 'Unknown'}`}
                                                            >
                                                                {isStart ? b.guest_name : '↳ ' + b.guest_name}
                                                            </button>
                                                        );
                                                    })}
                                                    {dayBookings.length > 3 && (
                                                        <p className="text-[10px] text-slate-500 px-1.5">+{dayBookings.length - 3} more</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-slate-500">
                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                ))}
            </div>

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <h3 className="text-lg font-semibold text-white">Booking Details</h3>
                            <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white transition-colors p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Status badge */}
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${STATUS_COLORS[selectedBooking.status]?.bg} ${STATUS_COLORS[selectedBooking.status]?.text}`}>
                                    {selectedBooking.status.replace('_', ' ')}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${PLATFORM_COLORS[selectedBooking.platform] || 'bg-slate-500'}`}>
                                    {selectedBooking.platform.replace('_', '.')}
                                </span>
                            </div>

                            {/* Guest */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/10">
                                    <User className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{selectedBooking.guest_name}</p>
                                    <p className="text-xs text-slate-500">{selectedBooking.guest_email}</p>
                                </div>
                            </div>

                            {/* Property */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Building2 className="h-4 w-4 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{selectedBooking.properties?.name || 'Unknown Property'}</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                    <Clock className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-white">
                                        {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {Math.ceil((new Date(selectedBooking.end_date).getTime() - new Date(selectedBooking.start_date).getTime()) / (1000 * 60 * 60 * 24))} nights
                                    </p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                                <span className="text-sm text-slate-400">Total Price</span>
                                <span className="text-xl font-bold text-emerald-400">
                                    {selectedBooking.currency === 'EUR' ? '€' : selectedBooking.currency}{selectedBooking.total_price?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
