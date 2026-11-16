import { useState } from 'react';
import { createPortal } from 'react-dom';

/* Today's Bills / POs / Budget settings modal, recreated from a screenshot of
   the live app. It has no QuickBooks account mapping; its only QB touch is the
   "Sync from QuickBooks" banner under Budget settings. */

function InfoDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5.75" stroke="var(--g400)" strokeWidth="1.2" />
      <path d="M6.5 6v3.2M6.5 4.1v.1" stroke="var(--g400)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Check({ checked, onChange, label, info, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; info?: boolean; sub?: string }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer', userSelect: 'none' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
        {label}
        {info && <InfoDot />}
      </label>
      {sub && <div style={{ fontSize: 12, color: 'var(--g500)', marginLeft: 23, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer', userSelect: 'none' }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
      {label}
    </label>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="est-sec-title" style={{ margin: 0 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyFields({ noun }: { noun: string }) {
  return (
    <div style={{ background: 'var(--g50)', borderRadius: 6, padding: '28px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--g800)', marginBottom: 4 }}>No custom fields</div>
      <div style={{ fontSize: 12, color: 'var(--g500)' }}>Custom fields have not been added. Add data to your {noun} using custom fields.</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="fl">{label}</div>
      {children}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function BillsPosBudgetModal({ onClose }: Props) {
  const [timeClockLabor, setTimeClockLabor] = useState(false);
  const [basis, setBasis] = useState<'cash' | 'accrual'>('accrual');
  const [unreleasedPos, setUnreleasedPos] = useState(false);
  const [separatePos, setSeparatePos] = useState(false);
  const [subsRequestPay, setSubsRequestPay] = useState(true);
  const [poPrefix, setPoPrefix] = useState('');
  const [signature, setSignature] = useState('All Approvals');
  const [reminders, setReminders] = useState('7 days');
  const [scope, setScope] = useState('');
  const [showPaid, setShowPaid] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [dueDays, setDueDays] = useState('7');
  const [billPrefix, setBillPrefix] = useState('');
  const [defaultCode, setDefaultCode] = useState('Buildertrend Fl...');
  const [poSuffix, setPoSuffix] = useState(false);
  const [approval, setApproval] = useState<'all' | 'any'>('all');
  const [hideWaivers, setHideWaivers] = useState(false);
  const [extraSig, setExtraSig] = useState(false);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [autoNumber, setAutoNumber] = useState(true);

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Bills / POs / Budget</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body">
          <Card title="Budget settings">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Check checked={timeClockLabor} onChange={setTimeClockLabor} label="Include Time Clock Labor in the Job Costing Budget on new jobs" info />
              <button className="btn" type="button">Update existing jobs</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--g800)', marginBottom: 10 }}>
              Determine how your <b>Job Costing Budget</b> reports your <b>Actual Costs</b>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <Radio checked={basis === 'cash'} onChange={() => setBasis('cash')} label={<span><b>Cash:</b> Actual Costs reports Paid Bills</span>} />
              <Radio checked={basis === 'accrual'} onChange={() => setBasis('accrual')} label={<span><b>Accrual:</b> Actual Costs reports Open + Paid Bills</span>} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid var(--g200)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--g800)' }}>
              <span>We recommend syncing from QuickBooks to avoid reporting differences</span>
              <button className="btn" type="button">Sync from QuickBooks</button>
            </div>
          </Card>

          <Card title="Purchase orders">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <Check checked={unreleasedPos} onChange={setUnreleasedPos} label="Include unreleased purchase orders in pending costs of the job costing budget" />
              <Check checked={separatePos} onChange={setSeparatePos} label="Create separate purchase orders for each line item when using the purchase order creation wizard" />
              <Check checked={subsRequestPay} onChange={setSubsRequestPay} label="Allow subs/vendors to request payment" />
            </div>
            <Field label="Purchase order prefix">
              <input className="fi" style={{ width: 280 }} placeholder="Add text" value={poPrefix} onChange={(e) => setPoPrefix(e.target.value)} />
            </Field>
            <Field label="Require signature on purchase orders">
              <select className="fi" style={{ width: 360 }} value={signature} onChange={(e) => setSignature(e.target.value)}>
                <option>All Approvals</option>
              </select>
            </Field>
            <Field label="Send purchase order approval reminders up to">
              <select className="fi" style={{ width: 360 }} value={reminders} onChange={(e) => setReminders(e.target.value)}>
                <option>7 days</option>
              </select>
            </Field>
            <Field label="Default scope of work">
              <textarea className="fi" rows={4} style={{ width: '100%', resize: 'vertical' }} value={scope} onChange={(e) => setScope(e.target.value)} />
            </Field>
            <div className="fl">Purchase order disclaimer</div>
            <div style={{ fontSize: 12, color: 'var(--g600)', marginBottom: 8 }}>
              A signature of Approval or Electronic Acceptance is required before purchase order is effective. This purchase order then becomes part of the existing contract and is binding.
            </div>
            <button className="btn" type="button">Change</button>
          </Card>

          <Card title="Display on printout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Check checked={showPaid} onChange={setShowPaid} label="Show paid amount" />
              <Check checked={showCustom} onChange={setShowCustom} label="Show custom fields" />
            </div>
          </Card>

          <Card title="Purchase Orders custom fields" action={<button className="btn" type="button">+ Custom field</button>}>
            <EmptyFields noun="Purchase Orders" />
          </Card>

          <Card title="Bill due date reminder">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)' }}>
              Alert users
              <input className="fi" style={{ width: 60 }} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
              days before upcoming due date. <InfoDot />
            </div>
          </Card>

          <Card title="Bills custom fields" action={<button className="btn" type="button">+ Custom field</button>}>
            <EmptyFields noun="Bills" />
          </Card>

          <Card title="Bills">
            <Field label="Bill prefix">
              <input className="fi" style={{ width: 80 }} value={billPrefix} onChange={(e) => setBillPrefix(e.target.value)} />
            </Field>
            <Field label="Default cost code for Bills">
              <select className="fi" style={{ width: 180 }} value={defaultCode} onChange={(e) => setDefaultCode(e.target.value)}>
                <option>Buildertrend Fl...</option>
              </select>
            </Field>
            <Check checked={poSuffix} onChange={setPoSuffix} label="Add PO suffix to bill number" info />
          </Card>

          <Card title="Bill Approval Workflow">
            <div style={{ fontSize: 13, color: 'var(--g600)', marginBottom: 12 }}>
              Define who needs to sign off on bills before payment. Start simple with one level, or add more to route approvals in order.
            </div>
            <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g800)', marginBottom: 10 }}>Level 1</div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                <Radio checked={approval === 'all'} onChange={() => setApproval('all')} label="All approvers" />
                <Radio checked={approval === 'any'} onChange={() => setApproval('any')} label="Any one approver" />
              </div>
              <div className="fi" style={{ width: 360, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ background: 'var(--g100)', borderRadius: 4, padding: '2px 6px' }}>Job project manager(s) ×</span>
              </div>
            </div>
            <button className="btn" type="button">+ Add a level</button>
          </Card>

          <Card title="Lien waivers">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Check checked={hideWaivers} onChange={setHideWaivers} label="Hide lien waivers on all jobs" info />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Check checked={extraSig} onChange={setExtraSig} label="Default additional signature line to ON on printouts" info />
                <input className="fi" style={{ width: 160 }} defaultValue="Notary Signature" />
              </div>
            </div>
          </Card>

          <Card title="Lien waiver forms" action={<button className="btn btn-p" type="button">Add new lien waiver form</button>}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g800)', marginBottom: 8 }}>Conditional</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: 'var(--g50)', color: 'var(--g600)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date created</th>
                  <th style={{ padding: '8px 10px', fontWeight: 600 }}>Default</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 10px', color: 'var(--bt-blue)' }}>Standard Lien Waiver</td>
                  <td style={{ padding: '8px 10px' }}>Jun 24, 2022</td>
                  <td style={{ padding: '8px 10px' }}>✓</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}><button className="btn" type="button">Delete</button></td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g800)', marginBottom: 8 }}>Unconditional</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--g400)', padding: '16px 0' }}>No Data</div>
          </Card>

          <Card title="Auto-fill from file">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Check checked={taxInclusive} onChange={setTaxInclusive} label="Create tax inclusive bills" sub="When checked, bills will include tax amounts. When unchecked, AI Bill Capture will create tax-exclusive bills." />
              <Check checked={autoNumber} onChange={setAutoNumber} label="Auto-fill bill number" sub="When checked, AI Bill Capture will use the detected bill number or receipt ID as the bill number. When unchecked, we'll generate a sequential bill number when the bill is saved to a job." />
            </div>
          </Card>
        </div>

        <div className="est-modal-footer">
          <button className="btn btn-p" onClick={onClose}>Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
