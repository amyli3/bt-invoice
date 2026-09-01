import { useState, useEffect, useRef } from 'react';

/* Bills — the cost side of the job, opposite the owner invoice. One bill/receipt
   record: what was bought, who it was paid to, which cost codes it lands on, who
   still has to approve it, and whether QuickBooks has it yet.

   Structure follows the shipped page rather than the Figma frame (170:751), which
   is behind it: the record opens as a modal over the app with a collapsed
   Document rail, the Receipt / Lien Waiver tabs ride at the top of the content
   card, and the sections run Costs, Approvals, QuickBooks, Attachments, Custom
   fields. The top field grid is the prototype's own.

   The record moves Inbox -> In review -> Paid, per the high-level workflow in
   Figma node 219:45528. Approvers pick the lane: with them the record is sent for
   approval and then approved to the job, with none it is saved to the job and
   marked paid. Each stage changes the page, not just the chip: the totals block
   gains amount paid and remaining balance once it is paid, and the footer swaps
   to the actions that stage actually offers. */

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type CostRow = {
  id: string;
  title: string;
  costCode: string;
  costType: string;
  unit: string;
  unitCost: number;
  quantity: number;
};

type Approver = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  color: string;
  state: 'Approved' | 'Pending';
  when?: string;
  comment?: string;
};

const INITIAL_COSTS: CostRow[] = [
  { id: 'c1', title: '12-2 Romex, 250 ft roll', costCode: '200.40 Electrical Rough-in', costType: 'Material', unit: 'roll', unitCost: 148.00, quantity: 3 },
  { id: 'c2', title: 'Outlet boxes', costCode: '200.40 Electrical Rough-in', costType: 'Material', unit: 'ea', unitCost: 1.87, quantity: 40 },
  { id: 'c3', title: '15A decora receptacles', costCode: '200.50 Electrical Finish', costType: 'Material', unit: 'ea', unitCost: 3.42, quantity: 25 },
];

/* The three stages the record moves through, from the high-level workflow
   (Figma node 219:45528). The budget notes are what each stage is meant to do to
   the job budget; the diagram still marks the last two with a question mark. */
export type BillStatus = 'Draft' | 'In review' | 'Ready for payment' | 'Paid';

/* Receipts skip the payment queue: the money already left the card, so there is
   nothing to queue up and pay. Bills stop there. That difference is the whole
   point of the expense work, so the stage strip shows it rather than hiding it. */
const stagesFor = (docType: string): { key: BillStatus; label: string; note: string }[] => [
  { key: 'Draft', label: 'Inbox', note: "Doesn't show on budget" },
  { key: 'In review', label: 'In review', note: 'Shows on budget in Pending costs' },
  ...(docType === 'Receipt'
    ? []
    : [{ key: 'Ready for payment' as BillStatus, label: 'Ready for payment', note: 'Waiting in the payment queue' }]),
  { key: 'Paid', label: 'Paid', note: 'Shows on budget in Actual costs' },
];

export type BillSeed = {
  title: string;
  type: string;
  status: BillStatus;
  paidTo: string;
  billNumber: string;
  job: string;
  costs?: CostRow[];
};

const COST_CODES = [
  '200.40 Electrical Rough-in',
  '200.50 Electrical Finish',
  '100.10 Site Work',
  '300.20 Plumbing Rough-in',
];

const INITIAL_APPROVERS: Approver[] = [
  {
    id: 'a1', name: 'Paula Moore', initials: 'PM', bg: '#dbeafe', color: '#1e40af',
    state: 'Approved', when: 'Jan. 26, 2026, 3:21 PM',
    comment: "This looks good to me. Chris needs to confirm the quality of work, I haven't been able to get to the job site this week.",
  },
  { id: 'a2', name: 'Chris Glasser', initials: 'CG', bg: '#ffedd5', color: '#9a3412', state: 'Pending' },
];

/* The internal users the approver picker offers. Amy Li is the signed-in user,
   which is why she reads bold in the list and why "Me" sits above the roster. */
const PEOPLE = [
  { name: 'Kendall Sutton', initials: 'KS', bg: '#fecaca', color: '#991b1b' },
  { name: 'Amy Li', initials: 'AL', bg: '#fecaca', color: '#991b1b', isMe: true },
  { name: 'Jenna Baird', initials: 'JB', bg: '#ddd6fe', color: '#5b21b6' },
  { name: 'Kelly Blaney', initials: 'KB', bg: '#fde68a', color: '#92400e' },
  { name: 'Scott Swanson', initials: 'SS', bg: '#ddd6fe', color: '#5b21b6' },
  { name: 'Drew Swanson', initials: 'DS', bg: '#bbf7d0', color: '#166534' },
  { name: 'Katie Builder', initials: 'KB', bg: '#fecaca', color: '#991b1b' },
];

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--g700)', marginBottom: 4,
};

/* The grid the form fields sit on. The frame is 1009 wide inside a 1454 page, so
   the fields stop well short of the tables below rather than stretching across. */
const fieldGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 16px', maxWidth: 1010,
};

const secTitle: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: 'var(--bt-midnight)', letterSpacing: '-0.01em',
};

const th: React.CSSProperties = {
  padding: '0 12px', fontSize: 13, fontWeight: 600, color: 'var(--g800)',
  textAlign: 'left', whiteSpace: 'nowrap', borderRight: '1px solid var(--g200)',
};

const td: React.CSSProperties = {
  padding: '14px 12px', fontSize: 13, color: 'var(--g800)', verticalAlign: 'middle',
};

/* The ⋮ that closes each column header. In product it's the column menu handle;
   here it's decoration, so it isn't a button. */
const ColSplit = () => (
  <span style={{ color: 'var(--g400)', fontSize: 13, lineHeight: 1, userSelect: 'none' }}>⋮</span>
);

const HeadCell = ({ label, align = 'left' }: { label: string; align?: 'left' | 'right' }) => (
  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexDirection: align === 'right' ? 'row-reverse' : 'row' }}>
    {label}
    <ColSplit />
  </span>
);

