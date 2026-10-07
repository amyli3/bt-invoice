import { useEffect, useMemo, useState } from 'react';

/* Right rail on the client preview, opened from "Customize" in the shared-link
 * banner. Holds the same settings the old "Share with client" modal did, but
 * the builder sees each change land on the page behind it. Prototype only:
 * the token is random and settings live in page state. */

export type ClientViewSettings = {
  groupBy: 'room' | 'allowance';
  layout: 'grid' | 'compact';
  canChoose: boolean;
  // How rooms (or allowances) are ordered on the client's page.
  // 'due-first' = most due at the top, 'due-last' = most due at the bottom,
  // 'custom' = the builder's dragged order (customOrder holds ids).
  order: 'due-first' | 'due-last' | 'custom';
  customOrder: { room: string[]; allowance: string[] };
};

export type OrderItem = { id: string; label: string };

interface Props {
  open: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
  settings: ClientViewSettings;
  onChange: (next: ClientViewSettings) => void;
  // Rooms or allowances in their current due-based order, used to seed the
  // custom list the first time the builder picks "Custom order".
  orderItems: { room: OrderItem[]; allowance: OrderItem[] };
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

export default function ClientViewCustomizeRail({ open, onClose, clientName, clientEmail, settings, onChange, orderItems }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [token, setToken] = useState(newToken);
  const [expiryDays, setExpiryDays] = useState(30);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const { groupBy, layout, canChoose, order, customOrder } = settings;
  const unit = groupBy === 'room' ? 'room' : 'allowance';
  // Custom list = saved order, plus anything new appended at the end.
  const items = orderItems[groupBy];
  const saved = customOrder[groupBy];
  const customList: OrderItem[] = [
    ...saved.map(id => items.find(i => i.id === id)).filter((i): i is OrderItem => !!i),
    ...items.filter(i => !saved.includes(i.id)),
  ];
  const setCustom = (ids: string[]) => onChange({ ...settings, order: 'custom', customOrder: { ...customOrder, [groupBy]: ids } });
  const move = (id: string, to: number) => {
    const ids = customList.map(i => i.id).filter(x => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    setCustom(ids);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // The link the client gets. Never carries the builder-preview flag.
  const link = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?magic=${token}&to=${encodeURIComponent(clientName)}${groupBy === 'allowance' ? '&by=allowance' : ''}${layout === 'compact' ? '&layout=list' : ''}${order === 'due-last' ? '&order=last' : order === 'custom' && customOrder[groupBy].length ? `&order=${customOrder[groupBy].join(',')}` : ''}${canChoose ? '' : '&view=1'}#client-selections-workshop`;
  }, [token, canChoose, clientName, groupBy, layout, order, customOrder]);

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
    <aside className="cv-rail" role="complementary" aria-labelledby="cv-rail-title">
      <div className="sh-head">
        <div>
          <h2 id="cv-rail-title" className="sh-title">Customize client view</h2>
          <p className="sh-sub">Changes show on this preview right away.</p>
        </div>
        <button type="button" className="sh-close" onClick={onClose} aria-label="Close customize">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <div className="sh-body cv-rail-body">
        <div className="cv-rail-section">
          <span className="sh-label" id="cv-groupby-label">Client sees selections by</span>
          <div className="ws-seg" role="radiogroup" aria-labelledby="cv-groupby-label">
            <button type="button" role="radio" aria-checked={groupBy === 'room'} className={`ws-seg-btn ${groupBy === 'room' ? 'ws-seg-on' : ''}`} onClick={() => onChange({ ...settings, groupBy: 'room' })}>Room</button>
            <button type="button" role="radio" aria-checked={groupBy === 'allowance'} className={`ws-seg-btn ${groupBy === 'allowance' ? 'ws-seg-on' : ''}`} onClick={() => onChange({ ...settings, groupBy: 'allowance' })}>Allowance</button>
          </div>
          <span className="sh-hint">{groupBy === 'room' ? 'Choices are grouped by room, like walking through the house.' : 'Choices are grouped by allowance, the way they are set up on the job.'}</span>
        </div>

        <div className="cv-rail-section">
          <span className="sh-label" id="cv-layout-label">Default layout</span>
          <div className="ws-seg" role="radiogroup" aria-labelledby="cv-layout-label">
            <button type="button" role="radio" aria-checked={layout === 'grid'} className={`ws-seg-btn ${layout === 'grid' ? 'ws-seg-on' : ''}`} onClick={() => onChange({ ...settings, layout: 'grid' })}>Grid</button>
            <button type="button" role="radio" aria-checked={layout === 'compact'} className={`ws-seg-btn ${layout === 'compact' ? 'ws-seg-on' : ''}`} onClick={() => onChange({ ...settings, layout: 'compact' })}>List</button>
          </div>
          <span className="sh-hint">{layout === 'grid' ? 'Large photo cards. Best when the look matters, like finishes and fixtures.' : 'One line per option. Best for long lists the client already knows.'} The client can still switch.</span>
        </div>

        <div className="cv-rail-section">
          <span className="sh-label" id="cv-order-label">Show first</span>
          <div className="cv-radio-list" role="radiogroup" aria-labelledby="cv-order-label">
            {([
              { id: 'due-first', label: 'Most due first', hint: `Overdue and due-soon ${unit === 'room' ? 'rooms' : 'allowances'} at the top.` },
              { id: 'due-last', label: 'Most due last', hint: 'Finished and later work first, urgent items at the bottom.' },
              { id: 'custom', label: 'Custom order', hint: `Drag ${unit === 'room' ? 'rooms' : 'allowances'} into the order you want, like the way you walk the house.` },
            ] as const).map(o => (
              <label key={o.id} className={`cv-radio${order === o.id ? ' on' : ''}`}>
                <input type="radio" name="cv-order" checked={order === o.id} onChange={() => onChange({ ...settings, order: o.id })} />
                <span>
                  <span className="cv-radio-title">{o.label}</span>
                  <span className="sh-hint">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {order === 'custom' && (
            <ol className="cv-order-list" aria-label={`${unit === 'room' ? 'Room' : 'Allowance'} order`}>
              {customList.map((it, i) => (
                <li
                  key={it.id}
                  className={`cv-order-item${dragId === it.id ? ' dragging' : ''}`}
                  draggable
                  onDragStart={e => { setDragId(it.id); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={e => { e.preventDefault(); if (dragId && dragId !== it.id) move(dragId, i); }}
                  onDragEnd={() => setDragId(null)}
                >
                  <svg className="cv-grip" width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true"><circle cx="3" cy="3" r="1.4"/><circle cx="9" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="9" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="9" cy="13" r="1.4"/></svg>
                  <span className="cv-order-num">{i + 1}</span>
                  <span className="cv-order-label">{it.label}</span>
                  <span className="cv-order-btns">
                    <button type="button" className="cv-order-btn" onClick={() => move(it.id, i - 1)} disabled={i === 0} aria-label={`Move ${it.label} up`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                    </button>
                    <button type="button" className="cv-order-btn" onClick={() => move(it.id, i + 1)} disabled={i === customList.length - 1} aria-label={`Move ${it.label} down`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <label className="sh-toggle cv-rail-section">
          <input type="checkbox" checked={canChoose} onChange={e => onChange({ ...settings, canChoose: e.target.checked })} />
          <span>
            <span className="sh-toggle-title">Client can make choices</span>
            <span className="sh-hint">Turn off to share a view-only link, for example with a spouse or designer.</span>
          </span>
        </label>

        <div className="cv-rail-section cv-rail-divider">
          <label className="sh-label" htmlFor="cv-link">Magic link</label>
          {revoked ? (
            <div className="sh-revoked">
              This link was turned off. Anyone who opens it now sees an expired message.
              <button type="button" className="sh-link-btn" onClick={regenerate}>Create a new link</button>
            </div>
          ) : (
            <div className="sh-link-row">
              <input id="cv-link" className="sh-link-input" value={link} readOnly onFocus={e => e.currentTarget.select()} />
              <button type="button" className={`sh-copy ${copied ? 'sh-copied' : ''}`} onClick={copy}>
                {copied ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy</>
                )}
              </button>
            </div>
          )}
          <span className="sh-hint">Send it to <strong>{clientName}</strong> by text or email. No Buildertrend login needed.</span>
          <span className="sh-live" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</span>
        </div>

        <div className="cv-rail-section">
          <label className="sh-label" htmlFor="cv-expiry">Link expires after</label>
          <select id="cv-expiry" className="sh-select" value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} disabled={revoked}>
            {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="sh-hint">Expires {expiresLabel}</span>
        </div>

        <div className="sh-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span>Choices made from this link are recorded as {clientName} ({clientEmail}). Prices and allowances are shown, but job costs are not.</span>
        </div>
      </div>

      <div className="sh-foot">
        {!revoked && <button type="button" className="sh-danger" onClick={() => setRevoked(true)}>Turn off link</button>}
        <span style={{ flex: 1 }} />
        <button type="button" className="sh-done" onClick={onClose}>Done</button>
      </div>
    </aside>
  );
}
