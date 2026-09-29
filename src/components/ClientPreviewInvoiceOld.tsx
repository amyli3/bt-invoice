import { useState, useRef, useEffect } from 'react';
import { fmt } from '../utils';
import { useReviewSettings } from '../reviewSettings';

/**
 * ClientPreviewInvoiceOld — the PRE-REDESIGN "Invoice (Client preview)" screen,
 * kept as its own route (#client-preview-invoice-old) purely for comparison
 * against the current one.
 *
 * Copied verbatim from bt-invoice-reimagine commit 7bd28b6. Do not evolve it:
 * its whole value is being the version stakeholders saw before the customize
 * rail replaced this stacked settings card, so changes belong in
 * ClientPreviewInvoice.tsx instead. The CSS it needs lives in a clearly
 * marked block at the foot of index.css and is used by nothing else.
 *
 * What it shows that the current screen no longer does: settings in a
 * two-column card above the document rather than a docked rail beside it,
 * "Combine line items by cost code" as a single checkbox rather than a
 * three-way grouping control, Tax locked on as a column, an "Add a column"
 * dropdown rather than inline add chips, and a single Description toggle in
 * place of Introduction/Closing text.
 *
 * Original header follows.
 *
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
  /* Present only on lines that came from an approved change order. A change
     order was signed off as a priced scope of work, so its lines can be shown
     under its title, or collapsed into it entirely. */
  coId?: string;
  coTitle?: string;
}

/* The job's tax agencies. Real invoices stack a state rate and a local one on
   the same taxable base, and the price breakdown lists each separately under
   Total tax, which is exactly why that block needs two levels. */
const TAX_AGENCIES: { name: string; rate: number }[] = [
  { name: 'Nebraska State', rate: 0.055 },
  { name: 'Nebraska, Omaha City', rate: 0.015 },
];

