import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type DepositTrueUpAllowance, type StandaloneSelectionGroup } from '../selectionsData';
import {
  AllowanceCard,
  StandaloneCard,
  fmtCurrency,
  availableAllowances,
  availableStandalone,
  allowanceToOutGroup,
  standaloneToOutGroup,
  variance,
  isTrueable,
  standaloneTotal,
  type OutGroup,
} from './SelectionCards';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: OutGroup[], opts?: { grouped?: boolean }) => void;
  /** Group ids already trued-up on this invoice (so re-open hides them). */
  addedChildIds?: string[];
  /** Set when adding to a pre-existing invoice rather than a brand-new one. */
  targetInvoice?: { invoiceNumber: string; title: string; type: 'invoice' | 'progress' } | null;
  /** Type of the brand-new invoice being built, when targetInvoice isn't set. */
  newInvoiceType?: 'invoice' | 'progress';
  variant?: 'modal' | 'panel';
}

/* ─── Component ─── */
export default function SelectionsModalV5({ open, onClose, onAdd, addedChildIds = [], targetInvoice = null, newInvoiceType = 'invoice', variant = 'modal' }: Props) {
  // Which allowances the builder has marked complete in this session. Marking
  // complete is the hinge of the deposit/true-up model: it LOCKS the variance
  // so the over/under can settle on this invoice.
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  // Which trued-up allowances the builder has checked to add to the invoice.
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [includeDescs, setIncludeDescs] = useState(true);
  // Group each allowance's reversal + selections into one rolled-up line on the
  // invoice (Summary). Unchecked adds them broken out (Itemized). Either way the
  // builder can flip the view on the invoice with the Summary/Itemized toggle.
  const [groupLineItems, setGroupLineItems] = useState(true);
  // Percentage of an allowance to invoice now (deposits / progress). Defaults to
  // 100% when unset. New invoice amount = allowance amount × this %.

  const data = availableAllowances(addedChildIds);
  const standalone = availableStandalone(addedChildIds);

  useEffect(() => {
    if (!open) return;
    // Open with every finalized allowance marked complete (so amounts compute)
    // and expanded, but NOTHING pre-checked — the builder checks what they want
    // to invoice. Allowances with a pending selection stay un-marked.
    const done: Record<string, boolean> = {};
    const e: Record<string, boolean> = {};
    data.forEach(a => {
      e[a.id] = true;
      const hasPend = a.selections.some(s => s.status === 'pending');
      if (!hasPend) done[a.id] = true;
    });
    standalone.forEach(g => { e[g.id] = true; });
    setCompleted(done);
    setChecked({});
    setExpanded(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isComplete = (a: DepositTrueUpAllowance) => !!completed[a.id];
  // A fully-locked allowance with non-zero variance is the only thing that
  // produces an invoice line.
  const trueable = (a: DepositTrueUpAllowance) => isTrueable(a, isComplete(a));

  const toggleCheck = (a: DepositTrueUpAllowance) => {
    // Zero-variance allowances (incl. settled/on-budget) aren't invoiced here.
    if (!trueable(a) || variance(a) === 0) return;
    setChecked(c => ({ ...c, [a.id]: !c[a.id] }));
  };
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleStandaloneGroup = (g: StandaloneSelectionGroup) => {
    if (standaloneTotal(g) === 0) return;
    setChecked(c => ({ ...c, [g.id]: !c[g.id] }));
  };

  // Section-level "Select all" helpers (tri-state over a set of checkbox ids).
  const triState = (ids: string[]): 'all' | 'none' | 'partial' => {
    if (ids.length === 0) return 'none';
    const on = ids.filter(id => checked[id]).length;
    return on === 0 ? 'none' : on === ids.length ? 'all' : 'partial';
  };
  const setMany = (ids: string[], val: boolean) => setChecked(c => { const n = { ...c }; ids.forEach(id => { n[id] = val; }); return n; });
  // Allowances-with-selections split by direction: charges (overage or settled)
  // vs. credits owed back to the client (underage — negative invoice amount).
  const chargeCards = data.filter(a => variance(a) >= 0);
  const creditCards = data.filter(a => variance(a) < 0);
  // Invoiceable card ids (settled/zero-variance excluded).
  const chargeIds = chargeCards.filter(a => trueable(a) && variance(a) !== 0).map(a => a.id);
  const creditIds = creditCards.filter(a => trueable(a)).map(a => a.id);
  const selKeys = standalone.map(g => g.id);
  // Global "Select all" — every billable row across all sections.
  const allBillableIds = [...chargeIds, ...creditIds, ...selKeys];
  const allSelState = triState(allBillableIds);
  const toggleAll = () => setMany(allBillableIds, allSelState !== 'all');

  // Outgoing payload: ONE net line per checked allowance / standalone selection,
  // each carrying its full breakdown in rolledUp. Built by the shared helpers so
  // the combined "Add to invoice" view emits exactly the same shape.
  const outgoing: OutGroup[] = data
    .filter(a => trueable(a) && variance(a) !== 0 && checked[a.id])
    .map(a => allowanceToOutGroup(a, isComplete(a)));

  const outgoingStandalone: OutGroup[] = standalone
    .filter(g => checked[g.id])
    .map(standaloneToOutGroup);

  const allOutgoing = [...outgoing, ...outgoingStandalone];

  const invoiceSubtotal = allOutgoing.reduce(
    (s, g) => s + g.children.reduce((cs, c) => cs + (c.newInvoiceAmt ?? 0), 0), 0);
  const selectedCount = allOutgoing.length;

  const handleCreate = () => {
    if (allOutgoing.length > 0) onAdd(allOutgoing, { grouped: groupLineItems });
    onClose();
  };

  const allExpanded = (data.length > 0 || standalone.length > 0)
    && data.every(a => expanded[a.id]) && standalone.every(g => expanded[g.id]);
  const toggleExpandAll = () => {
    const next = !allExpanded;
    setExpanded(e => {
      const v = { ...e };
      data.forEach(a => { v[a.id] = next; });
      standalone.forEach(g => { v[g.id] = next; });
      return v;
    });
  };

  const renderAllowance = (a: DepositTrueUpAllowance) => (
    <AllowanceCard
      key={a.id}
      a={a}
      complete={isComplete(a)}
      checked={!!checked[a.id]}
      expanded={!!expanded[a.id]}
      onToggleCheck={() => toggleCheck(a)}
      onToggleExpand={() => toggleExpand(a.id)}
    />
  );

  const renderStandaloneGroup = (g: StandaloneSelectionGroup) => (
    <StandaloneCard
      key={g.id}
      g={g}
      checked={!!checked[g.id]}
      expanded={!!expanded[g.id]}
      onToggleCheck={() => toggleStandaloneGroup(g)}
      onToggleExpand={() => toggleExpand(g.id)}
    />
  );

  const cardContent = (
    <>
      <div className="est-modal-hdr">
        <div>
          <h2 className="selv2-title">
            {targetInvoice
              ? (targetInvoice.type === 'progress' ? 'Add to Progress Invoice' : 'Add to Invoice')
              : (newInvoiceType === 'progress' ? 'Add selections to progress invoice' : 'Add selections to invoice')}
          </h2>
          {targetInvoice && (
            <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>
              {targetInvoice.title}
            </div>
          )}
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
              <div className="selv2-section-label" style={{ marginTop: data.length > 0 ? 24 : 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Selections</span>
              </div>
              {standalone.map(renderStandaloneGroup)}
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
            {targetInvoice ? (targetInvoice.type === 'progress' ? 'Add to Progress Invoice' : 'Add to Invoice') : 'Add line items'}
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
