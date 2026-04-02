import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMIN_ID = '576bc3af-9081-4248-8985-959f50590340';

const EMPTY_ROW = {
  ticker: '',
  company_id: '',
  short_name: '',
  logo: '📊',
  sector: '',
  dividend_per_share: '',
  dividend_yield: '',
  ex_date: '',
  payment_date: '',
  status: 'estimated',
  year: new Date().getFullYear(),
  note: '',
};

export default function AdminDividendsPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const isAdmin = user?.id === ADMIN_ID;

  useEffect(() => {
    supabase
      .from('dividends')
      .select('*')
      .order('ex_date', { ascending: true })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  if (!user || !isAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p className="text-surface-500 text-lg">
          {lang === 'pl' ? 'Brak dostępu. Tylko administrator może zarządzać dywidendami.' : 'Access denied. Admin only.'}
        </p>
      </div>
    );
  }

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW, _isNew: true }]);
  }

  async function deleteRow(index) {
    const row = rows[index];
    if (row.id) {
      await supabase.from('dividends').delete().eq('id', row.id);
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
    setMessage({ type: 'ok', text: lang === 'pl' ? 'Usunięto' : 'Deleted' });
    setTimeout(() => setMessage(null), 2000);
  }

  async function saveAll() {
    setSaving(true);
    setMessage(null);

    for (const row of rows) {
      const payload = {
        ticker: row.ticker,
        company_id: row.company_id,
        short_name: row.short_name,
        logo: row.logo,
        sector: row.sector,
        dividend_per_share: Number(row.dividend_per_share),
        dividend_yield: Number(row.dividend_yield),
        ex_date: row.ex_date,
        payment_date: row.payment_date || null,
        status: row.status,
        year: Number(row.year),
        note: row.note || null,
        updated_at: new Date().toISOString(),
      };

      if (row._isNew) {
        const { data } = await supabase.from('dividends').insert(payload).select().single();
        if (data) row.id = data.id;
        delete row._isNew;
      } else if (row.id) {
        await supabase.from('dividends').update(payload).eq('id', row.id);
      }
    }

    setSaving(false);
    setMessage({ type: 'ok', text: lang === 'pl' ? 'Zapisano!' : 'Saved!' });
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {lang === 'pl' ? 'Panel dywidend' : 'Dividends Admin'}
        </h1>
        <div className="flex items-center gap-2">
          {message && (
            <span className={`text-sm font-medium ${message.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </span>
          )}
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                     border border-surface-300 dark:border-surface-700
                     hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {lang === 'pl' ? 'Dodaj' : 'Add'}
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium
                     bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60
                     transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {lang === 'pl' ? 'Zapisz wszystko' : 'Save all'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-200/50 dark:border-surface-800/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-100/60 dark:bg-surface-900/60 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide">
              <th className="px-3 py-2.5">Ticker</th>
              <th className="px-3 py-2.5">ID</th>
              <th className="px-3 py-2.5">{lang === 'pl' ? 'Nazwa' : 'Name'}</th>
              <th className="px-3 py-2.5">Logo</th>
              <th className="px-3 py-2.5">{lang === 'pl' ? 'Sektor' : 'Sector'}</th>
              <th className="px-3 py-2.5">PLN/akcję</th>
              <th className="px-3 py-2.5">Yield %</th>
              <th className="px-3 py-2.5">Ex-date</th>
              <th className="px-3 py-2.5">{lang === 'pl' ? 'Wypłata' : 'Payment'}</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">{lang === 'pl' ? 'Rok' : 'Year'}</th>
              <th className="px-3 py-2.5">{lang === 'pl' ? 'Notatka' : 'Note'}</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id || `new-${i}`}
                className={`border-t border-surface-200/30 dark:border-surface-800/30 ${
                  row._isNew ? 'bg-brand-500/5' : ''
                }`}
              >
                <td className="px-2 py-1.5">
                  <input value={row.ticker} onChange={(e) => updateRow(i, 'ticker', e.target.value)}
                    className="w-14 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.company_id} onChange={(e) => updateRow(i, 'company_id', e.target.value)}
                    className="w-20 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.short_name} onChange={(e) => updateRow(i, 'short_name', e.target.value)}
                    className="w-24 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.logo} onChange={(e) => updateRow(i, 'logo', e.target.value)}
                    className="w-10 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs text-center" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.sector} onChange={(e) => updateRow(i, 'sector', e.target.value)}
                    className="w-20 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" step="0.01" value={row.dividend_per_share} onChange={(e) => updateRow(i, 'dividend_per_share', e.target.value)}
                    className="w-20 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs font-mono" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" step="0.1" value={row.dividend_yield} onChange={(e) => updateRow(i, 'dividend_yield', e.target.value)}
                    className="w-14 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs font-mono" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="date" value={row.ex_date} onChange={(e) => updateRow(i, 'ex_date', e.target.value)}
                    className="bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="date" value={row.payment_date || ''} onChange={(e) => updateRow(i, 'payment_date', e.target.value)}
                    className="bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <select value={row.status} onChange={(e) => updateRow(i, 'status', e.target.value)}
                    className="bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs">
                    <option value="confirmed">Confirmed</option>
                    <option value="estimated">Estimated</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" value={row.year} onChange={(e) => updateRow(i, 'year', e.target.value)}
                    className="w-16 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.note || ''} onChange={(e) => updateRow(i, 'note', e.target.value)}
                    className="w-32 bg-transparent border border-surface-200/50 dark:border-surface-800/50 rounded px-1.5 py-1 text-xs" />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => deleteRow(i)}
                    className="p-1 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
