import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import {
  DEPOSIT_TRUEUP_ALLOWANCES,
  INVOICE_STANDALONE_SELECTION_GROUPS,
  type DepositTrueUpAllowance,
  type StandaloneSelectionGroup,
} from '../selectionsData';

/* ─────────────────────────────────────────────────────────────────────────
   Shared selection cards — the allowance / standalone-selection cards used
   by "Add selections to invoice" (SelectionsModalV5) and by the combined
   "Add to invoice" view (AddFromAllModal). Both surfaces render the SAME
   cards off the SAME data so the combined view can't drift from the
   selections wizard, which is the source of truth for this flow.

   State (which cards are checked / expanded / marked complete) stays with
   the host component; everything here is derived from the data.
   ───────────────────────────────────────────────────────────────────────── */

/* ─── Scenario note tooltip ─── */
export function ScenarioTooltip({ note }: { note: string }) {
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

export const AllowanceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25928 3.20305C1.32316 3.6243 0.5 4.30937 0.5 5.25V7.75C0.5 8.69103 1.32264 9.37614 2.25891 9.79738C2.88695 10.0799 3.6538 10.2883 4.5 10.4019V10.75C4.5 11.691 5.32264 12.3761 6.25891 12.7974C7.24189 13.2396 8.56489 13.5 10 13.5C11.4351 13.5 12.7581 13.2396 13.7411 12.7974C14.6774 12.3761 15.5 11.691 15.5 10.75V8.25655L15.5 8.24998C15.5 7.42295 14.8571 6.79464 14.0945 6.37957C13.4062 6.00494 12.5055 5.7344 11.5 5.59774V5.25C11.5 4.30937 10.6768 3.6243 9.74072 3.20305C8.75766 2.76067 7.43467 2.5 6 2.5C4.56533 2.5 3.24234 2.76067 2.25928 3.20305ZM2.66965 4.11497C1.79613 4.50806 1.5 4.94799 1.5 5.25C1.5 5.55201 1.79613 5.99194 2.66965 6.38503C3.06609 6.56343 3.54313 6.71216 4.07865 6.81865C4.09098 6.8206 4.10317 6.823 4.11519 6.82583C4.68689 6.93692 5.32401 7 6 7C6.67599 7 7.31311 6.93692 7.88481 6.82583C7.89683 6.823 7.90902 6.8206 7.92135 6.81865C8.45687 6.71216 8.93391 6.56343 9.33035 6.38503C10.2039 5.99194 10.5 5.55201 10.5 5.25C10.5 4.94799 10.2039 4.50806 9.33035 4.11497C8.50376 3.74301 7.32675 3.5 6 3.5C4.67325 3.5 3.49624 3.74301 2.66965 4.11497ZM7.5 7.90171C7.02174 7.966 6.51815 8 6 8C5.48185 8 4.97826 7.966 4.5 7.90171V9.39193C4.9678 9.46159 5.472 9.5 6 9.5C6.528 9.5 7.0322 9.46159 7.5 9.39193V7.90171ZM8.5 9.18152V7.71464C8.95353 7.60388 9.37115 7.46326 9.74072 7.29695C10.0086 7.1764 10.2673 7.03424 10.5 6.87067V7.75C10.5 8.05272 10.2039 8.49261 9.33079 8.88543C9.08347 8.9967 8.80475 9.09642 8.5 9.18152ZM7.5 10.7151C7.21945 10.6471 6.95296 10.5679 6.70349 10.4789C6.47276 10.4928 6.23792 10.5 6 10.5C5.83167 10.5 5.66488 10.4964 5.5 10.4894V10.75C5.5 11.0527 5.79611 11.4926 6.66921 11.8854C6.91653 11.9967 7.19525 12.0964 7.5 12.1815V10.7151ZM8.5 12.3919V10.9015C8.97789 10.9657 9.48154 11 10 11C10.5182 11 11.0218 10.966 11.5 10.9018V12.3919C11.0322 12.4616 10.528 12.5 10 12.5C9.472 12.5 8.9678 12.4616 8.5 12.3919ZM3.5 7.71464C3.04647 7.60388 2.62885 7.46326 2.25928 7.29695C1.99139 7.1764 1.73275 7.03424 1.5 6.87067V7.75C1.5 8.05272 1.79611 8.49261 2.66921 8.88543C2.91653 8.9967 3.19525 9.09642 3.5 9.18152V7.71464ZM14.5 8.24743L14.5 8.25V8.25351C14.4977 8.55611 14.2005 8.99412 13.3308 9.38542C12.9356 9.56321 12.4603 9.7115 11.9266 9.81784C11.9108 9.82018 11.8952 9.82325 11.8798 9.82704C11.3095 9.93737 10.6741 9.99998 10 9.99998C9.76049 9.99998 9.52556 9.99199 9.29648 9.9767C9.45127 9.92085 9.59969 9.861 9.74109 9.79738C10.6774 9.37614 11.5 8.69103 11.5 7.75V6.60791C12.3571 6.73703 13.0865 6.96946 13.6165 7.2579C14.2813 7.61977 14.4986 7.98712 14.5 8.24743ZM12.5 10.715V12.1815C12.8048 12.0964 13.0835 11.9967 13.3308 11.8854C14.2039 11.4926 14.5 11.0527 14.5 10.75V9.87134C14.2674 10.0348 14.0089 10.1769 13.7411 10.2974C13.3714 10.4637 12.9537 10.6043 12.5 10.715Z" fill="currentColor"/>
  </svg>
);

