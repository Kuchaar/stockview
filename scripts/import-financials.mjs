#!/usr/bin/env node
// Importuje sprawozdania finansowe z Yahoo do tabeli `financials` w Supabase (zadanie D4).
//
// Dane bierze z własnego endpointu /api/financials — ten sam kod, który obsługuje stronę,
// więc crumb, cookie i cache Yahoo są już załatwione i nie ma dwóch implementacji.
// Wierszy z verified = true nie rusza: to są poprawki wprowadzone ręcznie.
//
// Użycie:
//   npm run import-financials -- --dry-run     (nic nie zapisuje, tylko pokazuje)
//   npm run import-financials                  (zapisuje do bazy)
//   API_BASE=http://localhost:8788 npm run import-financials -- --dry-run
//
// Wymaga w środowisku (albo w .env.local, ładowanym automatycznie):
//   SUPABASE_URL                 — https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    — klucz service_role; anon odbije się od RLS

import { setTimeout as sleep } from 'timers/promises';
import { createClient } from '@supabase/supabase-js';
import { wig20Companies } from '../src/data/wig20.js';
import { normalizeFinancials, YAHOO_ZERO_MEANS_MISSING } from '../src/data/financialSchema.js';

const DRY_RUN = process.argv.includes('--dry-run');
// Każda spółka to osobne zapytanie do /api/financials, a ono idzie do Yahoo.
// Spółki lecą po kolei (pętla `for...of`), a między nimi jest krótka przerwa.
const DELAY_MS = 300;
const API_BASE = process.env.API_BASE || 'https://stockview.org';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Pola techniczne kanonicznego wiersza — do bazy trafia sama treść sprawozdania.
const META_FIELDS = ['date', 'period', 'currency'];

// Yahoo v10 wypełnia zerami pola, których nie podaje: bank z przychodem 29 mld
// dostaje costOfRevenue: 0, a spółka z zyskiem 595 mln — ebit: 0 (U6 w docs/DATA.md).
// Zero odrzucamy więc dokładnie w tych polach, co klient — lista jest jedna,
// YAHOO_ZERO_MEANS_MISSING w financialSchema.js. W pozostałych 0 to prawdziwa wartość:
// spółka bez długu ma totalDebt = 0 i tak ma to zostać zapisane.
function stripMeta(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (META_FIELDS.includes(k)) continue;
    if (v == null) continue;
    if (v === 0 && YAHOO_ZERO_MEANS_MISSING.has(k)) continue;
    out[k] = v;
  }
  return out;
}

/** Czy wiersz niesie jakiekolwiek dane poza datą i etykietą okresu. */
function hasContent(...parts) {
  return parts.some((p) => Object.keys(p).length > 0);
}

/**
 * Kanoniczne sprawozdania (osobne tablice dla income/balance/cashFlow)
 * → wiersze tabeli `financials`, sklejone po dacie końca okresu.
 */
function toRows(companyId, normalized, periodType) {
  const byDate = new Map();

  const collect = (rows, key) => {
    for (const row of rows || []) {
      if (!row.date) continue; // bez daty nie ma klucza naturalnego
      if (!byDate.has(row.date)) {
        byDate.set(row.date, { period_label: row.period, income: {}, balance: {}, cash_flow: {} });
      }
      const entry = byDate.get(row.date);
      entry[key] = stripMeta(row);
      entry.period_label ||= row.period;
      entry.currency ||= row.currency || null;
    }
  };

  collect(normalized.incomeStatement?.[periodType], 'income');
  collect(normalized.balanceSheet?.[periodType], 'balance');
  collect(normalized.cashFlow?.[periodType], 'cash_flow');

  const rows = [];
  for (const [date, entry] of byDate) {
    if (!entry.period_label) continue;
    if (!hasContent(entry.income, entry.balance, entry.cash_flow)) continue;
    rows.push({
      company_id: companyId,
      period_type: periodType,
      period_end: date,
      period_label: entry.period_label,
      income: entry.income,
      balance: entry.balance,
      cash_flow: entry.cash_flow,
      currency: entry.currency || 'PLN',
      source: 'yahoo',
    });
  }
  return rows;
}

async function fetchCompany(company) {
  const url = `${API_BASE}/api/financials?symbol=${encodeURIComponent(company.yahooSymbol)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.source === 'unavailable') throw new Error('Yahoo niedostępne (source: unavailable)');

  const normalized = normalizeFinancials(data, 'yahoo', {
    ticker: company.ticker,
    companyId: company.id,
  });
  return [
    ...toRows(company.id, normalized, 'annual'),
    ...toRows(company.id, normalized, 'quarterly'),
  ];
}

async function main() {
  if (!DRY_RUN && (!SUPABASE_URL || !SERVICE_KEY)) {
    console.error('Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Ustaw je w .env.local albo w sekretach repozytorium, ewentualnie użyj --dry-run.');
    process.exit(1);
  }

  const db = DRY_RUN || !SUPABASE_URL || !SERVICE_KEY
    ? null
    : createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Wiersze zweryfikowane ręcznie — importer ich nie dotyka.
  const protectedKeys = new Set();
  if (db) {
    const { data, error } = await db
      .from('financials')
      .select('company_id, period_type, period_end')
      .eq('verified', true);
    if (error) throw new Error(`Nie udało się pobrać wierszy verified: ${error.message}`);
    for (const r of data) protectedKeys.add(`${r.company_id}|${r.period_type}|${r.period_end}`);
  }

  console.log(`Import z ${API_BASE} → ${DRY_RUN ? 'DRY RUN (bez zapisu)' : SUPABASE_URL}`);
  if (protectedKeys.size) console.log(`Chronionych wierszy (verified): ${protectedKeys.size}`);

  let zapisanych = 0;
  let pominietychVerified = 0;
  const bledy = [];

  let pierwsza = true;
  for (const company of wig20Companies) {
    if (!pierwsza) await sleep(DELAY_MS);
    pierwsza = false;
    try {
      const all = await fetchCompany(company);
      const rows = all.filter((r) => {
        const key = `${r.company_id}|${r.period_type}|${r.period_end}`;
        if (protectedKeys.has(key)) { pominietychVerified++; return false; }
        return true;
      });

      if (!rows.length) {
        console.log(`  ${company.ticker.padEnd(4)} — brak wierszy do zapisu`);
        continue;
      }

      if (db) {
        const { error } = await db
          .from('financials')
          .upsert(rows, { onConflict: 'company_id,period_type,period_end' });
        if (error) throw new Error(error.message);
      }

      zapisanych += rows.length;
      const roczne = rows.filter((r) => r.period_type === 'annual').length;
      const kwartalne = rows.length - roczne;
      console.log(`  ${company.ticker.padEnd(4)} — ${roczne} rocznych, ${kwartalne} kwartalnych`);
    } catch (err) {
      bledy.push(`${company.ticker}: ${err.message}`);
      console.log(`  ${company.ticker.padEnd(4)} — BŁĄD: ${err.message}`);
    }
  }

  console.log('');
  console.log(`Spółek: ${wig20Companies.length}, wierszy ${DRY_RUN ? 'do zapisu' : 'zapisanych'}: ${zapisanych}`);
  if (pominietychVerified) console.log(`Pominiętych jako verified: ${pominietychVerified}`);
  if (bledy.length) {
    console.log(`Błędy (${bledy.length}): ${bledy.join('; ')}`);
    if (bledy.length === wig20Companies.length) process.exit(1); // nic się nie udało
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
