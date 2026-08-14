import { useState, useRef, useEffect } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge, BdsTabs, BdsIcon } from '../bds';
import { Job, InvoicingMode, DrawScheduleLine } from '../types';
import { INVOICING_MODE_LABELS, TIME_INTERVAL_DEMO_INVOICES, AIA_DEMO_INVOICES, type DemoInvoiceRow } from '../mockData';
import InvoicingModePicker from './InvoicingModePicker';
import PaymentScheduleModal from './PaymentScheduleModal';
import InvoiceTypeModal, { type InvoiceTypeChoice as NewInvoiceChoice } from './InvoiceTypeModal';
import PaymentScheduleTracker from './PaymentScheduleTracker';
import ImportTemplateModal from './ImportTemplateModal';
import InvoicesSettingsModal from './InvoicesSettingsModal';

type TabKey = 'invoices' | 'payments' | 'credit-memos' | 'deposits';
type InvoiceTypeChoice = 'progress' | 'invoice';

/* BdsIcon carries no info or filter glyph, and inventing paths in the shared BDS
   module would be worse than keeping these beside their only caller. */
const InfoGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 7.2v4M8 4.9v.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const FilterGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 3.5h12l-4.6 5.2v4L6.6 11V8.7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const GearGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 1.6v1.7M8 12.7v1.7M2.5 8H.8M15.2 8h-1.7M4.1 4.1 2.9 2.9M13.1 13.1l-1.2-1.2M11.9 4.1l1.2-1.2M2.9 13.1l1.2-1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

