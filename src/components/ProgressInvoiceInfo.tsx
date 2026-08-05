import { useState } from 'react';
import { Invoice } from '../types';
import { calcDueDate, fmtDate } from '../utils';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

/* Top of the reimagined PROGRESS invoice. A pay application is a document that
   gets certified and then released, so its header carries the two things a
   regular invoice's header doesn't: who signs off, and what the client sees
   once they have. Three columns, because those are three separate decisions
   and stacking them pushed the continuation sheet below the fold.

   The regular invoice keeps InvoiceInfo. Nothing here is shared with it yet:
   the fields overlap by name (title, dates, terms) but the column they sit in
   is half the point, and forcing one component to do both layouts would cost
   more than the duplication. */

const CERTIFIERS = ['Mike Rodriguez (Project Manager)', 'Dana Whitfield (Owner)'];
const ARCHITECTS = ['Lauren Pace, AIA (Pace Studio)', 'Ellis Grant (Grant + Co)'];

function InfoDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5.75" stroke="var(--g400)" strokeWidth="1.2" />
      <path d="M6.5 6v3.2M6.5 4.1v.1" stroke="var(--g400)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HomeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 8L9 3l6 5" stroke="var(--g500)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 7.2V14.5h9V7.2" stroke="var(--g500)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--g800)', cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--bt-blue)', margin: 0 }} />
      {label}
    </label>
  );
}

export default function ProgressInvoiceInfo({ invoice, onChange }: Props) {
  const [linkedToSchedule, setLinkedToSchedule] = useState(false);
  const [contractorCert, setContractorCert] = useState(true);
  const [contractorSigner, setContractorSigner] = useState('');
  const [architectCert, setArchitectCert] = useState(true);
  const [architectSigner, setArchitectSigner] = useState('');
  const [emailTo, setEmailTo] = useState('');

  const handleDateChange = (date: string) => {
    onChange({ ...invoice, date, dueDate: calcDueDate(date, invoice.paymentTerms) });
  };
  const handleTermsChange = (terms: string) => {
    onChange({ ...invoice, paymentTerms: terms, dueDate: calcDueDate(invoice.date, terms) });
  };

  const colDivider: React.CSSProperties = { borderLeft: '1px solid var(--g200)', paddingLeft: 24 };

  return (
    <div className="sec">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 5fr) minmax(240px, 4fr) minmax(240px, 4fr)', columnGap: 24, alignItems: 'start' }}>
        {/* ── Identity and dates ── */}
        <div style={{ minWidth: 0 }}>
          <div>
            <label className="fl">Title</label>
            <input className="fi" value={invoice.title} onChange={e => onChange({ ...invoice, title: e.target.value })} />
          </div>

          {/* Prefix is set once in Company settings and the number is assigned on
              release, so the field shows the prefix as a fixed affix and leaves
              the number blank rather than pretending to know it. */}
          <div style={{ marginTop: 12 }}>
            <label className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>ID # <InfoDot /></label>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--g200)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 14, color: 'var(--g600)', background: 'var(--g50)', borderRight: '1px solid var(--g200)' }}>
                INV-
              </span>
              <input
                value={invoice.invoiceNumber}
                onChange={e => onChange({ ...invoice, invoiceNumber: e.target.value })}
                placeholder="(Auto assign)"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 14, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="fl">Due date</label>
            <div className="tabs" style={{ width: 'fit-content' }}>
              <button type="button" className={`tab${!linkedToSchedule ? ' on' : ''}`} onClick={() => setLinkedToSchedule(false)}>Invoice date</button>
              <button type="button" className={`tab${linkedToSchedule ? ' on' : ''}`} onClick={() => setLinkedToSchedule(true)}>Link to Schedule</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, marginTop: 12, alignItems: 'start' }}>
            <div>
              <label className="fl">Invoice date</label>
              <input type="date" className="fi" value={invoice.date} onChange={e => handleDateChange(e.target.value)} />
            </div>
            <div>
              <label className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Payment terms <InfoDot /></label>
              <select className="fi" value={invoice.paymentTerms} onChange={e => handleTermsChange(e.target.value)}>
                <option>None</option>
                <option>Net 7</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>Due on Receipt</option>
              </select>
            </div>
            <div>
              <label className="fl">Due date</label>
              <div style={{ padding: '8px 0', fontSize: 14, color: 'var(--g700)', fontWeight: 500 }}>
                {invoice.dueDate ? fmtDate(invoice.dueDate) : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Approval ── */}
        <div style={{ ...colDivider, minWidth: 0 }}>
          <div className="sec-title" style={{ margin: 0 }}>Approval</div>
          <div style={{ fontSize: 13, color: 'var(--g500)', margin: '4px 0 14px', lineHeight: 1.45 }}>
            Route this invoice for approval before it's sent to the client
          </div>

          <Checkbox checked={contractorCert} onChange={setContractorCert} label="Contractor certification" />
          {contractorCert && (
            <select className="fi" style={{ marginTop: 8 }} value={contractorSigner} onChange={e => setContractorSigner(e.target.value)}>
              <option value="">Select approver</option>
              {CERTIFIERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <div style={{ marginTop: 14 }}>
            <Checkbox checked={architectCert} onChange={setArchitectCert} label="Architect certification" />
            {architectCert && (
              <select className="fi" style={{ marginTop: 8 }} value={architectSigner} onChange={e => setArchitectSigner(e.target.value)}>
                <option value="">Select approver</option>
                {ARCHITECTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* ── Client sharing ── */}
        <div style={{ ...colDivider, minWidth: 0 }}>
          <div className="sec-title" style={{ margin: 0 }}>Client sharing</div>
          <div style={{ fontSize: 13, color: 'var(--g500)', margin: '4px 0 14px', lineHeight: 1.45 }}>
            Clients will be able to view the invoice once approved
          </div>

          <label className="fl">Email to</label>
          <input className="fi" value={emailTo} onChange={e => setEmailTo(e.target.value)} />

          {/* Portal access isn't a choice on this screen, it follows from the
              job's client list, so it reads as a statement rather than a
              toggle the builder has to answer. */}
          <div style={{ borderTop: '1px solid var(--g200)', marginTop: 16, paddingTop: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <HomeGlyph />
            <div style={{ fontSize: 13, color: 'var(--g600)', lineHeight: 1.45 }}>
              After approval, this invoice is shared in the client portal to all clients with access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
