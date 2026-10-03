export type Symbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT';
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
export type Side = 'LONG' | 'SHORT';
export interface Trade { id: string; time: number; symbol: Symbol; side: Side; qty: number; price: number; realizedPnL: number; fee: number; type: 'FILL' | 'CATCH_UP'; }
export interface Position { side: Side; qty: number; entryPrice: number; stopLoss: number; takeProfit: number; symbol: Symbol; }
export interface AccountState { version: number; balance: number; equity: number; trades: Trade[]; lastProcessedCandleTime: number; }
export interface BotSignal { action: 'BUY' | 'SELL' | 'HOLD'; indicatorValues: { ema9: number; ema21: number; rsi: number; volSma: number; }; }
