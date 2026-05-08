import { useMemo, useState } from 'react';
import { INVOICE_SELECTION_SCENARIOS, INVOICE_STANDALONE_SELECTIONS } from '../selectionsData';
import { BTRelatedItemTag, RelatedItemType } from '../bds';

type RowStatus = 'Pending' | 'Approved' | 'Declined';

interface InvoiceRef { subject: string; }

interface SelectionOption {
  id: string;
  title: string;
  category?: string;
  location?: string;
  clientPrice: number;
  approvedPrice: number | null;
  invoicedAmount: number;
  invoiceRef?: InvoiceRef;
  status: RowStatus;
}

interface AllowanceGroup {
  id: string;
  name: string;
  fullName: string;
  category?: string;
  location?: string;
  optionCount: number;
  clientPrice: number;
  approvedPrice: number;
  invoicedAmount: number;
  invoiceRef?: InvoiceRef;
  options: SelectionOption[];
}

type SelectionRow = SelectionOption | AllowanceGroup;
type ViewMode = 'allowance' | 'location' | 'vendor';

function isAllowance(row: SelectionRow): row is AllowanceGroup {
  return 'options' in row;
}

function statusFromScenario(s: 'approved' | 'invoiced' | 'declined' | 'pending' | string): RowStatus {
  if (s === 'declined') return 'Declined';
  if (s === 'pending') return 'Pending';
  return 'Approved';
}

const LOCATION_MAP: Record<string, string> = {
  'ma-5': 'Master Bath',
  'ma-6': 'Living Room',
  'ma-8': 'Whole house',
  'ma-1': 'Kitchen',
  'ma-2': 'Living areas',
  'ma-7': 'Master Bath',
  'ms-12': 'Master Bath',
  'ms-13': 'Master Bath',
  'ms-14': 'Living Room',
  'ms-19': 'Whole house',
  'ms-1': 'Kitchen',
  'ms-2': 'Kitchen',
  'ms-4': 'Kitchen',
  'ms-5': 'Living Room',
  'ms-6': 'Entryway',
  'ms-16': 'Master Bath',
  'ms-17': 'Master Bath',
  'ms-18': 'Master Bath',
  'ss-1': 'Front entry',
  'ss-2': 'Exterior',
};

const INVOICE_REF_SEED: Record<string, InvoiceRef> = {
  'ms-19': { subject: '1' },
  'ma-1':  { subject: '2' },
  'ma-2':  { subject: '3' },
  'ms-16': { subject: '4' },
  'ms-17': { subject: 'Draft 1' },
};

function rollupInvoiceRef(refs: InvoiceRef[]): InvoiceRef | undefined {
  if (refs.length === 0) return undefined;
  const allSame = refs.every(r => r.subject === refs[0].subject);
  if (allSame) return refs[0];
  return { subject: 'Multiple' };
}

const vendorFromCostCode = (cc: string): string => {
  const idx = cc.indexOf(' - ');
  return idx >= 0 ? cc.slice(idx + 3) : cc;
};

const mockData: SelectionRow[] = [
  ...INVOICE_STANDALONE_SELECTIONS.map((ss): SelectionOption => ({
    id: ss.id,
    title: ss.name,
    category: vendorFromCostCode(ss.costCode),
    location: LOCATION_MAP[ss.id] || '—',
    clientPrice: ss.approvedPrice,
    approvedPrice: ss.approvedPrice,
    invoicedAmount: 0,
    status: 'Approved',
  })),
  ...INVOICE_SELECTION_SCENARIOS.map((ma): AllowanceGroup => {
    const vendor = vendorFromCostCode(ma.costCode);
    const options = ma.selections.map((sel): SelectionOption => {
      const invoicedAmount = sel.status === 'invoiced' ? sel.approvedPrice : 0;
      return {
        id: sel.id,
        title: sel.name,
        category: vendor,
        location: LOCATION_MAP[sel.id] || '—',
        clientPrice: sel.originalPrice,
        approvedPrice: sel.approvedPrice,
        invoicedAmount,
        invoiceRef: invoicedAmount > 0 ? INVOICE_REF_SEED[sel.id] : undefined,
        status: statusFromScenario(sel.status as string),
      };
    });
    const invoicedFromSelections = options.reduce((s, o) => s + o.invoicedAmount, 0);
    const usingChildren = invoicedFromSelections > 0;
    const childInvoiceRefs = options
      .map(o => o.invoiceRef)
      .filter((r): r is InvoiceRef => !!r);
    return {
      id: ma.id,
      name: ma.name.replace(/ Allowance$/, ''),
      fullName: ma.name,
      category: vendor,
      location: LOCATION_MAP[ma.id] || '—',
      optionCount: ma.selections.length,
      clientPrice: ma.budgetAmount,
      approvedPrice: ma.selections.reduce((s, sel) => s + sel.approvedPrice, 0),
      invoicedAmount: usingChildren ? invoicedFromSelections : ma.previouslyInvoiced,
      invoiceRef: usingChildren
        ? rollupInvoiceRef(childInvoiceRefs)
        : (ma.previouslyInvoiced > 0 ? INVOICE_REF_SEED[ma.id] : undefined),
      options,
    };
  }),
];

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

