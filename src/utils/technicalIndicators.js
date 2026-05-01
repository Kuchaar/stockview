// Pure technical indicator functions for OHLCV data
// All return arrays of the same length as input, with null for insufficient data

/**
 * Simple Moving Average
 * @param {number[]} values - close prices
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function calcSMA(values, period) {
  const result = new Array(values.length).fill(null);
  if (values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    result[i] = sum / period;
  }
  return result;
}

/**
 * Exponential Moving Average
 * First EMA = SMA of first `period` values, then EMA smoothing
 * @param {number[]} values
 * @param {number} period
 * @returns {(number|null)[]}
 */
export function calcEMA(values, period) {
  const result = new Array(values.length).fill(null);
  if (values.length < period) return result;

  const k = 2 / (period + 1);

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  let ema = sum / period;
  result[period - 1] = ema;

  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

/**
 * Internal: EMA over an array that may have leading nulls.
 * Starts EMA from the first non-null value.
 */
function emaOverNullable(values, period) {
  const result = new Array(values.length).fill(null);
  const k = 2 / (period + 1);

  // Collect non-null values with their original indices
  let count = 0;
  let sum = 0;
  let ema = null;

  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    count++;
    if (count <= period) {
      sum += values[i];
      if (count === period) {
        ema = sum / period;
        result[i] = ema;
      }
    } else {
      ema = values[i] * k + ema * (1 - k);
      result[i] = ema;
    }
  }
  return result;
}

/**
 * Relative Strength Index (Wilder smoothing)
 * @param {number[]} closes
 * @param {number} period - default 14
 * @returns {(number|null)[]}
 */
export function calcRSI(closes, period = 14) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let gainSum = 0, lossSum = 0;

  // First `period` changes
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gainSum += change;
    else lossSum += Math.abs(change);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Wilder smoothing for subsequent values
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * @param {number[]} closes
 * @param {number} fastPeriod - default 12
 * @param {number} slowPeriod - default 26
 * @param {number} signalPeriod - default 9
 * @returns {{ macd: (number|null)[], signal: (number|null)[], histogram: (number|null)[] }}
 */
export function calcMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calcEMA(closes, fastPeriod);
  const slowEMA = calcEMA(closes, slowPeriod);

  const macd = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] != null && slowEMA[i] != null) {
      macd[i] = fastEMA[i] - slowEMA[i];
    }
  }

  const signal = emaOverNullable(macd, signalPeriod);

  const histogram = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (macd[i] != null && signal[i] != null) {
      histogram[i] = macd[i] - signal[i];
    }
  }

  return { macd, signal, histogram };
}

/**
 * Bollinger Bands
 * @param {number[]} closes
 * @param {number} period - default 20
 * @param {number} multiplier - default 2
 * @returns {{ upper: (number|null)[], middle: (number|null)[], lower: (number|null)[] }}
 */
export function calcBollingerBands(closes, period = 20, multiplier = 2) {
  const middle = calcSMA(closes, period);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    // Population standard deviation (divisor N)
    let sumSq = 0;
    const mean = middle[i];
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - mean;
      sumSq += diff * diff;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper[i] = mean + multiplier * stdDev;
    lower[i] = mean - multiplier * stdDev;
  }

  return { upper, middle, lower };
}
