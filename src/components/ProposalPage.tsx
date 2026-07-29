import { useState } from 'react';
import { allAllowances, allSelections } from '../allowanceMockData';
import { BdsButton, BdsIcon } from '../bds';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Flatten the same allowance/selection mock data the Estimate page uses, so
// whatever's on the estimate is what shows up on the proposal.
type ProposalItem = { id: string; name: string; costCode: string; vendor: string; qty: number; unit: string; unitPrice: number; price: number };
const proposalItems: ProposalItem[] = allAllowances.flatMap(allowance => {
  const selections = allSelections.filter(s => allowance.selectionIds.includes(s.id));
  return selections.flatMap(sel =>
    sel.options.map(opt => {
      const unitPrice = opt.unitCost * (1 + opt.markup / 100);
      return {
        id: opt.id,
        name: opt.name,
        costCode: `${opt.costCode.code} - ${opt.costCode.label}`,
        vendor: opt.vendor,
        qty: opt.quantity,
        unit: opt.unit,
        unitPrice,
        price: unitPrice * opt.quantity,
      };
    })
  );
});
const proposalSubtotal = proposalItems.reduce((s, i) => s + i.price, 0);

type DueTrigger = 'Upon signing' | 'Upon approval' | 'At project start' | 'At project midpoint' | 'Upon substantial completion' | 'Upon final completion' | 'Custom date';
const DUE_TRIGGERS: DueTrigger[] = ['Upon signing', 'Upon approval', 'At project start', 'At project midpoint', 'Upon substantial completion', 'Upon final completion', 'Custom date'];

type Milestone = { id: string; name: string; due: DueTrigger; dueDate: string; amountType: 'percent' | 'flat'; amount: number };

const STANDARD_TEMPLATE: Omit<Milestone, 'id'>[] = [
  { name: 'Deposit', due: 'Upon signing', dueDate: '', amountType: 'percent', amount: 10 },
  { name: 'Progress payment', due: 'At project midpoint', dueDate: '', amountType: 'percent', amount: 60 },
  { name: 'Final payment', due: 'Upon final completion', dueDate: '', amountType: 'percent', amount: 30 },
];

let milestoneSeq = 0;
const nextMilestoneId = () => `ms-${++milestoneSeq}`;

const milestoneAmountDollars = (m: Milestone) => m.amountType === 'percent' ? proposalSubtotal * m.amount / 100 : m.amount;

interface Props {
  onBack: () => void;
  clientName?: string;
  jobCode?: string;
}