const DragHandle = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ flexShrink: 0 }}>
    {[3, 8, 13].map(y => (
      <g key={y}>
        <circle cx="2" cy={y} r="1.1" fill="#9ca3af" />
        <circle cx="8" cy={y} r="1.1" fill="#9ca3af" />
      </g>
    ))}
  </svg>
);

const Chevron = ({ color = '#9ca3af' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2.5L9.5 7L5 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Avatar = ({ initials, bg, color, size = 28 }: { initials: string; bg: string; color: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', background: bg, color,
    fontSize: size <= 24 ? 9 : 10, fontWeight: 700, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, letterSpacing: 0.2,
  }}>{initials}</div>
);

/* Field dropdown.

   A native <select> opens its popup centred on the current value, so on macOS it
   lands directly on top of the field you just clicked and hides the label and the
   value. This opens below the field instead, the way the shipped page does, and
   marks the current value rather than relying on position to convey it. */
function Dropdown({ value, options, onChange, leading, ariaLabel, placeholder }: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  leading?: React.ReactNode;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="fi"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left',
          ...(open ? { borderColor: 'var(--bt-blue)', boxShadow: '0 0 0 3px rgba(0,101,219,0.12)' } : {}),
        }}
      >
        {leading}
        <span style={{
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', color: value ? 'var(--g800)' : 'var(--g300)',
        }}>
          {value || placeholder || '\u00a0'}
        </span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 1.5L6 6.5L11 1.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: 'white', border: '1px solid var(--g200)', borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.16)', maxHeight: 260, overflowY: 'auto',
          }}
        >
          {options.map(opt => {
            const selected = opt === value;
            return (
              <button
                key={opt || '__blank'}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                  background: selected ? 'var(--bt-blue-light)' : 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, lineHeight: '20px',
                  color: 'var(--g800)', fontWeight: selected ? 600 : 400,
                }}
                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--g50)'; }}
                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'none'; }}
              >
                {opt || '\u00a0'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Description rich-text toolbar. Non-functional by design: the prototype is
   about the bill record, and a working editor would only add noise. */
function DescriptionToolbar() {
  const sep = <span style={{ width: 1, height: 20, background: 'var(--g300)', margin: '0 6px' }} />;
  const btn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
    fontSize: 14, color: 'var(--g800)', fontFamily: 'inherit', lineHeight: 1,
    display: 'flex', alignItems: 'center', gap: 2,
  };
  const caret = (
    <svg width="7" height="5" viewBox="0 0 8 5" fill="none"><path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  const AlignIcon = ({ short }: { short: number[] }) => (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      {[2, 5, 8, 11].map((y, i) => (
        <rect key={y} x={short.includes(i) ? 3 : 1} y={y} width={short.includes(i) ? 10 : 14} height="1.6" rx="0.8" fill="#1f2937" />
      ))}
    </svg>
  );
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '8px 12px',
      background: 'var(--g100)', border: '1px solid var(--g200)', borderTop: 'none',
      borderRadius: '0 0 var(--radius) var(--radius)', flexWrap: 'wrap',
    }}>
      <span style={{ ...btn, width: 88, justifyContent: 'space-between', color: 'var(--g700)', fontSize: 13 }}>Font {caret}</span>
      {sep}
      <span style={{ ...btn, width: 88, justifyContent: 'space-between', color: 'var(--g700)', fontSize: 13 }}>Size {caret}</span>
      {sep}
      <span style={btn}><span style={{ fontWeight: 600, textDecoration: 'underline', textDecorationColor: '#dc2626' }}>A</span>{caret}</span>
      <span style={btn}>
        <span style={{ background: '#1f2937', color: 'white', padding: '1px 4px', borderRadius: 2, fontWeight: 600, fontSize: 12 }}>A</span>{caret}
      </span>
      {sep}
      <span style={{ ...btn, fontWeight: 700 }}>B</span>
      <span style={{ ...btn, fontStyle: 'italic', fontWeight: 600 }}>I</span>
      <span style={{ ...btn, textDecoration: 'underline' }}>U</span>
      <span style={{ ...btn, textDecoration: 'line-through', fontWeight: 600 }}>S</span>
      {sep}
      <span style={btn}><AlignIcon short={[1, 3]} /></span>
      <span style={btn}><AlignIcon short={[1, 3]} /></span>
      <span style={btn}><AlignIcon short={[0, 2]} /></span>
      <span style={btn}><AlignIcon short={[]} /></span>
      {sep}
      <span style={btn}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="#1f2937" strokeWidth="1.2" />
          <path d="M10.5 5.5L5.5 10.5M5.5 10.5V7.5M5.5 10.5h3" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

interface Props {
  jobName?: string;
  onClose?: () => void;
  /* When the record is opened from the Bills grid, the grid owns the row and
     seeds the form; changes flow back up so the row moves between tabs. */
  record?: BillSeed;
  onRecordChange?: (patch: { title: string; type: string; status: BillStatus }) => void;
}

