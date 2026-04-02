import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';

/* ─── Icons ─── */
const AllowanceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', marginRight:3}}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.8241 4.00381C1.65395 4.53038 0.625 5.38671 0.625 6.5625V9.6875C0.625 10.8638 1.6533 11.7202 2.82364 12.2467C3.60869 12.5999 4.56725 12.8603 5.625 13.0023V13.4375C5.625 14.6138 6.6533 15.4702 7.82364 15.9967C9.05236 16.5495 10.7061 16.875 12.5 16.875C14.2939 16.875 15.9476 16.5495 17.1764 15.9967C18.3467 15.4702 19.375 14.6138 19.375 13.4375V10.3207L19.375 10.3125C19.375 9.27868 18.5714 8.4933 17.6181 7.97446C16.7577 7.50618 15.6318 7.168 14.375 6.99717V6.5625C14.375 5.38671 13.346 4.53038 12.1759 4.00381C10.9471 3.45084 9.29334 3.125 7.5 3.125C5.70666 3.125 4.05292 3.45084 2.8241 4.00381ZM3.33706 5.14371C2.24516 5.63507 1.875 6.18499 1.875 6.5625C1.875 6.94001 2.24516 7.48993 3.33706 7.98129C3.83261 8.20428 4.42892 8.3902 5.09831 8.52331C5.11373 8.52575 5.12896 8.52875 5.14399 8.53229C5.85861 8.67114 6.65501 8.75 7.5 8.75C8.34499 8.75 9.14139 8.67115 9.85601 8.53229C9.87104 8.52875 9.88627 8.52575 9.90169 8.52331C10.5711 8.3902 11.1674 8.20428 11.6629 7.98129C12.7548 7.48993 13.125 6.94001 13.125 6.5625C13.125 6.18499 12.7548 5.63507 11.6629 5.14371C10.6297 4.67876 9.15844 4.375 7.5 4.375C5.84156 4.375 4.3703 4.67876 3.33706 5.14371ZM9.375 9.87714C8.77717 9.9575 8.14769 10 7.5 10C6.85231 10 6.22283 9.9575 5.625 9.87714V11.7399C6.20976 11.827 6.84001 11.875 7.5 11.875C8.15999 11.875 8.79024 11.827 9.375 11.7399V9.87714ZM10.625 11.4769V9.64329C11.1919 9.50486 11.7139 9.32907 12.1759 9.12119C12.5108 8.9705 12.8341 8.7928 13.125 8.58834V9.6875C13.125 10.0659 12.7549 10.6158 11.6635 11.1068C11.3543 11.2459 11.0059 11.3705 10.625 11.4769ZM9.375 13.3939C9.02431 13.3089 8.6912 13.2099 8.37936 13.0986C8.09096 13.1161 7.7974 13.125 7.5 13.125C7.28959 13.125 7.0811 13.1205 6.875 13.1117V13.4375C6.875 13.8159 7.24513 14.3658 8.33652 14.8568C8.64566 14.9959 8.99406 15.1205 9.375 15.2269V13.3939ZM10.625 15.4899V13.6268C11.2224 13.7071 11.8519 13.75 12.5 13.75C13.1478 13.75 13.7772 13.7075 14.375 13.6273V15.4899C13.7902 15.577 13.16 15.625 12.5 15.625C11.84 15.625 11.2098 15.577 10.625 15.4899ZM4.375 9.64329C3.80809 9.50486 3.28607 9.32907 2.8241 9.12119C2.48924 8.9705 2.16593 8.7928 1.875 8.58834V9.6875C1.875 10.0659 2.24513 10.6158 3.33652 11.1068C3.64566 11.2459 3.99406 11.3705 4.375 11.4769V9.64329ZM18.125 10.3093L18.125 10.3125V10.3169C18.1221 10.6951 17.7507 11.2426 16.6635 11.7318C16.1695 11.954 15.5753 12.1394 14.9083 12.2723C14.8885 12.2752 14.869 12.2791 14.8498 12.2838C14.1369 12.4217 13.3427 12.5 12.5 12.5C12.2006 12.5 11.9069 12.49 11.6206 12.4709C11.8141 12.4011 11.9996 12.3262 12.1764 12.2467C13.3467 11.7202 14.375 10.8638 14.375 9.6875V8.25989C15.4463 8.42129 16.3581 8.71183 17.0206 9.07238C17.8517 9.52471 18.1232 9.9839 18.125 10.3093ZM15.625 13.3937V15.2269C16.0059 15.1205 16.3543 14.9959 16.6635 14.8568C17.7549 14.3658 18.125 13.8159 18.125 13.4375V12.3392C17.8342 12.5435 17.5111 12.7211 17.1764 12.8717C16.7143 13.0796 16.1921 13.2553 15.625 13.3937Z" fill="currentColor"/>
  </svg>
);

const SelectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', marginRight:3}}>
    <path fillRule="evenodd" clipRule="evenodd" d="M4.13836 2.69428C4.25278 2.04532 4.84871 1.60219 5.49396 1.66751L5.58642 1.68033L9.89496 2.44004C10.5439 2.55447 10.9871 3.1504 10.9217 3.79565L10.9089 3.88811L10.0428 8.79613L14.7265 7.09148C15.3444 6.86661 16.0244 7.15929 16.2917 7.74806L16.3287 7.83857L17.825 11.9497C17.9299 12.2379 17.9249 12.5537 17.8127 12.8372L17.8118 16.25C17.8118 16.909 17.3019 17.4489 16.6551 17.4966L16.5618 17.5H5.62434C5.44539 17.5 5.26986 17.4864 5.09333 17.4588C3.24107 17.1686 1.97441 15.4021 2.22748 13.5468L2.24872 13.4109L4.13836 2.69428ZM16.5616 13.7399L9.66406 16.2499L16.5618 16.25L16.5616 13.7399ZM3.47973 13.628L5.36936 2.91134L9.6779 3.67105L7.77862 14.4424L7.75496 14.5584C7.49777 15.6675 6.42454 16.4016 5.28657 16.2238C4.08809 16.036 3.26421 14.8503 3.47973 13.628ZM15.1541 8.2661L9.79219 10.2174L9.00963 14.6594C8.97599 14.8502 8.92721 15.0345 8.86471 15.2114L16.6504 12.3773L15.1541 8.2661ZM6.56186 14.0625C6.56186 13.5448 6.14212 13.125 5.62436 13.125C5.10659 13.125 4.68686 13.5448 4.68686 14.0625C4.68686 14.5803 5.10659 15 5.62436 15C6.14212 15 6.56186 14.5803 6.56186 14.0625Z" fill="currentColor"/>
  </svg>
);

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
  // ── Selections ──
  { id: 'g4', type: 'selection', name: 'Bedroom floor', costCode: '14.10 - Flooring', costType: 'Materials', status: 'Approved selection', clientPrice: 500, previouslyInvoicedPct: 0, children: [] },
  { id: 'g5', type: 'selection', name: 'Custom bed frame', costCode: '18.00 - Furnishings', costType: 'Materials', status: 'Approved selection', clientPrice: 500, previouslyInvoicedPct: 50, children: [] },
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
}

export default function EstimateModal({ open, onClose, onAdd, jobName }: Props) {
  // Filter out allowances that have selections (children) — those belong in the selections workflow
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

  const expandAll = () => {
    const anyCollapsed = filteredData.some(d => d.type !== 'line' && 'children' in d && d.children && d.children.length > 0 && !expanded[d.id]);
    const e: Record<string, boolean> = {};
    filteredData.forEach(d => {
      if (d.type !== 'line' && 'children' in d && d.children && d.children.length > 0) e[d.id] = anyCollapsed;
    });
    setExpanded(e);
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
  const selections = filtered.filter(d => d.type === 'selection');
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

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="est-modal-hdr">
          <div>
            <div className="est-modal-hdr-sub">{jobName}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Invoice line items from Estimate</h2>
          </div>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className="est-modal-body">
          <div className="est-desc">
            Choose estimate line items, pre-contract allowances, and selection options, then set the percentage to invoice for each.
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
              {renderSection('Allowances', allowances.filter(a => a.type === 'allowance' && !(a as EstimateGroup).children?.length))}
              {renderSection('Selections', selections)}
              {renderSection('Allowances with selections', allowances.filter(a => a.type === 'allowance' && (a as EstimateGroup).children?.length > 0))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="est-modal-footer">
          <button className="btn btn-p" onClick={handleAdd}>
            Add to invoice{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
