import { useState } from 'react';

/* ── Mock Data ── */

const originalContractPrice = 568078;
const changeOrdersTotal = 1200;
const approvedSelectionsTotal = 1360;
const revisedClientPrice = 570638;

const paymentsReceived = 99000;
const creditMemos = 1000;
const remainingBalance = revisedClientPrice - paymentsReceived - creditMemos;

const pendingSelectionsAmt = 10000;
const pendingChangeOrders = 1000;
const forecastedAdditional = pendingSelectionsAmt + pendingChangeOrders;

interface SelectionItem {
  name: string;
  category: string;
  date: string;
  price: number;
  impact: number; // +/- on contract price
  allowanceName?: string;
  allowanceBudget?: number;
  allowanceUsed?: number; // cumulative used of that allowance after this selection
  allowanceFromCO?: string; // if this allowance originated from a Change Order
  status: 'approved' | 'pending';
  timing?: 'pre-contract' | 'post-contract';
}

const allSelections: SelectionItem[] = [
  // Kitchen
  { name: 'Natural Select Red Oak Smooth Solid Hardwood', category: 'Kitchen', date: 'Oct 15, 2024', price: 4000, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4000, status: 'approved' },
  { name: 'Belwith Keeler Coventry Cabinet w/ Drawer Pull Handle', category: 'Kitchen', date: 'Oct 19, 2024', price: 200, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4200, status: 'approved' },
  { name: 'Valencia Edge 6 ft. Laminate Countertop', category: 'Kitchen', date: 'Oct 30, 2024', price: 500, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4700, status: 'approved' },
  { name: 'Granite Backsplash Upgrade', category: 'Kitchen', date: '', price: 2100, impact: 1800, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 6800, status: 'pending' },

  // Bathroom
  { name: 'Two Handle Center set Bathroom Sink Faucet in Chrome', category: 'Bathroom', date: 'Nov 1, 2024', price: 100, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 100, status: 'approved' },
  { name: 'DeerValley Smart Bidet Toilet Sensor Auto', category: 'Bathroom', date: 'Nov 3, 2024', price: 700, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 800, status: 'approved' },
  { name: 'Kohler Forte 1.75 GPM Multi-Function Shower Head', category: 'Bathroom', date: 'Nov 4, 2024', price: 100, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 900, status: 'approved' },

  // Porch fixtures allowance (from CO #3: Add screened porch)
  { name: 'Outdoor ceiling fan', category: 'Exterior', date: 'Dec 1, 2024', price: 800, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 800, allowanceFromCO: 'Add screened porch', status: 'approved' },
  { name: 'Porch pendant lighting (2x)', category: 'Exterior', date: 'Dec 3, 2024', price: 1200, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 2000, allowanceFromCO: 'Add screened porch', status: 'approved' },
  { name: 'Outlet covers and switch plates', category: 'Exterior', date: 'Dec 5, 2024', price: 400, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 2400, allowanceFromCO: 'Add screened porch', status: 'approved' },

  // Standalone selections — pre-contract (included in original price)
  { name: 'Shower Floor Tile — Marble Upgrade', category: 'Exterior', date: 'Oct 2, 2024', price: 480, impact: 0, status: 'approved', timing: 'pre-contract' },
  { name: 'Upgraded front door hardware', category: 'Exterior', date: 'Oct 5, 2024', price: 350, impact: 0, status: 'approved', timing: 'pre-contract' },

  // Standalone selections — post-contract (changes after contract signed)
  { name: 'Garage Door Upgrade — Insulated', category: 'Exterior', date: '', price: 2262, impact: 2262, status: 'pending', timing: 'post-contract' },
  { name: 'Heated Tile Floor System', category: 'Bathroom', date: '', price: 3200, impact: 3200, status: 'pending', timing: 'post-contract' },
  { name: 'Recessed lighting package', category: 'Kitchen', date: 'Nov 15, 2024', price: 1800, impact: 1800, status: 'approved', timing: 'post-contract' },
];

interface ChangeOrder {
  name: string;
  date: string;
  price: number;
  status: 'approved' | 'pending';
  includesAllowance?: { name: string; budget: number };
}

