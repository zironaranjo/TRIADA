import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    MapPin,
    Wifi,
    ScrollText,
    Phone,
    Home,
    User,
    LogIn,
    LogOut,
    Shield,
    ChevronRight,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';

interface GuestData {
    guestName: string;
    startDate: string;
    endDate: string;
    status: string;
    platform: string;
    property: {
        name: string;
        address: string;
        city: string;
        country: string;
        imageUrl: string | null;
        rooms: number;
        maxGuests: number;
        checkinInstructions: string | null;
        checkoutInstructions: string | null;
        wifiName: string | null;
        wifiPassword: string | null;
        houseRules: string | null;
        emergencyContact: string | null;
        checkinTime: string | null;
        checkoutTime: string | null;
    };
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const getNights = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function GuestPortal() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<GuestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showWifiPass, setShowWifiPass] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/bookings/guest/${token}`);
                if (res.data?.error) {
                    setError(true);
                } else {
                    setData(res.data);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Booking Not Found</h1>
                    <p className="text-slate-400">This link may have expired or is invalid.</p>
                </div>
            </div>
        );
    }

    const nights = getNights(data.startDate, data.endDate);
    const prop = data.property;

    const sections = [
        {
            id: 'checkin',
            icon: LogIn,
            title: 'Check-in',
            time: prop.checkinTime || '15:00',
            content: prop.checkinInstructions,
            color: 'from-emerald-500 to-teal-600',
            iconColor: 'text-emerald-400',
        },
        {
            id: 'checkout',
            icon: LogOut,
            title: 'Check-out',
            time: prop.checkoutTime || '11:00',
            content: prop.checkoutInstructions,
            color: 'from-amber-500 to-orange-600',
            iconColor: 'text-amber-400',
        },
        {
            id: 'wifi',
            icon: Wifi,
            title: 'WiFi',
            content: prop.wifiName ? `Network: ${prop.wifiName}` : null,
            extra: prop.wifiPassword,
            color: 'from-blue-500 to-indigo-600',
            iconColor: 'text-blue-400',
        },
        {
            id: 'rules',
            icon: ScrollText,
            title: 'House Rules',
            content: prop.houseRules,
            color: 'from-purple-500 to-violet-600',
            iconColor: 'text-purple-400',
        },
        {
            id: 'emergency',
            icon: Phone,
            title: 'Emergency Contact',
            content: prop.emergencyContact,
            color: 'from-red-500 to-rose-600',
            iconColor: 'text-red-400',
        },
    ].filter((s) => s.content);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero / Property Image */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
                {prop.imageUrl ? (
                    <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                        <Home className="h-24 w-24 text-white/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

                {/* Property Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-indigo-300 text-sm font-medium mb-1">Welcome to</p>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">{prop.name}</h1>
                        {(prop.city || prop.address) && (
                            <div className="flex items-center gap-1.5 mt-2 text-slate-300">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="text-sm">{[prop.address, prop.city, prop.country].filter(Boolean).join(', ')}</span>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* TRIADAK badge */}
                <div className="absolute top-4 right-4">
                    <div className="bg-black/40 backdrop-blur-xl rounded-full px-3 py-1.5 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-[10px] text-slate-300 font-medium">Powered by TRIADAK</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-12">
                {/* Guest Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white">{data.guestName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                data.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                                data.status === 'checked_in' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-amber-500/20 text-amber-400'
                            }`}>
                                {data.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <LogIn className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Check-in</span>
                            </div>
                            <p className="text-sm font-semibold text-white">{formatDate(data.startDate)}</p>
                            <p className="text-xs text-indigo-400 mt-0.5">{prop.checkinTime || '15:00'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <LogOut className="h-4 w-4 text-amber-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Check-out</span>
                            </div>
                            <p className="text-sm font-semibold text-white">{formatDate(data.endDate)}</p>
                            <p className="text-xs text-indigo-400 mt-0.5">{prop.checkoutTime || '11:00'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Home className="h-4 w-4" />
                                <span className="text-xs">{prop.rooms} rooms · {prop.maxGuests} guests</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Info Sections */}
                <div className="space-y-4">
                    {sections.map((section, i) => (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.08 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${section.color}`}>
                                        <section.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-white">{section.title}</h3>
                                        {section.time && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3 text-slate-500" />
                                                <span className="text-xs text-slate-400">{section.time}</span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-600" />
                                </div>

                                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                    {section.content}
                                </div>

                                {/* WiFi password with show/hide */}
                                {section.id === 'wifi' && section.extra && (
                                    <div className="mt-3 bg-white/5 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Password</p>
                                            <p className="text-sm font-mono text-white">
                                                {showWifiPass ? section.extra : '••••••••'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowWifiPass(!showWifiPass)}
                                            className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                                        >
                                            {showWifiPass ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* No sections message */}
                {sections.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
                    >
                        <Home className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Your host hasn't added property details yet.</p>
                        <p className="text-slate-500 text-xs mt-1">Check-in instructions will appear here once available.</p>
                    </motion.div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-600">
                        Powered by <span className="text-indigo-500 font-semibold">TRIADAK</span> · Vacation Rental Management
                    </p>
                </div>
            </div>
        </div>
    );
}
