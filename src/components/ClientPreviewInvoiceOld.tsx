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

/* Where a billable line came from. This is the axis builders think in when
   they describe an invoice out loud: "that's the lumber bill, that's our
   hours, that's the two change orders". Deliberately not called an entity,
   which is our word for it, not theirs. */
type LineSource = 'estimate' | 'bill' | 'timeClock' | 'changeOrder' | 'selection';

const SOURCE_LABELS: Record<LineSource, string> = {
  estimate: 'Estimate',
  bill: 'Bills',
  timeClock: 'Time clock',
  changeOrder: 'Change orders',
  selection: 'Selections',
};

interface PreviewLine {
  id: string;
  item: string;
  costCode: string;
  source: LineSource;
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
  /* When the work happened, in its own column: a single day for a bill, a
     stretch of days for a pay period, as MM/DD - MM/DD/YY. One field for
     both, because the client is asking the same question of either. The year
     appears once, on the end date, because a pay period almost never spans
     one. Estimate and selection lines have no date, and say so. The figures beside it mean hours and the hourly rate rather than
     a count and a unit price, which is why the quantity states its unit. */
  date?: string;
  unit?: string;
  /* A bill line bills a real document from a real supplier, so it carries who
     was paid, their invoice number and its date. On open book that is the
     disclosure the contract promises: BT shows all three in the Add-from-costs
     picker today and then discards them on the line, which is the gap Michelle
     Smith described. The item stays the material, because what was bought
     reads before who sold it on a materials line. */
  vendor?: string;
}

/* The job's tax agencies. Real invoices stack a state rate and a local one on
   the same taxable base, and the price breakdown lists each separately under
   Total tax, which is exactly why that block needs two levels. */
const TAX_AGENCIES: { name: string; rate: number }[] = [
  { name: 'Nebraska State', rate: 0.055 },
  { name: 'Nebraska, Omaha City', rate: 0.015 },
];

/* A second-floor master suite remodel, mid-job. Written as a builder would
   bill it: real cost codes, quantities in the units the trade uses, labor
   priced by the hour, and a 15% markup on cost. Two lines are exempt because
   permits and design fees are not taxable goods, which gives the Tax column
   something to distinguish.

   Deliberately spread across all four sources so the "By source" grouping has
   something to show, and two cost codes carry more than one line so "By cost
   code" visibly absorbs them. */
