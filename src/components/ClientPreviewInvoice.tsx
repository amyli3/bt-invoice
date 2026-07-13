import { useState } from 'react';
import { fmt } from '../utils';

/**
 * ClientPreviewInvoice — a redesigned "Invoice (Client preview)" screen.
 *
 * This is the view a builder sees before releasing an invoice to the client:
 * a live preview of the emailed/portal invoice plus an edit-options panel that
 * controls what the client will actually see. Reached via
 * Financial ▸ "Client preview invoice" (#client-preview-invoice).
 *
 * Visual language borrowed from the JPS print page (.jps-print-*): gray canvas,
 * a controls card stacked above a document "paper", a solid dark logo mark with
 * a right-aligned company block, a title + summary row, gray-headed tables, and
 * a right-aligned totals block.
 */

interface PreviewLine {
  id: string;
  item: string;
  costCode: string;
  qty: number;
  unitCost: number | null;
  markup: number | null;
  price: number;
  taxable: boolean;
}

const LINES: PreviewLine[] = [
  { id: 'l1', item: '44', costCode: '1010 - Building permits', qty: 0.01, unitCost: 443, markup: null, price: 4.43, taxable: true },
  { id: 'l2', item: 'Allowance on estimate?', costCode: '1030 - Warranty fees', qty: 0.01, unitCost: 888, markup: 1.78, price: 10.66, taxable: true },
  { id: 'l3', item: 'Selection 1', costCode: '1030 - Warranty fees', qty: 0.01, unitCost: 444, markup: null, price: 4.44, taxable: true },
  { id: 'l4', item: 'Selection on estimate?', costCode: 'Blueprint', qty: 0.01, unitCost: 555, markup: null, price: 5.55, taxable: true },
  { id: 'l5', item: 'CO line 1', costCode: '3300 - Windows', qty: 0.02, unitCost: 500, markup: 3, price: 13, taxable: true },
  { id: 'l6', item: 'CO line 2', costCode: '3350 - Skylights', qty: 0.02, unitCost: 4000, markup: 32, price: 112, taxable: true },
  { id: 'l7', item: 'CO line 3', costCode: '5540 - Carpet', qty: 0.02, unitCost: 405, markup: 40.5, price: 48.6, taxable: true },
  { id: 'l8', item: 'Buildertrend Flat Rate', costCode: '', qty: 0.02, unitCost: null, markup: 100, price: 100, taxable: true },
  { id: 'l9', item: 'Buildertrend Flat Rate', costCode: '', qty: 0.02, unitCost: null, markup: 20, price: 20, taxable: true },
  { id: 'l10', item: 'Buildertrend Flat Rate', costCode: '', qty: 0.02, unitCost: null, markup: 100, price: 100, taxable: true },
  { id: 'l11', item: 'Buildertrend Flat Rate', costCode: '', qty: 0.02, unitCost: null, markup: 10, price: 10, taxable: true },
];

// Job contacts — an invoice's job can have several people attached, but the
// builder may want only the billable party to appear on the client-facing
// invoice. This drives the "Bill to" selector in the edit panel.
interface Contact {
  id: string;
  name: string;
  role: string;
  account: string;
  email: string;
  phone: string;
}

const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Delanie Walker', role: 'Owner', account: '12345', email: 'home.owner@buildertrend.com', phone: '(202) 555-0134' },
  { id: 'c2', name: 'Marcus Walker', role: 'Co-owner', account: '12345', email: 'marcus.walker@email.com', phone: '(202) 555-0188' },
  { id: 'c3', name: 'Rebecca Chen', role: 'Property manager', account: 'PM-908', email: 'rchen@havenpm.com', phone: '(202) 555-0210' },
  { id: 'c4', name: 'Haven Property Mgmt', role: 'Billing company', account: 'PM-908', email: 'billing@havenpm.com', phone: '(202) 555-0200' },
];

type ColKey = 'items' | 'tax' | 'unitCost' | 'quantity' | 'clientPrice' | 'markup';

const COL_LABELS: Record<ColKey, string> = {
  items: 'Items',
  tax: 'Tax',
  unitCost: 'Unit cost',
  quantity: 'Quantity',
  clientPrice: 'Client price',
  markup: 'Markup amount',
};

// Items + Tax are locked on; the rest are removable chips (matching the screenshot).
const REMOVABLE_COLS: ColKey[] = ['unitCost', 'quantity', 'clientPrice', 'markup'];

