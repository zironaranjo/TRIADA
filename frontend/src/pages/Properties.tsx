import { useEffect, useState } from "react";
import { propertiesApi } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, MapPin, Search, BedDouble, Bath, Users, Star,
    Image as ImageIcon, Upload, X
} from "lucide-react";

interface Property {
    id: string;
    name: string;
    address: string;
    imageUrl?: string;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxGuests?: number;
    description?: string;
    rating?: number;
    status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

export default function Properties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        loadProperties();
    }, []);

    const loadProperties = async () => {
        try {
            const { data } = await propertiesApi.getAll();
            setProperties(data);
        } catch (error) {
            console.error("Failed to load properties", error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-bold text-white mb-2"
                        >
                            Properties
                        </motion.h1>
                        <p className="text-slate-400">Manage your portfolio of luxury stays.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search properties..."
                                className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary w-64 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add Property
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}

                        {/* Visual "Add New" Placeholder if empty */}
                        {properties.length === 0 && (
                            <motion.div
                                onClick={() => setIsCreateModalOpen(true)}
                                className="group relative h-[450px] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-all"
                            >
                                <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Plus className="h-8 w-8 text-slate-400 group-hover:text-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-400 group-hover:text-white">Add Your First Property</h3>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            <CreatePropertyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadProperties}
            />
        </div>
    );
}

function PropertyCard({ property }: { property: Property }) {
    // Fallback image if none provided
    const displayImage = property.imageUrl || "https://images.unsplash.com/photo-1613977257377-23b77defa6ac?q=80&w=1600";

    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="group relative rounded-2xl overflow-hidden bg-[#1e293b] border border-white/5 hover:border-white/20 transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-primary/10"
        >
            {/* Image Cover */}
            <div className="aspect-[4/3] relative overflow-hidden bg-slate-800">
                <img
                    src={displayImage}
                    alt={property.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-80" />

                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">New</span>
                </div>

                <div className="absolute top-4 left-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-lg`}>
                        Available
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 -mt-12 relative z-10">
                <h3 className="text-xl font-bold text-white line-clamp-1 mb-1 shadow-black drop-shadow-md">{property.name}</h3>

                <div className="flex items-center gap-2 text-slate-300 text-sm mb-4">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate opacity-80">{property.address}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 py-3 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <div className="text-center border-r border-white/5">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                            <Users className="h-4 w-4 text-primary/80" />
                            <span className="font-semibold">{property.maxGuests || 2}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Guests</span>
                    </div>
                    <div className="text-center border-r border-white/5">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                            <BedDouble className="h-4 w-4 text-primary/80" />
                            <span className="font-semibold">{property.bedrooms || 1}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Bedroom</span>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-200">
                            <Bath className="h-4 w-4 text-primary/80" />
                            <span className="font-semibold">{property.bathrooms || 1}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-medium">Bath</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                    <div>
                        <span className="text-xs text-slate-400 block">Starting from</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-white">€{property.pricePerNight || 0}</span>
                            <span className="text-xs text-slate-500">/night</span>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors shadow-lg shadow-primary/20">
                        View Details
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function CreatePropertyModal({ isOpen, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        pricePerNight: '',
        bedrooms: '',
        bathrooms: '',
        maxGuests: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);

    // Initial seed for the specific user request (Snowy Cabin)
    useEffect(() => {
        if (isOpen && formData.name === '') {
            // Auto-fill convenience for the demo
            // setFormData(prev => ({ ...prev, imageUrl: '/cabin.jpg' })); 
            // Commented out to let user type, but it's available at that path
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await propertiesApi.create({
                ...formData,
                pricePerNight: Number(formData.pricePerNight),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                maxGuests: Number(formData.maxGuests),
                // Allow using local public path if typed, otherwise full URL
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setFormData({
                name: '', address: '', pricePerNight: '',
                bedrooms: '', bathrooms: '', maxGuests: '', imageUrl: ''
            });
        }
    };

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                        <div>
                            <h2 className="text-xl font-bold text-white">Add New Property</h2>
                            <p className="text-sm text-slate-400">Enter the details of your new rental.</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="createPropertyForm" onSubmit={handleSubmit} className="space-y-6">

                            {/* Main Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Property Name</label>
                                    <input
                                        name="name" required placeholder="e.g. Alpine Snow Cabin"
                                        value={formData.name} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Address</label>
                                    <input
                                        name="address" required placeholder="e.g. 42 Mountain View Rd"
                                        value={formData.address} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Price/Night (€)</label>
                                    <input
                                        name="pricePerNight" type="number" required placeholder="150"
                                        value={formData.pricePerNight} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Bedrooms</label>
                                    <input
                                        name="bedrooms" type="number" required placeholder="2"
                                        value={formData.bedrooms} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Bathrooms</label>
                                    <input
                                        name="bathrooms" type="number" required placeholder="1"
                                        value={formData.bathrooms} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Max Guests</label>
                                    <input
                                        name="maxGuests" type="number" required placeholder="4"
                                        value={formData.maxGuests} onChange={handleChange}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Image Upload Mock */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Cover Image URL</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            name="imageUrl"
                                            placeholder="https://... or /cabin.jpg"
                                            value={formData.imageUrl} onChange={handleChange}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                    <button type="button" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                                        <Upload className="h-5 w-5" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">Tip: Use <code>/cabin.jpg</code> to use your uploaded image.</p>
                            </div>

                        </form>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-[#0f172a]/50 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="createPropertyForm"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg shadow-primary/25 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                            Create Property
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
