/* After a selection is approved, the client follows each chosen item through
 * ordering, delivery and installation. */

export type FulfillmentStage = 'approved' | 'ordered' | 'delivered' | 'installed';

export const STAGES: { id: FulfillmentStage; label: string }[] = [
  { id: 'approved', label: 'Pending order' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'installed', label: 'Installed' },
];

export interface Fulfillment {
  stage: FulfillmentStage;
  // Date each stage was reached, plus the expected date of the next one
  dates: Partial<Record<FulfillmentStage, string>>;
  expected?: string;
  note?: string;
}

// Mock progress for items that were approved before this session.
// Anything the client submits now starts at Approved.
export const MOCK_FULFILLMENT: Record<string, Fulfillment> = {
  'lt-1': { stage: 'installed', dates: { approved: '2026-04-18', ordered: '2026-04-22', delivered: '2026-05-06', installed: '2026-05-20' } },
  'lt-2': { stage: 'delivered', dates: { approved: '2026-04-18', ordered: '2026-04-22', delivered: '2026-05-08' }, expected: '2026-10-14', note: 'On site in the garage, waiting for drywall to finish.' },
  'lt-3': { stage: 'ordered', dates: { approved: '2026-04-18', ordered: '2026-04-29' }, expected: '2026-10-20', note: 'Backordered at the supplier.' },
  // Dining room: one item at each stage, plus a delay
  'dn-pt': { stage: 'installed', dates: { approved: '2026-04-08', ordered: '2026-04-09', delivered: '2026-04-14', installed: '2026-09-22' } },
  'dn-fl': { stage: 'installed', dates: { approved: '2026-04-08', ordered: '2026-04-15', delivered: '2026-05-02', installed: '2026-09-15' } },
  'dn-wc': { stage: 'delivered', dates: { approved: '2026-04-08', ordered: '2026-04-20', delivered: '2026-09-28' }, expected: '2026-10-12', note: 'Install scheduled after paint touch-ups.' },
  'dn-bf': { stage: 'ordered', dates: { approved: '2026-04-08', ordered: '2026-05-01' }, expected: '2026-10-24', note: 'Being built by the cabinet shop. About 3 weeks out.' },
  'dn-sc': { stage: 'ordered', dates: { approved: '2026-04-08', ordered: '2026-04-22' }, expected: '2026-11-04', note: 'Delayed at the supplier. New ship date Nov 4.' },
  'dn-wt': { stage: 'approved', dates: { approved: '2026-04-08' }, expected: '2026-10-15', note: 'Ordered once windows are measured on Oct 15.' },
};

interface Item {
  id: string;
  name: string;
  vendor?: string;
  image?: string;
  group?: string;
  price: number;
}

interface Group {
  id: string;
  name: string;
  options: Item[];
}

interface Props {
  groups: Group[];
  fulfillment: Record<string, Fulfillment>;
  expanded: boolean;
  onToggle: () => void;
  // When everything here is approved, the tracker is the whole page:
  // no collapsible heading, stage filter applied, sorted by stage.
  standalone?: boolean;
  stageFilter?: FulfillmentStage | 'all';
  // Open the item's detail panel
  onOpenItem?: (id: string) => void;
}

const short = (d?: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const stageIndex = (s: FulfillmentStage) => STAGES.findIndex(x => x.id === s);

// One status per item instead of a full stepper per row. The pill says where
// it is now; the line under it says when that happened or what's next.
function StagePill({ f }: { f: Fulfillment }) {
  const i = stageIndex(f.stage);
  const label = STAGES[i].label;
  const next = STAGES[i + 1];
  const when = f.dates[f.stage];
  const delayed = !!f.note && /delay|backorder/i.test(f.note);
  return (
    <div className="tr-stage">
      <span className={`tr-pill tr-pill-${f.stage} ${delayed ? 'tr-pill-delayed' : ''}`}>
        {f.stage === 'installed' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
        )}
        {delayed ? `${label}, delayed` : label}
      </span>
      <span className="tr-stage-sub">
        {when && <>{f.stage === 'approved' ? 'Approved' : label} {short(when)}</>}
        {next && f.expected && <>{when ? ' · ' : ''}{next.label} est. {short(f.expected)}</>}
      </span>
    </div>
  );
}

