import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';

/* ─── Types ─── */
interface AllowanceChild {
  id: string;
  lineItem: string;
  costCode: string;
  selection: string;
  price: number;
  newInvoiceAmt: number;
}

interface EstimateGroup {
  id: string;
  type: 'allowance' | 'selection';
  name: string;
  costCode: string;
  costType: string;
  clientPrice: number;
  previouslyInvoicedPct: number;
  status?: string;
  children: AllowanceChild[];
}

interface EstimateLine {
  id: string;
  type: 'line';
  name: string;
  costCode: string;
  costType: string;
  price: number;
  previouslyInvoicedPct: number;
}

type EstimateItem = EstimateGroup | EstimateLine;

/* ─── Mock Data ─── */
const ESTIMATE_DATA: EstimateItem[] = [
  // ── Estimate line items ──
  { id: 'li1', type: 'line', name: 'Framing labor', costCode: '03.10 - Framing', costType: 'Labor', price: 8500, previouslyInvoicedPct: 60 },
  { id: 'li2', type: 'line', name: 'Drywall sheets (4x8)', costCode: '04.20 - Drywall', costType: 'Materials', price: 3200, previouslyInvoicedPct: 25 },
  { id: 'li3', type: 'line', name: 'Plumbing rough-in', costCode: '06.15 - Plumbing', costType: 'Subcontractor', price: 4750, previouslyInvoicedPct: 80 },
  { id: 'li4', type: 'line', name: 'Exterior paint', costCode: '09.30 - Painting', costType: 'Materials', price: 2100, previouslyInvoicedPct: 0 },
  // ── Allowances ──
  {
    id: 'g1', type: 'allowance', name: 'Cabinets', costCode: '12.20 - Cabinets', costType: 'Materials', clientPrice: 10000, previouslyInvoicedPct: 40,
    children: [
      { id: 'g1a', lineItem: 'Cabinet boxes', costCode: '12.20 Cabinets', selection: 'Premium custom package', price: 4200, newInvoiceAmt: 0 },
      { id: 'g1b', lineItem: 'Cabinet doors & hardware', costCode: '12.20 Cabinets', selection: 'Premium custom package', price: 3200, newInvoiceAmt: 0 },
      { id: 'g1c', lineItem: 'Cabinet install', costCode: '12.15 Cabinet Install labor', selection: 'Premium custom package', price: 2600, newInvoiceAmt: 0 },
    ]
  },
  { id: 'g2', type: 'allowance', name: 'Bedroom floor', costCode: '14.10 - Flooring', costType: 'Materials', clientPrice: 500, previouslyInvoicedPct: 0, children: [] },
  {
    id: 'g3', type: 'allowance', name: 'Light fixtures', costCode: '11.00 - Lighting', costType: 'Materials', clientPrice: 18000, previouslyInvoicedPct: 70,
    children: [
      { id: 'g3a', lineItem: 'Chandelier', costCode: '11 Lighting', selection: 'Standard lighting', price: 6500, newInvoiceAmt: 0 },
      { id: 'g3b', lineItem: 'Recessed lighting (8x)', costCode: '11 Lighting', selection: 'Standard lighting', price: 4800, newInvoiceAmt: 0 },
      { id: 'g3c', lineItem: 'Lighting install labor', costCode: '11.5 Lighting install', selection: 'Standard lighting', price: 6700, newInvoiceAmt: 0 },
    ]
  },
  { id: 'g6', type: 'allowance', name: '1/2 Bathroom', costCode: '07.00 - Bathroom', costType: 'Subcontractor', clientPrice: 500, previouslyInvoicedPct: 100, children: [] },
  { id: 'g4', type: 'allowance', name: 'Countertops', costCode: '12.30 - Countertops', costType: 'Materials', clientPrice: 8000, previouslyInvoicedPct: 0, children: [] },
  { id: 'g5', type: 'allowance', name: 'Landscaping', costCode: '02.90 - Landscaping', costType: 'Subcontractor', clientPrice: 6000, previouslyInvoicedPct: 25, children: [] },
  { id: 'g7', type: 'allowance', name: 'Appliances', costCode: '11.30 - Appliances', costType: 'Materials', clientPrice: 9000, previouslyInvoicedPct: 50, children: [] },
  { id: 'g8', type: 'allowance', name: 'Front door', costCode: '08.10 - Doors', costType: 'Materials', clientPrice: 3500, previouslyInvoicedPct: 0, children: [] },
];

