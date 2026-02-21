import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '../lib/supabase';
import {
    Search, MapPin, Users, BedDouble, Bath,
    Star, SlidersHorizontal, X, Home, Building2, TreePine, Waves,
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
}

const TYPE_ICONS: Record<string, React.ElementType> = {
    apartment: Building2,
    house: Home,
    villa: Star,
    cabin: TreePine,
    beach: Waves,
};

const TYPE_LABELS: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
    villa: 'Villa',
    cabin: 'Cabaña',
    beach: 'Playa',
};

const AMENITY_LIST = ['WiFi', 'Piscina', 'Aire acondicionado', 'Parking', 'Cocina', 'Lavadora', 'Terraza', 'Barbacoa'];

export default function Explore() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [filtered, setFiltered] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [guests, setGuests] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [properties, search, guests, maxPrice, selectedType]);

    const fetchProperties = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('properties')
            .select('id,name,description,address,city,country,price_per_night,max_guests,bedrooms,bathrooms,property_type,image_url,amenities')
            .eq('published', true)
            .order('created_at', { ascending: false });
        setProperties((data as Property[]) || []);
        setLoading(false);
    };

    const applyFilters = () => {
        let result = [...properties];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.city?.toLowerCase().includes(q)) ||
                (p.country?.toLowerCase().includes(q))
            );
        }
        if (guests) result = result.filter(p => p.max_guests >= parseInt(guests));
        if (maxPrice) result = result.filter(p => p.price_per_night <= parseInt(maxPrice));
        if (selectedType) result = result.filter(p => p.property_type === selectedType);
        setFiltered(result);
    };

    const clearFilters = () => {
        setSearch(''); setGuests(''); setMaxPrice(''); setSelectedType('');
    };

    const hasFilters = search || guests || maxPrice || selectedType;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            {/* ── Header ── */}
            <div className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <Link to="/" className="flex-shrink-0">
                            <img src="/logotriadak.png" alt="Triadak" className="h-16 object-contain" />
                        </Link>

                        {/* Search bar */}
                        <div className="flex-1 max-w-xl relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por ciudad o destino..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-slate-300 hover:border-white/20'}`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filtros</span>
                            {hasFilters && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                        </button>
                    </div>

                    {/* Filter bar */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-3 items-center"
                        >
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="Huéspedes"
                                    value={guests}
                                    onChange={e => setGuests(e.target.value)}
                                    min="1"
                                    className="w-24 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                <span className="text-slate-400 text-sm">€</span>
                                <input
                                    type="number"
                                    placeholder="Precio máx/noche"
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    className="w-36 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(TYPE_LABELS).map(([key, label]) => {
                                    const Icon = TYPE_ICONS[key] || Home;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedType(selectedType === key ? '' : key)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedType === key ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-white/10 text-slate-400 hover:text-white'}`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {hasFilters && (
                                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors ml-auto">
                                    <X className="h-3.5 w-3.5" /> Limpiar
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Results ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-lg font-semibold text-white">
                        {loading ? 'Cargando...' : `${filtered.length} propiedades disponibles`}
                    </h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="rounded-2xl bg-white/5 overflow-hidden animate-pulse">
                                <div className="h-48 bg-white/10" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg font-medium">No se encontraron propiedades</p>
                        <p className="text-slate-600 text-sm mt-1">Intenta cambiar los filtros de búsqueda</p>
                        {hasFilters && (
                            <button onClick={clearFilters} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filtered.map((property, i) => (
                            <PropertyCard key={property.id} property={property} index={i} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer mínimo ── */}
            <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-600 mt-12">
                © {new Date().getFullYear()} Triadak · <Link to="/" className="hover:text-slate-400 transition-colors">Inicio</Link> · <Link to="/login" className="hover:text-slate-400 transition-colors">Acceso gestores</Link>
            </footer>
        </div>
    );
}

function PropertyCard({ property, index }: { property: Property; index: number }) {
    const image = property.image_url || null;
    const TypeIcon = TYPE_ICONS[property.property_type] || Home;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
        >
            <Link to={`/property/${property.id}`} className="group block rounded-2xl overflow-hidden border border-white/5 bg-[#1e293b]/60 hover:border-white/15 hover:bg-[#1e293b] transition-all duration-300">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-800">
                    {image ? (
                        <img
                            src={image}
                            alt={property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <TypeIcon className="h-12 w-12 text-slate-600" />
                        </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <TypeIcon className="h-3 w-3 text-white" />
                        <span className="text-xs text-white font-medium">{TYPE_LABELS[property.property_type] || 'Propiedad'}</span>
                    </div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <h3 className="font-semibold text-white text-sm truncate mb-1 group-hover:text-indigo-300 transition-colors">
                        {property.name}
                    </h3>
                    {(property.city || property.country) && (
                        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                            <MapPin className="h-3 w-3" />
                            <span>{[property.city, property.country].filter(Boolean).join(', ')}</span>
                        </div>
                    )}

                    {/* Specs */}
                    <div className="flex items-center gap-3 text-slate-400 text-xs mb-3">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{property.max_guests}</span>
                        <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{property.bedrooms}</span>
                        <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{property.bathrooms}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">€{property.price_per_night}</span>
                        <span className="text-xs text-slate-500">/ noche</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export { AMENITY_LIST };
