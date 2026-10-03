import { h } from 'preact';
import { state } from './state';

export function SettingsSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, 
      display: 'flex', alignItems: 'flex-end' 
    }} onClick={onClose}>
      <div 
        className="surface" 
        style={{ 
          width: '100%', backgroundColor: 'var(--bg-surface)', 
          borderTopLeftRadius: '20px', borderTopRightRadius: '20px', 
          padding: '30px 20px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))',
          animation: 'slideUp 0.3s ease-out'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 20px 0' }}>Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Starting Balance</span>
            <input 
              type="number" 
              value="10000" 
              style={{ background: 'black', color: 'white', border: '1px solid #333', padding: '8px', borderRadius: '4px', width: '100px', textAlign: 'right' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Trading Symbol</span>
            <select 
              value={state.symbol.value}
              onChange={(e) => {
                const target = e.target as HTMLSelectElement;
                state.symbol.value = target.value as any;
              }}
              style={{ background: 'black', color: 'white', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}
            >
              <option value="BTCUSDT">BTC</option>
              <option value="ETHUSDT">ETH</option>
              <option value="SOLUSDT">SOL</option>
            </select>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ padding: '12px', background: 'var(--color-red)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Reset Account
          </button>
        </div>
      </div>
    </div>
  );
}
