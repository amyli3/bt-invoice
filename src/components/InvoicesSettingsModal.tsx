import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { InvoiceKind } from './InvoiceKindPicker';

/* Every builder has a concrete default now: there is no "ask me" state, so the
   invoice picker is reached deliberately (Switch billing type) rather than by
   the absence of a setting. */
export type DefaultInvoiceKind = InvoiceKind;

interface Draw {
  id: string;
  percent: number;
  title: string;
}

interface CustomField {
  id: string;
  label: string;
  dataType: string;
  displayOrder: number;
  required: boolean;
  includeInFilters: boolean;
}

const INITIAL_DRAWS: Draw[] = [
  { id: 'd1', percent: 40, title: 'Draw 1' },
  { id: 'd2', percent: 40, title: 'Draw 2' },
  { id: 'd3', percent: 20, title: 'Draw 3' },
];

const INITIAL_CUSTOM_FIELDS: CustomField[] = [
  { id: 'cf1', label: 'Custom Field', dataType: 'Single-Line Text', displayOrder: 0, required: false, includeInFilters: true },
  { id: 'cf2', label: 'Custom field 2', dataType: 'Multi-Line Text with Expandable Textbox', displayOrder: 0, required: false, includeInFilters: true },
  { id: 'cf3', label: 'Invoice attachment', dataType: 'File', displayOrder: 0, required: false, includeInFilters: false },
  { id: 'cf4', label: 'Remaining project balance', dataType: 'Whole Number', displayOrder: 0, required: false, includeInFilters: true },
  { id: 'cf5', label: 'Test field 5/22', dataType: 'Single-Line Text', displayOrder: 0, required: false, includeInFilters: true },
];

const FIXED_PRICE_FIELDS = ['Items', 'Tax', 'Cost type', 'Client price', 'Unit price', 'Quantity'];
const OPEN_BOOK_FIELDS = ['Schedule of values', 'Previous invoice', 'This invoice', 'Stored materials', 'Retainage', 'Tax'];

function InfoDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5.75" stroke="var(--g400)" strokeWidth="1.2" />
      <path d="M6.5 6v3.2M6.5 4.1v.1" stroke="var(--g400)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
      {label}
    </label>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '18px 20px', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function RichTextBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ border: '1px solid var(--g200)', borderRadius: 6, overflow: 'hidden' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{
          width: '100%', border: 'none', outline: 'none', resize: 'vertical',
          padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: 'var(--g800)', display: 'block',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderTop: '1px solid var(--g200)', background: 'var(--g50)', color: 'var(--g500)', fontSize: 12 }}>
        <span>Font ▾</span>
        <span>Size ▾</span>
        <span style={{ fontWeight: 700 }}>A ▾</span>
        <span style={{ background: 'var(--g300)', padding: '0 3px', borderRadius: 2 }}>A ▾</span>
        <span style={{ fontWeight: 700 }}>B</span>
        <span style={{ fontStyle: 'italic' }}>I</span>
        <span style={{ textDecoration: 'underline' }}>U</span>
        <span style={{ textDecoration: 'line-through' }}>S</span>
        <span>≡</span><span>≡</span><span>≡</span><span>≡</span>
        <span>⌫</span>
      </div>
    </div>
  );
}

/* ── Proposed client preview defaults ─────────────────────────────────────
   The company-level home for the invoice's Customize panel. Every display
   setting from that panel has a default here, kept separately per contract
   type because the two bill different things (fixed price groups by the
   estimate, open book by bills and hours, and only open book has a price
   breakdown). Recipient settings (Bill to, Also send to, Attn) are not here:
   they name people on a job, so they save to the job instead. */
