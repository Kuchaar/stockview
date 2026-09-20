# Prompt 2.4 — Wskaźniki analizy technicznej na wykresie SVG

## Kontekst

StockView — React 18 + Vite + Tailwind CSS (class-based dark mode `.dark`).

Wykres SVG zbudowany w prompcie 2.3: `src/components/StockChart.jsx` (330 linii). Rysuje OHLCV z `useHistoricalPrices(ticker)`. Layout SVG:
- viewBox `0 0 800 450`
- Wykres cenowy: x=60..790, y=10..330 (stałe: `CHART_L=60, CHART_R=790, CHART_T=10, CHART_B=330`)
- Wolumen: y=350..430 (`VOL_T=350, VOL_B=430`)
- Oś X labels: y=440
- Tryby: `line` / `candle`, zakresy: 1M–MAX
- State: `mode`, `rangeKey`, `hover`
- Dane po filtrowaniu: `const data = useMemo(() => filterByRange(allData, rangeKey), [allData, rangeKey])`
- Skalowanie: `priceToY(price)`, `volToH(volume)` — callbacks z useMemo

Tłumaczenia: `t('klucz.podklucz')`, lang = `'pl'` | `'en'`.
Motyw: `dark` z `useTheme()`.

## Zadania

### A. Nowy plik: `src/utils/technicalIndicators.js`

Czyste funkcje obliczeniowe, BEZ zależności od React. Każda przyjmuje tablicę danych OHLCV i parametry, zwraca tablicę wartości (tej samej długości co input, z `null` na początku gdy brak wystarczających danych).

```js
/**
 * @param {number[]} values - tablica close prices
 * @param {number} period - długość okna
 * @returns {(number|null)[]} - SMA dla każdego indeksu (null gdy i < period-1)
 */
export function calcSMA(values, period)

/**
 * EMA z mnożnikiem k = 2/(period+1)
 * Pierwszy EMA = SMA z pierwszych `period` wartości
 * @returns {(number|null)[]}
 */
export function calcEMA(values, period)

/**
 * RSI = 100 - 100/(1 + avgGain/avgLoss)
 * Klasyczny Wilder smoothing (nie SMA).
 * Pierwszy RSI po `period` zmianach (domyślnie period=14).
 * @param {number[]} closes
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function calcRSI(closes, period = 14)

/**
 * MACD:
 * - macdLine = EMA(closes, fastPeriod) - EMA(closes, slowPeriod)
 * - signalLine = EMA(macdLine, signalPeriod)  (ignoruj null-e na początku)
 * - histogram = macdLine - signalLine
 * Domyślnie: fast=12, slow=26, signal=9
 * @returns {{ macd: (number|null)[], signal: (number|null)[], histogram: (number|null)[] }}
 */
export function calcMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9)

/**
 * Bollinger Bands:
 * - middle = SMA(closes, period)
 * - upper = middle + multiplier * stdDev(closes, period)
 * - lower = middle - multiplier * stdDev(closes, period)
 * Domyślnie: period=20, multiplier=2
 * @returns {{ upper: (number|null)[], middle: (number|null)[], lower: (number|null)[] }}
 */
export function calcBollingerBands(closes, period = 20, multiplier = 2)
```

Zasady implementacji:
- Wilder smoothing dla RSI (NIE zwykła SMA): `avgGain = (prevAvgGain * (period-1) + currentGain) / period`
- EMA w MACD: oblicz od pierwszego non-null indeksu w tablicy (ważne dla `signalLine` który operuje na `macdLine` z null-ami na początku)
- stdDev w Bollinger: odchylenie standardowe populacyjne (dzielnik N, nie N-1)
- Zwracane tablice ZAWSZE mają tę samą długość co input

### B. Rozbuduj `src/components/StockChart.jsx`

#### B1. Nowy SVG layout (wskaźniki dodają panele pod wolumenem)

Zmień stałe viewBox dynamicznie w zależności od aktywnych oscylatorów:

```
Bazowy viewBox: 0 0 800 450 (bez oscylatorów — jak dotychczas)

Z RSI:    viewBox = 0 0 800 570  → panel RSI:  y=460..550, oś Y labels y=460..550
Z MACD:   viewBox = 0 0 800 570  → panel MACD: y=460..550
Z oboma:  viewBox = 0 0 800 690  → panel RSI:  y=460..550, panel MACD: y=570..660

Oś X labels: zawsze na dole (ostatnie 20px viewBox)
```

Zachowaj `width="100%"` i `preserveAspectRatio="xMidYMid meet"` — SVG skaluje się responsywnie.

#### B2. Stan wskaźników

Dodaj do komponentu state:
```js
const [indicators, setIndicators] = useState({
  sma20: false,
  sma50: false,
  ema12: false,
  ema26: false,
  bollinger: false,
  rsi: false,
  macd: false,
});
```

Funkcja toggle:
```js
const toggleIndicator = (key) => setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
```

#### B3. UI — panel wskaźników

Pod istniejącymi kontrolkami (mode toggle + range pills), dodaj trzeci rząd:

```
[ SMA 20 ] [ SMA 50 ] [ EMA 12 ] [ EMA 26 ] [ Bollinger ] | [ RSI ] [ MACD ]
```

- Separator wizualny `|` (cienka pionowa linia lub zwiększony gap) między overlays (rysowane na wykresie cenowym) a oscylatorami (osobne panele)
- Przycisk aktywny: tło w kolorze danego wskaźnika (patrz B4), tekst biały/ciemny
- Przycisk nieaktywny: standardowy szary styl jak range pills
- Na mobile (<640px): przyciski mogą się zawijać, scrollowalny kontener z `overflow-x-auto`

