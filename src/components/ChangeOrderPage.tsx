import { useState, useEffect } from 'react';
import { LineItem } from '../types';
import { EXISTING_INVOICES } from '../mockData';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface OverageItem {
  costCode: string;
  label: string;
  budget: number;
  invoiced: number;
  overage: number;
}

// Where an approved change order should land when "Invoice client upon
// approval" is checked. 'openbook' is the one progress invoice already
// being built for this job (AIAPayApp/addedCOIds); 'existing' points at any
// other in-progress progress invoice (EXISTING_INVOICES).
export type COInvoiceTarget =
  | { type: 'new'; invoiceType: 'invoice' | 'progress' }
  | { type: 'existing'; invoiceNumber: string }
  | { type: 'openbook' };

interface Props {
  onBack: () => void;
  onApprove?: (invoiceTarget?: COInvoiceTarget, lineItems?: LineItem[], coTitle?: string) => void;
  overages?: OverageItem[];
  coId?: string | null;
}

const COST_CODE_LABELS: Record<string, string> = {
  '4100': '4100 – Stone masonry',
  '3100': '3100 – Framing (C)',
  '2010': '2010 – Foundation (C)',
};

// Pre-defined CO data for CO #3 (budget reallocation)
const CO3_LINE_ITEMS = [
  { id: '1', description: '3100 – Framing (C)', costType: 'Labor', unitCost: 8500, quantity: 1, unit: 'LS', builderCost: 8500, markup: 0, clientPrice: 8500 },
  { id: '2', description: '2010 – Foundation (C)', costType: 'Materials', unitCost: -8500, quantity: 1, unit: 'LS', builderCost: -8500, markup: 0, clientPrice: -8500 },
];

// "Existing progress invoice" choices — the OpenBook draw already being
// built plus any other progress invoice that hasn't gone out to the client
// yet (once it's Sent, it's no longer a fit for tacking on a new CO).
// OpenBook isn't a separate target; it's just the first entry in this list.
const OPENBOOK_INVOICE_NUMBER = 'openbook';
const progressInvoiceOptions = [
  { invoiceNumber: OPENBOOK_INVOICE_NUMBER, title: 'Progress invoice 2', status: 'current draw' },
  ...EXISTING_INVOICES.filter(inv => inv.type === 'progress' && inv.status !== 'Sent').map(inv => ({ invoiceNumber: inv.invoiceNumber, title: inv.title, status: inv.status })),
];

// Same idea, but for regular (non-progress) invoices that are still unsent.
const existingInvoiceOptions = EXISTING_INVOICES
  .filter(inv => inv.type !== 'progress' && inv.status !== 'Sent')
  .map(inv => ({ invoiceNumber: inv.invoiceNumber, title: inv.title, status: inv.status }));

const allExistingInvoiceOptions = [...progressInvoiceOptions, ...existingInvoiceOptions];

function formatInvoiceOption(inv: { invoiceNumber: string; title: string; status: string }) {
  return inv.invoiceNumber === OPENBOOK_INVOICE_NUMBER ? inv.title : `${inv.invoiceNumber} — ${inv.title}`;
}

const SHOW_EXISTING_INVOICE_OPTION = true;

