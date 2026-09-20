#!/usr/bin/env node
// Eksportuje tabelę `financials` z Supabase do plików, które czyta strona (zadanie D5).
//
// Wynik: public/data/financials/{companyId}/data.json w formacie kanonicznym ('manual'),
// czyli dokładnie na poziom 2 z docs/DATA.md — useFinancials czyta go od początku
// i nie trzeba było zmieniać niczego w kliencie.
//
// Czyta przez klucz anon: tabela ma publiczną politykę select, więc do eksportu
// nie jest potrzebny żaden sekret.
//
// Użycie:
//   npm run export-financials
//   npm run export-financials -- --dry-run

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { wig20Companies } from '../src/data/wig20.js';

const DRY_RUN = process.argv.includes('--dry-run');
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data', 'financials');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Brak SUPABASE_URL lub SUPABASE_ANON_KEY (wystarczy klucz publiczny).');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

/** Wiersze bazy → kanoniczny kształt z financialSchema.js ('manual'). */
function toCanonical(company, rows) {
  const empty = () => ({ annual: [], quarterly: [] });
  const out = { incomeStatement: empty(), balanceSheet: empty(), cashFlow: empty() };

  // najnowszy okres pierwszy — tak samo jak oddaje Yahoo
  const sorted = [...rows].sort((a, b) => b.period_end.localeCompare(a.period_end));

  for (const row of sorted) {
    const meta = { date: row.period_end, period: row.period_label };
    const blocks = [
      ['incomeStatement', row.income],
      ['balanceSheet', row.balance],
      ['cashFlow', row.cash_flow],
    ];
    for (const [key, payload] of blocks) {
      if (!payload || Object.keys(payload).length === 0) continue;
      out[key][row.period_type].push({ ...meta, ...payload });
    }
  }

  const lastUpdated = rows
    .map((r) => (r.updated_at || '').slice(0, 10))
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    ticker: company.ticker,
    sector: company.sector,
    lastUpdated,
    // Skąd naprawdę pochodzą liczby — 'manual' jest poziomem, nie źródłem.
    sources: [...new Set(rows.map((r) => r.source))].sort(),
    ...out,
    keyStats: null,
  };
}

async function main() {
  const { data, error } = await db
    .from('financials')
    .select('company_id, period_type, period_end, period_label, income, balance, cash_flow, source, updated_at')
    .order('period_end', { ascending: false });

  if (error) {
    console.error(`Nie udało się odczytać tabeli financials: ${error.message}`);
    process.exit(1);
  }

  const byCompany = new Map();
  for (const row of data) {
    if (!byCompany.has(row.company_id)) byCompany.set(row.company_id, []);
    byCompany.get(row.company_id).push(row);
  }

  console.log(`Wierszy w bazie: ${data.length}, spółek: ${byCompany.size}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  let zapisanych = 0;
  let pustych = 0;

  for (const company of wig20Companies) {
    const rows = byCompany.get(company.id) || [];
    const target = join(OUT_DIR, company.id, 'data.json');

    if (!rows.length) {
      // Bez danych plik nie ma prawa istnieć — inaczej przesłoniłby poziom 3.
      if (!DRY_RUN && existsSync(target)) rmSync(target);
      pustych++;
      continue;
    }

    const payload = toCanonical(company, rows);
    if (!DRY_RUN) {
      mkdirSync(join(OUT_DIR, company.id), { recursive: true });
      writeFileSync(target, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    }
    zapisanych++;
    const ile = (blok, okres) => payload[blok][okres].length;
    console.log(
      `  ${company.ticker.padEnd(4)} — rachunek ${ile('incomeStatement', 'annual')}R/${ile('incomeStatement', 'quarterly')}K, ` +
      `bilans ${ile('balanceSheet', 'annual')}R/${ile('balanceSheet', 'quarterly')}K, ` +
      `przepływy ${ile('cashFlow', 'annual')}R/${ile('cashFlow', 'quarterly')}K`
    );
  }

  console.log('');
  console.log(`Plików ${DRY_RUN ? 'do zapisu' : 'zapisanych'}: ${zapisanych}${pustych ? `, spółek bez danych: ${pustych}` : ''}`);
  if (!zapisanych) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
