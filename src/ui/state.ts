import { Signal } from '@preact/signals';
import { AccountState, Position, Symbol } from '../core/types';
export const state = {
  equity: new Signal(10000),
  balance: new Signal(10000),
  pnl: new Signal(0),
  pnlPercent: new Signal(0),
  symbol: new Signal<Symbol>('BTCUSDT'),
  isConnected: new Signal(false),
  lastTickTime: new Signal(0),
  isTrading: new Signal(false),
  position: new Signal<Position | null>(null),
  trades: new Signal<any[]>([]),
  botStatus: new Signal('IDLE'),
  indicators: new Signal({ ema9: 0, ema21: 0, rsi: 0, volSma: 0 }),
};
export function initAccount() {
  const saved = localStorage.getItem('paper-desk-account');
  if (saved) {
    const data = JSON.parse(saved) as AccountState;
    state.balance.value = data.balance;
    state.equity.value = data.equity;
    state.trades.value = data.trades;
  }
}
