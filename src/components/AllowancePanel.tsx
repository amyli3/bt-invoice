import { useEffect, useState } from 'react';

/* Allowance side panel, shared by the builder and client selections pages.
 * Recreates the production allowance panel with a cleaner layout:
 * status + amount up top, a budget bar, then the options in the allowance.
 * Builder: Mark complete, cost code, internal notes.
 * Client: no Mark complete. Request an option and comments instead. */

export type AllowanceOptionStatus = 'Approved' | 'Sent' | 'Chosen' | 'Declined' | 'Draft' | 'Due soon' | 'Not chosen';

export interface AllowanceOptionItem {
  id: string;
  name: string;
  price: number;
  status: AllowanceOptionStatus;
  image?: string;
  // e.g. "Kitchen flooring"
  slot?: string;
}

export interface AllowanceComment {
  id: string;
  from: 'client' | 'builder';
  author: string;
  text: string;
  date: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  audience: 'builder' | 'client';
  name: string;
  status: 'In progress' | 'Completed' | 'Overdue' | 'Due soon' | 'Approved';
  amount: number;
  description?: string;
  dueLabel?: string;
  options: AllowanceOptionItem[];
  onOpenOption?: (id: string) => void;
  // Builder only
  costCode?: string;
  internalNotes?: string;
  isComplete?: boolean;
  onToggleComplete?: () => void;
  // Client only
  onRequestOption?: () => void;
  comments?: AllowanceComment[];
  onAddComment?: (text: string) => void;
}

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_CLASS: Record<string, string> = {
  'In progress': 'ap-badge-info',
  Completed: 'ap-badge-success',
  Approved: 'ap-badge-success',
  Overdue: 'ap-badge-danger',
  'Due soon': 'ap-badge-warning',
  Sent: 'ap-badge-info',
  Chosen: 'ap-badge-info',
  Declined: 'ap-badge-muted',
  Draft: 'ap-badge-muted',
};

