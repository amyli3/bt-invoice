import { useState, useMemo, Fragment } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon, BdsText } from '../bds';
import { JCB_ROWS as ROWS, MARKUP_PCT, type BudgetRow } from '../jcbMockData';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtSigned = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/* ── Component ── */

export default function JobCostingBudget({ onBack, onOpenJPS }: { onBack?: () => void; onOpenJPS?: () => void }) {
  const [search, setSearch] = useState('');
  const [showRollup, setShowRollup] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const toggleCat = (cat: string) => setCollapsedCats(prev => {
    const next = new Set(prev);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    return next;
  });
  const togglePopover = (id: string) => setOpenPopover(prev => prev === id ? null : id);

  const COL_INFO: Record<string, { label: string; desc: string; formula?: string }> = {
    code: { label: 'Cost codes', desc: 'Buildertrend cost code, name, and cost type. Cost codes group related budget lines.' },
    orig: { label: 'Original budget costs', desc: 'Planned job cost baseline from the signed estimate.', formula: 'Taken from the signed proposal.' },
    rev: { label: 'Revised budget costs', desc: 'Approved working budget after scope and change adjustments.', formula: 'Original budget costs + approved change orders + approved selections.' },
    com: { label: 'Committed costs', desc: 'Total approved cost commitments to date.', formula: 'Approved purchase orders + approved variance POs.' },
    act: { label: 'Actual costs', desc: 'Total costs incurred and officially recorded.', formula: 'Open and paid bills. Accounting method set to accrual.' },
    bv: { label: 'Builder variance', desc: 'Costs absorbed by the builder, not passed to the client.', formula: 'Bills marked as variance.' },
    proj: { label: 'Projected costs', desc: 'Forecasted total expected cost at completion.', formula: 'Based on projection reference. Adjustments are added after the initial calculation.' },
    ctt: { label: 'Cost to complete', desc: 'Remaining forecasted spend required to complete this code.', formula: 'Projected costs − Actual costs.' },
    rvp: { label: 'Revised vs projected', desc: 'Indicates whether you are trending over or under budget.', formula: 'Revised budget costs − Projected costs.' },
    ocp: { label: 'Original client price', desc: 'Original client contract price, pre-tax.', formula: 'Original budget costs + markup/margin.' },
    rcp: { label: 'Revised client price', desc: 'Current approved client contract price (excl. tax).', formula: 'Projected costs − Builder variance + markup/margin.' },
    ai: { label: 'Amount invoiced', desc: 'Total amount invoiced to client to date.', formula: 'Sent invoices.' },
    rti: { label: 'Remaining to invoice', desc: 'Contract value remaining to invoice to client.', formula: 'Revised client price − Amount invoiced.' },
    pp: { label: 'Projected profit', desc: 'Forecasted profit based on projected total costs.', formula: 'Revised client price − Projected costs − applied credit memos.' },
    pm: { label: 'Projected margin %', desc: 'Forecasted profit percentage on contract value.', formula: 'Projected profit ÷ Revised client price.' },
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.costType.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  }, [search]);

  const totals = useMemo(() => {
    const t = rows.reduce(
      (acc, r) => {
        acc.originalBudgetCosts += r.originalBudgetCosts;
        acc.revisedBudgetCosts += r.revisedBudgetCosts;
        acc.committedCosts += r.committedCosts;
        acc.actualCosts += r.actualCosts;
        acc.builderVariance += r.builderVariance;
        acc.projectedCosts += r.projectedCosts;
        acc.originalOwnerPrice += r.originalOwnerPrice;
        acc.revisedOwnerPrice += r.revisedOwnerPrice;
        acc.amountInvoiced += r.amountInvoiced;
        return acc;
      },
      { originalBudgetCosts: 0, revisedBudgetCosts: 0, committedCosts: 0, actualCosts: 0, builderVariance: 0, projectedCosts: 0, originalOwnerPrice: 0, revisedOwnerPrice: 0, amountInvoiced: 0 }
    );
    const costToComplete = t.projectedCosts - t.actualCosts;
    const revisedVsProjected = t.revisedBudgetCosts - t.projectedCosts;
    const remainingToInvoice = t.revisedOwnerPrice - t.amountInvoiced;
    const customerPayable = -revisedVsProjected - t.builderVariance;
    const customerPayableWithMarkup = customerPayable * (1 + MARKUP_PCT);
    return { ...t, costToComplete, revisedVsProjected, remainingToInvoice, customerPayable, customerPayableWithMarkup };
  }, [rows]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, BudgetRow[]>();
    for (const r of rows) {
      if (!byCategory.has(r.category)) byCategory.set(r.category, []);
      byCategory.get(r.category)!.push(r);
    }
    return Array.from(byCategory.entries()).map(([category, items]) => {
      const sub = items.reduce(
        (acc, r) => {
          acc.originalBudgetCosts += r.originalBudgetCosts;
          acc.revisedBudgetCosts += r.revisedBudgetCosts;
          acc.committedCosts += r.committedCosts;
          acc.actualCosts += r.actualCosts;
          acc.builderVariance += r.builderVariance;
          acc.projectedCosts += r.projectedCosts;
          acc.originalOwnerPrice += r.originalOwnerPrice;
          acc.revisedOwnerPrice += r.revisedOwnerPrice;
          acc.amountInvoiced += r.amountInvoiced;
          return acc;
        },
        { originalBudgetCosts: 0, revisedBudgetCosts: 0, committedCosts: 0, actualCosts: 0, builderVariance: 0, projectedCosts: 0, originalOwnerPrice: 0, revisedOwnerPrice: 0, amountInvoiced: 0 }
      );
      const costToComplete = sub.projectedCosts - sub.actualCosts;
      const revisedVsProjected = sub.revisedBudgetCosts - sub.projectedCosts;
      const remainingToInvoice = sub.revisedOwnerPrice - sub.amountInvoiced;
      const projectedProfit = sub.revisedOwnerPrice - sub.projectedCosts;
      const projectedMargin = sub.revisedOwnerPrice ? (projectedProfit / sub.revisedOwnerPrice) * 100 : 0;
      return { category, items, sub: { ...sub, costToComplete, revisedVsProjected, remainingToInvoice, projectedProfit, projectedMargin } };
    });
  }, [rows]);

  // Insights — match real DifferenceFooter logic
  const projectedVsBudgetPct = totals.originalBudgetCosts ? ((totals.projectedCosts / totals.originalBudgetCosts) - 1) * 100 : 0;
  const profitVsEstimatedPct = totals.originalOwnerPrice ? ((totals.revisedOwnerPrice / totals.originalOwnerPrice) - 1) * 100 : 0;
  const actualPct = totals.projectedCosts ? (totals.actualCosts / totals.projectedCosts) * 100 : 0;
  const invoicedPct = totals.revisedOwnerPrice ? (totals.amountInvoiced / totals.revisedOwnerPrice) * 100 : 0;

  const rvpFor = (r: BudgetRow) => r.revisedBudgetCosts - r.projectedCosts;
  const cttFor = (r: BudgetRow) => r.projectedCosts - r.actualCosts;

  return (
    <div className="jcb-page">
      {/* ─── Page header ─── */}
      <div className="jcb-header">
        <div className="jcb-header-left">
          {onBack && (
            <button type="button" className="jcb-back" onClick={onBack}>
              <BdsIcon name="chevron-left" size={14} /> Back
            </button>
          )}
          <div>
            <BdsText as="h1" size="heavy-lg" className="jcb-title">Job costing budget</BdsText>
            <div className="jcb-sub">Sample Job · Open Book contract · 15% markup</div>
          </div>
        </div>
        <div className="jcb-header-right">
          <BdsButton displayType="tertiary" icon={<BdsIcon name="search" size={14} />} ariaLabel="Search" />
          <BdsButton displayType="tertiary" text="Print" />
          <BdsButton displayType="tertiary" text="Export" />
          <BdsButton displayType="primary" text="Edit budget" />
        </div>
      </div>

      {/* ─── Insights row (Open Book variant) ─── */}
      <div className="jcb-insights">
        {/* Card 1 — Projected Total Costs */}
        <div className="jcb-insight-card">
          <div className="jcb-insight-title">Projected total costs</div>
          <div className="jcb-insight-big">{fmt(totals.projectedCosts)}</div>
          <div className="jcb-insight-footer">
            {projectedVsBudgetPct > 0 ? (
              <>
                <BdsIcon name="arrow-up" size={12} className="jcb-icon-red" />
                <span className="jcb-neg">{fmtPct(Math.abs(projectedVsBudgetPct))}</span>
                <span className="jcb-insight-label">More than budgeted</span>
              </>
            ) : projectedVsBudgetPct < 0 ? (
              <>
                <BdsIcon name="arrow-down" size={12} className="jcb-icon-green" />
                <span className="jcb-pos">{fmtPct(Math.abs(projectedVsBudgetPct))}</span>
                <span className="jcb-insight-label">Less than budgeted</span>
              </>
            ) : (
              <span className="jcb-insight-label">Equal to budgeted</span>
            )}
          </div>
          <div className="jcb-pbar">
            <div className="jcb-pbar-track">
              <div className="jcb-pbar-fill jcb-pbar-teal" style={{ width: `${actualPct}%` }} />
              <div className="jcb-pbar-fill jcb-pbar-teal-striped" style={{ width: `${100 - actualPct}%` }} />
            </div>
            <div className="jcb-pbar-legend">
              <div>
                <span className="jcb-pbar-dot jcb-pbar-teal" />
                <strong>Actual costs</strong>
                <span>{fmt(totals.actualCosts)}</span>
              </div>
              <div>
                <span className="jcb-pbar-dot jcb-pbar-teal-striped" />
                <strong>Cost to complete</strong>
                <span>{fmt(totals.costToComplete)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 — Revised Client Price */}
        <div className="jcb-insight-card">
          <div className="jcb-insight-title">Revised client price</div>
          <div className="jcb-insight-big">{fmt(totals.revisedOwnerPrice)}</div>
          <div className="jcb-insight-footer">
            {profitVsEstimatedPct > 0 ? (
              <>
                <BdsIcon name="arrow-up" size={12} className="jcb-icon-green" />
                <span className="jcb-pos">{fmtPct(Math.abs(profitVsEstimatedPct))}</span>
                <span className="jcb-insight-label">Higher than estimated</span>
              </>
            ) : profitVsEstimatedPct < 0 ? (
              <>
                <BdsIcon name="arrow-down" size={12} className="jcb-icon-red" />
                <span className="jcb-neg">{fmtPct(Math.abs(profitVsEstimatedPct))}</span>
                <span className="jcb-insight-label">Lower than estimated</span>
              </>
            ) : (
              <span className="jcb-insight-label">Equal to estimated</span>
            )}
          </div>
          <div className="jcb-pbar">
            <div className="jcb-pbar-track">
              <div className="jcb-pbar-fill jcb-pbar-blue" style={{ width: `${invoicedPct}%` }} />
              <div className="jcb-pbar-fill jcb-pbar-blue-striped" style={{ width: `${100 - invoicedPct}%` }} />
            </div>
            <div className="jcb-pbar-legend">
              <div>
                <span className="jcb-pbar-dot jcb-pbar-blue" />
                <strong>Amount invoiced</strong>
                <span>{fmt(totals.amountInvoiced)}</span>
              </div>
              <div>
                <span className="jcb-pbar-dot jcb-pbar-blue-striped" />
                <strong>Left to invoice</strong>
                <span>{fmt(totals.remainingToInvoice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toolbar ─── */}
      <div className="jcb-toolbar">
        <div className="jcb-toolbar-left">
          <label className="jcb-control jcb-control-search">
            <BdsIcon name="search" size={14} />
            <input type="text" placeholder="Search cost codes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        <div className="jcb-toolbar-right">
        </div>
      </div>

      {/* ─── Spreadsheet ─── */}
      <div className="jcb-table-wrap">
        <table className="jcb-table">
          <thead>
            <tr className="jcb-group-row">
              <th colSpan={1} className="jcb-group-header jcb-group-header-category">Cost categories</th>
              <th colSpan={8} className="jcb-group-header jcb-group-header-job">Job costing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-client">Client pricing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-invoicing">Invoicing</th>
              <th colSpan={2} className="jcb-group-header jcb-group-header-profit">Profit</th>
            </tr>
            <tr>
              {(['code','orig','rev','com','act','bv','proj','ctt','rvp','ocp','rcp','ai','rti','pp','pm'] as const).map((id) => {
                const c = COL_INFO[id];
                const cls = id === 'code' ? 'jcb-col-code' : (id === 'rev' || id === 'rvp') ? 'jcb-num jcb-emph' : 'jcb-num';
                if (id === 'code') {
                  return <th key={id} className={cls}>{c.label}</th>;
                }
                return (
                  <th key={id} className={cls}>
                    <button type="button" className={`jcb-col-title-btn ${openPopover === id ? 'is-active' : ''}`} onClick={() => togglePopover(id)} aria-expanded={openPopover === id}>
                      {c.label}
                    </button>
                    {openPopover === id && (
                      <div className="jcb-col-popover" role="dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="jcb-col-popover-title">{c.label}</div>
                        <div className="jcb-col-popover-body">{c.desc}</div>
                        {c.formula && <div className="jcb-col-popover-formula">{c.formula}</div>}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ category, items, sub }) => {
              const collapsed = collapsedCats.has(category);
              return (
              <Fragment key={category}>
                <tr className="jcb-category-row">
                  <th className="jcb-col-code">
                    <button type="button" className="jcb-category-toggle" onClick={() => toggleCat(category)} aria-expanded={!collapsed}>
                      <span className="jcb-category-sticky-content">
                        <BdsIcon name={collapsed ? 'chevron-right' : 'chevron-down'} size={12} />
                        {category}
                        <span className="jcb-category-count">({items.length})</span>
                      </span>
                    </button>
                  </th>
                  <td className="jcb-num">{fmt(sub.originalBudgetCosts)}</td>
                  <td className="jcb-num jcb-emph">{fmt(sub.revisedBudgetCosts)}</td>
                  <td className="jcb-num">{sub.committedCosts === 0 ? '—' : fmt(sub.committedCosts)}</td>
                  <td className="jcb-num">{fmt(sub.actualCosts)}</td>
                  <td className="jcb-num">{fmt(sub.builderVariance)}</td>
                  <td className="jcb-num">{fmt(sub.projectedCosts)}</td>
                  <td className="jcb-num">{fmt(sub.costToComplete)}</td>
                  <td className={`jcb-num jcb-emph ${sub.revisedVsProjected < 0 ? 'jcb-neg' : 'jcb-pos'}`}>{fmtSigned(sub.revisedVsProjected)}</td>
                  <td className="jcb-num">{fmt(sub.originalOwnerPrice)}</td>
                  <td className="jcb-num">{fmt(sub.revisedOwnerPrice)}</td>
                  <td className="jcb-num">{fmt(sub.amountInvoiced)}</td>
                  <td className="jcb-num">{fmt(sub.remainingToInvoice)}</td>
                  <td className="jcb-num">{fmt(sub.projectedProfit)}</td>
                  <td className="jcb-num">{sub.revisedOwnerPrice ? fmtPct(sub.projectedMargin) : '—'}</td>
                </tr>
                {!collapsed && items.map(r => {
                  const rvp = rvpFor(r);
                  const ctt = cttFor(r);
                  return (
                    <tr key={r.code}>
                      <td className="jcb-col-code">
                        <div className="jcb-col-code-inner jcb-col-code-nested">
                          <span className="jcb-code-num">{r.code}</span>
                          <span className="jcb-code-name">{r.name}</span>
                          <span className="jcb-cost-type">{r.costType}</span>
                        </div>
                      </td>
                      <td className="jcb-num">{fmt(r.originalBudgetCosts)}</td>
                      <td className="jcb-num jcb-emph">{fmt(r.revisedBudgetCosts)}</td>
                      <td className="jcb-num jcb-muted">{r.committedCosts === 0 ? '—' : fmt(r.committedCosts)}</td>
                      <td className="jcb-num">{fmt(r.actualCosts)}</td>
                      <td className="jcb-num">{r.builderVariance === 0 ? <span className="jcb-muted">—</span> : fmt(r.builderVariance)}</td>
                      <td className="jcb-num">{fmt(r.projectedCosts)}</td>
                      <td className="jcb-num">{fmt(ctt)}</td>
                      <td className={`jcb-num jcb-emph ${rvp < 0 ? 'jcb-neg' : rvp > 0 ? 'jcb-pos' : ''}`}>
                        {rvp === 0 ? fmt(0) : fmtSigned(rvp)}
                      </td>
                      <td className="jcb-num">{fmt(r.originalOwnerPrice)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice)}</td>
                      <td className="jcb-num">{fmt(r.amountInvoiced)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice - r.amountInvoiced)}</td>
                      <td className="jcb-num">{fmt(r.revisedOwnerPrice - r.projectedCosts)}</td>
                      <td className="jcb-num">{r.revisedOwnerPrice ? fmtPct(((r.revisedOwnerPrice - r.projectedCosts) / r.revisedOwnerPrice) * 100) : '—'}</td>
                    </tr>
                  );
                })}
              </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th className="jcb-col-code">Totals</th>
              <td className="jcb-num">{fmt(totals.originalBudgetCosts)}</td>
              <td className="jcb-num jcb-emph">{fmt(totals.revisedBudgetCosts)}</td>
              <td className="jcb-num">{totals.committedCosts === 0 ? '—' : fmt(totals.committedCosts)}</td>
              <td className="jcb-num">{fmt(totals.actualCosts)}</td>
              <td className="jcb-num">{fmt(totals.builderVariance)}</td>
              <td className="jcb-num">{fmt(totals.projectedCosts)}</td>
              <td className="jcb-num">{fmt(totals.costToComplete)}</td>
              <td className={`jcb-num jcb-emph ${totals.revisedVsProjected < 0 ? 'jcb-neg' : 'jcb-pos'}`}>
                {fmtSigned(totals.revisedVsProjected)}
              </td>
              <td className="jcb-num">{fmt(totals.originalOwnerPrice)}</td>
              <td className="jcb-num">{fmt(totals.revisedOwnerPrice)}</td>
              <td className="jcb-num">{fmt(totals.amountInvoiced)}</td>
              <td className="jcb-num">{fmt(totals.remainingToInvoice)}</td>
              <td className="jcb-num">{fmt(totals.revisedOwnerPrice - totals.projectedCosts)}</td>
              <td className="jcb-num">{totals.revisedOwnerPrice ? fmtPct(((totals.revisedOwnerPrice - totals.projectedCosts) / totals.revisedOwnerPrice) * 100) : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ─── Prototype-only: rollup to JPS v5 ─── */}
      <div className="jcb-rollup">
        <button
          type="button"
          className="jcb-rollup-toggle"
          onClick={() => setShowRollup(s => !s)}
          aria-expanded={showRollup}
        >
          <BdsIcon name={showRollup ? 'chevron-down' : 'chevron-right'} size={12} />
          How this rolls up to Job Price Summary
          <span className="jcb-rollup-tag">prototype</span>
        </button>
        {showRollup && (
          <div className="jcb-rollup-body">
            {(() => {
              const costOverrun = totals.projectedCosts - totals.revisedBudgetCosts;
              const markup = totals.customerPayableWithMarkup - totals.customerPayable;
              return (
                <div className="jcb-rollup-math">
                  <div className="jcb-math-block">
                    <div className="jcb-math-block-title">Step 1 — Cost overrun</div>
                    <div className="jcb-math-row">    <span className="jcb-math-op"></span><span className="jcb-math-val">{fmt(totals.projectedCosts)}</span><span className="jcb-math-label">Projected costs</span></div>
                    <div className="jcb-math-row">    <span className="jcb-math-op">−</span><span className="jcb-math-val">{fmt(totals.revisedBudgetCosts)}</span><span className="jcb-math-label">Revised budget costs</span></div>
                    <div className="jcb-math-row jcb-math-sum"><span className="jcb-math-op">=</span><span className={`jcb-math-val ${costOverrun > 0 ? 'jcb-neg' : 'jcb-pos'}`}>{fmtSigned(costOverrun)}</span><span className="jcb-math-label">Cost overrun</span></div>
                  </div>

                  <div className="jcb-math-block">
                    <div className="jcb-math-block-title">Step 2 — Customer-payable cost change</div>
                    <div className="jcb-math-row">    <span className="jcb-math-op"></span><span className="jcb-math-val">{fmt(costOverrun)}</span><span className="jcb-math-label">Cost overrun (from Step 1)</span></div>
                    <div className="jcb-math-row">    <span className="jcb-math-op">−</span><span className="jcb-math-val">{fmt(totals.builderVariance)}</span><span className="jcb-math-label">Builder variance (absorbed)</span></div>
                    <div className="jcb-math-row jcb-math-sum"><span className="jcb-math-op">=</span><span className={`jcb-math-val ${totals.customerPayable > 0 ? 'jcb-neg' : 'jcb-pos'}`}>{fmtSigned(totals.customerPayable)}</span><span className="jcb-math-label">Customer-payable</span></div>
                  </div>

                  <div className="jcb-math-block">
                    <div className="jcb-math-block-title">Step 3 — Cost variance to client price</div>
                    <div className="jcb-math-row">    <span className="jcb-math-op"></span><span className="jcb-math-val">{fmt(totals.customerPayable)}</span><span className="jcb-math-label">Customer-payable (from Step 2)</span></div>
                    <div className="jcb-math-row">    <span className="jcb-math-op">+</span><span className="jcb-math-val">{fmt(markup)}</span><span className="jcb-math-label">Open Book markup ({(MARKUP_PCT * 100).toFixed(0)}%)</span></div>
                    <div className="jcb-math-row jcb-math-sum jcb-math-total"><span className="jcb-math-op">=</span><span className={`jcb-math-val ${totals.customerPayableWithMarkup > 0 ? 'jcb-neg' : 'jcb-pos'}`}>{fmtSigned(totals.customerPayableWithMarkup)}</span><span className="jcb-math-label">Cost variance to client price</span></div>
                  </div>
                </div>
              );
            })()}
            <div className="jcb-rollup-note">
              This {totals.customerPayableWithMarkup >= 0 ? 'increases' : 'decreases'} the client price on Job Price Summary, shown as <strong>Budget difference</strong> in the price breakdown.
            </div>
            {onOpenJPS && (
              <button type="button" className="jcb-rollup-link" onClick={onOpenJPS}>
                View on Job Price Summary <BdsIcon name="arrow-right" size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