export default function ClientPreviewInvoice() {
  const [showEdit, setShowEdit] = useState(false);
  const [hideLineItems, setHideLineItems] = useState(false);
  const [combineByCostCode, setCombineByCostCode] = useState(false);
  const [cols, setCols] = useState<ColKey[]>(['items', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup']);
  const [qrCode, setQrCode] = useState(false);
  const [customFields, setCustomFields] = useState(true);
  // Two free-text messages the builder can place on the invoice: an intro
  // (invoice context, renders above the line items) and a closing (payment
  // notes, renders below the totals — restoring the pre-update bottom layout).
  const [introText, setIntroText] = useState(true);
  const [closingText, setClosingText] = useState(true);
  const [billToId, setBillToId] = useState<string>('c1');

  const billTo = CONTACTS.find(c => c.id === billToId) || CONTACTS[0];

  const removeCol = (k: ColKey) => setCols(prev => prev.filter(c => c !== k));
  const has = (k: ColKey) => cols.includes(k);

  // Which document columns to render, in table order.
  const showUnitCost = has('unitCost');
  const showQty = has('quantity');
  const showMarkup = has('markup');
  const showPrice = has('clientPrice');
  const showTax = has('tax');

  const subtotal = LINES.reduce((s, l) => s + l.price, 0);
  const markupTotal = LINES.reduce((s, l) => s + (l.markup || 0), 0);
  // Construction invoices commonly credit a deposit/retainer collected earlier.
  const appliedDeposit = 100;
  const amountDue = subtotal - appliedDeposit;

  const availableToAdd = REMOVABLE_COLS.filter(k => !cols.includes(k));

  return (
    <div className="cpi-shell">
      {/* Modal-style header */}
      <div className="cpi-titlebar">
        <div className="cpi-title">
          Invoice <span className="cpi-title-muted">(Client preview)</span>
          <button className="cpi-icon-link" title="Copy link">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M8 12a3 3 0 004.5.3l2-2A3 3 0 0010 6l-1 1M12 8a3 3 0 00-4.5-.3l-2 2A3 3 0 0010 14l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="cpi-title-actions">
          <button className="cpi-icon-btn" title="Comments">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 5h12v8H8l-4 3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </button>
          <button className="cpi-icon-btn" title="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="cpi-body">
        {/* Settings bar — compact top strip. Bill-to lives here as its own thing,
            separate from the display options which open behind "Customize". */}
        <div className="cpi-intro-card">
          <p className="cpi-intro">
            Below is a preview of the invoice that will be sent as a link to{' '}
            <strong>{billTo.email}</strong> and released to the client site.
          </p>

          <div className="cpi-bar">
            {/* Bill to — its own distinct section */}
            <div className="cpi-bar-billto">
              <label className="cpi-bar-lbl" htmlFor="cpi-billto">
                Bill to
                <span className="cpi-info" title="Choose which of this job's contacts appears on the invoice and receives the link">i</span>
              </label>
              <select id="cpi-billto" className="cpi-select" value={billToId} onChange={e => setBillToId(e.target.value)}>
                {CONTACTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
                ))}
              </select>
            </div>

            <button className={"cpi-customize-btn" + (showEdit ? ' on' : '')} onClick={() => setShowEdit(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Customize display
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" style={{transform: showEdit ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s'}}>
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {showEdit && (
            <div className="cpi-edit">
              <div className="cpi-edit-grid">
                <div className="cpi-edit-col">
                  <div className="cpi-edit-h">
                    Display to client
                    <span className="cpi-info" title="Controls what appears on the client's copy">i</span>
                  </div>

                  <label className="cpi-check">
                    <input type="checkbox" checked={hideLineItems} onChange={e => setHideLineItems(e.target.checked)} />
                    <span>Hide line items</span>
                  </label>
                  <label className="cpi-check">
                    <input type="checkbox" checked={combineByCostCode} onChange={e => setCombineByCostCode(e.target.checked)} />
                    <span>Combine line items by cost code</span>
                  </label>

                  {!hideLineItems && (
                    <>
                      <div className="cpi-chips">
                        <span className="cpi-chip cpi-chip-locked">Items</span>
                        <span className="cpi-chip cpi-chip-locked">Tax</span>
                        {REMOVABLE_COLS.filter(k => cols.includes(k)).map(k => (
                          <span key={k} className="cpi-chip">
                            {COL_LABELS[k]}
                            <button className="cpi-chip-x" onClick={() => removeCol(k)} title={`Remove ${COL_LABELS[k]}`}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="cpi-addrow">
                        <select
                          className="cpi-addrow-select"
                          value=""
                          disabled={availableToAdd.length === 0}
                          onChange={e => { if (e.target.value) setCols(prev => [...prev, e.target.value as ColKey]); }}
                        >
                          <option value="">
                            {availableToAdd.length === 0 ? 'All columns added' : 'Add a column…'}
                          </option>
                          {availableToAdd.map(k => <option key={k} value={k}>{COL_LABELS[k]}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="cpi-edit-col cpi-edit-col-right">
                  <div className="cpi-edit-h">General information</div>
                  <label className="cpi-check">
                    <input type="checkbox" checked={qrCode} onChange={e => setQrCode(e.target.checked)} />
                    <span>QR code <span className="cpi-info" title="Adds a scannable pay link">i</span></span>
                  </label>
                  <label className="cpi-check">
                    <input type="checkbox" checked={customFields} onChange={e => setCustomFields(e.target.checked)} />
                    <span>Custom fields</span>
                  </label>
                  <label className="cpi-check">
                    <input type="checkbox" checked={introText} onChange={e => setIntroText(e.target.checked)} />
                    <span>Introduction text</span>
                  </label>
                  <label className="cpi-check">
                    <input type="checkbox" checked={closingText} onChange={e => setClosingText(e.target.checked)} />
                    <span>Closing text</span>
                  </label>
                </div>
              </div>

              <div className="cpi-edit-actions">
                <button className="btn btn-s">Reset</button>
                <button className="btn btn-s" disabled>Set as default</button>
                <button className="btn btn-p" onClick={() => setShowEdit(false)}>Done</button>
              </div>
            </div>
          )}
        </div>

        {/* The invoice document */}
        <div className="cpi-paper">
          <div className="cpi-paper-header">
            <div className="cpi-logo">
              <div className="cpi-logo-mark">B</div>
              <div>
                <div className="cpi-logo-name">Boogie Construction</div>
                <div className="cpi-logo-tag">Design build great homes</div>
              </div>
            </div>
            <div className="cpi-company">
              Boogie Construction<br />
              3700 Georgia Ave NW<br />
              Washington, DC 20010-1619<br />
              Phone: (202) 987u57854
            </div>
          </div>

          <div className="cpi-doc-eyebrow">Amy BWF job</div>
          <h2 className="cpi-doc-title">Invoice</h2>
          <div className="cpi-summary-row">
            <div className="cpi-billto">
              <div className="cpi-lbl">Bill to</div>
              <div className="cpi-bill-name">{billTo.name}</div>
              <div className="cpi-bill-sub">{billTo.role} · Acct {billTo.account}</div>
              <div className="cpi-bill-sub">{billTo.email}</div>
              <div className="cpi-bill-sub">{billTo.phone}</div>
            </div>
            <div className="cpi-summary-values">
              <div><span>Invoice date:</span><strong>Jun 16, 2026</strong></div>
              <div><span>Invoice ID:</span><strong>Li-0111</strong></div>
              <div><span>Due date:</span><strong>Jul 16, 2026</strong></div>
              <div className="cpi-summary-due"><span>Amount due:</span><strong>${fmt(amountDue)}</strong></div>
            </div>
          </div>

          <div className="cpi-jobrow">
            <div><strong>Job:</strong> Amy BWF job</div>
            <div><strong>Invoice:</strong> Draw 1</div>
          </div>

          {introText && (
            <section className="cpi-section">
              <h3 className="cpi-section-title">Introduction text</h3>
              <div className="cpi-block-body">
                Invoice for work completed on the second-floor master suite remodel through May 2026.
                Covers framing, window and skylight installation, and carpet for the primary bedroom,
                plus approved change orders CO-1 through CO-3.
              </div>
            </section>
          )}

          {!hideLineItems ? (
            <section className="cpi-section">
              <div className="cpi-tbl-wrap">
                <table className="cpi-tbl">
                  <thead>
                    <tr>
                      <th>Items</th>
                      {showQty && <th>Qty/Unit</th>}
                      {showUnitCost && <th className="cpi-r">Unit cost</th>}
                      {showMarkup && <th className="cpi-r">Markup amount</th>}
                      {showPrice && <th className="cpi-r">Price</th>}
                      {showTax && <th className="cpi-r">Taxable</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {LINES.map(l => (
                      <tr key={l.id}>
                        <td>
                          <div className="cpi-item-name">{l.item}</div>
                          {l.costCode && <div className="cpi-item-code">{l.costCode}</div>}
                        </td>
                        {showQty && <td>{l.qty.toFixed(2)}</td>}
                        {showUnitCost && <td className="cpi-r">{l.unitCost != null ? `$${fmt(l.unitCost)}` : ''}</td>}
                        {showMarkup && <td className="cpi-r">{l.markup != null ? `$${fmt(l.markup)}` : ''}</td>}
                        {showPrice && <td className="cpi-r cpi-strong">${fmt(l.price)}</td>}
                        {showTax && <td className="cpi-r">{l.taxable ? 'Taxable' : ''}</td>}
                      </tr>
                    ))}
                    <tr className="cpi-total-row">
                      <td>Totals:</td>
                      {showQty && <td></td>}
                      {showUnitCost && <td></td>}
                      {showMarkup && <td className="cpi-r">${fmt(markupTotal)}</td>}
                      {showPrice && <td className="cpi-r">${fmt(subtotal)}</td>}
                      {showTax && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <div className="cpi-hidden-note">Line item detail is hidden from the client for this invoice.</div>
          )}

          <div className="cpi-totals">
            <div className="cpi-totals-line"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            <div className="cpi-totals-line cpi-totals-muted"><span>Tax Agency Not Found: 0% tax on ${fmt(subtotal)}</span><span>$0.00</span></div>
            <div className="cpi-totals-line"><span>Total tax</span><span>$0.00</span></div>
            <div className="cpi-totals-line"><span>Total price</span><span>${fmt(subtotal)}</span></div>
            <div className="cpi-totals-line"><span>Applied deposit</span><span>-${fmt(appliedDeposit)}</span></div>
            <div className="cpi-totals-line cpi-totals-heading"><span>Amount due</span><strong>${fmt(amountDue)}</strong></div>
          </div>

          {closingText && (
            <section className="cpi-section">
              <h3 className="cpi-section-title">Closing text</h3>
              <div className="cpi-block-body">
                Payment is due within 30 days of the invoice date. Please reference invoice Li-0111
                with your payment. We accept check, ACH transfer, or online payment through the link
                above. Thank you for your business.
              </div>
            </section>
          )}

          {customFields && (
            <section className="cpi-section">
              <h3 className="cpi-section-title">Custom fields</h3>
              <div className="cpi-block-body"><strong>Invoice attachment:</strong> N/A</div>
            </section>
          )}

          {/* Buildertrend Payments footer — QR + pay-code line, tied to the QR toggle */}
          <div className="cpi-pay-footer">
            {qrCode && (
              <div className="cpi-qr" title="Scan to pay">
                <svg width="72" height="72" viewBox="0 0 70 70">
                  <rect width="70" height="70" fill="white"/>
                  <g fill="#0b1f3a">
                    <rect x="4" y="4" width="18" height="18"/><rect x="8" y="8" width="10" height="10" fill="white"/><rect x="11" y="11" width="4" height="4"/>
                    <rect x="48" y="4" width="18" height="18"/><rect x="52" y="8" width="10" height="10" fill="white"/><rect x="55" y="11" width="4" height="4"/>
                    <rect x="4" y="48" width="18" height="18"/><rect x="8" y="52" width="10" height="10" fill="white"/><rect x="11" y="55" width="4" height="4"/>
                    <rect x="28" y="4" width="4" height="4"/><rect x="36" y="8" width="4" height="4"/><rect x="28" y="14" width="4" height="4"/>
                    <rect x="28" y="28" width="4" height="4"/><rect x="36" y="32" width="4" height="4"/><rect x="44" y="28" width="4" height="4"/>
                    <rect x="52" y="36" width="4" height="4"/><rect x="60" y="44" width="4" height="4"/><rect x="28" y="52" width="4" height="4"/>
                    <rect x="36" y="60" width="4" height="4"/><rect x="44" y="52" width="4" height="4"/><rect x="52" y="60" width="4" height="4"/>
                  </g>
                </svg>
              </div>
            )}
            <div className="cpi-pay-text">
              <div className="cpi-pay-brand">
                <span className="cpi-pay-mark">b</span>
                <strong>Buildertrend</strong> <span className="cpi-pay-sub">Payments</span>
              </div>
              <div className="cpi-pay-line">
                To make an online payment on this invoice, visit <strong>buildertrend.net/pay</strong> and enter
                code <strong>4JVW DGMT</strong> and invoice amount <strong>${fmt(amountDue)}</strong>
                {qrCode ? ' or use your mobile device to scan the QR code.' : '.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cpi-footer">
        <button className="btn btn-s">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 8V4h8v4M6 15H4v-4h12v4h-2M6 12h8v4H6v-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          Print
        </button>
        <button className="btn btn-p" onClick={() => alert(`Invoice Li-0111 sent to ${billTo.name} (${billTo.email})`)}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M17 3L9 11M17 3l-5 14-3-6-6-3 14-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Send invoice
        </button>
      </div>
    </div>
  );
}
