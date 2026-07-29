import { useState, useEffect, useRef, type CSSProperties } from 'react';
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

const pctInputStyle: CSSProperties = {
  width: 54,
  textAlign: 'right',
  padding: '3px 6px',
  border: '1px solid var(--g300)',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'inherit',
};

/* ─── Component ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: SelectionGroup[]) => void;
  data: SelectionGroup[];
  addedChildIds?: string[];
  // Row IDs (allowance group ids, allowance-child ids, or standalone ids) to
  // pre-check when the wizard opens — e.g. the rows selected in the grid.
  initialCheckedIds?: string[];
  variant?: 'modal' | 'panel';
}

// This is the "old" selections wizard: the builder checks individual selection
// line items to invoice. Unlike the current Selections & Allowances wizard, it
// does NOT bill allowance lines directly — allowance groups here are just
// grouping labels. Each selection can be billed at a percentage: a global
// Invoice % applies to every line, and any line can be overridden individually.
export default function SelectionsModalV2({ open, onClose, onAdd, data, addedChildIds = [], initialCheckedIds, variant = 'modal' }: Props) {
  const addedChildSet = new Set(addedChildIds);
  const isAlreadyAdded = (c: SelectionChild) => addedChildSet.has(c.id);

  // A selection is billable when it hasn't already been added to this invoice
  // and still has an amount to bill. Allowance lines are never billable here.
  const isBillable = (c: SelectionChild) =>
    c.selection !== 'Allowance' && c.newInvoiceAmt !== null && !isAlreadyAdded(c);

  // Groups that still have at least one billable selection. Bare allowances
  // (no selections) drop out entirely.
  const availableData = data.filter(g => g.children.some(isBillable));

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [includeDescs, setIncludeDescs] = useState(true);
  const [groupByCode, setGroupByCode] = useState(true);
  // Invoice %: a global default plus per-line overrides. Editing the global
  // resets every line to it; editing one line overrides just that line.
  const [globalPct, setGlobalPct] = useState(100);
  const [linePcts, setLinePcts] = useState<Record<string, number>>({});

  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(v) ? v : 0)));
  const linePct = (id: string) => linePcts[id] ?? globalPct;
  const billed = (c: SelectionChild) => Math.round((c.price * linePct(c.id)) / 100);
  const setGlobal = (raw: string) => { setGlobalPct(clampPct(Number(raw))); setLinePcts({}); };
  const setLine = (id: string, raw: string) => setLinePcts(s => ({ ...s, [id]: clampPct(Number(raw)) }));

  useEffect(() => {
    if (!open) return;
    const e: Record<string, boolean> = {};
    availableData.forEach(g => { e[g.id] = true; });
    // Pre-check the rows passed in (e.g. the grid's selected rows). A selected
    // group checks all its billable selections; selected child/standalone ids
    // check the matching wizard child.
    const init: Record<string, boolean> = {};
    if (initialCheckedIds && initialCheckedIds.length > 0) {
      const idSet = new Set(initialCheckedIds);
      availableData.forEach(g => {
        const groupSelected = idSet.has(g.id);
        g.children.forEach(c => {
          if (!isBillable(c)) return;
          if (groupSelected || idSet.has(c.id)) init[c.id] = true;
        });
      });
    }
    setChecked(init);
    setExpanded(e);
    setLinePcts({});
    setGlobalPct(100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const allowanceGroups = availableData.filter(g => g.type === 'allowance');
  const standalone = availableData.filter(g => g.type === 'selection');
  const standaloneChildren = standalone.flatMap(g => g.children.filter(isBillable));

  const toggleChild = (c: SelectionChild) => {
    if (!isBillable(c)) return;
    setChecked(s => ({ ...s, [c.id]: !s[c.id] }));
  };
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const billableChildren = (g: SelectionGroup) => g.children.filter(isBillable);

  // Tri-state per group.
  const groupState = (g: SelectionGroup): 'all' | 'none' | 'partial' => {
    const b = billableChildren(g);
    if (b.length === 0) return 'none';
    const on = b.filter(c => checked[c.id]).length;
    if (on === 0) return 'none';
    return on === b.length ? 'all' : 'partial';
  };
  const toggleGroup = (g: SelectionGroup) => {
    const next = groupState(g) !== 'all';
    setChecked(s => {
      const c = { ...s };
      billableChildren(g).forEach(child => { c[child.id] = next; });
      return c;
    });
  };

  // Global select all.
  const allBillableIds = availableData.flatMap(g => billableChildren(g).map(c => c.id));
  const globalState: 'all' | 'none' | 'partial' = (() => {
    if (allBillableIds.length === 0) return 'none';
    const on = allBillableIds.filter(id => checked[id]).length;
    if (on === 0) return 'none';
    return on === allBillableIds.length ? 'all' : 'partial';
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

  // What was previously invoiced against this allowance (the deposit/draw the
  // client already paid). Selections bill against it before any overage bills.
  const depositOf = (g: SelectionGroup) => g.previouslyInvoiced || 0;
  const allowanceChildOf = (g: SelectionGroup) => g.children.find(c => c.selection === 'Allowance');
  const checkedBilledTotal = (g: SelectionGroup) =>
    billableChildren(g).filter(c => checked[c.id]).reduce((s, c) => s + billed(c), 0);

  // Combine same-cost-code rows into one netted line, summing their (already
  // computed) invoice amounts. Rows arrive with newInvoiceAmt already set.
  const netByCostCode = (rows: SelectionChild[]): SelectionChild[] => {
    const byCode = new Map<string, SelectionChild[]>();
    rows.forEach(r => {
      const arr = byCode.get(r.costCode) ?? [];
      arr.push(r);
      byCode.set(r.costCode, arr);
    });
    return Array.from(byCode.values()).map(codeRows => {
      if (codeRows.length === 1) {
        const r = codeRows[0];
        return { ...r, sourceChildIds: r.sourceChildIds ?? [r.id] };
      }
      const total = codeRows.reduce((s, r) => s + (r.newInvoiceAmt ?? 0), 0);
      const cc = codeRows[0].costCode;
      const dashIdx = cc.indexOf(' - ');
      const label = dashIdx >= 0 ? cc.slice(dashIdx + 3).trim() : cc;
      return {
        ...codeRows[0],
        lineItem: label,
        newInvoiceAmt: total,
        rolledUp: codeRows.map(r => ({ name: r.lineItem, amount: r.newInvoiceAmt ?? 0 })),
        sourceChildIds: codeRows.flatMap(r => r.sourceChildIds ?? [r.id]),
      };
    });
  };

  // Outgoing payload. For a previously-invoiced allowance we reconcile: emit a
  // reversal of the prior amount plus the checked selections (billed at their
  // %), so only the overage beyond the deposit lands on the invoice. When the
  // billed selections don't yet exceed the deposit there's nothing new to bill.
  // Allowances with no prior invoice just bill their checked selections at %.
  const outgoing: SelectionGroup[] = availableData
    .map((g): SelectionGroup | null => {
      const checkedSels = billableChildren(g).filter(c => checked[c.id]);
      if (checkedSels.length === 0) return null;
      const selRows = checkedSels.map(c => ({ ...c, newInvoiceAmt: billed(c), sourceChildIds: [c.id] }));
      const dep = depositOf(g);
      if (dep > 0) {
        const billedTotal = selRows.reduce((s, c) => s + (c.newInvoiceAmt ?? 0), 0);
        if (billedTotal - dep <= 0) return null; // deposit still covers the billed selections
        const allowanceChild = allowanceChildOf(g);
        const reversal: SelectionChild = allowanceChild
          ? { ...allowanceChild, lineItem: g.name, selection: 'Allowance', newInvoiceAmt: -dep, sourceChildIds: [allowanceChild.id] }
          : { id: `${g.id}-rev`, lineItem: g.name, costCode: selRows[0].costCode, costType: 'Allowance', selection: 'Allowance', price: dep, newInvoiceAmt: -dep, sourceChildIds: [`${g.id}-rev`] };
        const rows = [reversal, ...selRows];
        return { ...g, children: groupByCode ? netByCostCode(rows) : rows };
      }
      return { ...g, children: groupByCode ? netByCostCode(selRows) : selRows };
    })
    .filter((g): g is SelectionGroup => g !== null);

  const selectedCount = outgoing.reduce((s, g) => s + g.children.length, 0);
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

  const selHead = (
    <>
      <colgroup>
        <col style={{ width: 40 }} />
        <col />
        <col style={{ width: 120 }} />
        <col style={{ width: 90 }} />
        <col style={{ width: 100 }} />
        <col style={{ width: 96 }} />
        <col style={{ width: 120 }} />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th>Line item</th>
          <th>Cost code</th>
          <th>Cost type</th>
          <th style={{ textAlign: 'right' }}>Amount</th>
          <th style={{ textAlign: 'right' }}>Invoice %</th>
          <th style={{ textAlign: 'right' }}>Invoice amount</th>
        </tr>
      </thead>
    </>
  );

  const renderSelRow = (c: SelectionChild) => {
    const isOn = !!checked[c.id];
    return (
      <tr key={c.id}>
        <td>
          <div className={"est-check" + (isOn ? ' on' : '')} onClick={() => toggleChild(c)} />
        </td>
        <td>
          <div className="selv2-cell-name">
            <span className="selv2-row-icon"><SelectionIcon /></span>
            <span>{c.lineItem}</span>
            {c.selectionStatus && (
              <span className="selv2-pill selv2-pill-approved">{c.selectionStatus}</span>
            )}
          </div>
        </td>
        <td className="selv2-cell-mono">{c.costCode}</td>
        <td className="selv2-cell-type">{c.costType || 'Selection'}</td>
        <td style={{ textAlign: 'right', fontWeight: 500 }}>${fmt(c.price)}</td>
        <td style={{ textAlign: 'right' }}>
          <input
            type="number"
            min={0}
            max={100}
            value={linePct(c.id)}
            onChange={e => setLine(c.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={pctInputStyle}
          />
        </td>
        <td style={{ textAlign: 'right', fontWeight: 600 }}>${fmt(billed(c))}</td>
      </tr>
    );
  };

  const renderGroup = (g: SelectionGroup) => {
    const isExpanded = !!expanded[g.id];
    const state = groupState(g);
    const dep = depositOf(g);
    const billedTotal = checkedBilledTotal(g);
    // Selections bill against the prior deposit first; only the overage invoices.
    const invoiceAmount = Math.max(0, billedTotal - dep);
    const remainingDeposit = Math.max(0, dep - billedTotal);
    const allowanceChild = allowanceChildOf(g);
    const rows = billableChildren(g);

    return (
      <div key={g.id} className="selv2-group">
        <div className="selv2-group-header">
          <div className="selv2-group-left">
            <div
              className={"est-check" + (state === 'all' ? ' on' : state === 'partial' ? ' partial' : '')}
              onClick={() => toggleGroup(g)}
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
            {g.type === 'allowance' && dep > 0 && (
              <div className="selv2-meta-item">
                <div className="selv2-meta-label">Previously invoiced allowance</div>
                <div className="selv2-meta-value" style={{ color: 'var(--bt-midnight)' }}>
                  ${fmt(remainingDeposit)}
                </div>
              </div>
            )}
            <div className="selv2-meta-item">
              <div className="selv2-meta-label">Invoice amount</div>
              <div className="selv2-meta-value selv2-meta-value-total">
                {fmtCurrency(invoiceAmount)}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="selv2-children">
            <table className="selv2-table">
              {selHead}
              <tbody>
                {/* Ghost line: the previously-invoiced allowance, shown as a
                    read-only reversal so the builder sees what was already
                    billed. It can't be checked and takes no % — it's done. */}
                {dep > 0 && allowanceChild && (
                  <tr className="selv2-row-disabled">
                    <td></td>
                    <td>
                      <div className="selv2-cell-name">
                        <span className="selv2-row-icon"><AllowanceIcon /></span>
                        <span>{g.name}</span>
                        <span className="selv2-pill selv2-pill-muted">Previously invoiced</span>
                      </div>
                    </td>
                    <td className="selv2-cell-mono">{allowanceChild.costCode}</td>
                    <td className="selv2-cell-type">Allowance</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{fmtCurrency(-dep)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--g400)' }}>—</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(-dep)}</td>
                  </tr>
                )}
                {rows.map(renderSelRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const cardContent = (
    <>
      <div className="est-modal-hdr">
        <div>
          <h2 className="selv2-title">Add selections to invoice</h2>
        </div>
        <button className="est-modal-close" onClick={onClose}>&times;</button>
      </div>

      <div className="est-modal-body selv2-body">
        <div className="selv2-desc">
          Choose approved selections to invoice, and set what percentage of each to bill.
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
          <div className="selv2-controls-opt" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
            <span>Invoice %</span>
            <input
              type="number"
              min={0}
              max={100}
              value={globalPct}
              onChange={e => setGlobal(e.target.value)}
              style={pctInputStyle}
            />
          </div>
        </div>

        <div className="selv2-sections">
          {allowanceGroups.length > 0 && (
            <>
              <div className="selv2-section-label">Allowances with approved selections</div>
              {allowanceGroups.map(renderGroup)}
            </>
          )}
          {standaloneChildren.length > 0 && (
            <>
              <div className="selv2-section-label" style={{ marginTop: 12 }}>Selections</div>
              <div className="selv2-children" style={{ background: 'white', border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
                <table className="selv2-table">
                  {selHead}
                  <tbody>
                    {standaloneChildren.map(renderSelRow)}
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
    </>
  );

  if (variant === 'panel') {
    return (
      <div
        className="est-modal selv2-modal"
        style={{ width: '100%', maxWidth: 'none', height: '100%', maxHeight: 'none', borderRadius: 0, boxShadow: 'none', margin: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {cardContent}
      </div>
    );
  }

  return createPortal(
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal selv2-modal" onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body,
  );
}
