import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MfaDialog from './MfaDialog';
import {
  QBO_PAYMENT_ACCOUNTS, setHiddenPaymentAccounts, setPaymentAccountAliases,
  accountDisplayName, genericAccountName, PEOPLE, personLabel, setPaymentAccountAccess, useHiddenPaymentAccounts,
  usePaymentAccountAccess, usePaymentAccountAliases,
} from '../paymentAccounts';

/* Today's Accounting setup modal, recreated from a screenshot of the live app.
   Only the accounting admin can open it. It has no receipts or payment account
   section yet; that is the gap the payment account alias work would fill. */

function InfoDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5.75" stroke="var(--g400)" strokeWidth="1.2" />
      <path d="M6.5 6v3.2M6.5 4.1v.1" stroke="var(--g400)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Check({ checked, onChange, label, info }: { checked: boolean; onChange: (v: boolean) => void; label: string; info?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g800)', cursor: 'pointer', userSelect: 'none' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
      {label}
      {info && <InfoDot />}
    </label>
  );
}

function Radio({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: React.ReactNode; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: disabled ? 'var(--g300)' : 'var(--g800)', cursor: disabled ? 'default' : 'pointer', userSelect: 'none' }}>
      <input type="radio" checked={checked} disabled={disabled} onChange={onChange} style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
      {label}
    </label>
  );
}