#### B4. Kolory wskaźników (stałe, czytelne na obu motywach)

```
SMA 20:     #f59e0b  (amber)
SMA 50:     #8b5cf6  (violet)
EMA 12:     #06b6d4  (cyan)
EMA 26:     #ec4899  (pink)
Bollinger:  middle=#f59e0b, upper/lower=#f59e0b opacity 0.4, fill between=#f59e0b opacity 0.08
RSI:        linia=#8b5cf6, strefy 30/70=#8b5cf6 opacity 0.1
MACD line:  #06b6d4
Signal:     #ec4899
Histogram+: #22c55e opacity 0.6
Histogram-: #ef4444 opacity 0.6
```

#### B5. Obliczenia (useMemo)

```js
const closes = useMemo(() => data.map(d => d.close), [data]);

const sma20Data = useMemo(() => indicators.sma20 ? calcSMA(closes, 20) : null, [closes, indicators.sma20]);
const sma50Data = useMemo(() => indicators.sma50 ? calcSMA(closes, 50) : null, [closes, indicators.sma50]);
const ema12Data = useMemo(() => indicators.ema12 ? calcEMA(closes, 12) : null, [closes, indicators.ema12]);
const ema26Data = useMemo(() => indicators.ema26 ? calcEMA(closes, 26) : null, [closes, indicators.ema26]);
const bollingerData = useMemo(() => indicators.bollinger ? calcBollingerBands(closes) : null, [closes, indicators.bollinger]);
const rsiData = useMemo(() => indicators.rsi ? calcRSI(closes) : null, [closes, indicators.rsi]);
const macdData = useMemo(() => indicators.macd ? calcMACD(closes) : null, [closes, indicators.macd]);
```

#### B6. Rysowanie overlays na wykresie cenowym

Overlays rysowane PO price chart, PRZED crosshair — w SVG kolejność warstw to kolejność w DOM.

Dla SMA/EMA: `<path>` z punktami `(x, priceToY(value))`, pomiń null-e (moveTo na pierwszym non-null, lineTo dalej).

Dla Bollinger Bands:
- Fill area (upper→lower): `<path>` z `fill="#f59e0b"` `fillOpacity="0.08"`, `stroke="none"`
- Middle line: `<path>` `stroke="#f59e0b"` `strokeWidth="1"`
- Upper + Lower: `<path>` `stroke="#f59e0b"` `strokeOpacity="0.4"` `strokeWidth="1"` `strokeDasharray="3 3"`

Helper do budowania path z null-pominięciem:
```js
function buildLinePath(values, data, xScale, yScale) {
  let d = '';
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    const x = xScale(i);
    const y = yScale(values[i]);
    d += d === '' ? `M${x},${y}` : ` L${x},${y}`;
  }
  return d;
}
```

#### B7. Panel RSI (osobna sekcja SVG)

- Tło panelu: delikatna linia oddzielająca (`stroke` gridColor)
- Label "RSI (14)" po lewej stronie, fontSize 9, fill textColor
- Oś Y: 0, 30, 50, 70, 100 — linie siatki (dasharray, gridColor)
- Strefy overbought (70–100) i oversold (0–30): `<rect>` fill `#8b5cf6` opacity 0.06
- Linia RSI: `<path>` stroke `#8b5cf6` strokeWidth 1.5
- Skala Y: `rsiToY(value) = panelTop + panelH * (1 - value/100)`

#### B8. Panel MACD (osobna sekcja SVG)

- Label "MACD (12,26,9)" po lewej
- Oś Y: automatyczna skala (min/max z macd, signal, histogram)
- Zero line: linia przerywana na y=0
- Histogram: `<rect>` słupki, zielone (>0) / czerwone (<0)
- MACD line: `<path>` stroke `#06b6d4` strokeWidth 1.5
- Signal line: `<path>` stroke `#ec4899` strokeWidth 1.5

#### B9. Crosshair — rozszerzenie tooltipa

Gdy hover aktywny i wskaźniki włączone, dodaj do tooltipa:
- Wartości aktywnych wskaźników dla hovered point (SMA, EMA, RSI, MACD/Signal)
- Format: nazwa + wartość zaokrąglona do 2 miejsc
- Pionowa linia crosshair: rozciągnij na całą wysokość SVG (od CHART_T do dna ostatniego panelu)

### C. Tłumaczenia w `src/data/translations.js`

Dodaj do obiektu `chart`:

```
sma: "SMA" / "SMA"
ema: "EMA" / "EMA"
bollinger: "Bollinger" / "Bollinger"
rsi: "RSI" / "RSI"
macd: "MACD" / "MACD"
indicators: "Wskaźniki" / "Indicators"
overlays: "Nakładki" / "Overlays"
oscillators: "Oscylatory" / "Oscillators"
```

## Ważne zasady

- BEZ nowych zależności npm
- Funkcje w `technicalIndicators.js` muszą być czyste (pure functions) — łatwe do testowania
- Obliczenia wskaźników w `useMemo` — NIE przeliczaj na każdym renderze
- Nie psuj istniejącej funkcjonalności wykresu (line/candle, zakresy, wolumen, tooltip)
- viewBox rośnie dynamicznie — NIE ustawiaj stałej wysokości na największy wariant
- Na mobile: panel wskaźników scrollowalny horyzontalnie jeśli się nie mieści
- Kolory wskaźników — stałe wartości hex, czytelne zarówno w light jak i dark mode
