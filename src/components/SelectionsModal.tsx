import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';
import { allAllowances, allSelections } from '../allowanceMockData';

/* ─── Scenario note tooltip (portalled so overflow:hidden ancestors can't clip it) ─── */
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
    <span
      className="sel-scenario-tip"
      onClick={e => e.stopPropagation()}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span ref={iconRef} className="sel-scenario-tip-icon">i</span>
      {pos && createPortal(
        <span
          className="sel-scenario-tip-bubble sel-scenario-tip-bubble-portal"
          style={{ left: pos.left, top: pos.top }}
        >
          {note}
        </span>,
        document.body,
      )}
    </span>
  );
}

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
interface SelectionChild {
  id: string;
  lineItem: string;
  costCode: string;
  selection: string;
  selectionLink?: boolean;
  selectionStatus?: string;
  price: number;
  newInvoiceAmt: number | null;
}

interface SelectionGroup {
  id: string;
  type: 'allowance' | 'selection';
  name: string;
  canMarkComplete?: boolean;
  revisedPrice: number;
  previouslyInvoiced: number;
  invoiceBalance: number;
  allowanceBudget?: number;
  overage?: number;
  status?: string;
  scenarioNote?: string;
  isComplete?: boolean;
  children: SelectionChild[];
}

/* ─── Build data from shared allowance mock data ─── */
const SELECTIONS_DATA: SelectionGroup[] = allAllowances.map(allowance => {
  const sels = allSelections.filter(s => allowance.selectionIds.includes(s.id));
  const children: SelectionChild[] = [];

  // Allowance reversal line
  children.push({
    id: `${allowance.id}-rev`,
    lineItem: allowance.name,
    costCode: `${allowance.costCode.code} ${allowance.costCode.label}`,
    selection: 'Allowance',
    price: allowance.budgetAmount,
    newInvoiceAmt: -allowance.budgetAmount,
  });

  // Selection option lines
  sels.forEach(sel => {
    sel.options.forEach(opt => {
      const clientPrice = opt.unitCost * opt.quantity * (1 + opt.markup / 100);
      children.push({
        id: opt.id,
        lineItem: opt.name,
        costCode: `${opt.costCode.code} ${opt.costCode.label}`,
        selection: sel.name,
        price: Math.round(clientPrice * 100) / 100,
        newInvoiceAmt: Math.round(clientPrice * 100) / 100,
      });
    });
  });

  const totalSelections = children.filter(c => c.selection !== 'Allowance').reduce((s, c) => s + c.price, 0);

  return {
    id: allowance.id,
    type: 'allowance' as const,
    name: allowance.name.replace(' Allowance', ''),
    revisedPrice: totalSelections,
    previouslyInvoiced: allowance.budgetAmount,
    invoiceBalance: totalSelections - allowance.budgetAmount,
    children,
  };
});

/* ─── Component ─── */
type HeldUnderage = { id: string; name: string; costCode: string; amount: number };
type ReallocApplication = {
  source: { id: string; name: string; costCode: string };
  target: { id: string; name: string; costCode: string };
  amount: number;
  targetOverageTotal: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: SelectionGroup[]) => void;
  jobName: string;
  data?: SelectionGroup[];
  addedGroupIds?: string[];
  // Invoice-page-only behaviors; default to legacy progress-invoice behavior.
  showNegativeBalances?: boolean;
  sortByBalance?: boolean;
  onMarkComplete?: (id: string) => void;
  heldUnderages?: HeldUnderage[];
  onApplyReallocation?: (apps: ReallocApplication[]) => void;
}

