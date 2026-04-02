import { useState } from 'react';
import { createPortal } from 'react-dom';
import { fmt } from '../utils';

/* ─── Icons ─── */
const AllowanceIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', marginRight:3}}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.8241 4.00381C1.65395 4.53038 0.625 5.38671 0.625 6.5625V9.6875C0.625 10.8638 1.6533 11.7202 2.82364 12.2467C3.60869 12.5999 4.56725 12.8603 5.625 13.0023V13.4375C5.625 14.6138 6.6533 15.4702 7.82364 15.9967C9.05236 16.5495 10.7061 16.875 12.5 16.875C14.2939 16.875 15.9476 16.5495 17.1764 15.9967C18.3467 15.4702 19.375 14.6138 19.375 13.4375V10.3207L19.375 10.3125C19.375 9.27868 18.5714 8.4933 17.6181 7.97446C16.7577 7.50618 15.6318 7.168 14.375 6.99717V6.5625C14.375 5.38671 13.346 4.53038 12.1759 4.00381C10.9471 3.45084 9.29334 3.125 7.5 3.125C5.70666 3.125 4.05292 3.45084 2.8241 4.00381Z" fill="currentColor"/>
  </svg>
);

const SelectionIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', marginRight:3}}>
    <path fillRule="evenodd" clipRule="evenodd" d="M4.13836 2.69428C4.25278 2.04532 4.84871 1.60219 5.49396 1.66751L5.58642 1.68033L9.89496 2.44004C10.5439 2.55447 10.9871 3.1504 10.9217 3.79565L10.9089 3.88811L10.0428 8.79613L14.7265 7.09148C15.3444 6.86661 16.0244 7.15929 16.2917 7.74806L16.3287 7.83857L17.825 11.9497C17.9299 12.2379 17.9249 12.5537 17.8127 12.8372L17.8118 16.25C17.8118 16.909 17.3019 17.4489 16.6551 17.4966L16.5618 17.5H5.62434C5.44539 17.5 5.26986 17.4864 5.09333 17.4588C3.24107 17.1686 1.97441 15.4021 2.22748 13.5468L2.24872 13.4109L4.13836 2.69428Z" fill="currentColor"/>
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
  revisedPrice: number;
  previouslyInvoiced: number;
  invoiceBalance: number;
  status?: string;
  children: SelectionChild[];
}

