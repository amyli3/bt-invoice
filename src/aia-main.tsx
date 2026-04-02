import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AIAPayApp from './components/AIAPayApp';

// Override body overflow:hidden from index.css (needed for invoice page, not here)
document.body.style.overflow = 'auto';

const navItems = ['Sales', 'Jobs', 'Project management', 'Files', 'Messaging', 'Financial'];

const CaretDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.6 }}>
    <path d="M3 4.5L6 7.5L9 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ fontFamily: "'Arial', sans-serif", minHeight: '100vh', background: '#f8fafc' }}>
      {/* Main Navigation */}
      <div style={{
        background: '#002f77',
        color: 'white',
        padding: '0 16px',
        height: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Left nav items */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {navItems.map(item => (
            <button key={item} style={{
              background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2,
              fontSize: 14, fontWeight: 700, fontFamily: "'Arial', sans-serif", height: 32,
            }}>
              {item}
              <CaretDown />
            </button>
          ))}
          <button style={{
            background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 4, fontSize: 14, fontWeight: 700,
            fontFamily: "'Arial', sans-serif", height: 32,
          }}>
            Reports
          </button>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            background: 'white', borderRadius: 4, height: 32, width: 212,
            display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 0 8px',
            border: '1px solid #f1f4fa',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#666d7c" strokeWidth="1.5"/>
              <path d="M13 13l3.5 3.5" stroke="#666d7c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 14, color: '#666d7c', fontFamily: "'Arial', sans-serif" }}>Search</span>
          </div>

          {/* Plus icon */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Bell icon */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5a5 5 0 00-5 5v3l-1.5 2h13L15 10.5v-3a5 5 0 00-5-5zM8.5 16.5a1.5 1.5 0 003 0" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* People icon */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="7.5" cy="6.5" r="2.5" stroke="white" strokeWidth="1.3"/>
              <path d="M2.5 16c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="14" cy="6.5" r="2" stroke="white" strokeWidth="1.2"/>
              <path d="M14 11.5c2.5 0 4 1.5 4 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Help icon */}
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.3"/>
              <path d="M8 7.5a2.5 2.5 0 013.5 2c0 1.5-2 2-2 3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="10" cy="14.5" r="0.75" fill="white"/>
            </svg>
          </button>

          {/* Avatar */}
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px',
            borderRadius: 4, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 20, background: '#c4fae2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 400, color: '#005c35', textTransform: 'uppercase',
              fontFamily: "'Arial', sans-serif",
            }}>MR</div>
          </button>
        </div>
      </div>

      {/* AIA Prototype */}
      <AIAPayApp />
    </div>
  </React.StrictMode>,
);
