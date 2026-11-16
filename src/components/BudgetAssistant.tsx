import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { BdsIcon, BdsButton, BdsPill, BdsInput, BdsText } from '../bds';

/** A grid cell to highlight: `code` is a cost code or `cat:<Category>`; `col` is a column id (orig, rev, com, act, bv, proj, ctt, rvp). */
export type Highlight = { code: string; col: string };
/** One row in an answer that spans several jobs. Selecting it opens that job. */
export type JobRef = { id: string; name: string; value: string; bad?: boolean };
export type AiAction = { label: string; run: () => void };
/** A label and value line in an answer, e.g. "Projected cost  $501,300". */
export type FactRow = { label: string; value: string; bad?: boolean; strong?: boolean };
export type FactSection = { title?: string; rows: FactRow[] };
export type AiReply = string | { text: string; highlights?: Highlight[]; scope?: string; jobs?: JobRef[]; actions?: AiAction[]; sections?: FactSection[]; hint?: string; why?: string; suggest?: string[] };
export type AiMsg = { role: 'user' | 'ai' | 'divider'; text: string; hl?: Highlight[]; scope?: string; jobs?: JobRef[]; actions?: AiAction[]; sections?: FactSection[]; hint?: string; why?: string; suggest?: string[] };
export type AiVariant = 'floating' | 'bar' | 'cell' | 'view';

/** What the assistant is answering about. Defaults to the job open in the picker. */
export type Scope = { kind: 'job' } | { kind: 'all' } | { kind: 'pick'; ids: string[] };

/** A saved conversation. `jobId` is '*' when it spanned several jobs. */
export type Thread = { id: string; title: string; scope: string; jobId: string; when: string; messages: AiMsg[] };

export type ChatUi = {
  leading?: ReactNode;
  selectJob?: (id: string) => void;
  /** Message count at which the user cleared the grid highlights. 'Show me' only appears once they have. */
  hlDismissedAt?: number;
  history?: { threads: Thread[]; currentJobId: string; newChat: () => void; restore: (id: string) => void; remove: (id: string) => void };
};

export const AI_VARIANTS: { id: AiVariant; label: string; hint: string }[] = [
  { id: 'cell', label: 'Panel & insights', hint: 'Ask AI opens a docked side panel; sparkles on over-budget cells explain in place, row chevrons expand an AI breakdown, and an "insights" pill in the summary bar lists what to look at' },
  { id: 'view', label: 'AI view bar', hint: 'Describe the view you want and the grid filters and switches columns for you' },
  { id: 'floating', label: 'Floating chat', hint: 'Launcher bubble opens a hovering chat box' },
  { id: 'bar', label: 'Floating bar', hint: 'Always-visible prompt bar pinned to the bottom; a thread card expands above it' },
];

export const SUGGESTIONS = [
  'Why is my profit lower than estimated?',
  'Which cost codes are over budget?',
  'Which jobs are over budget?',
  'How much is left to invoice?',
  'What changed since the original budget?',
];

/** Scripted chat state. `answer` maps a question to a reply from the budget data. */
export function useBudgetChat(answer: (q: string) => AiReply, onShow?: () => void, ui: ChatUi = {}) {
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const ansRef = useRef(answer);
  ansRef.current = answer;
  const epoch = useRef(0);
  const send = useCallback((q: string) => {
    const text = q.trim();
    if (!text) return;
    const e = epoch.current;
    setMessages(m => [...m, { role: 'user', text }]);
    setBusy(true);
    window.setTimeout(() => {
      if (e !== epoch.current) return;
      const r = ansRef.current(text);
      setMessages(m => [...m, typeof r === 'string' ? { role: 'ai', text: r } : { role: 'ai', text: r.text, hl: r.highlights, scope: r.scope, jobs: r.jobs, actions: r.actions, sections: r.sections, hint: r.hint, why: r.why, suggest: r.suggest }]);
      setBusy(false);
    }, 700);
  }, []);
  const reset = useCallback(() => { epoch.current++; setBusy(false); setMessages([]); }, []);
  const load = useCallback((msgs: AiMsg[]) => { epoch.current++; setBusy(false); setMessages(msgs); }, []);
  const addDivider = useCallback((text: string) => setMessages(m => [...m, { role: 'divider', text }]), []);
  return { messages, busy, send, reset, load, addDivider, show: onShow, ...ui };
}

type Chat = ReturnType<typeof useBudgetChat>;