/* ─── Mock Data ─── */
const SELECTIONS_DATA: SelectionGroup[] = [
  // ── Allowances with selections (overages) ──
  {
    id: 'sg1', type: 'allowance', name: 'Cabinets',
    revisedPrice: 34800, previouslyInvoiced: 24000, invoiceBalance: 10800,
    children: [
      { id: 'sg1a', lineItem: 'Cabinets', costCode: '12.20 Cabinets', selection: 'Allowance', price: 24000, newInvoiceAmt: -24000 },
      { id: 'sg1b', lineItem: 'Custom cabinetry', costCode: '12.20 Cabinets', selection: 'Premium custom package', price: 20000, newInvoiceAmt: 20000 },
      { id: 'sg1c', lineItem: 'Cabinet install', costCode: '12.15 Cabinet Install labor', selection: 'Premium custom package', price: 14800, newInvoiceAmt: 14800 },
    ]
  },
  {
    id: 'sg2', type: 'allowance', name: 'Light fixtures',
    revisedPrice: 22000, previouslyInvoiced: 18000, invoiceBalance: 4000,
    children: [
      { id: 'sg2a', lineItem: 'Lighting allowance', costCode: '11 Lighting', selection: 'Allowance', price: 18000, newInvoiceAmt: -18000 },
      { id: 'sg2b', lineItem: 'Lighting package', costCode: '11 Lighting', selection: 'Standard lighting', price: 12000, newInvoiceAmt: 12000 },
      { id: 'sg2c', lineItem: 'Lighting install', costCode: '11.5 Lighting install', selection: 'Standard lighting', price: 6000, newInvoiceAmt: 6000 },
      { id: 'sg2d', lineItem: 'Dimmer switches (6x)', costCode: '11.2 Electrical', selection: 'Standard lighting', price: 4000, newInvoiceAmt: 4000 },
    ]
  },
  {
    id: 'sg3', type: 'allowance', name: 'Kitchen tiles',
    revisedPrice: 9800, previouslyInvoiced: 7200, invoiceBalance: 2600,
    children: [
      { id: 'sg3a', lineItem: 'Kitchen tiles', costCode: '15.20 - Tile Materials', selection: 'Allowance', price: 7200, newInvoiceAmt: -7200 },
      { id: 'sg3b', lineItem: 'Backsplash tile', costCode: '15.20 - Tile Materials', selection: 'Basic Package', selectionStatus: 'Approved', price: 5400, newInvoiceAmt: 5400 },
      { id: 'sg3c', lineItem: 'Tile grout & adhesive', costCode: '15.20 - Tile Materials', selection: 'Basic Package', price: 1800, newInvoiceAmt: 1800 },
      { id: 'sg3d', lineItem: 'Tile installation labor', costCode: '15.10 - Tile Labor', selection: 'Basic Package', price: 2600, newInvoiceAmt: 2600 },
    ]
  },
  {
    id: 'sg6', type: 'allowance', name: 'Bathroom fixtures',
    revisedPrice: 8500, previouslyInvoiced: 5000, invoiceBalance: 3500,
    children: [
      { id: 'sg6a', lineItem: 'Bathroom fixtures', costCode: '07.10 - Fixtures', selection: 'Allowance', price: 5000, newInvoiceAmt: -5000 },
      { id: 'sg6b', lineItem: 'Vanity & sink combo', costCode: '07.10 - Fixtures', selection: 'Modern Deluxe package', selectionStatus: 'Approved', price: 3800, newInvoiceAmt: 3800 },
      { id: 'sg6c', lineItem: 'Faucet set', costCode: '07.10 - Fixtures', selection: 'Modern Deluxe package', price: 1200, newInvoiceAmt: 1200 },
      { id: 'sg6d', lineItem: 'Shower head & valve', costCode: '07.15 - Plumbing Fixtures', selection: 'Modern Deluxe package', price: 2200, newInvoiceAmt: 2200 },
      { id: 'sg6e', lineItem: 'Towel bars & accessories', costCode: '07.10 - Fixtures', selection: 'Modern Deluxe package', price: 1300, newInvoiceAmt: 1300 },
    ]
  },
  {
    id: 'sg7', type: 'allowance', name: 'Flooring',
    revisedPrice: 15200, previouslyInvoiced: 12000, invoiceBalance: 3200,
    children: [
      { id: 'sg7a', lineItem: 'Flooring allowance', costCode: '14.00 - Flooring', selection: 'Allowance', price: 12000, newInvoiceAmt: -12000 },
      { id: 'sg7b', lineItem: 'Engineered hardwood', costCode: '14.00 - Flooring', selection: 'Premium Oak', selectionStatus: 'Approved', price: 9500, newInvoiceAmt: 9500 },
      { id: 'sg7c', lineItem: 'Floor installation', costCode: '14.05 - Flooring Labor', selection: 'Premium Oak', price: 4200, newInvoiceAmt: 4200 },
      { id: 'sg7d', lineItem: 'Underlayment', costCode: '14.00 - Flooring', selection: 'Premium Oak', price: 1500, newInvoiceAmt: 1500 },
    ]
  },
  // ── Standalone selections (post-contract additions) ──
  {
    id: 'sg4', type: 'selection', name: 'GE Over the Range Microwave', status: 'Approved Selection',
    revisedPrice: 1440, previouslyInvoiced: 0, invoiceBalance: 1440,
    children: [
      { id: 'sg4a', lineItem: 'Microwave', costCode: '16.00 Appliances', selection: 'GE Over the Range Microwave', price: 1440, newInvoiceAmt: 1440 },
    ]
  },
  {
    id: 'sg5', type: 'selection', name: 'Simzlife 45 Bottle Wine Fridge', status: 'Approved Selection',
    revisedPrice: 360, previouslyInvoiced: 0, invoiceBalance: 360,
    children: [
      { id: 'sg5a', lineItem: 'Wine Fridge', costCode: '16.00 Appliances', selection: 'Simzlife 45 Bottle Wine Fridge', price: 360, newInvoiceAmt: 360 },
    ]
  },
  {
    id: 'sg8', type: 'selection', name: 'Outdoor ceiling fan', status: 'Approved Selection',
    revisedPrice: 850, previouslyInvoiced: 0, invoiceBalance: 850,
    children: [
      { id: 'sg8a', lineItem: 'Ceiling fan', costCode: '11.3 - Fans', selection: 'Outdoor ceiling fan', price: 650, newInvoiceAmt: 650 },
      { id: 'sg8b', lineItem: 'Fan installation', costCode: '11.3 - Fans', selection: 'Outdoor ceiling fan', price: 200, newInvoiceAmt: 200 },
    ]
  },
  {
    id: 'sg9', type: 'selection', name: 'Smart thermostat', status: 'Approved Selection',
    revisedPrice: 480, previouslyInvoiced: 0, invoiceBalance: 480,
    children: [
      { id: 'sg9a', lineItem: 'Nest thermostat', costCode: '10.00 - HVAC', selection: 'Smart thermostat', price: 350, newInvoiceAmt: 350 },
      { id: 'sg9b', lineItem: 'Thermostat install', costCode: '10.00 - HVAC', selection: 'Smart thermostat', price: 130, newInvoiceAmt: 130 },
    ]
  },
  {
    id: 'sg10', type: 'selection', name: 'Upgraded garage door opener', status: 'Approved Selection',
    revisedPrice: 1200, previouslyInvoiced: 0, invoiceBalance: 1200,
    children: [
      { id: 'sg10a', lineItem: 'Belt-drive opener', costCode: '19.00 - Garage', selection: 'Upgraded garage door opener', price: 800, newInvoiceAmt: 800 },
      { id: 'sg10b', lineItem: 'Opener installation', costCode: '19.00 - Garage', selection: 'Upgraded garage door opener', price: 400, newInvoiceAmt: 400 },
    ]
  },
];