export const SelectionIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.55443 0.826519C1.64598 0.307348 2.12272 -0.0471547 2.63892 0.00510098L2.71289 0.0153593L6.15972 0.623128C6.67889 0.714673 7.03339 1.19141 6.98113 1.70761L6.97088 1.78158L6.278 5.708L10.025 4.34428C10.5192 4.16438 11.0633 4.39852 11.2771 4.86954L11.3067 4.94195L12.5038 8.23088C12.5877 8.46141 12.5837 8.71404 12.4939 8.94088L12.4932 11.6711C12.4932 12.1983 12.0853 12.6302 11.5679 12.6684L11.4932 12.6711H2.74322C2.60006 12.6711 2.45964 12.6602 2.31842 12.6381C0.836606 12.406 -0.176726 10.9928 0.025735 9.50854L0.0427299 9.39982L1.55443 0.826519ZM11.493 9.663L5.975 11.671L11.4932 11.6711L11.493 9.663ZM1.02754 9.57347L2.53924 1.00017L5.98607 1.60794L4.46664 10.225L4.44771 10.3178C4.24197 11.2051 3.38338 11.7924 2.47301 11.6501C1.51423 11.4999 0.855115 10.5513 1.02754 9.57347ZM10.367 5.28397L6.0775 6.845L5.45145 10.3987C5.42454 10.5513 5.38551 10.6987 5.33552 10.8402L11.5641 8.5729L10.367 5.28397ZM3.49324 9.92112C3.49324 9.50691 3.15745 9.17112 2.74324 9.17112C2.32902 9.17112 1.99324 9.50691 1.99324 9.92112C1.99324 10.3353 2.32902 10.6711 2.74324 10.6711C3.15745 10.6711 3.49324 10.3353 3.49324 9.92112Z" fill="currentColor"/>
  </svg>
);

export function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const s = '$' + fmt(abs);
  return v < 0 ? '-' + s : s;
}

/* ─── Outgoing payload shape (matches handleAddFromSelections in App.tsx) ─── */
export interface OutChild {
  id: string;
  lineItem: string;
  costCode: string;
  costType?: string;
  selection: string;
  newInvoiceAmt: number | null;
  sourceChildIds?: string[];
  rolledUp?: { name: string; amount: number; costCode?: string; isAllowance?: boolean }[];
}
export interface OutGroup {
  id: string;
  type: 'allowance' | 'selection';
  name: string;
  children: OutChild[];
}

/* ─── Derived amounts ─── */
// Sum of finalized selections (pending ones don't count toward the lock).
export const doneTotal = (a: DepositTrueUpAllowance) =>
  a.selections.filter(s => s.status === 'done').reduce((sum, s) => sum + s.approvedPrice, 0);
// Finalized selections that have NOT already been billed on a prior invoice.
export const newDoneTotal = (a: DepositTrueUpAllowance) =>
  a.selections.filter(s => s.status === 'done' && !s.alreadyInvoiced).reduce((sum, s) => sum + s.approvedPrice, 0);
