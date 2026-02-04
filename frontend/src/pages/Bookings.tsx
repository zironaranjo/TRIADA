import { useEffect, useState } from 'react';
import { bookingsApi, propertiesApi } from '@/api/client';
import { motion } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Plus, RefreshCw
} from "lucide-react";
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isWithinInterval,
    differenceInDays, isSameDay
} from 'date-fns';

interface Property {
    id: string;
    name: string;
}

interface Booking {
    id: string;
    guestName: string;
    startDate: string;
    endDate: string;
    status: string;
    platform?: 'AIRBNB' | 'BOOKING_COM' | 'DIRECT';
    property: { id: string };
    totalPrice: number;
}

export default function Bookings() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, we would filter bookings by date range here
                const [propsRes, booksRes] = await Promise.all([
                    propertiesApi.getAll(),
                    bookingsApi.getAll()
                ]);
                setProperties(propsRes.data);
                setBookings(booksRes.data);
            } catch (error) {
                console.error('Failed to load calendar data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentDate]);

    const getBookingStyles = (platform?: string) => {
        switch (platform) {
            case 'AIRBNB':
                return 'bg-gradient-to-r from-[#FF5A5F] to-[#FF385C] border-[#FF5A5F]';
            case 'BOOKING_COM':
                return 'bg-gradient-to-r from-[#003580] to-[#006CE4] border-[#003580]';
            default: // DIRECT
                return 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500';
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    if (loading) return (
        <div className="flex h-full items-center justify-center text-white">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[#0f172a] text-slate-100 overflow-hidden">
            {/* Toolbar */}
            <header className="px-6 py-4 border-b border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            Multi-Calendar
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20">Beta</span>
                        </h1>
                    </div>

                    <div className="flex items-center bg-slate-800/50 rounded-lg p-1 border border-white/5">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="px-4 font-semibold min-w-[140px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </div>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <button onClick={goToToday} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        Today
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 mr-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#FF5A5F]"></div> Airbnb
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#003580]"></div> Booking.com
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Direct
                        </div>
                    </div>

                    <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20">
                        <Plus className="h-4 w-4" /> New Booking
                    </button>
                </div>
            </header>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <div className="min-w-max">
                    {/* Header Row (Days) */}
                    <div className="flex sticky top-0 z-10 bg-[#0f172a] border-b border-white/10 shadow-xl">
                        {/* Empty corner for Property Names */}
                        <div className="w-64 flex-shrink-0 sticky left-0 z-20 bg-[#0f172a] border-r border-white/10 p-4 font-semibold text-slate-400 flex items-center">
                            Property
                        </div>
                        {/* Days */}
                        {daysInMonth.map((day) => {
                            const isToday = isSameDay(day, new Date());
                            return (
                                <div
                                    key={day.toString()}
                                    className={`w-12 flex-shrink-0 text-center py-3 border-r border-white/5 flex flex-col items-center justify-center ${isToday ? 'bg-primary/5' : ''}`}
                                >
                                    <span className="text-xs text-slate-500 font-medium uppercase">{format(day, 'EEE')}</span>
                                    <span className={`text-sm font-bold mt-1 h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-slate-300'}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Property Rows */}
                    <div className="divide-y divide-white/5">
                        {properties.map((property) => (
                            <div key={property.id} className="flex relative group hover:bg-white/[0.02] transition-colors">
                                {/* Property Name Column (Sticky) */}
                                <div className="w-64 flex-shrink-0 sticky left-0 z-10 bg-[#0f172a] border-r border-white/10 p-4 flex items-center group-hover:bg-[#131c33] transition-colors">
                                    <div className="truncate">
                                        <p className="font-medium text-slate-200">{property.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">Entire Villa • 4 Guests</p>
                                    </div>
                                </div>

                                {/* Timeline Cells */}
                                <div className="flex relative">
                                    {daysInMonth.map((day) => (
                                        <div key={day.toString()} className="w-12 h-20 flex-shrink-0 border-r border-white/5"></div>
                                    ))}

                                    {/* Bookings Overlay */}
                                    {bookings
                                        .filter(b => b.property?.id === property.id)
                                        .map(booking => {
                                            const startDate = new Date(booking.startDate);
                                            const endDate = new Date(booking.endDate);

                                            // Only render if booking overlaps with current month
                                            if (!isWithinInterval(startDate, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) }) &&
                                                !isWithinInterval(endDate, { start: startOfMonth(currentDate), end: endOfMonth(currentDate) })) {
                                                // Handle edge case where booking spans entire month later
                                                return null;
                                            }

                                            // Calculate Position
                                            const monthStart = startOfMonth(currentDate);

                                            // Start day relative to month (0-indexed)
                                            // If booking started before this month, start at 0
                                            let startOffset = differenceInDays(startDate, monthStart);
                                            if (startOffset < 0) startOffset = 0;

                                            // Duration in days visible in this month
                                            // End date limited to end of month if needed
                                            // Simple logic for now: difference between end and start
                                            // Visual correction: need to handle bookings starting before month

                                            const actualStart = startDate < monthStart ? monthStart : startDate;
                                            const duration = differenceInDays(endDate, actualStart) + 1; // +1 to include last day visually

                                            const widthPx = duration * 48; // 48px per day (w-12)
                                            const leftPx = startOffset * 48; // 48px per day

                                            return (
                                                <motion.div
                                                    key={booking.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`absolute top-2 bottom-2 rounded-md shadow-md border border-white/10 px-2 py-1 flex flex-col justify-center cursor-pointer hover:brightness-110 z-0 ${getBookingStyles(booking.platform)}`}
                                                    style={{
                                                        left: `${leftPx}px`,
                                                        width: `${widthPx - 4}px`, // -4 for gap
                                                        marginLeft: '2px'
                                                    }}
                                                >
                                                    <p className="text-xs font-bold text-white truncate drop-shadow-md">{booking.guestName}</p>
                                                    <p className="text-[10px] text-white/90 truncate drop-shadow-md font-mono">
                                                        €{booking.totalPrice}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}

                        {/* Empty state if no properties */}
                        {properties.length === 0 && (
                            <div className="p-12 text-center text-slate-500">
                                No properties found. Add your first property to view the calendar.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
