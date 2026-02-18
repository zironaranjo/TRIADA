import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, PenLine, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contract {
  id: string;
  title: string;
  content: string | null;
  status: string;
  guest_name: string | null;
  signature: string | null;
  signed_at: string | null;
}

export default function ContractSign() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    loadContract();
  }, [token]);

  async function loadContract() {
    if (!token) { setInvalid(true); setLoading(false); return; }
    const { data, error } = await supabase
      .from('contracts')
      .select('id, title, content, status, guest_name, signature, signed_at')
      .eq('sign_token', token)
      .single();

    if (error || !data) {
      setInvalid(true);
    } else {
      setContract(data as Contract);
      if (data.status === 'signed') setSigned(true);
    }
    setLoading(false);
  }

  async function handleSign() {
    if (!signature.trim() || !agreed || !contract) return;
    setSigning(true);
    try {
      const { error } = await supabase.from('contracts').update({
        status: 'signed',
        signature: signature.trim(),
        signed_at: new Date().toISOString(),
      }).eq('id', contract.id);
      if (error) throw error;
      setSigned(true);
    } catch (err: any) {
      alert(err.message);
    }
    setSigning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (invalid || !contract) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">{t('contracts.signPage.invalidToken')}</h2>
          <p className="text-slate-400 mt-2">{t('contracts.signPage.poweredBy')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/logotriadak.png" alt="Triadak" className="h-8 w-auto" />
          <div>
            <p className="text-white font-semibold text-sm">{t('contracts.signPage.title')}</p>
            <p className="text-slate-400 text-xs">{t('contracts.signPage.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Contract Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-900/30 border border-violet-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{contract.title}</h1>
            {contract.guest_name && <p className="text-slate-400 text-sm">{contract.guest_name}</p>}
          </div>
        </div>

        {/* Already signed */}
        {signed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-900/20 border border-emerald-700 rounded-2xl p-6 text-center"
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white">{t('contracts.signPage.successTitle')}</h2>
            <p className="text-slate-300 mt-2">{t('contracts.signPage.successMessage')}</p>
            {contract.signature && (
              <p className="text-emerald-400 mt-3 text-sm">
                {t('contracts.signPage.signedBy')}: <span className="font-semibold">{contract.signature}</span>
              </p>
            )}
            {contract.signed_at && (
              <p className="text-slate-500 text-xs mt-1">{new Date(contract.signed_at).toLocaleString()}</p>
            )}
            <p className="text-slate-600 text-xs mt-4">{t('contracts.signPage.poweredBy')}</p>
          </motion.div>
        )}

        {/* Contract Content */}
        {!signed && (
          <>
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 max-h-96 overflow-y-auto">
              <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {contract.content || ''}
              </pre>
            </div>

            {/* Sign Section */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <PenLine className="w-5 h-5 text-violet-400" />
                {t('contracts.signPage.signHere')}
              </h3>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">{t('contracts.signPage.fullNamePlaceholder')}</label>
                <input
                  type="text"
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  placeholder={contract.guest_name || 'Full Name'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-lg font-medium italic"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-violet-500"
                />
                <span className="text-slate-300 text-sm">{t('contracts.signPage.iAgree')}</span>
              </label>

              <button
                onClick={handleSign}
                disabled={!signature.trim() || !agreed || signing}
                className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {signing ? t('contracts.signPage.signing') : t('contracts.signPage.signButton')}
              </button>
            </div>

            <p className="text-center text-slate-600 text-xs">{t('contracts.signPage.poweredBy')}</p>
          </>
        )}
      </div>
    </div>
  );
}