export const hasPending = (a: DepositTrueUpAllowance) => a.selections.some(s => s.status === 'pending');
// No deposit was collected — there's nothing to true up. The finalized
// selections bill at full price as their own line (no deposit row, no
// reversal, no "overage" framing).
export const noDeposit = (a: DepositTrueUpAllowance) => a.billedUpfront === 0;
// "Add more later" / re-invoicing: the deposit was already invoiced AND
// consumed by selections billed on a prior invoice, so there's no credit
// left. A new selection just bills at full price — no reversal, and we don't
// show a "previously invoiced allowance" credit that no longer exists.
export const reInvoiced = (a: DepositTrueUpAllowance) => a.selections.some(s => s.status === 'done' && s.alreadyInvoiced);
// Selection total that matters for THIS invoice.
export const selectionAmount = (a: DepositTrueUpAllowance) => reInvoiced(a) ? newDoneTotal(a) : doneTotal(a);
// Amount to invoice now.
//   re-invoiced → new selections bill at full price (deposit already spent).
//   normal      → finalized selections − what was billed upfront (over/under).
export const variance = (a: DepositTrueUpAllowance) => reInvoiced(a) ? newDoneTotal(a) : doneTotal(a) - a.billedUpfront;
// A fully-locked allowance with non-zero variance is the only thing that
// produces an invoice line.
export const isTrueable = (a: DepositTrueUpAllowance, complete: boolean) => complete && !hasPending(a);
// Reconciled exactly on budget: a deposit was billed and the finalized
// selections match it, so nothing more is owed. Shown as "Settled" (not
// hidden) and still addable as a $0 reconciled line for the record.
export const isSettled = (a: DepositTrueUpAllowance, complete: boolean) =>
  isTrueable(a, complete) && !noDeposit(a) && !reInvoiced(a) && variance(a) === 0;
// Total across a standalone selection's approved options — this is what
// invoices as ONE line, whether it has one option or several.
export const standaloneTotal = (g: StandaloneSelectionGroup) => g.options.reduce((s, o) => s + o.approvedPrice, 0);
export const catOf = (cc: string) => { const i = cc.indexOf(' - '); return i >= 0 ? cc.slice(i + 3).trim() : cc; };

// Client-facing title for the combined invoice line. The bare allowance name
// is ambiguous: it implies a fresh allowance charge even when we're only
// billing selections (no deposit) or reconciling a prior deposit. So the
// title states what this line actually represents on THIS invoice.
const stripAllowance = (n: string) => n.replace(/\s*Allowance$/i, '').trim();
export const clientTitle = (a: DepositTrueUpAllowance, complete: boolean): string => {
  // Reconciled exactly on budget — the deposit covered the selections, $0 due.
  if (isSettled(a, complete)) return `${a.name} — reconciled (on budget)`;
  // No deposit was ever billed — nothing allowance-y is charged, these are
  // just the chosen items. Drop "Allowance" so it doesn't read as a budget.
  if (noDeposit(a)) return `${stripAllowance(a.name)} — selections`;
  // Deposit already reconciled on a prior invoice; this is a genuinely new item.
  if (reInvoiced(a)) {
    const n = a.selections.filter(s => s.status === 'done' && !s.alreadyInvoiced).length;
    return `${a.name} — additional selection${n > 1 ? 's' : ''}`;
  }
  // Normal true-up against a prior deposit: overage settles the balance,
  // underage is a credit back to the client.
  return variance(a) < 0 ? `${a.name} — credit` : `${a.name} — final balance`;
};

/* ─── Which allowances / selections are billable on this invoice ─── */
// Only allowances that are marked complete on the Selections page AND have a
// non-zero amount to invoice reach this wizard. So we exclude:
//   - allowances with a selection still in progress (can't be complete yet)
//   - allowances whose finalized total nets exactly to what was already
//     invoiced (nothing left to bill)
// We also hide an allowance once its line(s) are already on this invoice.
export function availableAllowances(addedChildIds: string[] = []): DepositTrueUpAllowance[] {
  const addedSet = new Set(addedChildIds);
  return DEPOSIT_TRUEUP_ALLOWANCES.filter(a => {
    const alreadyAdded =
      addedSet.has(`${a.id}-trueup`) ||
      a.selections.some(s => addedSet.has(`${a.id}-${s.id}`));
    if (alreadyAdded) return false;
    if (hasPending(a)) return false;
    const billable = reInvoiced(a) ? newDoneTotal(a) : doneTotal(a) - a.billedUpfront;
    // Keep zero-variance allowances that had a deposit to reconcile: they
    // settled exactly on budget, so instead of hiding them we surface them as
    // "Settled · $0 due" so the builder can confirm and close them out.
    return billable !== 0 || (a.billedUpfront > 0 && !reInvoiced(a));
  });
}

