import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Plus,
    Search,
    User,
    MapPin,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    List,
    ChevronLeft,
    ChevronRight,
    X,
    Mail,
    Phone,
    DollarSign,
    CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Type Definitions ---
interface Booking {
    id: string;
    guest_name: string;
    guest_email: string;
    guest_phone?: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
    total_price: number;
    currency: string;
    platform: string;
    payment_status: 'unpaid' | 'paid' | 'partial' | 'refunded';
    payment_url: string | null;
    property_id: string;
    properties: {
        name: string;
        image_url: string | null;
    } | null;
}

interface PropertyOption {
    id: string;
    name: string;
}

// --- Status Badge Component ---
const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    const styles = {
        confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        checked_in: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const icons = {
        confirmed: <CheckCircle className="h-3 w-3" />,
        checked_in: <CheckCircle className="h-3 w-3" />,
        pending: <Clock className="h-3 w-3" />,
        completed: <CheckCircle className="h-3 w-3" />,
        cancelled: <XCircle className="h-3 w-3" />,
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${styles[status]}`}>
            {icons[status]}
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
    );
};

// --- Status Color Map for Calendar ---
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    confirmed: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300' },
    checked_in: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
    pending: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
    completed: { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-300' },
    cancelled: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300' },
};

// --- Calendar Helpers ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Calendar Component ---
const BookingCalendar = ({ bookings, onBookingClick }: { bookings: Booking[]; onBookingClick: (b: Booking) => void }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const navigateMonth = (direction: number) => {
        let newMonth = currentMonth + direction;
        let newYear = currentYear;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        if (newMonth < 0) { newMonth = 11; newYear--; }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Get bookings that overlap with this month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth, daysInMonth);

    const monthBookings = useMemo(() => {
        return bookings.filter(b => {
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            return start <= monthEnd && end >= monthStart;
        });
    }, [bookings, currentMonth, currentYear]);

    // Map day -> bookings for that day
    const dayBookingsMap = useMemo(() => {
        const map: Record<number, Booking[]> = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            map[day] = monthBookings.filter(b => {
                return b.start_date <= dateStr && b.end_date >= dateStr;
            });
        }
        return map;
    }, [monthBookings, daysInMonth, currentMonth, currentYear]);

    const todayDate = today.getDate();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                        Today
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 border-b border-slate-700/50">
                {DAY_NAMES.map(day => (
                    <div key={day} className="text-center py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-700/20 bg-slate-900/20" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayBookings = dayBookingsMap[day] || [];
                    const isToday = isCurrentMonth && day === todayDate;
                    const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6;

                    return (
                        <div
                            key={day}
                            className={`min-h-[100px] border-b border-r border-slate-700/20 p-1.5 transition-colors ${
                                isToday ? 'bg-blue-500/5' : isWeekend ? 'bg-slate-900/30' : 'bg-transparent'
                            } hover:bg-slate-700/20`}
                        >
                            <div className={`text-xs font-medium mb-1 ${
                                isToday
                                    ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                                    : 'text-slate-500 pl-1'
                            }`}>
                                {day}
                            </div>

                            <div className="space-y-0.5">
                                {dayBookings.slice(0, 3).map((booking) => {
                                    const colors = statusColors[booking.status] || statusColors.pending;
                                    const isStart = booking.start_date === new Date(currentYear, currentMonth, day).toISOString().split('T')[0];

                                    return (
                                        <button
                                            key={booking.id}
                                            onClick={() => onBookingClick(booking)}
                                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate border transition-all hover:brightness-125 ${colors.bg} ${colors.border} ${colors.text}`}
                                            title={`${booking.guest_name} - ${booking.properties?.name || 'Property'}`}
                                        >
                                            {isStart ? `→ ${booking.guest_name}` : booking.guest_name}
                                        </button>
                                    );
                                })}
                                {dayBookings.length > 3 && (
                                    <p className="text-[10px] text-slate-500 pl-1">+{dayBookings.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 p-3 border-t border-slate-700/50 bg-slate-900/20">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                {Object.entries(statusColors).map(([status, colors]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
                        <span className="text-xs text-slate-400 capitalize">{status.replace('_', ' ')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Payment Status Badge ---
const PaymentBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        unpaid: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        refunded: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${styles[status] || styles.unpaid}`}>
            {status === 'paid' ? <CheckCircle className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
            {(status || 'unpaid').toUpperCase()}
        </span>
    );
};

// --- Platform Badge ---
const PlatformBadge = ({ platform }: { platform: string }) => {
    const colors: Record<string, string> = {
        AIRBNB: 'bg-rose-500/10 text-rose-400',
        BOOKING_COM: 'bg-blue-600/10 text-blue-300',
        DIRECT: 'bg-emerald-500/10 text-emerald-400',
        VRBO: 'bg-indigo-500/10 text-indigo-400',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[platform?.toUpperCase()] || colors.DIRECT}`}>
            {(platform || 'DIRECT').replace('_', '.')}
        </span>
    );
};

// --- Booking Detail Modal ---
const BookingDetailModal = ({ booking, onClose, onUpdate }: { booking: Booking; onClose: () => void; onUpdate: () => void }) => {
    const [actionLoading, setActionLoading] = useState('');
    const [copied, setCopied] = useState(false);

    const nights = Math.ceil(
        (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    const markAsPaid = async () => {
        setActionLoading('paid');
        try {
            const { error } = await supabase.from('bookings').update({
                payment_status: 'paid',
                status: 'confirmed',
            }).eq('id', booking.id);
            if (error) throw error;
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(`Error: ${err?.message || 'Could not update'}`);
        } finally {
            setActionLoading('');
        }
    };

    const markAsUnpaid = async () => {
        setActionLoading('unpaid');
        try {
            const { error } = await supabase.from('bookings').update({
                payment_status: 'unpaid',
            }).eq('id', booking.id);
            if (error) throw error;
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(`Error: ${err?.message || 'Could not update'}`);
        } finally {
            setActionLoading('');
        }
    };

    const generatePaymentLink = async () => {
        setActionLoading('link');
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.triadak.io';
            const res = await fetch(`${API_URL}/payments/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: booking.total_price,
                    guestEmail: booking.guest_email,
                    guestName: booking.guest_name,
                    propertyName: booking.properties?.name || 'Property',
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to generate payment link');
            }

            const data = await res.json();
            if (data.url) {
                // Save the payment URL to the booking
                await supabase.from('bookings').update({
                    payment_url: data.url,
                }).eq('id', booking.id);

                // Copy to clipboard
                await navigator.clipboard.writeText(data.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
                alert('Payment link generated and copied to clipboard!');
                onUpdate();
            }
        } catch (err: any) {
            console.error('Error generating payment link:', err);
            alert(`Could not generate link: ${err?.message || 'Backend not available. Deploy backend from pruebas-web branch.'}`);
        } finally {
            setActionLoading('');
        }
    };

    const copyPaymentLink = async () => {
        if (booking.payment_url) {
            await navigator.clipboard.writeText(booking.payment_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const updateStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase.from('bookings').update({
                status: newStatus,
            }).eq('id', booking.id);
            if (error) throw error;
            onUpdate();
            onClose();
        } catch (err: any) {
            alert(`Error: ${err?.message}`);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto cursor-move"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-white">{booking.guest_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-slate-400 font-mono">#{booking.id.slice(0, 8)}</p>
                            <PlatformBadge platform={booking.platform} />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Status + Price Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={booking.status} />
                            <PaymentBadge status={booking.payment_status || 'unpaid'} />
                        </div>
                        <span className="text-xl font-bold text-white">€{booking.total_price}</span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Check-in</p>
                            <p className="text-sm text-white font-medium mt-1">{booking.start_date}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-xl p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Check-out</p>
                            <p className="text-sm text-white font-medium mt-1">{booking.end_date}</p>
                        </div>
                    </div>

                    {/* Property */}
                    <div className="bg-slate-900/50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <span className="text-sm text-slate-300">{booking.properties?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-xs text-slate-500">{nights} night{nights !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Guest Contact */}
                    {booking.guest_email && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span>{booking.guest_email}</span>
                        </div>
                    )}
                    {booking.guest_phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <span>{booking.guest_phone}</span>
                        </div>
                    )}

                    {/* ─── Payment Section ──────────── */}
                    <div className="border-t border-slate-700/50 pt-4 space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-400" />
                            Payment
                        </h3>

                        {/* Payment Link (if exists) */}
                        {booking.payment_url && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                                <p className="text-xs text-indigo-300 font-medium mb-2">Payment Link</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={booking.payment_url}
                                        className="flex-1 bg-slate-900/50 text-xs text-slate-300 rounded-lg px-2 py-1.5 truncate border border-slate-700"
                                    />
                                    <button
                                        onClick={copyPaymentLink}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium transition-all"
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Payment Actions */}
                        <div className="flex flex-wrap gap-2">
                            {(booking.payment_status !== 'paid') && (
                                <button
                                    onClick={markAsPaid}
                                    disabled={!!actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    {actionLoading === 'paid' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                    Mark as Paid
                                </button>
                            )}
                            {booking.payment_status === 'paid' && (
                                <button
                                    onClick={markAsUnpaid}
                                    disabled={!!actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    Revert to Unpaid
                                </button>
                            )}
                            {!booking.payment_url && (booking.platform === 'DIRECT' || !booking.platform) && (
                                <button
                                    onClick={generatePaymentLink}
                                    disabled={!!actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                >
                                    {actionLoading === 'link' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                    Generate Payment Link
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ─── Status Actions ───────────── */}
                    <div className="border-t border-slate-700/50 pt-4 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Change Status</h3>
                        <div className="flex flex-wrap gap-2">
                            {['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateStatus(s)}
                                    disabled={booking.status === s}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        booking.status === s
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-slate-900/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                                    } disabled:opacity-50`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// ==============================
// MAIN COMPONENT
// ==============================
const Bookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Create Config
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newBooking, setNewBooking] = useState({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        property_id: '',
        start_date: '',
        end_date: '',
        total_price: '',
        status: 'pending' as Booking['status'],
        platform: 'DIRECT',
        payment_status: 'unpaid' as Booking['payment_status'],
    });

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 5000);
        try {
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    properties (
                        name,
                        image_url
                    )
                `)
                .order('start_date', { ascending: true });

            if (bookingsError) throw bookingsError;
            setBookings((bookingsData || []) as any);

            const { data: propsData, error: propsError } = await supabase
                .from('properties')
                .select('id, name')
                .eq('status', 'active');

            if (propsError) throw propsError;
            setProperties(propsData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Create Booking ---
    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('bookings')
                .insert([{
                    owner_id: user.id,
                    guest_name: newBooking.guest_name,
                    guest_email: newBooking.guest_email,
                    guest_phone: newBooking.guest_phone,
                    property_id: newBooking.property_id,
                    start_date: newBooking.start_date,
                    end_date: newBooking.end_date,
                    total_price: parseFloat(newBooking.total_price) || 0,
                    status: newBooking.status,
                    platform: newBooking.platform,
                    payment_status: newBooking.payment_status,
                }]);

            if (error) throw error;

            // --- Send Confirmation Email (Backend) ---
            const selectedProperty = properties.find(p => p.id === newBooking.property_id);
            const bookingForEmail = {
                id: crypto.randomUUID().slice(0, 8),
                guest_name: newBooking.guest_name,
                guest_email: newBooking.guest_email,
                start_date: newBooking.start_date,
                end_date: newBooking.end_date,
                total_price: newBooking.total_price,
                properties: selectedProperty || { name: 'Property' }
            };

            fetch(`${import.meta.env.VITE_API_URL || 'https://api.triadak.io'}/emails/booking-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking: bookingForEmail })
            }).catch(err => console.error('Failed to send email:', err));

            setIsCreateModalOpen(false);
            setNewBooking({
                guest_name: '',
                guest_email: '',
                guest_phone: '',
                property_id: '',
                start_date: '',
                end_date: '',
                total_price: '',
                status: 'pending' as Booking['status'],
                platform: 'DIRECT',
                payment_status: 'unpaid' as Booking['payment_status'],
            });
            fetchData();

        } catch (error: any) {
            console.error(error);
            alert(`Error creating booking: ${error.message}`);
        } finally {
            setCreateLoading(false);
        }
    };

    // --- Filtering ---
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.properties?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // --- Stats ---
    const stats = useMemo(() => {
        const now = new Date().toISOString().split('T')[0];
        return {
            total: bookings.length,
            active: bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length,
            upcoming: bookings.filter(b => b.start_date > now).length,
            revenue: bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_price || 0), 0),
        };
    }, [bookings]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Bookings</h1>
                    <p className="text-slate-400 mt-1">Manage reservations and calendar.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-all ${
                                viewMode === 'list'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <List className="h-4 w-4" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-all ${
                                viewMode === 'calendar'
                                    ? 'bg-blue-500/10 text-blue-400'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Calendar className="h-4 w-4" />
                            Calendar
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="h-5 w-5" />
                        New Booking
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Bookings', value: stats.total, icon: Calendar, color: 'text-blue-400' },
                    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-emerald-400' },
                    { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-amber-400' },
                    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-violet-400' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">{stat.label}</p>
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters (only for list view) */}
            {viewMode === 'list' && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search guest, property..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {['all', 'pending', 'confirmed', 'checked_in', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                </div>
            ) : viewMode === 'calendar' ? (
                /* ========== CALENDAR VIEW ========== */
                <BookingCalendar
                    bookings={filteredBookings}
                    onBookingClick={(b) => setSelectedBooking(b)}
                />
            ) : (
                /* ========== LIST VIEW ========== */
                filteredBookings.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                        <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No bookings found</h3>
                        <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                            Start by adding a new reservation manually.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                            Create new booking
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedBooking(booking)}
                                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center gap-4 group cursor-pointer"
                            >
                                {/* Listing Info */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="h-12 w-12 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0">
                                        {booking.properties?.image_url ? (
                                            <img src={booking.properties.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <MapPin className="h-5 w-5 text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium line-clamp-1">{booking.properties?.name || 'Unknown Property'}</h3>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            Booking ID: <span className="font-mono text-slate-500">#{booking.id.slice(0, 6)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Guest Info */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                    <div className="h-8 w-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-slate-200 text-sm font-medium">{booking.guest_name}</p>
                                        <p className="text-xs text-slate-500">{booking.guest_email || 'No email'}</p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="flex flex-col text-sm min-w-[150px]">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                        {booking.start_date}
                                    </div>
                                    <div className="ml-5 text-slate-500 text-xs mt-0.5">
                                        to {booking.end_date}
                                    </div>
                                </div>

                                {/* Status & Price */}
                                <div className="flex items-center gap-4 ml-auto mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                    <PlatformBadge platform={booking.platform} />
                                    <StatusBadge status={booking.status} />
                                    <PaymentBadge status={booking.payment_status || 'unpaid'} />
                                    <div className="text-right">
                                        <p className="text-white font-bold">€{booking.total_price}</p>
                                        <p className="text-xs text-slate-500">Total</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {selectedBooking && (
                    <BookingDetailModal
                        booking={selectedBooking}
                        onClose={() => setSelectedBooking(null)}
                        onUpdate={fetchData}
                    />
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 p-6 cursor-move"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Plus className="h-6 w-6 text-blue-500" />
                                New Reservation
                            </h2>

                            <form onSubmit={handleCreateBooking} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Select Property</label>
                                    <select
                                        required
                                        value={newBooking.property_id}
                                        onChange={(e) => setNewBooking({ ...newBooking, property_id: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    >
                                        <option value="">Select a property...</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Guest Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newBooking.guest_name}
                                        onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Guest Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={newBooking.guest_email}
                                            onChange={(e) => setNewBooking({ ...newBooking, guest_email: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Phone</label>
                                        <input
                                            type="tel"
                                            value={newBooking.guest_phone}
                                            onChange={(e) => setNewBooking({ ...newBooking, guest_phone: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Check-in</label>
                                        <input
                                            type="date"
                                            required
                                            value={newBooking.start_date}
                                            onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Check-out</label>
                                        <input
                                            type="date"
                                            required
                                            value={newBooking.end_date}
                                            onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Platform</label>
                                        <select
                                            value={newBooking.platform}
                                            onChange={(e) => setNewBooking({ ...newBooking, platform: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="DIRECT">Direct</option>
                                            <option value="AIRBNB">Airbnb</option>
                                            <option value="BOOKING_COM">Booking.com</option>
                                            <option value="VRBO">VRBO</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Payment</label>
                                        <select
                                            value={newBooking.payment_status}
                                            onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value as any })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="paid">Paid</option>
                                            <option value="partial">Partial</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Total Price (€)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={newBooking.total_price}
                                            onChange={(e) => setNewBooking({ ...newBooking, total_price: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Status</label>
                                        <select
                                            value={newBooking.status}
                                            onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as any })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="checked_in">Checked In</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Create Reservation
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bookings;