export default function OwnerInvoicesPage({
  job,
  invoicingMode,
  showModePicker,
  onSetInvoicingMode,
  onRequestChangeMode,
  onAddInvoice,
  onAddInvoiceSmart,
  onSavePaymentSchedule,
  onDeletePaymentSchedule,
  onOpenJobDetails,
  emptyState = false,
  jobDefaultInvoiceKind,
  openScheduleOnMount,
  onScheduleOpened,
  createdInvoices,
  onCreateInvoicesFromSchedule,
  onAddInvoiceReimagined,
  onImportTemplate,
  onAddInvoiceDirect,
  invoiceTypeChoices,
  defaultInvoiceKind,
  onDefaultInvoiceKindChange,
  hidePaymentSchedule = false,
}: {
  job: Job;
  invoicingMode?: InvoicingMode;
  showModePicker: boolean;
  onSetInvoicingMode: (mode: InvoicingMode) => void;
  onRequestChangeMode: () => void;
  onAddInvoice: (mode: InvoicingMode) => void;
  onAddInvoiceSmart: () => void;
  onSavePaymentSchedule: (draws: DrawScheduleLine[]) => void;
  onDeletePaymentSchedule: () => void;
  onOpenJobDetails?: () => void;
  /* "Nothing invoiced yet" view: the state a builder lands in after backing out
     of an invoice without saving. Skips the billing-mode picker and the demo
     history entirely, because neither is true of a job with no invoices. */
  emptyState?: boolean;
  /* Set only in the reimagined loop. There the invoice page asks Standard vs
     Progress itself, so "+ Invoice" is a single button that opens it rather
     than a split button that decides the type out here. */
  onAddInvoiceReimagined?: (kind?: 'regular' | 'progress') => void;
  onImportTemplate?: (templateId: string) => void;
  /* Financial > Invoice's loop. "+ Invoice" asks which of the three documents
     they're creating first, then hands the answer back. */
  onAddInvoiceDirect?: (choice: NewInvoiceChoice, makeDefault: boolean) => void;
  /* Which documents "+ Invoice" offers. Default is all three; a loop that
     doesn't set up payment schedules here passes the two it can create. */
  invoiceTypeChoices?: NewInvoiceChoice[];
  /* The job's saved Default invoice type. Set means the builder answered the
     type question for this job, so "+ Invoice" skips the modal. */
  jobDefaultInvoiceKind?: 'regular' | 'progress' | null;
  /* Switching to Payment schedule from inside an invoice sends the builder
     back here with the schedule editor already open. */
  openScheduleOnMount?: boolean;
  onScheduleOpened?: () => void;
  /* Invoices this job actually has in the Financial > Invoice loop — one per
     draw once a schedule is created. Empty means the "No invoices yet" state. */
  createdInvoices?: DemoInvoiceRow[];
  onCreateInvoicesFromSchedule?: (draws: DrawScheduleLine[]) => void;
  /* The company's Default invoice type, so the grid's Settings button opens the
     Invoices settings modal already showing which type new invoices use. */
  defaultInvoiceKind?: 'regular' | 'progress';
  onDefaultInvoiceKindChange?: (kind: 'regular' | 'progress') => void;
  /* Open book bills what the job spent, so it has no draws to schedule: the
     toolbar button goes with the choice being dropped from "+ Invoice". */
  hidePaymentSchedule?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>('invoices');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showInvoiceMenu, setShowInvoiceMenu] = useState(false);
  const invoiceMenuRef = useRef<HTMLDivElement>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);
  // The split button's own local "which type did I last pick" — independent
  // of the job's persisted billing mode, so switching this doesn't change
  // what's set on Job Details/the mode picker, only what the button does now.
  const [invoiceTypeChoice, setInvoiceTypeChoice] = useState<InvoiceTypeChoice>(
    invoicingMode === 'aia-percent-complete' ? 'progress' : 'invoice'
  );
  useEffect(() => {
    setInvoiceTypeChoice(invoicingMode === 'aia-percent-complete' ? 'progress' : 'invoice');
  }, [invoicingMode, job.id]);

  useEffect(() => {
    if (openScheduleOnMount) { setShowScheduleModal(true); onScheduleOpened?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openScheduleOnMount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (invoiceMenuRef.current && !invoiceMenuRef.current.contains(e.target as Node)) setShowInvoiceMenu(false);
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) setShowTemplateMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasSchedule = (job.drawSchedule ?? []).length > 0;
  /* Financial > Invoice starts the job from nothing: the grid is empty even
     though the mock job carries a baked draw schedule. The toolbar has to agree,
     or "+ Payment schedule" is already spent before the builder arrives and the
     modal opens on six draws they never entered. So in that loop the schedule
     counts as existing only once it was created here. */
  const scheduleReady = onCreateInvoicesFromSchedule ? (createdInvoices?.length ?? 0) > 0 : hasSchedule;
  const readyDraw = invoicingMode === 'milestone-draws'
    ? (job.drawSchedule ?? []).find(d => d.phaseComplete && !d.invoiced)
    : undefined;
  // Time interval / Open book's equivalent of a "ready draw" — the next
  // not-yet-released invoice. Surfaced as its own banner (like the draws
  // one) and pulled out of the list below so it isn't shown twice.
  const readyTimeIntervalRow = invoicingMode === 'time-interval'
    ? TIME_INTERVAL_DEMO_INVOICES.find(r => r.status === 'Unreleased')
    : undefined;
  // Framed relative to the last invoice sent, not a calendar month — the
  // interval could be monthly, bi-monthly, or anything else a builder uses.
  const lastInvoicedRow = [...TIME_INTERVAL_DEMO_INVOICES].reverse().find(r => r.status === 'Released');
  // AIA's equivalent — the next pay application that's been worked but not
  // yet certified/sent.
  const readyAiaRow = invoicingMode === 'aia-percent-complete'
    ? AIA_DEMO_INVOICES.find(r => r.status === 'Pending')
    : undefined;
  // Nothing exists on the client's side yet: BT has assembled the costs, and the
  // button creates an editable draft that sits Unreleased until it's sent. The
  // banners say so explicitly — "Ready to invoice" alone read like an invoice
  // already existed, or like the button would send one.
  const draftNote = 'Creating it saves an editable draft. Nothing goes to the client until you review and send it.';

  const askingForMode = !emptyState && (showModePicker || !invoicingMode);
  // AIA's progress invoice already covers percent-complete billing end to
  // end, so a separate payment-schedule reference doesn't apply there — it
  // does for both draws (the schedule itself) and regular/open-book billing
  // (so builders still have something to point to for cadence).
  const showPaymentScheduleButton = !hidePaymentSchedule && !askingForMode && (invoicingMode === 'milestone-draws' || invoicingMode === 'time-interval');

  // Owner Invoices shows very different content per billing mode — the
  // milestone-draws grid comes from the job's real drawSchedule, while
  // time-interval and AIA show mode-appropriate demo history (regular
  // invoices/change orders vs. AIA payment applications) since those aren't
  // modeled as real per-job data yet.
  const gridRows: DemoInvoiceRow[] = invoicingMode === 'milestone-draws'
    ? (job.drawSchedule ?? []).map(d => ({
        id: String(d.drawNumber).padStart(4, '0'),
        title: d.title,
        status: d.invoiced ? 'Released' as const : d.phaseComplete ? 'Pending' as const : 'Unreleased' as const,
        amount: d.amount,
      }))
    : invoicingMode === 'aia-percent-complete'
    ? AIA_DEMO_INVOICES.filter(r => r.id !== readyAiaRow?.id)
    : invoicingMode === 'time-interval'
    ? TIME_INTERVAL_DEMO_INVOICES.filter(r => r.id !== readyTimeIntervalRow?.id)
    : [];
  const gridTotal = gridRows.reduce((s, r) => s + r.amount, 0);
  const appliedDeposits = 0;
  const amountPaid = 0;
  const remainingBalance = gridTotal - appliedDeposits - amountPaid;
  /* Job carries no contract value yet, so the empty state's header uses a demo
     figure. Payments is genuinely 0 here: nothing has been invoiced. */
  const originalClientPrice = 100000;
  const emptyStatePayments = 0;
  const money2 = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bds-scope" style={{ padding: '24px 32px', width: '100%', background: '#fff', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ color: 'var(--bds-color-gray-60)', fontSize: 13, marginBottom: 2 }}>{job.name}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--bds-color-gray-90)' }}>Invoices</h1>
        {emptyState && (
          /* Contract math reads left to right the way the real page does:
             what was contracted, less what's been paid, equals what's left. */
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }}>
            {([
              ['Original client price', originalClientPrice],
              ['Payments', emptyStatePayments],
              ['Remaining balance', originalClientPrice - emptyStatePayments],
            ] as const).map(([label, value], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                {i > 0 && <span style={{ color: 'var(--bds-color-gray-40)', fontSize: 18 }}>{i === 2 ? '=' : '−'}</span>}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bds-color-gray-70)', marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--bds-color-gray-90)', whiteSpace: 'nowrap' }}>{money2(value)}</div>
                </div>
              </div>
            ))}
            <span
              title="Original client price less payments received."
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--bds-color-gray-15)', color: 'var(--bds-color-gray-60)', cursor: 'help', flexShrink: 0 }}
            >
              <InfoGlyph />
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {emptyState && (
            <>
              <BdsButton text="..." displayType="secondary" ariaLabel="More actions" />
              {/* Opens the Invoices company settings, where the default invoice
                  type lives. The grid is where a builder notices the default is
                  wrong, so the way to change it is here rather than three
                  levels into the settings page. */}
              <BdsButton text="Settings" displayType="secondary" icon={<GearGlyph />} onClick={() => setShowSettingsModal(true)} />
              <BdsButton text="Filter" displayType="secondary" icon={<FilterGlyph />} />
              {/* Once a schedule exists the button stops being "add one" and
                  becomes the way to look at it. */}
              {!hidePaymentSchedule && (scheduleReady
                ? <BdsButton text="Payment schedule" displayType="secondary" onClick={() => setShowTracker(true)} />
                : <BdsButton text="Payment schedule" displayType="secondary" icon={<BdsIcon name="plus" size={14} />} onClick={() => setShowScheduleModal(true)} />)}
            </>
          )}
          {showPaymentScheduleButton && (
            <BdsButton text="Payment Schedule" displayType="secondary" onClick={() => setShowScheduleModal(true)} />
          )}
          {/* Before a default exists the button asks the question; after one is
              set it becomes that answer, with the other type and templates
              behind the caret. Same two clicks either way, but the common case
              is one. */}
          {onAddInvoiceDirect && !jobDefaultInvoiceKind && (
            <BdsButton text="+ Invoice" displayType="primary" onClick={() => setShowTypeModal(true)} />
          )}
          {onAddInvoiceDirect && jobDefaultInvoiceKind && (
            <div ref={templateMenuRef} style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                onClick={() => onAddInvoiceDirect(jobDefaultInvoiceKind === 'progress' ? 'progress' : 'standard', false)}
                style={{
                  background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                  padding: '0 16px', height: 36, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  borderRadius: '6px 0 0 6px', borderRight: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                + {jobDefaultInvoiceKind === 'progress' ? 'Progress invoice' : 'Invoice'}
              </button>
              <button
                type="button"
                aria-label="More invoice options"
                onClick={() => setShowTemplateMenu(v => !v)}
                style={{
                  background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                  padding: '0 10px', height: 36, cursor: 'pointer', borderRadius: '0 6px 6px 0',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <BdsIcon name="chevron-down" size={14} />
              </button>
              {showTemplateMenu && (
                <div style={{
                  position: 'absolute', top: 40, right: 0, background: '#fff',
                  border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 20, minWidth: 200, padding: 4,
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateMenu(false);
                      onAddInvoiceDirect(jobDefaultInvoiceKind === 'progress' ? 'standard' : 'progress', false);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      padding: '8px 12px', fontSize: 13, color: 'var(--bds-color-gray-90)', cursor: 'pointer', borderRadius: 4,
                    }}
                  >
                    {jobDefaultInvoiceKind === 'progress' ? 'Standard invoice' : 'Progress invoice'}
                  </button>
                  {onImportTemplate && (
                    <button
                      type="button"
                      onClick={() => { setShowTemplateMenu(false); setShowTemplateModal(true); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                        padding: '8px 12px', fontSize: 13, color: 'var(--bds-color-gray-90)', cursor: 'pointer', borderRadius: 4,
                      }}
                    >
                      Import from template
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Reimagined loop: the caret no longer picks a billing type, since
              the invoice page asks that itself. It offers the one thing that
              can't be reached from there, an invoice built from a saved
              template. */}
          {onAddInvoiceDirect ? null : onAddInvoiceReimagined ? (
            <div ref={templateMenuRef} style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                onClick={() => onAddInvoiceReimagined()}
                style={{
                  background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                  padding: '0 16px', height: 36, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  borderRadius: '6px 0 0 6px', borderRight: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                + Invoice
              </button>
              <button
                type="button"
                aria-label="More invoice options"
                onClick={() => setShowTemplateMenu(v => !v)}
                style={{
                  background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                  padding: '0 10px', height: 36, cursor: 'pointer', borderRadius: '0 6px 6px 0',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <BdsIcon name="chevron-down" size={14} />
              </button>
              {showTemplateMenu && (
                <div style={{
                  position: 'absolute', top: 40, right: 0, background: '#fff',
                  border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 20, minWidth: 200, padding: 4,
                }}>
                  <button
                    type="button"
                    onClick={() => { setShowTemplateMenu(false); setShowTemplateModal(true); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                      padding: '8px 12px', fontSize: 13, color: 'var(--bds-color-gray-90)', cursor: 'pointer', borderRadius: 4,
                    }}
                  >
                    Import from template
                  </button>
                </div>
              )}
            </div>
          ) : (
          /* Split button always available, even before a mode is chosen. Only
             two invoice types exist here now — whichever was picked last is
             the primary action; the caret always offers just the other one. */
          <div ref={invoiceMenuRef} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              onClick={invoiceTypeChoice === 'progress' ? () => onAddInvoice('aia-percent-complete') : onAddInvoiceSmart}
              style={{
                background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                padding: '0 16px', height: 36, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                borderRadius: '6px 0 0 6px', borderRight: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              + {invoiceTypeChoice === 'progress' ? 'Progress invoice' : 'Invoice'}
            </button>
            <button
              type="button"
              aria-label="Choose invoice type"
              onClick={() => setShowInvoiceMenu(v => !v)}
              style={{
                background: 'var(--bds-color-blue-70)', color: '#fff', border: 'none',
                padding: '0 10px', height: 36, cursor: 'pointer', borderRadius: '0 6px 6px 0',
                display: 'flex', alignItems: 'center',
              }}
            >
              <BdsIcon name="chevron-down" size={14} />
            </button>
            {showInvoiceMenu && (
              <div style={{
                position: 'absolute', top: 40, right: 0, background: '#fff',
                border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 20, minWidth: 160, padding: 4,
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (invoiceTypeChoice === 'progress') { setInvoiceTypeChoice('invoice'); onAddInvoiceSmart(); }
                    else { setInvoiceTypeChoice('progress'); onAddInvoice('aia-percent-complete'); }
                    setShowInvoiceMenu(false);
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '8px 12px', fontSize: 13, color: 'var(--bds-color-gray-90)', cursor: 'pointer', borderRadius: 4,
                  }}
                >
                  {invoiceTypeChoice === 'progress' ? 'Invoice' : 'Progress invoice'}
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {!emptyState && !askingForMode && invoicingMode && (
        <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
          {([
            ['Job running total', gridTotal],
            ['Applied deposits', appliedDeposits],
            ['Amount paid', amountPaid],
            ['Remaining balance', remainingBalance],
          ] as const).map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {i > 0 && <span style={{ color: 'var(--bds-color-gray-40)', fontSize: 16 }}>{i === 3 ? '=' : '−'}</span>}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bds-color-gray-70)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bds-color-gray-15)', marginBottom: 24 }}>
        <BdsTabs
          ariaLabel="Owner invoices sections"
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'invoices', label: 'Invoices' },
            { key: 'payments', label: 'Payments' },
            { key: 'credit-memos', label: 'Credit Memos' },
            { key: 'deposits', label: 'Deposits' },
          ]}
        />
        {!emptyState && !askingForMode && invoicingMode && (
          <button
            type="button"
            onClick={onRequestChangeMode}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <BdsBadge text={`Billed as: ${INVOICING_MODE_LABELS[invoicingMode].label}`} displayType="info" />
            <span style={{ fontSize: 13, color: 'var(--bds-color-blue-70)', fontWeight: 500 }}>Change</span>
          </button>
        )}
      </div>

      {tab !== 'invoices' && (
        <div style={{ color: 'var(--bds-color-gray-60)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Nothing here yet.
        </div>
      )}

      {tab === 'invoices' && askingForMode && (
        <InvoicingModePicker job={job} onContinue={onSetInvoicingMode} onOpenJobDetails={onOpenJobDetails} />
      )}

      {tab === 'invoices' && !emptyState && !askingForMode && invoicingMode === 'milestone-draws' && !hasSchedule && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🗓️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--bds-color-gray-90)' }}>Set up a payment schedule</h2>
          <p style={{ color: 'var(--bds-color-gray-60)', maxWidth: 420, margin: '0 0 20px' }}>
            This job doesn't have a payment schedule yet. Create one to split the contract into draws, and Buildertrend will surface each draw here as its schedule phase is marked complete.
          </p>
          <BdsButton text="Create payment schedule" displayType="primary" onClick={() => setShowScheduleModal(true)} />
        </div>
      )}

      {/* Created from a payment schedule: one invoice per draw, all Unreleased
          until each is reviewed and sent. */}
      {tab === 'invoices' && emptyState && (createdInvoices?.length ?? 0) > 0 && (
        <>
          <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)', background: '#fff', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--bds-color-gray-60)', fontSize: 12, borderBottom: '1px solid var(--bds-color-gray-15)' }}>
                    <th style={{ padding: '12px 12px 12px 20px', fontWeight: 600 }}>Owner</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Job</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>ID #</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total Price</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total tax</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ padding: '12px 20px 12px 12px', fontWeight: 600, textAlign: 'right' }}>Balance due</th>
                  </tr>
                </thead>
                <tbody>
                  {createdInvoices!.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--bds-color-gray-10, #f1f2f4)' }}>
                      <td style={{ padding: '10px 12px 10px 20px', color: 'var(--bds-color-gray-90)' }}>{job.name.split(' ')[0]}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-90)' }}>{job.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--bds-color-blue-70)' }}>{row.id}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-90)' }}>{row.title}</td>
                      <td style={{ padding: '10px 12px' }}><BdsBadge text={row.status} displayType={row.status === 'Released' ? 'success' : row.status === 'Pending' ? 'warning' : 'default'} /></td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{money2(row.amount)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>$0.00</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>$0.00</td>
                      <td style={{ padding: '10px 20px 10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{money2(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bds-color-gray-5, #f7f8fa)', fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>
                    <td style={{ padding: '10px 12px 10px 20px' }}>Totals</td>
                    <td /><td /><td /><td />
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{money2(createdInvoices!.reduce((t, r) => t + r.amount, 0))}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>$0.00</td>
                    <td style={{ padding: '10px 20px 10px 12px', textAlign: 'right' }}>{money2(createdInvoices!.reduce((t, r) => t + r.amount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 12, marginTop: 12, fontSize: 13, color: 'var(--bds-color-gray-60)' }}>
            <span>My Saved View ▾</span>
            <span aria-hidden="true">•••</span>
            <span style={{ marginLeft: 'auto' }}>1-{createdInvoices!.length} of {createdInvoices!.length} items</span>
          </div>
        </>
      )}

      {/* Fills the leftover height so the saved-view footer lands at the bottom
          of the page rather than under the illustration. */}
      {tab === 'invoices' && emptyState && (createdInvoices?.length ?? 0) === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 0' }}>
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M27 30H5L4.82356 29.9923L4.63318 29.9662L4.51117 29.9394C3.6939 29.7344 3.07641 29.0264 3.00659 28.1635L3 28V15C3 14.6881 3.13495 14.4266 3.33852 14.2491L3.44525 14.168L7 11.797V5L7.00549 4.85074L7.01261 4.77413L7.03384 4.63169C7.04944 4.54779 7.07034 4.46559 7.09616 4.38553L7.15616 4.22391L7.20769 4.11153L7.29134 3.95998L7.399 3.80114L7.51784 3.65715L7.65374 3.52093L7.77371 3.41994L7.92093 3.31578L8.06315 3.23254L8.12988 3.19869L8.26677 3.13868L8.46998 3.07099L8.59611 3.0408L8.63505 3.03322C8.70557 3.02021 8.77761 3.01088 8.85074 3.00549L9 3H19C19.221 3 19.4345 3.07316 19.608 3.20608L19.7071 3.29289L24.7071 8.29289C24.8634 8.44917 24.9626 8.65185 24.9913 8.86856L25 9V11.797L28.5704 14.1787C28.7921 14.3311 28.9547 14.5727 28.9919 14.8695L29 15V28L28.9942 28.1539L28.9711 28.3396L28.9394 28.4888C28.7344 29.3061 28.0264 29.9236 27.1635 29.9934L27 30ZM27 27.999V16.979L19.3578 22.6101C19.0632 22.8272 18.7156 22.9586 18.3535 22.9917L18.1714 23H13.8286C13.4627 23 13.105 22.8996 12.7937 22.7114L12.6422 22.6101L5 16.979V28L27 27.999ZM9 5H18.585L23 9.415V17.44L18.1714 21H13.8286L9 17.441V5ZM19 15C19.5523 15 20 15.4477 20 16C20 16.5128 19.614 16.9355 19.1166 16.9933L19 17H13C12.4477 17 12 16.5523 12 16C12 15.4872 12.386 15.0645 12.8834 15.0067L13 15H19ZM5.741 15.04L7 14.201V15.968L5.741 15.04ZM25 14.202V15.967L26.258 15.04L25 14.202ZM20 12C20 11.4477 19.5523 11 19 11H13L12.8834 11.0067C12.386 11.0645 12 11.4872 12 12C12 12.5523 12.4477 13 13 13H19L19.1166 12.9933C19.614 12.9355 20 12.5128 20 12Z" fill="#202227" />
            </svg>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--bds-color-gray-90)' }}>No invoices yet</h2>
            <p style={{ color: 'var(--bds-color-gray-60)', maxWidth: 460, margin: '0 0 20px' }}>
              Create and send invoices to your clients quickly and efficiently for more reliable revenue planning.
            </p>
            {/* Only "Learn how" here: the + Invoice button in the header is
                already the way to start one, so a second primary would compete. */}
            <BdsButton text="Learn how" displayType="secondary" icon={<BdsIcon name="link" size={14} />} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--bds-color-gray-15)', paddingTop: 12, marginTop: 12, fontSize: 13, color: 'var(--bds-color-gray-60)' }}>
            <span>My Saved View ▾</span>
            <span aria-hidden="true">•••</span>
            <span style={{ marginLeft: 'auto' }}>0 of 0 items</span>
          </div>
        </div>
      )}

      {tab === 'invoices' && !emptyState && !askingForMode && invoicingMode && (invoicingMode !== 'milestone-draws' || hasSchedule) && (
        <>
          {readyDraw && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              border: '1px solid var(--bds-color-blue-25, #cfe0fb)', background: 'var(--bds-color-blue-5, #eef5ff)',
              borderRadius: 'var(--bds-radius-lg)', padding: '18px 20px', marginBottom: 24,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{readyDraw.title} is ready to review</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
                  "{readyDraw.milestone}" was marked complete on the schedule. This draw was set up for ${readyDraw.amount.toLocaleString()} when the proposal was signed. {draftNote}
                </div>
              </div>
              <BdsButton text="Review draft invoice" displayType="primary" onClick={() => onAddInvoice(invoicingMode)} />
            </div>
          )}

          {readyTimeIntervalRow && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              border: '1px solid var(--bds-color-blue-25, #cfe0fb)', background: 'var(--bds-color-blue-5, #eef5ff)',
              borderRadius: 'var(--bds-radius-lg)', padding: '18px 20px', marginBottom: 24,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>
                    {readyTimeIntervalRow.period ? `${readyTimeIntervalRow.period} invoice` : 'This period\u2019s invoice'} is ready to review
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
                  Buildertrend pulled together the bills and time clock hours logged since {lastInvoicedRow ? `your last invoice (${lastInvoicedRow.title})` : 'your last invoice'}, totaling ${readyTimeIntervalRow.amount.toLocaleString()}. {draftNote}
                </div>
              </div>
              <BdsButton text="Review draft invoice" displayType="primary" onClick={() => onAddInvoice('time-interval')} />
            </div>
          )}

          {readyAiaRow && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              border: '1px solid var(--bds-color-blue-25, #cfe0fb)', background: 'var(--bds-color-blue-5, #eef5ff)',
              borderRadius: 'var(--bds-radius-lg)', padding: '18px 20px', marginBottom: 24,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>Progress invoice for {readyAiaRow.period} is ready to review</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
                  ${readyAiaRow.amount.toLocaleString()} in certified work is ready to bill on this period's pay application. {draftNote}
                </div>
              </div>
              <BdsButton text="Review draft pay application" displayType="primary" onClick={() => onAddInvoice('aia-percent-complete')} />
            </div>
          )}

          {gridRows.length > 0 ? (
            <>
              <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)', background: '#fff', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--bds-color-gray-60)', fontSize: 12, borderBottom: '1px solid var(--bds-color-gray-15)' }}>
                      <th style={{ padding: '12px 12px 12px 20px', fontWeight: 600 }}>Owner</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Job</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>ID #</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total Price</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Total tax</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Amount Paid</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Balance</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Deadline</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date Paid</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Files</th>
                      <th style={{ padding: '8px 12px', fontWeight: 600 }}>Comments</th>
                      <th style={{ padding: '12px 20px 12px 12px', fontWeight: 600 }}>QuickBooks Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map(row => {
                      const statusDisplay = row.status === 'Released' ? 'success' : row.status === 'Pending' ? 'warning' : 'default';
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid var(--bds-color-gray-10, #f1f2f4)' }}>
                          <td style={{ padding: '10px 12px 10px 20px', color: 'var(--bds-color-gray-90)' }}>{job.name.split(' ')[0]}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-90)' }}>{job.name}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-blue-70)' }}>{row.id}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-90)' }}>{row.title}</td>
                          <td style={{ padding: '10px 12px' }}><BdsBadge text={row.status} displayType={statusDisplay} /></td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>$0.00</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>$0.00</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-60)' }}>—</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-60)' }}>—</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-blue-70)' }}>0</td>
                          <td style={{ padding: '10px 12px', color: 'var(--bds-color-gray-60)' }}>—</td>
                          <td style={{ padding: '10px 20px 10px 12px' }}><BdsBadge text="Not sent" displayType="default" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bds-color-gray-5, #f7f8fa)', fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>
                      <td style={{ padding: '10px 12px 10px 20px' }}>Totals</td>
                      <td />
                      <td />
                      <td />
                      <td />
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>${gridTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>$0.00</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>$0.00</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>${gridTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                </table>
              </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: 'var(--bds-color-gray-60)' }}>
                <span>My Saved View ▾</span>
                <span>1-{gridRows.length} of {gridRows.length} item{gridRows.length === 1 ? '' : 's'}</span>
              </div>
            </>
          ) : !readyDraw && !readyTimeIntervalRow && !readyAiaRow && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '64px 0' }}>
              <svg width="56" height="56" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M27 30H5L4.82356 29.9923L4.63318 29.9662L4.51117 29.9394C3.6939 29.7344 3.07641 29.0264 3.00659 28.1635L3 28V15C3 14.6881 3.13495 14.4266 3.33852 14.2491L3.44525 14.168L7 11.797V5L7.00549 4.85074L7.01261 4.77413L7.03384 4.63169C7.04944 4.54779 7.07034 4.46559 7.09616 4.38553L7.15616 4.22391L7.20769 4.11153L7.29134 3.95998L7.399 3.80114L7.51784 3.65715L7.65374 3.52093L7.77371 3.41994L7.92093 3.31578L8.06315 3.23254L8.12988 3.19869L8.26677 3.13868L8.46998 3.07099L8.59611 3.0408L8.63505 3.03322C8.70557 3.02021 8.77761 3.01088 8.85074 3.00549L9 3H19C19.221 3 19.4345 3.07316 19.608 3.20608L19.7071 3.29289L24.7071 8.29289C24.8634 8.44917 24.9626 8.65185 24.9913 8.86856L25 9V11.797L28.5704 14.1787C28.7921 14.3311 28.9547 14.5727 28.9919 14.8695L29 15V28L28.9942 28.1539L28.9711 28.3396L28.9394 28.4888C28.7344 29.3061 28.0264 29.9236 27.1635 29.9934L27 30ZM27 27.999V16.979L19.3578 22.6101C19.0632 22.8272 18.7156 22.9586 18.3535 22.9917L18.1714 23H13.8286C13.4627 23 13.105 22.8996 12.7937 22.7114L12.6422 22.6101L5 16.979V28L27 27.999ZM9 5H18.585L23 9.415V17.44L18.1714 21H13.8286L9 17.441V5ZM19 15C19.5523 15 20 15.4477 20 16C20 16.5128 19.614 16.9355 19.1166 16.9933L19 17H13C12.4477 17 12 16.5523 12 16C12 15.4872 12.386 15.0645 12.8834 15.0067L13 15H19ZM5.741 15.04L7 14.201V15.968L5.741 15.04ZM25 14.202V15.967L26.258 15.04L25 14.202ZM20 12C20 11.4477 19.5523 11 19 11H13L12.8834 11.0067C12.386 11.0645 12 11.4872 12 12C12 12.5523 12.4477 13 13 13H19L19.1166 12.9933C19.614 12.9355 20 12.5128 20 12Z" fill="#202227" />
              </svg>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--bds-color-gray-90)' }}>Effortlessly Manage Invoicing</h2>
              <p style={{ color: 'var(--bds-color-gray-60)', maxWidth: 420, margin: '0 0 20px' }}>
                Create and send invoices to your clients quickly and efficiently for more reliable revenue planning.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <BdsButton text="Learn How" displayType="secondary" icon={<BdsIcon name="link" size={14} />} />
                <BdsButton text="Add an Invoice" displayType="primary" onClick={() => onAddInvoice(invoicingMode)} />
              </div>
            </div>
          )}
        </>
      )}

      {showScheduleModal && (
        <PaymentScheduleModal
          existingDraws={scheduleReady ? job.drawSchedule : undefined}
          onClose={() => setShowScheduleModal(false)}
          onSave={(draws) => { onSavePaymentSchedule(draws); setShowScheduleModal(false); }}
          onCreate={onCreateInvoicesFromSchedule
            ? (draws) => { onCreateInvoicesFromSchedule(draws); setShowScheduleModal(false); }
            : undefined}
          onDelete={scheduleReady ? () => { onDeletePaymentSchedule(); setShowScheduleModal(false); } : undefined}
        />
      )}

      {showTracker && scheduleReady && (
        <PaymentScheduleTracker
          draws={job.drawSchedule ?? []}
          onClose={() => setShowTracker(false)}
        />
      )}

      {showTypeModal && onAddInvoiceDirect && (
        <InvoiceTypeModal
          job={job}
          choices={invoiceTypeChoices}
          onClose={() => setShowTypeModal(false)}
          onImportTemplate={onImportTemplate ? () => { setShowTypeModal(false); setShowTemplateModal(true); } : undefined}
          onChoose={(choice, makeDefault) => {
            setShowTypeModal(false);
            // Payment schedule is set up here, not in the invoice.
            if (choice === 'payment-schedule') { setShowScheduleModal(true); return; }
            onAddInvoiceDirect(choice, makeDefault);
          }}
        />
      )}

      {/* The shipped Import Data From Template modal, reached from the invoice
          type question with Invoices already checked. */}
      {showTemplateModal && onImportTemplate && (
        <ImportTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onImport={(templateId) => { setShowTemplateModal(false); onImportTemplate(templateId); }}
        />
      )}

      {showSettingsModal && (
        <InvoicesSettingsModal
          onClose={() => setShowSettingsModal(false)}
          defaultInvoiceKind={defaultInvoiceKind}
          onDefaultInvoiceKindChange={onDefaultInvoiceKindChange}
        />
      )}
    </div>
  );
}
