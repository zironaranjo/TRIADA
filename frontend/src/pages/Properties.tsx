import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    MoreVertical,
    MapPin,
    BedDouble,
    Users,
    DollarSign,
    Home,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
}

// --- Status Badge Component ---
const StatusBadge = ({ status }: { status: Property['status'] }) => {
    const styles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        maintenance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const Properties = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // --- Fetch Properties ---
    const fetchProperties = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties(data as Property[]);
        } catch (error) {
            console.error('Error fetching properties:', error);
        } finally {
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingImage(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            setNewProperty({ ...newProperty, image_url: data.publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCreateProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);

        try {
            if (!user) throw new Error('No user logged in');

            const { error } = await supabase.from('properties').insert([
                {
                    owner_id: user.id, // For now, assign to current user (Admin/Owner)
                    name: newProperty.name,
                    address: newProperty.address,
                    city: newProperty.city,
                    price_per_night: parseFloat(newProperty.price_per_night),
                    rooms: newProperty.rooms,
                    max_guests: newProperty.max_guests,
                    status: 'active',
                    image_url: newProperty.image_url || null,
                    ical_url: newProperty.ical_url || null, // Save to DB
                },
            ]);

            if (error) throw error;

            setIsCreateModalOpen(false);
            setNewProperty({ name: '', address: '', city: '', price_per_night: '', rooms: 1, max_guests: 2, image_url: '', ical_url: '' });
            fetchProperties(); // Refresh list
        } catch (error: any) {
            console.error('Error creating property:', error);
            alert(`Error: ${error.message || 'Unknown error'}`);
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">Properties</h1>
                    <p className="text-slate-400 mt-1">Manage your portfolio of villas and apartments.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="h-5 w-5" />
                    Add Property
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search properties..."
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
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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
                <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                    <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home className="h-8 w-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No properties found</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                        Get started by adding your first property to the portfolio.
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                        Create new property
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
                                        {/* Calendar sync via backend is not yet wired to the Supabase properties table. */}
                                        {/* Button left as visual placeholder but disabled to avoid broken calls. */}
                                        <button
                                            disabled
                                            className="p-1 rounded-full bg-slate-900/50 text-slate-600 cursor-not-allowed"
                                            title="Calendar sync coming soon"
                                        >
                                            <Loader2 className="h-3 w-3" />
                                        </button>
                                        <StatusBadge status={property.status} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {property.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {property.city}, {property.country || 'Unknown'}
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors">
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 py-4 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <BedDouble className="h-4 w-4 text-slate-500" />
                                        {property.rooms} Bedrooms
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        Max {property.max_guests} Guests
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-2">
                                    <div className="text-white font-bold text-lg flex items-center">
                                        <span className="text-slate-400 text-sm font-normal mr-1">from</span>
                                        ${property.price_per_night}
                                        <span className="text-slate-500 text-sm font-normal ml-1">/night</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

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
                                Add New Property
                            </h2>

                            <form onSubmit={handleCreateProperty} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Property Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProperty.name}
                                        onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Sunset Villa"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">City</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProperty.city}
                                            onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Miami"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Address</label>
                                        <input
                                            type="text"
                                            value={newProperty.address}
                                            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="123 Ocean Dr"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Price/Night</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={newProperty.price_per_night}
                                                onChange={(e) => setNewProperty({ ...newProperty, price_per_night: e.target.value })}
                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Rooms</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newProperty.rooms}
                                            onChange={(e) => setNewProperty({ ...newProperty, rooms: parseInt(e.target.value) })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Guests</label>
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
                                    <label className="text-sm font-medium text-slate-300">Property Image</label>
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
                                    <label className="text-sm font-medium text-slate-300">Airbnb/Booking iCal URL</label>
                                    <input
                                        type="text"
                                        value={newProperty.ical_url}
                                        onChange={(e) => setNewProperty({ ...newProperty, ical_url: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 text-xs font-mono"
                                        placeholder="https://www.airbnb.com/calendar/ical/..."
                                    />
                                    <p className="text-[10px] text-slate-500">Paste the iCal link from Airbnb or Booking.com to auto-sync reservations.</p>
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
                                        Create Property
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
