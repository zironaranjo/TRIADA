import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Plus, Search, Mail, Phone, Building, User, Users,
    Tag, MessageSquare, Calendar, X, Edit3, Trash2,
    UserPlus, Filter, ChevronRight, Clock, Send,
    Globe, Home, Briefcase, MoreVertical, Star,
    FileText, PhoneCall, Video, StickyNote
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────
interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    type: 'GUEST' | 'OWNER' | 'VENDOR' | 'OTHER';
    source: 'MANUAL' | 'AIRBNB' | 'BOOKING_COM' | 'DIRECT' | 'VRBO' | 'OTHER';
    tags: string[] | null;
    notes: string | null;
    total_bookings: number;
    total_spent: number;
    last_contact_date: string | null;
    created_at: string;
    updated_at: string;
}

interface ContactNote {
    id: string;
    contact_id: string;
    type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'BOOKING';
    content: string;
    created_by: string | null;
    created_at: string;
}

type ContactType = 'ALL' | 'GUEST' | 'OWNER' | 'VENDOR' | 'OTHER';
type ContactSource = 'ALL' | 'MANUAL' | 'AIRBNB' | 'BOOKING_COM' | 'DIRECT' | 'VRBO' | 'OTHER';

// ─── Constants ────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
    GUEST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    VENDOR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    OTHER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const SOURCE_COLORS: Record<string, string> = {
    MANUAL: 'bg-slate-500/20 text-slate-400',
    AIRBNB: 'bg-rose-500/20 text-rose-400',
    BOOKING_COM: 'bg-blue-600/20 text-blue-300',
    DIRECT: 'bg-emerald-500/20 text-emerald-400',
    VRBO: 'bg-indigo-500/20 text-indigo-400',
    OTHER: 'bg-slate-500/20 text-slate-400',
};

const NOTE_ICONS: Record<string, any> = {
    NOTE: StickyNote,
    CALL: PhoneCall,
    EMAIL: Send,
    MEETING: Video,
    BOOKING: Calendar,
};

