import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* The verification step that follows saving payment account permissions. It
   opens on the same "Keep Your Account Safe" screen builders see today, then
   walks through the method they pick. Nothing is checked against a real code:
   any six digits pass, which is enough to click through the flow. */

type Step = 'pick' | 'app' | 'phone' | 'phone-code';

type Props = {
  /** Called once the builder finishes verifying. */
  onVerified: () => void;
  /** Called when the builder backs out, so the save does not go through. */
  onCancel: () => void;
};

/* A made-up code image: three finder squares and a fixed scatter of cells. */
function FakeQr() {
  const n = 21;
  const cells: string[] = [];
  const finder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const finderOn = (x: number, y: number) => {
    const fx = x >= n - 7 ? x - (n - 7) : x;
    const fy = y >= n - 7 ? y - (n - 7) : y;
    const edge = fx === 0 || fx === 6 || fy === 0 || fy === 6;
    const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
    return edge || core;
  };
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const on = finder(x, y) ? finderOn(x, y) : ((x * 7 + y * 13 + x * y) % 5 < 2);
      if (on) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} width="148" height="148" role="img" aria-label="Sample QR code" style={{ display: 'block' }}>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <path d={cells.join('')} fill="#0b1b3d" />
    </svg>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} aria-label="Buildertrend">
      <svg width="40" height="46" viewBox="0 0 40 46" aria-hidden="true">
        <path d="M4 2h9v14.5a11 11 0 1 1-9 10.8z" fill="#061a45" />
        <circle cx="15" cy="30" r="5" fill="#fff" />
        <path d="M31 12a19 19 0 0 1 3 26 19 19 0 0 1-24 5" fill="none" stroke="#4fd0d6" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 30, fontWeight: 800, color: '#061a45', letterSpacing: '-0.5px' }}>Buildertrend</span>
    </div>
  );
}

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3l5 5-5 5" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="4.5" y="9.5" width="13" height="9.5" rx="2" stroke="#5b6478" strokeWidth="1.5" />
    <path d="M7.5 9.5V7a3.5 3.5 0 0 1 7 0v2.5" stroke="#5b6478" strokeWidth="1.5" />
    <path d="M11 12.5v3" stroke="#5b6478" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <rect x="6" y="2.5" width="10" height="17" rx="2" stroke="#5b6478" strokeWidth="1.5" />
    <circle cx="11" cy="16.2" r="0.9" fill="#5b6478" />
  </svg>
);

export default function MfaDialog({ onVerified, onCancel }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const go = (next: Step) => { setStep(next); setCode(''); setError(''); };
  const digits = (v: string) => v.replace(/\D/g, '');
  const verify = () => {
    if (digits(code).length !== 6) { setError('Enter the 6-digit code'); return; }
    onVerified();
  };
  const sendCode = () => {
    if (digits(phone).length < 10) { setError('Enter a 10-digit phone number'); return; }
    go('phone-code');
  };

  const option = (icon: JSX.Element, label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left',
        padding: '18px 20px', border: '2px solid #e5e7eb', borderRadius: 12, background: '#fff',
        fontSize: 17, color: '#1f2430', cursor: 'pointer',
      }}
    >
      {icon}
      <span style={{ flex: 1, lineHeight: 1.2 }}>{label}</span>
      <Chevron />
    </button>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #cfd4dc', borderRadius: 8,
    fontSize: 17, letterSpacing: 1, background: '#fff', color: '#1f2430',
  };
  const primary: React.CSSProperties = {
    width: '100%', padding: '13px 16px', border: 0, borderRadius: 8, background: 'var(--bt-blue, #1a5bf0)',
    color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
  };
  const back: React.CSSProperties = {
    background: 'none', border: 0, color: 'var(--bt-blue, #1a5bf0)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', padding: '10px 0 0', width: '100%',
  };

  const title = step === 'pick' ? 'Keep Your Account Safe'
    : step === 'app' ? 'Set up your authenticator'
    : step === 'phone' ? 'Add your phone'
    : 'Check your phone';
  const sub = step === 'pick' ? 'Add another authentication method.'
    : step === 'app' ? 'Scan this code with Google Authenticator or a similar app, then enter the 6-digit code it shows.'
    : step === 'phone' ? 'We will text you a code to confirm it is you.'
    : `Enter the 6-digit code we sent to ${phone}.`;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(10,22,45,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-label="Verify it is you"
        style={{ background: '#fff', borderRadius: 14, width: 'min(480px, 100%)', maxHeight: '100%', overflow: 'auto', padding: '40px 36px 32px', position: 'relative', boxShadow: '0 24px 70px rgba(0,0,0,.35)' }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 0, fontSize: 24, color: '#6b7280', cursor: 'pointer', lineHeight: 1 }}
        >&times;</button>
        <Logo />
        <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#1f2430', margin: '34px 0 14px' }}>{title}</h2>
        <p style={{ textAlign: 'center', fontSize: 15, color: '#6b7280', margin: '0 0 26px', lineHeight: 1.5 }}>{sub}</p>

        {step === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {option(<LockIcon />, 'Google Authenticator or similar', () => go('app'))}
            {option(<PhoneIcon />, 'Phone', () => go('phone'))}
          </div>
        )}

        {step === 'app' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 10 }}><FakeQr /></div>
            <div style={{ width: '100%' }}>
              <input
                id="mfa-code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" aria-label="6-digit code"
                value={code} maxLength={7} onChange={(e) => { setCode(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
                style={{ ...inputStyle, borderColor: error ? '#c0362c' : '#cfd4dc' }} autoFocus
              />
              {error && <div style={{ color: '#c0362c', fontSize: 13, marginTop: 6 }}>{error}</div>}
            </div>
            <button type="button" style={primary} onClick={verify}>Verify and save</button>
            <button type="button" style={back} onClick={() => go('pick')}>Use a different method</button>
          </div>
        )}

        {step === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <input
                id="mfa-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-0123" aria-label="Phone number"
                value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') sendCode(); }}
                style={{ ...inputStyle, borderColor: error ? '#c0362c' : '#cfd4dc' }} autoFocus
              />
              {error && <div style={{ color: '#c0362c', fontSize: 13, marginTop: 6 }}>{error}</div>}
            </div>
            <button type="button" style={primary} onClick={sendCode}>Send code</button>
            <button type="button" style={back} onClick={() => go('pick')}>Use a different method</button>
          </div>
        )}

        {step === 'phone-code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <input
                id="mfa-code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" aria-label="6-digit code"
                value={code} maxLength={7} onChange={(e) => { setCode(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
                style={{ ...inputStyle, borderColor: error ? '#c0362c' : '#cfd4dc' }} autoFocus
              />
              {error && <div style={{ color: '#c0362c', fontSize: 13, marginTop: 6 }}>{error}</div>}
            </div>
            <button type="button" style={primary} onClick={verify}>Verify and save</button>
            <button type="button" style={back} onClick={() => go('phone')}>Change phone number</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
