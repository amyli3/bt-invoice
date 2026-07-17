import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';

/* ─── Scenario note tooltip ─── */
function ScenarioTooltip({ note }: { note: string }) {
  const iconRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const show = () => {
    if (!iconRef.current) return;
    const r = iconRef.current.getBoundingClientRect();
    setPos({ left: r.left + r.width / 2, top: r.top - 8 });
  };
  const hide = () => setPos(null);

  return (
    <span className="sel-scenario-tip" onClick={e => e.stopPropagation()} onMouseEnter={show} onMouseLeave={hide}>
      <span ref={iconRef} className="sel-scenario-tip-icon">i</span>
      {pos && createPortal(
        <span className="sel-scenario-tip-bubble sel-scenario-tip-bubble-portal" style={{ left: pos.left, top: pos.top }}>
          {note}
        </span>,
        document.body,
      )}
    </span>
  );
}

const AllowanceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25928 3.20305C1.32316 3.6243 0.5 4.30937 0.5 5.25V7.75C0.5 8.69103 1.32264 9.37614 2.25891 9.79738C2.88695 10.0799 3.6538 10.2883 4.5 10.4019V10.75C4.5 11.691 5.32264 12.3761 6.25891 12.7974C7.24189 13.2396 8.56489 13.5 10 13.5C11.4351 13.5 12.7581 13.2396 13.7411 12.7974C14.6774 12.3761 15.5 11.691 15.5 10.75V8.25655L15.5 8.24998C15.5 7.42295 14.8571 6.79464 14.0945 6.37957C13.4062 6.00494 12.5055 5.7344 11.5 5.59774V5.25C11.5 4.30937 10.6768 3.6243 9.74072 3.20305C8.75766 2.76067 7.43467 2.5 6 2.5C4.56533 2.5 3.24234 2.76067 2.25928 3.20305ZM2.66965 4.11497C1.79613 4.50806 1.5 4.94799 1.5 5.25C1.5 5.55201 1.79613 5.99194 2.66965 6.38503C3.06609 6.56343 3.54313 6.71216 4.07865 6.81865C4.09098 6.8206 4.10317 6.823 4.11519 6.82583C4.68689 6.93692 5.32401 7 6 7C6.67599 7 7.31311 6.93692 7.88481 6.82583C7.89683 6.823 7.90902 6.8206 7.92135 6.81865C8.45687 6.71216 8.93391 6.56343 9.33035 6.38503C10.2039 5.99194 10.5 5.55201 10.5 5.25C10.5 4.94799 10.2039 4.50806 9.33035 4.11497C8.50376 3.74301 7.32675 3.5 6 3.5C4.67325 3.5 3.49624 3.74301 2.66965 4.11497ZM7.5 7.90171C7.02174 7.966 6.51815 8 6 8C5.48185 8 4.97826 7.966 4.5 7.90171V9.39193C4.9678 9.46159 5.472 9.5 6 9.5C6.528 9.5 7.0322 9.46159 7.5 9.39193V7.90171ZM8.5 9.18152V7.71464C8.95353 7.60388 9.37115 7.46326 9.74072 7.29695C10.0086 7.1764 10.2673 7.03424 10.5 6.87067V7.75C10.5 8.05272 10.2039 8.49261 9.33079 8.88543C9.08347 8.9967 8.80475 9.09642 8.5 9.18152ZM7.5 10.7151C7.21945 10.6471 6.95296 10.5679 6.70349 10.4789C6.47276 10.4928 6.23792 10.5 6 10.5C5.83167 10.5 5.66488 10.4964 5.5 10.4894V10.75C5.5 11.0527 5.79611 11.4926 6.66921 11.8854C6.91653 11.9967 7.19525 12.0964 7.5 12.1815V10.7151ZM8.5 12.3919V10.9015C8.97789 10.9657 9.48154 11 10 11C10.5182 11 11.0218 10.966 11.5 10.9018V12.3919C11.0322 12.4616 10.528 12.5 10 12.5C9.472 12.5 8.9678 12.4616 8.5 12.3919ZM3.5 7.71464C3.04647 7.60388 2.62885 7.46326 2.25928 7.29695C1.99139 7.1764 1.73275 7.03424 1.5 6.87067V7.75C1.5 8.05272 1.79611 8.49261 2.66921 8.88543C2.91653 8.9967 3.19525 9.09642 3.5 9.18152V7.71464ZM14.5 8.24743L14.5 8.25V8.25351C14.4977 8.55611 14.2005 8.99412 13.3308 9.38542C12.9356 9.56321 12.4603 9.7115 11.9266 9.81784C11.9108 9.82018 11.8952 9.82325 11.8798 9.82704C11.3095 9.93737 10.6741 9.99998 10 9.99998C9.76049 9.99998 9.52556 9.99199 9.29648 9.9767C9.45127 9.92085 9.59969 9.861 9.74109 9.79738C10.6774 9.37614 11.5 8.69103 11.5 7.75V6.60791C12.3571 6.73703 13.0865 6.96946 13.6165 7.2579C14.2813 7.61977 14.4986 7.98712 14.5 8.24743ZM12.5 10.715V12.1815C12.8048 12.0964 13.0835 11.9967 13.3308 11.8854C14.2039 11.4926 14.5 11.0527 14.5 10.75V9.87134C14.2674 10.0348 14.0089 10.1769 13.7411 10.2974C13.3714 10.4637 12.9537 10.6043 12.5 10.715Z" fill="currentColor"/>
  </svg>
);

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const s = '$' + fmt(abs);
  return v < 0 ? '-' + s : s;
}