const StatusBadge = ({ status }: { status: string }) => {
  const cls = status === 'Approved' || status === 'Completed'
    ? 'sp-badge-success'
    : status === 'Pending'
      ? 'sp-badge-warning'
      : status === 'Open'
        ? 'sp-badge-default'
        : 'sp-badge-danger';
  return <span className={`sp-badge ${cls}`}>{status}</span>;
};

const InvoicedCell = ({ amount, invoiceRef, onOpen }: { amount: number; invoiceRef?: InvoiceRef; onOpen?: () => void }) => {
  if (amount <= 0 || !invoiceRef) return <span style={{ color: 'var(--g400)' }}>—</span>;
  return (
    <BTRelatedItemTag
      itemType={RelatedItemType.CustomerInvoice}
      subject={invoiceRef.subject}
      onClick={onOpen}
    />
  );
};

const AllowanceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25928 3.20305C1.32316 3.6243 0.5 4.30937 0.5 5.25V7.75C0.5 8.69103 1.32264 9.37614 2.25891 9.79738C2.88695 10.0799 3.6538 10.2883 4.5 10.4019V10.75C4.5 11.691 5.32264 12.3761 6.25891 12.7974C7.24189 13.2396 8.56489 13.5 10 13.5C11.4351 13.5 12.7581 13.2396 13.7411 12.7974C14.6774 12.3761 15.5 11.691 15.5 10.75V8.25655L15.5 8.24998C15.5 7.42295 14.8571 6.79464 14.0945 6.37957C13.4062 6.00494 12.5055 5.7344 11.5 5.59774V5.25C11.5 4.30937 10.6768 3.6243 9.74072 3.20305C8.75766 2.76067 7.43467 2.5 6 2.5C4.56533 2.5 3.24234 2.76067 2.25928 3.20305ZM2.66965 4.11497C1.79613 4.50806 1.5 4.94799 1.5 5.25C1.5 5.55201 1.79613 5.99194 2.66965 6.38503C3.06609 6.56343 3.54313 6.71216 4.07865 6.81865C4.09098 6.8206 4.10317 6.823 4.11519 6.82583C4.68689 6.93692 5.32401 7 6 7C6.67599 7 7.31311 6.93692 7.88481 6.82583C7.89683 6.823 7.90902 6.8206 7.92135 6.81865C8.45687 6.71216 8.93391 6.56343 9.33035 6.38503C10.2039 5.99194 10.5 5.55201 10.5 5.25C10.5 4.94799 10.2039 4.50806 9.33035 4.11497C8.50376 3.74301 7.32675 3.5 6 3.5C4.67325 3.5 3.49624 3.74301 2.66965 4.11497ZM7.5 7.90171C7.02174 7.966 6.51815 8 6 8C5.48185 8 4.97826 7.966 4.5 7.90171V9.39193C4.9678 9.46159 5.472 9.5 6 9.5C6.528 9.5 7.0322 9.46159 7.5 9.39193V7.90171ZM8.5 9.18152V7.71464C8.95353 7.60388 9.37115 7.46326 9.74072 7.29695C10.0086 7.1764 10.2673 7.03424 10.5 6.87067V7.75C10.5 8.05272 10.2039 8.49261 9.33079 8.88543C9.08347 8.9967 8.80475 9.09642 8.5 9.18152ZM7.5 10.7151C7.21945 10.6471 6.95296 10.5679 6.70349 10.4789C6.47276 10.4928 6.23792 10.5 6 10.5C5.83167 10.5 5.66488 10.4964 5.5 10.4894V10.75C5.5 11.0527 5.79611 11.4926 6.66921 11.8854C6.91653 11.9967 7.19525 12.0964 7.5 12.1815V10.7151ZM8.5 12.3919V10.9015C8.97789 10.9657 9.48154 11 10 11C10.5182 11 11.0218 10.966 11.5 10.9018V12.3919C11.0322 12.4616 10.528 12.5 10 12.5C9.472 12.5 8.9678 12.4616 8.5 12.3919ZM3.5 7.71464C3.04647 7.60388 2.62885 7.46326 2.25928 7.29695C1.99139 7.1764 1.73275 7.03424 1.5 6.87067V7.75C1.5 8.05272 1.79611 8.49261 2.66921 8.88543C2.91653 8.9967 3.19525 9.09642 3.5 9.18152V7.71464ZM14.5 8.24743L14.5 8.25V8.25351C14.4977 8.55611 14.2005 8.99412 13.3308 9.38542C12.9356 9.56321 12.4603 9.7115 11.9266 9.81784C11.9108 9.82018 11.8952 9.82325 11.8798 9.82704C11.3095 9.93737 10.6741 9.99998 10 9.99998C9.76049 9.99998 9.52556 9.99199 9.29648 9.9767C9.45127 9.92085 9.59969 9.861 9.74109 9.79738C10.6774 9.37614 11.5 8.69103 11.5 7.75V6.60791C12.3571 6.73703 13.0865 6.96946 13.6165 7.2579C14.2813 7.61977 14.4986 7.98712 14.5 8.24743ZM12.5 10.715V12.1815C12.8048 12.0964 13.0835 11.9967 13.3308 11.8854C14.2039 11.4926 14.5 11.0527 14.5 10.75V9.87134C14.2674 10.0348 14.0089 10.1769 13.7411 10.2974C13.3714 10.4637 12.9537 10.6043 12.5 10.715Z" fill="currentColor"/>
  </svg>
);

const SelectionIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M1.55443 0.826519C1.64598 0.307348 2.12272 -0.0471547 2.63892 0.00510098L2.71289 0.0153593L6.15972 0.623128C6.67889 0.714673 7.03339 1.19141 6.98113 1.70761L6.97088 1.78158L6.278 5.708L10.025 4.34428C10.5192 4.16438 11.0633 4.39852 11.2771 4.86954L11.3067 4.94195L12.5038 8.23088C12.5877 8.46141 12.5837 8.71404 12.4939 8.94088L12.4932 11.6711C12.4932 12.1983 12.0853 12.6302 11.5679 12.6684L11.4932 12.6711H2.74322C2.60006 12.6711 2.45964 12.6602 2.31842 12.6381C0.836606 12.406 -0.176726 10.9928 0.025735 9.50854L0.0427299 9.39982L1.55443 0.826519ZM11.493 9.663L5.975 11.671L11.4932 11.6711L11.493 9.663ZM1.02754 9.57347L2.53924 1.00017L5.98607 1.60794L4.46664 10.225L4.44771 10.3178C4.24197 11.2051 3.38338 11.7924 2.47301 11.6501C1.51423 11.4999 0.855115 10.5513 1.02754 9.57347ZM10.367 5.28397L6.0775 6.845L5.45145 10.3987C5.42454 10.5513 5.38551 10.6987 5.33552 10.8402L11.5641 8.5729L10.367 5.28397ZM3.49324 9.92112C3.49324 9.50691 3.15745 9.17112 2.74324 9.17112C2.32902 9.17112 1.99324 9.50691 1.99324 9.92112C1.99324 10.3353 2.32902 10.6711 2.74324 10.6711C3.15745 10.6711 3.49324 10.3353 3.49324 9.92112Z" fill="currentColor"/>
  </svg>
);

const DeclineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12.7581 11.8811L12.8169 11.9331L18 17.1156L23.1831 11.9331C23.4271 11.689 23.8229 11.689 24.0669 11.9331C24.2922 12.1584 24.3096 12.5129 24.1189 12.7581L24.0669 12.8169L18.8844 18L24.0669 23.1831C24.311 23.4271 24.311 23.8229 24.0669 24.0669C23.8416 24.2922 23.4871 24.3096 23.2419 24.1189L23.1831 24.0669L18 18.8844L12.8169 24.0669C12.5729 24.311 12.1771 24.311 11.9331 24.0669C11.7078 23.8416 11.6904 23.4871 11.8811 23.2419L11.9331 23.1831L17.1156 18L11.9331 12.8169C11.689 12.5729 11.689 12.1771 11.9331 11.9331C12.1584 11.7078 12.5129 11.6904 12.7581 11.8811Z" fill="currentColor"/>
  </svg>
);

