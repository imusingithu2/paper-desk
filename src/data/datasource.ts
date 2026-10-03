import { Candle, Symbol } from '../core/types';

export interface DataSource {
  connect(symbol: Symbol, onTick: (candle: Candle) => void): void;
  disconnect(): void;
  fetchHistory(symbol: Symbol, limit: number): Promise<Candle[]>;
  getStatus(): { connected: boolean; lastTick: number };
}