/* ─── Data shape — mirrors the deposit/true-up model used by the "regular"
     invoice selections wizard, so this one looks and behaves the same way.
     Fed via props from AIAPayApp's own MODAL_ALLOWANCES/scenario data rather
     than importing selectionsData.ts directly. ─── */
export interface Selections2Selection {
  id: string;
  title: string;
  name: string;
  costCode: string;
  costType: string;
  approvedPrice: number;
  status: 'done' | 'pending';
  alreadyInvoiced?: boolean;
}
export interface Selections2Allowance {
  id: string;
  name: string;
  costCode: string;
  budgetAmount: number;
  billedUpfront: number;
  scenarioNote: string;
  // Cabinet Hardware's scenario: the underage credit only invoices once the
  // builder has explicitly marked the allowance complete elsewhere (tracked
  // via completedIds) — everything else auto-completes like the other wizard.
  requiresManualComplete?: boolean;
  selections: Selections2Selection[];
}
export interface Selections2Standalone {
  id: string;
  title?: string;
  name: string;
  costCode: string;
  costType: string;
  approvedPrice: number;
  scenarioNote?: string;
}

/* ─── Outgoing payload shape (matches handleSelectionsWizardAdd in AIAPayApp) ─── */
interface OutChild {
  id: string;
  lineItem: string;
  costCode: string;
  costType?: string;
  selection: string;
  newInvoiceAmt: number | null;
  sourceChildIds?: string[];
  rolledUp?: { name: string; amount: number; costCode?: string; isAllowance?: boolean }[];
}
interface OutGroup {
  id: string;
  type: 'allowance' | 'selection';
  name: string;
  children: OutChild[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: OutGroup[], opts?: { grouped?: boolean }) => void;
  data: Selections2Allowance[];
  standalone: Selections2Standalone[];
  /** Real selection/standalone ids already on this invoice (so re-open hides them). */
  addedChildIds?: string[];
  /** Allowance ids the builder has marked complete elsewhere (drives requiresManualComplete). */
  completedIds?: Set<string>;
}