export function Stepper({ f }: { f: Fulfillment }) {
  const current = stageIndex(f.stage);
  return (
    <ol className="tr-steps" aria-label={`Status: ${STAGES[current].label}`}>
      {STAGES.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const date = f.dates[s.id];
        const isNext = i === current + 1;
        return (
          <li key={s.id} className={`tr-step tr-step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tr-step-dot">
              {state !== 'todo' && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </span>
            <span className="tr-step-label">{s.label}</span>
            <span className="tr-step-date">{date ? short(date) : isNext && f.expected ? `Est. ${short(f.expected)}` : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Order follows the journey: approved, ordered, ordered (delayed), delivered, installed last
const isDelayed = (f?: Fulfillment) => !!f?.note && /delay|backorder/i.test(f.note);
const sortRank = (f?: Fulfillment) => {
  const stage = f?.stage ?? 'approved';
  if (stage === 'approved') return 0;
  if (stage === 'ordered') return isDelayed(f) ? 2 : 1;
  if (stage === 'delivered') return 3;
  return 4;
};

export default function SelectionTracking({ groups, fulfillment, expanded, onToggle, standalone, stageFilter = 'all', onOpenItem }: Props) {
  const allItems = groups.flatMap(g => g.options.map(o => ({ ...o, groupName: g.name })));
  const stageOf = (id: string) => fulfillment[id]?.stage ?? 'approved';
  const items = standalone
    ? allItems
        .filter(i => stageFilter === 'all' || stageOf(i.id) === stageFilter)
        .sort((a, b) => sortRank(fulfillment[a.id]) - sortRank(fulfillment[b.id]))
    : allItems;
  const count = (stage: FulfillmentStage) => allItems.filter(i => stageOf(i.id) === stage).length;

  return (
    <>
      {!standalone && <h2 className="cs-group-title cs-group-title-clickable cs-group-approved" onClick={onToggle}>
        <svg className="cs-group-title-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Approved and in progress</span>
        <span className="cs-group-title-count">{items.length}</span>
        <svg className="cs-group-title-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </h2>}
      {(expanded || standalone) && (
        <section className="tr-card">
          {!standalone && <div className="tr-summary">
            {STAGES.map(s => (
              <div key={s.id} className={`tr-summary-stat tr-summary-${s.id}`}>
                <div className="tr-summary-num">{count(s.id)}</div>
                <div className="tr-summary-label">{s.label}</div>
              </div>
            ))}
          </div>}
          {items.length === 0 && <div className="tr-empty">Nothing at this stage right now.</div>}
          <ul className="tr-list">
            {items.map(item => {
              const f = fulfillment[item.id] ?? { stage: 'approved' as const, dates: {} };
              return (
                <li key={item.id} className={`tr-row ${onOpenItem ? 'tr-row-link' : ''}`} onClick={() => onOpenItem?.(item.id)} role={onOpenItem ? 'button' : undefined} tabIndex={onOpenItem ? 0 : undefined} onKeyDown={e => { if (onOpenItem && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpenItem(item.id); } }} aria-label={onOpenItem ? `${item.name}, ${STAGES[STAGES.findIndex(x => x.id === f.stage)].label}. Open details` : undefined}>
                  <div className="tr-item">
                    <div className="tr-thumb" style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }} />
                    <div className="tr-item-text">
                      <div className="tr-item-name">{item.name}</div>
                      <div className="tr-item-meta">{item.groupName}{item.group ? ` · ${item.group}` : ''}</div>
                      {f.note && <div className="tr-item-note">{f.note}</div>}
                    </div>
                  </div>
                  <StagePill f={f} />
                  {onOpenItem && (
                    <svg className="tr-row-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

export function stageCounts(groups: Group[], fulfillment: Record<string, Fulfillment>) {
  const ids = groups.flatMap(g => g.options.map(o => o.id));
  const c: Record<FulfillmentStage, number> = { approved: 0, ordered: 0, delivered: 0, installed: 0 };
  ids.forEach(id => { c[fulfillment[id]?.stage ?? 'approved']++; });
  return { total: ids.length, ...c };
}

// Order status for the item detail panel: current stage, note, full timeline
export function OrderStatus({ f }: { f: Fulfillment }) {
  const delayed = !!f.note && /delay|backorder/i.test(f.note);
  return (
    <section className="tr-detail">
      <div className="tr-detail-head">
        <h3 className="od-section-title" style={{ margin: 0 }}>Order status</h3>
        <StagePill f={f} />
      </div>
      {f.note && <div className={`tr-detail-note ${delayed ? 'tr-detail-note-delayed' : ''}`}>{f.note}</div>}
      <Stepper f={f} />
    </section>
  );
}
