import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '../lib/supabase';
import {
    MapPin, Users, BedDouble, Bath, Wifi, Car, Waves, Wind,
    UtensilsCrossed, WashingMachine, ArrowLeft, ChevronLeft, ChevronRight,
    Calendar, Check, Home, Building2, TreePine, Star, Share2,
} from 'lucide-react';

interface Property {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    price_per_night: number;
    max_guests: number;
    bedrooms: number;
    bathrooms: number;
    property_type: string;
    image_url: string | null;
    amenities: string[] | null;
    checkin_time: string | null;
    checkout_time: string | null;
    house_rules: string | null;
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
    'WiFi': Wifi,
    'Piscina': Waves,
    'Aire acondicionado': Wind,
    'Parking': Car,
    'Cocina': UtensilsCrossed,
    'Lavadora': WashingMachine,
    'Terraza': Home,
    'Barbacoa': Home,
};

export default function PropertyDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guestCount, setGuestCount] = useState(1);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchProperty(id);
    }, [id]);

    const fetchProperty = async (pid: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('id', pid)
            .eq('published', true)
            .single();
        setProperty(data as Property || null);
        setLoading(false);
    };

    const nights = () => {
        if (!checkIn || !checkOut) return 0;
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    };

    const total = () => property ? nights() * property.price_per_night : 0;

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!property || nights() < 1) return;
        setError('');
        setSending(true);
        try {
            const { error: err } = await supabase.from('bookings').insert({
                property_id: property.id,
                guest_name: guestName,
                guest_email: guestEmail,
                guest_phone: guestPhone,
                start_date: checkIn,
                end_date: checkOut,
                total_price: total(),
                platform: 'direct',
                status: 'pending',
                notes: `Huéspedes: ${guestCount}`,
            });
            if (err) throw err;
            setSent(true);
        } catch {
            setError('Error al enviar la solicitud. Inténtalo de nuevo.');
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!property) return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4">
            <p className="text-slate-400">Propiedad no encontrada.</p>
            <Link to="/explore" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Volver al explorador
            </Link>
        </div>
    );

        const images = property.image_url ? [property.image_url] : [];
    const TypeIcon = property.property_type === 'apartment' ? Building2 : property.property_type === 'cabin' ? TreePine : Home;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            {/* ── Top nav ── */}
            <div className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => navigate('/explore')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </button>
                    <Link to="/">
                        <img src="/logotriadak.png" alt="Triadak" className="h-16 object-contain" />
                    </Link>
                    <button
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                        <Share2 className="h-4 w-4" /> Compartir
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ── Gallery ── */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-800 mb-8" style={{ height: '420px' }}>
                    {images.length > 0 ? (
                        <>
                            <img
                                src={images[imgIndex]}
                                alt={property.name}
                                className="w-full h-full object-cover"
                            />
                            {images.length > 1 && (
                                <>
                                    <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-colors">
                                        <ChevronLeft className="h-5 w-5 text-white" />
                                    </button>
                                    <button onClick={() => setImgIndex(i => (i + 1) % images.length)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-full hover:bg-black/70 transition-colors">
                                        <ChevronRight className="h-5 w-5 text-white" />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.map((_, i) => (
                                            <button key={i} onClick={() => setImgIndex(i)}
                                                className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <TypeIcon className="h-20 w-20 text-slate-600" />
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* ── Left: details ── */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 text-sm mb-2">
                                <TypeIcon className="h-4 w-4" />
                                <span className="capitalize">{property.property_type}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{property.name}</h1>
                            {(property.city || property.country) && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <MapPin className="h-4 w-4" />
                                    <span>{[property.address, property.city, property.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                        </div>

                        {/* Specs */}
                        <div className="flex flex-wrap gap-4 py-4 border-y border-white/5">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Users className="h-5 w-5 text-indigo-400" />
                                <span>{property.max_guests} huéspedes</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <BedDouble className="h-5 w-5 text-indigo-400" />
                                <span>{property.bedrooms} habitacion{property.bedrooms !== 1 ? 'es' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <Bath className="h-5 w-5 text-indigo-400" />
                                <span>{property.bathrooms} baño{property.bathrooms !== 1 ? 's' : ''}</span>
                            </div>
                            {property.checkin_time && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar className="h-5 w-5 text-indigo-400" />
                                    <span>Check-in {property.checkin_time} · Check-out {property.checkout_time}</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {property.description && (
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-3">Descripción</h2>
                                <p className="text-slate-400 leading-relaxed whitespace-pre-line">{property.description}</p>
                            </div>
                        )}

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-4">Lo que incluye</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {property.amenities.map(amenity => {
                                        const Icon = AMENITY_ICONS[amenity] || Check;
                                        return (
                                            <div key={amenity} className="flex items-center gap-2.5 text-slate-300 text-sm">
                                                <Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                                {amenity}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* House rules */}
                        {property.house_rules && (
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-3">Normas de la casa</h2>
                                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{property.house_rules}</p>
                            </div>
                        )}
                    </div>

                    {/* ── Right: booking widget ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#1e293b] border border-white/10 rounded-2xl p-6"
                            >
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-2xl font-bold text-white">€{property.price_per_night}</span>
                                    <span className="text-slate-400 text-sm">/ noche</span>
                                </div>

                                {sent ? (
                                    <div className="text-center py-6">
                                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                            <Check className="h-7 w-7 text-emerald-400" />
                                        </div>
                                        <h3 className="text-white font-semibold mb-2">¡Solicitud enviada!</h3>
                                        <p className="text-slate-400 text-sm">El gestor revisará tu solicitud y te contactará pronto.</p>
                                        <button onClick={() => setSent(false)} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
                                            Hacer otra reserva
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleBook} className="space-y-3">
                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Llegada</label>
                                                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Salida</label>
                                                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required
                                                    min={checkIn || new Date().toISOString().split('T')[0]}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                            </div>
                                        </div>

                                        {/* Guests */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Huéspedes</label>
                                            <select value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value))}
                                                className="w-full bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                                {[...Array(property.max_guests)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1} className="bg-[#1e293b]">{i + 1} huésped{i > 0 ? 'es' : ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Guest info */}
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Tu nombre</label>
                                            <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)} required placeholder="Nombre completo"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                                            <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required placeholder="tu@email.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Teléfono</label>
                                            <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+34 600 000 000"
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                        </div>

                                        {/* Price summary */}
                                        {nights() > 0 && (
                                            <div className="bg-white/5 rounded-xl p-3 space-y-1.5 text-sm">
                                                <div className="flex justify-between text-slate-400">
                                                    <span>€{property.price_per_night} × {nights()} noche{nights() !== 1 ? 's' : ''}</span>
                                                    <span>€{total()}</span>
                                                </div>
                                                <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-1.5 mt-1.5">
                                                    <span>Total</span>
                                                    <span>€{total()}</span>
                                                </div>
                                            </div>
                                        )}

                                        {error && <p className="text-red-400 text-xs">{error}</p>}

                                        <button type="submit" disabled={sending || nights() < 1}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl text-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                            {sending ? 'Enviando...' : nights() < 1 ? 'Selecciona las fechas' : 'Solicitar reserva'}
                                        </button>
                                        <p className="text-center text-xs text-slate-500">Sin cobro hasta confirmación</p>
                                    </form>
                                )}
                            </motion.div>

                            {/* Rating placeholder */}
                            <div className="flex items-center gap-1 justify-center mt-4 text-sm text-slate-500">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                                <span className="ml-1">Excelente · Reserva sin riesgo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