function fmtCurrency(v: number) {
  const abs = Math.abs(v);
  const formatted = '$' + fmt(abs);
  return v < 0 ? '-' + formatted : formatted;
}

/* ─── Component ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (items: SelectionGroup[]) => void;
  jobName: string;
  addedGroupIds?: string[];
}

export default function SelectionsModalV2({ open, onClose, onAdd, jobName, addedGroupIds = [] }: Props) {
  const addedSet = new Set(addedGroupIds);
  const availableData = SELECTIONS_DATA.filter(d => {
    if (addedSet.has(d.id)) return false;
    // Hide fully invoiced items (no remaining balance and no new amounts to invoice)
    const childrenTotal = d.children.reduce((s, c) => s + (c.newInvoiceAmt ?? 0), 0);
    if (d.invoiceBalance === 0 && childrenTotal === 0) return false;
    return true;
  });

  const allowanceGroups = availableData.filter(d => d.type === 'allowance');
  const selectionGroups = availableData.filter(d => d.type === 'selection');

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const e: Record<string, boolean> = {};
    SELECTIONS_DATA.forEach(d => { e[d.id] = false; });
    return e;
  });

  if (!open) return null;

  const allIds = availableData.map(d => d.id);
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

  const invoiceSubtotal = availableData
    .filter(d => selected[d.id])
    .reduce((sum, d) => {
      if (d.children && d.children.length > 0) {
        return sum + d.children.reduce((childSum, c) => childSum + (c.newInvoiceAmt ?? 0), 0);
      }
      return sum + d.invoiceBalance;
    }, 0);

  // Summary stats
  const totalAllowanceBudget = allowanceGroups.reduce((s, d) => {
    const allowanceChild = d.children.find(c => c.selection === 'Allowance');
    return s + (allowanceChild ? allowanceChild.price : 0);
  }, 0);
  const totalSelectionCost = allowanceGroups.reduce((s, d) => {
    return s + d.children.filter(c => c.selection !== 'Allowance').reduce((cs, c) => cs + c.price, 0);
  }, 0);
  const totalOverage = totalSelectionCost - totalAllowanceBudget;
  const totalStandaloneValue = selectionGroups.reduce((s, d) => s + d.revisedPrice, 0);

  const handleCreate = () => {
    const items = availableData.filter(d => selected[d.id]);
    onAdd(items);
    onClose();
  };

  const renderGroupCard = (item: SelectionGroup) => {
    const isExpanded = expanded[item.id];
    const isSelected = selected[item.id];
    const childrenTotal = item.children.reduce((s, c) => s + (c.newInvoiceAmt ?? 0), 0);

    // For allowances, calculate overage bar data
    const allowanceChild = item.children.find(c => c.selection === 'Allowance');
    const allowanceAmt = allowanceChild ? allowanceChild.price : 0;
    const selectionAmt = item.children.filter(c => c.selection !== 'Allowance').reduce((s, c) => s + c.price, 0);

    return (
      <div
        key={item.id}
        style={{
          border: `1.5px solid ${isSelected ? 'var(--bt-blue)' : 'var(--g200)'}`,
          borderRadius: 8,
          marginBottom: 10,
          background: isSelected ? '#f0f7ff' : 'white',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: '12px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
          onClick={() => toggleItem(item.id)}
        >
          <div
            className={"est-check" + (isSelected ? " on" : "")}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + inline math */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: item.type === 'allowance' ? 'var(--bt-blue)' : 'var(--green)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {item.type === 'allowance' ? <AllowanceIcon /> : <SelectionIcon />}
              </span>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--bt-midnight)' }}>{item.name}</span>
            </div>
            {/* Condensed math row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'var(--g500)', flexWrap: 'wrap' }}>
              {item.type === 'allowance' && allowanceAmt > 0 && (
                <>
                  <span>Allowance <strong style={{ color: 'var(--g600)' }}>${fmt(allowanceAmt)}</strong></span>
                  <span style={{ color: 'var(--g300)' }}>→</span>
                  <span>Selections <strong style={{ color: 'var(--g700)' }}>${fmt(selectionAmt)}</strong></span>
                  {item.previouslyInvoiced > 0 && (
                    <>
                      <span style={{ color: 'var(--g300)' }}>·</span>
                      <span>{fmtCurrency(item.previouslyInvoiced)} invoiced</span>
                    </>
                  )}
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: childrenTotal > 0 ? '#c2410c' : childrenTotal < 0 ? 'var(--green)' : 'var(--g400)' }}>
                    {childrenTotal > 0 ? '+' : ''}{fmtCurrency(childrenTotal)} overage
                  </span>
                </>
              )}
              {item.type === 'selection' && (
                <>
                  <span>Post-contract</span>
                  {item.previouslyInvoiced > 0 && (
                    <>
                      <span style={{ color: 'var(--g300)' }}>·</span>
                      <span>{fmtCurrency(item.previouslyInvoiced)} invoiced</span>
                    </>
                  )}
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--g700)' }}>
                    {fmtCurrency(childrenTotal)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        <div
          style={{
            padding: '0 14px 8px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--bt-blue)', fontWeight: 500,
              padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{
              display: 'inline-block', transition: 'transform 0.15s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: 10,
            }}>&#9654;</span>
            {isExpanded ? 'Hide' : 'Show'} {item.children.length} line item{item.children.length !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Expanded line items */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid var(--g150, #eee)', padding: '0 14px 12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
              <thead>
                <tr style={{ color: 'var(--g400)', fontWeight: 500, fontSize: 11 }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>Line item</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>Cost code</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 500 }}>Selection</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 500 }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', fontWeight: 500 }}>New invoice amt</th>
                </tr>
              </thead>
              <tbody>
                {item.children.map(child => {
                  const isCredit = child.newInvoiceAmt !== null && child.newInvoiceAmt < 0;
                  const isNull = child.newInvoiceAmt === null;
                  return (
                    <tr key={child.id} style={{ opacity: isNull ? 0.5 : 1 }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{child.lineItem}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--g500)' }}>{child.costCode}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {child.selection === 'Allowance' ? (
                          <span style={{ color: 'var(--g500)', fontStyle: 'italic' }}>Original allowance</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--g700)' }}>{child.selection}</span>
                            {child.selectionStatus && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', background: 'var(--green-bg)', padding: '1px 6px', borderRadius: 3 }}>{child.selectionStatus}</span>
                            )}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>${fmt(child.price)}</td>
                      <td style={{
                        padding: '6px 8px', textAlign: 'right', fontWeight: 600,
                        color: isNull ? 'var(--g400)' : isCredit ? '#dc2626' : 'var(--g700)',
                      }}>
                        {isNull ? '--' : fmtCurrency(child.newInvoiceAmt!)}
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
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="est-modal-hdr">
          <div>
            <div className="est-modal-hdr-sub">{jobName}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Invoice for selection changes</h2>
            <p style={{ fontSize: 13, color: 'var(--g500)', margin: '4px 0 0', lineHeight: 1.4 }}>
              Review how selection choices changed the job price, then choose what to invoice.
            </p>
          </div>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Summary strip */}
        <div style={{
          display: 'flex', gap: 0, padding: '0 24px 0',
          borderBottom: '1px solid var(--g200)',
        }}>
          {allowanceGroups.length > 0 && (
            <div style={{ flex: 1, padding: '12px 16px 12px 0', borderRight: selectionGroups.length > 0 ? '1px solid var(--g200)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 500 }}>Original allowances</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--g600)', marginTop: 2 }}>${fmt(totalAllowanceBudget)}</div>
            </div>
          )}
          {allowanceGroups.length > 0 && (
            <div style={{ flex: 1, padding: '12px 16px', borderRight: selectionGroups.length > 0 ? '1px solid var(--g200)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 500 }}>Actual selection cost</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--g700)', marginTop: 2 }}>${fmt(totalSelectionCost)}</div>
            </div>
          )}
          {allowanceGroups.length > 0 && (
            <div style={{ flex: 1, padding: '12px 16px', borderRight: selectionGroups.length > 0 ? '1px solid var(--g200)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 500 }}>Net overage</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: totalOverage > 0 ? '#c2410c' : totalOverage < 0 ? 'var(--green)' : 'var(--g500)', marginTop: 2 }}>
                {totalOverage > 0 ? '+' : ''}{fmtCurrency(totalOverage)}
              </div>
            </div>
          )}
          {selectionGroups.length > 0 && (
            <div style={{ flex: 1, padding: allowanceGroups.length > 0 ? '12px 0 12px 16px' : '12px 16px 12px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 500 }}>Post-contract additions</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--g700)', marginTop: 2 }}>${fmt(totalStandaloneValue)}</div>
              <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 1 }}>{selectionGroups.length} option{selectionGroups.length !== 1 ? 's' : ''} added</div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="est-modal-body">
          {/* Select all */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <label className="est-include-check" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={toggleAll}>
              <div className={"est-check" + (allSelected ? " on" : someSelected ? " partial" : "")} />
              Select all ({availableData.length})
            </label>
            {selectedCount > 0 && (
              <span style={{ fontSize: 12, color: 'var(--g500)' }}>{selectedCount} selected</span>
            )}
          </div>

          {/* Allowance overages section */}
          {allowanceGroups.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--g400)', textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: 4,
              }}>
                Allowance overages
              </div>
              <p style={{ fontSize: 12, color: 'var(--g400)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Selection choices exceeded the original allowance. The allowance amount previously invoiced will be credited, and the actual selection cost invoiced instead.
              </p>
              {allowanceGroups.map(renderGroupCard)}
            </div>
          )}

          {/* Standalone selections section */}
          {selectionGroups.length > 0 && (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--g400)', textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: 4,
              }}>
                Post-contract selections
              </div>
              <p style={{ fontSize: 12, color: 'var(--g400)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Options added or changed after the contract was signed. These are new costs not covered by an allowance.
              </p>
              {selectionGroups.map(renderGroupCard)}
            </div>
          )}

          {availableData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--g400)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>All selections have been added to the invoice</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Remove line items from the invoice to make them available here again.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="est-modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--g400)' }}>Invoice subtotal</div>
            <strong style={{ fontSize: 22, color: invoiceSubtotal !== 0 ? 'var(--bt-midnight)' : 'var(--g400)' }}>
              {fmtCurrency(invoiceSubtotal)}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-s" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-p"
              onClick={handleCreate}
              disabled={selectedCount === 0}
              style={{ opacity: selectedCount === 0 ? 0.5 : 1 }}
            >
              Add to invoice ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
