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

const SelectionIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.55443 0.826519C1.64598 0.307348 2.12272 -0.0471547 2.63892 0.00510098L2.71289 0.0153593L6.15972 0.623128C6.67889 0.714673 7.03339 1.19141 6.98113 1.70761L6.97088 1.78158L6.278 5.708L10.025 4.34428C10.5192 4.16438 11.0633 4.39852 11.2771 4.86954L11.3067 4.94195L12.5038 8.23088C12.5877 8.46141 12.5837 8.71404 12.4939 8.94088L12.4932 11.6711C12.4932 12.1983 12.0853 12.6302 11.5679 12.6684L11.4932 12.6711H2.74322C2.60006 12.6711 2.45964 12.6602 2.31842 12.6381C0.836606 12.406 -0.176726 10.9928 0.025735 9.50854L0.0427299 9.39982L1.55443 0.826519ZM11.493 9.663L5.975 11.671L11.4932 11.6711L11.493 9.663ZM1.02754 9.57347L2.53924 1.00017L5.98607 1.60794L4.46664 10.225L4.44771 10.3178C4.24197 11.2051 3.38338 11.7924 2.47301 11.6501C1.51423 11.4999 0.855115 10.5513 1.02754 9.57347ZM10.367 5.28397L6.0775 6.845L5.45145 10.3987C5.42454 10.5513 5.38551 10.6987 5.33552 10.8402L11.5641 8.5729L10.367 5.28397ZM3.49324 9.92112C3.49324 9.50691 3.15745 9.17112 2.74324 9.17112C2.32902 9.17112 1.99324 9.50691 1.99324 9.92112C1.99324 10.3353 2.32902 10.6711 2.74324 10.6711C3.15745 10.6711 3.49324 10.3353 3.49324 9.92112Z" fill="currentColor"/>
  </svg>
);

/* ─── Types (matches V1 SelectionsModal data shape) ─── */
interface SelectionChild {
  id: string;
  lineItem: string;
  costCode: string;
  costType?: string;
  selection: string;
  selectionStatus?: string;
  price: number;
  newInvoiceAmt: number | null;
  // Breakdown of rows that were netted into this one. Populated by the
  // wizard when "Combine same-cost-code lines" is on so the invoice page
  // can expand the netted line back into its components.
  rolledUp?: { name: string; amount: number }[];
  // Source child ids that contributed to this outgoing row. Used by the
  // host to track which children are already on the invoice so the wizard
  // can hide them on re-open even when only some children of a group were added.
  sourceChildIds?: string[];
}

interface SelectionGroup {
  id: string;
  type: 'allowance' | 'selection';
  name: string;
  scenarioNote?: string;
  revisedPrice: number;
  previouslyInvoiced: number;
  invoiceBalance: number;
  allowanceBudget?: number;
  overage?: number;
  status?: string;
  isComplete?: boolean;
  children: SelectionChild[];
  // Tells the host to update an existing allowance line on the invoice
  // (rather than add a new one). Set when the allowance was billed in a
  // prior wizard round and this round's new selections changed the math.
  allowanceUpdate?: number;
  allowanceChildId?: string;
  // When provided, the host also rewrites the line's childIds + rolledUp
  // so future rounds correctly see the absorbed selections as already added.
  allowanceUpdateChildIds?: string[];
  allowanceUpdateRolledUp?: { name: string; amount: number; isAllowance?: boolean }[];
}

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const s = '$' + fmt(abs);
  return v < 0 ? '-' + s : s;
}

