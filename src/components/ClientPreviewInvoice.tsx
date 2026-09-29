import { useState, useRef, useEffect, type ReactNode } from 'react';
import { fmt, fmtDate } from '../utils';

// A collapsible group in the right-hand customize rail — Recipient, Layout,
// Display to client, General information. Defined outside the component so
// its identity is stable across renders; nesting it as a local function
// would remount the section (and any focused input inside it) on every
// keystroke elsewhere on the page.
function RailSection({ id, title, open, onToggle, children }: { id: string; title: string; open: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <div className="cpi-rail-section">
      <button type="button" className="cpi-rail-section-title" onClick={() => onToggle(id)} aria-expanded={open}>
        {title}
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s' }}>
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div className="cpi-rail-section-body">{children}</div>}
    </div>
  );
}

function formatDateTime(d: Date) {
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * ClientPreviewInvoice — a redesigned "Invoice" screen with Details and
 * Client preview as tabs of the same record, instead of the preview living
 * on its own with no way to see or edit the invoice behind it.
 *
 * Details is where the builder sets up the invoice (info, pricing, line
 * items). Client preview is the read-only, editable-display view of what the
 * client will actually receive — a live preview of the emailed/portal
 * invoice plus an edit-options panel that controls what shows. Edits made on
 * Details (title, dates, line items) flow straight into Client preview,
 * since they're the same invoice. Reached via Financial ▸ "Client preview
 * invoice" (#client-preview-invoice).
 *
 * Visual language borrowed from the JPS print page (.jps-print-*) for the
 * document itself: gray canvas, a controls card stacked above a document
 * "paper", a solid dark logo mark with a right-aligned company block, a
 * title + summary row, gray-headed tables, and a right-aligned totals block.
 */

/* Where a billable line came from. Fixed price bills the contract, so its
   lines originate in the estimate, the change orders that amended it, and the
   selections priced into it. Open book bills what was actually spent, so the
   estimate is replaced by real costs (bills, time clock) while change orders
   and selections still apply. One line shape either way — only which sources
   are in play changes. */
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
  // Which estimate group this line rolled up from — lets the client preview
  // show the invoice organized the way the builder's estimate was, instead of
  // by cost code. Per the Q4 invoice-presentation opportunity, builders keep
  // asking to see the estimate's groups, not our cost codes.
  group: string;
  qty: number;
  unitCost: number | null;
  markup: number | null;
  taxable: boolean;
  // Which upstream record produced this line. Drives which lines a contract
  // type shows, and the "by cost source" grouping open-book builders ask for.
  source: LineSource;
  // Open book only: the vendor/employee behind a cost line. Open-book clients
  // are entitled to see where their money went, so the document can name who
  // was paid — the backup detail Michelle Smith asks for.
  vendor?: string;
  // Present only on lines that came from an approved change order — drives
  // the change-order blocks nested inside the line-item grid.
  coId?: string;
  coTitle?: string;
}

/* The job's tax agency and rate. A real invoice reads this off the job; the
   prototype needs a non-zero rate for per-line tax to be worth showing at
   all, so it carries a plausible one. */
const TAX_AGENCY = 'State Tax';
const TAX_RATE = 0.09125;

const linePrice = (l: PreviewLine) => (l.unitCost ?? 0) * l.qty + (l.markup ?? 0);
// Only lines with a real unit cost have a base to apply a % markup against —
// flat-rate fee lines have no cost to mark up.
const lineBaseCost = (l: PreviewLine) => (l.unitCost ?? 0) * l.qty;

/* Lines a fixed-price invoice bills: the estimate, the selections priced into
   it, and the change orders that amended it. Never costs — on fixed price the
   client is buying a result, and the spend is the builder's own margin. */