const LINES: PreviewLine[] = [
  { id: 'l1', item: 'Building permit', costCode: '1010 - Permits & fees', source: 'estimate', qty: 1, unitCost: 1450, markup: null, price: 1450, taxable: false },
  { id: 'l2', item: 'Architectural drawings, revision C', costCode: '1200 - Design', source: 'estimate', qty: 1, unitCost: 2400, markup: null, price: 2400, taxable: false },
  { id: 'l3', item: 'Dumpster rental, 30 yard', costCode: '1010 - Permits & fees', source: 'estimate', qty: 2, unitCost: 475, markup: 142.5, price: 1092.5, taxable: true },

  { id: 'l4', item: 'Tile, primary bath floor and surround', costCode: '5500 - Tile', source: 'selection', qty: 240, unitCost: 11.5, markup: 414, price: 3174, taxable: true },
  { id: 'l5', item: 'Plumbing fixtures, primary bath', costCode: '4100 - Plumbing fixtures', source: 'selection', qty: 1, unitCost: 3850, markup: 577.5, price: 4427.5, taxable: true },

  { id: 'l6', item: 'Framing lumber package', costCode: '2100 - Framing', source: 'bill', vendor: '84 Lumber · Bill #4471', date: '09/12/26', qty: 1, unitCost: 8420, markup: 1263, price: 9683, taxable: true },
  { id: 'l7', item: 'Rough plumbing, second floor', costCode: '2200 - Plumbing', source: 'bill', vendor: 'Delta Mechanical · Bill #2208', date: '09/15/26', qty: 1, unitCost: 3150, markup: 472.5, price: 3622.5, taxable: true },
  { id: 'l8', item: 'Electrical rough-in materials', costCode: '2300 - Electrical', source: 'bill', vendor: 'City Electric Supply · Bill #88312', date: '09/17/26', qty: 1, unitCost: 1840, markup: 276, price: 2116, taxable: true },
  { id: 'l9', item: 'Drywall, hang and finish', costCode: '2400 - Drywall', source: 'bill', vendor: 'Valley Drywall Co · Bill #1096', date: '09/24/26', qty: 1, unitCost: 4275, markup: 641.25, price: 4916.25, taxable: true },

  { id: 'l10', item: 'Marcus Webb, Lead carpenter', costCode: '2100 - Framing', source: 'timeClock', date: '09/08 - 09/19/26', unit: 'hrs', qty: 38, unitCost: 62, markup: 353.4, price: 2709.4, taxable: false },
  { id: 'l11', item: 'Danny Ruiz, Carpenter', costCode: '2100 - Framing', source: 'timeClock', date: '09/08 - 09/19/26', unit: 'hrs', qty: 46, unitCost: 48, markup: 331.2, price: 2539.2, taxable: false },
  { id: 'l12', item: 'Tomas Oliveira, Apprentice', costCode: '2400 - Drywall', source: 'timeClock', date: '09/22 - 09/26/26', unit: 'hrs', qty: 24, unitCost: 34, markup: 122.4, price: 938.4, taxable: false },

  { id: 'l13', item: 'Window upgrade, front elevation', costCode: '3300 - Windows', source: 'changeOrder', date: '09/04/26', qty: 3, unitCost: 1240, markup: 558, price: 4278, taxable: true, coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l14', item: 'Skylight, primary bath', costCode: '3350 - Skylights', source: 'changeOrder', date: '09/04/26', qty: 1, unitCost: 2180, markup: 327, price: 2507, taxable: true, coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l15', item: 'Carpet upgrade, bedrooms', costCode: '5540 - Carpet', source: 'changeOrder', date: '09/19/26', qty: 85, unitCost: 34, markup: 433.5, price: 3323.5, taxable: true, coId: 'co2', coTitle: 'CO-2: Carpet upgrade' },
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
type ColKey = 'items' | 'date' | 'tax' | 'unitCost' | 'quantity' | 'clientPrice' | 'markup'
  | 'costType' | 'markedAs' | 'description' | 'unitPrice' | 'builderCost' | 'markupPct';

const COL_LABELS: Record<ColKey, string> = {
  items: 'Items',
  date: 'Date',
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
const REMOVABLE_COLS: ColKey[] = ['date', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup',
  'costType', 'markedAs', 'description', 'unitPrice', 'builderCost', 'markupPct'];

/* The checklist has its own order, which is not the chip order: chips read
   left to right in the order the columns appear on the document, while the
   list groups the descriptive columns before the money ones. Kept as its own
   array so neither can quietly reorder the other. */
const PICKER_ORDER: ColKey[] = ['items', 'date', 'costType', 'markedAs', 'description', 'unitPrice',
  'quantity', 'builderCost', 'clientPrice', 'unitCost', 'markup', 'markupPct', 'tax'];

export default function ClientPreviewInvoiceOld() {
  /* Open on arrival. This route exists to show the settings themselves, so
     starting collapsed hides the very thing it is here to demonstrate. */
  const [showEdit, setShowEdit] = useState(true);
  const [hideLineItems, setHideLineItems] = useState(false);
  /* How the client-facing line items are organized. A three-way choice
     rather than a "combine by cost code" checkbox, because the invoice is
     always grouped *somehow* and the real question is by what:

     'source'   - where each line came from: the estimate, a bill, the time
                  clock, a selection. Change orders keep their own titles
                  within it, because the client recognizes a change order by
                  its name, not by the word "change orders".
     'costcode' - every line, change-order lines included, filed under its
                  cost code. The accounting view.
     'all'      - one flat list, no group rows at all. */
  const [groupBy, setGroupBy] = useState<'source' | 'costcode' | 'all'>('source');
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
  /* Collapsing to a total is a change-order-only move, deliberately. A change
     order was approved at an agreed price, so its total is a number the
     client already signed. A bill or a day of time clock is the opposite: on
     an open book contract those lines ARE the disclosure, and rolling them
     into "Bills $20,337.75" removes the thing the client is owed. So there is
     no general "group totals only" control here. */
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

  /* Builders do not all call it the same thing: "Builder markup" is the
     builders' word, AJ says "builder's fee", others say management fee or
     overhead and profit. The story makes the label configurable with that
     default; the field to edit it is a builder setting, not a review switch,
     so this prototype shows the default only. */
  const feeLabel = 'Builder markup';
  /* Some open book builders state the arrangement in the contract but do not
     want the split printed on every invoice. Hiding takes both breakdown rows
     away, not just the markup: with builder cost still shown, the client could
     back the markup out of the subtotal by subtraction. */
  const [hideFee, setHideFee] = useState(false);
  /* The agency rows name the jurisdictions and their rates. Some builders
     want the client to see exactly what was levied and by whom; others treat
     it as noise on a document the client is reading to find what they owe.
     Hiding the detail leaves the Total tax line, so the charge is still
     stated, only the make-up of it is not. */
  const [hideTaxDetail, setHideTaxDetail] = useState(false);
  const [cols, setCols] = useState<ColKey[]>(['items', 'date', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup',
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
  const showDate = has('date');
  const showMarkup = has('markup');
  const showPrice = has('clientPrice');
  const showTax = has('tax');

  /* Change-order lines group under their own change order; everything else
     stays a flat list, as this presentation always showed it. */
  /* What the contract actually bills. Open book bills the spend: real bills,
     real hours, the selections priced into the job and the approved change
     orders. It does not bill the estimate, which is a forecast, not money
     anybody paid. Fixed price is the mirror image: it bills the contract and
     its amendments, and the underlying costs are the builder's own business.

     This is why the two documents cannot be the same invoice with a filter
     on it, and why switching the contract in the Review pill changes the
     total rather than just the formatting. */
  const billableLines = LINES.filter(l =>
    contractType === 'open-book'
      ? l.source !== 'estimate'
      : l.source !== 'bill' && l.source !== 'timeClock'
  );

  const plainLines = billableLines.filter(l => !l.coId);
  const coGroups = (() => {
    const order: string[] = [];
    const byId: Record<string, { title: string; lines: PreviewLine[] }> = {};
    for (const l of billableLines) {
      if (!l.coId) continue;
      if (!byId[l.coId]) { order.push(l.coId); byId[l.coId] = { title: l.coTitle || l.coId, lines: [] }; }
      byId[l.coId].lines.push(l);
    }
    return order.map(id => byId[id]);
  })();

  /* Tax is charged on the client price of the taxable lines only, so each
     agency's figure is its rate against that base rather than the subtotal. */
  const taxableBase = billableLines.reduce((sum, l) => sum + (l.taxable ? l.price : 0), 0);
  const agencyTax = TAX_AGENCIES.map(a => ({ ...a, amount: taxableBase * a.rate }));
  const totalTax = agencyTax.reduce((sum, a) => sum + a.amount, 0);

  /* Cost-code grouping files every line, change-order lines included, under
     its code. Lines with no cost code still have to go somewhere, so they
     collect under one named group rather than vanishing. */
  /* Change orders only get lifted into a second grid when they are a
     grouping in the first place. Under cost code or a flat list they are
     ordinary lines, so there is nothing to split out. */
  const coSplitOut = coLayout === 'ownGrid' && groupBy === 'source' && coGroups.length > 0;

  /* Non-change-order lines, filed by where they came from. Change orders are
     excluded because they render as their own titled blocks underneath: a
     client recognizes "CO-1: Window & skylight upgrade", not a bucket called
     "Change orders". */
  const sourceGroups = (() => {
    const order: string[] = [];
    const bySource: Record<string, PreviewLine[]> = {};
    for (const l of plainLines) {
      const key = SOURCE_LABELS[l.source];
      if (!bySource[key]) { order.push(key); bySource[key] = []; }
      bySource[key].push(l);
    }
    return order.map(name => ({
      title: name,
      lines: bySource[name],
      total: bySource[name].reduce((sum, l) => sum + l.price, 0),
      markup: bySource[name].reduce((sum, l) => sum + (l.markup || 0), 0),
    }));
  })();

  const costCodeGroups = (() => {
    const order: string[] = [];
    const byCode: Record<string, PreviewLine[]> = {};
    for (const l of billableLines) {
      const key = l.costCode || 'No cost code';
      if (!byCode[key]) { order.push(key); byCode[key] = []; }
      byCode[key].push(l);
    }
    return order.map(name => ({
      title: name,
      lines: byCode[name],
      total: byCode[name].reduce((sum, l) => sum + l.price, 0),
      markup: byCode[name].reduce((sum, l) => sum + (l.markup || 0), 0),
    }));
  })();

  const plainSubtotal = plainLines.reduce((sum, l) => sum + l.price, 0);
  const plainMarkup = plainLines.reduce((sum, l) => sum + (l.markup || 0), 0);
  const coSubtotal = billableLines.reduce((sum, l) => sum + (l.coId ? l.price : 0), 0);
  const coMarkup = billableLines.reduce((sum, l) => sum + (l.coId ? (l.markup || 0) : 0), 0);

  const subtotal = billableLines.reduce((s, l) => s + l.price, 0);
  const markupTotal = billableLines.reduce((s, l) => s + (l.markup || 0), 0);
  /* The fee is the markup already on the lines, and builder cost is what is
     left of the subtotal once it is taken out. Nothing is recalculated, so
     subtotal, tax and total are identical with the rows shown or hidden, and
     the fee row always reconciles to the per-line Markup column. Suppressed
     at zero rather than printing an empty row. */
  const feeTotal = markupTotal;
  const costOfWork = subtotal - feeTotal;
  const feeAvailable = contractType === 'open-book' && feeTotal > 0;
  const showFeeRow = feeAvailable && !hideFee;

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
          {l.vendor && <div className="cpi-item-code">{l.vendor}</div>}
        </td>
        {/* Hours read as hours. Without the unit, 38.00 beside a $62.00 rate
            is ambiguous on a labor line. */}
        {/* An estimate or selection line has no date to give, so it says so
            rather than leaving a hole in a column of dates. */}
        {showDate && <td className="cpi-nowrap">{l.date || <span className="cpi-tax-none">--</span>}</td>}
        {showQty && <td>{l.unit ? `${l.qty.toFixed(2)} ${l.unit}` : l.qty.toFixed(2)}</td>}
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
  const renderGroupRow = (title: string, total: number, className: string, markup?: number) => (
    <tr key={`grp-${title}`} className={className}>
      <td>{title}</td>
      {showDate && <td></td>}
      {showQty && <td></td>}
      {showUnitCost && <td></td>}
      {/* Only an absorbed row carries a markup figure. A heading over its own
          visible lines leaves the cell empty, because each line states its
          own markup directly underneath. */}
      {showMarkup && <td className="cpi-r">{markup != null ? `$${fmt(markup)}` : ''}</td>}
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

                  {/* The invoice is always grouped somehow, so this is a
                      choice between three groupings rather than a switch to
                      turn one on. */}
                  <div className="cpi-rail-sublabel">Group line items by</div>
                  <div className="client-group-toggle" role="tablist" aria-label="Group line items for client">
                    {([
                      { value: 'source' as const, label: 'By source' },
                      { value: 'costcode' as const, label: 'By cost code' },
                      { value: 'all' as const, label: 'All line items' },
                    ]).map(o => (
                      <button
                        key={o.value}
                        type="button"
                        className={'client-group-tab' + (groupBy === o.value ? ' on' : '')}
                        aria-selected={groupBy === o.value}
                        /* Grouping by a code the client cannot see would
                           produce unlabelled headings, so choosing it brings
                           the cost code back rather than silently breaking. */
                        onClick={() => { setGroupBy(o.value); if (o.value === 'costcode') setHideCostCode(false); }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>

                  <label className={"cpi-check" + (groupBy === 'costcode' ? ' cpi-check-off' : '')}>
                    <input
                      type="checkbox"
                      checked={hideCostCode}
                      disabled={groupBy === 'costcode'}
                      onChange={e => setHideCostCode(e.target.checked)}
                    />
                    <span title={groupBy === 'costcode' ? 'Unavailable while the lines are grouped by cost code: the code is the group heading' : undefined}>
                      Hide cost code
                    </span>
                  </label>
                  {/* Only meaningful while change orders are a grouping. Under
                      cost code or a flat list they are ordinary lines with
                      nothing to collapse into. The title is never optional. */}
                  {/* Change orders only: the bills and hours stay itemized,
                      because on open book those lines are the disclosure. */}
                  {coGroups.length > 0 && groupBy === 'source' && (
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

                {/* The price breakdown gets its own group rather than sitting
                    at the foot of General information. The three groups are
                    the three parts of the document: the line-item table, the
                    totals block under it, and the boilerplate around both.
                    Hiding the markup is a question about the totals block, not
                    about QR codes and custom fields. Each control appears only
                    when it has something to act on, and the group itself goes
                    away when neither does. */}
                {(feeAvailable || agencyTax.length > 0) && (
                  <div className="cpi-edit-col">
                    <div className="cpi-edit-h">Price breakdown</div>
                    {/* Markup is open book only; tax applies either way, so
                        this group can exist on a fixed price invoice with the
                        tax control alone. */}
                    {feeAvailable && (
                      <label className="cpi-check">
                        <input type="checkbox" checked={hideFee} onChange={e => setHideFee(e.target.checked)} />
                        <span>Hide builder markup from subtotal</span>
                      </label>
                    )}
                    {agencyTax.length > 0 && (
                      <label className="cpi-check">
                        <input type="checkbox" checked={hideTaxDetail} onChange={e => setHideTaxDetail(e.target.checked)} />
                        <span>Hide tax agency detail</span>
                      </label>
                    )}
                  </div>
                )}

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
                  the Line items column: the chip set is long enough to wrap to
                  three rows at column width, which costs more vertical space
                  than the grouping it would sit under.

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
                      {showDate && <th>Date</th>}
                      {showQty && <th>Qty/Unit</th>}
                      {showUnitCost && <th className="cpi-r">Unit cost</th>}
                      {showMarkup && <th className="cpi-r">Markup amount</th>}
                      {showPrice && <th className="cpi-r">Price</th>}
                      {showTax && <th className="cpi-r">Tax</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {/* By cost code: the lines are absorbed into their code.
                        The client sees one row per cost code at its total, not
                        a heading over the lines that make it up, which is the
                        whole point of asking for this grouping. Change orders
                        stop being a grouping of their own here, since a line
                        cannot sit under two headings at once.

                        Unshaded, because the row IS the billed line now rather
                        than a heading over others. Same treatment as a
                        collapsed change order. */}
                    {groupBy === 'costcode' && costCodeGroups.map(g =>
                      renderGroupRow(g.title, g.total, 'cpi-co-collapsed', g.markup)
                    )}

                    {/* Flat: every line in order, no group rows. */}
                    {groupBy === 'all' && billableLines.map(l => renderLine(l))}

                    {/* By source: each origin as a titled block, then the
                        change orders as their own titled blocks, or, collapsed,
                        a single row each at the approved total. When the layout
                        lifts change orders into their own grid they are absent
                        here entirely. */}
                    {groupBy === 'source' && sourceGroups.flatMap(g => [
                      renderGroupRow(g.title, g.total, 'cpi-grp-row'),
                      ...g.lines.map(l => renderLine(l)),
                    ])}
                    {groupBy === 'source' && (coLayout === 'ownGrid' ? [] : coGroups).flatMap(g => {
                      const total = g.lines.reduce((sum, l) => sum + l.price, 0);
                      if (hideCoLines) {
                        /* Collapsed, the change order stops being a heading
                           over its lines and becomes the billed line itself,
                           so it drops the group row's shading. */
                        const coMarkupTotal = g.lines.reduce((sum, l) => sum + (l.markup || 0), 0);
                        return [renderGroupRow(g.title, total, 'cpi-co-collapsed', coMarkupTotal)];
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
                      {showDate && <td></td>}
                      {showQty && <td></td>}
                      {showUnitCost && <td></td>}
                      {showMarkup && <td className="cpi-r">${fmt(coSplitOut ? plainMarkup : markupTotal)}</td>}
                      {showPrice && <td className="cpi-r">${fmt(coSplitOut ? plainSubtotal : subtotal)}</td>}
                      {showTax && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Change orders as a second grid: its own header row, its own
                  lines and its own total. The trade-off to look at here is
                  that the client now reconciles two tables to one amount due,
                  which is exactly why the inline layout exists. */}
              {coSplitOut && (
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
                        {showDate && <td></td>}
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
                <div className="cpi-totals-line cpi-totals-sub"><span>{feeLabel || 'Builder markup'}</span><span>${fmt(feeTotal)}</span></div>
              </>
            )}
            {/* Total tax owns one indented line per agency, each naming its
                rate, which is the pattern the whole block follows. */}
            <div className="cpi-totals-line cpi-totals-parent"><span>Total tax</span><span>${fmt(totalTax)}</span></div>
            {!hideTaxDetail && agencyTax.map(a => (
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