/* ─── Progress Bar ─── */
function InvoiceProgressBar({ previousPct, newPct }: { previousPct: number; newPct: number }) {
  const totalPct = Math.min(previousPct + newPct, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="est-progress">
        {/* Previously invoiced — green */}
        <div className="est-progress-prev" style={{ width: `${Math.min(previousPct, 100)}%` }} />
        {/* New invoice — blue striped */}
        {newPct > 0 && (
          <div className="est-progress-new" style={{ width: `${Math.min(newPct, 100 - previousPct)}%`, left: `${previousPct}%` }} />
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--g600)', fontWeight: 500, whiteSpace: 'nowrap', minWidth: 32 }}>{totalPct}%</span>
    </div>
  );
}

/* ─── Component ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: EstimateItem[]) => void;
  jobName: string;
  variant?: 'modal' | 'panel';
}

export default function EstimateModal({ open, onClose, onAdd, jobName, variant = 'modal' }: Props) {
  // Allowances that have selections are reconciled in the Selections & Allowances
  // wizard, not invoiced here — so exclude them from the estimate modal. Only
  // estimate line items and allowances without selections show here.
  const filteredData = ESTIMATE_DATA.filter(d => {
    if (d.type === 'allowance' && 'children' in d && d.children && d.children.length > 0) return false;
    return true;
  });

  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    filteredData.forEach(item => { s[item.id] = false; });
    return s;
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const e: Record<string, boolean> = {};
    filteredData.forEach(d => {
      if (d.type !== 'line' && 'children' in d && d.children && d.children.length > 0) e[d.id] = true;
    });
    return e;
  });
  const [search, setSearch] = useState('');
  const [markupPct, setMarkupPct] = useState('0.00');
  const [includeDescs, setIncludeDescs] = useState(true);
  const [pcts, setPcts] = useState<Record<string, number>>(() => {
    const p: Record<string, number> = {};
    filteredData.forEach(d => { p[d.id] = 0; });
    return p;
  });

  if (!open) return null;

  const allIds = filteredData.map(d => d.id);
  const allSelected = allIds.every(id => selected[id]);
  const someSelected = allIds.some(id => selected[id]);
  const selectedCount = allIds.filter(id => selected[id]).length;

  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    const val = !allSelected;
    allIds.forEach(id => { next[id] = val; });
    setSelected(next);
  };
  const toggleItem = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const getMaxPct = (id: string) => {
    const item = filteredData.find(d => d.id === id);
    if (!item) return 100;
    return 100 - item.previouslyInvoicedPct;
  };
  const updatePct = (id: string, val: number) => {
    const max = getMaxPct(id);
    setPcts(p => ({ ...p, [id]: Math.min(Math.max(val, 0), max) }));
  };

  const filtered = search
    ? filteredData.filter(d => {
        const q = search.toLowerCase();
        if (d.name.toLowerCase().includes(q)) return true;
        if (d.type === 'line' && d.costCode.toLowerCase().includes(q)) return true;
        if (d.type !== 'line' && 'children' in d && d.children?.some(c => c.lineItem.toLowerCase().includes(q) || c.costCode.toLowerCase().includes(q))) return true;
        return false;
      })
    : filteredData;

  // Group by type for display
  const lines = filtered.filter(d => d.type === 'line');
  const allowances = filtered.filter(d => d.type === 'allowance');

  const handleAdd = () => {
    const items = filteredData
      .filter(d => selected[d.id] && (pcts[d.id] || 0) > 0)
      .map(d => ({ ...d, invoicePct: pcts[d.id] || 0 }));
    onAdd(items);
    onClose();
  };

  const chevron = (isOpen: boolean) => (
    <span className={"est-group-chevron" + (isOpen ? " open" : "")}>&#9654;</span>
  );

  const renderGroup = (item: EstimateGroup) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded[item.id] && hasChildren;
    const newPct = pcts[item.id] || 0;
    const invoiceAmt = item.clientPrice * newPct / 100;
    return (
      <div key={item.id}>
        <div className="est-group-grid">
          <div className={"est-check" + (selected[item.id] ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }} />
          <div className="est-group-label" onClick={() => hasChildren && toggleExpand(item.id)} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
            {hasChildren && chevron(isExpanded!)}
            <span>{item.name}</span>
          </div>
          <div className="est-line-meta">{item.costCode}</div>
          <div className="est-line-meta">{item.costType}</div>
          <div className="est-line-val right" style={{ fontWeight: 600 }}>${fmt(item.clientPrice)}</div>
          <div>
            <InvoiceProgressBar previousPct={item.previouslyInvoicedPct} newPct={newPct} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <input className="est-pct-input" value={newPct || ''} onChange={e => updatePct(item.id, parseFloat(e.target.value) || 0)} />
            <span style={{ fontSize: 12, color: 'var(--g500)' }}>%</span>
          </div>
          <div className="est-line-val right" style={{ fontWeight: 600 }}>${fmt(invoiceAmt)}</div>
        </div>
        {isExpanded && (
          <div style={{ paddingLeft: 14, paddingRight: 14, paddingBottom: 6 }}>
            <div className="est-subtable">
              <div className="est-subtable-head" style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr' }}>
                <span>Line item</span>
                <span>Cost code</span>
                <span>Selection</span>
                <span>Price</span>
              </div>
              {item.children.map(child => (
                <div className="est-subtable-row" key={child.id} style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr' }}>
                  <span>{child.lineItem}</span>
                  <span style={{ color: 'var(--g500)' }}>{child.costCode}</span>
                  <span style={{ color: child.selection === 'Allowance' ? 'var(--g500)' : 'var(--g700)' }}>{child.selection}</span>
                  <span>${fmt(child.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLine = (item: EstimateLine) => {
    const newPct = pcts[item.id] || 0;
    const invoiceAmt = item.price * newPct / 100;
    return (
      <div className="est-line-row" key={item.id}>
        <div className={"est-check" + (selected[item.id] ? " on" : "")} onClick={() => toggleItem(item.id)} />
        <div className="est-line-name">{item.name}</div>
        <div className="est-line-meta">{item.costCode}</div>
        <div className="est-line-meta">{item.costType}</div>
        <div className="est-line-val right">${fmt(item.price)}</div>
        <div>
          <InvoiceProgressBar previousPct={item.previouslyInvoicedPct} newPct={newPct} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          <input className="est-pct-input" value={newPct || ''} onChange={e => updatePct(item.id, parseFloat(e.target.value) || 0)} />
          <span style={{ fontSize: 12, color: 'var(--g500)' }}>%</span>
        </div>
        <div className="est-line-val right" style={{ fontWeight: 600 }}>${fmt(invoiceAmt)}</div>
      </div>
    );
  };

  const renderSection = (title: string, items: EstimateItem[]) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 8 }}>
        <div className="est-section-label">{title}</div>
        {items.map(item =>
          item.type === 'line'
            ? renderLine(item as EstimateLine)
            : renderGroup(item as EstimateGroup)
        )}
      </div>
    );
  };

  const cardContent = (
    <>
      {/* Header */}
      <div className="est-modal-hdr">
        <div>
          {variant !== 'panel' && <div className="est-modal-hdr-sub">{jobName}</div>}
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Invoice line items from Estimate</h2>
        </div>
        <button className="est-modal-close" onClick={onClose}>&times;</button>
      </div>

      {/* Body */}
      <div className="est-modal-body">
        <div className="est-desc">
          Choose estimate line items and pre-contract allowances, then set the percentage to invoice for each.
        </div>

        <label className="est-include-check" onClick={() => setIncludeDescs(!includeDescs)}>
          <div className={"est-check" + (includeDescs ? " on" : "")} />
          Include line item descriptions &amp; notes
        </label>

        {/* Controls */}
        <div className="est-controls">
          <div className="est-search-wrap">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input className="est-search" style={{ width: '100%' }} placeholder="Search line item" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