// Standalone selections (no allowance backing) — a selection can have
// multiple approved line items under it, and they invoice together as ONE
// line. Hide a group once any of its options is already on this invoice.
export function availableStandalone(addedChildIds: string[] = []): StandaloneSelectionGroup[] {
  const addedSet = new Set(addedChildIds);
  return INVOICE_STANDALONE_SELECTION_GROUPS.filter(g => !g.options.some(o => addedSet.has(o.id)));
}

/* ─── Outgoing payload builders ─── */
// ONE net line per checked allowance, carrying its full breakdown in rolledUp
// (the reversal + each selection, each with its cost code). The invoice
// presents this as a single summary row and can break it out from rolledUp.
export function allowanceToOutGroup(a: DepositTrueUpAllowance, complete: boolean): OutGroup {
  const ccName = catOf(a.costCode);
  const ri = reInvoiced(a);
  // Re-invoiced allowances roll up ONLY the new selections (prior ones are
  // already billed); normal ones roll up all finalized selections.
  const rolledSelections = a.selections.filter(s => s.status === 'done' && (!ri || !s.alreadyInvoiced));
  // Show the deposit reversal only for a normal true-up with a deposit —
  // not when there's no deposit, and not when the deposit is already spent.
  const showReversal = !noDeposit(a) && !ri;

  const movements: { name: string; amount: number; costCode: string; isAllowance?: boolean }[] = [
    ...(showReversal ? [{ name: `${a.name} (previously invoiced)`, amount: -a.billedUpfront, costCode: a.costCode, isAllowance: true }] : []),
    ...rolledSelections.map(s => ({ name: s.name, amount: s.approvedPrice, costCode: s.costCode })),
  ];

  return {
    id: a.id,
    type: 'allowance',
    name: clientTitle(a, complete),
    children: [{
      id: `${a.id}-trueup`,
      lineItem: ccName,
      costCode: a.costCode,
      costType: 'Allowance',
      selection: 'Allowance',
      newInvoiceAmt: variance(a),
      sourceChildIds: [`${a.id}-trueup`],
      rolledUp: movements,
    }],
  };
}

// Standalone selections → ONE net line per selection, carrying every approved
// option in rolledUp — same "net into one line, break out on demand" pattern.
export function standaloneToOutGroup(g: StandaloneSelectionGroup): OutGroup {
  return {
    id: g.id,
    type: 'selection',
    name: g.title,
    children: [{
      id: `${g.id}-sel`,
      lineItem: g.title,
      costCode: g.options[0]?.costCode ?? '',
      costType: g.options[0]?.costType,
      selection: g.title,
      newInvoiceAmt: standaloneTotal(g),
      sourceChildIds: g.options.map(o => o.id),
      rolledUp: g.options.map(o => ({ name: o.name, amount: o.approvedPrice, costCode: o.costCode })),
    }],
  };
}

/* ─── Cards ─── */
const Chevron = ({ open }: { open: boolean }) => (
  <span className={"est-group-chevron" + (open ? " open" : "")}>&#9654;</span>
);

