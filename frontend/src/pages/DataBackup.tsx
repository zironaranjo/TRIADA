import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import {
  Database,
  Download,
  FileText,
  FileJson,
  Home,
  CalendarDays,
  Users,
  DollarSign,
  UserCircle,
  ScrollText,
  HardHat,
  RefreshCw,
  Shield,
  CheckCircle2,
  AlertCircle,
  Archive,
  Upload,
  X,
  Eye,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'triadak_last_backup';

interface Section {
  key: string;
  table: string;
  icon: React.ReactNode;
  color: string;
  columns?: string;
}

const SECTIONS: Section[] = [
  { key: 'properties', table: 'properties', icon: <Home className="w-5 h-5" />, color: 'text-blue-400', columns: 'id, name, status, price_per_night, created_at' },
  { key: 'bookings',   table: 'bookings',   icon: <CalendarDays className="w-5 h-5" />, color: 'text-emerald-400', columns: 'id, guest_name, guest_email, guest_phone, property_id, start_date, end_date, total_price, platform, status, created_at' },
  { key: 'contacts',   table: 'contacts',   icon: <Users className="w-5 h-5" />, color: 'text-violet-400' },
  { key: 'expenses',   table: 'expenses',   icon: <DollarSign className="w-5 h-5" />, color: 'text-yellow-400', columns: 'id, category, description, amount, property_id, date, created_at' },
  { key: 'owners',     table: 'owner',      icon: <UserCircle className="w-5 h-5" />, color: 'text-orange-400', columns: 'id, "firstName", "lastName", email, phone, created_at' },
  { key: 'contracts',  table: 'contracts',  icon: <ScrollText className="w-5 h-5" />, color: 'text-pink-400', columns: 'id, title, status, guest_name, guest_email, signed_at, sent_at, created_at' },
  { key: 'staff',      table: 'staff_members', icon: <HardHat className="w-5 h-5" />, color: 'text-cyan-400', columns: 'id, name, email, phone, contract_type, salary, created_at' },
];

type SectionStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SectionData {
  status: SectionStatus;
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

// ─── CSV parser ──────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if (line[i] === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += line[i];
    }
    values.push(current.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// Column mappings: Notion export headers → Supabase columns
const IMPORT_MAPPINGS: Record<string, Record<string, string>> = {
  properties: { 'Nombre': 'name', 'Name': 'name', 'Estado': 'status', 'Status': 'status', 'Precio': 'price_per_night', 'Price': 'price_per_night', 'Dirección': 'address', 'Address': 'address', 'Ciudad': 'city', 'City': 'city' },
  bookings: { 'Huésped': 'guest_name', 'Guest': 'guest_name', 'Email': 'guest_email', 'Teléfono': 'guest_phone', 'Phone': 'guest_phone', 'Entrada': 'start_date', 'Check-in': 'start_date', 'Salida': 'end_date', 'Check-out': 'end_date', 'Total': 'total_price', 'Price': 'total_price', 'Plataforma': 'platform', 'Platform': 'platform', 'Estado': 'status', 'Status': 'status' },
  contacts: { 'Nombre': 'name', 'Name': 'name', 'Email': 'email', 'Teléfono': 'phone', 'Phone': 'phone', 'Empresa': 'company', 'Company': 'company', 'Notas': 'notes', 'Notes': 'notes' },
  owners: { 'Nombre': 'firstName', 'Name': 'firstName', 'Apellido': 'lastName', 'Last Name': 'lastName', 'Email': 'email', 'Teléfono': 'phone', 'Phone': 'phone' },
  expenses: { 'Categoría': 'category', 'Category': 'category', 'Descripción': 'description', 'Description': 'description', 'Importe': 'amount', 'Amount': 'amount', 'Fecha': 'date', 'Date': 'date' },
  staff: { 'Nombre': 'full_name', 'Name': 'full_name', 'Email': 'email', 'Teléfono': 'phone', 'Phone': 'phone', 'Contrato': 'contract_type', 'Contract': 'contract_type', 'Salario': 'salary', 'Salary': 'salary' },
};

// Valid columns per table — strip extra CSV columns before insert
const VALID_COLUMNS: Record<string, string[]> = {
  properties: ['name', 'status', 'price_per_night', 'address', 'city', 'country', 'description', 'property_type', 'bedrooms', 'bathrooms', 'max_guests'],
  bookings: ['guest_name', 'guest_email', 'guest_phone', 'start_date', 'end_date', 'total_price', 'platform', 'status', 'notes'],
  contacts: ['name', 'email', 'phone', 'company', 'notes'],
  owner: ['firstName', 'lastName', 'email', 'phone'],
  expenses: ['category', 'description', 'amount', 'date', 'notes'],
  staff_members: ['full_name', 'email', 'phone', 'contract_type', 'salary', 'status', 'notes'],
  contracts: ['title', 'status', 'guest_name', 'guest_email'],
};

interface ImportState {
  sectionKey: string;
  table: string;
  rows: Record<string, string>[];
  importing: boolean;
  result: { inserted: number; errors: number } | null;
}

export default function DataBackup() {
  const { t } = useTranslation();
  const [sections, setSections] = useState<Record<string, SectionData>>(
    Object.fromEntries(SECTIONS.map(s => [s.key, { status: 'idle', count: 0, data: [] }]))
  );
  const [generatingZip, setGeneratingZip] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [importState, setImportState] = useState<ImportState | null>(null);

  useEffect(() => { loadCounts(); }, []);

  async function loadCounts() {
    setSections(prev => Object.fromEntries(
      Object.entries(prev).map(([k, v]) => [k, { ...v, status: 'loading' as SectionStatus }])
    ));

    await Promise.all(SECTIONS.map(async section => {
      try {
        const { count, error } = await supabase
          .from(section.table)
          .select('*', { count: 'exact', head: true });

        setSections(prev => ({
          ...prev,
          [section.key]: {
            ...prev[section.key],
            status: error ? 'error' : 'ready',
            count: count ?? 0,
          },
        }));
      } catch {
        setSections(prev => ({
          ...prev,
          [section.key]: { ...prev[section.key], status: 'error', count: 0 },
        }));
      }
    }));
  }

  async function fetchSectionData(section: Section): Promise<Record<string, unknown>[]> {
    const query = supabase.from(section.table).select(section.columns || '*');
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Record<string, unknown>[]) || [];
  }

  async function exportSectionCsv(section: Section) {
    setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'loading' } }));
    try {
      const data = await fetchSectionData(section);
      const csv = toCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triadak-${section.key}-${today()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'ready', count: data.length, data } }));
    } catch {
      setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'error' } }));
    }
  }

  async function exportSectionJson(section: Section) {
    setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'loading' } }));
    try {
      const data = await fetchSectionData(section);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triadak-${section.key}-${today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'ready', count: data.length, data } }));
    } catch {
      setSections(prev => ({ ...prev, [section.key]: { ...prev[section.key], status: 'error' } }));
    }
  }

  async function exportFullZip() {
    setGeneratingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('triadak-backup-' + today())!;

      for (const section of SECTIONS) {
        try {
          const data = await fetchSectionData(section);
          folder.file(`${section.key}.csv`, toCSV(data));
          folder.file(`${section.key}.json`, JSON.stringify(data, null, 2));
        } catch {
          folder.file(`${section.key}-error.txt`, 'Failed to export this section');
        }
      }

      // Add metadata
      folder.file('README.txt', [
        'TRIADAK Data Export',
        `Generated: ${new Date().toISOString()}`,
        '',
        'Files included:',
        ...SECTIONS.map(s => `  - ${s.key}.csv / ${s.key}.json`),
        '',
        'This export contains all your Triadak data.',
        'For support: support@triadak.io',
      ].join('\n'));

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triadak-full-backup-${today()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastBackup(now);
    } finally {
      setGeneratingZip(false);
    }
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function handleImportFile(section: Section, file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const mapping = IMPORT_MAPPINGS[section.key] || {};
      // Auto-map columns: if header matches a mapping key, rename it
      const mappedRows = rows.map(row => {
        const mapped: Record<string, string> = {};
        Object.entries(row).forEach(([k, v]) => {
          const target = mapping[k] || k;
          mapped[target] = v;
        });
        return mapped;
      });
      setImportState({ sectionKey: section.key, table: section.table, rows: mappedRows, importing: false, result: null });
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!importState) return;
    setImportState(prev => prev ? { ...prev, importing: true } : null);
    let inserted = 0;
    let errors = 0;

    try {
      const validCols = VALID_COLUMNS[importState.table] || null;
      // Strip unknown columns and empty values
      const cleanRows = importState.rows.map(row => {
        const clean: Record<string, string> = {};
        Object.entries(row).forEach(([k, v]) => {
          if (v === '' || v === undefined) return;
          if (!validCols || validCols.includes(k)) clean[k] = v;
        });
        return clean;
      }).filter(row => Object.keys(row).length > 0);

      // Insert in batches of 20
      const batches = [];
      for (let i = 0; i < cleanRows.length; i += 20) batches.push(cleanRows.slice(i, i + 20));

      for (const batch of batches) {
        const { error } = await supabase.from(importState.table).insert(batch);
        if (error) {
          console.error('Import batch error:', error.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }
    } catch (err) {
      console.error('Import error:', err);
      errors = importState.rows.length;
    }

    setImportState(prev => prev ? { ...prev, importing: false, result: { inserted, errors } } : null);
    loadCounts();
  }

  const totalRecords = Object.values(sections).reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-400" />
            {t('backup.title')}
          </h1>
          <p className="text-slate-400 mt-1">{t('backup.subtitle')}</p>
        </div>
        <button onClick={loadCounts} className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Full ZIP export card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-900/30 to-violet-900/20 border border-blue-700/40 rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30">
            <Archive className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{t('backup.exportAll')}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{t('backup.exportAllDesc')}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span>{t('backup.zipContains')}</span>
              {SECTIONS.map(s => (
                <span key={s.key} className="text-slate-400">{t(`backup.sections.${s.key}`)}</span>
              ))}
            </div>
            {lastBackup && (
              <p className="text-xs text-slate-600 mt-1">
                {t('backup.lastExport')}: {new Date(lastBackup).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-white">{totalRecords.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{t('backup.records')}</p>
          </div>
          <button
            onClick={exportFullZip}
            disabled={generatingZip}
            className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingZip
              ? <><RefreshCw className="w-4 h-4 animate-spin" />{t('backup.generating')}</>
              : <><Download className="w-4 h-4" />{t('backup.exportAll')}</>
            }
          </button>
        </div>
      </motion.div>

      {/* Privacy note */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-400 text-sm">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        {t('backup.info')}
      </div>

      {/* Individual sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((section, i) => {
          const s = sections[section.key];
          return (
            <motion.div key={section.key}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4"
            >
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-slate-700/60 ${section.color}`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{t(`backup.sections.${section.key}`)}</p>
                  <p className="text-slate-500 text-xs truncate">{t(`backup.sectionsDesc.${section.key}`)}</p>
                </div>
              </div>

              {/* Count + status */}
              <div className="flex items-center justify-between">
                <div>
                  {s.status === 'loading' ? (
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {t('backup.loading')}
                    </div>
                  ) : s.status === 'error' ? (
                    <div className="flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t('backup.error')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white font-bold">{s.count.toLocaleString()}</span>
                      <span className="text-slate-500 text-sm">{t('backup.records')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => exportSectionCsv(section)}
                  disabled={s.status === 'loading' || s.status === 'error'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t('backup.exportCsv')}
                </button>
                <button
                  onClick={() => exportSectionJson(section)}
                  disabled={s.status === 'loading' || s.status === 'error'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  {t('backup.exportJson')}
                </button>
              </div>

              {/* Import button */}
              <label className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Importar CSV
                <input type="file" accept=".csv" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(section, file);
                  e.target.value = '';
                }} />
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Import Modal ─────────────────────────── */}
      {importState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                  <Upload className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Importar CSV — {importState.sectionKey}</h2>
                  <p className="text-xs text-slate-400">{importState.rows.length} filas detectadas</p>
                </div>
              </div>
              <button onClick={() => setImportState(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Result */}
            {importState.result ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-400" />
                <div>
                  <p className="text-xl font-bold text-white">{importState.result.inserted} registros importados</p>
                  {importState.result.errors > 0 && (
                    <p className="text-sm text-red-400 mt-1">{importState.result.errors} filas con error (duplicados o datos inválidos)</p>
                  )}
                </div>
                <button onClick={() => setImportState(null)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* Preview */}
                <div className="flex-1 overflow-auto p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-white">Vista previa (primeras 5 filas)</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white/5 text-slate-400 uppercase tracking-wider">
                        <tr>
                          {Object.keys(importState.rows[0] || {}).map(col => (
                            <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {importState.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[160px] truncate">{val || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importState.rows.length > 5 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">...y {importState.rows.length - 5} filas más</p>
                  )}
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                    ⚠️ Los registros existentes no se sobrescribirán. Solo se añadirán filas nuevas.
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <button onClick={() => setImportState(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button onClick={confirmImport} disabled={importState.importing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors">
                    {importState.importing
                      ? <><RefreshCw className="h-4 w-4 animate-spin" /> Importando...</>
                      : <><Upload className="h-4 w-4" /> Confirmar importación ({importState.rows.length} filas)</>
                    }
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
