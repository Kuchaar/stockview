-- StockView — tabela z wynikami finansowymi spółek (zadanie D3, uzasadnienie w docs/DATA.md).
-- Źródło prawdy dla sprawozdań: importer z Yahoo dopisuje wiersze, człowiek je poprawia,
-- a bot eksportuje całość do public/data/financials/{company_id}/data.json (poziom 2).

create table if not exists public.financials (
  id            bigint generated always as identity primary key,
  company_id    text not null,                     -- 'pkobp', zgodne z src/data/wig20.js
  period_type   text not null check (period_type in ('annual', 'quarterly')),
  period_end    date not null,                     -- 2025-12-31
  period_label  text not null,                     -- 'FY2025' albo 'Q4 2025'
  income        jsonb not null default '{}'::jsonb,
  balance       jsonb not null default '{}'::jsonb,
  cash_flow     jsonb not null default '{}'::jsonb,
  currency      text not null default 'PLN',
  source        text not null check (source in ('yahoo', 'manual', 'eodhd')),
  verified      boolean not null default false,    -- true = sprawdzone ręcznie, importer nie rusza
  updated_at    timestamptz not null default now(),
  unique (company_id, period_type, period_end)
);

comment on table public.financials is
  'Sprawozdania finansowe spółek WIG20. Klucz naturalny: (company_id, period_type, period_end) — daje upsert bez duplikatów.';
comment on column public.financials.verified is
  'true = wiersz sprawdzony przez człowieka; importer go nie nadpisuje.';

-- Odczyt zawsze leci po spółce i po okresie malejąco (najnowszy rocznik na górze).
create index if not exists financials_company_period_idx
  on public.financials (company_id, period_type, period_end desc);

-- updated_at ustawiane automatycznie przy każdej zmianie
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists financials_touch_updated_at on public.financials;
create trigger financials_touch_updated_at
  before update on public.financials
  for each row execute function public.touch_updated_at();

-- RLS: czytać może każdy (te dane i tak lądują w statycznym pliku),
-- pisać tylko konto administratora — ten sam identyfikator co ADMIN_ID
-- w src/pages/AdminDividendsPage.jsx.
alter table public.financials enable row level security;

drop policy if exists "financials_public_read" on public.financials;
create policy "financials_public_read"
  on public.financials for select
  to anon, authenticated
  using (true);

drop policy if exists "financials_admin_write" on public.financials;
create policy "financials_admin_write"
  on public.financials for all
  to authenticated
  using (auth.uid() = '576bc3af-9081-4248-8985-959f50590340'::uuid)
  with check (auth.uid() = '576bc3af-9081-4248-8985-959f50590340'::uuid);