const changeOrders: ChangeOrder[] = [
  { name: 'Add covered patio', date: 'Oct 20, 2024', price: 4200, status: 'approved' },
  { name: 'Upgrade electrical panel', date: 'Nov 12, 2024', price: 1800, status: 'approved' },
  { name: 'Add screened porch', date: 'Nov 20, 2024', price: 15000, status: 'approved', includesAllowance: { name: 'Porch fixtures', budget: 3000 } },
  { name: 'Add mudroom bench', date: '', price: 1000, status: 'pending' },
];

// Derive allowance groups (allowance name → items under it)
const allowanceNames = [...new Set(allSelections.filter(s => s.allowanceName).map(s => s.allowanceName!))];
const allowanceGroups = allowanceNames.map(name => {
  const items = allSelections.filter(s => s.allowanceName === name);
  const budget = items[0]?.allowanceBudget || 0;
  const maxUsed = Math.max(...items.map(i => i.allowanceUsed || 0));
  const fromCO = items[0]?.allowanceFromCO;
  return { name, budget, used: maxUsed, items, fromCO };
});

// CO-linked allowance summaries for inline display
const coAllowanceSummaries = new Map<string, { budget: number; used: number; remaining: number }>();
allSelections.filter(s => s.allowanceFromCO).forEach(s => {
  const key = s.allowanceFromCO!;
  const existing = coAllowanceSummaries.get(key);
  if (!existing) {
    coAllowanceSummaries.set(key, { budget: s.allowanceBudget!, used: s.allowanceUsed!, remaining: s.allowanceBudget! - s.allowanceUsed! });
  } else if (s.allowanceUsed! > existing.used) {
    existing.used = s.allowanceUsed!;
    existing.remaining = s.allowanceBudget! - s.allowanceUsed!;
  }
});

// Standalone selections (no allowance), split by timing
const preContractSelections = allSelections.filter(s => !s.allowanceName && s.timing === 'pre-contract');
const postContractSelections = allSelections.filter(s => !s.allowanceName && s.timing === 'post-contract');

const hasPendingItems = allSelections.some(s => s.status === 'pending') || changeOrders.some(c => c.status === 'pending');

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtSigned = (n: number) => (n > 0 ? '+' : '') + fmt(n);

/* ── Component ── */