export default function BillsPage({ jobName = 'Johnson Residence — Full Remodel', onClose, record, onRecordChange }: Props) {
  const [tab, setTab] = useState<'record' | 'lien'>('record');
  const [type, setType] = useState(record?.type ?? 'Receipt');
  const [paymentAccount, setPaymentAccount] = useState('Visa 1234');
  const [datePaid, setDatePaid] = useState('Jan 20, 2026');
  const [job, setJob] = useState(record?.job ?? '');
  const [title, setTitle] = useState(record?.title ?? 'Electrical rough-in materials');
  const [billNumber, setBillNumber] = useState(record?.billNumber ?? '12345');
  const [paidTo, setPaidTo] = useState(record?.paidTo ?? 'Home Depot');
  const [name, setName] = useState('Bob');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [description, setDescription] = useState('');

  const [costs, setCosts] = useState<CostRow[]>(record?.costs ?? INITIAL_COSTS);
  const [activeRow, setActiveRow] = useState<string | null>('c1');
  const [checkedRows, setCheckedRows] = useState<string[]>([]);
  const [newLineItems, setNewLineItems] = useState(true);
  const [sendToQbo, setSendToQbo] = useState(false);
  const [customOpen, setCustomOpen] = useState(true);
  const [status, setStatus] = useState<BillStatus>(record?.status ?? 'Draft');
  const [toast, setToast] = useState<string | null>(null);

  // Approvers
  const [approvers, setApprovers] = useState<Approver[]>(INITIAL_APPROVERS);
  const [addingApprover, setAddingApprover] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [approverQuery, setApproverQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Footer overflow menu, paid state only
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Document pane: collapsed to a rail by default, expands into a split view
  const [docOpen, setDocOpen] = useState(false);
  const [docWidth, setDocWidth] = useState(48);
  const [docLoaded, setDocLoaded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Mirror the fields the grid renders back onto the row. */
  useEffect(() => {
    onRecordChange?.({ title, type, status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, type, status]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const total = costs.reduce((sum, c) => sum + c.unitCost * c.quantity, 0);
  const paid = status === 'Paid';
  const inReview = status === 'In review';
  const readyForPayment = status === 'Ready for payment';
  const isReceipt = type === 'Receipt';
  /* A receipt leaving review is already settled, so it lands on Paid. Anything
     the builder still owes stops in the payment queue first. */
  const reviewNext: BillStatus = isReceipt ? 'Paid' : 'Ready for payment';
  /* The workflow has two lanes and approvers are what pick one. With approvers
     the record is sent for approval and later approved to the job; with none it
     goes straight to the job and is marked paid. Both land In review first. */
  const hasApprovers = approvers.length > 0;
  const amountPaid = paid ? total : 0;
  /* Billed from the moment it leaves the inbox: the flow syncs to QBO when the
     record is saved to the job, not when it is finally paid. */
  const qboBilled = sendToQbo && status !== 'Draft';
  const allChecked = costs.length > 0 && checkedRows.length === costs.length;

  const toggleRow = (id: string) =>
    setCheckedRows(rows => rows.includes(id) ? rows.filter(r => r !== id) : [...rows, id]);

  const updateRow = (id: string, patch: Partial<CostRow>) =>
    setCosts(rows => rows.map(r => r.id === id ? { ...r, ...patch } : r));

  const addRow = () => {
    const id = `c${Date.now()}`;
    setCosts(rows => [...rows, { id, title: '', costCode: COST_CODES[0], costType: 'Material', unit: 'ea', unitCost: 0, quantity: 1 }]);
    setActiveRow(id);
  };

  const startAddApprover = () => {
    setAddingApprover(true);
    setPicked([]);
    setApproverQuery('');
    setPickerOpen(true);
  };

  const cancelAddApprover = () => {
    setAddingApprover(false);
    setPickerOpen(false);
    setPicked([]);
    setApproverQuery('');
  };

  const confirmAddApprover = () => {
    const added = PEOPLE.filter(p => picked.includes(p.name)).map(p => ({
      id: `a-${p.name}`,
      name: p.name,
      initials: p.initials,
      bg: p.bg,
      color: p.color,
      state: 'Pending' as const,
    }));
    if (added.length) {
      setApprovers(list => [...list, ...added.filter(a => !list.some(l => l.id === a.id))]);
      setToast(added.length === 1 ? `${added[0].name} added as an approver` : `${added.length} approvers added`);
    }
    cancelAddApprover();
  };

  /* Drag the split. Width is a percentage so the panes keep their ratio when the
     window resizes, and it's clamped so neither pane can be squeezed shut. */
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      const rect = bodyRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDocWidth(Math.min(72, Math.max(22, ((ev.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '14px 4px', marginRight: 28, background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? 'var(--bt-blue)' : 'transparent'}`,
    color: active ? 'var(--bt-blue)' : 'var(--g700)', fontWeight: active ? 600 : 500,
    fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', marginBottom: -1,
    display: 'flex', alignItems: 'center', gap: 8,
  });

  const totalLine = (label: string, value: number) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, fontSize: 13, fontWeight: 700, color: 'var(--g800)' }}>
      <span>{label}:</span>
      <span style={{ minWidth: 76, textAlign: 'right' }}>${fmt(value)}</span>
    </div>
  );

  const visiblePeople = PEOPLE.filter(p => p.name.toLowerCase().includes(approverQuery.toLowerCase()));

  return (
    <>
      {/* The record opens over the app rather than replacing it, so the nav stays
          visible at the top edge behind the scrim. */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 90 }} onClick={onClose} />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 44, left: 32, right: 32, bottom: 12, zIndex: 100,
          background: 'white', borderRadius: 8, boxShadow: '0 12px 40px rgba(15,23,42,0.22)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '14px 24px 12px', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--g500)' }}>{jobName}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--bt-midnight)', letterSpacing: '-0.02em' }}>{type}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              aria-label="Comments"
              onClick={() => setToast('No comments yet')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g600)', display: 'flex', padding: 2 }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3.5 5.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5v-3.5H5a1.5 1.5 0 0 1-1.5-1.5v-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M7 8h8M7 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g700)', display: 'flex', padding: 2 }}
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Body: the Document pane, collapsed to a rail or expanded into a split
            view, then the content card. */}
        <div ref={bodyRef} style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {docOpen ? (
            <>
              <div style={{
                width: `${docWidth}%`, flexShrink: 0, minWidth: 0,
                display: 'flex', flexDirection: 'column', padding: '0 0 24px 24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 4px' }}>
                  <button
                    type="button"
                    aria-label="Collapse document"
                    onClick={() => setDocOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g600)', display: 'flex', padding: 2 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>

                <div style={{ flex: 1, minHeight: 0, borderTop: '1px solid var(--g200)', paddingTop: 20, display: 'flex' }}>
                  {docLoaded ? (
                    /* The attached scan, shown at reading size. This is the pane's
                       whole reason to exist: keying the costs off the receipt
                       without leaving the record. */
                    <div style={{
                      flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--g50)',
                      border: '1px solid var(--g200)', borderRadius: 4, padding: 24,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}>
                      <svg width="260" height="330" viewBox="0 0 220 280" fill="none" style={{ maxWidth: '100%' }}>
                        <rect x="0.75" y="0.75" width="218.5" height="278.5" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1.5" />
                        <rect x="26" y="26" width="90" height="9" rx="4.5" fill="#cbd5e1" />
                        <rect x="26" y="46" width="60" height="6" rx="3" fill="#e5e8eb" />
                        {[78, 94, 110, 126, 142, 158].map(y => (
                          <g key={y}>
                            <rect x="26" y={y} width="110" height="6" rx="3" fill="#e5e8eb" />
                            <rect x="158" y={y} width="36" height="6" rx="3" fill="#e5e8eb" />
                          </g>
                        ))}
                        <rect x="26" y="186" width="168" height="1.5" fill="#d1d5db" />
                        <rect x="26" y="200" width="70" height="8" rx="4" fill="#94a3b8" />
                        <rect x="140" y="200" width="54" height="8" rx="4" fill="#15803d" />
                        <rect x="26" y="238" width="168" height="6" rx="3" fill="#eef2f7" />
                        <rect x="26" y="254" width="120" height="6" rx="3" fill="#eef2f7" />
                      </svg>
                      <span style={{ fontSize: 13, color: 'var(--g600)' }}>INV-2291.pdf</span>
                    </div>
                  ) : (
                    <div style={{
                      flex: 1, border: '1px dashed var(--g300)', borderRadius: 2,
                      background: 'var(--g50)', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center',
                    }}>
                      <svg width="42" height="42" viewBox="0 0 32 32" fill="none">
                        <path d="M4 18.5V7.5A2 2 0 0 1 6 5.5h20a2 2 0 0 1 2 2v11" stroke="#0065db" strokeWidth="2" strokeLinecap="round" />
                        <path d="M4 18.5h6.5l2 3h7l2-3H28v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" stroke="#0065db" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                      <div style={{ fontSize: 15, color: 'var(--g800)' }}>
                        <button
                          type="button"
                          onClick={() => { setDocLoaded(true); setToast('INV-2291.pdf attached'); }}
                          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--bt-blue)', textDecoration: 'underline', cursor: 'pointer' }}
                        >Browse</button>
                        {' '}or drop a file to fill this form
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--g500)' }}>
                        Supported file types - .pdf, .jpg, .png, .jpeg, .heic
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Split grip */}
              <div
                onMouseDown={startDrag}
                role="separator"
                aria-orientation="vertical"
                style={{
                  width: 14, flexShrink: 0, cursor: 'col-resize',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="4" height="30" viewBox="0 0 4 30" fill="none">
                  {[3, 9, 15, 21, 27].map(y => <circle key={y} cx="2" cy={y} r="1.5" fill="#9ca3af" />)}
                </svg>
              </div>
            </>
          ) : (
            <button
              type="button"
              aria-label="Expand document"
              aria-expanded={false}
              onClick={() => setDocOpen(true)}
              style={{
                width: 46, flexShrink: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 12, padding: '18px 0',
                background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
              }}
            >
              <span style={{ color: 'var(--g600)', display: 'flex' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span style={{
                writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                fontSize: 13, color: 'var(--g600)', letterSpacing: 0.2,
              }}>Document</span>
            </button>
          )}

          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: docOpen ? '0 24px 24px 0' : '0 24px 24px 0' }}>
            <div style={{ border: '1px solid var(--g200)', borderRadius: 4, background: 'white' }}>
              {/* Tabs */}
              <div style={{
                display: 'flex', alignItems: 'center', padding: '0 24px',
                background: 'var(--g50)', borderBottom: '1px solid var(--g200)',
                borderRadius: '4px 4px 0 0',
              }}>
                <button style={tabStyle(tab === 'record')} onClick={() => setTab('record')}>{type}</button>
                <button style={tabStyle(tab === 'lien')} onClick={() => setTab('lien')}>
                  Lien Waiver
                  {/* Sync badge: the waiver is generated from the record rather
                      than filled in by hand. */}
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--g300)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g500)',
                  }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 6.5A5.5 5.5 0 0 0 3.2 5M2.5 9.5A5.5 5.5 0 0 0 12.8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M13.5 3.5v3H10M2.5 12.5v-3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>

              {tab === 'lien' ? (
                <div style={{ padding: '64px 32px', textAlign: 'center', color: 'var(--g500)', fontSize: 14 }}>
                  The lien waiver is generated once this {type.toLowerCase()} is marked ready for payment.
                </div>
              ) : (
                <>
                  {/* Status chip, flush in the corner rather than inset in the padding */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', height: 44 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0 20px',
                      background: paid ? 'var(--green-bg)' : (inReview || readyForPayment) ? 'var(--yellow-bg)' : 'var(--g200)',
                      color: paid ? 'var(--green)' : (inReview || readyForPayment) ? 'var(--yellow)' : 'var(--g700)',
                      fontSize: 14, fontWeight: 600,
                    }}>{status}</span>
                  </div>

                  <div style={{ padding: '4px 32px 40px' }}>
                    {/* ── Where this record is in the flow ── */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
                      {stagesFor(type).map((stage, i) => {
                        const active = stage.key === status;
                        return (
                          <div key={stage.key} style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              background: active ? 'var(--bt-midnight)' : 'var(--g200)',
                              color: active ? 'white' : 'var(--g600)',
                              padding: '9px 22px', fontSize: 14, fontWeight: 700, textAlign: 'center',
                              clipPath: i === 0
                                ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
                                : 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)',
                            }}>{stage.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--g500)', textAlign: 'center', marginTop: 6, padding: '0 8px' }}>
                              {stage.note}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Payment details ── */}
                    <div style={fieldGrid}>
                      <div>
                        <label style={lbl}>Type</label>
                        {/* Bill leads: it's the common case, and the other two are
                            the exceptions off it. */}
                        <Dropdown
                          ariaLabel="Type"
                          value={type}
                          onChange={setType}
                          options={['Bill', 'Receipt', 'Vendor Credit']}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Payment account</label>
                        <Dropdown
                          ariaLabel="Payment account"
                          value={paymentAccount}
                          onChange={setPaymentAccount}
                          options={['Visa 1234', 'Amex 8890', 'Operating checking']}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Date paid</label>
                        <input className="fi" value={datePaid} onChange={e => setDatePaid(e.target.value)} />
                      </div>

                      <div>
                        <label style={lbl}>Job</label>
                        <Dropdown
                          ariaLabel="Job"
                          value={job}
                          onChange={setJob}
                          options={['', 'Lot 27 Sunset Ridge', 'Harrison Residence', 'Maple Street Remodel']}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Title</label>
                        <input className="fi" value={title} onChange={e => setTitle(e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Bill #</label>
                        {/* Prefix sits inside the field frame as a fixed segment: the
                            account-wide numbering format is the builder's, not typed
                            per bill. */}
                        <div style={{ display: 'flex', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'white' }}>
                          <span style={{
                            padding: '8px 10px', fontSize: 14, lineHeight: '20px', color: 'var(--g700)',
                            background: 'var(--bt-blue-light)', borderRight: '1px solid var(--g200)', flexShrink: 0,
                          }}>BILL-</span>
                          <input
                            value={billNumber}
                            onChange={e => setBillNumber(e.target.value)}
                            style={{
                              flex: 1, minWidth: 0, padding: '8px 12px', fontSize: 14, lineHeight: '20px',
                              fontFamily: 'inherit', color: 'var(--g800)', border: 'none', outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={lbl}>Paid to</label>
                        {/* The vendor carries its own avatar in the closed field, so the
                            payee reads at a glance the way it does in the vendor list. */}
                        <Dropdown
                          ariaLabel="Paid to"
                          value={paidTo}
                          onChange={setPaidTo}
                          options={['Home Depot', 'Ferguson Supply', 'Rexel Electrical']}
                          leading={<Avatar initials="HD" bg="#fde2e4" color="#b5254c" size={22} />}
                        />
                      </div>
                      <div>
                        <label style={lbl}>Name</label>
                        <input className="fi" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Purchase Order</label>
                        <Dropdown
                          ariaLabel="Purchase Order"
                          value={purchaseOrder}
                          onChange={setPurchaseOrder}
                          placeholder="-- None Selected --"
                          options={['', 'PO-1042 Electrical rough-in', 'PO-1051 Finish materials']}
                        />
                      </div>
                    </div>

                    {/* ── Description ── */}
                    <div style={{ marginTop: 28 }}>
                      <label style={lbl}>Description</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        style={{
                          width: '100%', height: 116, padding: '12px 14px', fontSize: 14, lineHeight: '20px',
                          fontFamily: 'inherit', color: 'var(--g800)', background: 'white',
                          border: '1px solid var(--g200)', borderRadius: 'var(--radius) var(--radius) 0 0',
                          outline: 'none', resize: 'vertical', display: 'block',
                        }}
                      />
                      <DescriptionToolbar />
                    </div>

                    {/* ── New line items experience ── */}
                    {newLineItems && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14, marginTop: 28,
                        padding: '12px 16px', border: '1px solid var(--g200)', borderRadius: 4, background: 'white',
                      }}>
                        <span style={{
                          padding: '2px 12px', borderRadius: 20, background: 'var(--bt-blue-light)',
                          color: 'var(--bt-blue)', fontSize: 13, fontWeight: 600,
                        }}>New</span>
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--g800)' }}>You're using the new line items experience.</span>
                        <button
                          className="btn btn-s"
                          style={{ padding: '7px 16px', fontSize: 13 }}
                          onClick={() => { setNewLineItems(false); setToast('Switched back to the classic line items grid'); }}
                        >
                          Switch back
                        </button>
                      </div>
                    )}

                    {/* ── Costs ── */}
                    <div style={{ marginTop: 28 }}>
                      <div style={{ ...secTitle, marginBottom: 12 }}>Costs</div>
                      <div style={{ border: '1px solid var(--g200)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                            <thead>
                              <tr style={{ background: 'var(--g50)', borderBottom: '1px solid var(--g200)', height: 52 }}>
                                <th style={{ ...th, width: 48, paddingLeft: 16, borderRight: 'none' }}>
                                  <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={() => setCheckedRows(allChecked ? [] : costs.map(c => c.id))}
                                    style={{ width: 16, height: 16, accentColor: 'var(--bt-blue)' }}
                                    aria-label="Select all costs"
                                  />
                                </th>
                                <th style={th}><HeadCell label="Title" /></th>
                                <th style={th}><HeadCell label="Cost code" /></th>
                                <th style={th}><HeadCell label="Cost type" /></th>
                                <th style={{ ...th, width: 100 }}><HeadCell label="Unit" /></th>
                                <th style={{ ...th, width: 130, textAlign: 'right' }}><HeadCell label="Unit cost" align="right" /></th>
                                <th style={{ ...th, width: 130, textAlign: 'right' }}><HeadCell label="Quantity" align="right" /></th>
                                <th style={{ ...th, width: 150, textAlign: 'right' }}>Builder cost</th>
                                <th style={{ ...th, width: 96, borderRight: 'none' }} />
                              </tr>
                            </thead>
                            <tbody>
                              {costs.map(row => {
                                const active = activeRow === row.id;
                                const cellStyle: React.CSSProperties = {
                                  ...td,
                                  ...(active && !paid ? { background: 'var(--bt-blue-light)' } : {}),
                                };
                                return (
                                  <tr
                                    key={row.id}
                                    onClick={() => setActiveRow(row.id)}
                                    style={{
                                      borderBottom: '1px solid var(--g200)',
                                      cursor: 'pointer',
                                      boxShadow: active && !paid ? 'inset 0 0 0 1.5px var(--bt-blue)' : undefined,
                                    }}
                                  >
                                    <td style={{ ...cellStyle, paddingLeft: 16 }}>
                                      <input
                                        type="checkbox"
                                        checked={checkedRows.includes(row.id)}
                                        onChange={() => toggleRow(row.id)}
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: 16, height: 16, accentColor: 'var(--bt-blue)' }}
                                        aria-label={`Select ${row.title || 'new item'}`}
                                      />
                                    </td>
                                    <td style={cellStyle}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {!paid && <DragHandle />}
                                        <input
                                          value={row.title}
                                          onChange={e => updateRow(row.id, { title: e.target.value })}
                                          onClick={e => e.stopPropagation()}
                                          readOnly={paid}
                                          placeholder="--"
                                          style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', font: 'inherit', color: 'inherit', outline: 'none', padding: 0 }}
                                        />
                                      </span>
                                    </td>
                                    <td style={cellStyle}>
                                      {paid ? row.costCode : (
                                        <select
                                          value={row.costCode}
                                          onChange={e => updateRow(row.id, { costCode: e.target.value })}
                                          onClick={e => e.stopPropagation()}
                                          style={{ border: 'none', background: 'transparent', font: 'inherit', color: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer', maxWidth: '100%' }}
                                        >
                                          {COST_CODES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                      )}
                                    </td>
                                    <td style={cellStyle}>
                                      {paid ? row.costType : (
                                        <select
                                          value={row.costType}
                                          onChange={e => updateRow(row.id, { costType: e.target.value })}
                                          onClick={e => e.stopPropagation()}
                                          style={{ border: 'none', background: 'transparent', font: 'inherit', color: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                        >
                                          <option>Material</option>
                                          <option>Labor</option>
                                          <option>Subcontractor</option>
                                          <option>Equipment</option>
                                          <option>Other</option>
                                        </select>
                                      )}
                                    </td>
                                    <td style={cellStyle}>{row.unit}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>${fmt(row.unitCost)}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>{row.quantity}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>${fmt(row.unitCost * row.quantity)}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right', paddingRight: 12 }}>
                                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                        {/* Once it's paid the row is a record, not a
                                            worksheet: the row menu goes away and only
                                            the drill-in stays. */}
                                        {!paid && <span style={{ color: 'var(--g500)', letterSpacing: 1, fontSize: 15, lineHeight: 1 }}>···</span>}
                                        {active && !paid ? (
                                          <span style={{
                                            width: 26, height: 26, borderRadius: 4, background: 'var(--bt-blue)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          }}><Chevron color="white" /></span>
                                        ) : (
                                          <span style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Chevron /></span>
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                              {!paid && (
                                <tr style={{ borderBottom: '1px solid var(--g200)' }}>
                                  <td colSpan={9} style={{ padding: 0 }}>
                                    <button
                                      type="button"
                                      onClick={addRow}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                        padding: '14px 16px', background: 'none', border: 'none',
                                        cursor: 'pointer', font: 'inherit', fontSize: 14, color: 'var(--g800)',
                                      }}
                                    >
                                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                                      Item
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {/* Totals. A paid record has to answer "how much of
                                  this is settled", so the block grows from one line
                                  to three the moment payment lands. */}
                              <tr style={{ background: 'var(--g50)' }}>
                                <td colSpan={9} style={{ padding: '16px 12px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {totalLine('Total', total)}
                                    {paid && totalLine('Amount paid', amountPaid)}
                                    {paid && totalLine('Remaining balance', total - amountPaid)}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {!paid && (
                        <button
                          className="btn btn-s"
                          style={{ marginTop: 16, padding: '8px 16px', fontSize: 14 }}
                          onClick={() => setToast('Pick catalog items to add')}
                        >
                          Add from catalog
                        </button>
                      )}
                    </div>

                    {/* ── Approvals ── */}
                    <div style={{ marginTop: 36 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={secTitle}>Approvals</span>
                        <span title="Approvers sign off before this can be marked ready for payment" style={{ color: 'var(--g500)', display: 'flex', cursor: 'default' }}>
                          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                            <path d="M6.5 12.5h5M7.5 15h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M9 2.5a4.5 4.5 0 0 0-2.6 8.2v1.8h5.2v-1.8A4.5 4.5 0 0 0 9 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>

                      <div style={{ maxWidth: 760, border: '1px solid var(--g200)', borderRadius: 4 }}>
                        <div style={{ padding: '14px 20px', fontSize: 15, fontWeight: 700, color: 'var(--bt-midnight)', borderBottom: '1px solid var(--g200)' }}>
                          Approvers
                        </div>

                        {approvers.map(a => (
                          <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--g200)' }}>
                            <div style={{ display: 'flex', alignItems: a.when ? 'flex-start' : 'center', gap: 12 }}>
                              <Avatar initials={a.initials} bg={a.bg} color={a.color} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--g800)' }}>{a.name}</div>
                                {a.when && <div style={{ fontSize: 12, color: 'var(--g500)' }}>{a.when}</div>}
                              </div>
                              <span
                                className="status"
                                style={a.state === 'Approved'
                                  ? { background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 500 }
                                  : { background: 'var(--yellow-bg)', color: 'var(--yellow)', fontWeight: 500 }}
                              >{a.state}</span>
                              <button
                                type="button"
                                aria-label={`Remove ${a.name}`}
                                onClick={() => { setApprovers(list => list.filter(l => l.id !== a.id)); setToast(`${a.name} removed`); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', letterSpacing: 1, fontSize: 15, lineHeight: '20px', padding: 0 }}
                              >···</button>
                            </div>
                            {a.comment && (
                              <div style={{
                                marginTop: 10, marginLeft: 40, padding: '12px 14px', background: '#eef2f9',
                                borderRadius: 4, fontSize: 13, fontStyle: 'italic', color: 'var(--g700)', lineHeight: '20px',
                              }}>{a.comment}</div>
                            )}
                          </div>
                        ))}

                        {/* Adding an approver swaps the row for a typeahead plus
                            confirm/cancel, rather than opening a separate dialog. */}
                        {addingApprover ? (
                          <div ref={pickerRef} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                            <input
                              autoFocus
                              className="fi"
                              value={approverQuery}
                              onChange={e => { setApproverQuery(e.target.value); setPickerOpen(true); }}
                              onFocus={() => setPickerOpen(true)}
                              style={{ flex: 1, borderColor: 'var(--bt-blue)', boxShadow: '0 0 0 3px rgba(0,101,219,0.12)' }}
                              aria-label="Search people"
                            />
                            <button
                              type="button"
                              aria-label="Confirm approvers"
                              onClick={confirmAddApprover}
                              style={{
                                width: 40, height: 40, borderRadius: 6, border: 'none', cursor: 'pointer',
                                background: '#8ea2e8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9.5l3.5 3.5L14 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <button
                              type="button"
                              aria-label="Cancel"
                              onClick={cancelAddApprover}
                              style={{
                                width: 40, height: 40, borderRadius: 6, border: '1px solid var(--g200)', cursor: 'pointer',
                                background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" /></svg>
                            </button>

                            {pickerOpen && (
                              /* Opens upward: the row sits low in a long form, so a
                                 downward menu would land off the card. */
                              <div style={{
                                position: 'absolute', bottom: 'calc(100% - 6px)', left: 20, width: 420,
                                background: 'white', border: '1px solid var(--g200)', borderRadius: 4,
                                boxShadow: '0 8px 24px rgba(15,23,42,0.18)', zIndex: 20,
                                maxHeight: 340, overflowY: 'auto',
                              }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px dashed var(--g200)', cursor: 'pointer', fontSize: 15 }}>
                                  <input
                                    type="checkbox"
                                    checked={picked.includes('Amy Li')}
                                    onChange={() => setPicked(p => p.includes('Amy Li') ? p.filter(x => x !== 'Amy Li') : [...p, 'Amy Li'])}
                                    style={{ width: 17, height: 17, accentColor: 'var(--bt-blue)' }}
                                  />
                                  Me
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px dashed var(--g200)', cursor: 'pointer', fontSize: 15 }}>
                                  <input
                                    type="checkbox"
                                    checked={picked.length === PEOPLE.length}
                                    onChange={() => setPicked(picked.length === PEOPLE.length ? [] : PEOPLE.map(p => p.name))}
                                    style={{ width: 17, height: 17, accentColor: 'var(--bt-blue)' }}
                                  />
                                  Check All
                                </label>
                                {visiblePeople.map(p => (
                                  <label key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', cursor: 'pointer', fontSize: 15 }}>
                                    <input
                                      type="checkbox"
                                      checked={picked.includes(p.name)}
                                      onChange={() => setPicked(list => list.includes(p.name) ? list.filter(x => x !== p.name) : [...list, p.name])}
                                      style={{ width: 17, height: 17, accentColor: 'var(--bt-blue)' }}
                                    />
                                    <Avatar initials={p.initials} bg={p.bg} color={p.color} size={26} />
                                    <span style={{ fontWeight: p.isMe ? 700 : 400, color: 'var(--g800)' }}>{p.name}</span>
                                  </label>
                                ))}
                                {visiblePeople.length === 0 && (
                                  <div style={{ padding: '14px 16px', fontSize: 14, color: 'var(--g500)' }}>No one matches that name.</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startAddApprover}
                            style={{
                              display: 'block', width: '100%', padding: '14px 20px', background: 'none',
                              border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 14, color: 'var(--g800)',
                            }}
                          >
                            + Add approver
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── QuickBooks ──
                        The sync switch and the sync state read as one row: what
                        you're asking for on the left, where it actually stands on
                        the right. */}
                    <div style={{ marginTop: 36 }}>
                      <div style={{ ...secTitle, marginBottom: 14 }}>QuickBooks</div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, maxWidth: 1010 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--g800)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={sendToQbo}
                            onChange={e => setSendToQbo(e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--bt-blue)' }}
                          />
                          Send to QuickBooks
                        </label>
                        <div style={{ textAlign: 'left', maxWidth: 320 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g800)', marginBottom: 6 }}>QuickBooks Status</div>
                          {/* Green only once it has actually landed in QuickBooks.
                              Queued is a promise, not a result, so it stays neutral. */}
                          <span
                            className="status"
                            style={qboBilled
                              ? { background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 500 }
                              : { background: 'var(--g100)', color: 'var(--g600)', fontWeight: 500 }}
                          >
                            {qboBilled ? 'Billed' : sendToQbo ? 'Queued' : 'Not Billed'}
                          </span>
                          {/* Name the transaction it becomes. The whole point of the
                              flow is that a receipt lands as an Expense against the
                              account that paid, not as a bill still owed. */}
                          {sendToQbo && (
                            <div style={{ fontSize: 12, color: 'var(--g600)', marginTop: 8, lineHeight: '17px' }}>
                              {paid ? 'Created in QuickBooks as an Expense' : 'Will send as an Expense'}
                              {paymentAccount ? `, paid from ${paymentAccount}.` : '.'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── Attachments ── */}
                    <div style={{ marginTop: 36 }}>
                      <div style={{ ...secTitle, marginBottom: 14 }}>Attachments</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <button className="btn btn-s" style={{ padding: '8px 16px', fontSize: 14 }} onClick={() => setToast('Choose a file to attach')}>Add</button>
                        <button className="btn btn-s" style={{ padding: '8px 16px', fontSize: 14 }} onClick={() => setToast('New document created')}>Create new doc</button>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer', marginBottom: 12 }}>
                        <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--bt-blue)' }} />
                        Select all
                      </label>
                      {/* Receipt scan, the reason most of these records exist at all. */}
                      <div style={{ width: 100, border: '1px solid var(--g200)', borderRadius: 4, overflow: 'hidden', background: 'white' }}>
                        <div style={{ height: 100, background: 'var(--g50)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--g100)' }}>
                          <svg width="44" height="54" viewBox="0 0 44 54" fill="none">
                            <rect x="0.6" y="0.6" width="42.8" height="52.8" rx="2" fill="white" stroke="#d1d5db" strokeWidth="1.2" />
                            {[9, 14, 19, 32, 37, 42].map(y => (
                              <rect key={y} x="7" y={y} width={y > 30 ? 22 : 30} height="2" rx="1" fill="#e5e8eb" />
                            ))}
                            <rect x="7" y="24" width="30" height="4" rx="2" fill="#15803d" />
                          </svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 6px 8px' }}>
                          <span style={{ fontSize: 12, color: 'var(--g700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>INV...</span>
                          <span style={{ color: 'var(--g500)', fontSize: 13, lineHeight: 1, cursor: 'pointer' }}>⋮</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Custom fields ──
                        Collapsed by count: accounts configure their own, so the
                        header has to say how many are down there before you open it. */}
                    <div style={{ marginTop: 36, borderTop: '1px solid var(--g200)', paddingTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => setCustomOpen(o => !o)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none',
                          cursor: 'pointer', font: 'inherit', padding: 0, color: 'var(--bt-midnight)',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: customOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
                          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={secTitle}>Custom fields (2)</span>
                      </button>

                      {customOpen && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 16px', maxWidth: 1010, marginTop: 16 }}>
                          <div>
                            <label style={lbl}>Whole Number</label>
                            <input className="fi" type="number" defaultValue="" />
                          </div>
                          <div>
                            <label style={lbl}>Buildertrend Misc.</label>
                            <input className="fi" defaultValue="" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action bar. Drafting actions while it's a draft; once it's paid the
            record is settled, so the bar turns into what you do next with it. */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', background: 'white', borderTop: '1px solid var(--g200)', flexShrink: 0,
        }}>
          <span title="Created Jan. 20, 2026 by Marcus Reed" style={{ color: 'var(--g400)', display: 'flex', cursor: 'default' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="10" cy="6.6" r="0.9" fill="currentColor" />
            </svg>
          </span>

          {paid ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Print / Delete / Void move into an overflow: they're the rare
                  paths next to "carry on to the next document". */}
              <div ref={moreRef} style={{ position: 'relative' }}>
                <button
                  className="btn btn-s"
                  aria-label="More actions"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen(o => !o)}
                  style={{ padding: '8px 14px', letterSpacing: 1 }}
                >···</button>
                {moreOpen && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, minWidth: 170,
                    background: 'white', border: '1px solid var(--g200)', borderRadius: 6,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.18)', overflow: 'hidden', zIndex: 20,
                  }}>
                    {[
                      { label: 'Print', run: () => setToast(`${type} sent to print`) },
                      { label: 'Delete', run: () => setToast(`${type} deleted`) },
                      { label: 'Void Bill', run: () => { setStatus('Draft'); setToast(`${type} voided`); } },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => { setMoreOpen(false); item.run(); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '12px 18px',
                          background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
                          fontSize: 15, color: 'var(--g800)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--g50)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >{item.label}</button>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-s" onClick={() => setToast('Starting a new invoice')}>New Invoice</button>
              {/* Split primary: the caret carries the other save-and-go options. */}
              <div style={{ display: 'flex' }}>
                <button
                  className="btn btn-p"
                  style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
                  onClick={() => { setToast(`${type} saved`); onClose?.(); }}
                >
                  Save &amp; Close
                </button>
                <span style={{ width: 1, background: 'rgba(255,255,255,0.35)' }} />
                <button
                  className="btn btn-p"
                  aria-label="More save options"
                  style={{ borderRadius: '0 var(--radius) var(--radius) 0', padding: '8px 12px' }}
                  onClick={() => setToast('Save and create another')}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          ) : readyForPayment ? (
            /* Only bills reach this queue. Paying it is what closes the record. */
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={() => setToast(`${type} deleted`)}>Delete</button>
              <button className="btn btn-s" onClick={() => { setStatus('In review'); setToast(`${type} sent back to review`); }}>
                Send back
              </button>
              <button
                className="btn btn-p"
                onClick={() => { setStatus('Paid'); setToast(`Payment recorded on this ${type.toLowerCase()}`); }}
              >
                Record payment
              </button>
            </div>
          ) : inReview ? (
            /* Leaving review. Approvers name the action, the document type picks
               the destination: a receipt is already paid, a bill still is not. */
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={() => setToast(`${type} deleted`)}>Delete</button>
              <button className="btn btn-s" onClick={() => { setStatus('Draft'); setToast(`${type} returned to the inbox`); }}>
                Send back
              </button>
              <button
                className="btn btn-p"
                onClick={() => {
                  setStatus(reviewNext);
                  setToast(
                    hasApprovers ? `${type} approved to job`
                      : isReceipt ? `${type} marked as paid`
                      : `${type} is ready for payment`,
                  );
                }}
              >
                {hasApprovers ? 'Approve to job' : isReceipt ? 'Mark as paid' : 'Mark Ready for Payment'}
              </button>
            </div>
          ) : (
            /* Inbox / Draft. Save as draft loops back here; the primary action
               moves the record on, named by whether anyone has to approve it. */
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-s" onClick={() => setToast(`${type} deleted`)}>Delete</button>
              <button className="btn btn-s" onClick={() => setToast('Draft saved')}>Save as draft</button>
              <button
                className="btn btn-p"
                onClick={() => {
                  setStatus('In review');
                  setToast(hasApprovers ? `${type} sent for approval` : `${type} saved to job`);
                }}
              >
                {hasApprovers ? 'Send for approval' : 'Save to job'}
              </button>
            </div>
          )}
        </div>

        {toast && (
          <div style={{
            position: 'absolute', bottom: 76, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bt-midnight)', color: 'white', padding: '10px 18px',
            borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, zIndex: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}>{toast}</div>
        )}
      </div>
    </>
  );
}
