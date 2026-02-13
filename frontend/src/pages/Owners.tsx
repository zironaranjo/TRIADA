import { useEffect, useState } from "react";
import { ownersApi } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
    Plus, Search, Mail, Phone, Building,
    MoreHorizontal, User, Wallet, X
} from "lucide-react";
import { useUserAvatar } from "@/hooks/useUserAvatar";

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    properties?: any[]; // We'll count these if available
}

export default function Owners() {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const userAvatar = useUserAvatar();

    useEffect(() => {
        loadOwners();
    }, []);

    const loadOwners = async () => {
        try {
            const { data } = await ownersApi.getAll();
            setOwners(data);
        } catch (error) {
            console.error("Failed to load owners", error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1"
                        >
                            Owners
                        </motion.h1>
                        <p className="text-slate-400">Manage relationships and payouts.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search owners..."
                                className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary w-64 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add Owner
                        </button>
                    </div>
                </div>

                {/* Stats Row (Mocked for visual balance) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard title="Total Owners" value={owners.length.toString()} icon={<User className="h-5 w-5" />} trend="+2 this month" />
                    <StatsCard title="Pending Payouts" value="€12,450" icon={<Wallet className="h-5 w-5 text-amber-400" />} trend="Due in 3 days" />
                    <StatsCard title="Properties Managed" value="24" icon={<Building className="h-5 w-5 text-emerald-400" />} trend="+4 new" />
                </div>

                {/* Owners List */}
                <GlassCard className="p-0 overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">All Owners</h3>
                        <button className="text-sm text-primary hover:text-primary-light font-medium">View All</button>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : owners.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {owners.map((owner) => (
                                <motion.div
                                    key={owner.id}
                                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                                    className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                                            {userAvatar ? (
                                                <img src={userAvatar} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <>{owner.firstName[0]}{owner.lastName[0]}</>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white group-hover:text-primary transition-colors">
                                                {owner.firstName} {owner.lastName}
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {owner.email}
                                                </span>
                                                {owner.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {owner.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-500 uppercase font-medium">Properties</p>
                                            <p className="text-sm font-bold text-white">{owner.properties?.length || 0}</p>
                                        </div>
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No owners found</h3>
                            <p className="text-slate-400 mt-2 mb-6 max-w-sm">
                                Start by adding an owner to assign properties and manage payouts.
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold"
                            >
                                Create Owner
                            </button>
                        </div>
                    )}
                </GlassCard>
            </div>

            <CreateOwnerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadOwners}
            />
        </div>
    );
}

function StatsCard({ title, value, icon, trend }: any) {
    return (
        <div className="p-6 rounded-xl bg-[#1e293b] border border-white/5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg text-white">
                    {icon}
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    {trend}
                </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-slate-400 font-medium">{title}</p>
        </div>
    )
}

function CreateOwnerModal({ isOpen, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await ownersApi.create(formData);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to create owner", err);
        } finally {
            setLoading(false);
            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
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
                    className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                        <h2 className="text-xl font-bold text-white">Add New Owner</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">First Name</label>
                                <input
                                    name="firstName" required
                                    value={formData.firstName} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Last Name</label>
                                <input
                                    name="lastName" required
                                    value={formData.lastName} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                            <input
                                name="email" type="email" required
                                value={formData.email} onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Phone</label>
                            <input
                                name="phone" type="tel"
                                value={formData.phone} onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Owner'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