export default function JobPriceSummary({ jobOpen, onToggleJob, onOpenSelection }: { jobOpen?: boolean; onToggleJob?: () => void; onOpenSelection?: (sel: { name: string; category: string; price: number; allowanceName?: string; status: string }) => void }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    allowanceNames.forEach(n => init[n] = true);
    init['__pre-contract__'] = true;
    init['__post-contract__'] = true;
    return init;
  });
  const [showCOs, setShowCOs] = useState(true);
  const [viewFilter, setViewFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [pricingMode, setPricingMode] = useState<'fixed' | 'openbook'>('fixed');

  const toggleGroup = (name: string) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const paidPct = (paymentsReceived / revisedClientPrice * 100);
  const creditPct = (creditMemos / revisedClientPrice * 100);

  return (
    <div className="jps-page">
      {/* Page header */}
      <div className="pg-hdr">
        <div className="pg-accent"></div>
        <div className="pg-hdr-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!jobOpen && onToggleJob && (
              <button onClick={onToggleJob} style={{background: 'none', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer', color: 'var(--g500)', fontSize: 16, display: 'flex', alignItems: 'center', lineHeight: 1}}>
                &#9776;
              </button>
            )}
            <div>
              <div className="pg-hdr-sub">8200 Pineview Custom</div>
              <div className="pg-title">Job Price Summary</div>
            </div>
          </div>
          <div className="pg-hdr-right">
            <div className="jps-pricing-toggle">
              <button className={`jps-pricing-btn ${pricingMode === 'fixed' ? 'jps-pricing-btn-on' : ''}`} onClick={() => setPricingMode('fixed')}>Fixed Price</button>
              <button className={`jps-pricing-btn ${pricingMode === 'openbook' ? 'jps-pricing-btn-on' : ''}`} onClick={() => setPricingMode('openbook')}>Open Book</button>
            </div>
            <button className="btn btn-s">Send</button>
            <button className="btn btn-p">Print</button>
          </div>
        </div>
      </div>

      <div className="jps-body">

        {/* ═══ Three summary cards ═══ */}
        <div className="jps-cards-row">
          {/* Card 1: Revised client price */}
          <div className="jps-card jps-card-revised">
            <div className="jps-card-label jps-popover-wrap">
              <span className="jps-underline-hint">Revised client price</span>
              <div className="jps-popover">
                <div>Projected costs</div>
                <div>− builder variance</div>
                <div>+ markup/margin</div>
              </div>
            </div>
            <div className="jps-card-value-big">{fmt(revisedClientPrice)}</div>
            <div className="jps-card-breakdown">
              <div className="jps-breakdown-line">
                <span>Original client price</span>
                <span>{fmt(originalContractPrice)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-parent">
                <span>Approved changes</span>
                <span>{fmt(changeOrdersTotal + approvedSelectionsTotal)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-nested">
                <span>Change Orders</span>
                <span>{fmt(changeOrdersTotal)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-nested">
                <span>Selection and allowance changes</span>
                <span>{fmt(approvedSelectionsTotal)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Remaining balance */}
          <div className="jps-card jps-card-balance">
            <div className="jps-card-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                <g clipPath="url(#clip0_5861_122264)">
                  <path d="M0 2C0 0.89543 0.895431 0 2 0H12C13.1046 0 14 0.895431 14 2V12C14 13.1046 13.1046 14 12 14H2C0.89543 14 0 13.1046 0 12V2Z" fill="white"/>
                  <rect x="46.0391" y="-50" width="90.5718" height="90.5646" transform="rotate(45 46.0391 -50)" fill="url(#pattern0_5861_122264)"/>
                </g>
                <defs>
                  <pattern id="pattern0_5861_122264" patternContentUnits="objectBoundingBox" width="0.132492" height="0.364381">
                    <use xlinkHref="#image0_5861_122264" transform="scale(0.011041)"/>
                  </pattern>
                  <clipPath id="clip0_5861_122264">
                    <path d="M0 2C0 0.89543 0.895431 0 2 0H12C13.1046 0 14 0.895431 14 2V12C14 13.1046 13.1046 14 12 14H2C0.89543 14 0 13.1046 0 12V2Z" fill="white"/>
                  </clipPath>
                  <image id="image0_5861_122264" width="12" height="33" preserveAspectRatio="none" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAhCAYAAADtR0oPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAvSURBVHgB7cuhEQAwCMXQ36oO2j1gbwQsgEGTyNy98364mjJl3b8aBgAAAIAVoABNmASmMYu2HAAAAABJRU5ErkJggg=="/>
                </defs>
              </svg>
              Remaining balance
            </div>
            <div className="jps-card-value-big">{fmt(remainingBalance)}</div>
            <div className="jps-progress-bar" style={{ marginTop: 12 }}>
              <div className="jps-progress-filled" style={{ width: `${paidPct}%` }}></div>
              <div className="jps-progress-credit" style={{ width: `${creditPct}%` }}></div>
            </div>
            <div className="jps-card-breakdown" style={{ marginTop: 8 }}>
              <div className="jps-breakdown-line">
                <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#4dabff' }}></span>Payments received</span>
                <span>{fmt(paymentsReceived)}</span>
              </div>
              <div className="jps-breakdown-line">
                <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#002F77', borderRadius: 2 }}></span>Credit memos</span>
                <span>{fmt(creditMemos)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending price impact — only show if there are pending items */}
          {forecastedAdditional !== 0 && <div className="jps-card jps-card-forecast">
            <div className="jps-card-label">Pending price impact</div>
            <div className={`jps-forecast-amount ${forecastedAdditional > 0 ? 'jps-forecast-up' : forecastedAdditional < 0 ? 'jps-forecast-down' : 'jps-forecast-neutral'}`}>
              {forecastedAdditional > 0 && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {forecastedAdditional < 0 && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {fmtSigned(forecastedAdditional)}
            </div>
            <div className="jps-card-breakdown" style={{ marginTop: 12 }}>
              <div className="jps-breakdown-line">
                <span>Pending Selections</span>
                <span>{fmt(pendingSelectionsAmt)}</span>
              </div>
              <div className="jps-breakdown-line">
                <span>Pending Change Orders</span>
                <span>{fmt(pendingChangeOrders)}</span>
              </div>
            </div>
          </div>}
        </div>

        {/* ═══ Allowances ═══ */}
        <div className="jps-breakdown-section">
          <div className="jps-section-header">
            <h2 className="jps-section-title">Allowances</h2>
            {hasPendingItems && (
              <div className="jps-view-toggle">
                <button className={`jps-view-btn ${viewFilter === 'all' ? 'jps-view-btn-on' : ''}`} onClick={() => setViewFilter('all')}>All items</button>
                <button className={`jps-view-btn ${viewFilter === 'approved' ? 'jps-view-btn-on' : ''}`} onClick={() => setViewFilter('approved')}>Approved only</button>
                <button className={`jps-view-btn ${viewFilter === 'pending' ? 'jps-view-btn-on' : ''}`} onClick={() => setViewFilter('pending')}>Pending only</button>
              </div>
            )}
          </div>

          {allowanceGroups.map(group => {
            const approvedItems = group.items.filter(i => i.status === 'approved');
            const pendingItems = group.items.filter(i => i.status === 'pending');

            const isOpen = expandedGroups[group.name];

            return (
              <div key={group.name} className="jps-cat-group">
                <button className={`jps-cat-header ${isOpen ? 'jps-cat-header-open' : ''}`} onClick={() => toggleGroup(group.name)}>
                  <div className="jps-cat-header-left">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="jps-cat-name">{group.name}</span>
                    {group.fromCO && <span className="jps-cat-from-co">From CO: {group.fromCO}</span>}
                    <span className="jps-cat-count">{group.items.length} items</span>
                    {pendingItems.length > 0 && <span className="jps-cat-pending-badge">{pendingItems.length} pending</span>}
                    {(() => {
                      const visUsed = viewFilter === 'all' ? group.used : (viewFilter === 'approved' ? approvedItems : pendingItems).reduce((s, i) => s + i.price, 0);
                      const visRemaining = group.budget - visUsed;
                      const visOver = visUsed > group.budget;
                      return (
                        <>
                          <span className="jps-allowance-summary">
                            {fmt(visUsed)} of {fmt(group.budget)}
                          </span>
                          {visOver
                            ? <span className="jps-cat-pending-badge" style={{ background: '#fef2f2', color: 'var(--red)' }}>{fmt(visUsed - group.budget)} overage</span>
                            : visRemaining > 0 && <span className="jps-cat-pending-badge" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>{fmt(visRemaining)} under allowance</span>
                          }
                        </>
                      );
                    })()}
                  </div>
                  <div className="jps-cat-header-right">
                    <span className="jps-cat-budget">Allowance: {fmt(group.budget)}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="jps-cat-body">
                    <div className="jps-table">
                      <div className="jps-table-header jps-table-allowance">
                        <div className="jps-col-title">Title</div>
                        <div className="jps-col-date">Date</div>
                        <div className="jps-col-price">Price</div>
                        <div className="jps-col-impact">Contract impact</div>
                      </div>

                      {/* Selection rows */}
                      {(viewFilter !== 'pending' ? approvedItems : []).map((item, i) => {

                        const prevUsed = approvedItems.slice(0, i).reduce((s, it) => s + it.price, 0);
                        const prevRemaining = group.budget - prevUsed;
                        const lineImpact = prevRemaining <= 0 ? item.price : prevRemaining < item.price ? item.price - prevRemaining : 0;
                        return (
                          <div key={i} className="jps-table-row jps-table-allowance">
                            <div className="jps-col-title">
                              <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                            </div>
                            <div className="jps-col-date">{item.date}</div>
                            <div className="jps-col-price">{fmt(item.price)}</div>
                            <div className="jps-col-impact">
                              {lineImpact === 0
                                ? <span className="jps-impact-chip jps-impact-none">$0.00</span>
                                : <span className="jps-impact-chip jps-impact-chip-up">{fmtSigned(lineImpact)}</span>
                              }
                            </div>
                          </div>
                        );
                      })}

                      {(viewFilter !== 'approved' ? pendingItems : []).map((item, i) => {
                        const approvedTotal = approvedItems.reduce((s, it) => s + it.price, 0);
                        const pendingUsedBefore = pendingItems.slice(0, i).reduce((s, it) => s + it.price, 0);
                        const totalBefore = approvedTotal + pendingUsedBefore;
                        const remainingBefore = group.budget - totalBefore;
                        const pendingLineImpact = remainingBefore <= 0 ? item.price : remainingBefore < item.price ? item.price - remainingBefore : 0;
                        return (
                          <div key={`p-${i}`} className="jps-table-row jps-table-allowance jps-row-pending">
                            <div className="jps-col-title">
                              <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                              <span className="jps-badge-pending">Pending</span>
                            </div>
                            <div className="jps-col-date">{item.date || '—'}</div>
                            <div className="jps-col-price">{fmt(item.price)}</div>
                            <div className="jps-col-impact">
                              {pendingLineImpact === 0
                                ? <span className="jps-impact-chip jps-impact-none">$0.00</span>
                                : <span className="jps-impact-chip jps-impact-chip-up">{fmtSigned(pendingLineImpact)}</span>
                              }
                            </div>
                          </div>
                        );
                      })}

                      {/* Summary row */}
                      {(() => {
                        const visUsed = viewFilter === 'all'
                          ? group.used
                          : approvedItems.reduce((s, i) => s + i.price, 0);
                        const diff = visUsed - group.budget;
                        return (
                          <div className="jps-table-row jps-table-allowance jps-row-allowance-summary">
                            <div className="jps-col-title">
                              <span className="jps-item-name">Selections total</span>
                            </div>
                            <div className="jps-col-date"></div>
                            <div className="jps-col-price">{fmt(visUsed)}</div>
                            <div className="jps-col-impact">
                              {diff > 0 ? <span className="jps-summary-impact">{fmt(diff)} overage</span>
                                : diff < 0 ? <span className="jps-summary-impact">{fmt(Math.abs(diff))} under allowance</span>
                                : <span className="jps-summary-impact">Matches allowance</span>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ═══ Selections ═══ */}
        {(preContractSelections.length > 0 || postContractSelections.length > 0) && (
          <div className="jps-breakdown-section">
            <div className="jps-section-header">
              <h2 className="jps-section-title">Selections</h2>
            </div>

            {/* Pre-contract — hide when viewing pending only (all are approved) */}
            {preContractSelections.length > 0 && viewFilter !== 'pending' && (
              <div className="jps-cat-group">
                <button className={`jps-cat-header ${expandedGroups['__pre-contract__'] ? 'jps-cat-header-open' : ''}`} onClick={() => toggleGroup('__pre-contract__')}>
                  <div className="jps-cat-header-left">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expandedGroups['__pre-contract__'] ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="jps-cat-name">Pre-contract</span>
                    <span className="jps-cat-count">{preContractSelections.length} items</span>
                  </div>
                  <div className="jps-cat-header-right">
                    <span className="jps-cat-impact jps-impact-neutral">Included in original price</span>
                  </div>
                </button>

                {expandedGroups['__pre-contract__'] && (
                  <div className="jps-cat-body">
                    <div className="jps-table">
                      <div className="jps-table-header jps-table-sel-standalone">
                        <div className="jps-col-title">Title</div>
                        <div className="jps-col-date">Date</div>
                        <div className="jps-col-price">Price</div>
                        <div className="jps-col-impact">Contract impact</div>
                      </div>
                      {preContractSelections.map((item, i) => (
                        <div key={i} className="jps-table-row jps-table-sel-standalone">
                          <div className="jps-col-title">
                            <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                          </div>
                          <div className="jps-col-date">{item.date}</div>
                          <div className="jps-col-price">{fmt(item.price)}</div>
                          <div className="jps-col-impact">
                            <span className="jps-impact-chip jps-impact-none">$0.00</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Post-contract */}
            {postContractSelections.length > 0 && (
              <div className="jps-cat-group">
                <button className={`jps-cat-header ${expandedGroups['__post-contract__'] ? 'jps-cat-header-open' : ''}`} onClick={() => toggleGroup('__post-contract__')}>
                  <div className="jps-cat-header-left">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expandedGroups['__post-contract__'] ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="jps-cat-name">Post-contract</span>
                    <span className="jps-cat-count">{postContractSelections.length} items</span>
                    {postContractSelections.filter(s => s.status === 'pending').length > 0 && (
                      <span className="jps-cat-pending-badge">{postContractSelections.filter(s => s.status === 'pending').length} pending</span>
                    )}
                  </div>
                  <div className="jps-cat-header-right">
                    {(() => {
                      const visItems = viewFilter === 'all' ? postContractSelections : postContractSelections.filter(s => s.status === viewFilter);
                      const impact = visItems.reduce((s, i) => s + i.impact, 0);
                      return impact !== 0
                        ? <span className={`jps-cat-impact ${impact > 0 ? 'jps-impact-up' : 'jps-impact-down'}`}>{fmtSigned(impact)} impact</span>
                        : <span className="jps-cat-impact jps-impact-neutral">No impact</span>;
                    })()}
                  </div>
                </button>

                {expandedGroups['__post-contract__'] && (
                  <div className="jps-cat-body">
                    <div className="jps-table">
                      <div className="jps-table-header jps-table-sel-standalone">
                        <div className="jps-col-title">Title</div>
                        <div className="jps-col-date">Date</div>
                        <div className="jps-col-price">Price</div>
                        <div className="jps-col-impact">Contract impact</div>
                      </div>

                      {viewFilter !== 'pending' && postContractSelections.filter(s => s.status === 'approved').map((item, i) => (
                        <div key={i} className="jps-table-row jps-table-sel-standalone">
                          <div className="jps-col-title">
                            <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                          </div>
                          <div className="jps-col-date">{item.date}</div>
                          <div className="jps-col-price">{fmt(item.price)}</div>
                          <div className="jps-col-impact">
                            <span className={`jps-impact-chip ${item.impact > 0 ? 'jps-impact-chip-up' : 'jps-impact-chip-down'}`}>{fmtSigned(item.impact)}</span>
                          </div>
                        </div>
                      ))}

                      {viewFilter !== 'approved' && postContractSelections.filter(s => s.status === 'pending').map((item, i) => (
                        <div key={`p-${i}`} className="jps-table-row jps-table-sel-standalone jps-row-pending">
                          <div className="jps-col-title">
                            <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                            <span className="jps-badge-pending">Pending</span>
                          </div>
                          <div className="jps-col-date">{item.date || '—'}</div>
                          <div className="jps-col-price">{fmt(item.price)}</div>
                          <div className="jps-col-impact">
                            <span className={`jps-impact-chip ${item.impact > 0 ? 'jps-impact-chip-up' : 'jps-impact-chip-down'}`}>{fmtSigned(item.impact)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ Change Orders ═══ */}
        <div className="jps-breakdown-section">
          <div className="jps-section-header">
            <h2 className="jps-section-title">Change Orders</h2>
          </div>
          <div className="jps-cat-group">
          <button className={`jps-cat-header ${showCOs ? 'jps-cat-header-open' : ''}`} onClick={() => setShowCOs(!showCOs)} style={{ marginBottom: 0 }}>
            <div className="jps-cat-header-left">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: showCOs ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="jps-cat-name">Change Orders</span>
              <span className="jps-cat-count">{changeOrders.length} items</span>
              {changeOrders.filter(c => c.status === 'pending').length > 0 && (
                <span className="jps-cat-pending-badge">{changeOrders.filter(c => c.status === 'pending').length} pending</span>
              )}
            </div>
            <div className="jps-cat-header-right">
              {(() => {
                const visCOs = viewFilter === 'all' ? changeOrders : changeOrders.filter(c => c.status === viewFilter);
                const coImpact = visCOs.reduce((s, c) => s + c.price, 0);
                return coImpact !== 0
                  ? <span className={`jps-cat-impact ${coImpact > 0 ? 'jps-impact-up' : 'jps-impact-down'}`}>{fmtSigned(coImpact)} impact</span>
                  : <span className="jps-cat-impact jps-impact-neutral">No impact</span>;
              })()}
            </div>
          </button>

          {showCOs && (
            <div className="jps-cat-body">
              <div className="jps-table">
                <div className="jps-table-header jps-table-co">
                  <div className="jps-col-title">Title</div>
                  <div className="jps-col-date">Date</div>
                  <div className="jps-col-impact">Contract impact</div>
                </div>
                {changeOrders.filter(co => viewFilter === 'all' || co.status === viewFilter).map((co, i) => (
                  <div key={i} className={`jps-table-row jps-table-co ${co.status === 'pending' ? 'jps-row-pending' : ''}`}>
                    <div className="jps-col-title">
                      <div>
                        <span className="jps-item-name">{co.name}</span>
                        {co.includesAllowance && (() => {
                          const summary = coAllowanceSummaries.get(co.name);
                          const remaining = summary ? summary.remaining : co.includesAllowance.budget;
                          const isOver = remaining < 0;
                          return (
                            <span className="jps-item-parent">
                              Includes {fmt(co.includesAllowance.budget)} {co.includesAllowance.name} allowance
                              {summary && (
                                isOver
                                  ? <span style={{ color: 'var(--red)', fontWeight: 600 }}> · {fmt(Math.abs(remaining))} overage</span>
                                  : <span style={{ color: 'var(--green)', fontWeight: 600 }}> · {fmt(remaining)} remaining</span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                      {co.status === 'pending' && <span className="jps-badge-pending">Pending</span>}
                    </div>
                    <div className="jps-col-date">{co.date || '—'}</div>
                    <div className="jps-col-impact">
                      <span className={`jps-impact-chip ${co.price > 0 ? 'jps-impact-chip-up' : 'jps-impact-chip-down'}`}>{fmtSigned(co.price)}</span>
                    </div>
                  </div>
                ))}
                <div className="jps-table-row jps-table-co jps-row-total">
                  <div className="jps-col-title">Total</div>
                  <div className="jps-col-date"></div>
                  <div className="jps-col-impact">{fmtSigned(changeOrders.reduce((s, c) => s + c.price, 0))}</div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* ═══ Payments ═══ */}
        <div className="jps-breakdown-section">
          <div className="jps-section-header">
            <h2 className="jps-section-title">Payments</h2>
          </div>
          <div className="jps-table">
            <div className="jps-table-header jps-table-payments">
              <div className="jps-col-title">Title</div>
              <div className="jps-col-date">Date</div>
              <div className="jps-col-method">Payment type</div>
              <div className="jps-col-amount">Amount</div>
            </div>
            <div className="jps-table-row jps-table-payments">
              <div className="jps-col-title"><span className="jps-item-name">Payment #1</span></div>
              <div className="jps-col-date">Oct 1, 2024</div>
              <div className="jps-col-method">Check</div>
              <div className="jps-col-amount">{fmt(50000)}</div>
            </div>
            <div className="jps-table-row jps-table-payments">
              <div className="jps-col-title"><span className="jps-item-name">Payment #2</span></div>
              <div className="jps-col-date">Nov 1, 2024</div>
              <div className="jps-col-method">ACH</div>
              <div className="jps-col-amount">{fmt(25000)}</div>
            </div>
            <div className="jps-table-row jps-table-payments">
              <div className="jps-col-title"><span className="jps-item-name">Payment #3</span></div>
              <div className="jps-col-date">Dec 1, 2024</div>
              <div className="jps-col-method">Check</div>
              <div className="jps-col-amount">{fmt(24000)}</div>
            </div>
            <div className="jps-table-row jps-table-payments">
              <div className="jps-col-title"><span className="jps-item-name">Credit memo — overpayment</span></div>
              <div className="jps-col-date">Dec 15, 2024</div>
              <div className="jps-col-method">Credit Memo</div>
              <div className="jps-col-amount" style={{ color: 'var(--green)' }}>{fmt(1000)}</div>
            </div>
            <div className="jps-table-row jps-table-payments jps-row-total">
              <div className="jps-col-title">Total payments</div>
              <div className="jps-col-date"></div>
              <div className="jps-col-method"></div>
              <div className="jps-col-amount">{fmt(paymentsReceived)}</div>
            </div>
            <div className="jps-table-row jps-table-payments jps-row-total" style={{ borderTop: '1px solid var(--g300)' }}>
              <div className="jps-col-title">Remaining balance</div>
              <div className="jps-col-date"></div>
              <div className="jps-col-method"></div>
              <div className="jps-col-amount">{fmt(remainingBalance)}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