export function AllowanceCard({ a, complete, checked, expanded, onToggleCheck, onToggleExpand, showIcon = true }: {
  a: DepositTrueUpAllowance;
  complete: boolean;
  checked: boolean;
  expanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
  /** The combined "Add to invoice" view renders these titles without the icon. */
  showIcon?: boolean;
}) {
  const ri = reInvoiced(a);        // "add more later": deposit already spent
  const settled = isSettled(a, complete);   // reconciled exactly on budget, $0 due
  const sel = selectionAmount(a); // selections that count for THIS invoice
  const v = variance(a);          // amount to invoice now
  // Re-invoiced allowances (deposit already fully invoiced & reconciled, only a
  // new selection billed now) collapse to a single "Invoice amount" metric —
  // there's no allowance credit to net against, so previously-invoiced and
  // selection-amount would just be noise. Everything else shows all three
  // (a no-deposit allowance shows "Previously invoiced $0" for clarity).
  const showFull = !ri;

  return (
    <div className={"selv2-group" + (settled ? ' is-settled' : '')}>
      <div className="selv2-group-header">
        <div className="selv2-group-left">
          {/* A settled (on-budget) allowance isn't invoiced here — it reconciles
              once marked complete — so its checkbox is disabled. */}
          <div
            className={"est-check" + (checked ? ' on' : '') + (settled ? ' disabled' : '')}
            onClick={settled ? undefined : onToggleCheck}
            title={settled ? 'Reconciles once marked complete — nothing to invoice here' : checked ? 'Will be added to this invoice' : 'Add to this invoice'}
          />
          <button type="button" className="selv2-chev-btn" onClick={onToggleExpand}>
            <Chevron open={expanded} />
          </button>
          {showIcon && <span className="selv2-group-icon"><AllowanceIcon /></span>}
          <span className="selv2-group-name">{a.name}</span>
          {settled && <span className="selv2-settled-badge">Settled · on budget</span>}
          <ScenarioTooltip note={
            settled
              ? `Allowance previously invoiced $${fmt(a.billedUpfront)}. The selections reconciled exactly on budget, so there's nothing to invoice. This is shown here only as an example — in the live product it won't appear in the wizard; it reconciles automatically once the allowance is marked complete.`
              : ri
                ? `${a.scenarioNote} Because there's no allowance credit to net against on this line, we show just the invoice amount — the "previously invoiced allowance" and "selection amount" columns are omitted.`
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

      {expanded && (
        <div className="selv2-children">
          <table className="selv2-table">
            <colgroup>
              <col style={{ width: 40 }} />
              <col />
              <col />
              <col style={{ width: 190 }} />
              <col style={{ width: 130 }} />
            </colgroup>
            <thead>
              <tr>
                <th></th>
                <th>Option line item</th>
                <th>Selection title</th>
                <th>Cost code</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* The previously-invoiced allowance is shown in the card header
                  (not as a grid row) — it isn't billable here, only context.
                  For re-invoiced allowances, selections already billed on a
                  prior invoice are omitted — only the new ones are billable. */}
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
}

// A standalone selection — same card shell as an allowance (single checkbox,
// expandable breakdown), but no deposit/variance concept: just a decision with
// one or more approved options that invoice together as one line.
export function StandaloneCard({ g, checked, expanded, onToggleCheck, onToggleExpand }: {
  g: StandaloneSelectionGroup;
  checked: boolean;
  expanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
}) {
  const total = standaloneTotal(g);

  return (
    <div className="selv2-group">
      <div className="selv2-group-header">
        <div className="selv2-group-left">
          <div
            className={"est-check" + (checked ? ' on' : '')}
            onClick={onToggleCheck}
            title={checked ? 'Will be added to this invoice' : 'Add to this invoice'}
          />
          <button type="button" className="selv2-chev-btn" onClick={onToggleExpand}>
            <Chevron open={expanded} />
          </button>
          <span className="selv2-group-icon"><SelectionIcon /></span>
          <span className="selv2-group-name">{g.title}</span>
          {g.scenarioNote && <ScenarioTooltip note={g.scenarioNote} />}
        </div>
        <div className="selv2-group-meta">
          <div className="selv2-meta-item">
            <div className="selv2-meta-label">Invoice amount</div>
            <div className="selv2-meta-value selv2-meta-value-total">
              {fmtCurrency(total)}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="selv2-children">
          <table className="selv2-table">
            <colgroup>
              <col style={{ width: 40 }} />
              <col />
              <col style={{ width: 190 }} />
              <col style={{ width: 130 }} />
            </colgroup>
            <thead>
              <tr>
                <th></th>
                <th>Option line item</th>
                <th>Cost code</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {g.options.map(o => (
                <tr key={o.id}>
                  <td></td>
                  <td>
                    <div className="selv2-cell-name">
                      <span>{o.name}</span>
                    </div>
                  </td>
                  <td className="selv2-cell-mono">{o.costCode}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>${fmt(o.approvedPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
