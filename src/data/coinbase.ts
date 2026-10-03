import { DataSource } from './datasource';
import { Candle, Symbol } from '../core/types';
export class CoinbaseDataSource implements DataSource {
  private ws: WebSocket | null = null;
  private connected = false;
  private lastTick = 0;
  private onTickCallback: ((candle: Candle) => void) | null = null;
  public async fetchHistory(symbol: Symbol, limit: number = 500): Promise<Candle[]> {
    const cbSymbol = symbol.replace('USDT', '-USD');
    const response = await fetch(`https://api.exchange.coinbase.com/products/${cbSymbol}/candles`);
    const data = await response.json();
    return data.map((d: any) => ({ time: d[0] * 1000, open: parseFloat(d[1]), high: parseFloat(d[2]), low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5]) }));
  }
  public connect(symbol: Symbol, onTick: (candle: Candle) => void): void {
    this.onTickCallback = onTick;
    this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    this.ws.onopen = () => {
      this.connected = true;
      this.ws?.send(JSON.stringify({ type: 'subscribe', product_ids: [symbol.replace('USDT', '-USD')], channels: ['ticker'] }));
    };
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ticker') {
        const candle: Candle = { time: Date.now(), open: parseFloat(data.open), high: parseFloat(data.high), low: parseFloat(data.low), close: parseFloat(data.price), volume: parseFloat(data.volume) };
        this.lastTick = Date.now();
        if (this.onTickCallback) this.onTickCallback(candle);
      }
    };
    this.ws.onclose = () => { this.connected = false; setTimeout(() => this.connect(symbol, onTick), 5000); };
  }
  public disconnect(): void { if (this.ws) this.ws.close(); this.connected = false; }
  public getStatus() { return { connected: this.connected, lastTick: this.lastTick }; }
}