/** Short label/value tables under an answer, so numbers are scannable instead of buried in a sentence. */
export function Sections({ sections }: { sections?: FactSection[] }) {
  if (!sections?.length) return null;
  return (
    <div className="ba-facts">
      {sections.map((sec, i) => (
        <div key={i} className="ba-fact-sec">
          {sec.title && <div className="ba-fact-title">{sec.title}</div>}
          <dl>
            {sec.rows.map(r => (
              <div key={r.label} className={`ba-fact-row ${r.strong ? 'is-strong' : ''}`}>
                <dt>{r.label}</dt><dd className={r.bad ? 'is-bad' : ''}>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** AI message bubble. Shows what it was based on, job rows for multi-job answers, and any follow-up actions. */
function Msg({ m, chat, isLast }: { m: AiMsg; chat: Chat; isLast: boolean }) {
  if (m.role === 'divider') return <div className="ba-divider">{m.text}</div>;
  return (
    <div className={`ba-msg ba-msg-${m.role}`}>
      {m.role === 'ai' && m.scope && <div className="ba-scope-label"><span className="ba-scope-dot" />{m.scope}</div>}
      {m.role === 'ai' ? <div className={m.sections?.length || m.jobs?.length ? 'ba-lead' : ''}>{m.text}</div> : m.text}
      <Sections sections={m.sections} />
      {m.why && <div className="ba-why"><div className="ba-why-title">Why it went over</div><p>{m.why}</p></div>}
      {m.suggest && m.suggest.length > 0 && (
        <div className="ba-suggest">
          <div className="ba-why-title">Suggested next steps</div>
          <ul>{m.suggest.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      {m.jobs && m.jobs.length > 0 && (
        <div className="ba-jobrows">
          {m.jobs.map(j => (
            <button key={j.id} type="button" onClick={() => chat.selectJob?.(j.id)}>
              <span>{j.name}</span><b className={j.bad ? 'is-bad' : ''}>{j.value}</b>
            </button>
          ))}
        </div>
      )}
      {m.hint && <div className="ba-hint">{m.hint}</div>}
      {m.hl && m.hl.length > 0 && (
        <div className="ba-hl-note">
          {m.hl.length} cell{m.hl.length === 1 ? '' : 's'} highlighted in the grid
          {isLast && chat.show && chat.hlDismissedAt === chat.messages.length && <BdsButton displayType="tertiary" text="Show me" onClick={chat.show} />}
        </div>
      )}
      {isLast && m.actions && m.actions.length > 0 && (
        <div className="ba-actions">
          {m.actions.map(a => <BdsButton key={a.label} displayType="secondary" text={a.label} onClick={a.run} />)}
        </div>
      )}
    </div>
  );
}

function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </svg>
  );
}
export { SparkIcon };

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
);

/** Read-only label for what the assistant is answering about. The job picker is the only control, so the chat and the page never disagree. */
export function ScopeChip({ scope, jobs, currentName }: { scope: Scope; jobs: { id: string; name: string }[]; currentName: string }) {
  const label = scope.kind === 'all' ? `All ${jobs.length} open jobs` : currentName;
  return <span className="ba-scope-btn ba-scope-static" title="Change this with the job picker">{label}</span>;
}

function Composer({ onSend, busy, placeholder }: { onSend: (q: string) => void; busy: boolean; placeholder: string }) {
  const [v, setV] = useState('');
  const submit = () => { if (v.trim() && !busy) { onSend(v); setV(''); } };
  return (
    <div className="ba-composer">
      <BdsInput
        id="ba-composer-input"
        value={v}
        onChange={(_id, val) => setV(val)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder={placeholder}
        aria-label="Ask the budget assistant"
      />
      <BdsButton className="ba-send" displayType="primary" ariaLabel="Send" icon={<BdsIcon name="arrow-up" size={14} />} onClick={submit} disabled={!v.trim() || busy} />
    </div>
  );
}

/** Scope chip row that sits just above the prompt box, outside it. */
function ScopeRow({ chat, className = '' }: { chat: Chat; className?: string }) {
  if (!chat.leading) return null;
  return <div className={`ba-scope-row ${className}`}><span className="ba-scope-row-label">Asking about</span>{chat.leading}</div>;
}

/** Header with New chat and History. History swaps the body for a searchable list of past chats. */
function ChatHead({ chat, onClose, closeIcon, closeLabel, view, setView }: { chat: Chat; onClose: () => void; closeIcon: ReactNode; closeLabel: string; view: 'chat' | 'history'; setView: (v: 'chat' | 'history') => void }) {
  return (
    <header className="ba-head">
      <BdsText as="div" size="heavy-lg" className="ba-title"><SparkIcon size={16} /> {view === 'history' ? 'Chat history' : 'Budget assistant'}</BdsText>
      <div className="ba-head-actions">
        <BdsButton displayType="tertiary" ariaLabel="New chat" icon={<BdsIcon name="plus" size={16} />} onClick={() => { chat.history?.newChat(); setView('chat'); }} />
        <BdsButton displayType="tertiary" ariaLabel="Chat history" selected={view === 'history'} icon={<ClockIcon />} onClick={() => setView(view === 'history' ? 'chat' : 'history')} />
        <BdsButton displayType="tertiary" ariaLabel={closeLabel} icon={closeIcon} onClick={onClose} />
      </div>
    </header>
  );
}

function HistoryView({ chat, onOpen }: { chat: Chat; onOpen: () => void }) {
  const h = chat.history;
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  if (!h) return null;
  const mine = h.threads.filter(t => t.jobId === h.currentJobId || t.jobId === '*');
  const list = (all ? h.threads : mine).filter(t => t.title.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="ba-history">
      <label className="ba-hist-search">
        <BdsIcon name="search" size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" aria-label="Search chats" />
      </label>
      <div className="ba-scope" role="tablist">
        <button type="button" role="tab" aria-selected={!all} className={!all ? 'is-on' : ''} onClick={() => setAll(false)}>This job ({mine.length})</button>
        <button type="button" role="tab" aria-selected={all} className={all ? 'is-on' : ''} onClick={() => setAll(true)}>All chats ({h.threads.length})</button>
      </div>
      {list.length === 0 ? (
        <div className="ba-hist-empty">
          {q ? 'No chats match that search.' : 'No chats for this job yet.'}
          {!all && h.threads.length > 0 && <button type="button" className="ba-link" onClick={() => setAll(true)}>Show all chats</button>}
        </div>
      ) : (
        <ul className="ba-hist-list">
          {list.map((t, i) => (
            <li key={t.id}>
              {(i === 0 || list[i - 1].when !== t.when) && <div className="ba-hist-group">{t.when}</div>}
              <div className="ba-hist-item">
                <button type="button" className="ba-hist-main" onClick={() => { h.restore(t.id); onOpen(); }}>
                  <span className="ba-hist-title">{t.title}</span>
                  <span className="ba-hist-meta">{t.scope}</span>
                </button>
                <button type="button" className="ba-x ba-hist-del" aria-label={`Delete ${t.title}`} title="Delete chat" onClick={() => h.remove(t.id)}><BdsIcon name="x" size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChatBody({ chat, view, setView, send, endRef }: { chat: Chat; view: 'chat' | 'history'; setView: (v: 'chat' | 'history') => void; send: (q: string) => void; endRef: React.RefObject<HTMLDivElement> }) {
  if (view === 'history') return <HistoryView chat={chat} onOpen={() => setView('chat')} />;
  if (chat.messages.length === 0) {
    return (
      <div className="ba-empty">
        <BdsText as="div" size="heavy-lg" className="ba-empty-title">Ask about this budget</BdsText>
        <BdsText as="div" size="normal-md" className="ba-empty-sub">Answers use the scope shown above the prompt box: this job's budget, bills, POs and change orders, or several jobs at once.</BdsText>
        <div className="ba-chips">
          {SUGGESTIONS.map(s => <BdsPill key={s} text={s} onClick={() => send(s)} />)}
        </div>
      </div>
    );
  }
  return (
    <div className="ba-thread">
      {chat.messages.map((m, i) => <Msg key={i} m={m} chat={chat} isLast={i === chat.messages.length - 1} />)}
      {chat.busy && <div className="ba-msg ba-msg-ai ba-typing"><i /><i /><i /></div>}
      <div ref={endRef} />
    </div>
  );
}

/** Docked panel or floating chat box — same conversation body. */
export function ChatSurface({ chat, onClose, mode }: { chat: Chat; onClose: () => void; mode: 'panel' | 'floating' }) {
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat.messages, chat.busy, view]);
  const send = (q: string) => { setView('chat'); chat.send(q); };
  return (
    <aside className={`ba-surface ba-${mode}`} aria-label="Budget assistant">
      <ChatHead chat={chat} onClose={onClose} closeIcon={<BdsIcon name="x" size={16} />} closeLabel="Close" view={view} setView={setView} />
      <div className="ba-body">
        <ChatBody chat={chat} view={view} setView={setView} send={send} endRef={endRef} />
      </div>
      <div className="ba-foot">
        <ScopeRow chat={chat} />
        <Composer onSend={send} busy={chat.busy} placeholder="Ask about costs, profit, invoicing…" />
        <BdsText as="div" size="normal-sm" className="ba-disclaimer">Check important numbers before you act on them.</BdsText>
      </div>
    </aside>
  );
}

export function FloatingLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="ba-launcher" onClick={onClick} aria-label="Open budget assistant">
      <SparkIcon size={20} /> Ask AI
    </button>
  );
}

/** Persistent prompt bar pinned bottom-center. Focusing or sending expands a thread card above it. */
export function FloatingBar({ chat, setOpen }: { chat: Chat; open?: boolean; setOpen: (o: boolean) => void }) {
  // Asking hands off to the docked side panel, so the bar itself never expands into a card.
  const send = (q: string) => { setOpen(true); chat.send(q); };
  return (
    <div className="ba-fbar-wrap">
      <ScopeRow chat={chat} className="ba-scope-row-bar" />
      <div className="ba-fbar">
        <span className="ba-inline-icon"><SparkIcon size={18} /></span>
        <Composer onSend={send} busy={chat.busy} placeholder="Ask AI about this budget…" />
      </div>
    </div>
  );
}
