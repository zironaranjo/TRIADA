import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    MapPin,
    BedDouble,
    Users,
    DollarSign,
    Home,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    Link2,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink,
    Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { bookingsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { Link } from 'react-router-dom';

// --- Type Definitions ---
interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    price_per_night: number;
    currency: string;
    status: 'active' | 'maintenance' | 'inactive';
    image_url: string | null;
    rooms: number;
    max_guests: number;
    owner_id: string;
    ical_url: string | null;
    published: boolean;
}

// --- Status Badge Component ---
const StatusBadge = ({ status }: { status: Property['status'] }) => {
    const { t } = useTranslation();
    const styles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {t(`common.status.${status}`)}
        </span>
    );
};

const Properties = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { canCreate } = usePlanLimits();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
    const [copiedExportId, setCopiedExportId] = useState<string | null>(null);

    const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.triadak.io' : 'http://localhost:3000');

    const handleSyncCalendar = async (propertyId: string) => {
        setSyncingId(propertyId);
        setSyncResult(null);
        try {
            const { data } = await bookingsApi.syncCalendar(propertyId);
            setSyncResult({ id: propertyId, ok: true, msg: `+${data.added} ${t('properties.syncAdded')}, ${data.updated} ${t('properties.syncUpdated')}` });
            setTimeout(() => setSyncResult(null), 5000);
        } catch (err: any) {
            setSyncResult({ id: propertyId, ok: false, msg: err?.response?.data?.message || err.message || 'Sync failed' });
            setTimeout(() => setSyncResult(null), 5000);
        } finally {
            setSyncingId(null);
        }
    };

    const copyExportUrl = (propertyId: string) => {
        const url = `${API_BASE}/bookings/ical/${propertyId}`;
        navigator.clipboard.writeText(url);
        setCopiedExportId(propertyId);
        setTimeout(() => setCopiedExportId(null), 2000);
    };

    // --- Fetch Properties ---
    const fetchProperties = async () => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 5000);
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties((data || []) as Property[]);
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    // --- Create Property Logic ---
    const [newProperty, setNewProperty] = useState({
        name: '',
        address: '',
        city: '',
        price_per_night: '',
        rooms: 1,
        max_guests: 2,
        image_url: '',
        ical_url: '' // Added for sync
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // --- Edit Property State ---
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [editData, setEditData] = useState<Partial<Property & { description: string; property_type: string; bathrooms: number; amenities: string[] }>>({});
    const [editLoading, setEditLoading] = useState(false);

    const AMENITY_OPTIONS = ['WiFi', 'Piscina', 'Aire acondicionado', 'Parking', 'Cocina', 'Lavadora', 'Terraza', 'Barbacoa'];
    const PROPERTY_TYPES = [
        { value: 'apartment', label: 'Apartamento' },
        { value: 'house', label: 'Casa' },
        { value: 'villa', label: 'Villa' },
        { value: 'cabin', label: 'Cabaña' },
        { value: 'beach', label: 'Playa' },
    ];

    const openEdit = (p: Property) => {
        setEditingProperty(p);
        setEditData({
            name: p.name,
            address: p.address,
            city: p.city,
            country: p.country,
            price_per_night: p.price_per_night,
            rooms: p.rooms,
            max_guests: p.max_guests,
            description: (p as any).description || '',
            property_type: (p as any).property_type || 'apartment',
            bedrooms: (p as any).bedrooms || p.rooms || 1,
            bathrooms: (p as any).bathrooms || 1,
            amenities: (p as any).amenities || [],
        });
    };

    const handleSaveEdit = async () => {
        if (!editingProperty) return;
        setEditLoading(true);
        try {
            const { error } = await supabase.from('properties').update({
                name: editData.name,
                address: editData.address,
                city: editData.city,
                country: editData.country,
                price_per_night: editData.price_per_night,
                rooms: editData.rooms,
                max_guests: editData.max_guests,
                description: editData.description,
                property_type: editData.property_type,
                bedrooms: editData.bedrooms,
                bathrooms: editData.bathrooms,
                amenities: editData.amenities,
            }).eq('id', editingProperty.id);
            if (error) throw error;
            setEditingProperty(null);
            fetchProperties();
        } catch (err: any) {
            alert('Error al guardar: ' + (err.message || 'Unknown error'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingImage(true);
            const file = e.target.files?.[0];
            if (!file) {
                setUploadingImage(false);
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setUploadingImage(false);
                alert(t('properties.alertImageTooLarge'));
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `properties/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            setNewProperty({ ...newProperty, image_url: data.publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(t('properties.alertUploadError', { message: error?.message || 'Unknown error' }));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCreateProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadingImage) return; // safety guard
        setCreateLoading(true);

        try {
            if (!user) throw new Error('No user logged in');

            const { error } = await supabase.from('properties').insert([
                {
                    owner_id: user.id,
                    name: newProperty.name,
                    address: newProperty.address,
                    city: newProperty.city,
                    price_per_night: parseFloat(newProperty.price_per_night),
                    rooms: newProperty.rooms,
                    max_guests: newProperty.max_guests,
                    status: 'active',
                    image_url: newProperty.image_url || null,
                    ical_url: newProperty.ical_url || null,
                    published: false,
                },
            ]);

            if (error) throw error;

            setIsCreateModalOpen(false);
            setNewProperty({ name: '', address: '', city: '', price_per_night: '', rooms: 1, max_guests: 2, image_url: '', ical_url: '' });
            fetchProperties();
        } catch (error: any) {
            console.error('Error creating property:', error);
            alert(t('properties.alertGenericError', { message: error.message || 'Unknown error' }));
        } finally {
            setCreateLoading(false);
        }
    };


    // --- Filtering ---
    const filteredProperties = properties.filter((property) => {
        const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('properties.title')}</h1>
                    <p className="text-slate-400 mt-1">{t('properties.subtitle')}</p>
                </div>
                <button
                    onClick={() => {
                        const check = canCreate('properties', properties.length);
                        if (!check.allowed) {
                            setLimitMessage(check.message || '');
                            return;
                        }
                        setLimitMessage('');
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="h-5 w-5" />
                    {t('properties.addProperty')}
                </button>
            </div>

            {/* Plan Limit Warning */}
            {limitMessage && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-sm text-amber-300">{limitMessage}</p>
                    <Link to="/pricing" className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ml-4">
                        {t('common.upgrade')}
                    </Link>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder={t('properties.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'maintenance', 'inactive'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${statusFilter === status
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800'
                                }`}
                        >
                            {status === 'all' ? t('properties.filterAll') : status === 'active' ? t('properties.filterActive') : status === 'maintenance' ? t('properties.filterMaintenance') : t('properties.filterInactive')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                    <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Home className="h-10 w-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t('properties.emptyTitle')}</h3>
                    <p className="text-slate-400 text-sm max-w-md mb-6">{t('properties.emptyDescription')}</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all">
                        <Plus className="h-4 w-4" /> {t('properties.addFirstProperty')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                        <motion.div
                            key={property.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-black/20"
                        >
                            {/* Image Placeholder */}
                            <div className="h-48 bg-slate-700/50 relative overflow-hidden">
                                {property.image_url ? (
                                    <img src={property.image_url} alt={property.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <ImageIcon className="h-12 w-12 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <div className="flex items-center gap-2">
                                        {property.ical_url && (
                                            <button
                                                onClick={() => handleSyncCalendar(property.id)}
                                                disabled={syncingId === property.id}
                                                className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${
                                                    syncingId === property.id
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : syncResult?.id === property.id
                                                            ? syncResult.ok
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-red-500/20 text-red-400'
                                                            : 'bg-slate-900/70 text-slate-300 hover:text-blue-400 hover:bg-blue-500/20'
                                                }`}
                                                title={t('properties.calendarSync')}
                                            >
                                                {syncingId === property.id
                                                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                                    : syncResult?.id === property.id
                                                        ? syncResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />
                                                        : <RefreshCw className="h-3.5 w-3.5" />
                                                }
                                            </button>
                                        )}
                                        {property.ical_url && (
                                            <span className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400" title="iCal connected">
                                                <Link2 className="h-3 w-3" />
                                            </span>
                                        )}
                                        <StatusBadge status={property.status} />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(property); }}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-all"
                                            title="Editar propiedad"
                                        >
                                            <DollarSign className="h-3.5 w-3.5 hidden" />
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                    </div>
                                </div>
                                {/* Sync result toast */}
                                {syncResult?.id === property.id && (
                                    <div className={`absolute bottom-3 left-3 right-3 text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm ${syncResult.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {syncResult.msg}
                                    </div>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {property.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {property.city}, {property.country || t('dashboard.unknown')}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 py-4 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <BedDouble className="h-4 w-4 text-slate-500" />
                                        {property.rooms} {t('properties.bedrooms')}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        {t('properties.maxGuests', { count: property.max_guests })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-2">
                                    <div className="text-white font-bold text-lg flex items-center">
                                        <span className="text-slate-400 text-sm font-normal mr-1">{t('common.from')}</span>
                                        ${property.price_per_night}
                                        <span className="text-slate-500 text-sm font-normal ml-1">{t('properties.perNight')}</span>
                                    </div>
                                </div>

                                {/* Publish toggle */}
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Globe className="h-3.5 w-3.5" />
                                        <span>Portal público</span>
                                    </div>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await supabase.from('properties').update({ published: !property.published }).eq('id', property.id);
                                            fetchProperties();
                                        }}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${property.published ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${property.published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>

                                {/* iCal Section */}
                                {property.ical_url && (
                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-medium">
                                                <Link2 className="h-3 w-3" />
                                                {t('properties.icalConnected')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => copyExportUrl(property.id)}
                                                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-400 transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
                                                    title={t('properties.copyExportUrl')}
                                                >
                                                    {copiedExportId === property.id
                                                        ? <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> {t('properties.copied')}</>
                                                        : <><Copy className="h-3 w-3" /> {t('properties.exportIcal')}</>}
                                                </button>
                                                <a
                                                    href={`${API_BASE}/bookings/ical/${property.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5"
                                                    title={t('properties.openExportUrl')}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingProperty && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingProperty(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Home className="h-5 w-5 text-indigo-400" />
                                Editar propiedad
                            </h2>

                            <div className="space-y-4">
                                {/* Nombre */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Nombre</label>
                                        <input type="text" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Ciudad</label>
                                        <input type="text" value={editData.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">País</label>
                                        <input type="text" value={editData.country || ''} onChange={e => setEditData({ ...editData, country: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Dirección</label>
                                        <input type="text" value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-1 block">Descripción pública</label>
                                    <textarea value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        rows={3} placeholder="Describe la propiedad para los huéspedes..."
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none resize-none" />
                                </div>

                                {/* Tipo + Precio */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Tipo de propiedad</label>
                                        <select value={editData.property_type || 'apartment'} onChange={e => setEditData({ ...editData, property_type: e.target.value })}
                                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none">
                                            {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#1e293b]">{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Precio / noche (€)</label>
                                        <input type="number" value={editData.price_per_night || ''} onChange={e => setEditData({ ...editData, price_per_night: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                </div>

                                {/* Specs */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Habitaciones</label>
                                        <input type="number" min="1" value={editData.bedrooms || 1} onChange={e => setEditData({ ...editData, bedrooms: parseInt(e.target.value), rooms: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Baños</label>
                                        <input type="number" min="1" value={editData.bathrooms || 1} onChange={e => setEditData({ ...editData, bathrooms: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 mb-1 block">Huéspedes máx.</label>
                                        <input type="number" min="1" value={editData.max_guests || 1} onChange={e => setEditData({ ...editData, max_guests: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none" />
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div>
                                    <label className="text-xs font-medium text-slate-400 mb-2 block">Servicios incluidos</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {AMENITY_OPTIONS.map(am => {
                                            const selected = (editData.amenities || []).includes(am);
                                            return (
                                                <button key={am} type="button"
                                                    onClick={() => {
                                                        const curr = editData.amenities || [];
                                                        setEditData({ ...editData, amenities: selected ? curr.filter(a => a !== am) : [...curr, am] });
                                                    }}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${selected ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                                >
                                                    {selected ? '✓ ' : ''}{am}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                                <button onClick={() => setEditingProperty(null)}
                                    className="px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors text-sm font-medium">
                                    Cancelar
                                </button>
                                <button onClick={handleSaveEdit} disabled={editLoading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-50">
                                    {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editLoading ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </motion.div>
                    </>
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
                                <Home className="h-6 w-6 text-blue-500" />
                                {t('properties.modalTitle')}
                            </h2>

                            <form onSubmit={handleCreateProperty} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('properties.labelName')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProperty.name}
                                        onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                                        placeholder={t('properties.placeholderName')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('properties.labelCity')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProperty.city}
                                            onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder={t('properties.placeholderCity')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('properties.labelAddress')}</label>
                                        <input
                                            type="text"
                                            value={newProperty.address}
                                            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder={t('properties.placeholderAddress')}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('properties.labelPriceNight')}</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={newProperty.price_per_night}
                                                onChange={(e) => setNewProperty({ ...newProperty, price_per_night: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                                placeholder={t('properties.placeholderPrice')}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('properties.labelRooms')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newProperty.rooms}
                                            onChange={(e) => setNewProperty({ ...newProperty, rooms: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('properties.labelGuests')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newProperty.max_guests}
                                            onChange={(e) => setNewProperty({ ...newProperty, max_guests: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('properties.labelImage')}</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-full">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all"
                                                disabled={uploadingImage}
                                            />
                                            {uploadingImage && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {newProperty.image_url && (
                                        <div className="mt-2 relative h-32 w-full rounded-xl overflow-hidden border border-slate-700">
                                            <img src={newProperty.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('properties.labelIcalUrl')}</label>
                                    <input
                                        type="text"
                                        value={newProperty.ical_url}
                                        onChange={(e) => setNewProperty({ ...newProperty, ical_url: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 text-xs font-mono"
                                        placeholder={t('properties.placeholderIcal')}
                                    />
                                    <p className="text-[10px] text-slate-500">{t('properties.icalHint')}</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors font-medium"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading || uploadingImage}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {(createLoading || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {uploadingImage ? 'Subiendo imagen...' : createLoading ? 'Creando...' : t('properties.createProperty')}
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

export default Properties;
