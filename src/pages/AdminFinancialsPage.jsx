import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';
import { wig20Companies } from '../data/wig20';
import { CANONICAL_FIELDS, isBankSector, derivePeriod } from '../data/financialSchema';
import { Save, Loader2, ShieldAlert, Plus, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMIN_ID = '576bc3af-9081-4248-8985-959f50590340';

const BLOCKS = [
  { key: 'income', column: 'income' },
  { key: 'balance', column: 'balance' },
  { key: 'cashFlow', column: 'cash_flow' },
];

/**
 * Liczba wpisana po ludzku → liczba dla bazy.
 * Przyjmuje „12,5", „1 234" i „1 234,5" (także ze spacją niełamliwą, którą wkleja Excel).
 * Zwraca null dla pustego pola i NaN dla tekstu, który liczbą nie jest.
 */
function parseNumber(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  return Number(cleaned);
}

/** Czy w polu jest coś, czego nie da się odczytać jako liczby. */
function isInvalid(raw) {
  const n = parseNumber(raw);
  return n != null && Number.isNaN(n);
}

/** Skrócony podgląd kwoty: 29466000000 → „29,47 mld". */
function preview(raw, lang) {
  const n = parseNumber(raw);
  if (n == null || Number.isNaN(n)) return null;
  const abs = Math.abs(n);
  const unit = abs >= 1e9 ? ['mld', 'B', 1e9] : abs >= 1e6 ? ['mln', 'M', 1e6] : null;
  if (!unit) return null;
  const val = (n / unit[2]).toFixed(2);
  return lang === 'pl' ? `${val.replace('.', ',')} ${unit[0]}` : `${val}${unit[1]}`;
}

function emptyValues() {
  const out = {};
  for (const { key } of BLOCKS) out[key] = {};
  return out;
}

export default function AdminFinancialsPage() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [companyId, setCompanyId] = useState(wig20Companies[0].id);
  const [periodType, setPeriodType] = useState('annual');
  const [rows, setRows] = useState([]);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [verified, setVerified] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const isAdmin = user?.id === ADMIN_ID;
  const company = wig20Companies.find((c) => c.id === companyId);
  const showBankFields = isBankSector(company?.sector);

  const loadRows = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    const { data } = await supabase
      .from('financials')
      .select('*')
      .eq('company_id', companyId)
      .eq('period_type', periodType)
      .order('period_end', { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, [companyId, periodType, isAdmin]);

  useEffect(() => { loadRows(); }, [loadRows]);

  // Zmiana spółki albo typu okresu zaczyna edycję od zera.
  useEffect(() => { setSelectedEnd(null); setValues(emptyValues()); }, [companyId, periodType]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.period_end === selectedEnd) || null,
    [rows, selectedEnd],
  );

  const hasErrors = useMemo(
    () => BLOCKS.some(({ key }) => Object.values(values[key]).some(isInvalid)),
    [values],
  );

  function pickPeriod(row) {
    setSelectedEnd(row.period_end);
    const asText = (obj) => Object.fromEntries(
      Object.entries(obj || {}).map(([k, v]) => [k, String(v)]),
    );
    setValues({
      income: asText(row.income),
      balance: asText(row.balance),
      cashFlow: asText(row.cash_flow),
    });
    setVerified(row.verified);
    setMessage(null);
  }

  function addPeriod() {
    const today = new Date().toISOString().slice(0, 10);
    setSelectedEnd(today);
    setValues(emptyValues());
    setVerified(true);
    setMessage(null);
  }

  // W stanie trzymamy to, co użytkownik wpisał — inaczej „12," znikałoby w trakcie pisania.
  // Konwersja na liczby dzieje się przy zapisie.
  function setField(block, field, raw) {
    setValues((prev) => {
      const next = { ...prev, [block]: { ...prev[block] } };
      if (raw === '') delete next[block][field];
      else next[block][field] = raw;
      return next;
    });
  }

  async function save() {
    if (!selectedEnd || hasErrors) return;
    setSaving(true);
    setMessage(null);

    // Puste pola nie trafiają do bazy — null znaczy „brak danych", nie „zero".
    const clean = (obj) => Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, parseNumber(v)])
        .filter(([, v]) => v != null && !Number.isNaN(v)),
    );

    const payload = {
      company_id: companyId,
      period_type: periodType,
      period_end: selectedEnd,
      period_label: selectedRow?.period_label || derivePeriod(selectedEnd, periodType === 'quarterly'),
      income: clean(values.income),
      balance: clean(values.balance),
      cash_flow: clean(values.cashFlow),
      source: 'manual',
      verified,
    };

    const { error } = await supabase
      .from('financials')
      .upsert(payload, { onConflict: 'company_id,period_type,period_end' });

    setSaving(false);
    setMessage(error ? { type: 'err', text: `${t('admin.saveError')}: ${error.message}` }
                     : { type: 'ok', text: t('admin.saved') });
    if (!error) loadRows();
  }

  const head = <Helmet><title>{t('seo.adminFinancialsTitle')}</title></Helmet>;

  if (!supabase) {
    return <p className="text-center py-20 text-surface-500">{t('admin.noSupabase')}</p>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p className="text-surface-500 text-lg">{t('admin.noAccess')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {head}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.financialsTitle')}</h1>
        {message && (
          <span className={`text-sm font-medium ${message.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
            {message.text}
          </span>
        )}
      </div>

      {/* Wybór spółki i typu okresu */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-surface-600 dark:text-surface-400">
            {t('admin.company')}
          </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="bg-transparent border border-surface-300 dark:border-surface-700 rounded-lg px-3 py-1.5 text-sm"
          >
            {wig20Companies.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-surface-900">
                {c.ticker} — {c.shortName}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            {['annual', 'quarterly'].map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`tab-button ${periodType === type ? 'active' : ''}`}
              >
                {t(`admin.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Lista okresów */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-surface-500 mr-1">
            {t('admin.periods')}
          </span>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
          ) : rows.length === 0 ? (
            <span className="text-sm text-surface-500">{t('admin.noPeriods')}</span>
          ) : (
            rows.map((row) => (
              <button
                key={row.period_end}
                onClick={() => pickPeriod(row)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                  ${selectedEnd === row.period_end
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-900'}`}
              >
                {row.period_label}
                {row.verified && <BadgeCheck className="w-3.5 h-3.5" />}
              </button>
            ))
          )}
          <button
            onClick={addPeriod}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                       border border-dashed border-surface-300 dark:border-surface-700
                       hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('admin.newPeriod')}
          </button>
        </div>
      </div>

      {!selectedEnd ? (
        <p className="text-center py-12 text-surface-500">{t('admin.selectPeriod')}</p>
      ) : (
        <>
          {/* Metadane okresu */}
          <div className="card p-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-surface-600 dark:text-surface-400">{t('admin.periodEnd')}</span>
              <input
                type="date"
                value={selectedEnd}
                onChange={(e) => setSelectedEnd(e.target.value)}
                disabled={!!selectedRow}
                className="bg-transparent border border-surface-300 dark:border-surface-700 rounded-lg px-2 py-1 disabled:opacity-60"
              />
            </label>
            <span className="text-surface-500">
              {derivePeriod(selectedEnd, periodType === 'quarterly')}
            </span>
            {selectedRow && (
              <>
                <span className="text-surface-500">
                  {t('admin.source')}: <span className="font-mono">{selectedRow.source}</span>
                </span>
                <span className="text-surface-500">
                  {t('admin.updatedAt')}: {selectedRow.updated_at?.slice(0, 10)}
                </span>
              </>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="accent-brand-600"
              />
              <span className="font-medium">{t('admin.verified')}</span>
              <span className="text-xs text-surface-500">{t('admin.verifiedHint')}</span>
            </label>
          </div>

          <p className="text-xs text-surface-500">{t('admin.valuesInPln')}</p>

          {/* Trzy sprawozdania */}
          <div className="grid gap-4 lg:grid-cols-3">
            {BLOCKS.map(({ key }) => {
              const fields = [
                ...CANONICAL_FIELDS[key].common,
                ...(showBankFields ? CANONICAL_FIELDS[key].bank : []),
              ];
              return (
                <div key={key} className="card p-4 space-y-3">
                  <h2 className="section-title">{t(`admin.${key}`)}</h2>
                  {fields.map((field) => {
                    const raw = values[key][field] ?? '';
                    const bledne = isInvalid(raw);
                    const hint = preview(raw, lang);
                    return (
                      <label key={field} className="block">
                        <span className="metric-label">{t(`admin.fields.${field}`)}</span>
                        <span className="flex items-baseline gap-2">
                          {/* type="text": przy type="number" przeglądarka oddaje pusty
                              string dla „12,5" i nie da się tego poprawić. */}
                          <input
                            type="text"
                            inputMode="decimal"
                            value={raw}
                            onChange={(e) => setField(key, field, e.target.value)}
                            aria-invalid={bledne}
                            className={`w-full bg-transparent border rounded-lg px-2 py-1 text-sm font-mono tabular-nums
                                       focus:outline-none ${
                                         bledne
                                           ? 'border-red-500 dark:border-red-400 focus:border-red-500'
                                           : 'border-surface-200/70 dark:border-surface-800/70 focus:border-brand-500'
                                       }`}
                          />
                          {hint && (
                            <span className="text-xs text-surface-400 whitespace-nowrap">{hint}</span>
                          )}
                        </span>
                        {bledne && (
                          <span className="block text-xs text-red-500 dark:text-red-400 mt-0.5">
                            {t('admin.invalidNumber')}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs ${hasErrors ? 'text-red-500 dark:text-red-400' : 'text-surface-500'}`}>
              {hasErrors ? t('admin.fixErrors') : t('admin.exportHint')}
            </p>
            <button
              onClick={save}
              disabled={saving || hasErrors}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