<div className="est-markup-wrap">
            <span>Adjust Invoice %</span>
            <input className="est-markup-input" value={markupPct} onChange={e => setMarkupPct(e.target.value)} />
            <span style={{ fontSize: 13, color: 'var(--g500)' }}>%</span>
            <button className="est-apply-btn">Apply</button>
          </div>
        </div>

        {/* Table */}
        <div className="est-table-scroll">
          <div className="est-table-inner">
            {/* Table header */}
            <div className="est-thead">
              <div className={"est-check" + (allSelected ? " on" : someSelected ? " partial" : "")} onClick={toggleAll} />
              <span>Items</span>
              <span>Cost code</span>
              <span>Cost type</span>
              <span>Client price</span>
              <span>Previously invoiced</span>
              <span>New invoice %</span>
              <span>New invoice amount</span>
            </div>

            {/* Grouped sections */}
            {renderSection('Estimate line items', lines)}
            {renderSection('Allowances', allowances)}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="est-modal-footer">
        <button className="btn btn-p" onClick={handleAdd}>
          Add to invoice{selectedCount > 0 ? ` (${selectedCount})` : ''}
        </button>
      </div>
    </>
  );

  if (variant === 'panel') {
    return (
      <div
        className="est-modal"
        style={{ width: '100%', maxWidth: 'none', height: '100%', maxHeight: 'none', borderRadius: 0, boxShadow: 'none', margin: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {cardContent}
      </div>
    );
  }

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>,
    document.body
  );
}
