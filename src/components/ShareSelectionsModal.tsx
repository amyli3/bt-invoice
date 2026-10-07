import { useEffect, useMemo, useState } from 'react';

/* Builder-side "Share with client" modal. Generates a magic link that opens
 * the client selections page without a Buildertrend login. Prototype only:
 * the token is random and the link just routes to the client view. */

interface Props {
  open: boolean;
  onClose: () => void;
  jobName: string;
  clientName: string;
  clientEmail: string;
}

const EXPIRY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

function newToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function ShareSelectionsModal({ open, onClose, jobName, clientName, clientEmail }: Props) {
  const [token, setToken] = useState(newToken);
  const [expiryDays, setExpiryDays] = useState(30);
  const [canChoose, setCanChoose] = useState(true);
  const [groupBy, setGroupBy] = useState<'room' | 'allowance'>('room');
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const link = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?magic=${token}&to=${encodeURIComponent(clientName)}${groupBy === 'allowance' ? '&by=allowance' : ''}${canChoose ? '' : '&view=1'}#client-selections-workshop`;
  }, [token, canChoose, clientName, groupBy]);

  const expires = new Date();
  expires.setDate(expires.getDate() + expiryDays);
  const expiresLabel = expires.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked; field is selectable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = () => { setToken(newToken()); setRevoked(false); setCopied(false); };

  if (!open) return null;

  return (
    <div className="sh-overlay" onClick={onClose}>
      <div className="sh-modal" role="dialog" aria-modal="true" aria-labelledby="sh-title" onClick={e => e.stopPropagation()}>
        <div className="sh-head">
          <div>
            <h2 id="sh-title" className="sh-title">Share selections with client</h2>
            <p className="sh-sub">{jobName}</p>
          </div>
          <button type="button" className="sh-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="sh-body">
          <p className="sh-lead">
            Anyone with this link can see this job's selections without logging in to Buildertrend.
            Send it to <strong>{clientName}</strong> by text or email.
          </p>

          <label className="sh-label" htmlFor="sh-link">Magic link</label>
          {revoked ? (
            <div className="sh-revoked">
              This link was turned off. Anyone who opens it now sees an expired message.
              <button type="button" className="sh-link-btn" onClick={regenerate}>Create a new link</button>
            </div>
          ) : (
            <div className="sh-link-row">
              <input id="sh-link" className="sh-link-input" value={link} readOnly onFocus={e => e.currentTarget.select()} />
              <button type="button" className={`sh-copy ${copied ? 'sh-copied' : ''}`} onClick={copy}>
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy link</>
                )}
              </button>
            </div>
          )}
          <span className="sh-live" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</span>

          <div className="sh-settings">
            <div className="sh-setting">
              <label className="sh-label" htmlFor="sh-expiry">Link expires after</label>
              <select id="sh-expiry" className="sh-select" value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} disabled={revoked}>
                {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="sh-hint">Expires {expiresLabel}</span>
            </div>
            <div className="sh-setting">
              <span className="sh-label" id="sh-groupby-label">Client sees selections by</span>
              <div className="ws-seg" role="radiogroup" aria-labelledby="sh-groupby-label">
                <button type="button" role="radio" aria-checked={groupBy === 'room'} className={`ws-seg-btn ${groupBy === 'room' ? 'ws-seg-on' : ''}`} onClick={() => setGroupBy('room')} disabled={revoked}>Room</button>
                <button type="button" role="radio" aria-checked={groupBy === 'allowance'} className={`ws-seg-btn ${groupBy === 'allowance' ? 'ws-seg-on' : ''}`} onClick={() => setGroupBy('allowance')} disabled={revoked}>Allowance</button>
              </div>
              <span className="sh-hint">{groupBy === 'room' ? 'Choices are grouped by room, like walking through the house.' : 'Choices are grouped by allowance, the way they are set up on the job.'}</span>
            </div>
            <label className="sh-toggle">
              <input type="checkbox" checked={canChoose} onChange={e => setCanChoose(e.target.checked)} disabled={revoked} />
              <span>
                <span className="sh-toggle-title">Client can make choices</span>
                <span className="sh-hint">Turn off to share a view-only link, for example with a spouse or designer.</span>
              </span>
            </label>
          </div>

          <div className="sh-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <span>Choices made from this link are recorded as {clientName} ({clientEmail}). Prices and allowances are shown, but job costs are not.</span>
          </div>
        </div>

        <div className="sh-foot">
          {!revoked && <button type="button" className="sh-danger" onClick={() => setRevoked(true)}>Turn off link</button>}
          <span style={{ flex: 1 }} />
          <a className="sh-preview" href={link} target="_blank" rel="noopener noreferrer">Preview as client</a>
          <button type="button" className="sh-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