const FIXED_PRICE_LINES: PreviewLine[] = [
  { id: 'l1', item: 'Building permit', costCode: '1010 - Building permits', group: 'Permits & fees', qty: 1, unitCost: 443, markup: null, taxable: false, source: 'estimate' },
  { id: 'l2', item: 'Warranty registration', costCode: '1030 - Warranty fees', group: 'Permits & fees', qty: 1, unitCost: 888, markup: 1.78, taxable: true, source: 'estimate' },
  { id: 'l3', item: 'Tile package — primary bath', costCode: '1030 - Warranty fees', group: 'Permits & fees', qty: 1, unitCost: 444, markup: null, taxable: true, source: 'selection' },
  { id: 'l4', item: 'Blueprint revision set', costCode: 'Blueprint', group: 'Design', qty: 1, unitCost: 555, markup: null, taxable: false, source: 'estimate' },
  { id: 'l5', item: 'Window upgrade — front elevation', costCode: '3300 - Windows', group: 'Change orders', qty: 1, unitCost: 500, markup: 3, taxable: true, source: 'changeOrder', coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l6', item: 'Skylight install', costCode: '3350 - Skylights', group: 'Change orders', qty: 1, unitCost: 4000, markup: 32, taxable: true, source: 'changeOrder', coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'l7', item: 'Carpet upgrade — bedrooms', costCode: '5540 - Carpet', group: 'Change orders', qty: 1, unitCost: 405, markup: 40.5, taxable: true, source: 'changeOrder', coId: 'co2', coTitle: 'CO-2: Carpet upgrade' },
  { id: 'l8', item: 'Lighting package', costCode: '4200 - Fixtures', group: 'Fixtures', qty: 1, unitCost: 1200, markup: 100, taxable: true, source: 'selection' },
];

/* Lines an open-book invoice bills: real costs (bills, time clock) in place of
   the estimate, plus the same change orders and selections. This is the case
   where the client is entitled to see where their money went, so cost lines
   carry the vendor/employee behind them. */
const OPEN_BOOK_LINES: PreviewLine[] = [
  { id: 'o1', item: 'Framing lumber package', costCode: '2100 - Framing', group: 'Framing', qty: 1, unitCost: 8420, markup: 1263, taxable: true, source: 'bill', vendor: 'Ferguson Supply' },
  { id: 'o2', item: 'Rough plumbing — second floor', costCode: '2200 - Plumbing', group: 'Mechanicals', qty: 1, unitCost: 3150, markup: 472.5, taxable: true, source: 'bill', vendor: 'Delta Mechanical' },
  { id: 'o3', item: 'Electrical rough-in materials', costCode: '2300 - Electrical', group: 'Mechanicals', qty: 1, unitCost: 604.3, markup: 90.65, taxable: true, source: 'bill', vendor: 'Home Depot' },
  { id: 'o4', item: 'Lead carpenter — framing', costCode: '2100 - Framing', group: 'Framing', qty: 38, unitCost: 62, markup: 353.4, taxable: false, source: 'timeClock', vendor: 'Marcus Webb' },
  { id: 'o5', item: 'Carpenter — framing', costCode: '2100 - Framing', group: 'Framing', qty: 46, unitCost: 48, markup: 331.2, taxable: false, source: 'timeClock', vendor: 'Danny Ruiz' },
  { id: 'o6', item: 'Tile package — primary bath', costCode: '5500 - Tile', group: 'Finishes', qty: 1, unitCost: 444, markup: 66.6, taxable: true, source: 'selection' },
  { id: 'o7', item: 'Lighting package', costCode: '4200 - Fixtures', group: 'Finishes', qty: 1, unitCost: 1200, markup: 180, taxable: true, source: 'selection' },
  { id: 'o8', item: 'Window upgrade — front elevation', costCode: '3300 - Windows', group: 'Change orders', qty: 1, unitCost: 500, markup: 3, taxable: true, source: 'changeOrder', coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'o9', item: 'Skylight install', costCode: '3350 - Skylights', group: 'Change orders', qty: 1, unitCost: 4000, markup: 32, taxable: true, source: 'changeOrder', coId: 'co1', coTitle: 'CO-1: Window & skylight upgrade' },
  { id: 'o10', item: 'Carpet upgrade — bedrooms', costCode: '5540 - Carpet', group: 'Change orders', qty: 1, unitCost: 405, markup: 40.5, taxable: true, source: 'changeOrder', coId: 'co2', coTitle: 'CO-2: Carpet upgrade' },
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

/* Items is the only locked column: a line with no description isn't a line.
   Tax is removable like any other - the tax still rolls up in the price
   breakdown either way, so hiding the column drops per-line detail without
   ever hiding the charge. */
const REMOVABLE_COLS: ColKey[] = ['unitCost', 'quantity', 'clientPrice', 'markup', 'tax'];

// How the client-facing line items are organized: mirrors the estimate's
// groups, rolls up by cost code, or lists every line flat. Builders keep
// asking for "by estimate" (see the Q4 invoice presentation opportunity) so
// the client sees the same groupings as the proposal they already approved.
type GroupBy = 'estimate' | 'costcode' | 'source' | 'all';

/* Which contract the invoice is billing under. This isn't a display option —
   it decides which records are billable in the first place (fixed price bills
   the contract, open book bills the spend), so it sits on the document
   selector rather than in the customize rail. */
type ContractType = 'fixed-price' | 'open-book';

/* The invoice's own status, which is about the money, not about whether the
   client opened the email. Delivery ("sent 2 days ago, viewed yesterday by
   Delanie") is tracked separately and shown on the preview canvas. */
type InvoiceStatus = 'Draft' | 'Sent' | 'Paid';

const INVOICE_STATUS_CLASS: Record<InvoiceStatus, string> = {
  Draft: 'status-draft',
  Sent: 'status-unreleased',
  Paid: 'status-paid',
};

// The menu names each contract's billable sources, since that difference is
// the whole reason the two documents don't look alike.
const CONTRACT_OPTIONS: { value: ContractType; label: string; sources: string }[] = [
  { value: 'fixed-price', label: 'Fixed price', sources: 'Estimate, change orders, selections' },
  { value: 'open-book', label: 'Open book', sources: 'Bills, time clock, change orders, selections' },
];

const DUE_DATE_DAYS: Record<string, number> = { 'Due upon receipt': 0, 'Net 15': 15, 'Net 30': 30, 'Net 45': 45, 'Net 60': 60 };
function computeDueDate(dateStr: string, terms: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + (DUE_DATE_DAYS[terms] ?? 0));
  return d.toISOString().split('T')[0];
}

export default function ClientPreviewInvoice() {
  /* Opens on Client preview. The reason to come here is to see what the
     client receives; Details is where you go to change it. */
  const [activeTab, setActiveTab] = useState<'details' | 'client-preview'>('client-preview');

  // ── Details tab state ──────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dueDateMode, setDueDateMode] = useState<'invoiceDate' | 'schedule'>('invoiceDate');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('Due upon receipt');
  const [priceMode, setPriceMode] = useState<'flatFee' | 'lineItems'>('lineItems');
  const [flatFeeAmount, setFlatFeeAmount] = useState(0);
  const [markupAdjustPct, setMarkupAdjustPct] = useState(0);
  /* Which contract the job bills under. Switching it swaps the billable
     records wholesale rather than filtering the same set, because the two
     contracts don't bill the same things: fixed price has no cost lines to
     show, and open book has no estimate to bill against. */
  const [contractType, setContractType] = useState<ContractType>('fixed-price');
  const [fixedPriceLines, setFixedPriceLines] = useState<PreviewLine[]>(FIXED_PRICE_LINES);
  const [openBookLines, setOpenBookLines] = useState<PreviewLine[]>(OPEN_BOOK_LINES);
  const lines = contractType === 'open-book' ? openBookLines : fixedPriceLines;
  const setLines = contractType === 'open-book' ? setOpenBookLines : setFixedPriceLines;

  const dueDate = computeDueDate(invoiceDate, paymentTerms);

  const updateLine = (id: string, patch: Partial<PreviewLine>) =>
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const applyMarkupToAll = () => {
    setLines(prev => prev.map(l => (l.unitCost != null ? { ...l, markup: lineBaseCost(l) * (markupAdjustPct / 100) } : l)));
  };

  // ── Client preview tab state ──────────────────────────────────────
  // Left rail: which document is open in the canvas. "Print" is the PDF/portal
  // document (today's client preview); "Email" is the notification the client
  // actually opens first, so it gets its own document rather than a settings tab.
  const [selectedDoc, setSelectedDoc] = useState<'print' | 'email'>('print');
  const [contractMenuOpen, setContractMenuOpen] = useState(false);
  const contractMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contractMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (contractMenuRef.current && !contractMenuRef.current.contains(e.target as Node)) setContractMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contractMenuOpen]);

  /* Narrow screens roll the secondary footer actions (Print, Cancel, Save)
     into an overflow menu, leaving the one action the builder came to take
     — Send, or Record payment once it's out — as a full-width button. Four
     buttons across a 390px bar leaves each one too small to hit and too
     cramped to read. */
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const footerMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!footerMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(e.target as Node)) setFooterMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [footerMenuOpen]);

  /* On a phone the customize rail can't sit beside the document, and
     stacking it below buries the invoice under a screen of settings. So it
     becomes a sheet over the document, opened from a Customize button —
     the document stays the page, and the controls are one tap away. The
     same markup is the docked rail at desktop width; only CSS differs. */
  const [customizeSheetOpen, setCustomizeSheetOpen] = useState(false);
  // Escape closes it, the way any overlay should.
  useEffect(() => {
    if (!customizeSheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCustomizeSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [customizeSheetOpen]);
  // Which right-rail section is expanded — id-keyed so multiple can be open at
  // once, matching the reference proposal rail's Content/Layout/Design groups.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ recipient: true, layout: true, display: true, 'change-orders': true, general: true, 'email-content': true });
  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const [hideLineItems, setHideLineItems] = useState(false);
  /* A change order was approved as a priced scope of work, so its title and
     total are often the whole story the client needs — they already signed
     off on what's inside it. Collapsing to the title keeps the CO visible on
     the invoice without re-litigating lines that were agreed weeks ago. */
  const [hideChangeOrderLines, setHideChangeOrderLines] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>('estimate');
  const [cols, setCols] = useState<ColKey[]>(['items', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup']);
  const [qrCode, setQrCode] = useState(false);
  const [customFields, setCustomFields] = useState(true);
  /* Open book only: name the vendor or employee behind each cost line. The
     disclosure open-book clients are entitled to and fixed-price builders
     specifically don't want, so it's off until asked for. */
  const [showVendor, setShowVendor] = useState(false);
  /* Cost codes are the builder's own accounting structure, not something the
     client asked to see. Builders formatting an invoice to match the
     proposal a client already approved generally want them off. */
  const [showCostCodes, setShowCostCodes] = useState(true);
  /* Open book only: where the builder's fee appears. "inLine" is today's
     document, where each line's price already has that line's markup baked
     into it and the fee is only visible as a per-line Markup column. "oneLine"
     prices every line at true cost and states the fee once in the price
     breakdown.

     This is the most-repeated reason cost-plus builders invoice out of
     QuickBooks. AJ Epding (Hancock Built, CPA, 2026-07-27) doesn't use BT
     markup at all: he accumulates true costs and adds one builder's fee line
     at the bottom so clients always see true cost. Carla (buildersgoto,
     2026-07-27) reports the same shape as QBO's subtotal-then-add-a-fee-line
     option, and it's what CoConstruct did. Michelle Smith (Hanson Land & Sea,
     2026-08-28): "In an open book you're an open book, you have to show your
     clients where you spent their money."

     Presentation only. The fee figure is the markup already stored on the
     lines, so subtotal, tax and total are identical either way. A fee cost
     code mapped to its own QuickBooks income account is the other half of the
     ask and isn't this control. */
  const [feeDisplay, setFeeDisplay] = useState<'inLine' | 'oneLine'>('inLine');
  /* Builders don't call it markup to the client. "Builder fee" is AJ's and
     Carla's term; others say management fee, contractor fee, or overhead and
     profit, so the label is theirs to set. */
  const [feeLabel, setFeeLabel] = useState('Builder fee');
  // Two free-text messages the builder can place on the invoice: an intro
  // (invoice context, renders above the line items) and a closing (payment
  // notes, renders below the totals — restoring the pre-update bottom layout).
  const [introText, setIntroText] = useState(true);
  const [closingText, setClosingText] = useState(true);
  const [billToId, setBillToId] = useState<string>('c1');
  // Page orientation for the client-facing document. "Vertical" (portrait) is
  // the default; "Horizontal" (landscape) gives wide tables more room.
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  /* The presentation settings, as one comparable string. "Saved as default"
     is derived from it rather than tracked as its own flag, so the badge can
     never drift out of sync with the controls: edit anything and the
     signature stops matching, undo the edit and it matches again. */
  const settingsSignature = JSON.stringify({
    hideLineItems, hideChangeOrderLines, groupBy, cols, qrCode, customFields,
    showVendor, showCostCodes, introText, closingText, orientation, contractType,
    feeDisplay, feeLabel,
  });
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const savedAsDefault = savedSignature === settingsSignature;

  // Delivery status: whether the client has received and opened this invoice,
  // and — since a job's portal link can be shared among several contacts —
  // which of them actually opened it. Mock timestamps rather than live
  // tracking, but the shape (sentAt / viewedAt / viewedBy) is what a real
  // send/view log would carry. Starts pre-sent so the indicator has something
  // to show; "Send" below still re-stamps sentAt and clears the view.
  const [sentAt, setSentAt] = useState<Date | null>(() => { const d = new Date(); d.setDate(d.getDate() - 2); return d; });
  const [viewedAt, setViewedAt] = useState<Date | null>(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; });
  const [viewedBy, setViewedBy] = useState<string | null>('Delanie Walker');
  /* Paid is its own fact (a payment was recorded), not something the send/
     view log implies, so it's tracked separately. Draft vs Sent still falls
     out of whether the invoice has been released. */
  const [paidAt, setPaidAt] = useState<Date | null>(null);
  const invoiceStatus: InvoiceStatus = paidAt ? 'Paid' : sentAt ? 'Sent' : 'Draft';

  // Custom message the builder can add into the email notification, under the
  // fixed system-generated payment-request line. Separate from the print
  // document's intro/closing text — the email is a short notification, not
  // the invoice itself, so it gets its own optional note rather than reusing
  // those blocks.
  const [emailMessage, setEmailMessage] = useState('');

  const billTo = CONTACTS.find(c => c.id === billToId) || CONTACTS[0];

  /* Each contract offers a grouping the other doesn't (estimate vs cost
     source), so switching has to move a builder sitting on the departing
     option onto its counterpart rather than leaving groupBy pointing at a
     control that's no longer on screen. */
  const selectContractType = (next: ContractType) => {
    setContractType(next);
    if (next === 'open-book' && groupBy === 'estimate') setGroupBy('source');
    if (next === 'fixed-price' && groupBy === 'source') setGroupBy('estimate');
  };

  const removeCol = (k: ColKey) => setCols(prev => prev.filter(c => c !== k));
  const has = (k: ColKey) => cols.includes(k);

  /* Change-order lines still group by their change order, but that grouping
     is now one more block inside the single line-item grid rather than its
     own table below it. A change order is a set of billable lines like any
     other group — splitting it into a second grid with its own header row and
     its own totals made the client reconcile two tables to one amount due. */
  const standardLines = lines.filter(l => !l.coId);
  const changeOrderGroups = (() => {
    const order: string[] = [];
    const byId: Record<string, { title: string; lines: PreviewLine[] }> = {};
    for (const l of lines) {
      if (!l.coId) continue;
      if (!byId[l.coId]) { order.push(l.coId); byId[l.coId] = { title: l.coTitle || l.coId, lines: [] }; }
      byId[l.coId].lines.push(l);
    }
    return order.map(id => byId[id]);
  })();

  /* Only open book has a fee to separate. On fixed price the client bought a
     result at a contract price, so there is no cost-plus-fee to state. */
  const feeOnOwnLine = contractType === 'open-book' && feeDisplay === 'oneLine';

  // Which document columns to render, in table order.
  const showUnitCost = has('unitCost');
  const showQty = has('quantity');
  /* A per-line Markup column contradicts a stated fee line: it would show the
     fee twice, once spread across the lines and once at the bottom. The chip
     stays in the picker so turning the fee line off restores it. */
  const showMarkup = has('markup') && !feeOnOwnLine;
  const showPrice = has('clientPrice');
  const showTax = has('tax');

  /* With the fee on its own line, every line renders at true cost and the fee
     is added once below. Without it, each line's price carries its own
     markup, which is today's document. Either way the two sum to the same
     subtotal, so nothing downstream of it moves. */
  const displayLinePrice = (l: PreviewLine) => (feeOnOwnLine ? lineBaseCost(l) : linePrice(l));

  /* Tax is charged on the client price of the taxable lines, so it follows
     the price whether or not the fee is broken out: moving the fee between
     the lines and the breakdown must not move the tax. */
  const lineTax = (l: PreviewLine) => (l.taxable ? linePrice(l) * TAX_RATE : 0);

  const subtotal = lines.reduce((s, l) => s + linePrice(l), 0);
  const costOfWork = lines.reduce((s, l) => s + lineBaseCost(l), 0);
  const feeTotal = lines.reduce((s, l) => s + (l.markup || 0), 0);
  const taxableBase = lines.reduce((s, l) => s + (l.taxable ? linePrice(l) : 0), 0);
  const totalTax = lines.reduce((s, l) => s + lineTax(l), 0);
  const totalPrice = subtotal + totalTax;
  // Construction invoices commonly credit a deposit/retainer collected earlier.
  const appliedDeposit = 100;
  const amountDue = totalPrice - appliedDeposit;

  /* The Markup column is off the picker entirely while the fee has its own
     line: it would state the same money twice. It comes back, still checked,
     the moment the builder puts the fee back in the lines. */
  const pickableCols = REMOVABLE_COLS.filter(k => !(k === 'markup' && feeOnOwnLine));
  const availableToAdd = pickableCols.filter(k => !cols.includes(k));

  /* Group the standard (non-CO) client-facing line items. "By cost source" is
     the open-book ask: a client paying actuals wants to see what was a bill,
     what was labor, and what they chose, not a flat list of everything the
     job spent. */
  const standardGroups: { name: string; items: PreviewLine[]; subtotal: number; tax: number }[] | null = (() => {
    if (groupBy === 'all') return null;
    const key = (l: PreviewLine) =>
      groupBy === 'estimate' ? l.group
        : groupBy === 'source' ? SOURCE_LABELS[l.source]
        : l.costCode || 'No cost code';
    const order: string[] = [];
    const byGroup: Record<string, PreviewLine[]> = {};
    for (const l of standardLines) {
      const k = key(l);
      if (!byGroup[k]) { order.push(k); byGroup[k] = []; }
      byGroup[k].push(l);
    }
    return order.map(name => ({
      name,
      items: byGroup[name],
      subtotal: byGroup[name].reduce((s, l) => s + displayLinePrice(l), 0),
      tax: byGroup[name].reduce((s, l) => s + lineTax(l), 0),
    }));
  })();

  // `depth` indents nested rows: 1 for a line under a group header, 2 for a
  // line under a change order nested inside a group.
  const renderLineRow = (l: PreviewLine, depth: number) => {
    const pad = depth * 16;
    return (
      <tr key={l.id}>
        <td>
          <div className="cpi-item-name" style={{ paddingLeft: pad }}>{l.item}</div>
          {showCostCodes && l.costCode && <div className="cpi-item-code" style={{ paddingLeft: pad }}>{l.costCode}</div>}
          {showVendor && l.vendor && <div className="cpi-item-vendor" style={{ paddingLeft: pad }}>{l.vendor}</div>}
        </td>
        {/* data-label is what each figure is called once the table stacks
            into cards on a phone — see the max-width:600px rules. */}
        {showQty && <td data-label="Qty/Unit">{l.qty.toFixed(2)}</td>}
        {showUnitCost && <td className="cpi-r" data-label="Unit cost">{l.unitCost != null ? `$${fmt(l.unitCost)}` : ''}</td>}
        {showMarkup && <td className="cpi-r" data-label="Markup">{l.markup != null ? `$${fmt(l.markup)}` : ''}</td>}
        {showPrice && <td className="cpi-r cpi-strong" data-label="Price">${fmt(displayLinePrice(l))}</td>}
        {/* The amount, not the word "Taxable". A client reading a bill wants
            to know what the tax on this line was, and a non-taxable line
            says so once rather than leaving an unexplained blank. */}
        {showTax && (
          <td className="cpi-r" data-label="Tax">
            {l.taxable ? `$${fmt(lineTax(l))}` : <span className="cpi-tax-none">Non-taxable</span>}
          </td>
        )}
      </tr>
    );
  };

  // A group/change-order header row: a title with its rolled-up price, which
  // is the one-price-per-group view builders keep asking for.
  const renderGroupRow = (key: string, name: string, groupSubtotal: number, className: string, groupTax?: number) => (
    <tr key={key} className={className}>
      <td>{name}</td>
      {showQty && <td></td>}
      {showUnitCost && <td></td>}
      {showMarkup && <td></td>}
      {showPrice && <td className="cpi-r">${fmt(groupSubtotal)}</td>}
      {/* A group that hides its lines still owes its tax, so the header
          carries the group's rolled-up tax rather than an empty cell. */}
      {showTax && <td className="cpi-r">{groupTax != null ? `$${fmt(groupTax)}` : ''}</td>}
    </tr>
  );

  const renderDetailsTab = () => (
    <div className="cpi-details">
      <div className="sec">
        <div className="sec-title">Invoice information</div>
        <div className="g3">
          <div>
            <label className="fl">Title</label>
            <input className="fi" value={title} onChange={e => setTitle(e.target.value)} placeholder="Untitled invoice" />
          </div>
          <div>
            <label className="fl">ID #</label>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--g200)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 14, color: 'var(--g600)', background: 'var(--g50)', borderRight: '1px solid var(--g200)' }}>Li-</span>
              <input
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder="(Auto assign)"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 14, fontFamily: 'inherit' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="fl">Due date</label>
          <div className="tabs" style={{ width: 'fit-content' }}>
            <button type="button" className={`tab${dueDateMode === 'invoiceDate' ? ' on' : ''}`} onClick={() => setDueDateMode('invoiceDate')}>Invoice date</button>
            <button type="button" className={`tab${dueDateMode === 'schedule' ? ' on' : ''}`} onClick={() => setDueDateMode('schedule')}>Link to Schedule</button>
          </div>
        </div>

        <div className="g3" style={{ marginTop: 12 }}>
          <div>
            <label className="fl">Invoice date</label>
            <input type="date" className="fi" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="fl">Payment terms</label>
            <select className="fi" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
              <option>Due upon receipt</option>
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Net 60</option>
            </select>
          </div>
          <div>
            <label className="fl">Due date</label>
            <div style={{ padding: '8px 0', fontSize: 14, color: 'var(--g700)', fontWeight: 500 }}>{dueDate ? fmtDate(dueDate) : '--'}</div>
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">Client price</div>
        <div style={{ marginBottom: 14 }}>
          <label className="fl">Taxes</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <select className="fi" style={{ width: 220, flexShrink: 0 }} defaultValue="state">
              <option value="state">{TAX_AGENCY} ----- {(TAX_RATE * 100).toFixed(3)}%</option>
            </select>
            <button className="btn-g">Manage</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="tabs">
            <button type="button" className={`tab${priceMode === 'flatFee' ? ' on' : ''}`} onClick={() => setPriceMode('flatFee')}>Flat fee</button>
            <button type="button" className={`tab${priceMode === 'lineItems' ? ' on' : ''}`} onClick={() => setPriceMode('lineItems')}>Line items</button>
          </div>

          {priceMode === 'lineItems' && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div>
                <label className="fl">Adjust % markup</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    className="fi"
                    style={{ width: 80 }}
                    value={markupAdjustPct || ''}
                    placeholder="0.00"
                    onChange={e => setMarkupAdjustPct(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ color: 'var(--g500)' }}>%</span>
                </div>
              </div>
              <button className="btn-g" onClick={applyMarkupToAll}>Apply all</button>
            </div>
          )}
        </div>

        {priceMode === 'flatFee' && (
          <div style={{ marginTop: 16 }}>
            <label className="fl">Invoice Amount</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 240 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--g600)' }}>$</span>
              <input type="number" className="fi" style={{ fontSize: 18, fontWeight: 700, textAlign: 'right' }} value={flatFeeAmount || ''} placeholder="0.00" onChange={e => setFlatFeeAmount(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}
      </div>

      {priceMode === 'lineItems' && (
        <div className="sec" style={{ paddingBottom: 0 }}>
          <div className="lt-scroll">
            <table className="lt">
              <thead>
                <tr>
                  <th>Items</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Unit cost</th>
                  <th style={{ textAlign: 'center' }}>Markup</th>
                  <th style={{ textAlign: 'right' }}>Client price</th>
                  <th style={{ textAlign: 'center' }}>Taxable</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div><input className="cell-input" style={{ fontWeight: 600 }} value={l.item} onChange={e => updateLine(l.id, { item: e.target.value })} /></div>
                      <div><input className="cell-input" style={{ fontSize: 11, color: 'var(--g400)' }} value={l.costCode} onChange={e => updateLine(l.id, { costCode: e.target.value })} /></div>
                    </td>
                    <td style={{ textAlign: 'center' }}><input className="cell-input" type="number" style={{ textAlign: 'center', width: 55 }} value={l.qty} onChange={e => updateLine(l.id, { qty: parseFloat(e.target.value) || 0 })} /></td>
                    <td style={{ textAlign: 'right' }}>
                      {l.unitCost != null
                        ? <input className="cell-input" type="number" style={{ textAlign: 'right', width: 90 }} value={l.unitCost} onChange={e => updateLine(l.id, { unitCost: parseFloat(e.target.value) || 0 })} />
                        : <span style={{ color: 'var(--g300)' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}><input className="cell-input" type="number" style={{ textAlign: 'center', width: 70 }} value={l.markup ?? 0} onChange={e => updateLine(l.id, { markup: parseFloat(e.target.value) || 0 })} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>${fmt(linePrice(l))}</td>
                    {/* Taxable is the builder's call per line: labor, permits
                        and fees are commonly exempt where materials are not.
                        It drives the client-facing Tax column. */}
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={l.taxable} onChange={e => updateLine(l.id, { taxable: e.target.checked })} aria-label={`${l.item || 'Line'} taxable`} />
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13, color: l.taxable ? 'var(--g700)' : 'var(--g300)' }}>
                      {l.taxable ? `$${fmt(lineTax(l))}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 0' }}>
            {/* A hand-added line has no upstream record behind it. It bills
                like a contract line either way, so it files under the source
                that contract bills from. */}
            <button className="add-btn" onClick={() => setLines(prev => [...prev, { id: `l${Date.now()}`, item: '', costCode: '', group: 'Other', qty: 1, unitCost: 0, markup: 0, taxable: true, source: contractType === 'open-book' ? 'bill' : 'estimate' }])}>
              <span className="add-icon">+</span> Item
            </button>
          </div>
          <div className="totals-row" style={{ margin: '0 -24px', padding: '12px 24px' }}>
            <span>Total price</span>
            <span style={{ fontWeight: 700 }}>${fmt(totalPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );

  // The canvas toolbar's delivery line: who last opened the invoice and when,
  // or how long it's been sitting unopened. Print and Email share one send
  // event in this prototype — a real system might track opens per channel
  // separately, but "released" is a single act from the builder's side, so
  // one status reads truer than inventing two. Naming the viewer matters
  // because a job's portal link is often shared among several contacts
  // (owner, co-owner, PM), so "viewed" alone doesn't say who actually saw it.
  const deliveryLine = viewedAt
    ? `Viewed by ${viewedBy} · ${formatDateTime(viewedAt)}`
    : sentAt
    ? `Sent ${formatDateTime(sentAt)} · not yet viewed`
    : 'Not yet sent';

  const renderPrintDoc = () => (
    <div className={"cpi-paper" + (orientation === 'landscape' ? ' cpi-paper-landscape' : '')}>
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
        <h2 className="cpi-doc-title">{title || 'Invoice'}</h2>
        <div className="cpi-summary-row">
          <div className="cpi-billto">
            <div className="cpi-lbl">Bill to</div>
            <div className="cpi-bill-name">{billTo.name}</div>
            <div className="cpi-bill-sub">{billTo.role} · Acct {billTo.account}</div>
            <div className="cpi-bill-sub">{billTo.email}</div>
            <div className="cpi-bill-sub">{billTo.phone}</div>
          </div>
          <div className="cpi-summary-values">
            <div><span>Invoice date:</span><strong>{invoiceDate ? fmtDate(invoiceDate) : '--'}</strong></div>
            <div><span>Invoice ID:</span><strong>Li-{idNumber || '0111'}</strong></div>
            <div><span>Due date:</span><strong>{dueDate ? fmtDate(dueDate) : '--'}</strong></div>
            {/* Amount due is the header's job because it is not this
                invoice's price: prior payments and credits move it. Showing
                the deposit beside it explains the gap between the two
                figures without repeating the breakdown at the foot. */}
            {appliedDeposit > 0 && (
              <>
                <div><span>Invoice total:</span><strong>${fmt(totalPrice)}</strong></div>
                <div><span>Applied deposit:</span><strong>-${fmt(appliedDeposit)}</strong></div>
              </>
            )}
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
          /* One grid for the whole invoice. Estimate/cost groups and change
             orders are both title-plus-nested-lines blocks in the same table,
             so the client reads one column of prices down to one total
             instead of reconciling a second table below the first. */
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
                  {standardGroups
                    ? standardGroups.flatMap(g => [
                        renderGroupRow(`grp-${g.name}`, g.name, g.subtotal, 'cpi-grp-row', g.tax),
                        ...g.items.map(l => renderLineRow(l, 1)),
                      ])
                    : standardLines.map(l => renderLineRow(l, 0))}

                  {changeOrderGroups.flatMap(group => {
                    const groupTotal = group.lines.reduce((s, l) => s + displayLinePrice(l), 0);
                    const groupTax = group.lines.reduce((s, l) => s + lineTax(l), 0);
                    /* Collapsed, the change order stops being a heading over
                       its lines and becomes the billed line itself, so it
                       drops the group row's shading and reads like any other
                       row in the grid. */
                    if (hideChangeOrderLines) {
                      return [renderGroupRow(`co-${group.title}`, group.title, groupTotal, 'cpi-co-collapsed', groupTax)];
                    }
                    return [
                      renderGroupRow(`co-${group.title}`, group.title, groupTotal, 'cpi-grp-row', groupTax),
                      /* "All line items" is the flat view, so its lines sit
                         at the margin even under a change-order title —
                         nothing else on the page is indented to align to. */
                      ...group.lines.map(l => renderLineRow(l, standardGroups ? 1 : 0)),
                    ];
                  })}

                  <tr className="cpi-total-row">
                    {/* The grid totals what the grid shows: true cost when the
                        fee is stated below it, the marked-up price otherwise. */}
                    <td>{feeOnOwnLine ? 'Cost of work:' : 'Totals:'}</td>
                    {showQty && <td></td>}
                    {showUnitCost && <td></td>}
                    {showMarkup && <td className="cpi-r">${fmt(feeTotal)}</td>}
                    {showPrice && <td className="cpi-r">${fmt(feeOnOwnLine ? costOfWork : subtotal)}</td>}
                    {showTax && <td className="cpi-r">${fmt(totalTax)}</td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="cpi-hidden-note">Line item detail is hidden from the client for this invoice.</div>
        )}

        {/* The price breakdown follows the house pattern: a bold roll-up line
            with its components indented and muted underneath it, the way
            Total tax carries the individual tax agency. Total price is the
            shaded bottom row, because it is the price of this invoice.
            Amount due is deliberately NOT repeated here - it can differ from
            this invoice's price once prior payments are applied, so it lives
            in the header summary and this block stays the invoice's own
            arithmetic. */}
        <div className="cpi-totals">
          <div className="cpi-totals-line cpi-totals-parent"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          {/* Cost of work and the fee are what the subtotal is made of, so
              they read as its components rather than as rows above it. This is
              the layout AJ Epding builds by hand today and the one QBO gives
              cost-plus builders. Suppressed when there is no fee to state, so
              a zero row never appears. */}
          {feeOnOwnLine && feeTotal > 0 && (
            <>
              <div className="cpi-totals-line cpi-totals-sub"><span>Cost of work</span><span>${fmt(costOfWork)}</span></div>
              <div className="cpi-totals-line cpi-totals-sub"><span>{feeLabel || 'Builder fee'}</span><span>${fmt(feeTotal)}</span></div>
            </>
          )}
          {/* Tax always rolls up here, whatever the line-item table shows.
              Hiding the per-line Tax column is a question about how much
              detail the client reads on each line, not about whether tax was
              charged: the client still has to be told the tax on what they
              owe. So this block never branches on showTax. */}
          <div className="cpi-totals-line cpi-totals-parent"><span>Total tax</span><span>${fmt(totalTax)}</span></div>
          <div className="cpi-totals-line cpi-totals-sub"><span>{TAX_AGENCY} ({(TAX_RATE * 100).toFixed(3)}%)</span><span>${fmt(totalTax)}</span></div>
          {/* With the column hidden the client can no longer see which lines
              were taxed, so the breakdown says what the rate was applied to.
              Only worth saying when some lines are exempt. */}
          {!showTax && taxableBase < subtotal && (
            <div className="cpi-totals-line cpi-totals-sub"><span>Taxed on</span><span>${fmt(taxableBase)}</span></div>
          )}
          <div className="cpi-totals-line cpi-totals-heading"><span>Total price</span><strong>${fmt(totalPrice)}</strong></div>
        </div>

        {closingText && (
          <section className="cpi-section">
            <h3 className="cpi-section-title">Closing text</h3>
            <div className="cpi-block-body">
              Payment is due within 30 days of the invoice date. Please reference invoice Li-{idNumber || '0111'}
              {' '}with your payment. We accept check, ACH transfer, or online payment through the link
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
  );

  // The email a client actually opens first — the short payment-request
  // notification, not the full invoice document. Matches BT's actual invoice
  // email pattern: a plain heading, a one-line ask, a pay button, and a
  // bordered summary card — rather than the fuller branded layout the print
  // document uses.
  const renderEmailDoc = () => (
    <div className="cpi-email-doc">
      <h2 className="cpi-email-h1">Payment requested</h2>
      <p className="cpi-email-p">Hi {billTo.name.split(' ')[0]},</p>
      <p className="cpi-email-p">
        <strong>Boogie Construction</strong> requests a payment of <strong>${fmt(amountDue)}</strong> for <strong>Amy - selections test job</strong>.
      </p>
      {/* The builder's own message reads as its own paragraph now that the
          generic "Click below to view details and make payment" line is gone
          — nothing to space it away from or compete with. */}
      {emailMessage && <p className="cpi-email-p cpi-email-p-message">{emailMessage}</p>}

      <button type="button" className="cpi-email-cta">View and pay</button>

      <div className="cpi-email-card">
        <div className="cpi-email-row">
          <span className="cpi-email-row-lbl">Invoice ID</span>
          <span className="cpi-email-row-val">Li-{idNumber || '0111'}</span>
        </div>
        <div className="cpi-email-row">
          <span className="cpi-email-row-lbl">Amount due</span>
          <span className="cpi-email-row-val">${fmt(amountDue)}</span>
        </div>
        <div className="cpi-email-row">
          <span className="cpi-email-row-lbl">Due by</span>
          <span className="cpi-email-row-val">{dueDate ? fmtDate(dueDate) : '--'} at 11:59 PM</span>
        </div>
      </div>

      <div className="cpi-email-footer">
        <p>
          You received this email because Boogie Construction uses Buildertrend for project communication.
          If you need help getting started, visit Buildertrend FAQs.
        </p>
        <div className="cpi-email-footer-rule" />
        <div className="cpi-email-footer-link">Contact Buildertrend</div>
        <div className="cpi-email-footer-link">Privacy Policy</div>
      </div>
    </div>
  );

  const renderClientPreviewTab = () => (
    <div className="cpi-3pane">
      {/* Center — the document canvas. A Print/Email toggle sits in its own
          toolbar rather than a left rail of document cards: there's one
          invoice record, not several drafts to pick between, so a segmented
          view switch (matching the reference proposal's Print/Web toggle)
          fits better than a list. */}
      <div className="cpi-canvas-wrap">
        <div className="cpi-canvas-toolbar">
          <div className="cpi-seg">
            <button type="button" className={"cpi-seg-btn" + (selectedDoc === 'print' ? ' on' : '')} onClick={() => setSelectedDoc('print')}>Print</button>
            <button type="button" className={"cpi-seg-btn" + (selectedDoc === 'email' ? ' on' : '')} onClick={() => setSelectedDoc('email')}>Email</button>
          </div>

          {/* Narrow only: opens the rail as a sheet over the document. */}
          <button
            type="button"
            className="cpi-customize-btn"
            onClick={() => setCustomizeSheetOpen(true)}
            aria-expanded={customizeSheetOpen}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 6h9M15 6h3M2 14h3M9 14h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="13" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="7" cy="14" r="2.1" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            Customize
          </button>

          <div className={"cpi-doc-status" + (viewedAt ? ' is-viewed' : sentAt ? ' is-sent' : ' is-draft')} style={{ marginLeft: 'auto' }}>
            <span className="cpi-doc-status-dot" />
            {deliveryLine}
          </div>

          {/* Which contract the job bills under, at the right end of the
              toolbar rather than beside Print/Email. Print/Email is a view
              switch the builder flips while composing; this is the job's
              setup, so it sits apart from it and opens from a chevron that
              names the current answer. The menu aligns to the right edge
              because the trigger is now the last thing in the bar. */}
          <div className="cpi-contract-menu cpi-contract-menu-end" ref={contractMenuRef}>
            <button
              type="button"
              className="cpi-contract-trigger"
              aria-haspopup="menu"
              aria-expanded={contractMenuOpen}
              onClick={() => setContractMenuOpen(o => !o)}
            >
              {contractType === 'open-book' ? 'Open book' : 'Fixed price'}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ transform: contractMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {contractMenuOpen && (
              <div className="cpi-contract-pop cpi-contract-pop-end" role="menu">
                {CONTRACT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={contractType === opt.value}
                    className={"cpi-contract-item" + (contractType === opt.value ? ' on' : '')}
                    onClick={() => { selectContractType(opt.value); setContractMenuOpen(false); }}
                  >
                    <span className="cpi-contract-item-name">{opt.label}</span>
                    <span className="cpi-contract-item-sub">{opt.sources}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="cpi-canvas">
          {selectedDoc === 'print' ? renderPrintDoc() : renderEmailDoc()}
        </div>
      </div>

      {/* Scrim: only rendered on narrow screens, where the rail is a sheet
          over the document rather than a column beside it. */}
      {customizeSheetOpen && <div className="cpi-sheet-scrim" onClick={() => setCustomizeSheetOpen(false)} />}

      {/* Right rail — everything that edits what the client sees. Which
          sections show depends on the document open in the canvas: Print
          gets layout/display/general; Email gets the message it can carry
          plus who it's addressed to, since the email isn't a layout the
          builder is arranging, just a short note attached to a fixed template. */}
      <aside
        className={"cpi-rail cpi-rail-right" + (customizeSheetOpen ? ' is-sheet-open' : '')}
        aria-label="Customize invoice"
      >
        {/* Sheet header: a handle to grab and a way out. Hidden at desktop
            width, where the rail is just a column and needs neither. */}
        <div className="cpi-sheet-head">
          <span className="cpi-sheet-title">Customize invoice</span>
          <button
            type="button"
            className="cpi-sheet-close"
            onClick={() => setCustomizeSheetOpen(false)}
            aria-label="Close customize"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="cpi-rail-fields">
          <RailSection id="recipient" title="Recipient" open={!!openSections.recipient} onToggle={toggleSection}>
            <label className="fl" htmlFor="cpi-billto">Bill to</label>
            <select id="cpi-billto" className="fi" value={billToId} onChange={e => setBillToId(e.target.value)}>
              {CONTACTS.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
              ))}
            </select>
            <div className="cpi-rail-hint">{billTo.email}</div>
          </RailSection>

          {selectedDoc === 'print' ? (
            <>
              <RailSection id="layout" title="Layout" open={!!openSections.layout} onToggle={toggleSection}>
                <div className="cpi-rail-sublabel">Page layout</div>
                <div className="cpi-seg" style={{ width: '100%' }}>
                  <button type="button" className={"cpi-seg-btn" + (orientation === 'portrait' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setOrientation('portrait')}>Vertical</button>
                  <button type="button" className={"cpi-seg-btn" + (orientation === 'landscape' ? ' on' : '')} style={{ flex: 1 }} onClick={() => setOrientation('landscape')}>Horizontal</button>
                </div>
              </RailSection>

              <RailSection id="display" title="Display to client" open={!!openSections.display} onToggle={toggleSection}>
                <label className="cpi-check">
                  <input type="checkbox" checked={hideLineItems} onChange={e => setHideLineItems(e.target.checked)} />
                  <span>Hide line items</span>
                </label>

                {!hideLineItems && (
                  <>
                    <div className="cpi-rail-sublabel" style={{ marginTop: 4 }}>Group line items by</div>
                    <div className="client-group-toggle" role="tablist" aria-label="Group line items for client">
                      {/* Fixed price bills the estimate, so "By estimate" is
                          the grouping that matches the proposal the client
                          approved. Open book has no estimate behind its
                          lines, so it offers cost source in that slot. */}
                      {contractType === 'open-book' ? (
                        <button type="button" className={"client-group-tab" + (groupBy === 'source' ? ' on' : '')} onClick={() => setGroupBy('source')} aria-selected={groupBy === 'source'}>By cost source</button>
                      ) : (
                        <button type="button" className={"client-group-tab" + (groupBy === 'estimate' ? ' on' : '')} onClick={() => setGroupBy('estimate')} aria-selected={groupBy === 'estimate'}>By estimate</button>
                      )}
                      <button type="button" className={"client-group-tab" + (groupBy === 'costcode' ? ' on' : '')} onClick={() => setGroupBy('costcode')} aria-selected={groupBy === 'costcode'}>By cost code</button>
                      <button type="button" className={"client-group-tab" + (groupBy === 'all' ? ' on' : '')} onClick={() => setGroupBy('all')} aria-selected={groupBy === 'all'}>All line items</button>
                    </div>

                    <label className="cpi-check" style={{ marginTop: 4 }}>
                      <input type="checkbox" checked={showCostCodes} onChange={e => setShowCostCodes(e.target.checked)} />
                      <span>Show cost codes <span className="cpi-info" title="Your accounting codes under each line item. Turn off to show the client only the item description.">i</span></span>
                    </label>

                    {/* Open book only: the client is entitled to see where
                        their money went, so the document can name who was
                        paid. Meaningless on fixed price, where no line
                        traces to a vendor. */}
                    {contractType === 'open-book' && (
                      <label className="cpi-check">
                        <input type="checkbox" checked={showVendor} onChange={e => setShowVendor(e.target.checked)} />
                        <span>Show vendor and employee names</span>
                      </label>
                    )}

                    {/* Open book only: cost-plus builders describe their
                        contract to the client as true cost plus a stated fee,
                        and today's invoice can only express it as markup baked
                        into each line's price. This states it the way the
                        contract does. Fixed price has no fee to separate, so
                        the control isn't there. */}
                    {contractType === 'open-book' && (
                      <>
                        <div className="cpi-rail-sublabel" style={{ marginTop: 4 }}>Where the fee shows</div>
                        <div className="client-group-tabs">
                          <button type="button" className={"client-group-tab" + (feeDisplay === 'inLine' ? ' on' : '')} onClick={() => setFeeDisplay('inLine')} aria-selected={feeDisplay === 'inLine'}>In each line</button>
                          <button type="button" className={"client-group-tab" + (feeDisplay === 'oneLine' ? ' on' : '')} onClick={() => setFeeDisplay('oneLine')} aria-selected={feeDisplay === 'oneLine'}>Its own line</button>
                        </div>
                        <div className="cpi-rail-hint">
                          {feeDisplay === 'oneLine'
                            ? 'Lines show what you paid. Your fee is stated once above the subtotal. The total does not change.'
                            : 'Each line price includes its own markup. Your fee is not stated separately.'}
                        </div>
                        {feeDisplay === 'oneLine' && (
                          <input
                            className="fi"
                            style={{ marginTop: 6 }}
                            value={feeLabel}
                            onChange={e => setFeeLabel(e.target.value)}
                            placeholder="Builder fee"
                            aria-label="Fee label shown to the client"
                          />
                        )}
                      </>
                    )}

                    <div className="cpi-rail-sublabel" style={{ marginTop: 4 }}>Columns shown</div>
                    <div className="cpi-chips">
                      <span className="cpi-chip cpi-chip-locked">Items</span>
                      {pickableCols.filter(k => cols.includes(k)).map(k => (
                        <span key={k} className="cpi-chip">
                          {COL_LABELS[k]}
                          <button className="cpi-chip-x" onClick={() => removeCol(k)} title={`Remove ${COL_LABELS[k]}`}>×</button>
                        </span>
                      ))}
                      {availableToAdd.map(k => (
                        <button key={k} type="button" className="cpi-chip cpi-chip-add" onClick={() => setCols(prev => [...prev, k])}>
                          + {COL_LABELS[k]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </RailSection>

              {/* Change orders get their own section rather than another
                  checkbox under Display to client: they're a distinct record
                  on the invoice, already approved at their own price, so how
                  much of one to show is its own question. Only shown when
                  the invoice actually carries one and lines are visible. */}
              {!hideLineItems && changeOrderGroups.length > 0 && (
                <RailSection id="change-orders" title="Change orders" open={!!openSections['change-orders']} onToggle={toggleSection}>
                  <label className="cpi-check">
                    <input type="checkbox" checked={hideChangeOrderLines} onChange={e => setHideChangeOrderLines(e.target.checked)} />
                    <span>Hide change order line items <span className="cpi-info" title="Shows each change order as its title and approved total, without listing what's inside it">i</span></span>
                  </label>
                </RailSection>
              )}

              <RailSection id="general" title="General information" open={!!openSections.general} onToggle={toggleSection}>
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
              </RailSection>
            </>
          ) : (
            <RailSection id="email-content" title="Email message" open={!!openSections['email-content']} onToggle={toggleSection}>
              <div className="cpi-rail-hint" style={{ marginBottom: 4 }}>
                Added below the payment request, before the "View and pay" button.
              </div>
              <textarea
                className="fi"
                style={{ resize: 'vertical', minHeight: 90 }}
                placeholder="Add a note for the client…"
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
              />
            </RailSection>
          )}
        </div>

        {/* Defaults live at the foot of the rail, not the page footer: the
            page footer's Cancel/Save/Send act on the invoice and are shared
            with the Details tab, while these act on the presentation
            settings directly above them. Saving here sets what every new
            invoice opens with, so one builder's formatting work carries
            forward instead of being redone per invoice. */}
        {selectedDoc === 'print' && (
          <div className="cpi-rail-footer">
            {savedAsDefault && (
              <div className="cpi-rail-saved">✓ Saved as the default for new invoices</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-s"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setHideLineItems(false);
                  setHideChangeOrderLines(false);
                  setGroupBy(contractType === 'open-book' ? 'source' : 'estimate');
                  setCols(['items', 'tax', 'unitCost', 'quantity', 'clientPrice', 'markup']);
                  setQrCode(false);
                  setCustomFields(true);
                  setShowVendor(false);
                  setShowCostCodes(true);
                  setFeeDisplay('inLine');
                  setFeeLabel('Builder fee');
                  setIntroText(true);
                  setClosingText(true);
                  setOrientation('portrait');
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-p"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={savedAsDefault}
                onClick={() => setSavedSignature(settingsSignature)}
              >
                Set as default
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <div className="cpi-shell">
      {/* Modal-style header */}
      <div className="cpi-titlebar">
        <div>
          <div className="cpi-breadcrumb">Amy - selections test job</div>
          <div className="cpi-title">
            {title || 'Invoice'}
            {/* A real invoice status, not a delivery state. "Viewed" isn't
                one of these — whether the client opened it is delivery
                detail, and it already reads in full ("Viewed by … · date")
                on the preview canvas, where the document it describes is. */}
            <span className={"status " + INVOICE_STATUS_CLASS[invoiceStatus]} style={{ marginLeft: 10 }}>
              {invoiceStatus}
            </span>
          </div>
        </div>
        <div className="cpi-title-actions">
          <button className="cpi-icon-btn" title="Share">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.25485 1.51548C4.03255 1.39268 3.77812 1.34049 3.52542 1.36588C3.27273 1.39127 3.03377 1.49303 2.84035 1.65761C2.64692 1.82219 2.50822 2.04178 2.4427 2.28715C2.37723 2.53235 2.38812 2.79215 2.4736 3.03111L4.95804 10.0001L2.47328 16.9699C2.38793 17.2087 2.37726 17.4679 2.4427 17.713C2.50822 17.9583 2.64692 18.1779 2.84035 18.3425C3.03377 18.5071 3.27273 18.6088 3.52542 18.6342C3.77812 18.6596 4.03255 18.6074 4.25485 18.4846L17.4505 11.0938L17.4522 11.0929C17.6468 10.9848 17.8091 10.8267 17.9221 10.6349C18.0355 10.4425 18.0954 10.2233 18.0954 10.0001C18.0954 9.77677 18.0355 9.55756 17.9221 9.36521C17.8091 9.17341 17.6468 9.0153 17.4522 8.90723L17.4505 8.9063L4.25804 1.51725L4.25485 1.51548ZM16.8425 9.99847L17.1479 9.45318L16.8454 10.0001L16.8425 10.0016L3.65039 17.3905L6.06228 10.6251H10.6245C10.9697 10.6251 11.2495 10.3452 11.2495 10.0001C11.2495 9.65487 10.9697 9.37505 10.6245 9.37505H6.06228L3.6507 2.61049L3.65039 2.60962L16.8425 9.99847Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="cpi-icon-btn" title="Comments">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M4 5h12v8H8l-4 3V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          </button>
          <button className="cpi-icon-btn" title="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="cpi-tabs-row">
        <div role="tablist" aria-label="Invoice view" style={{ display: 'flex' }}>
          <button type="button" role="tab" aria-selected={activeTab === 'details'} className={"preview-tab" + (activeTab === 'details' ? ' on' : '')} onClick={() => setActiveTab('details')}>Details</button>
          <button type="button" role="tab" aria-selected={activeTab === 'client-preview'} className={"preview-tab" + (activeTab === 'client-preview' ? ' on' : '')} onClick={() => setActiveTab('client-preview')}>Client preview</button>
        </div>
      </div>

      <div className={"cpi-body" + (activeTab === 'details' ? ' cpi-body-details' : ' cpi-body-preview')}>
        {activeTab === 'details' ? renderDetailsTab() : renderClientPreviewTab()}
      </div>

      <div className="cpi-footer">
        {activeTab === 'client-preview' && (
          <button className="btn btn-s cpi-foot-wide" style={{ marginRight: 'auto' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 8V4h8v4M6 15H4v-4h12v4h-2M6 12h8v4H6v-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            Print
          </button>
        )}

        {/* Narrow only: the secondary actions collapse behind an ellipsis so
            the primary one keeps a full-width, thumb-sized target. */}
        <div className="cpi-foot-more" ref={footerMenuRef}>
          <button
            type="button"
            className="btn btn-s cpi-foot-more-btn"
            aria-haspopup="menu"
            aria-expanded={footerMenuOpen}
            aria-label="More actions"
            onClick={() => setFooterMenuOpen(o => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="16" cy="10" r="1.6" />
            </svg>
          </button>
          {footerMenuOpen && (
            <div className="cpi-foot-pop" role="menu">
              {activeTab === 'client-preview' && (
                <button type="button" role="menuitem" className="cpi-foot-pop-item" onClick={() => setFooterMenuOpen(false)}>Print</button>
              )}
              <button type="button" role="menuitem" className="cpi-foot-pop-item" onClick={() => setFooterMenuOpen(false)}>Save</button>
              <button type="button" role="menuitem" className="cpi-foot-pop-item" onClick={() => setFooterMenuOpen(false)}>Cancel</button>
            </div>
          )}
        </div>

        <button className="btn btn-s cpi-foot-wide">Cancel</button>
        <button className="btn btn-s cpi-foot-wide">Save</button>
        {/* Once it's out the door, the next thing that happens to an invoice
            is payment, so Send gives way to the action that moves it to
            Paid rather than offering to send it a second time. */}
        {sentAt && !paidAt ? (
          <button className="btn btn-p cpi-foot-primary" onClick={() => setPaidAt(new Date())}>
            Record payment
          </button>
        ) : !sentAt ? (
          <button
            className="btn btn-p cpi-foot-primary"
            onClick={() => {
              setSentAt(new Date());
              setViewedAt(null);
              setViewedBy(null);
              alert(`Invoice Li-${idNumber || '0111'} sent to ${billTo.name} (${billTo.email})`);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M17 3L9 11M17 3l-5 14-3-6-6-3 14-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Send
          </button>
        ) : null}
      </div>
    </div>
  );
}