type ContractKey = 'fixed' | 'openbook';
type GroupKey = 'source' | 'costcode' | 'all';
interface PreviewDefaults {
  hideLineItems: boolean;
  groupBy: GroupKey;
  hideChangeOrderLines: boolean;
  showCostCodes: boolean;
  showVendor: boolean;
  columns: string[];
  hideMarkup: boolean;
  hideTaxDetail: boolean;
  qrCode: boolean;
  customFields: boolean;
  introText: boolean;
  closingText: boolean;
  orientation: 'portrait' | 'landscape';
}
const ALL_PREVIEW_COLUMNS = ['Items', 'Date', 'Quantity', 'Unit cost', 'Markup amount', 'Client price', 'Tax'];
const PREVIEW_DEFAULTS: Record<ContractKey, PreviewDefaults> = {
  fixed: {
    hideLineItems: false, groupBy: 'source', hideChangeOrderLines: false, showCostCodes: true, showVendor: false,
    columns: ['Items', 'Quantity', 'Client price', 'Tax'], hideMarkup: false, hideTaxDetail: false,
    qrCode: false, customFields: true, introText: true, closingText: true, orientation: 'portrait',
  },
  openbook: {
    hideLineItems: false, groupBy: 'source', hideChangeOrderLines: false, showCostCodes: true, showVendor: true,
    columns: ['Items', 'Date', 'Quantity', 'Unit cost', 'Markup amount', 'Client price', 'Tax'], hideMarkup: false, hideTaxDetail: false,
    qrCode: false, customFields: true, introText: true, closingText: true, orientation: 'portrait',
  },
};

