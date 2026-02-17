import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Globe,
    Plus,
    RefreshCw,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    AlertTriangle,
    Link2,
    History,
    ChevronDown,
    ChevronRight,
    Power,
    PowerOff,
    X,
    Search,
    Activity,
} from 'lucide-react';
import { channelsApi } from '../api/client';
import { supabase } from '../lib/supabase';

// Platform definitions
const PLATFORMS = [
    {
        id: 'airbnb',
        name: 'Airbnb',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg',
        color: 'from-rose-500 to-pink-600',
        bgColor: 'bg-rose-500/10',
        textColor: 'text-rose-400',
        connectionTypes: ['ical'],
        description: 'channels.airbnbDesc',
    },
    {
        id: 'booking_com',
        name: 'Booking.com',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Booking.com_logo.png',
        color: 'from-blue-500 to-blue-700',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        connectionTypes: ['ical'],
        description: 'channels.bookingDesc',
    },
    {
        id: 'vrbo',
        name: 'VRBO',
        logo: '',
        color: 'from-indigo-500 to-violet-600',
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-400',
        connectionTypes: ['ical'],
        description: 'channels.vrboDesc',
    },
    {
        id: 'lodgify',
        name: 'Lodgify',
        logo: '',
        color: 'from-emerald-500 to-teal-600',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        connectionTypes: ['api'],
        description: 'channels.lodgifyDesc',
    },
];

interface Connection {
    id: string;
    propertyId: string;
    property: { id: string; name: string };
    platform: string;
    connectionType: string;
    icalUrl: string | null;
    apiKey: string | null;
    externalPropertyId: string | null;
    autoSyncEnabled: boolean;
    syncIntervalMinutes: number;
    lastSyncAt: string | null;
    lastSyncStatus: string | null;
    lastSyncMessage: string | null;
    enabled: boolean;
    createdAt: string;
}

interface SyncLogEntry {
    id: string;
    connectionId: string;
    propertyId: string;
    platform: string;
    syncType: string;
    status: string;
    added: number;
    updated: number;
    errors: number;
    message: string;
    startedAt: string;
    completedAt: string | null;
}

interface PropertyOption {
    id: string;
    name: string;
}

interface Stats {
    totalConnections: number;
    activeConnections: number;
    autoSyncCount: number;
    syncedToday: number;
    errorCount: number;
    platformCounts: Record<string, number>;
}