/* ─── Component ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: SelectionGroup[]) => void;
  jobName: string;
  data: SelectionGroup[];
  addedChildIds?: string[];
}

export default function SelectionsModalV2({ open, onClose, onAdd, jobName, data, addedChildIds = [] }: Props) {
  const addedChildSet = new Set(addedChildIds);
  const isAlreadyAdded = (c: SelectionChild) => addedChildSet.has(c.id);
  // Keep already-added children visible so the user sees what's billed here,
  // but drop a group entirely when every billable child has been added (nothing
  // actionable left). The allowance math below treats already-added selections
  // as if they're checked so the budget decreases correctly.
  const availableData = data.filter(g =>
    g.children.some(c => !isAlreadyAdded(c) && (c.newInvoiceAmt !== null || c.selection === 'Allowance')),
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [includeDescs, setIncludeDescs] = useState(true);
  const [groupByCode, setGroupByCode] = useState(true);

  // V2 model: per-row checkboxes. Two distinct flows depending on whether
  // the allowance was already invoiced.
  //
  // NOT pre-invoiced:
  //   Selections bill at full approved price.
  //   Allowance row = REMAINING budget (budget − checked selections), clamped ≥ 0.
  //   Checking both never double-bills; an overage just zeroes the allowance.
  //
  // PRE-invoiced (g.previouslyInvoiced > 0):
  //   The allowance budget was already billed. Selections don't bill individually
  //   (would double-bill). The allowance row repurposes as a NET ADJUSTMENT:
  //     net = checked selections − previously invoiced
  //     net < 0 → credit owed to client
  //     net > 0 → overage to invoice
  //   Only the net line goes on the invoice for this group.
  const isPreInvoiced = (g: SelectionGroup) => g.previouslyInvoiced > 0;

  const isBillable = (g: SelectionGroup, c: SelectionChild) => {
    // Already added to this invoice via a prior wizard run — not re-billable here.
    if (isAlreadyAdded(c)) return false;
    if (c.selection === 'Allowance') {
      // Marked complete + never pre-invoiced: allowance closes out on the
      // budget side, only the selections are billable on this invoice.
      if (g.isComplete && !isPreInvoiced(g)) return false;
      return true;
    }
    return c.newInvoiceAmt !== null;
  };

  // Remaining allowance budget for a pre-invoiced group, after subtracting
  // any selections that were already invoiced against it. When this hits 0
  // the allowance is exhausted — new selections bill at full price with no
  // adjustment line.
  const remainingBudget = (g: SelectionGroup): number => {
    if (!isPreInvoiced(g)) return g.allowanceBudget ?? 0;
    const alreadyInvoiced = g.children
      .filter(child => child.selection !== 'Allowance' && child.newInvoiceAmt === null)
      .reduce((s, child) => s + child.price, 0);
    return Math.max(0, g.previouslyInvoiced - alreadyInvoiced);
  };

  const effectiveAmount = (g: SelectionGroup, c: SelectionChild): number => {
    if (c.selection !== 'Allowance') return c.price;
    // Selections already on this invoice consume budget the same as newly
    // checked ones — otherwise the allowance row would ignore prior wizard
    // adds and overstate the remaining balance.
    const checkedSelTotal = g.children
      .filter(child => child.selection !== 'Allowance' && (checked[child.id] || isAlreadyAdded(child)))
      .reduce((s, child) => s + child.price, 0);
    if (isPreInvoiced(g)) {
      const remaining = remainingBudget(g);
      // Allowance exhausted by prior invoiced selections — no adjustment.
      if (remaining === 0) return 0;
      return checkedSelTotal - remaining;
    }
    return Math.max(0, c.price - checkedSelTotal);
  };

  // Checkable now = billable AND has a non-zero effective amount.
  // Pre-invoiced allowance rows are NEVER checkable directly — checking the
  // selections drives the net automatically (avoiding the "I checked
  // selections but the wizard says $0" footgun).
  const isCheckable = (g: SelectionGroup, c: SelectionChild) => {
    if (!isBillable(g, c)) return false;
    if (c.selection === 'Allowance') {
      if (isPreInvoiced(g)) return false;
      return effectiveAmount(g, c) > 0;
    }
    return true;
  };

  // Allowance is "credit owed" when it's marked complete, was pre-invoiced,
  // and the previously-invoiced amount exceeds the approved selections that
  // are still billable. Surfaces in a dedicated section at the top of the
  // wizard so the builder doesn't have to hunt for unsettled overpayments.
  const creditAmount = (g: SelectionGroup): number => {
    if (!g.isComplete || !isPreInvoiced(g)) return 0;
    const approvedTotal = g.children
      .filter(c => c.selection !== 'Allowance')
      .reduce((s, c) => s + c.price, 0);
    return Math.max(0, g.previouslyInvoiced - approvedTotal);
  };
  const creditKey = (g: SelectionGroup) => `${g.id}-credit`;

  useEffect(() => {
    if (!open) return;
    const e: Record<string, boolean> = {};
    availableData.forEach(g => { e[g.id] = true; });
    setChecked({});
    setExpanded(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const creditsOwed = availableData.filter(g => g.type === 'allowance' && creditAmount(g) > 0);
  const creditIds = new Set(creditsOwed.map(g => g.id));
  const allowances = availableData.filter(g => g.type === 'allowance' && !creditIds.has(g.id));
  const standalone = availableData.filter(g => g.type === 'selection');

  const toggleChild = (g: SelectionGroup, c: SelectionChild) => {
    // Allow unchecking even when not checkable now (e.g. user previously
    // checked the allowance, then checked selections that covered it — they
    // should still be able to clear the stale check).
    if (!isBillable(g, c)) return;
    if (!checked[c.id] && !isCheckable(g, c)) return;
    setChecked(s => ({ ...s, [c.id]: !s[c.id] }));
  };
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Tri-state per group — considers only currently-checkable children.
  const groupState = (g: SelectionGroup): 'all' | 'none' | 'partial' => {
    const checkable = g.children.filter(c => isCheckable(g, c) || checked[c.id]);
    if (checkable.length === 0) return 'none';
    const onCount = checkable.filter(c => checked[c.id]).length;
    if (onCount === 0) return 'none';
    if (onCount === checkable.length) return 'all';
    return 'partial';
  };

  const toggleGroup = (g: SelectionGroup) => {
    const state = groupState(g);
    const next = state !== 'all';
    setChecked(s => {
      const c = { ...s };
      g.children.forEach(child => {
        if (isCheckable(g, child) || c[child.id]) c[child.id] = next;
      });
      return c;
    });
  };

  // Global select all — uses billable rows; allowance rows will self-clamp
  // to 0 when their selections are also selected.
  const allBillableIds = availableData.flatMap(g => g.children.filter(c => isBillable(g, c)).map(c => c.id));
  const globalState: 'all' | 'none' | 'partial' = (() => {
    if (allBillableIds.length === 0) return 'none';
    const onCount = allBillableIds.filter(id => checked[id]).length;
    if (onCount === 0) return 'none';
    if (onCount === allBillableIds.length) return 'all';
    return 'partial';
  })();

  const toggleAll = () => {
    const next = globalState !== 'all';
    setChecked(s => {
      const c = { ...s };
      allBillableIds.forEach(id => { c[id] = next; });
      return c;
    });
  };

  // Expand/collapse all
  const allExpanded = availableData.length > 0 && availableData.every(g => expanded[g.id]);
  const toggleExpandAll = () => {
    const next = !allExpanded;
    setExpanded(e => {
      const v = { ...e };
      availableData.forEach(g => { v[g.id] = next; });
      return v;
    });
  };

  // Per ADO #275689 (SRI Phase 1): when allowance and selection share a cost
  // code, present as a single netted line. When cost codes differ, render
  // separately. Applies to both pre-invoiced (reversal + selections) and
  // not-pre-invoiced (allowance remaining + selections) flows.
  const netByCostCode = (rows: SelectionChild[], _groupName: string): SelectionChild[] => {
    const byCode = new Map<string, SelectionChild[]>();
    rows.forEach(r => {
      const arr = byCode.get(r.costCode) ?? [];
      arr.push(r);
      byCode.set(r.costCode, arr);
    });
    return Array.from(byCode.values()).map(codeRows => {
      if (codeRows.length === 1) return { ...codeRows[0], sourceChildIds: [codeRows[0].id] };
      const total = codeRows.reduce((s, r) => s + (r.newInvoiceAmt ?? 0), 0);
      const allowance = codeRows.find(r => r.selection === 'Allowance');
      const selections = codeRows.filter(r => r.selection !== 'Allowance');
      // Per Kendall (2026-05-28 sync): when rows share a cost code, label the
      // collapsed line with just the cost code's name ("Plumbing") — not the
      // full "4010 - Plumbing" string and not the joined selection names.
      // Cost code strings come in as "4010 - Plumbing" from the allowance child;
      // parse the name off the first " - ".
      const ccSource = allowance?.costCode ?? codeRows[0].costCode;
      const dashIdx = ccSource.indexOf(' - ');
      const label = dashIdx >= 0 ? ccSource.slice(dashIdx + 3).trim() : ccSource;
      return {
        ...codeRows[0],
        lineItem: label,
        newInvoiceAmt: total,
        selection: selections[0]?.selection ?? 'Allowance',
        // Per-row breakdown for the invoice's expand UI.
        rolledUp: codeRows.map(r => ({ name: r.lineItem, amount: r.newInvoiceAmt ?? 0, isAllowance: r.selection === 'Allowance' })),
        sourceChildIds: codeRows.map(r => r.id),
      };
    });
  };

  // Gate netting on the user's "Combine same-cost-code lines" toggle.
  // When off, the wizard emits each row individually so the builder can see
  // and edit the breakdown on the invoice instead of a collapsed line.
  const maybeNet = (rows: SelectionChild[], groupName: string): SelectionChild[] =>
    groupByCode ? netByCostCode(rows, groupName) : rows;

  // Outgoing payload:
  //   PRE-invoiced + budget remaining: emit allowance reversal (-remaining) at
  //     allowance code + checked selections at full price, then net by cost code.
  //     Same code → one net line. Different codes → separate lines (#275689).
  //   PRE-invoiced + allowance exhausted: just emit checked selections at full
  //     price (no adjustment needed; the user just bills the new selection).
  //   Not pre-invoiced: emit checked rows at positive effective amounts, then
  //     net by cost code so allowance + same-code selections collapse to one line.
  const outgoing: SelectionGroup[] = availableData
    .map((g): SelectionGroup | null => {
      // "Credit owed" path: one-click credit line driven by the dedicated
      // section's checkbox, independent of any selection checkboxes.
      if (creditAmount(g) > 0) {
        if (!checked[creditKey(g)]) return null;
        const allowanceChild = g.children.find(c => c.selection === 'Allowance');
        if (!allowanceChild) return null;
        const credit = creditAmount(g);
        return {
          ...g,
          children: [{
            ...allowanceChild,
            lineItem: `${g.name} credit`,
            newInvoiceAmt: -credit,
          }],
        };
      }
      if (isPreInvoiced(g)) {
        const checkedSelections = g.children
          .filter(c => c.selection !== 'Allowance' && checked[c.id] && c.newInvoiceAmt !== null);
        if (checkedSelections.length === 0) return null;
        const remaining = remainingBudget(g);

        if (remaining === 0) {
          // Allowance exhausted — bill new selections directly.
          const rows = checkedSelections.map(c => ({ ...c, newInvoiceAmt: c.price }));
          const netted = maybeNet(rows, g.name);
          return { ...g, children: netted };
        }

        const allowanceChild = g.children.find(c => c.selection === 'Allowance');
        if (!allowanceChild) return null;

        // If the reversal is already on this invoice from a prior round,
        // we'd double-reverse if we emitted another. Instead, update the
        // existing netted line to include this round's new selections.
        if (isAlreadyAdded(allowanceChild)) {
          // Same-code sels: absorbed into the netted line via allowanceUpdate.
          // Diff-code sels: emit as new lines (no reversal, the prior reversal is already in place).
          const allowanceCode = allowanceChild.costCode;
          const sameCodeNew = checkedSelections.filter(c => c.costCode === allowanceCode);
          const diffCodeNew = checkedSelections.filter(c => c.costCode !== allowanceCode);

          let updateFields: Partial<SelectionGroup> = {};
          if (groupByCode && sameCodeNew.length > 0) {
            // Recompute the netted line: reversal + ALL same-code sels (prior added + new this round).
            const allSameCodeSels = g.children.filter(c =>
              c.selection !== 'Allowance' &&
              c.newInvoiceAmt !== null &&
              c.costCode === allowanceCode &&
              (checked[c.id] || isAlreadyAdded(c)),
            );
            const newTotal = -remaining + allSameCodeSels.reduce((s, c) => s + c.price, 0);
            updateFields = {
              allowanceUpdate: newTotal,
              allowanceChildId: allowanceChild.id,
              allowanceUpdateChildIds: [allowanceChild.id, ...allSameCodeSels.map(c => c.id)],
              allowanceUpdateRolledUp: [
                { name: `${g.name} reversal`, amount: -remaining, isAllowance: true },
                ...allSameCodeSels.map(c => ({ name: c.lineItem, amount: c.price })),
              ],
            };
          }

          const diffRows = diffCodeNew.map(c => ({ ...c, newInvoiceAmt: c.price }));
          if (diffRows.length === 0 && Object.keys(updateFields).length === 0) return null;
          return { ...g, children: diffRows, ...updateFields };
        }

        const allowanceReversal: SelectionChild = {
          ...allowanceChild,
          lineItem: `${g.name} reversal`,
          newInvoiceAmt: -remaining,
        };
        const selectionRows = checkedSelections.map(c => ({ ...c, newInvoiceAmt: c.price }));
        const netted = maybeNet([allowanceReversal, ...selectionRows], g.name);
        const finalRows = netted.filter(r => (r.newInvoiceAmt ?? 0) !== 0);
        if (finalRows.length === 0) return null;
        return { ...g, children: finalRows };
      }

      const filteredChildren: SelectionChild[] = g.children
        .filter(c => checked[c.id] && isBillable(g, c) && effectiveAmount(g, c) > 0)
        .map(c => ({ ...c, newInvoiceAmt: effectiveAmount(g, c) }));
      if (filteredChildren.length === 0) return null;
      const netted = maybeNet(filteredChildren, g.name);
      const result: SelectionGroup = { ...g, children: netted };
      // If the allowance line was billed in a prior round, this round's new
      // selections have changed the math — the existing line needs to be
      // updated so we don't over-bill (selections + stale allowance amount).
      const allowanceChild = g.children.find(c => c.selection === 'Allowance');
      if (allowanceChild && isAlreadyAdded(allowanceChild)) {
        result.allowanceUpdate = effectiveAmount(g, allowanceChild);
        result.allowanceChildId = allowanceChild.id;
      }
      return result;
    })
    .filter((g): g is SelectionGroup => g !== null);

  // Count allowanceUpdate as a "virtual selection" so the Add button stays
  // enabled when the only change this round is an in-place line adjustment.
  const selectedCount = outgoing.reduce(
    (s, g) => s + g.children.length + (g.allowanceUpdate !== undefined ? 1 : 0),
    0,
  );
  const invoiceSubtotal = outgoing.reduce(
    (s, g) => s + g.children.reduce((cs, c) => cs + (c.newInvoiceAmt ?? 0), 0),
    0,
  );

  const handleCreate = () => {
    if (outgoing.length > 0) onAdd(outgoing);
    onClose();
  };

  const chevron = (isOpen: boolean) => (
    <span className={"est-group-chevron" + (isOpen ? " open" : "")}>&#9654;</span>
  );

  const renderGroup = (g: SelectionGroup) => {
    const isExpanded = !!expanded[g.id];
    const state = groupState(g);
    const billable = g.children.filter(c => isBillable(g, c));
    // Group's billable subtotal mirrors what the outgoing payload will produce
    // for this group — net for pre-invoiced groups, sum of effective amounts otherwise.
    const groupOutgoing = outgoing.find(o => o.id === g.id);
    const groupSubtotal = groupOutgoing
      ? groupOutgoing.children.reduce((s, c) => s + (c.newInvoiceAmt ?? 0), 0)
      : 0;
    const noneBillable = billable.length === 0;
    const preInv = isPreInvoiced(g);

    return (
      <div key={g.id} className="selv2-group">
        <div className="selv2-group-header">
          <div className="selv2-group-left">
            <div
              className={"est-check" + (state === 'all' ? ' on' : state === 'partial' ? ' partial' : '') + (noneBillable ? ' disabled' : '')}
              onClick={() => !noneBillable && toggleGroup(g)}
            />
            <button type="button" className="selv2-chev-btn" onClick={() => toggleExpand(g.id)}>
              {chevron(isExpanded)}
            </button>
            <span className="selv2-group-icon">
              {g.type === 'allowance' ? <AllowanceIcon /> : <SelectionIcon />}
            </span>
            <span className="selv2-group-name">{g.name}</span>
            {g.isComplete && <span className="selv2-pill selv2-pill-complete">Marked complete</span>}
            {g.scenarioNote && <ScenarioTooltip note={g.scenarioNote} />}
          </div>
          <div className="selv2-group-meta">
            {g.type === 'allowance' && (
              <>
                <div className="selv2-meta-item">
                  <div className="selv2-meta-label">Budget</div>
                  <div className="selv2-meta-value">${fmt(g.allowanceBudget ?? 0)}</div>
                </div>
                <div className="selv2-meta-item">
                  <div className="selv2-meta-label">Previously invoiced</div>
                  <div className="selv2-meta-value" style={{ color: g.previouslyInvoiced > 0 ? 'var(--bt-midnight)' : 'var(--g500)' }}>
                    ${fmt(g.previouslyInvoiced)}
                  </div>
                </div>
              </>
            )}
            <div className="selv2-meta-item">
              <div className="selv2-meta-label">Invoice amount</div>
              <div
                className="selv2-meta-value selv2-meta-value-total"
                style={undefined}
              >
                {fmtCurrency(groupSubtotal)}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="selv2-children">
            <table className="selv2-table">
              <colgroup>
                <col style={{ width: 40 }} />
                <col />
                <col style={{ width: 150 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>Line item</th>
                  <th>Cost code</th>
                  <th>Cost type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {g.children.map(c => {
                  const isAllowanceRow = c.selection === 'Allowance';
                  const onThisInvoice = isAlreadyAdded(c);
                  const billableRow = isBillable(g, c);
                  const isOn = !!checked[c.id];
                  const amt = effectiveAmount(g, c);
                  const preInvAllowance = isAllowanceRow && preInv;
                  const covered = isAllowanceRow && !preInv && amt === 0;
                  const reduced = isAllowanceRow && !preInv && amt > 0 && amt < c.price;
                  // Pre-invoiced allowance row always displays $0 — the allowance was
                  // already billed, so it contributes nothing more to this invoice. The
                  // net (overage or credit) rolls up to the group's Invoice amount via
                  // the outgoing payload.
                  const rowAmt = preInvAllowance ? 0 : amt;
                  const closedOut = isAllowanceRow && g.isComplete && !preInv;
                  const dim = !billableRow || covered || preInvAllowance;
                  const checkboxTitle = onThisInvoice
                    ? 'Already on this invoice'
                    : closedOut
                      ? 'Allowance marked complete — unspent budget closes out on the budget side'
                      : !billableRow
                        ? 'Already invoiced — not billable on this invoice'
                        : covered
                          ? 'Fully covered by selected selections'
                          : undefined;
                  return (
                    <tr key={c.id} className={dim ? 'selv2-row-disabled' : ''}>
                      <td>
                        {preInvAllowance ? null : (
                          <div
                            className={"est-check" + (isOn ? ' on' : '') + (dim && !isOn ? ' disabled' : '')}
                            onClick={() => toggleChild(g, c)}
                            title={checkboxTitle}
                          />
                        )}
                      </td>
                      <td>
                        <div className="selv2-cell-name">
                          <span className="selv2-row-icon">
                            {isAllowanceRow ? <AllowanceIcon /> : <SelectionIcon />}
                          </span>
                          <span>{c.lineItem}</span>
                          {closedOut && (
                            <span className="selv2-pill selv2-pill-muted">Closed out on budget</span>
                          )}
                          {!billableRow && !closedOut && !onThisInvoice && (
                            <span className="selv2-pill selv2-pill-muted">Invoiced</span>
                          )}
                          {c.selectionStatus && billableRow && !isAllowanceRow && (
                            <span className="selv2-pill selv2-pill-approved">{c.selectionStatus}</span>
                          )}
                        </div>
                        {preInvAllowance && (
                          <div style={{ fontSize: 11, color: 'var(--g500)', marginTop: 2 }}>
                            ${fmt(g.previouslyInvoiced)} previously invoiced
                          </div>
                        )}
                      </td>
                      <td className="selv2-cell-mono">{c.costCode}</td>
                      <td className="selv2-cell-type">{c.costType || (isAllowanceRow ? 'Allowance' : 'Selection')}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 500,
                          color: undefined,
                        }}
                      >
                        ${fmt(rowAmt)}
                        {reduced && (
                          <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--g400)', textDecoration: 'line-through' }}>
                            ${fmt(c.price)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            <h2 className="selv2-title">Add selections and allowances to invoice</h2>
          </div>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body selv2-body">
          <div className="selv2-desc">
            Choose approved selections and allowances to invoice.
          </div>

          <div className="selv2-controls">
            <label className="selv2-inline-check selv2-controls-primary" onClick={toggleAll}>
              <div className={"est-check" + (globalState === 'all' ? ' on' : globalState === 'partial' ? ' partial' : '')} />
              <span className="selv2-controls-label">Select all</span>
            </label>
            <label className="selv2-inline-check selv2-controls-opt" onClick={() => setIncludeDescs(v => !v)}>
              <div className={"est-check" + (includeDescs ? ' on' : '')} />
              Include descriptions
            </label>
            <label className="selv2-inline-check selv2-controls-opt" onClick={() => setGroupByCode(v => !v)}>
              <div className={"est-check" + (groupByCode ? ' on' : '')} />
              Group by cost code
            </label>
            <div className="selv2-controls-spacer" />
            <button type="button" className="est-expand-btn" onClick={toggleExpandAll}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20l5-5 5 5" /><path d="M7 4l5 5 5-5" /></svg>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          <div className="selv2-sections">
            {allowances.length > 0 && (
              <>
                <div className="selv2-section-label">Allowances</div>
                {allowances.map(renderGroup)}
              </>
            )}
            {standalone.length > 0 && (
              <>
                <div className="selv2-section-label" style={{ marginTop: 12 }}>Standalone selections</div>
                {standalone.map(renderGroup)}
              </>
            )}
            {creditsOwed.length > 0 && (
              <>
                <div className="selv2-section-label" style={{ marginTop: 16 }}>Credits owed</div>
                <div className="selv2-credits-help">
                  These allowances were marked complete with previously invoiced amounts greater than the actual selections. Apply the credit to this invoice.
                </div>
                <div className="selv2-credits-grid">
                  <table className="selv2-table">
                    <colgroup>
                      <col style={{ width: 40 }} />
                      <col />
                      <col style={{ width: 130 }} />
                      <col style={{ width: 110 }} />
                      <col style={{ width: 120 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th></th>
                        <th>Allowance</th>
                        <th style={{ textAlign: 'right' }}>Previously invoiced</th>
                        <th style={{ textAlign: 'right' }}>Actual cost</th>
                        <th style={{ textAlign: 'right' }}>Credit amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditsOwed.map(g => {
                        const credit = creditAmount(g);
                        const approved = g.children
                          .filter(c => c.selection !== 'Allowance')
                          .reduce((s, c) => s + c.price, 0);
                        const isOn = !!checked[creditKey(g)];
                        return (
                          <tr key={creditKey(g)} className={isOn ? 'selv2-credits-row-on' : ''}>
                            <td>
                              <div
                                className={"est-check" + (isOn ? ' on' : '')}
                                onClick={() => setChecked(s => ({ ...s, [creditKey(g)]: !s[creditKey(g)] }))}
                              />
                            </td>
                            <td>
                              <div className="selv2-cell-name">
                                <span className="selv2-row-icon"><AllowanceIcon /></span>
                                <span style={{ fontWeight: 600, color: 'var(--bt-midnight)' }}>{g.name}</span>
                                <ScenarioTooltip note={`Previously invoiced: $${fmt(g.previouslyInvoiced)} · Approved selections: $${fmt(approved)} · Credit: $${fmt(credit)}`} />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>${fmt(g.previouslyInvoiced)}</td>
                            <td style={{ textAlign: 'right' }}>${fmt(approved)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--red, #c53030)' }}>
                              -{fmtCurrency(credit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {availableData.length === 0 && (
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
