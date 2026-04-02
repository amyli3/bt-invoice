import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OpenbookFlow from './components/OpenbookFlow';

document.body.style.overflow = 'auto';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{
        background: '#1e293b',
        color: 'white',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #00d8d8, #0065db)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>BT</div>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Buildertrend</span>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Openbook · Progress Invoice — Add from Costs Workflow</span>
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Johnson Residence · 5678 Maple Street, Omaha NE
        </div>
      </div>
      <OpenbookFlow />
    </div>
  </React.StrictMode>,
);
