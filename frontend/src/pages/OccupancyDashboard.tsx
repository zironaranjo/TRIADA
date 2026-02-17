import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Home,
    Moon,
    Sun,
    BarChart3,
    TrendingUp,
    RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Booking {
    id: string;
    guest_name: string;
    start_date: string;
    end_date: string;
    status: string;
    total_price: number;
    platform: string;
    property_id: string;
}

interface Property {
    id: string;
    name: string;
    status: string;
    price_per_night: number;
}

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    DIRECT: { bg: 'bg-indigo-500/80', border: 'border-indigo-400', text: 'text-indigo-200' },
    AIRBNB: { bg: 'bg-rose-500/80', border: 'border-rose-400', text: 'text-rose-200' },
    BOOKING_COM: { bg: 'bg-blue-500/80', border: 'border-blue-400', text: 'text-blue-200' },
    VRBO: { bg: 'bg-violet-500/80', border: 'border-violet-400', text: 'text-violet-200' },
    LODGIFY: { bg: 'bg-emerald-500/80', border: 'border-emerald-400', text: 'text-emerald-200' },
    OTHER: { bg: 'bg-slate-500/80', border: 'border-slate-400', text: 'text-slate-200' },
};

const PLATFORM_LEGEND: Record<string, string> = {
    DIRECT: '#818cf8',
    AIRBNB: '#f43f5e',
    BOOKING_COM: '#3b82f6',
    VRBO: '#8b5cf6',
    LODGIFY: '#10b981',
    OTHER: '#64748b',
};

