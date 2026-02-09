import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Plus,
    Search,
    MoreVertical,
    User,
    MapPin,
    CheckCircle,
    Clock,
    XCircle,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Type Definitions ---
interface Booking {
    id: string;
    guest_name: string;
    guest_email: string;
    start_date: string; // ISO date string YYYY-MM-DD
    end_date: string;
    status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
    total_price: number;
    currency: string;
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

const Bookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

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
        status: 'pending' as Booking['status']
    });

    // --- Fetch Data ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Bookings with Property details
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
            setBookings(bookingsData as any);

            // Fetch Properties for the dropdown
            const { data: propsData, error: propsError } = await supabase
                .from('properties')
                .select('id, name')
                .eq('status', 'active');

            if (propsError) throw propsError;
            setProperties(propsData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
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

            // Check if user is admin/owner logic here if needed

            const { data, error } = await supabase
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
                    status: newBooking.status
                }]).select();

            if (error) throw error;

            // --- Send Confirmation Email (Backend) ---
            const newBookingData = data ? data[0] : null;
            if (newBookingData) {
                const bookingForEmail = {
                    ...newBookingData,
                    properties: properties.find(p => p.id === newBooking.property_id)
                };

                // Non-blocking email send
                fetch(`${import.meta.env.VITE_API_URL || 'https://api.triadak.io'}/emails/booking-confirmation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking: bookingForEmail })
                }).catch(err => console.error('Failed to send email:', err));
            }

            setIsCreateModalOpen(false);
            setNewBooking({
                guest_name: '',
                guest_email: '',
                guest_phone: '',
                property_id: '',
                start_date: '',
                end_date: '',
                total_price: '',
                status: 'pending'
            });
            fetchData(); // Refresh list

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

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Bookings</h1>
                    <p className="text-slate-400 mt-1">Manage reservations and calendar.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="h-5 w-5" />
                    New Booking
                </button>
            </div>

            {/* Filters */}
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

            {/* Bookings List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                </div>
            ) : filteredBookings.length === 0 ? (
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
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center gap-4 group"
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
                            <div className="flex items-center gap-6 ml-auto mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                <StatusBadge status={booking.status} />
                                <div className="text-right">
                                    <p className="text-white font-bold">${booking.total_price}</p>
                                    <p className="text-xs text-slate-500">Total</p>
                                </div>
                                <button className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal - DRAGGABLE */}
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
                                        <label className="text-sm font-medium text-slate-300">Total Price ($)</label>
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