export default function SelectionsModal({ open, onClose, onAdd, jobName, addedGroupIds = [], data, showNegativeBalances = false, sortByBalance = false, onMarkComplete, heldUnderages = [], onApplyReallocation }: Props) {
  const sourceData = data || SELECTIONS_DATA;
  const addedSet = new Set(addedGroupIds);
  const availableData = sourceData.filter(d => !addedSet.has(d.id));

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const e: Record<string, boolean> = {};
    sourceData.forEach(d => { e[d.id] = d.type === 'allowance'; });
    heldUnderages.forEach(u => { e[u.id] = false; });
    return e;
  });
  const [includeDescs, setIncludeDescs] = useState(true);
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = search
    ? availableData.filter(d => {
        const q = search.toLowerCase();
        if (d.name.toLowerCase().includes(q)) return true;
        if (d.children?.some(c => c.lineItem.toLowerCase().includes(q) || c.costCode.toLowerCase().includes(q) || c.selection.toLowerCase().includes(q))) return true;
        return false;
      })
    : availableData;

  const allIds = filtered.map(d => d.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected[id]);
  const someSelected = allIds.some(id => selected[id]);
  const selectedCount = allIds.filter(id => selected[id]).length;

  const toggleAll = () => {
    const next: Record<string, boolean> = { ...selected };
    const val = !allSelected;
    allIds.forEach(id => { next[id] = val; });
    setSelected(next);
  };
  const toggleItem = (id: string) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const toggleExpand = (id: string) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const expandAll = () => {
    const anyCollapsed = availableData.some(d => !expanded[d.id]);
    const e: Record<string, boolean> = { ...expanded };
    availableData.forEach(d => { e[d.id] = anyCollapsed; });
    setExpanded(e);
  };
  const allExpanded = availableData.length > 0 && availableData.every(d => expanded[d.id]);

  // Calculate invoice subtotal from children's newInvoiceAmt of selected groups
  const invoiceSubtotal = availableData
    .filter(d => selected[d.id])
    .reduce((sum, d) => {
      if (d.children && d.children.length > 0) {
        return sum + d.children.reduce((childSum, c) => childSum + (c.newInvoiceAmt ?? 0), 0);
      }
      return sum + d.invoiceBalance;
    }, 0);

  const handleCreate = () => {
    const items = availableData.filter(d => selected[d.id]);
    // Reallocation: for each selected underage, add its negative source line(s)
    // with target metadata when its match lands on a selected overage; otherwise
    // it becomes a bare credit at its own cost code (self-target).
    const selectedUnderageIds = new Set(heldUnderages.filter(u => selected[u.id]).map(u => u.id));
    const matchedApps = previewApps.filter(a => selectedUnderageIds.has(a.source.id));
    const bareCredits: ReallocApplication[] = heldUnderages
      .filter(u => selected[u.id])
      .map(u => {
        const applied = matchedApps.filter(a => a.source.id === u.id).reduce((s, a) => s + a.amount, 0);
        const bare = u.amount - applied;
        if (bare <= 0) return null;
        return {
          source: { id: u.id, name: u.name, costCode: u.costCode },
          target: { id: u.id, name: u.name, costCode: u.costCode },
          amount: bare,
          targetOverageTotal: 0,
        } as ReallocApplication;
      })
      .filter((x): x is ReallocApplication => x !== null);
    const allApps = [...matchedApps, ...bareCredits];

    if (items.length > 0) onAdd(items);
    if (allApps.length > 0 && onApplyReallocation) onApplyReallocation(allApps);
    onClose();
  };

  // Greedy match held underages against SELECTED overages, so the underage
  // sub-table previews "if you apply this, here's where it goes" based on
  // what the builder has currently checked. Recomputes on every selection.
  const previewApps: ReallocApplication[] = (() => {
    const apps: ReallocApplication[] = [];
    const selectedOverageRows = availableData
      .filter(d => selected[d.id] && d.type === 'allowance' && (d.overage ?? 0) > 0)
      .map(d => ({ id: d.id, name: d.name, costCode: d.children?.[0]?.costCode || '', overageAmount: d.overage ?? 0 }));
    let held = heldUnderages.map(h => ({ ...h }));
    selectedOverageRows.forEach(over => {
      let remaining: number = over.overageAmount;
      while (remaining > 0 && held.length > 0) {
        const src = held[0];
        const take = Math.min(src.amount, remaining);
        apps.push({
          source: { id: src.id, name: src.name, costCode: src.costCode },
          target: { id: over.id, name: over.name, costCode: over.costCode },
          amount: take,
          targetOverageTotal: over.overageAmount,
        });
        src.amount -= take;
        remaining -= take;
        if (src.amount === 0) held.shift();
      }
    });
    return apps;
  })();

  const chevron = (isOpen: boolean) => (
    <span className={"est-group-chevron" + (isOpen ? " open" : "")}>&#9654;</span>
  );

  // Render one allowance/selection card. Extracted so the same card can appear
  // inside multiple subgroups (Overages, Other allowances, Selections) without
  // duplicating the JSX. Coverage suggestions live on the invoice page's
  // Smart panel, not here.
  const renderItemCard = (item: SelectionGroup) => {
    const isExpanded = expanded[item.id];
    return (
      <div key={item.id} style={{ marginBottom: 10, border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
        <div className="sel-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={"est-check" + (selected[item.id] ? " on" : "")} onClick={() => toggleItem(item.id)} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => toggleExpand(item.id)}>
              {chevron(isExpanded)}
              <span style={{ color: 'var(--bt-midnight)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {item.type === 'allowance' ? <AllowanceIcon /> : <SelectionIcon />}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--bt-midnight)' }}>{item.name}</span>
              {item.scenarioNote && <ScenarioTooltip note={item.scenarioNote} />}
            </div>
            {onMarkComplete && item.canMarkComplete && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkComplete(item.id); }}
                style={{
                  marginLeft: 8, padding: '3px 10px', fontSize: 12, fontWeight: 500, borderRadius: 4,
                  border: item.isComplete ? '1px solid var(--green, #2f855a)' : '1px solid var(--g300)',
                  background: item.isComplete ? 'var(--green-bg, #f0fff4)' : '#fff',
                  color: item.isComplete ? 'var(--green, #2f855a)' : 'var(--g600)',
                  cursor: 'pointer',
                }}
              >
                {item.isComplete ? '✓ Completed' : 'Mark complete'}
              </button>
            )}
          </div>
          <div className="sel-card-meta">
            <div className="sel-meta-item">
              <div className="sel-meta-label">Revised price</div>
              <div className="sel-meta-value">${fmt(item.revisedPrice)}</div>
            </div>
            <div className="sel-meta-item">
              <div className="sel-meta-label">Previously invoiced</div>
              <div className="sel-meta-value">${fmt(item.previouslyInvoiced)}</div>
            </div>
            <div className="sel-meta-item">
              <div className="sel-meta-label">Remaining to invoice</div>
              <div className="sel-meta-value" style={{ color: item.invoiceBalance < 0 ? 'var(--red, #c53030)' : item.invoiceBalance > 0 ? 'var(--bt-midnight)' : 'var(--g500)' }}>{item.invoiceBalance < 0 ? '-' : ''}${fmt(Math.abs(item.invoiceBalance))}</div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', minWidth: 560 }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Line item</th>
                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Cost code</th>
                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Selection</th>
                  <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>New invoice amount</th>
                </tr>
              </thead>
              <tbody>
                {item.children.map((child, idx) => (
                  <tr key={child.id} style={{ borderBottom: idx < item.children.length - 1 ? '1px solid var(--g100)' : 'none' }}>
                    <td style={{ padding: '8px 14px', color: 'var(--g700)' }}>{child.lineItem}</td>
                    <td style={{ padding: '8px 14px', color: 'var(--g500)' }}>{child.costCode}</td>
                    <td style={{ padding: '8px 14px' }}>
                      {child.selection === 'Allowance' ? (
                        <span style={{ color: 'var(--g500)' }}>Allowance</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--bt-blue)', textDecoration: 'underline', fontSize: 13 }}>{child.selection}</a>
                          {child.selectionStatus && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-bg)', padding: '1px 6px', borderRadius: 3 }}>{child.selectionStatus}</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>${fmt(child.price)}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 500, color: child.newInvoiceAmt === null ? 'var(--g400)' : 'var(--g700)' }}>
                      {child.newInvoiceAmt === null
                        ? '--'
                        : `${child.newInvoiceAmt < 0 ? '-' : ''}$${fmt(Math.abs(child.newInvoiceAmt))}`}
                    </td>
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
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="est-modal-hdr">
          <div>
            <div className="est-modal-hdr-sub">{jobName}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Invoice for remaining selections balance</h2>
          </div>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className="est-modal-body">
          <div className="est-desc" style={{ marginBottom: 16 }}>
            Invoice for post-contract allowance overages and selection option changes. Previously invoiced allowances will be credited against new approved selections.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="est-include-check" style={{ marginBottom: 0 }} onClick={() => setIncludeDescs(!includeDescs)}>
                <div className={"est-check" + (includeDescs ? " on" : "")} />
                Include line item descriptions &amp; notes
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="est-include-check" style={{ marginBottom: 0 }} onClick={toggleAll}>
                <div className={"est-check" + (allSelected ? " on" : someSelected ? " partial" : "")} />
                Select all
              </label>
              <button className="est-expand-btn" onClick={expandAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20l5-5 5 5" /><path d="M7 4l5 5 5-5" /></svg>
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
            <div className="sel-search-wrap" style={{ position: 'relative', width: 220 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)' }}>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                className="est-search"
                style={{ width: '100%', paddingLeft: 30 }}
                placeholder="Search line item"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="est-table-scroll">
            <div className="est-table-inner">
              {/* Allowances section — split into Overages (reallocation targets) + Other allowances */}
              {(() => {
                const underageIds = new Set(heldUnderages.map(h => h.id));
                const all = filtered.filter(d => d.type === 'allowance' && !underageIds.has(d.id) && (showNegativeBalances || d.invoiceBalance >= 0));
                const overages = all.filter(d => (d.overage ?? 0) > 0);
                const others = all.filter(d => (d.overage ?? 0) <= 0);
                const sort = (arr: SelectionGroup[]) => sortByBalance ? [...arr].sort((a, b) => b.invoiceBalance - a.invoiceBalance) : arr;
                const useSubsections = heldUnderages.length > 0 && overages.length > 0;
                if (all.length === 0) return null;
                return (
                  <>
                    <div className="est-section-label">Allowances</div>
                    {overages.length > 0 && (
                      <>
                        {useSubsections && (
                          <div className="est-subsection-label">
                            <span>Overages</span>
                          </div>
                        )}
                        {sort(overages).map(o => renderItemCard(o))}
                      </>
                    )}
                    {others.length > 0 && (
                      <>
                        {useSubsections && <div className="est-subsection-label">Other allowances</div>}
                        {sort(others).map(o => renderItemCard(o))}
                      </>
                    )}
                  </>
                );
              })()}

              {/* Allowance underages — reference list of completed-and-under allowances. The
                  primary affordance lives on each Overage card's "Apply coverage" callout. */}
              {heldUnderages.length > 0 && (
                <>
                  <div className="est-section-label" style={{ marginTop: 16 }}>Allowance underages · reference</div>
                  {heldUnderages.map(u => {
                    const isExpanded = expanded[u.id] === true;
                    const breakdown = previewApps.filter(a => a.source.id === u.id);
                    const allocated = breakdown.reduce((s, b) => s + b.amount, 0);
                    const stillHeld = u.amount - allocated;
                    const isSelected = !!selected[u.id];
                    return (
                      <div key={u.id} style={{ marginBottom: 8, border: '1px solid var(--g200)', background: 'white', borderRadius: 8, overflow: 'hidden' }}>
                        <div className="sel-card-header" style={{ background: 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={"est-check" + (isSelected ? " on" : "")} onClick={() => toggleItem(u.id)} style={{ flexShrink: 0 }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => toggleExpand(u.id)}>
                              {chevron(isExpanded)}
                              <span style={{ color: 'var(--bt-blue)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                                <AllowanceIcon />
                              </span>
                              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--bt-midnight)' }}>{u.name}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-bg)', padding: '2px 8px', borderRadius: 3, marginLeft: 4 }}>
                                Marked complete
                              </span>
                            </div>
                          </div>
                          <div className="sel-card-meta">
                            <div className="sel-meta-item">
                              <div className="sel-meta-label">Unspent budget</div>
                              <div className="sel-meta-value">${fmt(u.amount)}</div>
                            </div>
                            <div className="sel-meta-item">
                              <div className="sel-meta-label">Reallocated</div>
                              <div className="sel-meta-value" style={{ color: allocated > 0 ? 'var(--bt-blue)' : 'var(--g400)' }}>${fmt(allocated)}</div>
                            </div>
                            <div className="sel-meta-item">
                              <div className="sel-meta-label">Stays held</div>
                              <div className="sel-meta-value" style={{ color: stillHeld > 0 ? 'var(--g700)' : 'var(--g400)' }}>${fmt(stillHeld)}</div>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ overflowX: 'auto', background: 'white' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', minWidth: 560 }}>
                              <colgroup>
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '22%' }} />
                                <col style={{ width: '26%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                              </colgroup>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Line item</th>
                                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Cost code</th>
                                  <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Selection</th>
                                  <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Price</th>
                                  <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>New invoice amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {breakdown.length === 0 && stillHeld > 0 && (
                                  <tr>
                                    <td colSpan={5} style={{ padding: '14px', textAlign: 'center', color: 'var(--g500)', fontSize: 12, fontStyle: 'italic' }}>
                                      No overages selected yet — check an overage allowance below to apply this credit, or leave for last draw.
                                    </td>
                                  </tr>
                                )}
                                {breakdown.map((b, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid var(--g100)' }}>
                                    <td style={{ padding: '8px 14px', color: 'var(--g700)' }}>{b.target.name} overage</td>
                                    <td style={{ padding: '8px 14px', color: 'var(--g500)' }}>{b.target.costCode}</td>
                                    <td style={{ padding: '8px 14px', color: 'var(--g500)' }}>Allowance overage</td>
                                    <td style={{ padding: '8px 14px', textAlign: 'right' }}>${fmt(b.targetOverageTotal)}</td>
                                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 500, color: 'var(--red, #c53030)' }}>
                                      -${fmt(b.amount)}
                                    </td>
                                  </tr>
                                ))}
                                {stillHeld > 0 && breakdown.length > 0 && (
                                  <tr>
                                    <td style={{ padding: '8px 14px', color: 'var(--g600)' }}>Held for last draw</td>
                                    <td style={{ padding: '8px 14px', color: 'var(--g400)' }}>—</td>
                                    <td style={{ padding: '8px 14px', color: 'var(--g500)' }}>Hold</td>
                                    <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--g400)' }}>—</td>
                                    <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--g500)' }}>${fmt(stillHeld)} (held)</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              {filtered.filter(d => d.type === 'selection').length > 0 && (
                <div className="est-section-label" style={{ marginTop: 8 }}>Selections</div>
              )}
              {filtered.filter(d => d.type === 'selection').map(item => {
                const isExpanded = expanded[item.id];
                return (
                  <div key={item.id} style={{ marginBottom: 10, border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
                    {/* Group header */}
                    <div className="sel-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className={"est-check" + (selected[item.id] ? " on" : "")}
                          onClick={() => toggleItem(item.id)}
                          style={{ flexShrink: 0 }}
                        />
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                          onClick={() => toggleExpand(item.id)}
                        >
                          {chevron(isExpanded)}
                          <span style={{ color: 'var(--bt-midnight)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                            <SelectionIcon />
                          </span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--bt-midnight)' }}>{item.name}</span>
                          {item.scenarioNote && <ScenarioTooltip note={item.scenarioNote} />}
                        </div>
                      </div>
                      <div className="sel-card-meta">
                        <div className="sel-meta-item">
                          <div className="sel-meta-label">Revised price</div>
                          <div className="sel-meta-value">${fmt(item.revisedPrice)}</div>
                        </div>
                        <div className="sel-meta-item">
                          <div className="sel-meta-label">Previously invoiced</div>
                          <div className="sel-meta-value">${fmt(item.previouslyInvoiced)}</div>
                        </div>
                        <div className="sel-meta-item">
                          <div className="sel-meta-label">Remaining to invoice</div>
                          <div className="sel-meta-value" style={{ color: item.invoiceBalance < 0 ? 'var(--red, #c53030)' : item.invoiceBalance > 0 ? 'var(--bt-midnight)' : 'var(--g500)' }}>{item.invoiceBalance < 0 ? '-' : ''}${fmt(Math.abs(item.invoiceBalance))}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-table */}
                    {isExpanded && (
                      <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed', minWidth: 560 }}>
                        <colgroup>
                          <col style={{ width: '22%' }} />
                          <col style={{ width: '22%' }} />
                          <col style={{ width: '26%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '15%' }} />
                        </colgroup>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Line item</th>
                            <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Cost code</th>
                            <th style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Selection</th>
                            <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: '8px 14px', fontWeight: 500, fontSize: 12, color: 'var(--g500)', borderTop: '1px solid var(--g200)', borderBottom: '1px solid var(--g200)' }}>New invoice amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.children.map((child, idx) => (
                            <tr key={child.id} style={{ borderBottom: idx < item.children.length - 1 ? '1px solid var(--g100)' : 'none' }}>
                              <td style={{ padding: '8px 14px', color: 'var(--g700)' }}>{child.lineItem}</td>
                              <td style={{ padding: '8px 14px', color: 'var(--g500)' }}>{child.costCode}</td>
                              <td style={{ padding: '8px 14px' }}>
                                <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--bt-blue)', textDecoration: 'underline', fontSize: 13 }}>{child.selection}</a>
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'right' }}>${fmt(child.price)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 500, color: child.newInvoiceAmt === null ? 'var(--g400)' : 'var(--g700)' }}>
                                {child.newInvoiceAmt === null ? '--' : `${child.newInvoiceAmt < 0 ? '-' : ''}$${fmt(Math.abs(child.newInvoiceAmt))}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="est-modal-footer sel-footer">
          <div style={{ fontSize: 14, color: 'var(--g600)' }}>
            Invoice subtotal: <strong style={{ fontSize: 16, color: 'var(--bt-midnight)', marginLeft: 6 }}>${fmt(invoiceSubtotal)}</strong>
          </div>
          <button className="btn btn-p" onClick={handleCreate} disabled={selectedCount === 0} style={{ opacity: selectedCount === 0 ? 0.5 : 1 }}>
            Add to invoice
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