export default function OccupancyDashboard() {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [hoveredBooking, setHoveredBooking] = useState<Booking | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const startStr = startOfMonth.toISOString().split('T')[0];
            const endStr = endOfMonth.toISOString().split('T')[0];

            const [bRes, pRes] = await Promise.all([
                supabase
                    .from('bookings')
                    .select('id, guest_name, start_date, end_date, status, total_price, platform, property_id')
                    .neq('status', 'cancelled')
                    .lte('start_date', endStr)
                    .gte('end_date', startStr),
                supabase
                    .from('properties')
                    .select('id, name, status, price_per_night')
                    .eq('status', 'active')
                    .order('name'),
            ]);

            setBookings(bRes.data || []);
            setProperties(pRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, [currentDate]);

    const daysInMonth = useMemo(() => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    }, [currentDate]);

    const days = useMemo(() => {
        const result: Date[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            result.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }
        return result;
    }, [currentDate, daysInMonth]);

    const monthLabel = useMemo(() => {
        return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }, [currentDate]);

    const today = useMemo(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }, []);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        const d = new Date();
        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    };

    // Calculate booking position on the Gantt chart
    const getBookingStyle = (booking: Booking) => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const bStart = new Date(booking.start_date);
        const bEnd = new Date(booking.end_date);

        const visibleStart = bStart < monthStart ? monthStart : bStart;
        const visibleEnd = bEnd > monthEnd ? monthEnd : bEnd;

        const startDay = visibleStart.getDate();
        const endDay = visibleEnd.getDate();

        const left = ((startDay - 1) / daysInMonth) * 100;
        const width = ((endDay - startDay + 1) / daysInMonth) * 100;

        return { left: `${left}%`, width: `${Math.max(width, 100 / daysInMonth)}%` };
    };

    // Per-property occupancy stats
    const propertyStats = useMemo(() => {
        return properties.map((prop) => {
            const propBookings = bookings.filter((b) => b.property_id === prop.id);
            let bookedNights = 0;

            propBookings.forEach((b) => {
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const bStart = new Date(b.start_date);
                const bEnd = new Date(b.end_date);
                const visibleStart = bStart < monthStart ? monthStart : bStart;
                const visibleEnd = bEnd > monthEnd ? monthEnd : bEnd;
                const nights = Math.max(0, Math.ceil((visibleEnd.getTime() - visibleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                bookedNights += nights;
            });

            const occupancy = Math.min(100, Math.round((bookedNights / daysInMonth) * 100));
            const revenue = propBookings.reduce((sum, b) => sum + Number(b.total_price), 0);

            return { ...prop, bookings: propBookings, bookedNights, occupancy, revenue };
        });
    }, [properties, bookings, currentDate, daysInMonth]);

    // Overall KPIs
    const kpis = useMemo(() => {
        const totalNights = properties.length * daysInMonth;
        const bookedNights = propertyStats.reduce((sum, p) => sum + p.bookedNights, 0);
        const availableNights = totalNights - bookedNights;
        const overallOccupancy = totalNights > 0 ? Math.round((bookedNights / totalNights) * 100) : 0;
        const totalRevenue = propertyStats.reduce((sum, p) => sum + p.revenue, 0);

        return { totalNights, bookedNights, availableNights, overallOccupancy, totalRevenue };
    }, [propertyStats, properties.length, daysInMonth]);

    // Platforms used this month
    const activePlatforms = useMemo(() => {
        const platforms = new Set(bookings.map((b) => b.platform));
        return Array.from(platforms);
    }, [bookings]);

    const handleBookingHover = (booking: Booking, e: React.MouseEvent) => {
        setHoveredBooking(booking);
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('occupancy.title')}</h1>
                    <p className="text-sm text-slate-400 mt-1">{t('occupancy.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                    >
                        {t('occupancy.today')}
                    </button>
                    <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-white font-semibold text-sm min-w-[160px] text-center capitalize">{monthLabel}</span>
                    <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: t('occupancy.overallOccupancy'), value: `${kpis.overallOccupancy}%`, icon: BarChart3, color: 'text-indigo-400', highlight: kpis.overallOccupancy >= 70 },
                    { label: t('occupancy.properties'), value: properties.length, icon: Home, color: 'text-emerald-400' },
                    { label: t('occupancy.bookedNights'), value: kpis.bookedNights, icon: Moon, color: 'text-purple-400' },
                    { label: t('occupancy.availableNights'), value: kpis.availableNights, icon: Sun, color: 'text-amber-400' },
                    { label: t('occupancy.revenue'), value: `$${kpis.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400' },
                ].map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                                <kpi.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={`text-xl font-bold ${kpi.highlight ? 'text-emerald-400' : 'text-white'}`}>{kpi.value}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Platform Legend */}
            <div className="flex flex-wrap items-center gap-4">
                {activePlatforms.map((platform) => (
                    <div key={platform} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PLATFORM_LEGEND[platform] || PLATFORM_LEGEND.OTHER }}
                        />
                        <span className="text-xs text-slate-400">{platform === 'BOOKING_COM' ? 'Booking.com' : platform.charAt(0) + platform.slice(1).toLowerCase()}</span>
                    </div>
                ))}
                {activePlatforms.length === 0 && (
                    <span className="text-xs text-slate-500">{t('occupancy.noPlatforms')}</span>
                )}
            </div>

            {/* Gantt Chart */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                {/* Day Headers */}
                <div className="flex border-b border-white/5">
                    <div className="w-48 sm:w-56 flex-shrink-0 p-3 border-r border-white/5">
                        <span className="text-xs text-slate-500 uppercase font-semibold">{t('occupancy.property')}</span>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        {days.map((day) => {
                            const isToday = day.getTime() === today.getTime();
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            return (
                                <div
                                    key={day.getDate()}
                                    className={`flex-1 min-w-0 text-center py-2 border-r border-white/5 last:border-r-0 ${isWeekend ? 'bg-white/[0.02]' : ''}`}
                                >
                                    <p className={`text-[9px] sm:text-[10px] ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
                                        {day.getDate()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Property Rows */}
                {propertyStats.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">{t('occupancy.emptyTitle')}</h3>
                        <p className="text-sm text-slate-400">{t('occupancy.emptyDescription')}</p>
                    </div>
                ) : (
                    propertyStats.map((prop, rowIdx) => (
                        <div
                            key={prop.id}
                            className={`flex border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                        >
                            {/* Property Name + Occupancy */}
                            <div className="w-48 sm:w-56 flex-shrink-0 p-3 border-r border-white/5">
                                <p className="text-sm font-medium text-white truncate">{prop.name}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                prop.occupancy >= 80 ? 'bg-emerald-500' :
                                                prop.occupancy >= 50 ? 'bg-amber-500' :
                                                prop.occupancy >= 20 ? 'bg-orange-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${prop.occupancy}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-semibold ${
                                        prop.occupancy >= 80 ? 'text-emerald-400' :
                                        prop.occupancy >= 50 ? 'text-amber-400' :
                                        prop.occupancy >= 20 ? 'text-orange-400' : 'text-red-400'
                                    }`}>
                                        {prop.occupancy}%
                                    </span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="flex-1 relative" style={{ minHeight: '48px' }}>
                                {/* Weekend background stripes */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                    {days.map((day) => {
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                        const isToday = day.getTime() === today.getTime();
                                        return (
                                            <div
                                                key={day.getDate()}
                                                className={`flex-1 border-r border-white/5 last:border-r-0 ${isWeekend ? 'bg-white/[0.02]' : ''}`}
                                            >
                                                {isToday && (
                                                    <div className="absolute top-0 bottom-0 w-[2px] bg-indigo-500/50" style={{
                                                        left: `${((day.getDate() - 0.5) / daysInMonth) * 100}%`,
                                                    }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Booking Bars */}
                                <div className="absolute inset-0 py-2 px-0.5">
                                    {prop.bookings.map((booking) => {
                                        const style = getBookingStyle(booking);
                                        const platformStyle = PLATFORM_COLORS[booking.platform] || PLATFORM_COLORS.OTHER;

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`absolute top-2 bottom-2 ${platformStyle.bg} ${platformStyle.border} border rounded-md cursor-pointer hover:brightness-110 transition-all flex items-center overflow-hidden`}
                                                style={{ left: style.left, width: style.width }}
                                                onMouseEnter={(e) => handleBookingHover(booking, e)}
                                                onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setHoveredBooking(null)}
                                            >
                                                <span className={`text-[9px] sm:text-[10px] font-medium ${platformStyle.text} truncate px-1.5`}>
                                                    {booking.guest_name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Per-Property Occupancy Summary */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-white mb-4">{t('occupancy.summaryTitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {propertyStats
                        .sort((a, b) => b.occupancy - a.occupancy)
                        .map((prop) => (
                            <div key={prop.id} className="bg-white/5 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-white truncate flex-1">{prop.name}</p>
                                    <span className={`text-sm font-bold ml-2 ${
                                        prop.occupancy >= 80 ? 'text-emerald-400' :
                                        prop.occupancy >= 50 ? 'text-amber-400' :
                                        prop.occupancy >= 20 ? 'text-orange-400' : 'text-red-400'
                                    }`}>
                                        {prop.occupancy}%
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prop.occupancy}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                            prop.occupancy >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                            prop.occupancy >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                            prop.occupancy >= 20 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                            'bg-gradient-to-r from-red-500 to-red-400'
                                        }`}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>{prop.bookedNights} {t('occupancy.nights')} · {prop.bookings.length} {t('occupancy.bookingsLabel')}</span>
                                    <span>${prop.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredBooking && (
                <div
                    className="fixed z-[9999] bg-slate-800 border border-white/10 rounded-lg px-4 py-3 shadow-2xl pointer-events-none"
                    style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 60 }}
                >
                    <p className="text-sm font-semibold text-white">{hoveredBooking.guest_name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {new Date(hoveredBooking.start_date).toLocaleDateString()} → {new Date(hoveredBooking.end_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">{hoveredBooking.platform === 'BOOKING_COM' ? 'Booking.com' : hoveredBooking.platform}</span>
                        <span className="text-xs font-semibold text-emerald-400">${Number(hoveredBooking.total_price).toLocaleString()}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