function Field({ label, info, children }: { label: string; info?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="fl" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{label}{info && <InfoDot />}</div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <select className="fi" style={{ width: 280 }} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--g800)', margin: '0 0 12px' }}>{title}</div>
      {children}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function AccountingSetupModal({ onClose }: Props) {
  const [linkJobs, setLinkJobs] = useState(true);
  const [itemType, setItemType] = useState<'customer' | 'subcustomer'>('subcustomer');
  const [flatFee, setFlatFee] = useState('Buildertrend Invoice');
  const [depositOnline, setDepositOnline] = useState('Undeposited Funds');
  const [feeAccount, setFeeAccount] = useState('Contractors');
  const [createInvoice, setCreateInvoice] = useState(true);
  const [createCredit, setCreateCredit] = useState(true);
  const [retainage, setRetainage] = useState('-- None Selected --');
  const [depositAccount] = useState('Undeposited funds');
  const [ap, setAp] = useState('Payables');
  const [linkSubs, setLinkSubs] = useState(true);
  const [syncBills, setSyncBills] = useState(true);
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>('auto');
  const [syncWhen, setSyncWhen] = useState<'job' | 'ready' | 'paid'>('ready');
  const [billable, setBillable] = useState(true);
  const [allowEdits, setAllowEdits] = useState(true);
  const [includeQbo, setIncludeQbo] = useState(false);
  const [basis, setBasis] = useState<'cash' | 'accrual'>('accrual');
  const [timeActivity, setTimeActivity] = useState(false);
  const [timeBillable, setTimeBillable] = useState(false);

  /* Payment accounts the admin has hidden from the receipt picker. A draft until
     Save, so Cancel leaves the picker as it was. */
  const savedHidden = useHiddenPaymentAccounts();
  const [hiddenDraft, setHiddenDraft] = useState<string[]>(savedHidden);
  const shownCount = QBO_PAYMENT_ACCOUNTS.length - hiddenDraft.length;
  const toggleAccount = (name: string) =>
    setHiddenDraft(h => h.includes(name) ? h.filter(x => x !== name) : [...h, name]);
  /* Who can use each account. No entry means everyone; an entry lists the people
     besides owners, who always can. A draft until Save like the rest. */
  const savedAccess = usePaymentAccountAccess();
  const [accessDraft, setAccessDraft] = useState<Record<string, string[]>>(savedAccess);
  const [accessOpen, setAccessOpen] = useState<string | null>(null);
  /* Where the open dropdown hangs from, in viewport coordinates. It is drawn in a
     portal so neither the table's rounded edge nor the modal's scroll can clip it. */
  const [accessAnchor, setAccessAnchor] = useState<{ left: number; top: number; bottom: number } | null>(null);
  useEffect(() => {
    if (!accessOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setAccessOpen(null); } };
    /* The popover is placed once, when it opens. If the modal scrolls or the window
       resizes underneath it, it would be left behind, so it closes instead. */
    const close = () => setAccessOpen(null);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [accessOpen]);
  const nonOwners = PEOPLE.filter(p => !p.owner);
  /* "Everyone" is the same thing as every person ticked, so the list shows it that
     way. Unticking someone narrows it to everyone else; ticking the last person
     back in returns it to Everyone. */
  const togglePerson = (name: string, person: string) => setAccessDraft(d => {
    const cur = d[name] ?? nonOwners.map(p => p.name);
    const next = cur.includes(person) ? cur.filter(x => x !== person) : [...cur, person];
    if (next.length === nonOwners.length) {
      const rest = { ...d };
      delete rest[name];
      return rest;
    }
    return { ...d, [name]: next };
  });
  const accessLabel = (name: string) => {
    const list = accessDraft[name];
    if (!list) return 'All users';
    const owner = PEOPLE.find(p => p.owner);
    const ownerText = owner ? personLabel(owner) : 'Owner';
    if (list.length === 0) return ownerText;
    return `${list.length + 1} users`;
  };
  const savedAliases = usePaymentAccountAliases();
  const [aliasDraft, setAliasDraft] = useState<Record<string, string>>(savedAliases);
  /* Two accounts that read the same in the picker can't be told apart, so a typed
     nickname can't match what another account reads as. That covers other
     nicknames, other accounts' generic names, and any QuickBooks name. A blank
     field is fine: that account just reads as its generic name. */
  const aliasProblem = (name: string): string | null => {
    const typed = (aliasDraft[name] ?? '').trim().toLowerCase();
    if (!typed) return null;
    const clash = QBO_PAYMENT_ACCOUNTS.some(o => o.name !== name && (
      o.name.toLowerCase() === typed || accountDisplayName(o.name, aliasDraft).toLowerCase() === typed
    ));
    return clash ? 'Already used by another account' : null;
  };
  const hasAliasProblem = QBO_PAYMENT_ACCOUNTS.some(a => aliasProblem(a.name));
  /* Saving changes who can use which account, so it asks the builder to verify
     first. Nothing is written until they do; backing out leaves the drafts as
     they were. */
  const [mfaOpen, setMfaOpen] = useState(false);
  const save = () => {
    if (hasAliasProblem) return;
    setMfaOpen(true);
  };
  const commitSave = () => {
    setMfaOpen(false);
    setHiddenPaymentAccounts(hiddenDraft);
    setPaymentAccountAliases(aliasDraft);
    setPaymentAccountAccess(accessDraft);
    onClose();
  };

  const accessAccount = accessOpen ? QBO_PAYMENT_ACCOUNTS.find(a => a.name === accessOpen) : undefined;
  const accessPopover = accessAccount && accessAnchor ? (() => {
    const name = accessAccount.name;
    const list = accessDraft[name];
    const everyone = !list;
    const owners = PEOPLE.filter(p => p.owner);
    const width = 300;
    const estimatedHeight = 20 + (owners.length + nonOwners.length) * 36;
    const flipUp = accessAnchor.bottom + estimatedHeight + 12 > window.innerHeight && accessAnchor.top > estimatedHeight + 12;
    const left = Math.max(12, Math.min(accessAnchor.left, window.innerWidth - width - 12));
    const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', fontSize: 13 };
    return createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onClick={() => setAccessOpen(null)} />
        <div
          role="dialog"
          aria-label={`Available to, ${name}`}
          style={{
            position: 'fixed', left, width, zIndex: 2001,
            ...(flipUp ? { bottom: window.innerHeight - accessAnchor.top + 4 } : { top: accessAnchor.bottom + 4 }),
            background: 'white', border: '1px solid var(--g200)', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(15,23,42,0.18)', overflow: 'hidden',
          }}
        >
          {owners.map(p => (
            <label key={p.name} style={{ ...rowStyle, color: 'var(--g500)' }}>
              <input type="checkbox" checked disabled style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }} />
              <span style={{ flex: 1 }}>{personLabel(p)}</span>
              <span style={{ fontSize: 12 }}>Always has access</span>
            </label>
          ))}
          {nonOwners.map(p => (
            <label key={p.name} style={{ ...rowStyle, cursor: 'pointer', color: 'var(--g800)' }}>
              <input
                type="checkbox"
                checked={everyone || list.includes(p.name)}
                onChange={() => togglePerson(name, p.name)}
                aria-label={`${p.name} can use ${name}`}
                style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }}
              />
              <span style={{ flex: 1 }}>{personLabel(p)}</span>
            </label>
          ))}
          {!everyone && list.length === 0 && (
            <div style={{ padding: '8px 14px 10px', fontSize: 12, color: 'var(--g600)', borderTop: '1px solid var(--g200)' }}>
              Only owners can use this account.
            </div>
          )}
        </div>
      </>,
      document.body,
    );
  })() : null;

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 1280 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bt-midnight)', margin: 0 }}>Accounting setup</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body">
          {/* Connection card */}
          <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '18px 20px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#2ca01c', color: 'white', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>qb</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--g800)' }}>You are connected to QuickBooks.</div>
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 13, color: 'var(--bt-blue)' }}>QuickBooks help center</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 48, fontSize: 13, color: 'var(--g800)' }}>
                <div><div style={{ fontWeight: 600 }}>Version</div>QuickBooks Online Advanced</div>
                <div><div style={{ fontWeight: 600 }}>Company</div>Buildertrend</div>
              </div>
            </div>
            <button className="btn" type="button">Manage links ▾</button>
          </div>

          <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--g800)', marginBottom: 18 }}>Accounting options</div>

            <Section title="Job linking options">
              <div style={{ fontSize: 13, color: 'var(--g600)', marginBottom: 12 }}>
                Set up your preferences for when Internal Users can link jobs to accounting and what item type they can link them to.
              </div>
              <Check checked={linkJobs} onChange={setLinkJobs} label="Link jobs to accounting during job creation by default" />
              <div className="fl" style={{ marginTop: 14 }}>Preferred accounting item type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Radio checked={itemType === 'customer'} onChange={() => setItemType('customer')} label="Customer" />
                <Radio checked={itemType === 'subcustomer'} onChange={() => setItemType('subcustomer')} label="Sub-Customer" />
                <Radio checked={false} onChange={() => {}} label="Project" disabled />
              </div>
            </Section>

            <Section title="Invoice options">
              <Field label="Flat fee product/service" info>
                <Select value={flatFee} onChange={setFlatFee} options={['Buildertrend Invoice']} />
              </Field>
              <Field label="Deposit online payments" info>
                <Select value={depositOnline} onChange={setDepositOnline} options={['Undeposited Funds']} />
              </Field>
              <Field label="Expense account for online transaction fees" info>
                <Select value={feeAccount} onChange={setFeeAccount} options={['Contractors']} />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <Check checked={createInvoice} onChange={setCreateInvoice} label="Create a new QuickBooks invoice when invoice is sent to clients" info />
                <Check checked={createCredit} onChange={setCreateCredit} label="Create a new QuickBooks credit memo when credit memo is sent to clients" info />
              </div>
              <Field label="Retainage product/service" info>
                <Select value={retainage} onChange={setRetainage} options={['-- None Selected --']} />
              </Field>
            </Section>

            <Section title="Deposit option">
              <Field label="Deposit payments account">
                <Select value={depositAccount} onChange={() => {}} options={['Undeposited funds']} disabled />
              </Field>
            </Section>

            <Section title="Bill/Purchase Order options">
              <Field label="Accounts payable account" info>
                <Select value={ap} onChange={setAp} options={['Payables']} />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Check checked={linkSubs} onChange={setLinkSubs} label="Link subs/vendors to accounting during sub/vendor creation by default" />
                <Check checked={syncBills} onChange={setSyncBills} label="Sync bills to QuickBooks" info />
                {syncBills && (
                  <div style={{ marginLeft: 23, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--g500)' }}>Choose when bills are synced to QuickBooks</div>
                    <Radio checked={syncMode === 'auto'} onChange={() => setSyncMode('auto')} label="Sync bills automatically when:" />
                    <div style={{ marginLeft: 23, display: 'flex', flexDirection: 'column', gap: 8, opacity: syncMode === 'auto' ? 1 : 0.5 }}>
                      <Radio checked={syncWhen === 'job'} onChange={() => setSyncWhen('job')} label="Saved to a job" />
                      <Radio checked={syncWhen === 'ready'} onChange={() => setSyncWhen('ready')} label="Status is ready for payment" />
                      <Radio checked={syncWhen === 'paid'} onChange={() => setSyncWhen('paid')} label="Paid or record payment" />
                    </div>
                    <Radio checked={syncMode === 'manual'} onChange={() => setSyncMode('manual')} label="Sync each bill manually" />
                  </div>
                )}
                <Check checked={billable} onChange={setBillable} label="Default the option to mark QuickBooks Bills as billable to client" info />
                <Check checked={allowEdits} onChange={setAllowEdits} label="Allow bill edits to sync to QuickBooks" info />
              </div>
            </Section>

            <Section title="Payment accounts">
              <div style={{ fontSize: 13, color: 'var(--g600)', marginBottom: 12 }}>
                Set nicknames and permissions for payment accounts on bills
              </div>
              <div style={{ border: '1px solid var(--g200)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--g50)', borderBottom: '1px solid var(--g200)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--g800)' }}>{shownCount} of {QBO_PAYMENT_ACCOUNTS.length} accounts shown</span>
                  {/* One control: it hides everything while anything is shown, and
                      shows everything once nothing is. */}
                  <button
                    type="button"
                    onClick={() => setHiddenDraft(shownCount > 0 ? QBO_PAYMENT_ACCOUNTS.map(a => a.name) : [])}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--bt-blue)' }}
                  >{shownCount > 0 ? 'Hide all' : 'Show all'}</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: 'var(--g600)', borderBottom: '1px solid var(--g200)' }}>
                  <span style={{ width: 15 }} />
                  <span style={{ flex: 1 }}>QuickBooks account</span>
                  <span style={{ width: 190 }}>Nickname</span>
                  <span style={{ width: 170 }}>Available to</span>
                  <span style={{ width: 80 }}>Type</span>
                </div>
                {QBO_PAYMENT_ACCOUNTS.map((a, i) => {
                  const shown = !hiddenDraft.includes(a.name);
                  const problem = aliasProblem(a.name);
                  return (
                    <div key={a.name} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--g200)', fontSize: 13,
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer', paddingTop: 6 }}>
                        <input
                          type="checkbox"
                          checked={shown}
                          onChange={() => toggleAccount(a.name)}
                          aria-label={`Show ${a.name} in the Payment Account picker`}
                          style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }}
                        />
                        <span style={{ color: shown ? 'var(--g800)' : 'var(--g400)' }}>{a.name}</span>
                      </label>
                      <div style={{ width: 190 }}>
                        <input
                          className="fi"
                          aria-label={`Nickname for ${a.name}`}
                          placeholder={genericAccountName(a.name)}
                          value={aliasDraft[a.name] ?? ''}
                          onChange={e => setAliasDraft(d => ({ ...d, [a.name]: e.target.value }))}
                          style={{ padding: '5px 8px', fontSize: 13, opacity: shown ? 1 : 0.6, ...(problem ? { borderColor: '#d92d20' } : {}) }}
                        />
                        {problem && <div style={{ fontSize: 11, color: '#d92d20', marginTop: 2 }}>{problem}</div>}
                      </div>
                      <div style={{ width: 170 }}>
                        <button
                          type="button"
                          aria-label={`Available to, ${a.name}`}
                          aria-expanded={accessOpen === a.name}
                          onClick={e => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setAccessAnchor({ left: r.left, top: r.top, bottom: r.bottom });
                            setAccessOpen(o => o === a.name ? null : a.name);
                          }}
                          className="fi"
                          style={{
                            padding: '5px 8px', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                            color: accessDraft[a.name] ? 'var(--g800)' : 'var(--g600)', opacity: shown ? 1 : 0.6,
                          }}
                        >
                          <span>{accessLabel(a.name)}</span>
                          <svg width="10" height="7" viewBox="0 0 12 8" fill="none" style={{ flexShrink: 0, transform: accessOpen === a.name ? 'rotate(180deg)' : 'none' }}>
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                      <span style={{ color: 'var(--g500)', width: 80, paddingTop: 6 }}>{a.type}</span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Budget options">
              <div style={{ marginBottom: 12 }}>
                <Check checked={includeQbo} onChange={setIncludeQbo} label="Include costs entered in QuickBooks in the budget by default when linking jobs to QuickBooks" info />
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
            </Section>

            <Section title="Time Clock options">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Check checked={timeActivity} onChange={setTimeActivity} label="Create a new QuickBooks time activity from a Time Clock shift when approved" info />
                <Check checked={timeBillable} onChange={setTimeBillable} label="Mark Time Clock shifts as billable by default when sending to QuickBooks" info />
              </div>
            </Section>
          </div>

          <div style={{ border: '1px solid var(--g200)', borderRadius: 8, padding: '14px 20px', fontSize: 13, color: 'var(--g500)' }}>
            Note: QuickBooks Online and Buildertrend may show a small difference in tax amount from rounding discrepancies.
          </div>
        </div>

        <div className="est-modal-footer" style={{ gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={onClose}>Disconnect from QuickBooks</button>
          <button className="btn btn-p" onClick={save} disabled={hasAliasProblem} style={hasAliasProblem ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>Save</button>
        </div>
        {accessPopover}
        {mfaOpen && <MfaDialog onVerified={commitSave} onCancel={() => setMfaOpen(false)} />}
      </div>
    </div>,
    document.body
  );
}
