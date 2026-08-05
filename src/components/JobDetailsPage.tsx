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

/* Advanced settings runs on subheadings inside one card rather than a card per
   topic: Taxes, Budget and Purchase orders are all "defaults that flow into
   this job's numbers", and splitting them made the column read as six
   unrelated boxes. */
function SubHeading({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bds-color-gray-90)', ...style }}>{children}</div>
  );
}

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--bds-color-gray-80)', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// Currency fields here are limits, so an empty one means Unlimited rather than
// zero. The placeholder carries that, which is why there's no separate toggle.
function MoneyInput({ value, onChange, placeholder = 'Unlimited' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', border: '1px solid var(--bds-color-gray-20)',
      borderRadius: 'var(--bds-radius-md)', overflow: 'hidden', background: '#fff',
    }}>
      <span style={{
        display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 13,
        color: 'var(--bds-color-gray-60)', background: 'var(--bds-color-gray-5)',
        borderRight: '1px solid var(--bds-color-gray-20)',
      }}>$</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', minHeight: 34 }}
      />
    </div>
  );
}
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
  invoiceKindDefault = 'company',
  companyInvoiceKindDefault = 'regular',
  onInvoiceKindDefaultChange,
}: {
  job: Job;
  onBack: () => void;
  contractPrice?: number;
  contractPriceLocked?: boolean;
  contractType: 'fixed-price' | 'open-book';
  onContractTypeChange: (v: 'fixed-price' | 'open-book') => void;
  fundedByLoan: 'yes' | 'no';
  onFundedByLoanChange: (v: 'yes' | 'no') => void;
  // 'company' means this job has no override and follows Company settings.
  invoiceKindDefault?: 'company' | 'regular' | 'progress';
  companyInvoiceKindDefault?: 'regular' | 'progress';
  onInvoiceKindDefaultChange?: (v: 'company' | 'regular' | 'progress') => void;
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

  // Advanced settings. Local prototype state: only the invoice type default
  // lifts to App, since it's the one the invoice page reads back.
  const [geofencing, setGeofencing] = useState(true);
  const [percentageType, setPercentageType] = useState('Markup');
  const [percentage, setPercentage] = useState('0.00');
  const [taxRate, setTaxRate] = useState('Import rate from Accounting');
  const [projectionReference, setProjectionReference] = useState('System projection');
  const [includeTimeClockLabor, setIncludeTimeClockLabor] = useState(false);
  const [poLimit, setPoLimit] = useState('');
  const [jobPoLimit, setJobPoLimit] = useState('');
  const [workingTemplate, setWorkingTemplate] = useState(false);
  const [billApprovers, setBillApprovers] = useState('');

  const addWorkday = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const day = e.target.value;
    if (day && !workdays.includes(day)) setWorkdays(prev => [...prev, day]);
    e.target.value = '';
  };

  return (
    <div className="bds-scope" style={{ padding: '24px 32px', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
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

      {tab !== 'job-details' && tab !== 'advanced-settings' && (
        <div style={{ color: 'var(--bds-color-gray-60)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Nothing here yet.
        </div>
      )}

      {/* Advanced settings is where the real product keeps the per-job
          overrides of company-wide financial defaults (markup, tax rate,
          projection reference), which is why the invoice type override belongs
          here rather than on Job details. The surrounding cards mirror the
          shipped page so the new setting can be judged in context: everything
          except Default invoice type is inert prototype furniture. */}
      {tab === 'advanced-settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Project management options</div>
              <div>
                <SubHeading style={{ marginBottom: 10 }}>Time clock</SubHeading>
                <CheckboxRow checked={geofencing} onChange={setGeofencing} label="Enable geofencing on Time Clock shifts" />
              </div>
            </div>

            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Margin and markup</div>
              <div style={{ fontSize: 13, color: 'var(--bds-color-gray-60)', lineHeight: 1.5 }}>
                This percentage below will be applied to all new line items on Estimates and Change Orders. To update existing line items, use checked actions.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
                <Field label="Percentage type">
                  <select value={percentageType} onChange={e => setPercentageType(e.target.value)} className="bds-r-input" style={inputStyle}>
                    <option>Markup</option>
                    <option>Margin</option>
                  </select>
                </Field>
                <Field label="Percentage">
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                    <div style={{
                      display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0,
                      border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-md)', overflow: 'hidden', background: '#fff',
                    }}>
                      <input
                        value={percentage}
                        onChange={e => setPercentage(e.target.value)}
                        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', minHeight: 34 }}
                      />
                      <span style={{
                        display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 13,
                        color: 'var(--bds-color-gray-60)', background: 'var(--bds-color-gray-5)',
                        borderLeft: '1px solid var(--bds-color-gray-20)',
                      }}>%</span>
                    </div>
                    <button
                      type="button"
                      title="Set markup by cost type"
                      style={{
                        border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-md)',
                        background: '#fff', cursor: 'pointer', padding: '0 10px', fontSize: 14, color: 'var(--bds-color-gray-70)',
                      }}
                    >
                      ⚙
                    </button>
                  </div>
                </Field>
              </div>

              <div>
                <SubHeading style={{ marginBottom: 10 }}>Taxes</SubHeading>
                <Field label="Default tax rate">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select value={taxRate} onChange={e => setTaxRate(e.target.value)} className="bds-r-input" style={{ flex: 1, minWidth: 0 }}>
                      <option>Import rate from Accounting</option>
                      <option>No tax</option>
                      <option>Sales tax (7.5%)</option>
                    </select>
                    <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--bds-color-blue-70)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Manage
                    </button>
                  </div>
                </Field>
              </div>

              <div>
                <SubHeading style={{ marginBottom: 10 }}>Budget</SubHeading>
                <Field label="Projection reference default" info="Which projection the budget compares against on new cost codes.">
                  <select value={projectionReference} onChange={e => setProjectionReference(e.target.value)} className="bds-r-input" style={inputStyle}>
                    <option>System projection</option>
                    <option>Estimate</option>
                    <option>Manual projection</option>
                  </select>
                  <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginTop: 6, lineHeight: 1.5 }}>
                    This selection will apply to all new cost codes on the budget. To update existing cost codes, use checked actions.
                  </div>
                </Field>
                <div style={{ marginTop: 12 }}>
                  <CheckboxRow checked={includeTimeClockLabor} onChange={setIncludeTimeClockLabor} label="Include Time Clock labor in the Job Costing Budget" />
                </div>
              </div>

              <div>
                <SubHeading style={{ marginBottom: 10 }}>Purchase orders</SubHeading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Individual Purchase Order limit"><MoneyInput value={poLimit} onChange={setPoLimit} /></Field>
                  <Field label="Total Job Purchase Order limit"><MoneyInput value={jobPoLimit} onChange={setJobPoLimit} /></Field>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Template options</div>
              <CheckboxRow checked={workingTemplate} onChange={setWorkingTemplate} label="Make this job a working template" />
            </div>

            <div style={sectionCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Bill approvals</div>
                <BdsBadge text="New" displayType="info" />
              </div>
              <Field label="Additional default bill approvers for this job">
                <BdsInput id="bill-approvers" value={billApprovers} onChange={(_, v) => setBillApprovers(v)} placeholder="Select users" style={inputStyle} />
              </Field>
            </div>

            {/* Sits with the other per-job financial defaults, but in the short
                right column so it isn't buried under the markup card. */}
            <div style={sectionCardStyle}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>Invoicing</div>
              {/* Two options, no "Use company setting" entry: the select shows
                  the type this job actually invoices as, which for a job that
                  hasn't been touched is whatever Company settings says.
                  Inheritance still exists underneath (App only stores a job
                  value once one is picked here), it just isn't a third thing
                  to read. No info icon either: the line below says it. */}
              <Field label="Default invoice type">
                <select
                  className="bds-r-input"
                  style={inputStyle}
                  value={invoiceKindDefault === 'company' ? companyInvoiceKindDefault : invoiceKindDefault}
                  onChange={e => onInvoiceKindDefaultChange?.(e.target.value as 'regular' | 'progress')}
                >
                  <option value="regular">Standard invoice</option>
                  <option value="progress">Progress invoice</option>
                </select>
                <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginTop: 6, lineHeight: 1.5 }}>
                  New invoices on this job open as a {(invoiceKindDefault === 'company' ? companyInvoiceKindDefault : invoiceKindDefault) === 'progress' ? 'progress invoice' : 'standard invoice'}. You can still switch on any individual invoice.
                </div>
              </Field>
            </div>
          </div>
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
