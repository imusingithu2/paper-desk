import { DataSource } from './datasource';
import { Candle, Symbol } from '../core/types';

export class BinanceDataSource implements DataSource {
  private ws: WebSocket | null = null;
  private connected = false;
  private lastTick = 0;
  private onTickCallback: ((candle: Candle) => void) | null = null;
  private currentSymbol: Symbol | null = null;

  public async fetchHistory(symbol: Symbol, limit: number = 500): Promise<Candle[]> {
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}`);
    const data = await response.json();
    return data.map((d: any) => ({
      time: d[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5])
    }));
  }

  public connect(symbol: Symbol, onTick: (candle: Candle) => void): void {
    this.currentSymbol = symbol;
    this.onTickCallback = onTick;
    const wsSymbol = symbol.toLowerCase();
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_1m`);

    this.ws.onopen = () => {
      this.connected = true;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const k = data.k;
      if (k) {
        const candle: Candle = {
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v)
        };
        this.lastTick = Date.now();
        if (this.onTickCallback) this.onTickCallback(candle);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      setTimeout(() => this.connect(symbol, onTick), 5000); // Basic backoff
    };

    this.ws.onerror = () => {
      this.connected = false;
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  public getStatus() {
    return { connected: this.connected, lastTick: this.lastTick };
  }
}