const LINES: PreviewLine[] = [
  { id: 'l1', item: '44', costCode: '1010 - Building permits', qty: 0.01, unitCost: 443, markup: null, price: 4.43, taxable: false },
  { id: 'l2', item: 'Allowance on estimate?', costCode: '1030 - Warranty fees', qty: 0.01, unitCost: 888, markup: 1.78, price: 10.66, taxable: true },
  { id: 'l3', item: 'Selection 1', costCode: '1030 - Warranty fees', qty: 0.01, unitCost: 444, markup: null, price: 4.44, taxable: true },
  { id: 'l4', item: 'Selection on estimate?', costCode: 'Blueprint', qty: 0.01, unitCost: 555, markup: null, price: 5.55, taxable: false },
  { id: 'l5', item: 'CO line 1', costCode: '3300 - Windows', qty: 0.02, unitCost: 500, markup: 3, price: 13, taxable: true, coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l6', item: 'CO line 2', costCode: '3350 - Skylights', qty: 0.02, unitCost: 4000, markup: 32, price: 112, taxable: true, coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l7', item: 'CO line 3', costCode: '5540 - Carpet', qty: 0.02, unitCost: 405, markup: 40.5, price: 48.6, taxable: true, coId: 'co2', coTitle: 'CO-2: Carpet upgrade' },
  /* Flat-rate lines: a cost with a markup on top, rather than pure markup.
     Priced as cost + markup so the builder-cost and fee rows in the price
     breakdown split the way a real cost-plus invoice would. */
  { id: 'l8', item: 'Buildertrend Flat Rate', costCode: '', qty: 1, unitCost: 500, markup: 100, price: 600, taxable: true },
  { id: 'l9', item: 'Buildertrend Flat Rate', costCode: '', qty: 1, unitCost: 100, markup: 20, price: 120, taxable: true },
  { id: 'l10', item: 'Buildertrend Flat Rate', costCode: '', qty: 1, unitCost: 500, markup: 100, price: 600, taxable: true },
  { id: 'l11', item: 'Buildertrend Flat Rate', costCode: '', qty: 1, unitCost: 50, markup: 10, price: 60, taxable: true },
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

/* The full column set this presentation offered. The last six carry no
   column in the document table below - they were in the picker before the
   table caught up, which is part of what this snapshot records. */
type ColKey = 'items' | 'tax' | 'unitCost' | 'quantity' | 'clientPrice' | 'markup'
  | 'costType' | 'markedAs' | 'description' | 'unitPrice' | 'builderCost' | 'markupPct';

const COL_LABELS: Record<ColKey, string> = {
  items: 'Items',
  tax: 'Tax',
  unitCost: 'Unit cost',
  quantity: 'Quantity',
  clientPrice: 'Client price',
  markup: 'Markup amount',
  costType: 'Cost type',
  markedAs: 'Marked as',
  description: 'Description',
  unitPrice: 'Unit price',
  builderCost: 'Builder cost',
  markupPct: 'Markup',
};

/* Only Items is locked: a line with no description isn't a line. Everything
   else, Tax included, is a removable chip. */
const REMOVABLE_COLS: ColKey[] = ['tax', 'unitCost', 'quantity', 'clientPrice', 'markup',
  'costType', 'markedAs', 'description', 'unitPrice', 'builderCost', 'markupPct'];

/* The checklist has its own order, which is not the chip order: chips read
   left to right in the order the columns appear on the document, while the
   list groups the descriptive columns before the money ones. Kept as its own
   array so neither can quietly reorder the other. */
const PICKER_ORDER: ColKey[] = ['items', 'costType', 'markedAs', 'description', 'unitPrice',
  'quantity', 'builderCost', 'clientPrice', 'unitCost', 'markup', 'markupPct', 'tax'];

export default function ClientPreviewInvoiceOld() {
  /* Open on arrival. This route exists to show the settings themselves, so
     starting collapsed hides the very thing it is here to demonstrate. */
  const [showEdit, setShowEdit] = useState(true);
  const [hideLineItems, setHideLineItems] = useState(false);
  const [combineByCostCode, setCombineByCostCode] = useState(false);
  /* Hiding the cost code and grouping by it are mutually exclusive: grouping
     by a code the client cannot see produces unlabelled groups. Each one
     disables the other rather than silently overriding it, so the builder can
     see why the option is unavailable and which choice is blocking it. */
  const [hideCostCode, setHideCostCode] = useState(false);
  /* A change order always names itself on the invoice: it was approved as a
     titled scope of work, and an untitled block of its lines tells the client
     nothing about what they agreed to. So the only question is whether to
     list what is inside it, or collapse to the title and its approved total. */
  const [hideCoLines, setHideCoLines] = useState(false);
  /* Two ways to place change orders on the document, kept side by side so the
     difference can be reviewed rather than argued about:

     "inline"   - the change order is a titled block inside the one line-item
                  grid, so the client reads a single column of prices down to
                  a single total.
     "ownGrid"  - the change orders are lifted into a second grid below the
                  first, with its own header row and its own total, which is
                  how a client who thinks of the contract and its amendments
                  as two documents might expect to see them.

     Neither changes what is billed; only where it sits. */
  /* Contract type and change-order layout come from the Review pill rather
     than from controls on this page: they are "show me the other version"
     switches for a walkthrough, not settings a builder would ever be given. */
  const { contractType, coLayout } = useReviewSettings();
  /* ADO 291436. On an open book contract the fee IS the contract term, but it
     is buried inside each line's marked-up price, so the client cannot verify
     the arrangement they signed. The story's fix is presentation over data
     that already exists: builder cost, then fee, then subtotal, then tax,
     then total, where the fee is the sum of the markup already stored on the
     lines.

     Open book only. A fixed-price client bought a result at a contract price,
     so there is no cost-plus-fee to state and that invoice must render
     unchanged. The contract switch is here only so both halves of that
     acceptance criterion can be seen on this page. */

  /* Builders do not all call it the same thing: "Builder fee" is Carla's
     builders' word, AJ says "builder's fee", others say management fee or
     overhead and profit. The story makes the label configurable with that
     default; the field to edit it is a builder setting, not a review switch,
     so this prototype shows the default only. */
  const feeLabel = 'Builder fee';
  const [cols, setCols] = useState<ColKey[]>(['items', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup',
    'costType', 'markedAs', 'description', 'unitPrice', 'builderCost', 'markupPct']);
  /* "Check All" reflects the removable columns only, since Items can never be
     unchecked and would otherwise pin the box to checked forever. */
  const allColsOn = REMOVABLE_COLS.every(k => cols.includes(k));
  const toggleAllCols = () => setCols(allColsOn ? ['items'] : ['items', ...REMOVABLE_COLS]);
  const [qrCode, setQrCode] = useState(false);
  const [customFields, setCustomFields] = useState(true);
  const [description, setDescription] = useState(true);
  /* Still needed to render who the document bills, but no longer selectable
     here - the Bill-to picker moved off this card. */
  const [billToId] = useState<string>('c1');
  /* The chip box is itself the control: clicking it opens the checklist of
     every available column, so there is no separate "add a column" row and
     no dead "All columns added" state to explain. */
  const [colsOpen, setColsOpen] = useState(false);
  const colsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!colsOpen) return;
    const handler = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [colsOpen]);

  const billTo = CONTACTS.find(c => c.id === billToId) || CONTACTS[0];

  const removeCol = (k: ColKey) => setCols(prev => prev.filter(c => c !== k));
  const has = (k: ColKey) => cols.includes(k);

  // Which document columns to render, in table order.
  const showUnitCost = has('unitCost');
  const showQty = has('quantity');
  const showMarkup = has('markup');
  const showPrice = has('clientPrice');
  const showTax = has('tax');

  /* Change-order lines group under their own change order; everything else
     stays a flat list, as this presentation always showed it. */
  const plainLines = LINES.filter(l => !l.coId);
  const coGroups = (() => {
    const order: string[] = [];
    const byId: Record<string, { title: string; lines: PreviewLine[] }> = {};
    for (const l of LINES) {
      if (!l.coId) continue;
      if (!byId[l.coId]) { order.push(l.coId); byId[l.coId] = { title: l.coTitle || l.coId, lines: [] }; }
      byId[l.coId].lines.push(l);
    }
    return order.map(id => byId[id]);
  })();

  /* Tax is charged on the client price of the taxable lines only, so each
     agency's figure is its rate against that base rather than the subtotal. */
  const taxableBase = LINES.reduce((sum, l) => sum + (l.taxable ? l.price : 0), 0);
  const agencyTax = TAX_AGENCIES.map(a => ({ ...a, amount: taxableBase * a.rate }));
  const totalTax = agencyTax.reduce((sum, a) => sum + a.amount, 0);

  const plainSubtotal = plainLines.reduce((sum, l) => sum + l.price, 0);
  const plainMarkup = plainLines.reduce((sum, l) => sum + (l.markup || 0), 0);
  const coSubtotal = LINES.reduce((sum, l) => sum + (l.coId ? l.price : 0), 0);
  const coMarkup = LINES.reduce((sum, l) => sum + (l.coId ? (l.markup || 0) : 0), 0);

  const subtotal = LINES.reduce((s, l) => s + l.price, 0);
  const markupTotal = LINES.reduce((s, l) => s + (l.markup || 0), 0);
  /* The fee is the markup already on the lines, and builder cost is what is
     left of the subtotal once it is taken out. Nothing is recalculated, so
     subtotal, tax and total are identical with the rows shown or hidden, and
     the fee row always reconciles to the per-line Markup column. Suppressed
     at zero rather than printing an empty row. */
  const feeTotal = markupTotal;
  const costOfWork = subtotal - feeTotal;
  const showFeeRow = contractType === 'open-book' && feeTotal > 0;

  // Construction invoices commonly credit a deposit/retainer collected earlier.
  const totalPrice = subtotal + totalTax;
  const appliedDeposit = 100;
  const amountDue = totalPrice - appliedDeposit;


  /* Lines sit at the margin whether or not a change-order title heads them:
     the shaded title row already separates the block, and indenting only
     these lines would misalign them against every other line in the table. */
  const renderLine = (l: PreviewLine) => {
    return (
      <tr key={l.id}>
        <td>
          <div className="cpi-item-name">{l.item}</div>
          {!hideCostCode && l.costCode && <div className="cpi-item-code">{l.costCode}</div>}
        </td>
        {showQty && <td>{l.qty.toFixed(2)}</td>}
        {showUnitCost && <td className="cpi-r">{l.unitCost != null ? `$${fmt(l.unitCost)}` : ''}</td>}
        {showMarkup && <td className="cpi-r">{l.markup != null ? `$${fmt(l.markup)}` : ''}</td>}
        {showPrice && <td className="cpi-r cpi-strong">${fmt(l.price)}</td>}
        {/* Whether the line was taxed, not how much: the amounts are stated
            once per agency in the price breakdown, so repeating them per line
            would just invite the client to re-add them. An untaxed line reads
            "--" rather than an unexplained blank. */}
        {showTax && (
          <td className="cpi-r">
            {l.taxable ? 'Taxed' : <span className="cpi-tax-none">--</span>}
          </td>
        )}
      </tr>
    );
  };

  /* A change-order title row carrying its rolled-up price: the one-price-per
     change-order view, whether it heads its lines or replaces them. */
  const renderGroupRow = (title: string, total: number, className: string) => (
    <tr key={`co-${title}`} className={className}>
      <td>{title}</td>
      {showQty && <td></td>}
      {showUnitCost && <td></td>}
      {showMarkup && <td></td>}
      {showPrice && <td className="cpi-r">${fmt(total)}</td>}
      {showTax && <td></td>}
    </tr>
  );

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
          {/* The preamble and the Bill-to picker are gone: recipient is set on
              the invoice itself, and this card is only here to hold the display
              settings. The document below still names who it bills. */}
          {/* The settings own the header: a titled section with a hint affordance
              and a collapse chevron on the right, rather than a gear button that
              hides them behind a click. */}
          <div className="cpi-ds-head cpi-ds-head-first">
            <div className="cpi-ds-title">
              Client display settings
              <span className="cpi-info" title="Controls what appears on the client's copy of this invoice">i</span>
            </div>
            <div className="cpi-ds-head-actions">
              <button className="cpi-icon-btn" title="What the client sees">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>
                </svg>
              </button>
              <button className="cpi-icon-btn" onClick={() => setShowEdit(v => !v)} aria-expanded={showEdit} title={showEdit ? 'Collapse' : 'Expand'}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{transform: showEdit ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s'}}>
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {showEdit && (
            <div className="cpi-edit">
              <div className="cpi-edit-grid">
                <div className="cpi-edit-col">
                  <div className="cpi-edit-h">Line items</div>

                  <label className={"cpi-check" + (hideCostCode ? ' cpi-check-off' : '')}>
                    <input
                      type="checkbox"
                      checked={combineByCostCode}
                      disabled={hideCostCode}
                      onChange={e => setCombineByCostCode(e.target.checked)}
                    />
                    <span title={hideCostCode ? 'Unavailable while the cost code is hidden: the groups would have no visible label' : undefined}>
                      Combine line items by cost code
                    </span>
                  </label>
                  <label className={"cpi-check" + (combineByCostCode ? ' cpi-check-off' : '')}>
                    <input
                      type="checkbox"
                      checked={hideCostCode}
                      disabled={combineByCostCode}
                      onChange={e => setHideCostCode(e.target.checked)}
                    />
                    <span title={combineByCostCode ? 'Unavailable while line items are combined by cost code: the code is the group label' : undefined}>
                      Hide cost code
                    </span>
                  </label>
                  {/* Also a line-item question: it decides whether a change
                      order lists its lines or collapses to its title and
                      approved total. Only offered when the invoice carries
                      one. The title itself is never optional. */}
                  {coGroups.length > 0 && (
                    <label className="cpi-check">
                      <input type="checkbox" checked={hideCoLines} onChange={e => setHideCoLines(e.target.checked)} />
                      <span>Hide change order line items</span>
                    </label>
                  )}
                  {/* Last in the group, nearest the column picker below it:
                      this is the switch that takes the whole table away, so it
                      sits next to the control it overrides rather than above
                      the finer choices it makes moot. */}
                  <label className="cpi-check">
                    <input type="checkbox" checked={hideLineItems} onChange={e => setHideLineItems(e.target.checked)} />
                    <span>Hide line items</span>
                  </label>

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
                    <input type="checkbox" checked={description} onChange={e => setDescription(e.target.checked)} />
                    <span>Description</span>
                  </label>
                </div>
              </div>

              {/* The column picker spans the whole card rather than sitting in
                  the left column: the chip set is long, and it governs the
                  document's table, not the Line items checkboxes above it.

                  The box is the dropdown. Clicking anywhere in it opens the
                  full checklist, so adding a column is the same gesture as
                  removing one and there is no separate add row. */}
              {!hideLineItems && (
                <div className={"cpi-colpick" + (colsOpen ? ' is-open' : '')} ref={colsRef}>
                  <div
                    className="cpi-chips cpi-chips-wide"
                    onClick={() => setColsOpen(o => !o)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={colsOpen}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setColsOpen(o => !o); } }}
                  >
                    <span className="cpi-chip cpi-chip-locked">Items</span>
                    {REMOVABLE_COLS.filter(k => cols.includes(k)).map(k => (
                      <span key={k} className="cpi-chip">
                        {COL_LABELS[k]}
                        <button
                          className="cpi-chip-x"
                          onClick={e => { e.stopPropagation(); removeCol(k); }}
                          title={`Remove ${COL_LABELS[k]}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <span className="cpi-chips-caret">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ transform: colsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                        <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>

                  {colsOpen && (
                    <div className="cpi-colpick-pop">
                      {/* Check All is a control over the list, not a member of
                          it, so a dashed rule separates it from the columns
                          themselves. */}
                      <label className="cpi-colpick-item cpi-colpick-all">
                        <input type="checkbox" checked={allColsOn} onChange={toggleAllCols} />
                        Check All
                      </label>
                      {PICKER_ORDER.map(k => (
                        k === 'items' ? (
                          /* Items is always on. It stays in the list, checked
                             and disabled, rather than being omitted from the
                             set the builder is scanning. */
                          <label key={k} className="cpi-colpick-item cpi-colpick-locked">
                            <input type="checkbox" checked disabled />
                            {COL_LABELS[k]}
                          </label>
                        ) : (
                          <label key={k} className="cpi-colpick-item">
                            <input
                              type="checkbox"
                              checked={cols.includes(k)}
                              onChange={() => setCols(prev => prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k])}
                            />
                            {COL_LABELS[k]}
                          </label>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* One disabled action, left-aligned under the chips, as in the
                  captured design: nothing has changed yet, so there is nothing
                  to save as a default. */}
              <div className="cpi-edit-actions cpi-edit-actions-left">
                <button className="btn btn-s" disabled>Set as default</button>
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

          {description && (
            <section className="cpi-section">
              <h3 className="cpi-section-title">Description of invoice</h3>
              <div className="cpi-block-body">
                Invoice for work completed on the second-floor master suite remodel through May 2026.
                Covers framing, window and skylight installation, and carpet for the primary bedroom,
                plus approved change orders CO-1 through CO-3. Payment is due within 30 days of the
                invoice date. Please reference invoice Li-0111 with your payment.
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
                      {showTax && <th className="cpi-r">Tax</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {plainLines.map(l => renderLine(l))}

                    {/* Each change order renders as a titled block of its own
                        lines, or, collapsed, as a single row at its approved
                        total. The title is always there either way. When the
                        layout lifts them into their own grid they are absent
                        here entirely. */}
                    {(coLayout === 'ownGrid' ? [] : coGroups).flatMap(g => {
                      const total = g.lines.reduce((sum, l) => sum + l.price, 0);
                      if (hideCoLines) {
                        /* Collapsed, the change order stops being a heading
                           over its lines and becomes the billed line itself,
                           so it drops the group row's shading. */
                        return [renderGroupRow(g.title, total, 'cpi-co-collapsed')];
                      }
                      return [
                        renderGroupRow(g.title, total, 'cpi-grp-row'),
                        ...g.lines.map(l => renderLine(l)),
                      ];
                    })}

                    {/* A grid totals what it shows. With the change orders
                        lifted out, this one totals the contract lines alone
                        and the second grid carries its own. */}
                    <tr className="cpi-total-row">
                      <td>Totals:</td>
                      {showQty && <td></td>}
                      {showUnitCost && <td></td>}
                      {showMarkup && <td className="cpi-r">${fmt(coLayout === 'ownGrid' ? plainMarkup : markupTotal)}</td>}
                      {showPrice && <td className="cpi-r">${fmt(coLayout === 'ownGrid' ? plainSubtotal : subtotal)}</td>}
                      {showTax && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Change orders as a second grid: its own header row, its own
                  lines and its own total. The trade-off to look at here is
                  that the client now reconciles two tables to one amount due,
                  which is exactly why the inline layout exists. */}
              {coLayout === 'ownGrid' && coGroups.length > 0 && (
                <div className="cpi-tbl-wrap" style={{ marginTop: 20 }}>
                  <div className="cpi-subtbl-title">Change orders</div>
                  <table className="cpi-tbl">
                    <thead>
                      <tr>
                        <th>Items</th>
                        {showQty && <th>Qty/Unit</th>}
                        {showUnitCost && <th className="cpi-r">Unit cost</th>}
                        {showMarkup && <th className="cpi-r">Markup amount</th>}
                        {showPrice && <th className="cpi-r">Price</th>}
                        {showTax && <th className="cpi-r">Tax</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {coGroups.flatMap(g => {
                        const total = g.lines.reduce((sum, l) => sum + l.price, 0);
                        if (hideCoLines) {
                          return [renderGroupRow(g.title, total, 'cpi-co-collapsed')];
                        }
                        return [
                          renderGroupRow(g.title, total, 'cpi-grp-row'),
                          ...g.lines.map(l => renderLine(l)),
                        ];
                      })}
                      <tr className="cpi-total-row">
                        <td>Change order total:</td>
                        {showQty && <td></td>}
                        {showUnitCost && <td></td>}
                        {showMarkup && <td className="cpi-r">${fmt(coMarkup)}</td>}
                        {showPrice && <td className="cpi-r">${fmt(coSubtotal)}</td>}
                        {showTax && <td></td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <div className="cpi-hidden-note">Line item detail is hidden from the client for this invoice.</div>
          )}

          {/* The price breakdown is a two-level list: a bold roll-up line owns
              the muted, indented lines it is made of. Total tax carries its
              agencies that way, so the subtotal carries builder cost and the
              fee the same way rather than listing all three as siblings. */}
          <div className="cpi-totals">
            <div className="cpi-totals-line cpi-totals-parent"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
            {/* ADO 291436: open book only, and only when there is a fee to
                state. On fixed price the subtotal has no cost-plus-fee to
                break out, so it stands alone. */}
            {showFeeRow && (
              <>
                <div className="cpi-totals-line cpi-totals-sub"><span>Builder cost</span><span>${fmt(costOfWork)}</span></div>
                <div className="cpi-totals-line cpi-totals-sub"><span>{feeLabel || 'Builder fee'}</span><span>${fmt(feeTotal)}</span></div>
              </>
            )}
            {/* Total tax owns one indented line per agency, each naming its
                rate, which is the pattern the whole block follows. */}
            <div className="cpi-totals-line cpi-totals-parent"><span>Total tax</span><span>${fmt(totalTax)}</span></div>
            {agencyTax.map(a => (
              <div key={a.name} className="cpi-totals-line cpi-totals-sub">
                <span>{a.name} ({(a.rate * 100).toFixed(a.rate * 100 % 1 === 0 ? 0 : 3).replace(/0+$/, '').replace(/\.$/, '')}%)</span>
                <span>${fmt(a.amount)}</span>
              </div>
            ))}
            <div className="cpi-totals-line cpi-totals-parent"><span>Total price</span><span>${fmt(totalPrice)}</span></div>
            <div className="cpi-totals-line cpi-totals-sub"><span>Applied deposit</span><span>-${fmt(appliedDeposit)}</span></div>
            <div className="cpi-totals-line cpi-totals-heading"><span>Amount due</span><strong>${fmt(amountDue)}</strong></div>
          </div>

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