function SegControl<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tabs" style={{ width: 'fit-content' }}>
      {options.map(o => (
        <button key={o.value} type="button" className={'tab' + (value === o.value ? ' on' : '')} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <div className="fl" style={{ marginBottom: 8, fontSize: 13, color: 'var(--g800)' }}>{children}</div>;
}

// The contract toggle is the modal's own, so the Payment schedule (fixed) and
// Open book invoicing cards below still follow it.
function ProposedClientPreviewCard({ contract, setContract, useJobAddress, setUseJobAddress }: {
  contract: ContractKey; setContract: (c: ContractKey) => void;
  useJobAddress: boolean; setUseJobAddress: (v: boolean) => void;
}) {
  const [defaults, setDefaults] = useState(PREVIEW_DEFAULTS);
  const d = defaults[contract];
  const set = <K extends keyof PreviewDefaults>(k: K, v: PreviewDefaults[K]) =>
    setDefaults(prev => ({ ...prev, [contract]: { ...prev[contract], [k]: v } }));
  const addable = ALL_PREVIEW_COLUMNS.filter(c => !d.columns.includes(c));

  return (
    <SectionCard>
      <div className="est-sec-title">Client preview defaults</div>
      <div className="est-desc" style={{ marginBottom: 16 }}>
        New invoices start with these settings. Builders can still change them on any invoice from Customize, and Save as company default there updates this page.
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="fl">Edit defaults for</div>
        <SegControl value={contract} onChange={setContract} options={[{ value: 'fixed', label: 'Fixed price' }, { value: 'openbook', label: 'Open book' }]} />
      </div>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        {/* Left: what the client sees of the line items. */}
        <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <SubHead>Display to client</SubHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Checkbox checked={!d.hideLineItems} onChange={v => set('hideLineItems', !v)} label="Line items" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--g600)', margin: '4px 0 6px' }}>Group line items by</div>
                <SegControl
                  value={d.groupBy}
                  onChange={v => set('groupBy', v)}
                  options={[
                    { value: 'source', label: contract === 'fixed' ? 'Estimate' : 'Cost source' },
                    { value: 'costcode', label: 'Cost code' },
                    { value: 'all', label: 'All line items' },
                  ]}
                />
              </div>
              <Checkbox checked={!d.hideChangeOrderLines} onChange={v => set('hideChangeOrderLines', !v)} label="Change order line items" />
              <Checkbox checked={d.showCostCodes} onChange={v => set('showCostCodes', v)} label="Cost codes" />
              <Checkbox checked={d.showVendor} onChange={v => set('showVendor', v)} label="Vendor and employee names" />
            </div>
          </div>

          <div>
            <SubHead>Columns shown</SubHead>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', border: '1px solid var(--g200)', borderRadius: 6, padding: 8 }}>
              {d.columns.map(col => (
                <span key={col} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--g50)' }}>
                  {col}
                  {col !== 'Items' && (
                    <span style={{ cursor: 'pointer', color: 'var(--g400)', fontWeight: 700 }} onClick={() => set('columns', d.columns.filter(c => c !== col))}>×</span>
                  )}
                </span>
              ))}
              {addable.length > 0 && (
                <select
                  value=""
                  onChange={e => e.target.value && set('columns', ALL_PREVIEW_COLUMNS.filter(c => c === e.target.value || d.columns.includes(c)))}
                  style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: 'var(--g500)', background: 'transparent', cursor: 'pointer' }}
                  aria-label="Add a column"
                >
                  <option value="">+ Add column</option>
                  {addable.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>

          {contract === 'openbook' && (
            <div>
              <SubHead>Price breakdown</SubHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Checkbox checked={!d.hideMarkup} onChange={v => set('hideMarkup', !v)} label="Markup amount" />
                <Checkbox checked={!d.hideTaxDetail} onChange={v => set('hideTaxDetail', !v)} label="Tax breakdown" />
              </div>
            </div>
          )}
        </div>

        {/* Right: what else is on the page, and how it's laid out. */}
        <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <SubHead>General information</SubHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Checkbox checked={d.qrCode} onChange={v => set('qrCode', v)} label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>QR code <InfoDot /></span>} />
              <Checkbox checked={d.customFields} onChange={v => set('customFields', v)} label="Custom fields" />
              <Checkbox checked={d.introText} onChange={v => set('introText', v)} label="Introduction text" />
              <Checkbox checked={d.closingText} onChange={v => set('closingText', v)} label="Closing text" />
            </div>
          </div>
          <div>
            <SubHead>Page layout</SubHead>
            <SegControl value={d.orientation} onChange={v => set('orientation', v)} options={[{ value: 'portrait', label: 'Vertical' }, { value: 'landscape', label: 'Horizontal' }]} />
          </div>
          {/* Replaces "Use job address on invoices" from Invoices setup. The
              same choice, stated as which address the bill goes to. Applies
              to both contract types, so it reads the shared setting. */}
          <div>
            <SubHead>Bill to address</SubHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer' }}>
                <input type="radio" name="bill-to-address" checked={!useJobAddress} onChange={() => setUseJobAddress(false)} style={{ margin: 0, accentColor: 'var(--bt-blue)' }} />
                Client's address
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer' }}>
                <input type="radio" name="bill-to-address" checked={useJobAddress} onChange={() => setUseJobAddress(true)} style={{ margin: 0, accentColor: 'var(--bt-blue)' }} />
                Job site address
              </label>
              <div style={{ fontSize: 12, color: 'var(--g500)', lineHeight: 1.45 }}>Uses the job site when a client has no address on file. All contract types.</div>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

interface ModalProps {
  onClose: () => void;
  // Lifted to App so the reimagined invoice page reads the same value the
  // picker's "Always invoice this way" checkbox writes.
  defaultInvoiceKind?: DefaultInvoiceKind;
  onDefaultInvoiceKindChange?: (kind: DefaultInvoiceKind) => void;
  // 'proposed' swaps in the Client preview defaults card that mirrors the
  // invoice's Customize panel. Only Company settings passes it for now, so
  // the Invoices pages keep today's card for comparison.
  clientPreviewVariant?: 'current' | 'proposed';
}

export default function InvoicesSettingsModal({ onClose, defaultInvoiceKind = 'regular', onDefaultInvoiceKindChange, clientPreviewVariant = 'current' }: ModalProps) {
  const proposed = clientPreviewVariant === 'proposed';
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [notifyInternal, setNotifyInternal] = useState(false);
  const [notifyBefore, setNotifyBefore] = useState(true);
  const [daysBefore, setDaysBefore] = useState(1);
  const [notifyAfter, setNotifyAfter] = useState(true);
  const [daysAfter, setDaysAfter] = useState(1);
  const [useJobAddress, setUseJobAddress] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('Due upon receipt');
  const [defaultDescription, setDefaultDescription] = useState("Here's the owner invoice description.");
  const [defaultClosingText, setDefaultClosingText] = useState('');

  const [contractType, setContractType] = useState<'fixed' | 'openbook'>('fixed');

  const [hasPaymentSchedule, setHasPaymentSchedule] = useState(true);
  const [draws, setDraws] = useState<Draw[]>(INITIAL_DRAWS);

  const [openBookInvoiceFormat, setOpenBookInvoiceFormat] = useState<'progress' | 'aia'>('progress');
  const [applyToAllOpenBookJobs, setApplyToAllOpenBookJobs] = useState(true);

  const [hideLineItems, setHideLineItems] = useState(false);
  const [combineByCostCode, setCombineByCostCode] = useState(false);
  const [fixedFields, setFixedFields] = useState(FIXED_PRICE_FIELDS);
  const [openBookFields, setOpenBookFields] = useState(OPEN_BOOK_FIELDS);
  const [newFieldText, setNewFieldText] = useState('');

  const [qrCode, setQrCode] = useState(false);
  const [customFieldsOnPreview, setCustomFieldsOnPreview] = useState(false);
  const [descriptionOnPreview, setDescriptionOnPreview] = useState(false);

  const [customFields, setCustomFields] = useState<CustomField[]>(INITIAL_CUSTOM_FIELDS);

  const activeFields = contractType === 'fixed' ? fixedFields : openBookFields;
  const setActiveFields = contractType === 'fixed' ? setFixedFields : setOpenBookFields;

  const total = draws.reduce((s, d) => s + d.percent, 0);

  const updateDraw = (id: string, patch: Partial<Draw>) => {
    setDraws(draws.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: `cf-${Date.now()}`, label: 'New custom field', dataType: 'Single-Line Text', displayOrder: 0, required: false, includeInFilters: false },
    ]);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 1100 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Invoices</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body">
          {/* ── Invoices setup ── */}
          <SectionCard>
            <div className="est-sec-title">Invoices setup</div>

            <div style={{ marginBottom: 16 }}>
              <div className="fl">Invoice prefix</div>
              <input className="fi" style={{ width: 140 }} value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
            </div>

            {/* Same setting the invoice picker's "Always invoice this way"
                checkbox writes, so a builder who set it there can find and
                change it here. */}
            <div style={{ marginBottom: 16 }}>
              <div className="fl">Default invoice type</div>
              <select
                className="fi"
                style={{ width: 220 }}
                value={defaultInvoiceKind}
                onChange={(e) => onDefaultInvoiceKindChange?.(e.target.value as DefaultInvoiceKind)}
              >
                <option value="regular">Standard invoice</option>
                <option value="progress">Progress invoice</option>
              </select>
              <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 6 }}>
                New invoices open as a {defaultInvoiceKind === 'progress' ? 'progress invoice' : 'standard invoice'}. You can still switch on any individual invoice.
                {' '}A job can override this in Job details, under Advanced settings.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
              <Checkbox checked={notifyInternal} onChange={setNotifyInternal} label="Notify internal users of upcoming invoice deadlines" />

              <Checkbox checked={notifyBefore} onChange={setNotifyBefore} label="Notify clients of upcoming invoice deadlines" />
              {notifyBefore && (
                <div style={{ marginLeft: 23 }}>
                  <div className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Days before <span style={{ color: '#d92d20' }}>*</span> <InfoDot /></div>
                  <input type="number" className="fi" style={{ width: 90 }} value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} />
                </div>
              )}

              <Checkbox checked={notifyAfter} onChange={setNotifyAfter} label="Notify clients after invoice deadlines have passed" />
              {notifyAfter && (
                <div style={{ marginLeft: 23 }}>
                  <div className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Days after <span style={{ color: '#d92d20' }}>*</span> <InfoDot /></div>
                  <input type="number" className="fi" style={{ width: 90 }} value={daysAfter} onChange={(e) => setDaysAfter(Number(e.target.value))} />
                </div>
              )}

              {/* In the proposed layout this moves to Client preview defaults
                  as "Bill to address". */}
              {!proposed && <Checkbox checked={useJobAddress} onChange={setUseJobAddress} label="Use job address on invoices" />}
            </div>

            <div style={{ margin: '16px 0' }}>
              <div className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Payment terms <InfoDot /></div>
              <select className="fi" style={{ width: 220 }} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                <option>Due upon receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="fl">Default invoice description</div>
              <RichTextBox value={defaultDescription} onChange={setDefaultDescription} />
            </div>

            <div>
              <div className="fl">Default invoice closing text</div>
              <RichTextBox value={defaultClosingText} onChange={setDefaultClosingText} placeholder="Add closing text to include on every invoice..." />
            </div>
          </SectionCard>

          {/* ── Client preview settings (contract type controls what follows) ── */}
          {proposed && <ProposedClientPreviewCard contract={contractType} setContract={setContractType} useJobAddress={useJobAddress} setUseJobAddress={setUseJobAddress} />}
          {!proposed && <SectionCard>
            <div className="est-sec-title">Client preview settings</div>

            <div style={{ marginBottom: 16 }}>
              <div className="fl">Contract type</div>
              <div className="tabs" style={{ width: 'fit-content' }}>
                <button className={'tab' + (contractType === 'fixed' ? ' on' : '')} onClick={() => setContractType('fixed')}>Fixed price</button>
                <button className={'tab' + (contractType === 'openbook' ? ' on' : '')} onClick={() => setContractType('openbook')}>Open book</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                <div className="fl" style={{ marginBottom: 8 }}>Display to client</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  <Checkbox checked={hideLineItems} onChange={setHideLineItems} label="Hide line items from client" />
                  <Checkbox checked={combineByCostCode} onChange={setCombineByCostCode} label="Combine line items by cost code" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', border: '1px solid var(--g200)', borderRadius: 6, padding: 8 }}>
                  {activeFields.map(field => (
                    <span key={field} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--g50)' }}>
                      {field}
                      <span
                        style={{ cursor: 'pointer', color: 'var(--g400)', fontWeight: 700 }}
                        onClick={() => setActiveFields(activeFields.filter(f => f !== field))}
                      >×</span>
                    </span>
                  ))}
                  <input
                    value={newFieldText}
                    onChange={(e) => setNewFieldText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFieldText.trim()) {
                        setActiveFields([...activeFields, newFieldText.trim()]);
                        setNewFieldText('');
                      }
                    }}
                    placeholder="Add a field…"
                    style={{ flex: '1 1 100px', minWidth: 100, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', padding: '4px 2px' }}
                  />
                </div>
              </div>

              <div style={{ flex: '0 0 180px' }}>
                <div className="fl" style={{ marginBottom: 8 }}>General information</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Checkbox checked={qrCode} onChange={setQrCode} label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>QR code <InfoDot /></span>} />
                  <Checkbox checked={customFieldsOnPreview} onChange={setCustomFieldsOnPreview} label="Custom fields" />
                  <Checkbox checked={descriptionOnPreview} onChange={setDescriptionOnPreview} label="Description" />
                </div>
              </div>
            </div>
          </SectionCard>}

          {/* ── Payment schedule: fixed-price jobs only ── */}
          {contractType === 'fixed' && (
            <SectionCard>
              <div className="est-sec-title">Payment schedule</div>
              <div className="est-desc" style={{ marginBottom: 14 }}>
                Payment schedule will automatically generate invoices for fixed-price jobs once the Estimate is sent to Budget.
              </div>

              {hasPaymentSchedule ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g800)' }}>Draw numbers</span>
                    <input
                      type="number" min={1} className="fi" style={{ width: 70 }}
                      value={draws.length}
                      onChange={(e) => {
                        const n = Math.max(1, Number(e.target.value));
                        if (n > draws.length) {
                          const extra = Array.from({ length: n - draws.length }, (_, i) => ({
                            id: `d-${Date.now()}-${i}`, percent: 0, title: `Draw ${draws.length + i + 1}`,
                          }));
                          setDraws([...draws, ...extra]);
                        } else {
                          setDraws(draws.slice(0, n));
                        }
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '90px 100px 1fr', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <span />
                    <span className="fl" style={{ margin: 0 }}>Percent <span style={{ color: '#d92d20' }}>*</span></span>
                    <span className="fl" style={{ margin: 0 }}>Invoice title</span>
                  </div>
                  {draws.map((d, i) => (
                    <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '90px 100px 1fr', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--g700)' }}>Draw #{i + 1}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number" className="fi" style={{ width: 60 }}
                          value={d.percent}
                          onChange={(e) => updateDraw(d.id, { percent: Number(e.target.value) })}
                        />
                        <span style={{ fontSize: 13, color: 'var(--g600)' }}>%</span>
                      </div>
                      <input className="fi" value={d.title} onChange={(e) => updateDraw(d.id, { title: e.target.value })} />
                    </div>
                  ))}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g800)' }}>Total:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: total === 100 ? 'var(--g800)' : '#d92d20' }}>{total}%</span>
                  </div>

                  <button className="btn btn-s" onClick={() => setHasPaymentSchedule(false)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5h9M5 3.5V2.3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2M11 3.5l-.6 8.4a1 1 0 0 1-1 .9H4.6a1 1 0 0 1-1-.9L3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Delete
                  </button>
                </>
              ) : (
                <button className="btn btn-s" onClick={() => setHasPaymentSchedule(true)}>+ Add payment schedule</button>
              )}
            </SectionCard>
          )}

          {/* ── Open book invoicing: open-book jobs only ── */}
          {contractType === 'openbook' && (
            <SectionCard>
              <div className="est-sec-title">Open book invoicing</div>
              <div className="est-desc" style={{ marginBottom: 14 }}>
                Choose the default invoice format for open book jobs. Builders can still switch formats on an individual invoice.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', border: '1px solid ' + (openBookInvoiceFormat === 'progress' ? 'var(--bt-blue)' : 'var(--g200)'), borderRadius: 8, padding: '10px 12px', background: openBookInvoiceFormat === 'progress' ? 'var(--bt-blue-light)' : 'white' }}>
                  <input type="radio" checked={openBookInvoiceFormat === 'progress'} onChange={() => setOpenBookInvoiceFormat('progress')} style={{ marginTop: 3, accentColor: 'var(--bt-blue)' }} />
                  <span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--g800)' }}>Standard progress invoice</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>Bill from actual costs, bills, and time clock entries as they're added to the job.</span>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', border: '1px solid ' + (openBookInvoiceFormat === 'aia' ? 'var(--bt-blue)' : 'var(--g200)'), borderRadius: 8, padding: '10px 12px', background: openBookInvoiceFormat === 'aia' ? 'var(--bt-blue-light)' : 'white' }}>
                  <input type="radio" checked={openBookInvoiceFormat === 'aia'} onChange={() => setOpenBookInvoiceFormat('aia')} style={{ marginTop: 3, accentColor: 'var(--bt-blue)' }} />
                  <span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--g800)' }}>AIA Pay Application (G702/G703)</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>Schedule of values with previous invoice, this invoice, stored materials, and retainage columns.</span>
                  </span>
                </label>
              </div>

              <Checkbox
                checked={applyToAllOpenBookJobs}
                onChange={setApplyToAllOpenBookJobs}
                label="Apply this format to all open book jobs by default"
              />
            </SectionCard>
          )}

          {/* ── Invoices custom fields ── */}
          <SectionCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="est-sec-title" style={{ marginBottom: 0 }}>Invoices custom fields</div>
              <button className="btn btn-s" onClick={addCustomField}>+ Custom field</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--g50)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--g600)' }}>Label</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--g600)' }}>Data type</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--g600)' }}>Display order</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--g600)' }}>Required</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--g600)' }}>Include in filters</th>
                  </tr>
                </thead>
                <tbody>
                  {customFields.map(f => (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--g100)' }}>
                      <td style={{ padding: '8px 10px' }}><a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--bt-blue)', textDecoration: 'none' }}>{f.label}</a></td>
                      <td style={{ padding: '8px 10px', color: 'var(--g700)' }}>{f.dataType}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--g700)' }}>{f.displayOrder}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <input type="checkbox" checked={f.required} onChange={(e) => setCustomFields(customFields.map(x => x.id === f.id ? { ...x, required: e.target.checked } : x))} style={{ accentColor: 'var(--bt-blue)' }} />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input type="checkbox" checked={f.includeInFilters} onChange={(e) => setCustomFields(customFields.map(x => x.id === f.id ? { ...x, includeInFilters: e.target.checked } : x))} style={{ accentColor: 'var(--bt-blue)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="est-modal-footer">
          <button className="btn btn-p" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
