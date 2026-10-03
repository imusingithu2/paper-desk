export function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) { ema = data[i] * k + ema * (1 - k); }
  return ema;
}
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0; let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length <= period) return 0;
  let sumTr = 0;
  for (let i = highs.length - period; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    sumTr += Math.max(hl, hpc, lpc);
  }
  return sumTr / period;
}
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1];
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}
