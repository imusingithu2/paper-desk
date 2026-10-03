import { h } from 'preact';
import { Position } from '../core/types';
import { state } from './state';

export function PositionCard({ position }: { position: Position | null }) {
  if (!position) return null;

  const currentPrice = state.indicators.value.ema9;
  const pnl = position.side === 'LONG'
    ? (currentPrice - position.entryPrice) * position.qty
    : (position.entryPrice - currentPrice) * position.qty;

  return (
    <div className="card" style={{
      padding: '24px',
      marginBottom: '24px',
      borderLeft: `6px solid ${position.side === 'LONG' ? 'var(--color-green)' : 'var(--color-red)'}`,
      animation: 'slideUp 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>ACTIVE POSITION</span>
          <span style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {position.side === 'LONG' ? '🟢' : '🔴'} {position.side} {position.symbol}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', className: 'tabular-nums', color: pnl >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Unrealized P&L</span>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>ENTRY PRICE</span>
          <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '700' }}>${position.entryPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>MARK PRICE</span>
          <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '700' }}>${currentPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>STOP LOSS</span>
          <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-red)' }}>${position.stopLoss.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>TAKE PROFIT</span>
          <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-green)' }}>${position.takeProfit.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
EOF