const ApproveIcon = () => (
  <svg width="24" height="24" viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
    <path d="M24.1206 13.4955C24.3647 13.2515 24.7604 13.2515 25.0045 13.4956C25.2297 13.7209 25.2471 14.0754 25.0564 14.3206L25.0044 14.3795L16.2544 23.1291C16.0291 23.3543 15.6746 23.3717 15.4295 23.1811L15.3706 23.1291L10.9956 18.7545C10.7515 18.5104 10.7515 18.1147 10.9955 17.8706C11.2208 17.6453 11.5753 17.6279 11.8205 17.8185L11.8794 17.8705L15.8119 21.8027L24.1206 13.4955Z" fill="currentColor"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M10 5.5C10.69 5.5 11.25 4.94 11.25 4.25C11.25 3.56 10.69 3 10 3C9.31 3 8.75 3.56 8.75 4.25C8.75 4.94 9.31 5.5 10 5.5ZM10 11.25C10.69 11.25 11.25 10.69 11.25 10C11.25 9.31 10.69 8.75 10 8.75C9.31 8.75 8.75 9.31 8.75 10C8.75 10.69 9.31 11.25 10 11.25ZM11.25 15.75C11.25 16.44 10.69 17 10 17C9.31 17 8.75 16.44 8.75 15.75C8.75 15.06 9.31 14.5 10 14.5C10.69 14.5 11.25 15.06 11.25 15.75Z" fill="currentColor"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M20.8727 11.0703C19.5019 10.5028 17.9936 10.3547 16.5385 10.6446C15.0837 10.9344 13.7475 11.6492 12.6989 12.6984L12.6985 12.6989L11.1094 14.2833V12.0393C11.1094 11.6941 10.8296 11.4143 10.4844 11.4143C10.1392 11.4143 9.85938 11.6941 9.85938 12.0393L9.85938 15.789C9.85938 15.789 9.85938 15.7891 9.85938 15.7892L9.85938 15.7893C9.85938 16.1345 10.1392 16.4143 10.4844 16.4143H14.2344C14.5796 16.4143 14.8594 16.1345 14.8594 15.7893C14.8594 15.4441 14.5796 15.1643 14.2344 15.1643H11.9962L13.5819 13.5832L13.5827 13.5824C14.4566 12.7078 15.5703 12.112 16.7828 11.8705C17.9953 11.6289 19.2522 11.7524 20.3946 12.2253C21.5369 12.6982 22.5133 13.4992 23.2003 14.5272C23.8873 15.5551 24.254 16.7637 24.254 18C24.254 19.2364 23.8873 20.4449 23.2003 21.4728C22.5133 22.5008 21.5369 23.3018 20.3946 23.7747C19.2522 24.2476 17.9953 24.3711 16.7828 24.1295C15.5703 23.888 14.4566 23.2922 13.5827 22.4176C13.3388 22.1734 12.943 22.1733 12.6989 22.4173C12.4547 22.6612 12.4545 23.057 12.6985 23.3011C13.7472 24.3506 15.0835 25.0656 16.5385 25.3554C17.9936 25.6453 19.5019 25.4972 20.8727 24.9297C22.2435 24.3622 23.4152 23.4009 24.2396 22.1674C25.0639 20.9339 25.504 19.4836 25.504 18C25.504 16.5164 25.0639 15.0661 24.2396 13.8326C23.4152 12.5991 22.2435 11.6378 20.8727 11.0703Z" fill="#202227"/>
  </svg>
);

interface SelectionsPage2Props {
  jobOpen?: boolean;
  onToggleJob?: () => void;
  onOpenOption?: (sel?: { name: string; category: string; price: number; status: string }) => void;
  onAddToAllowance?: (allowanceName: string) => void;
  completedAllowanceIds?: Set<string>;
  onToggleAllowanceComplete?: (id: string) => void;
  onOpenInvoice?: () => void;
}