const ChannelManager = () => {
    const { t } = useTranslation();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLogsPanel, setShowLogsPanel] = useState(false);
    const [, setSelectedLogConnectionId] = useState<string | null>(null);
    const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Add modal state
    const [newConn, setNewConn] = useState({
        propertyId: '',
        platform: 'airbnb',
        connectionType: 'ical',
        icalUrl: '',
        apiKey: '',
        externalPropertyId: '',
        autoSyncEnabled: false,
        syncIntervalMinutes: 60,
    });
    const [creating, setCreating] = useState(false);

    // Lodgify test state
    const [lodgifyTestResult, setLodgifyTestResult] = useState<any>(null);
    const [testingLodgify, setTestingLodgify] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [connRes, statsRes, logsRes] = await Promise.all([
                channelsApi.getConnections(),
                channelsApi.getStats(),
                channelsApi.getSyncLogs(undefined, 20),
            ]);
            setConnections(connRes.data);
            setStats(statsRes.data);
            setSyncLogs(logsRes.data);
        } catch (err) {
            console.error('Error loading channel data:', err);
        }

        // Load properties from Supabase
        try {
            const { data } = await supabase.from('properties').select('id, name').order('name');
            setProperties(data || []);
        } catch { /* ignore */ }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSync = async (connectionId: string) => {
        setSyncingId(connectionId);
        try {
            await channelsApi.syncConnection(connectionId);
            await fetchData();
        } catch (err: any) {
            console.error('Sync failed:', err);
        } finally {
            setSyncingId(null);
        }
    };

    const handleSyncAll = async () => {
        setSyncingId('all');
        try {
            await channelsApi.syncAll();
            await fetchData();
        } catch (err: any) {
            console.error('Sync all failed:', err);
        } finally {
            setSyncingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('channels.confirmDelete'))) return;
        try {
            await channelsApi.deleteConnection(id);
            await fetchData();
        } catch (err: any) {
            console.error('Delete failed:', err);
        }
    };

    const handleToggleEnabled = async (conn: Connection) => {
        try {
            await channelsApi.updateConnection(conn.id, { enabled: !conn.enabled });
            await fetchData();
        } catch (err: any) {
            console.error('Toggle failed:', err);
        }
    };

    const handleToggleAutoSync = async (conn: Connection) => {
        try {
            await channelsApi.updateConnection(conn.id, {
                autoSyncEnabled: !conn.autoSyncEnabled,
            });
            await fetchData();
        } catch (err: any) {
            console.error('Auto-sync toggle failed:', err);
        }
    };

    const handleCreate = async () => {
        if (!newConn.propertyId || !newConn.platform) return;
        setCreating(true);
        try {
            await channelsApi.createConnection({
                propertyId: newConn.propertyId,
                platform: newConn.platform,
                connectionType: newConn.connectionType,
                icalUrl: newConn.connectionType === 'ical' ? newConn.icalUrl : null,
                apiKey: newConn.connectionType === 'api' ? newConn.apiKey : null,
                externalPropertyId: newConn.externalPropertyId || null,
                autoSyncEnabled: newConn.autoSyncEnabled,
                syncIntervalMinutes: newConn.syncIntervalMinutes,
            });
            setShowAddModal(false);
            setNewConn({
                propertyId: '',
                platform: 'airbnb',
                connectionType: 'ical',
                icalUrl: '',
                apiKey: '',
                externalPropertyId: '',
                autoSyncEnabled: false,
                syncIntervalMinutes: 60,
            });
            await fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.message || err.message || 'Error creating connection');
        } finally {
            setCreating(false);
        }
    };

    const handleTestLodgify = async () => {
        if (!newConn.apiKey) return;
        setTestingLodgify(true);
        try {
            const { data } = await channelsApi.testLodgifyKey(newConn.apiKey);
            setLodgifyTestResult(data);
        } catch (err: any) {
            setLodgifyTestResult({ valid: false, message: err.message });
        } finally {
            setTestingLodgify(false);
        }
    };

    const viewConnectionLogs = async (connectionId: string) => {
        setSelectedLogConnectionId(connectionId);
        setShowLogsPanel(true);
        try {
            const { data } = await channelsApi.getSyncLogs(connectionId, 30);
            setSyncLogs(data);
        } catch { /* ignore */ }
    };

    const getPlatformDef = (id: string) => PLATFORMS.find((p) => p.id === id);

    const filteredConnections = connections.filter((conn) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            conn.property?.name?.toLowerCase().includes(s) ||
            conn.platform.toLowerCase().includes(s)
        );
    });

    const formatTimeAgo = (dateStr: string | null) => {
        if (!dateStr) return t('channels.never');
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('channels.justNow');
        if (mins < 60) return `${mins}m ${t('channels.ago')}`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ${t('channels.ago')}`;
        const days = Math.floor(hours / 24);
        return `${days}d ${t('channels.ago')}`;
    };

    const statusIcon = (status: string | null) => {
        if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
        if (status === 'error') return <XCircle className="h-4 w-4 text-red-400" />;
        if (status === 'partial') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
        return <Clock className="h-4 w-4 text-slate-500" />;
    };

    const selectedPlatform = getPlatformDef(newConn.platform);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('channels.title')}</h1>
                    <p className="text-sm text-slate-400 mt-1">{t('channels.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncAll}
                        disabled={syncingId === 'all'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncingId === 'all' ? 'animate-spin' : ''}`} />
                        {t('channels.syncAll')}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="h-4 w-4" />
                        {t('channels.addConnection')}
                    </button>
                </div>
            </div>

            {/* KPI Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: t('channels.totalConnections'), value: stats.totalConnections, icon: Link2, color: 'text-indigo-400' },
                        { label: t('channels.activeSync'), value: stats.autoSyncCount, icon: Zap, color: 'text-amber-400' },
                        { label: t('channels.syncedToday'), value: stats.syncedToday, icon: CheckCircle2, color: 'text-emerald-400' },
                        { label: t('channels.syncErrors'), value: stats.errorCount, icon: AlertTriangle, color: 'text-red-400' },
                    ].map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                                    <p className="text-xs text-slate-400">{kpi.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Platform Cards */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">{t('channels.platforms')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PLATFORMS.map((platform) => {
                        const count = stats?.platformCounts[platform.id] || 0;
                        const platformConns = connections.filter((c) => c.platform === platform.id);
                        const isExpanded = expandedPlatform === platform.id;

                        return (
                            <motion.div
                                key={platform.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-bold text-sm`}>
                                        {platform.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{platform.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {count} {t('channels.connections')} · {platform.connectionTypes.includes('api') ? 'API' : 'iCal'}
                                        </p>
                                    </div>
                                    {count > 0 ? (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                                            {t('channels.active')}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-500/20 text-slate-400">
                                            {t('channels.notConnected')}
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && platformConns.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5"
                                        >
                                            <div className="p-3 space-y-2">
                                                {platformConns.map((conn) => (
                                                    <div key={conn.id} className="flex items-center gap-2 text-xs">
                                                        {statusIcon(conn.lastSyncStatus)}
                                                        <span className="text-slate-300 truncate flex-1">
                                                            {conn.property?.name || conn.propertyId}
                                                        </span>
                                                        <span className="text-slate-500">
                                                            {formatTimeAgo(conn.lastSyncAt)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Connections Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">{t('channels.allConnections')}</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('channels.searchPlaceholder')}
                                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64"
                            />
                        </div>
                        <button
                            onClick={() => { setSelectedLogConnectionId(null); setShowLogsPanel(!showLogsPanel); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
                        >
                            <History className="h-4 w-4" />
                            {t('channels.logs')}
                        </button>
                    </div>
                </div>

                {filteredConnections.length === 0 ? (
                    <div className="p-12 text-center">
                        <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">{t('channels.emptyTitle')}</h3>
                        <p className="text-sm text-slate-400 mb-4">{t('channels.emptyDescription')}</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all"
                        >
                            <Plus className="inline h-4 w-4 mr-1" />
                            {t('channels.addFirstConnection')}
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase">
                                    <th className="text-left px-4 py-3">{t('channels.thProperty')}</th>
                                    <th className="text-left px-4 py-3">{t('channels.thPlatform')}</th>
                                    <th className="text-left px-4 py-3">{t('channels.thType')}</th>
                                    <th className="text-left px-4 py-3">{t('channels.thStatus')}</th>
                                    <th className="text-left px-4 py-3">{t('channels.thLastSync')}</th>
                                    <th className="text-left px-4 py-3">{t('channels.thAutoSync')}</th>
                                    <th className="text-right px-4 py-3">{t('channels.thActions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredConnections.map((conn) => {
                                    const platformDef = getPlatformDef(conn.platform);
                                    return (
                                        <tr key={conn.id} className={`hover:bg-white/5 transition-colors ${!conn.enabled ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-white">{conn.property?.name || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded bg-gradient-to-br ${platformDef?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-[10px] font-bold`}>
                                                        {platformDef?.name.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-sm text-slate-300">{platformDef?.name || conn.platform}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                    conn.connectionType === 'api'
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                    {conn.connectionType === 'api' ? 'API' : 'iCal'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {statusIcon(conn.lastSyncStatus)}
                                                    <span className="text-xs text-slate-400 capitalize">{conn.lastSyncStatus || t('channels.pending')}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-slate-400">{formatTimeAgo(conn.lastSyncAt)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleAutoSync(conn)}
                                                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                                                        conn.autoSyncEnabled
                                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                            : 'bg-slate-500/20 text-slate-500 hover:bg-slate-500/30'
                                                    }`}
                                                >
                                                    <Zap className="h-3 w-3" />
                                                    {conn.autoSyncEnabled ? `${conn.syncIntervalMinutes}m` : 'Off'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleSync(conn.id)}
                                                        disabled={syncingId === conn.id}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-colors"
                                                        title={t('channels.sync')}
                                                    >
                                                        <RefreshCw className={`h-4 w-4 ${syncingId === conn.id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => viewConnectionLogs(conn.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                                                        title={t('channels.logs')}
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleEnabled(conn)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                                        title={conn.enabled ? t('channels.disable') : t('channels.enable')}
                                                    >
                                                        {conn.enabled ? <Power className="h-4 w-4 text-emerald-400" /> : <PowerOff className="h-4 w-4 text-red-400" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(conn.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sync Logs Panel */}
            <AnimatePresence>
                {showLogsPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-400" />
                                <h2 className="text-lg font-semibold text-white">{t('channels.syncHistory')}</h2>
                            </div>
                            <button
                                onClick={() => setShowLogsPanel(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {syncLogs.length === 0 ? (
                                <p className="p-6 text-center text-sm text-slate-500">{t('channels.noLogs')}</p>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {syncLogs.map((log) => {
                                        const platformDef = getPlatformDef(log.platform);
                                        return (
                                            <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                                                {statusIcon(log.status)}
                                                <div className={`w-5 h-5 rounded bg-gradient-to-br ${platformDef?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-[8px] font-bold`}>
                                                    {platformDef?.name.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-white truncate">{log.message || '—'}</p>
                                                    <p className="text-[10px] text-slate-500">
                                                        +{log.added} / ~{log.updated} / {log.errors} err · {log.syncType}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                                    {formatTimeAgo(log.startedAt)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Connection Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">{t('channels.addConnection')}</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Platform Selection */}
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">{t('channels.selectPlatform')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PLATFORMS.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setNewConn((prev) => ({
                                                        ...prev,
                                                        platform: p.id,
                                                        connectionType: p.connectionTypes[0],
                                                    }));
                                                    setLodgifyTestResult(null);
                                                }}
                                                className={`p-3 rounded-lg border text-left transition-all ${
                                                    newConn.platform === p.id
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded bg-gradient-to-br ${p.color} flex items-center justify-center text-white font-bold text-xs`}>
                                                        {p.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400">{p.connectionTypes.includes('api') ? 'REST API' : 'iCal Feed'}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Property Selection */}
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">{t('channels.selectProperty')}</label>
                                    <select
                                        value={newConn.propertyId}
                                        onChange={(e) => setNewConn((prev) => ({ ...prev, propertyId: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <option value="">{t('channels.chooseProperty')}</option>
                                        {properties.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* iCal URL (for iCal connections) */}
                                {selectedPlatform?.connectionTypes.includes('ical') && newConn.connectionType === 'ical' && (
                                    <div>
                                        <label className="text-sm text-slate-400 mb-1 block">{t('channels.icalUrl')}</label>
                                        <input
                                            type="url"
                                            value={newConn.icalUrl}
                                            onChange={(e) => setNewConn((prev) => ({ ...prev, icalUrl: e.target.value }))}
                                            placeholder="https://www.airbnb.com/calendar/ical/..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">{t('channels.icalHint')}</p>
                                    </div>
                                )}

                                {/* API Key (for API connections - Lodgify) */}
                                {selectedPlatform?.connectionTypes.includes('api') && newConn.connectionType === 'api' && (
                                    <>
                                        <div>
                                            <label className="text-sm text-slate-400 mb-1 block">{t('channels.apiKey')}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    value={newConn.apiKey}
                                                    onChange={(e) => setNewConn((prev) => ({ ...prev, apiKey: e.target.value }))}
                                                    placeholder="Your Lodgify API Key"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                />
                                                <button
                                                    onClick={handleTestLodgify}
                                                    disabled={!newConn.apiKey || testingLodgify}
                                                    className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                                >
                                                    {testingLodgify ? <RefreshCw className="h-4 w-4 animate-spin" /> : t('channels.testKey')}
                                                </button>
                                            </div>
                                        </div>
                                        {lodgifyTestResult && (
                                            <div className={`p-3 rounded-lg text-sm ${
                                                lodgifyTestResult.valid
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    {lodgifyTestResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                    {lodgifyTestResult.message}
                                                </div>
                                                {lodgifyTestResult.properties?.length > 0 && (
                                                    <div className="mt-2">
                                                        <select
                                                            value={newConn.externalPropertyId}
                                                            onChange={(e) => setNewConn((prev) => ({ ...prev, externalPropertyId: e.target.value }))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                                        >
                                                            <option value="">{t('channels.allLodgifyProperties')}</option>
                                                            {lodgifyTestResult.properties.map((p: any) => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Auto-sync Settings */}
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-400" />
                                            <span className="text-sm text-white">{t('channels.autoSync')}</span>
                                        </div>
                                        <button
                                            onClick={() => setNewConn((prev) => ({ ...prev, autoSyncEnabled: !prev.autoSyncEnabled }))}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${
                                                newConn.autoSyncEnabled ? 'bg-indigo-500' : 'bg-slate-600'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                                                newConn.autoSyncEnabled ? 'left-5' : 'left-0.5'
                                            }`} />
                                        </button>
                                    </div>
                                    {newConn.autoSyncEnabled && (
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">{t('channels.syncInterval')}</label>
                                            <select
                                                value={newConn.syncIntervalMinutes}
                                                onChange={(e) => setNewConn((prev) => ({ ...prev, syncIntervalMinutes: parseInt(e.target.value) }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                            >
                                                <option value={15}>15 {t('channels.minutes')}</option>
                                                <option value={30}>30 {t('channels.minutes')}</option>
                                                <option value={60}>1 {t('channels.hour')}</option>
                                                <option value={360}>6 {t('channels.hours')}</option>
                                                <option value={720}>12 {t('channels.hours')}</option>
                                                <option value={1440}>24 {t('channels.hours')}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !newConn.propertyId}
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50"
                                >
                                    {creating ? <RefreshCw className="inline h-4 w-4 animate-spin mr-1" /> : <Plus className="inline h-4 w-4 mr-1" />}
                                    {creating ? t('common.creating') : t('channels.createConnection')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChannelManager;