export default function ChangeOrderPage({ onBack, onApprove, overages, coId }: Props) {
  const [mode, setMode] = useState<'flatFee' | 'lineItems'>('lineItems');
  const [notesTab, setNotesTab] = useState<'internal' | 'subvendor' | 'client'>('internal');
  const [status, setStatus] = useState<'draft' | 'approved'>('draft');
  const [toast, setToast] = useState<string | null>(null);
  const [invoiceUponApproval, setInvoiceUponApproval] = useState(false);
  const [targetKind, setTargetKind] = useState<'new' | 'new-progress' | 'existing'>('existing');
  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState(OPENBOOK_INVOICE_NUMBER);
  const [existingInvoiceMenuOpen, setExistingInvoiceMenuOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleApprove = () => {
    setStatus('approved');

    let invoiceTarget: COInvoiceTarget | undefined;
    let toastMsg = 'Change order approved';
    if (invoiceUponApproval) {
      if (targetKind === 'new') {
        invoiceTarget = { type: 'new', invoiceType: 'invoice' };
        toastMsg = 'Change order approved — added to a new invoice';
      } else if (targetKind === 'new-progress') {
        invoiceTarget = { type: 'new', invoiceType: 'progress' };
        toastMsg = 'Change order approved — added to a new progress invoice';
      } else if (targetKind === 'existing' && existingInvoiceNumber) {
        if (existingInvoiceNumber === OPENBOOK_INVOICE_NUMBER) {
          invoiceTarget = { type: 'openbook' };
          toastMsg = 'Change order approved — added to Progress invoice 2';
        } else {
          invoiceTarget = { type: 'existing', invoiceNumber: existingInvoiceNumber };
          const inv = allExistingInvoiceOptions.find(i => i.invoiceNumber === existingInvoiceNumber);
          toastMsg = `Change order approved — added to ${inv ? formatInvoiceOption(inv) : existingInvoiceNumber}`;
        }
      }
    }
    setToast(toastMsg);

    const coLineItems: LineItem[] = lineItems.map(item => ({
      id: `co-${coId ?? '1'}-${item.id}`,
      description: item.description,
      costCode: item.description.match(/^\d{3,4}/)?.[0] ?? '',
      costType: item.costType,
      unitCost: item.unitCost,
      quantity: item.quantity,
      unit: item.unit,
      markup: item.markup,
    }));

    onApprove?.(invoiceTarget, coLineItems, coTitle);
  };

  // Determine which CO to show
  const isCO3 = coId === 'co-3';
  const coTitle = isCO3 ? 'Change Order CO-0003' : coId === 'co-2' ? 'Change Order CO-0002' : 'Change Order CO-0001';

  // Line item data
  const lineItems = isCO3
    ? CO3_LINE_ITEMS
    : (overages && overages.length > 0)
      ? overages.map((o, i) => ({
          id: String(i + 1),
          description: COST_CODE_LABELS[o.costCode] || o.label,
          costType: 'Materials',
          unitCost: o.overage,
          quantity: 1,
          unit: 'LS',
          builderCost: o.overage,
          markup: 0,
          clientPrice: o.overage,
        }))
      : [
          { id: '1', description: '4100 – Stone masonry', costType: 'Materials', unitCost: 13600, quantity: 1, unit: 'LS', builderCost: 13600, markup: 0, clientPrice: 13600 },
          { id: '2', description: '6100 – Rough carpentry framing', costType: 'Labor', unitCost: 8500, quantity: 1, unit: 'LS', builderCost: 8500, markup: 0, clientPrice: 8500 },
        ];

  const subtotal = lineItems.reduce((s, i) => s + i.clientPrice, 0);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f1f5f9', minHeight: '100%' }}>
      {/* Breadcrumb bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px',
        background: 'white', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#64748b',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          Progress Invoice - OpenBook
        </button>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2.5 1l3 3-3 3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, color: '#334155' }}>Preview</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2.5 1l3 3-3 3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ color: '#94a3b8' }}>change-order/1790345092024</span>
      </div>

      {/* Main content card */}
      <div style={{ maxWidth: 960, margin: '24px auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{coTitle}</h1>
                <span style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 500,
                  background: status === 'approved' ? '#dcfce7' : '#f1f5f9',
                  color: status === 'approved' ? '#15803d' : '#64748b',
                }}>{status === 'approved' ? 'Approved' : 'Draft'}</span>
              </div>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5l-4 3.5 4 3.5" stroke="#0065db" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Cancel</button>
              <button style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Save</button>
              <button
                onClick={handleApprove}
                disabled={status === 'approved'}
                style={{
                  padding: '8px 16px', fontSize: 13, border: 'none', borderRadius: 6,
                  background: status === 'approved' ? '#15803d' : '#0065db',
                  color: 'white', cursor: status === 'approved' ? 'default' : 'pointer',
                  fontWeight: 600, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {status === 'approved' && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7.5l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {status === 'approved' ? 'Approved' : 'Approve'}
              </button>
              <button style={{ padding: '8px 16px', fontSize: 13, border: 'none', borderRadius: 6, background: '#0065db', color: 'white', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 2L7.5 9 2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Send
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16, borderBottom: '2px solid #e2e8f0', marginBottom: -20, marginLeft: -28, marginRight: -28, paddingLeft: 28 }}>
            <button style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#0065db', borderBottom: '2px solid #0065db', background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: '#0065db', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2 }}>Details</button>
            <button style={{ padding: '10px 16px', fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2 }}>Client preview</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Required client approvals */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Required client approvals</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              All clients you select will be required to sign this Change Order in order for it to be marked approved.
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Required Approval</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp} defaultValue="Change order #1" />
              </div>
              <div style={{ width: 80 }}>
                <label style={lbl}>ID#</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input style={{ ...inp, width: 50 }} defaultValue="001" />
                  <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: 11, color: '#64748b' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/><path d="M6 4v2.5M6 8.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Approval Deadline *</label>
                <input type="date" style={inp} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Payment</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--g800)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={invoiceUponApproval}
                onChange={(e) => setInvoiceUponApproval(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#0065db' }}
              />
              Invoice client upon approval
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--g400)' }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M7 5v2.5M7 9.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </label>

            {invoiceUponApproval && (
              <div style={{ marginTop: 12, marginLeft: 22, maxWidth: 360, background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', letterSpacing: 0.4, marginBottom: 8 }}>Add to</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {SHOW_EXISTING_INVOICE_OPTION && (
                    <div
                      onClick={() => setTargetKind('existing')}
                      style={targetKind === 'existing' ? optionRowSelected : optionRow}
                    >
                      <label style={optionLabel(targetKind === 'existing')}>
                        <input type="radio" name="co-invoice-target" checked={targetKind === 'existing'} onChange={() => setTargetKind('existing')} style={radioInput} />
                        Existing invoice
                      </label>
                      {targetKind === 'existing' && (
                        <div style={{ position: 'relative', marginTop: 8, marginLeft: 22, width: 280 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="fi"
                            onClick={() => setExistingInvoiceMenuOpen(o => !o)}
                            aria-expanded={existingInvoiceMenuOpen}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                          >
                            <span>{formatInvoiceOption(allExistingInvoiceOptions.find(i => i.invoiceNumber === existingInvoiceNumber)!)}</span>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: existingInvoiceMenuOpen ? 'rotate(180deg)' : 'none' }}><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          {existingInvoiceMenuOpen && (
                            <>
                              <div className="sp-menu-backdrop" onClick={() => setExistingInvoiceMenuOpen(false)} />
                              <div className="sp-mass-action-dropdown" style={{ position: 'absolute', bottom: 'auto', top: 'calc(100% + 4px)', left: 0, right: 'auto', width: '100%', minWidth: 'auto', maxHeight: 240, overflowY: 'auto' }}>
                                <div className="sp-menu-group-label">Progress invoice</div>
                                {progressInvoiceOptions.map(inv => (
                                  <button
                                    key={inv.invoiceNumber}
                                    type="button"
                                    className="sp-mass-action-dropdown-item"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                                    onClick={() => { setExistingInvoiceNumber(inv.invoiceNumber); setExistingInvoiceMenuOpen(false); }}
                                  >
                                    <span>{formatInvoiceOption(inv)}</span>
                                    {inv.invoiceNumber === existingInvoiceNumber && <span>✓</span>}
                                  </button>
                                ))}
                                {existingInvoiceOptions.length > 0 && (
                                  <div>
                                    <div className="sp-menu-group-label">Invoice</div>
                                    {existingInvoiceOptions.map(inv => (
                                      <button
                                        key={inv.invoiceNumber}
                                        type="button"
                                        className="sp-mass-action-dropdown-item"
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                                        onClick={() => { setExistingInvoiceNumber(inv.invoiceNumber); setExistingInvoiceMenuOpen(false); }}
                                      >
                                        <span>{formatInvoiceOption(inv)}</span>
                                        {inv.invoiceNumber === existingInvoiceNumber && <span>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div onClick={() => setTargetKind('new-progress')} style={targetKind === 'new-progress' ? optionRowSelected : optionRow}>
                    <label style={optionLabel(targetKind === 'new-progress')}>
                      <input type="radio" name="co-invoice-target" checked={targetKind === 'new-progress'} onChange={() => setTargetKind('new-progress')} style={radioInput} />
                      New progress invoice
                    </label>
                  </div>

                  <div onClick={() => setTargetKind('new')} style={targetKind === 'new' ? optionRowSelected : optionRow}>
                    <label style={optionLabel(targetKind === 'new')}>
                      <input type="radio" name="co-invoice-target" checked={targetKind === 'new'} onChange={() => setTargetKind('new')} style={radioInput} />
                      New invoice
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price Information */}
          <div style={{ marginBottom: 28, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Price Information</div>

            {/* Taxes */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Taxes</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <select style={{ ...inp, width: 120 }}>
                <option>No Tax</option>
              </select>
              <span style={{ color: '#64748b', fontSize: 13 }}>·</span>
              <button style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Manage taxes</button>
            </div>

            {/* Flat Fee / Line Items toggle */}
            <div style={{ display: 'inline-flex', marginBottom: 16, border: '1px solid #B1B4B5', borderRadius: 5, overflow: 'hidden' }}>
              <button
                onClick={() => setMode('flatFee')}
                style={{
                  padding: '7px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  border: mode === 'flatFee' ? '1px solid #0763FB' : '1px solid transparent',
                  borderRadius: mode === 'flatFee' ? 4 : 0,
                  background: 'white',
                  color: mode === 'flatFee' ? '#004FD6' : '#26292E',
                  fontWeight: mode === 'flatFee' ? 500 : 400,
                  margin: mode === 'flatFee' ? -1 : 0,
                  position: 'relative', zIndex: mode === 'flatFee' ? 1 : 0,
                }}
              >
                Flat Fee
              </button>
              <div style={{ width: 1, background: '#B1B4B5', alignSelf: 'stretch' }} />
              <button
                onClick={() => setMode('lineItems')}
                style={{
                  padding: '7px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  border: mode === 'lineItems' ? '1px solid #0763FB' : '1px solid transparent',
                  borderRadius: mode === 'lineItems' ? 4 : 0,
                  background: 'white',
                  color: mode === 'lineItems' ? '#004FD6' : '#26292E',
                  fontWeight: mode === 'lineItems' ? 500 : 400,
                  margin: mode === 'lineItems' ? -1 : 0,
                  position: 'relative', zIndex: mode === 'lineItems' ? 1 : 0,
                }}
              >
                Line Items ({lineItems.length})
              </button>
            </div>

            {/* Add From Existing */}
            <div style={{ marginBottom: 12 }}>
              <button style={{ fontSize: 13, color: '#0065db', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                Add From Existing
              </button>
            </div>

            {/* Line items table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={th}></th>
                    <th style={th}>Cost Type</th>
                    <th style={th}>Unit Cost</th>
                    <th style={th}>Quantity</th>
                    <th style={th}>Unit</th>
                    <th style={{ ...th, textAlign: 'right' }}>Builder Cost</th>
                    <th style={{ ...th, textAlign: 'right' }}>Markup</th>
                    <th style={{ ...th, textAlign: 'right' }}>Client Price</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => {
                    const fmtAmt = (v: number) => v < 0 ? `-$${fmt(Math.abs(v))}` : `$${fmt(v)}`;
                    return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</div>
                      </td>
                      <td style={td}>{item.costType}</td>
                      <td style={td}>{item.unitCost < 0 ? `(${Math.abs(item.unitCost).toLocaleString()})` : item.unitCost.toLocaleString()}</td>
                      <td style={td}>{item.quantity}</td>
                      <td style={td}>{item.unit}</td>
                      <td style={{ ...td, textAlign: 'right', color: item.builderCost < 0 ? '#dc2626' : undefined }}>{fmtAmt(item.builderCost)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>${fmt(item.markup)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: item.clientPrice < 0 ? '#dc2626' : undefined }}>{fmtAmt(item.clientPrice)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* + Item */}
            <button style={{ fontSize: 13, color: '#0065db', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0065db', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>+</span>
              Item
            </button>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #e2e8f0', marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#0f172a', padding: '4px 0' }}>
                <span>Totals</span>
                <div style={{ display: 'flex', gap: 40 }}>
                  <span>${fmt(subtotal)}</span>
                  <span>$0.00</span>
                  <span>${fmt(subtotal)}</span>
                </div>
              </div>
            </div>

            {/* Subtotal / Tax / Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                  <span>Subtotal</span><span style={{ fontWeight: 500, color: '#0f172a' }}>${fmt(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                  <span>Tax</span><span style={{ fontWeight: 500, color: '#0f172a' }}>$0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '6px 0', borderTop: '2px solid #0f172a', marginTop: 4, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                  <span>Total Price</span><span>${fmt(subtotal)}</span>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', marginTop: 2 }}>
                  See full price breakdown
                </button>
              </div>
            </div>
          </div>

          {/* Introduction Text */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Introduction Text</div>
            <textarea style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' }} />
          </div>

          {/* Closing Text */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Closing Text</div>
            <textarea style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' }} />
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Attachments</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Add</button>
              <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Create new doc</button>
            </div>
          </div>

          {/* Sub/Vendors */}
          <div style={{ marginBottom: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Sub/Vendors
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#94a3b8' }}>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M7 5v2.5M7 9.5v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Notes */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Notes</div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 12 }}>
              {([['internal', 'Internal notes'], ['subvendor', 'Sub/Vendor notes'], ['client', 'Client notes']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setNotesTab(key)}
                  style={{
                    padding: '8px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                    background: 'none', border: 'none',
                    color: notesTab === key ? '#0065db' : '#64748b',
                    fontWeight: notesTab === key ? 600 : 400,
                    borderBottom: notesTab === key ? '2px solid #0065db' : '2px solid transparent',
                    marginBottom: -2,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Notes</div>
            <textarea style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' }} />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#15803d', color: 'white', padding: '12px 24px', borderRadius: 8,
          fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 2000,
          animation: 'fadeIn 0.2s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="8" fill="white" fillOpacity="0.2"/>
            <path d="M5.5 9.5l2 2 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4 };
const radioInput: React.CSSProperties = { width: 14, height: 14, accentColor: '#0065db' };
const inp: React.CSSProperties = { padding: '7px 10px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const optionRow: React.CSSProperties = { border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '10px 12px', cursor: 'pointer', background: 'white' };
const optionRowSelected: React.CSSProperties = { ...optionRow, border: '1.5px solid var(--bt-blue)', background: 'var(--bt-blue-light)' };
const optionLabel = (selected: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: selected ? 'var(--g800)' : 'var(--g700)', cursor: 'pointer' });
const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 500, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: '#334155' };