export default function SelectionsPage2({
  jobOpen,
  onToggleJob,
  onOpenOption,
  onAddToAllowance,
  completedAllowanceIds,
  onToggleAllowanceComplete,
  onOpenInvoice,
}: SelectionsPage2Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('allowance');
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const e: Record<string, boolean> = {};
    mockData.forEach(row => { if (isAllowance(row)) e[row.id] = true; });
    return e;
  });
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});
  const completedIds = completedAllowanceIds ?? new Set<string>();
  const [openAllowance, setOpenAllowance] = useState<AllowanceGroup | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const toggleComplete = (id: string) => onToggleAllowanceComplete?.(id);
  const toggleMenu = (id: string) => setOpenMenuId(prev => prev === id ? null : id);

  const MoreMenu = ({ rowId }: { rowId: string }) => (
    <div className="sp-more-wrap">
      <button
        className="sp-action-btn"
        title="More options"
        onClick={(e) => { e.stopPropagation(); toggleMenu(rowId); }}
      >
        <MoreIcon />
      </button>
      {openMenuId === rowId && (
        <>
          <div className="sp-menu-backdrop" onClick={() => setOpenMenuId(null)} />
          <div className="sp-more-menu" onClick={(e) => e.stopPropagation()}>
            <button className="sp-more-menu-item" onClick={() => setOpenMenuId(null)}>
              Duplicate
            </button>
          </div>
        </>
      )}
    </div>
  );
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    mockData.forEach(row => {
      if (isAllowance(row)) {
        init[row.id] = false;
        row.options.forEach(o => { init[o.id] = false; });
      } else {
        init[row.id] = false;
      }
    });
    return init;
  });

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleGroupExpand = (id: string) => setGroupExpanded(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  const toggleCheck = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const allIds = Object.keys(checked);
  const allChecked = allIds.every(id => checked[id]);
  const toggleAll = () => {
    const val = !allChecked;
    const next: Record<string, boolean> = {};
    allIds.forEach(id => { next[id] = val; });
    setChecked(next);
  };

  const totalsClientPrice = mockData.reduce((s, row) => s + row.clientPrice, 0);

  const allowanceRows = mockData.filter(isAllowance) as AllowanceGroup[];
  const standaloneRows = mockData.filter(r => !isAllowance(r)) as SelectionOption[];

  // Group rows by location or vendor for the alternate views.
  // Allowances stay as groups (with their options nested), standalones go in
  // alongside them under whichever location/vendor key matches.
  const groupedRows = useMemo(() => {
    if (viewMode === 'allowance') return null;
    const key: 'location' | 'category' = viewMode === 'location' ? 'location' : 'category';
    const groups: Record<string, SelectionRow[]> = {};
    mockData.forEach(row => {
      const k = (row[key] || '—') as string;
      if (!groups[k]) groups[k] = [];
      groups[k].push(row);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [viewMode]);

  const renderAllowance = (row: AllowanceGroup) => {
    const isOpen = expanded[row.id];
    const spent = row.options.reduce((s, o) => s + (o.approvedPrice || 0), 0);
    const allowanceRemaining = row.clientPrice - spent;
    const overBudget = allowanceRemaining < 0;
    return (
      <div key={row.id} className={`sp-allowance-block${isOpen ? ' sp-allowance-block-open' : ''}`}>
        <div className="sp-row sp-row-group">
          <div className="sp-col-check">
            <div className={`sp-checkbox ${checked[row.id] ? 'sp-checkbox-on' : ''}`} onClick={() => toggleCheck(row.id)} />
          </div>
          <div className="sp-col-title">
            <button className="sp-expand-btn" onClick={() => toggleExpand(row.id)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <AllowanceIcon />
            <a
              href="#"
              className="sp-link sp-group-name"
              onClick={(e) => { e.preventDefault(); setOpenAllowance(row); }}
            >
              {row.name}
            </a>
          </div>
          <div className="sp-col-price"><strong>{fmt(row.clientPrice)}</strong></div>
          <div className="sp-col-approved"><strong>{fmt(spent)}</strong></div>
          <div className={`sp-col-remaining sp-remaining-amount${overBudget ? ' sp-remaining-over' : ''}`}>
            {fmt(allowanceRemaining)}
          </div>
          <div className="sp-col-status">
            <StatusBadge status={completedIds.has(row.id) ? 'Completed' : 'Open'} />
          </div>
          <div className="sp-col-category">{row.category}</div>
          <div className="sp-col-location">{row.location}</div>
          <div className="sp-col-invoiced">
            <InvoicedCell amount={row.invoicedAmount} invoiceRef={row.invoiceRef} onOpen={onOpenInvoice} />
          </div>
          <div className="sp-col-actions">
            <button className="sp-action-btn" title="Add option" onClick={() => onAddToAllowance ? onAddToAllowance(row.fullName) : onOpenOption?.()}><svg width="24" height="24" viewBox="0 0 36 36" fill="none"><path d="M18.625 11.125C18.625 10.7798 18.3452 10.5 18 10.5C17.6548 10.5 17.375 10.7798 17.375 11.125V17.375H11.125C10.7798 17.375 10.5 17.6548 10.5 18C10.5 18.3452 10.7798 18.625 11.125 18.625H17.375V24.875C17.375 25.2202 17.6548 25.5 18 25.5C18.3452 25.5 18.625 25.2202 18.625 24.875V18.625H24.875C25.2202 18.625 25.5 18.3452 25.5 18C25.5 17.6548 25.2202 17.375 24.875 17.375H18.625V11.125Z" fill="#004FD6"/></svg></button>
            <MoreMenu rowId={row.id} />
          </div>
        </div>

        {isOpen && (
          <>
            {row.options.map(opt => (
              <div key={opt.id} className="sp-row sp-row-child">
                <div className="sp-col-check">
                  <div className={`sp-checkbox ${checked[opt.id] ? 'sp-checkbox-on' : ''}`} onClick={() => toggleCheck(opt.id)} />
                </div>
                <div className="sp-col-title sp-child-indent">
                  <SelectionIcon />
                  <a href="#" className="sp-link" onClick={(e) => { e.preventDefault(); onOpenOption?.({ name: opt.title, category: '', price: opt.clientPrice, status: opt.status.toLowerCase() }); }}>{opt.title}</a>
                </div>
                <div className="sp-col-price">{fmt(opt.clientPrice)}</div>
                <div className="sp-col-approved">{opt.approvedPrice !== null ? fmt(opt.approvedPrice) : ''}</div>
                <div className="sp-col-remaining"></div>
                <div className="sp-col-status"><StatusBadge status={opt.status} /></div>
                <div className="sp-col-category">{opt.category}</div>
                <div className="sp-col-location">{opt.location}</div>
                <div className="sp-col-invoiced">
                  <InvoicedCell amount={opt.invoicedAmount} invoiceRef={opt.invoiceRef} onOpen={onOpenInvoice} />
                </div>
                <div className="sp-col-actions">
                  {opt.status === 'Pending' && (
                    <>
                      <button className="sp-action-btn sp-action-decline" title="Decline"><DeclineIcon /></button>
                      <button className="sp-action-btn sp-action-approve" title="Approve"><ApproveIcon /></button>
                    </>
                  )}
                  {opt.status !== 'Pending' && (
                    <button className="sp-action-btn" title="Undo"><UndoIcon /></button>
                  )}
                  <MoreMenu rowId={opt.id} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const renderStandalone = (row: SelectionOption) => (
    <div key={row.id} className="sp-row">
      <div className="sp-col-check">
        <div className={`sp-checkbox ${checked[row.id] ? 'sp-checkbox-on' : ''}`} onClick={() => toggleCheck(row.id)} />
      </div>
      <div className="sp-col-title">
        <SelectionIcon />
        <a href="#" className="sp-link" onClick={(e) => { e.preventDefault(); onOpenOption?.({ name: row.title, category: '', price: row.clientPrice, status: row.status.toLowerCase() }); }}>{row.title}</a>
      </div>
      <div className="sp-col-price">{fmt(row.clientPrice)}</div>
      <div className="sp-col-approved">{row.approvedPrice !== null ? <strong>{fmt(row.approvedPrice)}</strong> : ''}</div>
      <div className="sp-col-remaining"></div>
      <div className="sp-col-status"><StatusBadge status={row.status} /></div>
      <div className="sp-col-category">{row.category}</div>
      <div className="sp-col-location">{row.location}</div>
      <div className="sp-col-invoiced">
        <InvoicedCell amount={row.invoicedAmount} invoiceRef={row.invoiceRef} />
      </div>
      <div className="sp-col-actions">
        {row.status === 'Pending' && (
          <>
            <button className="sp-action-btn sp-action-decline" title="Decline"><DeclineIcon /></button>
            <button className="sp-action-btn sp-action-approve" title="Approve"><ApproveIcon /></button>
          </>
        )}
        {row.status !== 'Pending' && (
          <button className="sp-action-btn" title="Undo"><UndoIcon /></button>
        )}
        <MoreMenu rowId={row.id} />
      </div>
    </div>
  );

  const renderGroupHeader = (label: string, rows: SelectionRow[]) => {
    const isOpen = groupExpanded[label] !== false;
    const groupBudget = rows.reduce((s, r) => s + r.clientPrice, 0);
    const groupSpent = rows.reduce((s, r) => {
      if (isAllowance(r)) return s + r.options.reduce((ss, o) => ss + (o.approvedPrice || 0), 0);
      return s + (r.approvedPrice || 0);
    }, 0);
    return (
      <div key={`group-${label}`} className="sp-allowance-block sp-allowance-block-open" style={{ marginTop: 8 }}>
        <div className="sp-row sp-row-group" style={{ background: 'var(--g50)' }}>
          <div className="sp-col-check"></div>
          <div className="sp-col-title">
            <button className="sp-expand-btn" onClick={() => toggleGroupExpand(label)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <strong>{label}</strong>
            <span style={{ color: 'var(--g500)', fontSize: 12, marginLeft: 8 }}>
              {rows.length} {rows.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="sp-col-price"><strong>{fmt(groupBudget)}</strong></div>
          <div className="sp-col-approved"><strong>{fmt(groupSpent)}</strong></div>
          <div className="sp-col-remaining"></div>
          <div className="sp-col-status"></div>
          <div className="sp-col-category"></div>
          <div className="sp-col-location"></div>
          <div className="sp-col-invoiced"></div>
          <div className="sp-col-actions"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="jps-page">
      <div className="pg-hdr">
        <div className="pg-accent"></div>
        <div className="pg-hdr-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!jobOpen && onToggleJob && (
              <button onClick={onToggleJob} style={{background: 'none', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer', color: 'var(--g500)', fontSize: 16, display: 'flex', alignItems: 'center', lineHeight: 1}}>
                &#9776;
              </button>
            )}
            <div>
              <div className="pg-hdr-sub"><a href="#" style={{ color: 'var(--bt-blue)', textDecoration: 'none' }}>Job: Smith Home Residence</a> / Selection 2</div>
              <div className="pg-title">Selection 2</div>
            </div>
          </div>
          <div className="pg-hdr-right">
            <button className="btn btn-p" style={{ gap: 4 }} onClick={() => onOpenOption?.()}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Option
            </button>
          </div>
        </div>
      </div>

      <div className="sp-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--g600)', fontWeight: 500 }}>Group by:</span>
          <div className="tabs">
            <button className={`tab${viewMode === 'allowance' ? ' on' : ''}`} onClick={() => setViewMode('allowance')}>Allowance</button>
            <button className={`tab${viewMode === 'location' ? ' on' : ''}`} onClick={() => setViewMode('location')}>Location</button>
            <button className={`tab${viewMode === 'vendor' ? ' on' : ''}`} onClick={() => setViewMode('vendor')}>Vendor</button>
          </div>
        </div>

        <div className="sp-table">
          <div className="sp-row sp-header">
            <div className="sp-col-check">
              <div className={`sp-checkbox ${allChecked ? 'sp-checkbox-on' : ''}`} onClick={toggleAll} />
            </div>
            <div className="sp-col-title">Title</div>
            <div className="sp-col-price">Budget</div>
            <div className="sp-col-approved">Spent</div>
            <div className="sp-col-remaining">Remaining</div>
            <div className="sp-col-status">Status</div>
            <div className="sp-col-category">Category</div>
            <div className="sp-col-location">Location</div>
            <div className="sp-col-invoiced">Related item</div>
            <div className="sp-col-actions">Actions</div>
          </div>

          {viewMode === 'allowance' && (
            <>
              {allowanceRows.map(renderAllowance)}
              {standaloneRows.map(renderStandalone)}
            </>
          )}

          {viewMode !== 'allowance' && groupedRows && groupedRows.map(([label, rows]) => {
            const isOpen = groupExpanded[label] !== false;
            return (
              <div key={label}>
                {renderGroupHeader(label, rows)}
                {isOpen && rows.map(r => isAllowance(r) ? renderAllowance(r) : renderStandalone(r))}
              </div>
            );
          })}

          <div className="sp-row sp-row-total">
            <div className="sp-col-check"></div>
            <div className="sp-col-title"><strong>Totals</strong></div>
            <div className="sp-col-price"><strong>{fmt(totalsClientPrice)}</strong></div>
            <div className="sp-col-approved"></div>
            <div className="sp-col-remaining"></div>
            <div className="sp-col-status"></div>
            <div className="sp-col-category"></div>
            <div className="sp-col-location"></div>
            <div className="sp-col-invoiced sp-col-invoiced-empty">—</div>
            <div className="sp-col-actions"></div>
          </div>
        </div>
      </div>

      {openAllowance && (() => {
        const a = openAllowance;
        const spent = a.options.reduce((s, o) => s + (o.approvedPrice || 0), 0);
        const remaining = a.clientPrice - spent;
        const isComplete = completedIds.has(a.id);
        const overBudget = remaining < 0;
        const pct = a.clientPrice > 0 ? Math.min(100, Math.max(0, (spent / a.clientPrice) * 100)) : 0;
        return (
          <div className="sp-panel-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpenAllowance(null); }}>
            <aside className="sp-panel" onClick={(e) => e.stopPropagation()}>
              <div className="sp-panel-toolbar">
                <button className="sp-panel-icon-btn" title="History"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3.5a6.5 6.5 0 1 0 4.6 11.1l-.7-.7A5.5 5.5 0 1 1 15.5 10H13l3 3 3-3h-2.5A6.5 6.5 0 0 0 10 3.5Zm-.5 3v4l3 1.8.5-.8-2.5-1.5V6.5h-1Z" fill="currentColor"/></svg></button>
                <button className="sp-panel-icon-btn" title="Share"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14 4a2 2 0 1 0-1.9 2.7L7.6 9.2a2 2 0 1 0 0 1.6l4.5 2.5a2 2 0 1 0 .5-.9L8 9.9 12.6 7.3a2 2 0 0 0 1.4.7 2 2 0 0 0 0-4Z" fill="currentColor"/></svg></button>
                <button className="sp-panel-icon-btn" title="Comments"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3.5 4h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-3 3v-3H3.5A1.5 1.5 0 0 1 2 13.5v-8A1.5 1.5 0 0 1 3.5 4Z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></button>
                <button className="sp-panel-icon-btn" title="Edit"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14.5V17h2.5l8.4-8.4-2.5-2.5L3 14.5ZM16.7 6.3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.3 1.3 2.5 2.5 1.8-1.8Z" fill="currentColor"/></svg></button>
                <button className="btn btn-s sp-panel-cta" onClick={() => toggleComplete(a.id)}>
                  {isComplete ? 'Reopen' : 'Complete'}
                </button>
                <button className="sp-panel-close" onClick={() => setOpenAllowance(null)}>&times;</button>
              </div>

              <div className="sp-panel-body">
                <div className="sp-panel-breadcrumb">
                  <a href="#">Smith Home</a> <span>/</span> <a href="#">Allowance</a> <span>/</span>
                </div>
                <div className="sp-panel-title-row">
                  <h2 className="sp-panel-title">{a.name}</h2>
                  <StatusBadge status={isComplete ? 'Completed' : 'Open'} />
                </div>

                <div className={`sp-panel-progress${overBudget ? ' sp-panel-progress-over' : ''}`}>
                  <div className="sp-panel-progress-amount">
                    {fmt(spent)} <span className="sp-panel-progress-of">/ {fmt(a.clientPrice)}</span>
                  </div>
                </div>

                <section className="sp-panel-section">
                  <div className="sp-panel-section-title">Details</div>
                  <div className="sp-panel-field">
                    <div className="sp-panel-label">Location</div>
                    <span className="sp-panel-pill">{a.location ?? '—'}</span>
                  </div>
                  <div className="sp-panel-field">
                    <div className="sp-panel-label">Category</div>
                    <span className="sp-panel-pill">{a.category ?? 'Allowance'}</span>
                  </div>
                </section>

                <section className="sp-panel-section">
                  <button className="sp-panel-section-toggle">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: 'rotate(90deg)' }}>
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="sp-panel-section-title">Selections</span>
                  </button>
                  {a.options.map((opt, i) => (
                    <div key={opt.id} className={`sp-panel-row${i === a.options.length - 1 ? ' sp-panel-row-last' : ''}`}>
                      <span className="sp-panel-row-label">{opt.title}</span>
                      <div className="sp-panel-row-right">
                        <span className="sp-panel-row-value">{opt.approvedPrice !== null ? fmt(opt.approvedPrice) : '—'}</span>
                        <StatusBadge status={opt.status} />
                      </div>
                    </div>
                  ))}
                </section>

                <section className="sp-panel-section">
                  <button className="sp-panel-section-toggle">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: 'rotate(90deg)' }}>
                      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="sp-panel-section-title">Selection status</span>
                  </button>
                  <div className="sp-panel-stat-row">
                    <div className="sp-panel-stat">
                      <div className="sp-panel-stat-label">Spent</div>
                      <div className="sp-panel-stat-value">{fmt(spent)}</div>
                    </div>
                    <div className="sp-panel-stat sp-panel-stat-right">
                      <div className="sp-panel-stat-label">Budget</div>
                      <div className="sp-panel-stat-value">{fmt(a.clientPrice)}</div>
                    </div>
                  </div>
                  <div className="sp-panel-bar">
                    <div
                      className={`sp-panel-bar-fill${overBudget ? ' sp-panel-bar-fill-over' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="sp-panel-row sp-panel-row-last">
                    <span className="sp-panel-row-label">Allowance remaining</span>
                    <span className={`sp-panel-row-value${overBudget ? ' sp-panel-row-value-over' : ''}`}>
                      {fmt(remaining)}
                    </span>
                  </div>
                </section>

                {!isComplete && remaining !== 0 && (
                  <div className="sp-panel-note">
                    {remaining > 0
                      ? <>Marking this allowance complete will surface the unspent <strong>{fmt(remaining)}</strong> as a credit on the next invoice.</>
                      : <>Over budget by <strong>{fmt(Math.abs(remaining))}</strong>. Marking complete will lock the budget at the spent amount.</>
                    }
                  </div>
                )}
              </div>
            </aside>
          </div>
        );
      })()}
    </div>
  );
}
