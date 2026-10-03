import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { state } from './state';
import { BinanceDataSource } from '../data/binance';
import { TradingEngine } from '../core/engine';
import { Account } from '../core/account';
import { Candle, Symbol, Position, Trade } from '../core/types';
import { Chart } from './Chart';
import { PositionCard } from './PositionCard';
import { SettingsSheet } from './SettingsSheet';

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const engine = new TradingEngine();
  const account = new Account();
  const dataSource = new BinanceDataSource();
  const [candles, setCandles] = useState<Candle[]>([]);
  const [botLogs, setBotLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setBotLogs(prev => [ `[${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const saved = localStorage.getItem('paper-desk-account');
    if (saved) {
      account.load(JSON.parse(saved));
      state.balance.value = account.state.balance;
      state.equity.value = account.state.equity;
      state.trades.value = account.state.trades;
    }

    const handleTick = (candle: Candle) => {
      setCandles(prev => {
        const next = [...prev, candle];
        if (next.length > 1000) next.shift();
        return next;
      });

      state.isConnected.value = true;
      state.lastTickTime.value = Date.now();

      if (state.isTrading.value) {
        account.updateEquity(candle.close, state.position.value);
        state.equity.value = account.state.equity;

        if (state.position.value) {
          const pos = state.position.value;
          const currentPrice = candle.close;
          const isSL = pos.side === 'LONG' ? currentPrice <= pos.stopLoss : currentPrice >= pos.stopLoss;
          const isTP = pos.side === 'LONG' ? currentPrice >= pos.takeProfit : currentPrice <= pos.takeProfit;

          if (isSL || isTP) {
            const reason = isSL ? 'Stop Loss' : 'Take Profit';
            addLog(`❌ Position closed: ${reason} at ${currentPrice}`);
            const result = engine.calculateExit(pos, currentPrice);
            account.state.balance += result.realizedPnL;
            const trade: Trade = {
              id: Math.random().toString(36).substring(7),
              time: Date.now(),
              symbol: pos.symbol,
              side: pos.side === 'LONG' ? 'SHORT' : 'LONG',
              qty: pos.qty,
              price: currentPrice,
              realizedPnL: result.realizedPnL,
              fee: result.fee,
              type: 'FILL'
            };
            account.addTrade(trade);
            state.position.value = null;
            state.trades.value = [...account.state.trades];
            account.save();
          }
        } else {
          const signal = engine.generateSignal(candles);
          state.indicators.value = signal.indicatorValues;

          if (signal.action !== 'HOLD') {
            const side = signal.action === 'BUY' ? 'LONG' : 'SHORT';
            const price = candle.close;
            addLog(`🚀 Signal: ${side} @ ${price}`);
            const fill = engine.calculateFill(price, side as any, 1);
            const pos: Position = {
              side: side as any,
              qty: 1,
              entryPrice: fill.effectivePrice,
              stopLoss: side === 'LONG' ? fill.effectivePrice * 0.99 : fill.effectivePrice * 1.01,
              takeProfit: side === 'LONG' ? fill.effectivePrice * 1.02 : fill.effectivePrice * 0.98,
              symbol: state.symbol.value
            };
            state.position.value = pos;
            account.state.balance -= fill.fee;
            account.save();
          }
        }
      }
    };

    dataSource.connect(state.symbol.value, handleTick);

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.isTrading.value) {
        addLog('♻️ Catching up missed data...');
        const missed = await dataSource.fetchHistory(state.symbol.value, 100);
        missed.forEach(c => handleTick(c));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      dataSource.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleTrading = () => {
    const nextState = !state.isTrading.value;
    state.isTrading.value = nextState;
    if (nextState) addLog('🤖 Bot started. Scanning markets...');
    else addLog('🛑 Bot stopped.');

    if (!nextState) {
      const trades = account.state.trades;
      const winRate = (trades.filter(t => t.realizedPnL > 0).length / trades.length) * 100 || 0;
      const totalPnL = trades.reduce((a, b) => a + b.realizedPnL, 0);
      setSummary({
        winRate,
        totalPnL,
        count: trades.length,
        best: Math.max(...trades.map(t => t.realizedPnL), 0),
        worst: Math.min(...trades.map(t => t.realizedPnL), 0)
      });

      if (state.position.value) {
        const pos = state.position.value;
        const currentPrice = candles[candles.length - 1]?.close || 0;
        const result = engine.calculateExit(pos, currentPrice);
        account.state.balance += result.realizedPnL;
        account.addTrade({
          id: 'stop-' + Date.now(),
          time: Date.now(),
          symbol: pos.symbol,
          side: pos.side === 'LONG' ? 'SHORT' : 'LONG',
          qty: pos.qty,
          price: currentPrice,
          realizedPnL: result.realizedPnL,
          fee: result.fee,
          type: 'FILL'
        });
        state.position.value = null;
        state.trades.value = [...account.state.trades];
        account.save();
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <header style={{ padding: '20px 20px 10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: state.isConnected.value ? 'var(--color-green)' : 'var(--color-red)',
            boxShadow: state.isConnected.value ? '0 0 8px var(--color-green)' : 'none'
          }} />
          <span style={{ fontWeight: '700', fontSize: '18px' }}>{state.symbol.value}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>PAPER</div>
          <span style={{ fontSize: '22px', cursor: 'pointer', opacity: 0.8 }} onClick={() => setSettingsOpen(true)}>⚙️</span>
        </div>
      </header>

      <div style={{ textAlign: 'center', padding: '10px 20px 30px 20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px', letterSpacing: '1px' }}>TOTAL EQUITY</div>
        <div style={{ fontSize: '56px', fontWeight: '800', className: 'tabular-nums', letterSpacing: '-2px' }}>
          ${state.equity.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '16px',
          fontWeight: '700',
          className: 'tabular-nums',
          background: state.pnl.value >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: state.pnl.value >= 0 ? 'var(--color-green)' : 'var(--color-red)',
          marginTop: '8px'
        }}>
          {state.pnl.value >= 0 ? '▲' : '▼'} {state.pnl.value.toFixed(2)} ({state.pnlPercent.value.toFixed(2)}%)
        </div>
      </div>

      <div style={{ margin: '0 20px 20px 20px', height: '300px', className: 'card', overflow: 'hidden' }}>
        <Chart candles={candles} />
      </div>

      <div style={{ padding: '0 20px', flex: 1, overflowY: 'auto', className: 'scroll-area' }}>
        <PositionCard position={state.position.value} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Activity Feed</h3>
          {state.isTrading.value && !state.position.value && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-blue)', fontWeight: '600' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-blue 1.5s infinite' }} />
              Scanning... EMA:{state.indicators.value.ema9.toFixed(1)} RSI:{state.indicators.value.rsi.toFixed(0)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '120px' }}>
          {botLogs.length === 0 && !state.isTrading.value && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '20px' }}>
              Press Start to activate the bot.
            </div>
          )}
          {botLogs.map((log, i) => (
            <div key={i} style={{
              fontSize: '13px',
              color: 'var(--text-main)',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              gap: '10px'
            }}>
              <span style={{ opacity: 0.4, fontSize: '11px', className: 'tabular-nums' }}>{log.split(']')[0].replace('[', '')}</span>
              <span>{log.split(']')[1]}</span>
            </div>
          ))}
          {state.trades.value.map(t => (
            <div key={t.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>{t.side} {t.qty} {t.symbol}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted' }}>{new Date(t.time).toLocaleTimeString()}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', className: 'tabular-nums', color: t.realizedPnL >= 0 ? 'var(--color-green)' : 'var(--color-red' }}>
                  {t.realizedPnL >= 0 ? '+' : ''}{t.realizedPnL.toFixed(2)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted' }}>Realized</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="action-bar">
        <button
          className="btn-pill"
          onClick={toggleTrading}
          style={{
            background: state.isTrading.value ? 'var(--color-red)' : 'var(--accent-blue)',
            color: 'white',
            boxShadow: state.isTrading.value ? '0 8px 24px rgba(239, 68, 68, 0.4)' : '0 8px 24px rgba(59, 130, 246, 0.4)'
          }}
        >
          {state.isTrading.value ? 'STOP TRADING' : 'START TRADING'}
        </button>
      </div>

      <SettingsSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {summary && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: '0 0 30px 0', fontSize: '28px', fontWeight: '800' }}>Session Result</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>Win Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.winRate.toFixed(1)}%</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted', fontSize: '12px', marginBottom: '8px' }}>Total P&L</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.totalPnL >= 0 ? 'var(--color-green)' : 'var(--color-red' }}>${summary.totalPnL.toFixed(2)}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted', fontSize: '12px', marginBottom: '8px' }}>Trades</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.count}</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px' }}>
                <div style={{ color: 'var(--text-muted', fontSize: '12px', marginBottom: '8px' }}>Best Trade</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-green)' }}>${summary.best.toFixed(2)}</div>
              </div>
            </div>
            <button onClick={() => setSummary(null)} className="btn-pill" style={{ background: 'var(--accent-blue)', color: 'white' }}>Continue Trading</button>
          </div>
        </div>
      )}
    </div>
  );
}