export default function ProposalPage({ onBack, clientName = 'Amy', jobCode = 'BWF-26' }: Props) {
  const [tab, setTab] = useState<'details' | 'preview'>('details');
  const [collectSignatures, setCollectSignatures] = useState(true);
  const [title, setTitle] = useState(`Proposal for ${clientName} (${jobCode})`);
  const [approvalDeadline, setApprovalDeadline] = useState('');
  const [introText, setIntroText] = useState('');
  const [closingText, setClosingText] = useState('');

  const [requestDeposit, setRequestDeposit] = useState(false);
  const [depositType, setDepositType] = useState<'percent' | 'flat'>('percent');
  const [depositPercent, setDepositPercent] = useState(10);
  const [depositFlat, setDepositFlat] = useState(Math.round(proposalSubtotal * 0.1));

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const depositAmount = depositType === 'percent' ? proposalSubtotal * depositPercent / 100 : depositFlat;

  const applyTemplate = () => {
    setMilestones(STANDARD_TEMPLATE.map(m => ({ ...m, id: nextMilestoneId() })));
  };
  const addMilestone = () => {
    setMilestones(prev => [...prev, { id: nextMilestoneId(), name: '', due: 'Upon signing', dueDate: '', amountType: 'percent', amount: 0 }]);
  };
  const updateMilestone = (id: string, patch: Partial<Milestone>) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  };
  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const scheduledTotal = milestones.reduce((s, m) => s + milestoneAmountDollars(m), 0);
  const unscheduled = proposalSubtotal - scheduledTotal;
  const isFullyAllocated = Math.abs(unscheduled) < 0.01;

  const dueLabel = (m: Milestone) => m.due === 'Custom date' && m.dueDate ? new Date(m.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : m.due;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f1f5f9', minHeight: '100%' }}>
      <div style={{ maxWidth: 960, margin: '24px auto', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{title || `Proposal for ${clientName} (${jobCode})`}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Job Proposal</h1>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 500, background: '#f1f5f9', color: '#64748b' }}>New</span>
              </div>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#0065db', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5l-4 3.5 4 3.5" stroke="#0065db" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ width: 34, height: 34, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontSize: 16, lineHeight: 1 }}>&#8943;</button>
              <button style={{ padding: '8px 16px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Save</button>
              <BdsButton text="Send" displayType="primary" icon={<BdsIcon name="send" size={14} />} />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16, borderBottom: '2px solid #e2e8f0', marginBottom: -20, marginLeft: -28, marginRight: -28, paddingLeft: 28 }}>
            {(['details', 'preview'] as const).map(key => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '10px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  background: 'none', border: 'none', marginBottom: -2,
                  color: tab === key ? '#0065db' : '#64748b',
                  fontWeight: tab === key ? 600 : 400,
                  borderBottom: tab === key ? '2px solid #0065db' : '2px solid transparent',
                }}
              >
                {key === 'details' ? 'Details' : 'Client preview'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'details' ? (
          <div style={{ padding: '24px 28px' }}>
            {/* Signatures */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={collectSignatures} onChange={e => setCollectSignatures(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Collect signatures
              </label>
              {collectSignatures && (
                <div style={{ maxWidth: 480 }}>
                  <label style={lbl}>Select users to sign</label>
                  <input style={inp} placeholder="Choose signers…" />
                </div>
              )}
            </div>

            {/* Title / deadline */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Title *</label>
                <input style={inp} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div style={{ width: 200 }}>
                <label style={lbl}>Approval deadline</label>
                <input type="date" style={inp} value={approvalDeadline} onChange={e => setApprovalDeadline(e.target.value)} />
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginBottom: 28, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Payment</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Set up how and when the client pays for this proposal. Proposal total: <strong style={{ color: '#0f172a' }}>${fmt(proposalSubtotal)}</strong>
              </div>

              {/* Deposit / payment upon approval */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                <input type="checkbox" checked={requestDeposit} onChange={e => setRequestDeposit(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Request payment upon approval
              </label>

              {requestDeposit && (
                <div style={{ marginTop: 12, marginLeft: 24, maxWidth: 460, background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <div style={{ display: 'inline-flex', marginBottom: 12, border: '1px solid #B1B4B5', borderRadius: 5, overflow: 'hidden' }}>
                    {(['percent', 'flat'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setDepositType(t)}
                        style={{
                          padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                          border: depositType === t ? '1px solid #0763FB' : '1px solid transparent',
                          borderRadius: depositType === t ? 4 : 0,
                          background: 'white',
                          color: depositType === t ? '#004FD6' : '#26292E',
                          fontWeight: depositType === t ? 500 : 400,
                          margin: depositType === t ? -1 : 0,
                          position: 'relative', zIndex: depositType === t ? 1 : 0,
                        }}
                      >
                        {t === 'percent' ? '% of total' : 'Flat amount'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 140 }}>
                      <span style={{ position: 'absolute', left: 10, top: 8, fontSize: 13, color: '#64748b' }}>{depositType === 'percent' ? '' : '$'}</span>
                      <input
                        type="number"
                        style={{ ...inp, paddingLeft: depositType === 'flat' ? 20 : 10, paddingRight: depositType === 'percent' ? 20 : 10 }}
                        value={depositType === 'percent' ? depositPercent : depositFlat}
                        onChange={e => depositType === 'percent' ? setDepositPercent(Number(e.target.value)) : setDepositFlat(Number(e.target.value))}
                      />
                      {depositType === 'percent' && <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 13, color: '#64748b' }}>%</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      = <strong style={{ color: '#0f172a' }}>${fmt(depositAmount)}</strong> due when the client approves
                    </div>
                  </div>
                </div>
              )}

              {/* Payment schedule */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginTop: 20 }}>
                <input type="checkbox" checked={scheduleEnabled} onChange={e => setScheduleEnabled(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Include a payment schedule on this proposal
              </label>

              {scheduleEnabled && (
                <div style={{ marginTop: 12, marginLeft: 24 }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    The schedule below will be appended to the proposal so the client can see how payments break down over the course of the project.
                  </div>

                  {milestones.length === 0 && (
                    <button
                      onClick={applyTemplate}
                      style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#0065db', fontFamily: 'inherit', fontWeight: 500, marginBottom: 14 }}
                    >
                      Use standard 3-payment schedule
                    </button>
                  )}

                  {milestones.length > 0 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                            <th style={th}>Milestone</th>
                            <th style={th}>Due</th>
                            <th style={{ ...th, width: 100 }}>Type</th>
                            <th style={{ ...th, width: 110 }}>Amount</th>
                            <th style={{ ...th, textAlign: 'right', width: 110 }}>= $</th>
                            <th style={{ ...th, width: 32 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {milestones.map(m => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={td}>
                                <input style={{ ...inp, minWidth: 140 }} placeholder="Milestone name" value={m.name} onChange={e => updateMilestone(m.id, { name: e.target.value })} />
                              </td>
                              <td style={td}>
                                <select style={{ ...inp, minWidth: 160 }} value={m.due} onChange={e => updateMilestone(m.id, { due: e.target.value as DueTrigger })}>
                                  {DUE_TRIGGERS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {m.due === 'Custom date' && (
                                  <input type="date" style={{ ...inp, marginTop: 6, minWidth: 160 }} value={m.dueDate} onChange={e => updateMilestone(m.id, { dueDate: e.target.value })} />
                                )}
                              </td>
                              <td style={td}>
                                <select style={inp} value={m.amountType} onChange={e => updateMilestone(m.id, { amountType: e.target.value as 'percent' | 'flat' })}>
                                  <option value="percent">%</option>
                                  <option value="flat">$</option>
                                </select>
                              </td>
                              <td style={td}>
                                <input type="number" style={inp} value={m.amount} onChange={e => updateMilestone(m.id, { amount: Number(e.target.value) })} />
                              </td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(milestoneAmountDollars(m))}</td>
                              <td style={{ ...td, textAlign: 'center' }}>
                                <button onClick={() => removeMilestone(m.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {milestones.length > 0 && (
                    <>
                      <button
                        onClick={addMilestone}
                        style={{ fontSize: 13, color: '#0065db', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}
                      >
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#0065db', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>+</span>
                        Add milestone
                      </button>
                      <div style={{ fontSize: 12, fontWeight: 500, color: isFullyAllocated ? '#15803d' : '#b45309' }}>
                        {isFullyAllocated
                          ? `✓ Fully allocated — ${fmt(scheduledTotal)} scheduled`
                          : unscheduled > 0
                            ? `$${fmt(unscheduled)} of the proposal total is not yet scheduled`
                            : `Schedule exceeds the proposal total by $${fmt(-unscheduled)}`}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Introductory text */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Introductory text</div>
              <textarea style={textarea} value={introText} onChange={e => setIntroText(e.target.value)} />
            </div>

            {/* Closing text */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Closing text</div>
              <textarea style={textarea} value={closingText} onChange={e => setClosingText(e.target.value)} />
            </div>

            {/* Attachments */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Attachments</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Add</button>
                <button style={{ fontSize: 13, padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit' }}>Create new doc</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 28px' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Clients will be able to access this proposal through the emailed link or the client site while this is released and can be signed digitally.
            </div>

            {/* Document preview */}
            <div style={{ maxWidth: 700, margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: '32px 40px', background: 'white' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5, color: '#0f172a' }}>BOOGIE CONSTRUCTION</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>3700 Georgia Ave NW · Washington, DC 20010 · (202) 555-0142</div>
              </div>

              <div style={{ fontSize: 13, color: '#334155', marginBottom: 4 }}>Job Address:</div>
              <div style={{ fontSize: 13, color: '#334155', marginBottom: 16 }}>{jobCode}</div>

              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{title || `Proposal for ${clientName} (${jobCode})`}</div>

              {introText && <div style={{ fontSize: 13, color: '#334155', marginBottom: 20, whiteSpace: 'pre-wrap' }}>{introText}</div>}

              <div style={{ borderTop: '1px solid #e2e8f0', marginBottom: 12 }} />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Items</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Description</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Qty/Unit</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Unit price</th>
                    <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.costCode}</div>
                      </td>
                      <td style={td}>{item.vendor}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{item.qty} {item.unit}</td>
                      <td style={{ ...td, textAlign: 'right' }}>${fmt(item.unitPrice)}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                    <span>Subtotal</span><span style={{ fontWeight: 500, color: '#0f172a' }}>${fmt(proposalSubtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '3px 0', color: '#64748b' }}>
                    <span>Tax</span><span style={{ fontWeight: 500, color: '#0f172a' }}>$0.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, padding: '6px 0', borderTop: '2px solid #0f172a', marginTop: 4, fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    <span>Total price</span><span>${fmt(proposalSubtotal)}</span>
                  </div>
                </div>
              </div>

              {requestDeposit && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>Payment due upon approval</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1e3a8a' }}>${fmt(depositAmount)}</span>
                </div>
              )}

              {scheduleEnabled && milestones.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Payment schedule</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Milestone</th>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0' }}>Due</th>
                        <th style={{ ...th, borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {milestones.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={td}>{m.name || '—'}</td>
                          <td style={td}>{dueLabel(m)}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(milestoneAmountDollars(m))} {m.amountType === 'percent' ? `(${m.amount}%)` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {closingText && <div style={{ fontSize: 13, color: '#334155', marginBottom: 20, whiteSpace: 'pre-wrap' }}>{closingText}</div>}

              {collectSignatures && (
                <>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 16 }}>I confirm that my action here represents my electronic signature and is binding.</div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Signature</div>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Name</div>
                    <div style={{ flex: 1, borderTop: '1px solid #94a3b8', paddingTop: 4, fontSize: 11, color: '#64748b' }}>Date</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4 };
const inp: React.CSSProperties = { padding: '7px 10px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const textarea: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, resize: 'vertical', minHeight: 80, outline: 'none', color: '#0f172a', fontFamily: 'inherit' };
const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 500, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: '#334155' };
