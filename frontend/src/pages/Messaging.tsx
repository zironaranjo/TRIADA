import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Smartphone,
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  User,
  X,
  AlertTriangle,
  Wifi,
} from 'lucide-react';
import { messagingApi } from '../api/client';
import { supabase } from '../lib/supabase';

interface Template {
  key: string;
  name: string;
  description: string;
  preview: string;
}

interface MessageLogEntry {
  id: string;
  booking_id: string | null;
  property_id: string | null;
  recipient_name: string | null;
  recipient_phone: string;
  channel: 'whatsapp' | 'sms';
  template_key: string | null;
  message: string;
  status: string;
  external_sid: string | null;
  error_message: string | null;
  sent_by: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  whatsapp: number;
  sms: number;
  sent: number;
  failed: number;
  today: number;
}

interface BookingOption {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  start_date: string;
  end_date: string;
  property_id: string;
  properties?: { name: string };
  guest_token?: string;
}

export default function Messaging() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<MessageLogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    phone?: string;
    whatsapp?: string;
    error?: string;
  } | null>(null);

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMode, setSendMode] = useState<'template' | 'custom' | 'direct'>('template');
  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [customMessage, setCustomMessage] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [templatesRes, logsRes, statsRes, connRes] = await Promise.all([
        messagingApi.getTemplates(),
        messagingApi.getLogs({ limit: 100 }),
        messagingApi.getStats(),
        messagingApi.testConnection(),
      ]);

      setTemplates(templatesRes.data);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setConnectionStatus(connRes.data);

      const { data: bData } = await supabase
        .from('bookings')
        .select('id, guest_name, guest_phone, guest_email, start_date, end_date, property_id, guest_token, properties(name)')
        .order('start_date', { ascending: false })
        .limit(100);
      if (bData) setBookings(bData as any);
    } catch (err) {
      console.error('Error loading messaging data:', err);
    }
    setLoading(false);
  }

  async function handleSend() {
    setSending(true);
    try {
      if (sendMode === 'template') {
        await messagingApi.sendTemplate({
          bookingId: selectedBooking,
          templateKey: selectedTemplate,
          channel: selectedChannel,
        });
      } else if (sendMode === 'custom') {
        await messagingApi.sendCustom({
          bookingId: selectedBooking,
          message: customMessage,
          channel: selectedChannel,
        });
      } else if (sendMode === 'direct') {
        await messagingApi.sendDirect({
          phone: directPhone,
          message: customMessage,
          channel: selectedChannel,
        });
      }
      setShowSendModal(false);
      setCustomMessage('');
      setSelectedBooking('');
      setSelectedTemplate('');
      setDirectPhone('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error sending message');
    }
    setSending(false);
  }

  const filteredLogs = logs.filter((log) => {
    if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.recipient_name?.toLowerCase().includes(q) ||
        log.recipient_phone.toLowerCase().includes(q) ||
        log.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const channelIcon = (channel: string) =>
    channel === 'whatsapp' ? (
      <MessageCircle className="w-4 h-4 text-green-400" />
    ) : (
      <Smartphone className="w-4 h-4 text-blue-400" />
    );

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('messaging.justNow');
    if (mins < 60) return `${mins}m ${t('messaging.ago')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${t('messaging.ago')}`;
    const days = Math.floor(hrs / 24);
    return `${days}d ${t('messaging.ago')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-green-400" />
            {t('messaging.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('messaging.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {t('messaging.sendMessage')}
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      {connectionStatus && !connectionStatus.connected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-300 font-medium">{t('messaging.notConnected')}</p>
            <p className="text-yellow-400/70 text-sm mt-1">{t('messaging.notConnectedDesc')}</p>
          </div>
        </motion.div>
      )}

      {connectionStatus?.connected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4 flex items-center gap-3"
        >
          <Wifi className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <p className="text-emerald-300 font-medium">{t('messaging.connected')}</p>
            <p className="text-emerald-400/60 text-sm">
              {(connectionStatus as any).whatsapp?.provider && `WhatsApp: ${(connectionStatus as any).whatsapp.provider}`}
              {(connectionStatus as any).sms?.provider && ` · SMS: ${(connectionStatus as any).sms.provider}`}
            </p>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: t('messaging.totalMessages'),
              value: stats.total,
              icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
              color: 'blue',
            },
            {
              label: 'WhatsApp',
              value: stats.whatsapp,
              icon: <MessageCircle className="w-5 h-5 text-green-400" />,
              color: 'green',
            },
            {
              label: 'SMS',
              value: stats.sms,
              icon: <Smartphone className="w-5 h-5 text-purple-400" />,
              color: 'purple',
            },
            {
              label: t('messaging.sentToday'),
              value: stats.today,
              icon: <Zap className="w-5 h-5 text-yellow-400" />,
              color: 'yellow',
            },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{kpi.label}</span>
                {kpi.icon}
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Templates Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          {t('messaging.templates')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => (
            <motion.button
              key={tpl.key}
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                setSendMode('template');
                setSelectedTemplate(tpl.key);
                setShowSendModal(true);
              }}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-left hover:border-green-600 transition group"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium text-sm">{tpl.name}</span>
              </div>
              <p className="text-slate-500 text-xs">{tpl.description}</p>
              <p className="text-slate-400 text-xs mt-2 italic truncate">{tpl.preview}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Message Log */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            {t('messaging.history')}
          </h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder={t('messaging.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 w-56"
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none"
            >
              <option value="all">{t('messaging.allChannels')}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">{t('messaging.noMessages')}</p>
            <p className="text-slate-500 text-sm mt-1">{t('messaging.noMessagesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition text-left"
                >
                  {channelIcon(log.channel)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {log.recipient_name || log.recipient_phone}
                      </span>
                      <span className="text-slate-600 text-xs">{log.recipient_phone}</span>
                    </div>
                    <p className="text-slate-400 text-xs truncate">{log.message.slice(0, 80)}...</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusIcon(log.status)}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.status === 'sent' || log.status === 'delivered'
                        ? 'bg-emerald-900/40 text-emerald-400'
                        : log.status === 'failed'
                        ? 'bg-red-900/40 text-red-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-slate-500 text-xs w-16 text-right">{timeAgo(log.created_at)}</span>
                    {expandedLog === log.id ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedLog === log.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700"
                    >
                      <div className="p-4 space-y-3">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans">{log.message}</pre>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Channel: <span className="text-slate-300">{log.channel.toUpperCase()}</span></span>
                          {log.template_key && (
                            <span>Template: <span className="text-slate-300">{log.template_key}</span></span>
                          )}
                          {log.external_sid && (
                            <span>SID: <span className="text-slate-300 font-mono">{log.external_sid}</span></span>
                          )}
                          {log.error_message && (
                            <span className="text-red-400">Error: {log.error_message}</span>
                          )}
                          <span>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-400" />
                    {t('messaging.sendMessage')}
                  </h3>
                  <button onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-5">
                  {(['template', 'custom', 'direct'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSendMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        sendMode === mode
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'template' && t('messaging.modeTemplate')}
                      {mode === 'custom' && t('messaging.modeCustom')}
                      {mode === 'direct' && t('messaging.modeDirect')}
                    </button>
                  ))}
                </div>

                {/* Channel Selection */}
                <div className="mb-4">
                  <label className="text-sm text-slate-400 mb-2 block">{t('messaging.channel')}</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedChannel('whatsapp')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition ${
                        selectedChannel === 'whatsapp'
                          ? 'bg-green-900/30 border-green-600 text-green-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setSelectedChannel('sms')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition ${
                        selectedChannel === 'sms'
                          ? 'bg-blue-900/30 border-blue-600 text-blue-400'
                          : 'bg-slate-700/50 border-slate-600 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      SMS
                    </button>
                  </div>
                </div>

                {/* Booking Selection (template & custom modes) */}
                {sendMode !== 'direct' && (
                  <div className="mb-4">
                    <label className="text-sm text-slate-400 mb-2 block">
                      <User className="w-3.5 h-3.5 inline mr-1" />
                      {t('messaging.selectBooking')}
                    </label>
                    <select
                      value={selectedBooking}
                      onChange={(e) => setSelectedBooking(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      <option value="">{t('messaging.chooseBooking')}</option>
                      {bookings
                        .filter((b) => b.guest_phone)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.guest_name} — {(b.properties as any)?.name || 'Property'} ({b.guest_phone})
                          </option>
                        ))}
                    </select>
                    {bookings.filter((b) => !b.guest_phone).length > 0 && (
                      <p className="text-xs text-yellow-500 mt-1">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {t('messaging.noPhoneHint', {
                          count: bookings.filter((b) => !b.guest_phone).length,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Template Selection */}
                {sendMode === 'template' && (
                  <div className="mb-4">
                    <label className="text-sm text-slate-400 mb-2 block">
                      <FileText className="w-3.5 h-3.5 inline mr-1" />
                      {t('messaging.selectTemplate')}
                    </label>
                    <div className="space-y-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.key}
                          onClick={() => setSelectedTemplate(tpl.key)}
                          className={`w-full text-left p-3 rounded-xl border transition ${
                            selectedTemplate === tpl.key
                              ? 'bg-green-900/20 border-green-600'
                              : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <p className="text-white text-sm font-medium">{tpl.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{tpl.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Message */}
                {(sendMode === 'custom' || sendMode === 'direct') && (
                  <div className="mb-4">
                    {sendMode === 'direct' && (
                      <div className="mb-4">
                        <label className="text-sm text-slate-400 mb-2 block">
                          <Phone className="w-3.5 h-3.5 inline mr-1" />
                          {t('messaging.phoneNumber')}
                        </label>
                        <input
                          type="tel"
                          value={directPhone}
                          onChange={(e) => setDirectPhone(e.target.value)}
                          placeholder="+1 234 567 8900"
                          className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
                        />
                      </div>
                    )}
                    <label className="text-sm text-slate-400 mb-2 block">
                      <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                      {t('messaging.messageLabel')}
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={5}
                      placeholder={t('messaging.messagePlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">{customMessage.length}/1600</p>
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={
                    sending ||
                    (sendMode === 'template' && (!selectedBooking || !selectedTemplate)) ||
                    (sendMode === 'custom' && (!selectedBooking || !customMessage)) ||
                    (sendMode === 'direct' && (!directPhone || !customMessage))
                  }
                  className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? t('messaging.sending') : t('messaging.send')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
