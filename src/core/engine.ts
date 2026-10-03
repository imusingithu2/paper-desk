import { Candle, Symbol, Side, Position, Trade, BotSignal } from './types';
import { calculateEMA, calculateRSI, calculateSMA, calculateATR } from './indicators';
export class TradingEngine {
  private readonly FEE_RATE = 0.0004;
  private readonly SLIPPAGE_RATE = 0.0002;
  public generateSignal(candles: Candle[]): BotSignal {
    if (candles.length < 21) return { action: 'HOLD', indicatorValues: { ema9: 0, ema21: 0, rsi: 0, volSma: 0 } };
    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const rsi = calculateRSI(closes, 14);
    const volSma = calculateSMA(volumes, 20);
    const currentVol = candles[candles.length - 1].volume;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (ema9 > ema21 && rsi > 50 && currentVol > volSma) action = 'BUY';
    else if (ema9 < ema21 && rsi < 50 && currentVol > volSma) action = 'SELL';
    return { action, indicatorValues: { ema9, ema21, rsi, volSma } };
  }
  public calculateFill(price: number, side: Side, qty: number): { fee: number; slippage: number; effectivePrice: number } {
    const slippage = price * this.SLIPPAGE_RATE;
    const effectivePrice = side === 'LONG' ? price + slippage : price - slippage;
    const fee = effectivePrice * qty * this.FEE_RATE;
    return { fee, slippage, effectivePrice };
  }
  public calculateExit(pos: Position, currentPrice: number): { realizedPnL: number; fee: number } {
    const fill = this.calculateFill(currentPrice, pos.side === 'LONG' ? 'SHORT' : 'LONG', pos.qty);
    const pnl = pos.side === 'LONG' ? (fill.effectivePrice - pos.entryPrice) * pos.qty : (pos.entryPrice - fill.effectivePrice) * pos.qty;
    return { realizedPnL: pnl - fill.fee, fee: fill.fee };
  }
}
