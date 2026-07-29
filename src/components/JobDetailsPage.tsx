import { useState, useEffect } from 'react';
import '../bds-tokens.css';
import { BdsBadge, BdsInput, BdsPill, BdsTabs, BdsIcon } from '../bds';
import { Job } from '../types';

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

type TabKey = 'job-details' | 'clients' | 'internal-users' | 'subs-vendors' | 'advanced-settings' | 'accounting' | 'insurance';

const ALL_WORKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseAddr(addr: string) {
  const [street = '', cityStateZip = ''] = addr.split('\n');
  const m = cityStateZip.match(/^(.*),\s*([A-Z]{2})\s*(\d{5})$/);
  return { street, city: m?.[1] ?? '', state: m?.[2] ?? '', zip: m?.[3] ?? '' };
}

function Field({ label, required, info, children }: { label: string; required?: boolean; info?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)' }}>
          {label}{required && <span style={{ color: 'var(--bds-color-danger-70, #c53030)' }}> *</span>}
        </label>
        {info && <span title={info} style={{ cursor: 'help', color: 'var(--bds-color-gray-50)' }}><BdsIcon name="check" size={0} /><span style={{ fontSize: 12 }}>ⓘ</span></span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%' };
const sectionCardStyle: React.CSSProperties = {
  border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)',
  padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', marginBottom: 20,
};

export default function JobDetailsPage({
  job,
  onBack,
  contractPrice,
  contractPriceLocked,
  contractType,
  onContractTypeChange,
  fundedByLoan,
  onFundedByLoanChange,
}: {
  job: Job;
  onBack: () => void;
  contractPrice?: number;
  contractPriceLocked?: boolean;
  contractType: 'fixed-price' | 'open-book';
  onContractTypeChange: (v: 'fixed-price' | 'open-book') => void;
  fundedByLoan: 'yes' | 'no';
  onFundedByLoanChange: (v: 'yes' | 'no') => void;
}) {
  const parsedAddr = parseAddr(job.addr);
  const [tab, setTab] = useState<TabKey>('job-details');
  const [title, setTitle] = useState(job.name);
  const [status, setStatus] = useState('Open');
  const [type, setType] = useState('');
  const [contractPriceInput, setContractPriceInput] = useState(contractPrice !== undefined ? formatCurrency(contractPrice) : '');
  useEffect(() => {
    if (contractPrice !== undefined) setContractPriceInput(formatCurrency(contractPrice));
  }, [contractPrice]);
  const [street, setStreet] = useState(parsedAddr.street);
  const [city, setCity] = useState(parsedAddr.city);
  const [state, setState] = useState(parsedAddr.state);
  const [zip, setZip] = useState(parsedAddr.zip);
  const [workdays, setWorkdays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [squareFeet, setSquareFeet] = useState('');
  const [permitNumber, setPermitNumber] = useState('');
  const [lotInfo, setLotInfo] = useState('');

  const addWorkday = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const day = e.target.value;
    if (day && !workdays.includes(day)) setWorkdays(prev => [...prev, day]);
    e.target.value = '';
  };

  return (
    <div className="bds-scope" style={{ padding: '24px 32px', width: '100%', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--bds-color-gray-90)' }}>{title || job.name}</h1>
        <BdsBadge text={status} displayType="success" />
      </div>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, marginBottom: 16, color: 'var(--bds-color-gray-60)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
        &larr; Back
      </button>

      <div style={{ borderBottom: '1px solid var(--bds-color-gray-15)', marginBottom: 24 }}>
        <BdsTabs
          ariaLabel="Job settings sections"
          activeKey={tab}
          onChange={(k) => setTab(k as TabKey)}
          tabs={[
            { key: 'job-details', label: 'Job details' },
            { key: 'clients', label: 'Clients' },
            { key: 'internal-users', label: 'Internal users' },
            { key: 'subs-vendors', label: 'Subs/vendors' },
            { key: 'advanced-settings', label: 'Advanced settings' },
            { key: 'accounting', label: 'Accounting' },
            { key: 'insurance', label: "Builder's Risk Insurance" },
          ]}
        />
      </div>

      {tab !== 'job-details' && (
        <div style={{ color: 'var(--bds-color-gray-60)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Nothing here yet.
        </div>
      )}

      {tab === 'job-details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Job information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Title"><BdsInput id="title" value={title} onChange={(_, v) => setTitle(v)} placeholder="Add job title" style={inputStyle} /></Field>
                <Field label="Prefix" info="Shown before the job title in references like invoices and reports."><BdsInput id="prefix" placeholder="Add job title" style={inputStyle} /></Field>
              </div>
              <Field label="Status">
                <select value={status} onChange={e => setStatus(e.target.value)} className="bds-r-input" style={inputStyle}>
                  <option>Open</option>
                  <option>Presale</option>
                  <option>Closed</option>
                </select>
              </Field>
              <Field label="Type" required>
                <select value={type} onChange={e => setType(e.target.value)} className="bds-r-input" style={inputStyle}>
                  <option value="">Select status</option>
                  <option>Remodel</option>
                  <option>New construction</option>
                  <option>Custom build</option>
                </select>
              </Field>
              <Field label="Contract price">
                <BdsInput
                  id="contract-price"
                  value={contractPriceInput}
                  onChange={(_, v) => setContractPriceInput(v)}
                  placeholder="$0.00"
                  disabled={contractPriceLocked}
                  style={inputStyle}
                />
                {contractPriceLocked && (
                  <div style={{ fontSize: 12, color: 'var(--bds-color-gray-50)', marginTop: 4 }}>
                    🔒 Set from the estimate sent to budget — unlock the estimate to edit.
                  </div>
                )}
              </Field>
            </div>

            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Financials</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)', marginBottom: 8 }}>Contract type <span style={{ color: 'var(--bds-color-danger-70, #c53030)' }}>*</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { key: 'fixed-price', label: 'Fixed price', blurb: 'You set the price for the owner' },
                    { key: 'open-book', label: 'Open book', blurb: 'Actual costs plus markup/margin (i.e. Cost Plus and Time & Materials)' },
                  ] as const).map(opt => (
                    <label key={opt.key} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 'var(--bds-radius-md)',
                      border: contractType === opt.key ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                      background: contractType === opt.key ? 'var(--bds-color-blue-5)' : '#fff', cursor: 'pointer',
                    }}>
                      <input type="radio" name="contractType" checked={contractType === opt.key} onChange={() => onContractTypeChange(opt.key)} style={{ marginTop: 3 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--bds-color-gray-90)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>{opt.blurb}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Address</div>
              <Field label="Street address"><BdsInput id="street" value={street} onChange={(_, v) => setStreet(v)} placeholder="Add street address" style={inputStyle} /></Field>
              <Field label="City"><BdsInput id="city" value={city} onChange={(_, v) => setCity(v)} placeholder="Add city" style={inputStyle} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="State"><BdsInput id="state" value={state} onChange={(_, v) => setState(v)} placeholder="Add state" style={inputStyle} /></Field>
                <Field label="Zip code" required><BdsInput id="zip" value={zip} onChange={(_, v) => setZip(v)} placeholder="Add zip code" style={inputStyle} /></Field>
              </div>
            </div>
          </div>

          <div>
            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Schedule</div>
              <Field label="Projected">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BdsInput id="proj-start" type="date" placeholder="Add date" style={inputStyle} />
                  <span style={{ color: 'var(--bds-color-gray-50)', fontSize: 13 }}>to</span>
                  <BdsInput id="proj-end" type="date" placeholder="Add date" style={inputStyle} />
                </div>
              </Field>
              <Field label="Actual">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BdsInput id="actual-start" type="date" placeholder="Add start" style={inputStyle} />
                  <span style={{ color: 'var(--bds-color-gray-50)', fontSize: 13 }}>to</span>
                  <BdsInput id="actual-end" type="date" placeholder="Add end" style={inputStyle} />
                </div>
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--bds-color-gray-80)' }}>
                <input type="checkbox" /> Update actual dates based on Schedule
              </label>
              <Field label="Workdays">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {workdays.map(d => (
                    <BdsPill key={d} text={d} onClick={() => setWorkdays(prev => prev.filter(x => x !== d))} icon={<span>&times;</span>} />
                  ))}
                </div>
                {ALL_WORKDAYS.some(d => !workdays.includes(d)) && (
                  <select onChange={addWorkday} defaultValue="" className="bds-r-input" style={inputStyle}>
                    <option value="">Add a workday...</option>
                    {ALL_WORKDAYS.filter(d => !workdays.includes(d)).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </Field>
            </div>

            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Additional information</div>
              <Field label="Job group">
                <select className="bds-r-input" style={inputStyle} defaultValue="">
                  <option value="">Select job group</option>
                  <option>{job.group === 'open' ? 'Open' : 'All jobs'}</option>
                </select>
              </Field>
              <Field label="Project managers">
                <BdsInput id="pm" placeholder="Select users" style={inputStyle} />
              </Field>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)', marginBottom: 8 }}>Funded by construction loan</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bds-color-gray-80)' }}>
                    <input type="radio" name="funded" checked={fundedByLoan === 'yes'} onChange={() => onFundedByLoanChange('yes')} /> Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bds-color-gray-80)' }}>
                    <input type="radio" name="funded" checked={fundedByLoan === 'no'} onChange={() => onFundedByLoanChange('no')} /> No
                  </label>
                </div>
              </div>
              <Field label="Square feet"><BdsInput id="sqft" value={squareFeet} onChange={(_, v) => setSquareFeet(v)} placeholder="Add square feet" style={inputStyle} /></Field>
              <Field label="Permit #"><BdsInput id="permit" value={permitNumber} onChange={(_, v) => setPermitNumber(v)} placeholder="Add permit number" style={inputStyle} /></Field>
              <Field label="Lot info"><BdsInput id="lot" value={lotInfo} onChange={(_, v) => setLotInfo(v)} placeholder="Add lot info" style={inputStyle} /></Field>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