// ─── Main CRM Component ──────────────────────────────
export default function CRM() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ContactType>('ALL');
    const [sourceFilter, setSourceFilter] = useState<ContactSource>('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // ─── Fetch Contacts ───────────────────────────────
    const fetchContacts = useCallback(async () => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 5000);
        try {
            let query = supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (typeFilter !== 'ALL') {
                query = query.eq('type', typeFilter);
            }
            if (sourceFilter !== 'ALL') {
                query = query.eq('source', sourceFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setContacts((data || []) as Contact[]);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    }, [typeFilter, sourceFilter]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // ─── Filter contacts by search ────────────────────
    const filteredContacts = contacts.filter((c) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.first_name?.toLowerCase().includes(term) ||
            c.last_name?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.company?.toLowerCase().includes(term) ||
            c.phone?.toLowerCase().includes(term)
        );
    });

    // ─── Stats ────────────────────────────────────────
    const stats = {
        total: contacts.length,
        guests: contacts.filter((c) => c.type === 'GUEST').length,
        owners: contacts.filter((c) => c.type === 'OWNER').length,
        totalRevenue: contacts.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    };

    // ─── Handle Contact Click ─────────────────────────
    const openDetail = (contact: Contact) => {
        setSelectedContact(contact);
        setIsDetailOpen(true);
    };

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            // Delete notes first
            await supabase.from('contact_notes').delete().eq('contact_id', id);
            const { error } = await supabase.from('contacts').delete().eq('id', id);
            if (error) throw error;
            setContacts(contacts.filter((c) => c.id !== id));
            if (selectedContact?.id === id) {
                setIsDetailOpen(false);
                setSelectedContact(null);
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert('Error deleting contact');
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* ─── Header ───────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-bold text-white mb-2"
                        >
                            CRM
                        </motion.h1>
                        <p className="text-slate-400">Manage contacts, guests, owners & interactions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-64 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <UserPlus className="h-5 w-5" />
                            Add Contact
                        </button>
                    </div>
                </div>

                {/* ─── Stats Row ────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Contacts"
                        value={stats.total.toString()}
                        icon={<Users className="h-5 w-5 text-indigo-400" />}
                        color="indigo"
                    />
                    <StatsCard
                        title="Guests"
                        value={stats.guests.toString()}
                        icon={<User className="h-5 w-5 text-blue-400" />}
                        color="blue"
                    />
                    <StatsCard
                        title="Owners"
                        value={stats.owners.toString()}
                        icon={<Home className="h-5 w-5 text-purple-400" />}
                        color="purple"
                    />
                    <StatsCard
                        title="Total Revenue"
                        value={`€${stats.totalRevenue.toLocaleString()}`}
                        icon={<Briefcase className="h-5 w-5 text-emerald-400" />}
                        color="emerald"
                    />
                </div>

                {/* ─── Filters Row ──────────────────── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Filter className="h-4 w-4" />
                        <span>Filters:</span>
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as ContactType)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Types</option>
                        <option value="GUEST">Guests</option>
                        <option value="OWNER">Owners</option>
                        <option value="VENDOR">Vendors</option>
                        <option value="OTHER">Other</option>
                    </select>
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as ContactSource)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">All Sources</option>
                        <option value="MANUAL">Manual</option>
                        <option value="AIRBNB">Airbnb</option>
                        <option value="BOOKING_COM">Booking.com</option>
                        <option value="DIRECT">Direct</option>
                        <option value="VRBO">VRBO</option>
                    </select>
                    {(typeFilter !== 'ALL' || sourceFilter !== 'ALL') && (
                        <button
                            onClick={() => { setTypeFilter('ALL'); setSourceFilter('ALL'); }}
                            className="text-xs text-slate-400 hover:text-white transition-colors underline"
                        >
                            Clear filters
                        </button>
                    )}
                    <span className="text-xs text-slate-500 ml-auto">
                        {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ─── Contact List ─────────────────── */}
                <GlassCard className="p-0 overflow-hidden min-h-[400px]">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                            <div className="col-span-4">Contact</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Source</div>
                            <div className="col-span-1 text-center">Bookings</div>
                            <div className="col-span-2 text-right">Revenue</div>
                            <div className="col-span-1"></div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : filteredContacts.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            <AnimatePresence>
                                {filteredContacts.map((contact, i) => (
                                    <motion.div
                                        key={contact.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => openDetail(contact)}
                                        className="grid grid-cols-12 gap-4 items-center p-4 px-6 hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        {/* Contact Info */}
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                                                {contact.first_name?.[0]}{contact.last_name?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                                                    {contact.first_name} {contact.last_name}
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                                    <span className="flex items-center gap-1 truncate">
                                                        <Mail className="h-3 w-3 flex-shrink-0" /> {contact.email}
                                                    </span>
                                                    {contact.phone && (
                                                        <span className="flex items-center gap-1 hidden lg:flex">
                                                            <Phone className="h-3 w-3" /> {contact.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Type Badge */}
                                        <div className="col-span-2">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[contact.type] || TYPE_COLORS.OTHER}`}>
                                                {contact.type}
                                            </span>
                                        </div>

                                        {/* Source Badge */}
                                        <div className="col-span-2">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${SOURCE_COLORS[contact.source] || SOURCE_COLORS.OTHER}`}>
                                                {contact.source?.replace('_', '.')}
                                            </span>
                                        </div>

                                        {/* Bookings Count */}
                                        <div className="col-span-1 text-center">
                                            <span className="text-sm font-medium text-white">{contact.total_bookings || 0}</span>
                                        </div>

                                        {/* Revenue */}
                                        <div className="col-span-2 text-right">
                                            <span className="text-sm font-medium text-emerald-400">
                                                €{(contact.total_spent || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 flex justify-end">
                                            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No contacts found</h3>
                            <p className="text-slate-400 mt-2 mb-6 max-w-sm">
                                Start building your CRM by adding your first contact.
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                            >
                                Add First Contact
                            </button>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* ─── Modals & Panels ──────────────────── */}
            <CreateContactModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => { fetchContacts(); setIsCreateModalOpen(false); }}
            />

            <ContactDetailPanel
                contact={selectedContact}
                isOpen={isDetailOpen}
                onClose={() => { setIsDetailOpen(false); setSelectedContact(null); }}
                onUpdate={fetchContacts}
                onDelete={handleDeleteContact}
            />
        </div>
    );
}

// ─── Stats Card ───────────────────────────────────────
function StatsCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="p-5 rounded-xl bg-[#1e293b] border border-white/5 shadow-lg hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-0.5">{value}</h3>
            <p className="text-sm text-slate-400 font-medium">{title}</p>
        </div>
    );
}

// ─── Create Contact Modal ─────────────────────────────
function CreateContactModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', phone: '',
        company: '', type: 'GUEST' as Contact['type'],
        source: 'MANUAL' as Contact['source'], notes: '', tags: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('contacts').insert([{
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                phone: form.phone || null,
                company: form.company || null,
                type: form.type,
                source: form.source,
                notes: form.notes || null,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()) : null,
                total_bookings: 0,
                total_spent: 0,
            }]);
            if (error) throw error;
            setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', type: 'GUEST', source: 'MANUAL', notes: '', tags: '' });
            onSuccess();
        } catch (error: any) {
            console.error('Error creating contact:', error);
            alert(`Error: ${error?.message || 'Could not create contact'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50 sticky top-0 z-10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-400" />
                            New Contact
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
                            <InputField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
                        </div>
                        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                            <InputField label="Company" name="company" value={form.company} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Type</label>
                                <select name="type" value={form.type} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none">
                                    <option value="GUEST">Guest</option>
                                    <option value="OWNER">Owner</option>
                                    <option value="VENDOR">Vendor</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Source</label>
                                <select name="source" value={form.source} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none">
                                    <option value="MANUAL">Manual</option>
                                    <option value="AIRBNB">Airbnb</option>
                                    <option value="BOOKING_COM">Booking.com</option>
                                    <option value="DIRECT">Direct</option>
                                    <option value="VRBO">VRBO</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>
                        <InputField label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="vip, repeat, corporate" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Notes</label>
                            <textarea
                                name="notes" value={form.notes} onChange={handleChange} rows={3}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" disabled={loading}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all">
                                {loading ? 'Creating...' : 'Create Contact'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ─── Input Field Component ────────────────────────────
function InputField({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }:
    { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; placeholder?: string }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">{label}</label>
            <input
                name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
        </div>
    );
}

// ─── Contact Detail Panel ─────────────────────────────
function ContactDetailPanel({ contact, isOpen, onClose, onUpdate, onDelete }:
    { contact: Contact | null; isOpen: boolean; onClose: () => void; onUpdate: () => void; onDelete: (id: string) => void }) {
    const { user } = useAuth();
    const [notes, setNotes] = useState<ContactNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState<ContactNote['type']>('NOTE');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Contact>>({});

    // Fetch notes when contact changes
    useEffect(() => {
        if (contact && isOpen) {
            fetchNotes(contact.id);
            setEditForm(contact);
        }
    }, [contact, isOpen]);

    const fetchNotes = async (contactId: string) => {
        setLoadingNotes(true);
        try {
            const { data, error } = await supabase
                .from('contact_notes')
                .select('*')
                .eq('contact_id', contactId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setNotes((data || []) as ContactNote[]);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const addNote = async () => {
        if (!newNote.trim() || !contact) return;
        try {
            const { error } = await supabase.from('contact_notes').insert([{
                contact_id: contact.id,
                type: noteType,
                content: newNote.trim(),
                created_by: user?.email || null,
            }]);
            if (error) throw error;
            setNewNote('');
            fetchNotes(contact.id);

            // Update last_contact_date
            await supabase.from('contacts').update({
                last_contact_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('id', contact.id);
            onUpdate();
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const saveEdit = async () => {
        if (!contact) return;
        try {
            const { error } = await supabase.from('contacts').update({
                first_name: editForm.first_name,
                last_name: editForm.last_name,
                email: editForm.email,
                phone: editForm.phone || null,
                company: editForm.company || null,
                type: editForm.type,
                source: editForm.source,
                notes: editForm.notes || null,
                updated_at: new Date().toISOString(),
            }).eq('id', contact.id);
            if (error) throw error;
            setIsEditing(false);
            onUpdate();
        } catch (error: any) {
            console.error('Error updating contact:', error);
            alert(`Error: ${error?.message || 'Could not update'}`);
        }
    };

    if (!isOpen || !contact) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl bg-[#1e293b] border-l border-white/10 shadow-2xl overflow-y-auto h-full"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-[#0f172a]/50 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {contact.first_name} {contact.last_name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[contact.type]}`}>
                                            {contact.type}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[contact.source]}`}>
                                            {contact.source?.replace('_', '.')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsEditing(!isEditing)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button onClick={() => onDelete(contact.id)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">

                        {/* Contact Info / Edit */}
                        {isEditing ? (
                            <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <Edit3 className="h-4 w-4 text-indigo-400" /> Edit Contact
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input name="first_name" value={editForm.first_name || ''} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        placeholder="First Name" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                    <input name="last_name" value={editForm.last_name || ''} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        placeholder="Last Name" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <input value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="Phone" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                    <input value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                        placeholder="Company" className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white">Cancel</button>
                                    <button onClick={saveEdit} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium">Save</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email} />
                                <InfoItem icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone || '—'} />
                                <InfoItem icon={<Building className="h-4 w-4" />} label="Company" value={contact.company || '—'} />
                                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Since" value={new Date(contact.created_at).toLocaleDateString()} />
                                <InfoItem icon={<Star className="h-4 w-4" />} label="Bookings" value={`${contact.total_bookings || 0}`} />
                                <InfoItem icon={<Briefcase className="h-4 w-4" />} label="Total Spent" value={`€${(contact.total_spent || 0).toLocaleString()}`} />
                            </div>
                        )}

                        {/* Tags */}
                        {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {contact.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {contact.notes && (
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm text-slate-300">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
                                {contact.notes}
                            </div>
                        )}

                        {/* ─── Activity Timeline ────────── */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-400" />
                                Activity Timeline
                            </h3>

                            {/* Add Note Form */}
                            <div className="flex gap-2">
                                <select value={noteType} onChange={(e) => setNoteType(e.target.value as ContactNote['type'])}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-24">
                                    <option value="NOTE">Note</option>
                                    <option value="CALL">Call</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="MEETING">Meeting</option>
                                </select>
                                <input
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                    placeholder="Add a note or log an interaction..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <button onClick={addNote} disabled={!newNote.trim()}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition-all">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Timeline */}
                            {loadingNotes ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                </div>
                            ) : notes.length > 0 ? (
                                <div className="space-y-3">
                                    {notes.map((note) => {
                                        const NoteIcon = NOTE_ICONS[note.type] || StickyNote;
                                        return (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                                            >
                                                <div className="p-2 bg-white/5 rounded-lg h-fit">
                                                    <NoteIcon className="h-4 w-4 text-indigo-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-200">{note.content}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                                        <span>{note.type}</span>
                                                        <span>•</span>
                                                        <span>{new Date(note.created_at).toLocaleString()}</span>
                                                        {note.created_by && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{note.created_by}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">No interactions recorded yet.</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ─── Info Item Component ──────────────────────────────
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                {icon} {label}
            </div>
            <p className="text-sm font-medium text-white truncate">{value}</p>
        </div>
    );
}
