import { AccountState, Trade, Position, Symbol, Side } from './types';
export class Account {
  public state: AccountState;
  constructor(initialBalance = 10000) {
    this.state = { version: 1, balance: initialBalance, equity: initialBalance, trades: [], lastProcessedCandleTime: 0 };
  }
  public load(saved: AccountState) { this.state = { ...saved }; }
  public save() { localStorage.setItem('paper-desk-account', JSON.stringify(this.state)); }
  public addTrade(trade: Trade) {
    this.state.trades.unshift(trade);
    this.state.balance -= trade.fee;
  }
  public updateEquity(currentPrice: number, position: Position | null) {
    if (!position) { this.state.equity = this.state.balance; return; }
    const unrealized = position.side === 'LONG' ? (currentPrice - position.entryPrice) * position.qty : (position.entryPrice - currentPrice) * position.qty;
    this.state.equity = this.state.balance + unrealized;
  }
}