function Badge({ text }: { text: string }) {
  return (
    <span className={`ap-badge ${STATUS_CLASS[text] ?? 'ap-badge-muted'}`}>
      {(text === 'Approved' || text === 'Completed') && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {text}
    </span>
  );
}

export default function AllowancePanel(p: Props) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!p.open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') p.onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p.open, p.onClose]);

  if (!p.open) return null;

  const isClient = p.audience === 'client';
  // Only approved (builder) or approved + chosen (client) count against the allowance
  const counted = p.options.filter(o => o.status === 'Approved' || (isClient && o.status === 'Chosen'));
  const used = counted.reduce((s, o) => s + o.price, 0);
  const left = p.amount - used;
  const over = left < 0;
  const pct = p.amount > 0 ? Math.min(100, (used / p.amount) * 100) : 0;
  const visibleOptions = isClient ? p.options.filter(o => o.status !== 'Draft') : p.options;

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    p.onAddComment?.(t);
    setDraft('');
  };

  return (
    <div className="ap-overlay" onClick={p.onClose}>
      <aside className="ap-panel" role="dialog" aria-modal="true" aria-labelledby="ap-title" onClick={e => e.stopPropagation()}>
        <div className="ap-toolbar">
          <button type="button" className="ap-icon-btn" onClick={p.onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <span style={{ flex: 1 }} />
          {!isClient && p.onToggleComplete && (
            <button type="button" className="ap-btn" onClick={p.onToggleComplete}>
              {p.isComplete ? 'Reopen' : 'Mark complete'}
            </button>
          )}
          {isClient && p.onRequestOption && (
            <button type="button" className="ap-btn" onClick={p.onRequestOption}>Request an option</button>
          )}
        </div>

        <div className="ap-body">
          <div className="ap-eyebrow">Allowance</div>
          <h2 id="ap-title" className="ap-title">{p.name}</h2>
          <div className="ap-meta">
            <Badge text={p.isComplete ? 'Completed' : p.status} />
            {p.dueLabel && <span className="ap-due">{p.dueLabel}</span>}
          </div>

          {/* Budget at a glance */}
          <div className="ap-budget">
            <div className="ap-budget-row">
              <div>
                <div className="ap-label">Allowance</div>
                <div className="ap-amount">{fmt(p.amount)}</div>
              </div>
              <div className="ap-budget-right">
                <div className="ap-label">{over ? 'Over allowance' : 'Left to use'}</div>
                <div className={`ap-left ${over ? 'ap-over' : 'ap-under'}`}>{fmt(Math.abs(left))}</div>
              </div>
            </div>
            <div className="ap-bar" role="img" aria-label={`${fmt(used)} of ${fmt(p.amount)} used`}>
              <div className={`ap-bar-fill ${over ? 'ap-bar-over' : ''}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="ap-bar-caption">
              {fmt(used)} {isClient ? 'chosen' : 'approved'} so far
              {over && isClient && <>. Anything over is added to your project once your builder approves it.</>}
            </div>
          </div>

          {(p.description || (!isClient && (p.costCode || p.internalNotes !== undefined))) && (
            <section className="ap-section">
              <h3 className="ap-section-title">Details</h3>
              <dl className="ap-details">
                {p.description && <div><dt>Description</dt><dd>{p.description}</dd></div>}
                {!isClient && p.costCode && <div><dt>Cost code</dt><dd>{p.costCode}</dd></div>}
                {!isClient && p.internalNotes !== undefined && (
                  <div><dt>Internal notes</dt><dd>{p.internalNotes || <span className="ap-empty-val">None</span>}</dd></div>
                )}
              </dl>
            </section>
          )}

          <section className="ap-section">
            <h3 className="ap-section-title">Options <span className="ap-count">{visibleOptions.length}</span></h3>
            {visibleOptions.length === 0 ? (
              <div className="ap-empty">No options yet.</div>
            ) : (
              <ul className="ap-options">
                {visibleOptions.map(o => (
                  <li key={o.id}>
                    <button type="button" className="ap-option" onClick={() => p.onOpenOption?.(o.id)}>
                      <span className="ap-option-thumb" style={{ backgroundImage: o.image ? `url(${o.image})` : undefined }} aria-hidden="true" />
                      <span className="ap-option-main">
                        {o.slot && <span className="ap-option-slot">{o.slot}</span>}
                        <span className="ap-option-name">{o.name}</span>
                        <span className="ap-option-meta">
                          {o.status !== 'Not chosen' && <Badge text={o.status} />}
                          <span className="ap-option-price">{o.price === 0 ? 'Included' : fmt(o.price)}</span>
                        </span>
                      </span>
                      <svg className="ap-option-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {isClient && p.onRequestOption && (
              <button type="button" className="ap-request-row" onClick={p.onRequestOption}>
                <span className="ap-request-plus" aria-hidden="true">+</span>
                <span>
                  <span className="ap-request-title">Request an option</span>
                  <span className="ap-request-sub">Don't see what you want? Send your builder a link or photo.</span>
                </span>
              </button>
            )}
          </section>

          {isClient && (
            <section className="ap-section">
              <h3 className="ap-section-title">Comments</h3>
              <p className="ap-hint">Questions about the whole allowance go here, like asking for more options or a budget change.</p>
              {(p.comments ?? []).length > 0 && (
                <ul className="ap-comments">
                  {(p.comments ?? []).map(c => (
                    <li key={c.id} className={`ap-comment ap-comment-${c.from}`}>
                      <div className="ap-comment-head"><strong>{c.author}</strong><span>{c.date}</span></div>
                      <div className="ap-comment-text">{c.text}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="ap-compose">
                <textarea
                  className="ap-compose-input"
                  rows={2}
                  placeholder="Write a comment for your builder"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
                  aria-label="Comment on this allowance"
                />
                <button type="button" className="ap-send" disabled={!draft.trim()} onClick={send}>Send</button>
              </div>
            </section>
          )}

          {!isClient && !p.isComplete && left !== 0 && (
            <div className="ap-note">
              {left > 0
                ? <>Marking complete holds the unused <strong>{fmt(left)}</strong> for other allowance overages, or settles it on the last draw.</>
                : <>Over by <strong>{fmt(Math.abs(left))}</strong>. Marking complete locks the allowance at the approved amount.</>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