/* ─── Component ─── */
export default function SelectionsModal2({ open, onClose, onAdd, data: allData, standalone: allStandalone, addedChildIds = [], completedIds }: Props) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [includeDescs, setIncludeDescs] = useState(true);
  const [groupLineItems, setGroupLineItems] = useState(true);

  const addedSet = new Set(addedChildIds);
  // An allowance is "already added" once any of its real selection ids are on
  // the invoice — they're always added together as one net line. A selection
  // still being chosen blocks the whole allowance from appearing at all — it
  // reconciles automatically once every selection on it is finalized (matches
  // the regular invoice wizard's behavior exactly).
  const data = allData.filter(a =>
    !a.selections.some(s => addedSet.has(s.id)) &&
    !a.selections.some(s => s.status === 'pending'),
  );
  const standalone = allStandalone.filter(s => !addedSet.has(s.id));

  useEffect(() => {
    if (!open) return;
    const done: Record<string, boolean> = {};
    const e: Record<string, boolean> = {};
    data.forEach(a => {
      e[a.id] = true;
      const hasPend = a.selections.some(s => s.status === 'pending');
      if (hasPend) return;
      done[a.id] = a.requiresManualComplete ? !!completedIds?.has(a.id) : true;
    });
    setCompleted(done);
    setChecked({});
    setExpanded(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, completedIds]);

  if (!open) return null;

  const doneTotal = (a: Selections2Allowance) =>
    a.selections.filter(s => s.status === 'done').reduce((sum, s) => sum + s.approvedPrice, 0);
  const newDoneTotal = (a: Selections2Allowance) =>
    a.selections.filter(s => s.status === 'done' && !s.alreadyInvoiced).reduce((sum, s) => sum + s.approvedPrice, 0);
  const hasPending = (a: Selections2Allowance) => a.selections.some(s => s.status === 'pending');
  const noDeposit = (a: Selections2Allowance) => a.billedUpfront === 0;
  const reInvoiced = (a: Selections2Allowance) => a.selections.some(s => s.status === 'done' && s.alreadyInvoiced);
  const selectionAmount = (a: Selections2Allowance) => reInvoiced(a) ? newDoneTotal(a) : doneTotal(a);
  const variance = (a: Selections2Allowance) => reInvoiced(a) ? newDoneTotal(a) : doneTotal(a) - a.billedUpfront;
  const isComplete = (a: Selections2Allowance) => !!completed[a.id];
  const needsManualComplete = (a: Selections2Allowance) => !!a.requiresManualComplete && !isComplete(a) && !hasPending(a);
  const isTrueable = (a: Selections2Allowance) => isComplete(a) && !hasPending(a);
  const settled = (a: Selections2Allowance) => isTrueable(a) && !noDeposit(a) && !reInvoiced(a) && variance(a) === 0;

  const toggleCheck = (a: Selections2Allowance) => {
    if (!isTrueable(a) || variance(a) === 0) return;
    setChecked(c => ({ ...c, [a.id]: !c[a.id] }));
  };
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleStandalone = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));

  const catOf = (cc: string) => { const i = cc.indexOf(' - '); return i >= 0 ? cc.slice(i + 3).trim() : cc; };

  const triState = (ids: string[]): 'all' | 'none' | 'partial' => {
    if (ids.length === 0) return 'none';
    const on = ids.filter(id => checked[id]).length;
    return on === 0 ? 'none' : on === ids.length ? 'all' : 'partial';
  };
  const setMany = (ids: string[], val: boolean) => setChecked(c => { const n = { ...c }; ids.forEach(id => { n[id] = val; }); return n; });
  const chargeCards = data.filter(a => variance(a) >= 0);
  const creditCards = data.filter(a => variance(a) < 0);
  const chargeIds = chargeCards.filter(a => isTrueable(a) && variance(a) !== 0).map(a => a.id);
  const creditIds = creditCards.filter(a => isTrueable(a)).map(a => a.id);
  const selKeys = standalone.map(s => s.id);
  const selSelState = triState(selKeys);
  const toggleSel = () => setMany(selKeys, selSelState !== 'all');
  const allBillableIds = [...chargeIds, ...creditIds, ...selKeys];
  const allSelState = triState(allBillableIds);
  const toggleAll = () => setMany(allBillableIds, allSelState !== 'all');

  const stripAllowance = (n: string) => n.replace(/\s*Allowance$/i, '').trim();
  const clientTitle = (a: Selections2Allowance): string => {
    if (settled(a)) return `${a.name} — reconciled (on budget)`;
    if (noDeposit(a)) return `${stripAllowance(a.name)} — selections`;
    if (reInvoiced(a)) {
      const n = a.selections.filter(s => s.status === 'done' && !s.alreadyInvoiced).length;
      return `${a.name} — additional selection${n > 1 ? 's' : ''}`;
    }
    return variance(a) < 0 ? `${a.name} — credit` : `${a.name} — final balance`;
  };

  // Build the outgoing payload: ONE net line per checked allowance. sourceChildIds
  // carries the REAL underlying selection ids (not a synthetic wrapper id) so
  // AIAPayApp's id-based SOV lookup (ESTIMATE_LINES) can still resolve them.
  const outgoing: OutGroup[] = data
    .filter(a => isTrueable(a) && variance(a) !== 0 && checked[a.id])
    .map(a => {
      const ccName = catOf(a.costCode);
      const ri = reInvoiced(a);
      const rolledSelections = a.selections.filter(s => s.status === 'done' && (!ri || !s.alreadyInvoiced));
      const showReversal = !noDeposit(a) && !ri;

      const movements: { name: string; amount: number; costCode: string; isAllowance?: boolean }[] = [
        ...(showReversal ? [{ name: `${a.name} (previously invoiced)`, amount: -a.billedUpfront, costCode: a.costCode, isAllowance: true }] : []),
        ...rolledSelections.map(s => ({ name: s.name, amount: s.approvedPrice, costCode: s.costCode })),
      ];

      return {
        id: a.id,
        type: 'allowance' as const,
        name: clientTitle(a),
        children: [{
          id: `${a.id}-trueup`,
          lineItem: ccName,
          costCode: a.costCode,
          costType: 'Allowance',
          selection: 'Allowance',
          newInvoiceAmt: variance(a),
          sourceChildIds: rolledSelections.map(s => s.id),
          rolledUp: movements,
        }],
      };
    });

  const outgoingStandalone: OutGroup[] = standalone
    .filter(s => checked[s.id])
    .map(s => ({
      id: s.id,
      type: 'selection' as const,
      name: s.name,
      children: [{
        id: s.id,
        lineItem: s.name,
        costCode: s.costCode,
        costType: s.costType,
        selection: s.name,
        newInvoiceAmt: s.approvedPrice,
        sourceChildIds: [s.id],
      }],
    }));

  const allOutgoing = [...outgoing, ...outgoingStandalone];

  const invoiceSubtotal = allOutgoing.reduce(
    (s, g) => s + g.children.reduce((cs, c) => cs + (c.newInvoiceAmt ?? 0), 0), 0);
  const selectedCount = allOutgoing.length;

  const handleCreate = () => {
    if (allOutgoing.length > 0) onAdd(allOutgoing, { grouped: groupLineItems });
    onClose();
  };

  const chevron = (isOpen: boolean) => (
    <span className={"est-group-chevron" + (isOpen ? " open" : "")}>&#9654;</span>
  );

  const allExpanded = data.length > 0 && data.every(a => expanded[a.id]);
  const toggleExpandAll = () => {
    const next = !allExpanded;
    setExpanded(e => { const v = { ...e }; data.forEach(a => { v[a.id] = next; }); return v; });
  };

  const renderAllowance = (a: Selections2Allowance) => {
    const isOpen = !!expanded[a.id];
    const ri = reInvoiced(a);
    const isSettled = settled(a);
    const gated = needsManualComplete(a);
    const sel = selectionAmount(a);
    const v = variance(a);
    const isOn = !!checked[a.id];
    const showFull = !reInvoiced(a);
    const disabled = isSettled || gated;

    return (
      <div key={a.id} className={"selv2-group" + (isSettled ? ' is-settled' : '')}>
        <div className="selv2-group-header">
          <div className="selv2-group-left">
            <div
              className={"est-check" + (isOn ? ' on' : '') + (disabled ? ' disabled' : '')}
              onClick={disabled ? undefined : () => toggleCheck(a)}
              title={
                isSettled ? 'Reconciles once marked complete — nothing to invoice here'
                  : gated ? 'Mark this allowance complete on the Selections page to invoice the underage credit'
                    : isOn ? 'Will be added to this invoice' : 'Add to this invoice'
              }
            />
            <button type="button" className="selv2-chev-btn" onClick={() => toggleExpand(a.id)}>
              {chevron(isOpen)}
            </button>
            <span className="selv2-group-icon"><AllowanceIcon /></span>
            <span className="selv2-group-name">{a.name}</span>
            {isSettled && <span className="selv2-settled-badge">Settled · on budget</span>}
            {gated && <span className="selv2-pill selv2-pill-muted">Mark complete to invoice</span>}
            <ScenarioTooltip note={
              isSettled
                ? `Allowance previously invoiced $${fmt(a.billedUpfront)}. The selections reconciled exactly on budget, so there's nothing to invoice.`
                : gated
                  ? `${a.scenarioNote} Mark the allowance complete on the Selections page to lock the credit and invoice it here.`
                  : reInvoiced(a)
                    ? `${a.scenarioNote} Because there's no allowance credit to net against on this line, we show just the invoice amount.`
                    : `Allowance previously invoiced $${fmt(a.billedUpfront)}. ${a.scenarioNote}`
            } />
          </div>
          <div className="selv2-group-meta">
            {showFull ? (
              <>
                <div className="selv2-meta-item">
                  <div className="selv2-meta-label">Previously invoiced allowance</div>
                  <div className="selv2-meta-value">${fmt(a.billedUpfront)}</div>
                </div>
                <div className="selv2-meta-item">
                  <div className="selv2-meta-label">Selection amount</div>
                  <div className="selv2-meta-value">${fmt(sel)}</div>
                </div>
                <div className="selv2-meta-item">
                  <div className="selv2-meta-label">Invoice amount</div>
                  <div className="selv2-meta-value selv2-meta-value-total">
                    {fmtCurrency(v)}
                  </div>
                </div>
              </>
            ) : (
              <div className="selv2-meta-item">
                <div className="selv2-meta-label">Invoice amount</div>
                <div className="selv2-meta-value selv2-meta-value-total">
                  {fmtCurrency(v)}
                </div>
              </div>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="selv2-children">
            <table className="selv2-table">
              <colgroup>
                <col style={{ width: 40 }} />
                <col />
                <col />
                <col style={{ width: 150 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Selection line item</th>
                  <th>Selection title</th>
                  <th>Cost code</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {a.selections.filter(s => s.status === 'done' && (!ri || !s.alreadyInvoiced)).map(s => (
                  <tr key={s.id}>
                    <td></td>
                    <td>
                      <div className="selv2-cell-name">
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td>{s.title}</td>
                    <td className="selv2-cell-mono">{s.costCode}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>${fmt(s.approvedPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal selv2-modal" onClick={e => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <div>
            <h2 className="selv2-title">Add selections to invoice</h2>
          </div>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body selv2-body">
          <div className="selv2-desc">
            Invoice for post-contract allowance overages and selection option changes. Previously invoiced allowances will be credited against new approved selections.
          </div>

          <div className="selv2-controls">
            <label className="selv2-inline-check selv2-controls-primary" onClick={toggleAll}>
              <div className={"est-check" + (allSelState === 'all' ? ' on' : allSelState === 'partial' ? ' partial' : '')} />
              <span className="selv2-controls-label">Select all</span>
            </label>
            <label className="selv2-inline-check selv2-controls-opt" onClick={() => setIncludeDescs(v => !v)}>
              <div className={"est-check" + (includeDescs ? ' on' : '')} />
              Include descriptions
            </label>
            <label className="selv2-inline-check selv2-controls-opt" onClick={() => setGroupLineItems(v => !v)}>
              <div className={"est-check" + (groupLineItems ? ' on' : '')} />
              Group line items
            </label>
            <div className="selv2-controls-spacer" />
            <button type="button" className="est-expand-btn" onClick={toggleExpandAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20l5-5 5 5" /><path d="M7 4l5 5 5-5" /></svg>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="selv2-sections">
            {chargeCards.length > 0 && (
              <>
                <div className="selv2-section-label">Allowances with selections</div>
                {chargeCards.map(renderAllowance)}
              </>
            )}
            {creditCards.length > 0 && (
              <>
                <div className="selv2-section-label" style={{ marginTop: chargeCards.length > 0 ? 24 : 0 }}>Credits owed</div>
                <div className="selv2-section-help">You've invoiced more than the approved selections on these completed allowances. Apply the credit to this invoice, or refund it at the end of the job.</div>
                {creditCards.map(renderAllowance)}
              </>
            )}
            {standalone.length > 0 && (
              <>
                <div className="selv2-section-label" style={{ marginTop: data.length > 0 ? 24 : 0 }}>Selections</div>
                <div className="selv2-children" style={{ background: 'white', border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
                  <table className="selv2-table">
                    <colgroup>
                      <col style={{ width: 40 }} />
                      <col />
                      <col />
                      <col style={{ width: 150 }} />
                      <col style={{ width: 130 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th><div className={"est-check" + (selSelState === 'all' ? ' on' : selSelState === 'partial' ? ' partial' : '')} onClick={toggleSel} style={{ cursor: 'pointer' }} title="Select all selections" /></th>
                        <th>Selection line item</th>
                        <th>Selection title</th>
                        <th>Cost code</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standalone.map(s => {
                        const isOn = !!checked[s.id];
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className={"est-check" + (isOn ? ' on' : '')} onClick={() => toggleStandalone(s.id)} />
                            </td>
                            <td>
                              <div className="selv2-cell-name">
                                <span>{s.name}</span>
                              </div>
                            </td>
                            <td>{s.title || <span style={{ color: 'var(--g400)' }}>—</span>}</td>
                            <td className="selv2-cell-mono">{s.costCode}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>${fmt(s.approvedPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {data.length === 0 && standalone.length === 0 && (
              <div className="selv2-empty">No selections to add.</div>
            )}
          </div>
        </div>

        <div className="selv2-footer">
          <div className="selv2-footer-summary">
            <span className="selv2-footer-summary-label">Subtotal added to invoice</span>
            <span className="selv2-footer-summary-amount">{fmtCurrency(invoiceSubtotal)}</span>
          </div>
          <div className="selv2-footer-buttons">
            <button className="btn btn-s" onClick={onClose}>Cancel</button>
            <button className="btn btn-p" onClick={handleCreate} disabled={selectedCount === 0}>
              Add line items
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
