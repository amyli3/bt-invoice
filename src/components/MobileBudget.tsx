import { useState, useMemo } from 'react';

type Status = 'over' | 'on' | 'under';
type FilterKey = 'all' | 'over' | 'unbilled' | 'committed';

interface CostLine {
  id: string;
  type: 'bill' | 'po' | 'receipt' | 'labor';
  vendor: string;
  date: string;
  amount: number;
  note?: string;
}

interface CostCode {
  id: string;
  code: string;
  name: string;
  emoji: string;
  budget: number;
  actual: number;
  committed: number;
  unbilled: number;
  lines: CostLine[];
}

const COST_CODES: CostCode[] = [
  {
    id: 'cc-1', code: '4100', name: 'Framing', emoji: '🪵',
    budget: 28000, actual: 31200, committed: 2400, unbilled: 1100,
    lines: [
      { id: 'l1', type: 'bill', vendor: 'Heartland Lumber', date: 'Today', amount: 14820, note: 'Lumber package — phase 1' },
      { id: 'l2', type: 'bill', vendor: 'Heartland Lumber', date: 'Yesterday', amount: 9650, note: 'Engineered beams' },
      { id: 'l3', type: 'labor', vendor: 'Cody\'s Framing Crew', date: 'May 3', amount: 6730, note: 'Week 18 labor' },
      { id: 'l4', type: 'po', vendor: 'Heartland Lumber', date: 'May 5', amount: 2400, note: 'PO open — fasteners + blocking' },
    ],
  },
  {
    id: 'cc-2', code: '6100', name: 'Drywall', emoji: '🧱',
    budget: 11000, actual: 12450, committed: 0, unbilled: 0,
    lines: [
      { id: 'l5', type: 'bill', vendor: 'Allied Drywall', date: 'Apr 28', amount: 8200, note: 'Hang + tape' },
      { id: 'l6', type: 'bill', vendor: 'Allied Drywall', date: 'May 2', amount: 4250, note: 'Texture + finish' },
    ],
  },
  {
    id: 'cc-3', code: '8200', name: 'Cabinets', emoji: '🪟',
    budget: 18500, actual: 12300, committed: 5200, unbilled: 0,
    lines: [
      { id: 'l7', type: 'bill', vendor: 'Foothills Cabinetry', date: 'Apr 14', amount: 12300, note: 'Deposit + uppers delivered' },
      { id: 'l8', type: 'po', vendor: 'Foothills Cabinetry', date: 'May 10', amount: 5200, note: 'Final balance on install' },
    ],
  },
  {
    id: 'cc-4', code: '9100', name: 'Flooring', emoji: '🪜',
    budget: 9800, actual: 4200, committed: 4800, unbilled: 0,
    lines: [
      { id: 'l9', type: 'bill', vendor: 'Pacific Floors', date: 'Apr 30', amount: 4200, note: 'Hardwood — main floor' },
      { id: 'l10', type: 'po', vendor: 'Pacific Floors', date: 'May 12', amount: 4800, note: 'Tile + install' },
    ],
  },
  {
    id: 'cc-5', code: '7400', name: 'Plumbing', emoji: '🚰',
    budget: 14200, actual: 13900, committed: 0, unbilled: 850,
    lines: [
      { id: 'l11', type: 'bill', vendor: 'Northgate Plumbing', date: 'Apr 18', amount: 8400, note: 'Rough-in' },
      { id: 'l12', type: 'bill', vendor: 'Northgate Plumbing', date: 'May 1', amount: 5500, note: 'Fixtures + trim' },
      { id: 'l13', type: 'receipt', vendor: 'Home Depot', date: 'May 4', amount: 850, note: 'Unbilled — shut-off valves' },
    ],
  },
  {
    id: 'cc-6', code: '7500', name: 'Electrical', emoji: '💡',
    budget: 12500, actual: 7800, committed: 3500, unbilled: 0,
    lines: [
      { id: 'l14', type: 'bill', vendor: 'Bright Spark Electric', date: 'Apr 20', amount: 7800, note: 'Rough-in' },
      { id: 'l15', type: 'po', vendor: 'Bright Spark Electric', date: 'May 14', amount: 3500, note: 'Trim out + fixtures' },
    ],
  },
  {
    id: 'cc-7', code: '4500', name: 'Roofing', emoji: '🏠',
    budget: 16200, actual: 16100, committed: 0, unbilled: 0,
    lines: [
      { id: 'l16', type: 'bill', vendor: 'Summit Roofing', date: 'Apr 12', amount: 16100, note: 'Tear-off + new install' },
    ],
  },
  {
    id: 'cc-8', code: '8400', name: 'Paint', emoji: '🎨',
    budget: 6800, actual: 0, committed: 6800, unbilled: 0,
    lines: [
      { id: 'l17', type: 'po', vendor: 'TrueColor Painting', date: 'May 18', amount: 6800, note: 'Interior + exterior' },
    ],
  },
];

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1000) return `$${(n / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  return `$${n.toLocaleString()}`;
};
const fmtFull = (n: number) => `$${Math.abs(n).toLocaleString()}`;

function statusOf(c: CostCode): Status {
  const variance = c.budget - (c.actual + c.committed);
  if (variance < -200) return 'over';
  if (variance < c.budget * 0.05) return 'on';
  return 'under';
}

const iOSColors = {
  red: '#FF3B30',
  redBg: '#FFE5E3',
  green: '#34C759',
  greenBg: '#E2F8E8',
  yellow: '#FF9500',
  yellowBg: '#FFEFD9',
  blue: '#007AFF',
  blueBg: '#E1EFFF',
  gray: '#8E8E93',
  separator: 'rgba(60,60,67,0.12)',
  systemGroupedBg: '#F2F2F7',
  systemBg: '#FFFFFF',
  label: '#000000',
  secondaryLabel: 'rgba(60,60,67,0.6)',
  tertiaryLabel: 'rgba(60,60,67,0.3)',
  fill: 'rgba(118,118,128,0.12)',
};

const STATUS_COLOR: Record<Status, { fg: string; bg: string }> = {
  over: { fg: iOSColors.red, bg: iOSColors.redBg },
  on: { fg: iOSColors.yellow, bg: iOSColors.yellowBg },
  under: { fg: iOSColors.green, bg: iOSColors.greenBg },
};

export default function MobileBudget({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'budget' | 'schedule' | 'files' | 'more'>('budget');

  const totals = useMemo(() => {
    const budget = COST_CODES.reduce((s, c) => s + c.budget, 0);
    const actual = COST_CODES.reduce((s, c) => s + c.actual, 0);
    const committed = COST_CODES.reduce((s, c) => s + c.committed, 0);
    const variance = budget - actual - committed;
    return { budget, actual, committed, variance };
  }, []);

  const filtered = useMemo(() => {
    let list = [...COST_CODES];
    if (filter === 'over') list = list.filter(c => statusOf(c) === 'over');
    if (filter === 'unbilled') list = list.filter(c => c.unbilled > 0);
    if (filter === 'committed') list = list.filter(c => c.committed > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q));
    }
    list.sort((a, b) => {
      const sa = statusOf(a), sb = statusOf(b);
      const order: Record<Status, number> = { over: 0, on: 1, under: 2 };
      if (sa !== sb) return order[sa] - order[sb];
      return (b.actual + b.committed - b.budget) - (a.actual + a.committed - a.budget);
    });
    return list;
  }, [filter, search]);

  const overallStatus: Status = totals.variance < -500 ? 'over' : totals.variance < totals.budget * 0.05 ? 'on' : 'under';
  const heroColor = STATUS_COLOR[overallStatus];

  return (
    <div style={styles.page}>
      <div style={styles.frame}>
        {/* Status bar */}
        <div style={styles.statusBar}>
          <span style={styles.statusTime}>9:41</span>
          <div style={styles.dynamicIsland} />
          <div style={styles.statusRight}>
            {/* Signal */}
            <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
              <rect x="0" y="7" width="3" height="4" rx="0.8" fill="#000" />
              <rect x="5" y="5" width="3" height="6" rx="0.8" fill="#000" />
              <rect x="10" y="3" width="3" height="8" rx="0.8" fill="#000" />
              <rect x="15" y="0" width="3" height="11" rx="0.8" fill="#000" />
            </svg>
            {/* Wifi */}
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <path d="M8 9.5C8.6 9.5 9 9.1 9 8.5C9 7.9 8.6 7.5 8 7.5C7.4 7.5 7 7.9 7 8.5C7 9.1 7.4 9.5 8 9.5Z" fill="#000" />
              <path d="M3.5 5C4.7 3.8 6.3 3 8 3C9.7 3 11.3 3.8 12.5 5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M0.5 2.2C2.6 0.8 5.2 0 8 0C10.8 0 13.4 0.8 15.5 2.2" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </svg>
            {/* Battery */}
            <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
              <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="#000" strokeOpacity="0.4" fill="none" />
              <rect x="2" y="2" width="19" height="8" rx="1.6" fill="#000" />
              <rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="#000" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Scroll content */}
        <div style={styles.scroll}>
          {/* Large title nav */}
          <div style={styles.navBar}>
            <button style={styles.backInline} onClick={onBack}>
              <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                <path d="M10 2L2 10L10 18" stroke={iOSColors.blue} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Jobs</span>
            </button>
            <button style={styles.navAdd} onClick={() => setLogOpen(true)} aria-label="Log cost">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 4V18M4 11H18" stroke={iOSColors.blue} strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div style={styles.largeTitleWrap}>
            <div style={styles.largeTitle}>Budget</div>
            <div style={styles.largeTitleSub}>Maple Ridge Custom</div>
          </div>

          {/* Search */}
          <div style={styles.searchWrap}>
            <div style={styles.searchInner}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke={iOSColors.gray} strokeWidth="1.8" />
                <path d="M11 11L14.5 14.5" stroke={iOSColors.gray} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                style={styles.search}
                placeholder="Search cost codes"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Hero status card */}
          <div style={styles.section}>
            <div style={{ ...styles.heroCard, background: `linear-gradient(180deg, ${heroColor.bg} 0%, #fff 70%)` }}>
              <div style={{ ...styles.heroPill, color: heroColor.fg }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: heroColor.fg, display: 'inline-block' }} />
                {overallStatus === 'over' ? `Over by ${fmtFull(totals.variance)}` : overallStatus === 'on' ? 'On budget' : `Under by ${fmtFull(totals.variance)}`}
              </div>
              <div style={styles.heroNumber}>
                {fmt(totals.actual + totals.committed)}
                <span style={styles.heroNumberOf}> of {fmt(totals.budget)}</span>
              </div>
              <div style={styles.heroLabel}>Spent + committed</div>

              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${(totals.actual / totals.budget) * 100}%`, background: iOSColors.label }} />
                <div style={{ ...styles.progressFill, width: `${(totals.committed / totals.budget) * 100}%`, background: iOSColors.gray, left: `${(totals.actual / totals.budget) * 100}%` }} />
              </div>

              <div style={styles.heroStats}>
                <div style={styles.heroStat}>
                  <div style={styles.heroStatVal}>{fmt(totals.actual)}</div>
                  <div style={styles.heroStatLabel}>Actual</div>
                </div>
                <div style={styles.heroStatDivider} />
                <div style={styles.heroStat}>
                  <div style={styles.heroStatVal}>{fmt(totals.committed)}</div>
                  <div style={styles.heroStatLabel}>Committed</div>
                </div>
                <div style={styles.heroStatDivider} />
                <div style={styles.heroStat}>
                  <div style={styles.heroStatVal}>{fmt(totals.budget - totals.actual - totals.committed)}</div>
                  <div style={styles.heroStatLabel}>Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented filter */}
          <div style={styles.segmentWrap}>
            <div style={styles.segment}>
              {([
                ['all', 'All'],
                ['over', 'Over'],
                ['unbilled', 'Unbilled'],
                ['committed', 'POs'],
              ] as [FilterKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    ...styles.segmentBtn,
                    ...(filter === key ? styles.segmentBtnActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Section header */}
          <div style={styles.sectionHeader}>COST CODES</div>

          {/* Inset grouped list */}
          <div style={styles.section}>
            <div style={styles.list}>
              {filtered.length === 0 && (
                <div style={styles.empty}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>✨</div>
                  <div style={styles.emptyTitle}>No results</div>
                </div>
              )}
              {filtered.map((c, idx) => {
                const status = statusOf(c);
                const color = STATUS_COLOR[status];
                const variance = c.budget - c.actual - c.committed;
                const spentPct = Math.min(100, (c.actual / c.budget) * 100);
                const committedPct = Math.min(100 - spentPct, (c.committed / c.budget) * 100);
                const overPct = c.actual + c.committed > c.budget ? Math.min(100, ((c.actual + c.committed - c.budget) / c.budget) * 100) : 0;
                const isOpen = expandedId === c.id;
                const isLast = idx === filtered.length - 1;

                return (
                  <div key={c.id}>
                    <div style={styles.row}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : c.id)}
                        style={styles.rowHeader}
                      >
                        <div style={styles.rowEmoji}>{c.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={styles.rowTitle}>{c.name}</div>
                          <div style={styles.rowSub}>
                            {c.code} · {c.lines.length} {c.lines.length === 1 ? 'item' : 'items'}
                            {c.unbilled > 0 && <span style={{ color: iOSColors.yellow, fontWeight: 600 }}> · {fmt(c.unbilled)} unbilled</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ ...styles.rowVariance, color: color.fg }}>
                            {variance < 0 ? '−' : variance === 0 ? '' : '+'}{fmt(Math.abs(variance))}
                          </div>
                          <div style={styles.rowVarianceLabel}>
                            {variance < 0 ? 'over' : variance === 0 ? 'on' : 'left'}
                          </div>
                        </div>
                        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" style={{ marginLeft: 6, opacity: 0.3, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          <path d="M1 1L7 6.5L1 12" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      <div style={styles.rowBar}>
                        <div style={{ ...styles.rowBarSeg, width: `${spentPct}%`, background: iOSColors.label }} />
                        <div style={{ ...styles.rowBarSeg, width: `${committedPct}%`, background: iOSColors.gray, left: `${spentPct}%` }} />
                        {overPct > 0 && (
                          <div style={{ ...styles.rowBarSeg, width: `${overPct}%`, background: iOSColors.red, position: 'absolute', right: 0 }} />
                        )}
                      </div>

                      {isOpen && (
                        <div style={styles.rowExpand}>
                          <div style={styles.miniGrid}>
                            <div style={styles.miniStat}>
                              <div style={styles.miniStatLabel}>Budget</div>
                              <div style={styles.miniStatVal}>{fmtFull(c.budget)}</div>
                            </div>
                            <div style={styles.miniStat}>
                              <div style={styles.miniStatLabel}>Actual</div>
                              <div style={styles.miniStatVal}>{fmtFull(c.actual)}</div>
                            </div>
                            <div style={styles.miniStat}>
                              <div style={styles.miniStatLabel}>Committed</div>
                              <div style={styles.miniStatVal}>{fmtFull(c.committed)}</div>
                            </div>
                          </div>

                          <div style={styles.activityHeader}>ACTIVITY</div>
                          <div style={styles.lines}>
                            {c.lines.map((l, li) => (
                              <div key={l.id} style={{ ...styles.line, ...(li === c.lines.length - 1 ? { borderBottom: 'none' } : {}) }}>
                                <div style={{ ...styles.lineBadge, background: BADGE[l.type].bg, color: BADGE[l.type].fg }}>
                                  {BADGE[l.type].label}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={styles.lineVendor}>{l.vendor}</div>
                                  <div style={styles.lineNote}>{l.note}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={styles.lineAmt}>{fmtFull(l.amount)}</div>
                                  <div style={styles.lineDate}>{l.date}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={styles.rowActions}>
                            <button style={styles.actionPrimary} onClick={() => setLogOpen(true)}>+ Log cost</button>
                            <button style={styles.actionSecondary}>Open details</button>
                          </div>
                        </div>
                      )}
                    </div>
                    {!isLast && <div style={styles.rowDivider} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ height: 100 }} />
        </div>

        {/* Tab bar */}
        <div style={styles.tabBar}>
          {([
            ['home', 'Home', 'M3 11L12 3L21 11M5 10V20H19V10'],
            ['budget', 'Budget', 'M3 12L8 7L13 12L21 4M14 4H21V11'],
            ['schedule', 'Schedule', 'M5 4H19A2 2 0 0 1 21 6V20A2 2 0 0 1 19 22H5A2 2 0 0 1 3 20V6A2 2 0 0 1 5 4ZM3 10H21M8 2V6M16 2V6'],
            ['files', 'Files', 'M14 3V8H19M5 3H14L19 8V19A2 2 0 0 1 17 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3Z'],
            ['more', 'More', 'M5 12H5.01M12 12H12.01M19 12H19.01'],
          ] as ['home' | 'budget' | 'schedule' | 'files' | 'more', string, string][]).map(([key, label, path]) => (
            <button
              key={key}
              style={styles.tabItem}
              onClick={() => setActiveTab(key)}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d={path} stroke={activeTab === key ? iOSColors.blue : iOSColors.gray} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ ...styles.tabLabel, color: activeTab === key ? iOSColors.blue : iOSColors.gray }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Home indicator */}
        <div style={styles.homeIndicatorWrap}>
          <div style={styles.homeIndicator} />
        </div>

        {/* iOS bottom sheet — Log cost */}
        {logOpen && (
          <>
            <div style={styles.sheetBackdrop} onClick={() => setLogOpen(false)} />
            <div style={styles.sheet}>
              <div style={styles.sheetHandle} />
              <div style={styles.sheetHeader}>
                <button style={styles.sheetCancelBtn} onClick={() => setLogOpen(false)}>Cancel</button>
                <div style={styles.sheetTitle}>Log cost</div>
                <button style={styles.sheetSaveBtn} onClick={() => setLogOpen(false)}>Save</button>
              </div>

              <div style={styles.sheetBody}>
                <button style={styles.scanBtn}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9V7A2 2 0 0 1 5 5H7M21 9V7A2 2 0 0 0 19 5H17M3 15V17A2 2 0 0 0 5 19H7M21 15V17A2 2 0 0 1 19 19H17M9 9H15V15H9Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Scan receipt
                </button>

                <div style={styles.formGroup}>
                  <div style={styles.formRow}>
                    <span style={styles.formLabel}>Cost code</span>
                    <select style={styles.formInput} defaultValue="">
                      <option value="" disabled>Choose</option>
                      {COST_CODES.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                    </select>
                  </div>
                  <div style={styles.formDivider} />
                  <div style={styles.formRow}>
                    <span style={styles.formLabel}>Vendor</span>
                    <input style={styles.formInput} placeholder="e.g. Heartland Lumber" />
                  </div>
                  <div style={styles.formDivider} />
                  <div style={styles.formRow}>
                    <span style={styles.formLabel}>Amount</span>
                    <input style={styles.formInput} placeholder="$0.00" inputMode="decimal" />
                  </div>
                  <div style={styles.formDivider} />
                  <div style={styles.formRow}>
                    <span style={styles.formLabel}>Note</span>
                    <input style={styles.formInput} placeholder="Optional" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const BADGE: Record<CostLine['type'], { label: string; bg: string; fg: string }> = {
  bill: { label: 'Bill', bg: iOSColors.blueBg, fg: iOSColors.blue },
  po: { label: 'PO', bg: iOSColors.fill, fg: iOSColors.secondaryLabel as string },
  receipt: { label: 'Receipt', bg: iOSColors.yellowBg, fg: iOSColors.yellow },
  labor: { label: 'Labor', bg: iOSColors.greenBg, fg: iOSColors.green },
};

const SF_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1c1c1e 0%, #000 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: SF_FONT,
    color: iOSColors.label,
  },
  frame: {
    height: 'min(932px, calc(100vh - 48px))',
    width: 'min(430px, calc((100vh - 48px) * 430 / 932))',
    background: iOSColors.systemGroupedBg,
    borderRadius: 55,
    boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), 0 0 0 7px #0a0a0a, 0 0 0 9px #303034',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  statusBar: {
    height: 50,
    padding: '14px 28px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: iOSColors.systemGroupedBg,
    flexShrink: 0,
    position: 'relative',
  },
  statusTime: {
    fontSize: 17,
    fontWeight: 600,
    fontFamily: SF_FONT,
    width: 80,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 11,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 124,
    height: 36,
    background: '#000',
    borderRadius: 20,
  },
  statusRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    width: 80,
    justifyContent: 'flex-end',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    background: iOSColors.systemGroupedBg,
    WebkitOverflowScrolling: 'touch',
  },
  navBar: {
    height: 44,
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: iOSColors.systemGroupedBg,
  },
  backInline: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'transparent',
    border: 'none',
    color: iOSColors.blue,
    fontSize: 17,
    fontFamily: SF_FONT,
    cursor: 'pointer',
    padding: '6px 8px',
  },
  navAdd: {
    width: 44, height: 44,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  largeTitleWrap: {
    padding: '4px 16px 8px',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    fontFamily: SF_FONT,
  },
  largeTitleSub: {
    fontSize: 15,
    color: iOSColors.secondaryLabel,
    marginTop: 3,
    fontFamily: SF_FONT,
  },
  searchWrap: {
    padding: '8px 16px 12px',
  },
  searchInner: {
    height: 36,
    background: iOSColors.fill,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 0 10px',
    gap: 6,
  },
  search: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 17,
    fontFamily: SF_FONT,
    color: iOSColors.label,
    height: '100%',
  },
  section: {
    padding: '0 16px',
  },
  heroCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '16px 16px 14px',
    marginBottom: 4,
  },
  heroPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 11px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    border: '0.5px solid rgba(0,0,0,0.06)',
    marginBottom: 12,
    fontFamily: SF_FONT,
  },
  heroNumber: {
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1.05,
    fontFamily: SF_FONT,
  },
  heroNumberOf: {
    fontSize: 19,
    color: iOSColors.secondaryLabel,
    fontWeight: 500,
  },
  heroLabel: {
    fontSize: 13,
    color: iOSColors.secondaryLabel,
    marginTop: 2,
    fontFamily: SF_FONT,
  },
  progressTrack: {
    position: 'relative',
    height: 6,
    background: iOSColors.fill,
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    borderRadius: 999,
  },
  heroStats: {
    display: 'flex',
    marginTop: 14,
    paddingTop: 12,
    borderTop: `0.5px solid ${iOSColors.separator}`,
  },
  heroStat: {
    flex: 1,
    textAlign: 'center',
  },
  heroStatDivider: {
    width: 0.5,
    background: iOSColors.separator,
  },
  heroStatVal: {
    fontSize: 17,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    fontFamily: SF_FONT,
  },
  heroStatLabel: {
    fontSize: 11,
    color: iOSColors.secondaryLabel,
    marginTop: 2,
    fontFamily: SF_FONT,
  },
  segmentWrap: {
    padding: '14px 16px 4px',
  },
  segment: {
    display: 'flex',
    background: iOSColors.fill,
    borderRadius: 9,
    padding: 2,
    gap: 0,
  },
  segmentBtn: {
    flex: 1,
    height: 30,
    border: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 500,
    color: iOSColors.label,
    cursor: 'pointer',
    fontFamily: SF_FONT,
    borderRadius: 7,
  },
  segmentBtnActive: {
    background: '#fff',
    fontWeight: 600,
    boxShadow: '0 3px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 400,
    color: iOSColors.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: '-0.01em',
    padding: '20px 32px 6px',
    fontFamily: SF_FONT,
  },
  list: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    background: '#fff',
  },
  rowHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '11px 16px 9px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: SF_FONT,
    textAlign: 'left',
  },
  rowDivider: {
    height: 0.5,
    background: iOSColors.separator,
    marginLeft: 60,
  },
  rowEmoji: {
    width: 36, height: 36,
    borderRadius: 9,
    background: iOSColors.fill,
    fontSize: 19,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: iOSColors.label,
    fontFamily: SF_FONT,
    letterSpacing: '-0.01em',
  },
  rowSub: {
    fontSize: 13,
    color: iOSColors.secondaryLabel,
    marginTop: 1,
    fontFamily: SF_FONT,
  },
  rowVariance: {
    fontSize: 16,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    fontFamily: SF_FONT,
  },
  rowVarianceLabel: {
    fontSize: 11,
    color: iOSColors.secondaryLabel,
    marginTop: 1,
    fontFamily: SF_FONT,
  },
  rowBar: {
    position: 'relative',
    height: 3,
    background: iOSColors.fill,
    margin: '0 16px 12px',
    borderRadius: 999,
    overflow: 'hidden',
  },
  rowBarSeg: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    borderRadius: 999,
  },
  rowExpand: {
    padding: '4px 16px 16px',
    background: iOSColors.systemGroupedBg,
    margin: '0 -1px',
  },
  miniGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  miniStat: {
    background: '#fff',
    padding: '8px 10px',
    borderRadius: 9,
  },
  miniStatLabel: {
    fontSize: 11,
    color: iOSColors.secondaryLabel,
    fontFamily: SF_FONT,
  },
  miniStatVal: {
    fontSize: 15,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    marginTop: 2,
    fontFamily: SF_FONT,
  },
  activityHeader: {
    fontSize: 13,
    color: iOSColors.secondaryLabel,
    textTransform: 'uppercase',
    paddingLeft: 4,
    marginBottom: 6,
    fontFamily: SF_FONT,
  },
  lines: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  line: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 14px',
    borderBottom: `0.5px solid ${iOSColors.separator}`,
  },
  lineBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '3px 7px',
    borderRadius: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    flexShrink: 0,
    marginTop: 2,
    fontFamily: SF_FONT,
  },
  lineVendor: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: SF_FONT,
  },
  lineNote: {
    fontSize: 12,
    color: iOSColors.secondaryLabel,
    marginTop: 1,
    fontFamily: SF_FONT,
  },
  lineDate: {
    fontSize: 11,
    color: iOSColors.tertiaryLabel,
    marginTop: 2,
    fontFamily: SF_FONT,
  },
  lineAmt: {
    fontSize: 14,
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
    fontFamily: SF_FONT,
  },
  rowActions: {
    display: 'flex',
    gap: 8,
    marginTop: 14,
  },
  actionPrimary: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    background: iOSColors.blue,
    color: '#fff',
    border: 'none',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: SF_FONT,
  },
  actionSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    background: '#fff',
    color: iOSColors.blue,
    border: 'none',
    fontWeight: 500,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: SF_FONT,
  },
  empty: {
    padding: '40px 16px',
    textAlign: 'center',
    background: '#fff',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: SF_FONT,
  },
  tabBar: {
    height: 83,
    background: 'rgba(255,255,255,0.94)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: `0.5px solid ${iOSColors.separator}`,
    display: 'flex',
    paddingBottom: 28,
    flexShrink: 0,
  },
  tabItem: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '6px 0 0',
    fontFamily: SF_FONT,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 500,
    fontFamily: SF_FONT,
  },
  homeIndicatorWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 24,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 9,
    pointerEvents: 'none',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 999,
    background: '#000',
  },
  sheetBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    background: iOSColors.systemGroupedBg,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 28,
    zIndex: 11,
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHandle: {
    width: 36, height: 5,
    borderRadius: 999,
    background: 'rgba(60,60,67,0.3)',
    margin: '6px auto 4px',
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px 6px',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: 600,
    fontFamily: SF_FONT,
  },
  sheetCancelBtn: {
    background: 'transparent',
    border: 'none',
    color: iOSColors.blue,
    fontSize: 17,
    fontWeight: 400,
    cursor: 'pointer',
    fontFamily: SF_FONT,
    padding: 0,
  },
  sheetSaveBtn: {
    background: 'transparent',
    border: 'none',
    color: iOSColors.blue,
    fontSize: 17,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: SF_FONT,
    padding: 0,
  },
  sheetBody: {
    padding: '16px',
    overflowY: 'auto',
  },
  scanBtn: {
    width: '100%',
    height: 52,
    background: iOSColors.label,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: SF_FONT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  formGroup: {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '11px 16px',
    gap: 12,
  },
  formLabel: {
    fontSize: 17,
    color: iOSColors.label,
    fontFamily: SF_FONT,
    width: 100,
    flexShrink: 0,
  },
  formInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 17,
    fontFamily: SF_FONT,
    color: iOSColors.label,
    textAlign: 'right',
    appearance: 'none' as any,
  },
  formDivider: {
    height: 0.5,
    background: iOSColors.separator,
    marginLeft: 16,
  },
};
