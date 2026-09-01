import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsIcon, BdsBadge } from '../bds';
import ClientPreview from './ClientPreview';
import EmailPreview from './EmailPreview';
import ProgressInvoiceGrid from './ProgressInvoiceGrid';
import InvoicePreviewPanel from './InvoicePreviewPanel';
import { INVOICE_TYPE_OPTIONS, INVOICE_TYPE_PREVIEW_MODE } from './InvoiceTypeModal';
import { defaultInvoice, JULY_TIME_INTERVAL_ITEMS } from '../mockData';
import { fmt } from '../utils';
import type { ClientColumnVisibility, Invoice, Job, LineItem } from '../types';

/* Concept: the invoice type is chosen on the invoice, and the document is one
   tab away.

   Two moves are being tried here, both taken from surfaces that already exist
   in this prototype rather than invented for it:

   1. The type question (InvoiceTypeModal) comes off the dialog that precedes
      the invoice and onto the invoice itself, as two cards the builder can
      switch between while the invoice is open. Same copy, same "Preview
      example" escape hatch, but nothing is decided before they can see what
      they're deciding about.

   2. Details and document become one pair of tabs — Invoice / Preview —
      instead of a side-by-side split. The preview tab is the existing client
      and email previews, so what shows here is the real document, not a
      picture of one.

   The open question the page is built around is the auto-fill period. "Pull in
   my unbilled costs" only means something once Buildertrend knows since when,
   and that answer either already exists (the job has an invoicing cadence) or
   has to be asked for. Both states are live below: with no cadence set, Auto
   fill asks; once answered, the banner states the period it will use. */

type InvoiceType = 'standard' | 'progress';

const REPEATS = ['Weekly', 'Every 2 weeks', 'Monthly', 'Quarterly'] as const;
type Repeat = typeof REPEATS[number];
const DAY_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th', '31st'];

const longDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

/* The costs Auto fill pulls in. Same records the time-interval flow uses on the
   other routes, so the fill isn't a different promise here than it is there. */
const autoFillLines = (): LineItem[] => JULY_TIME_INTERVAL_ITEMS.map((item, i) => ({
  id: `af-${i}`,
  description: item.description,
  costCode: item.costCode,
  costType: item.costType,
  unitCost: item.amount,
  quantity: 1,
  unit: '--',
  markup: 0,
  relatedItem: { type: item.costType === 'Labor' ? 'timeClock' as const : 'bill' as const, name: item.costCode, groupId: `af-${i}` },
}));

interface Props {
  job: Job;
  /* Cancel leaves the invoice, the same way the other builders do. */
  onExit: () => void;
}

export default function InvoiceTypePreviewPage({ job, onExit }: Props) {
  const [tab, setTab] = useState<'invoice' | 'preview'>('invoice');
  const [type, setType] = useState<InvoiceType>('standard');
  const [exampleFor, setExampleFor] = useState<InvoiceType | null>(null);

  const [invoice, setInvoice] = useState<Invoice>({
    ...defaultInvoice,
    invoiceNumber: '552993',
    title: 'Invoice #4',
    lineItems: [],
    to: { ...defaultInvoice.to, name: job.name },
  });

  /* null is the case the concept is really about: this job has never said how
     often it invoices, so there is no "since" for Auto fill to use. */
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [askingPeriod, setAskingPeriod] = useState(false);
  const [periodAnswer, setPeriodAnswer] = useState<'once' | 'cadence'>('cadence');
  const [oneOffSince, setOneOffSince] = useState('2026-08-01');
  const [repeat, setRepeat] = useState<Repeat>('Monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [cadenceSaved, setCadenceSaved] = useState(false);

  const [previewTab, setPreviewTab] = useState<'client' | 'email'>('client');
  const [groupBy, setGroupBy] = useState<'estimate' | 'costcode' | 'all'>('estimate');
  const [clientVis, setClientVis] = useState<ClientColumnVisibility>({ costType: false, quantity: true, unit: false, unitPrice: true });
  const [openSection, setOpenSection] = useState<string | null>(null);

  const lines = invoice.lineItems;
  const lineTotal = (l: LineItem) => l.unitCost * l.quantity * (1 + l.markup / 100);
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const builderTotal = lines.reduce((s, l) => s + l.unitCost * l.quantity, 0);

  const cadenceSentence = repeat === 'Monthly' || repeat === 'Quarterly'
    ? `the ${DAY_ORDINALS[dayOfMonth - 1]} of ${repeat === 'Monthly' ? 'every month' : 'every quarter'}`
    : repeat === 'Weekly' ? 'every week' : 'every 2 weeks';

  const runAutoFill = () => {
    setInvoice(inv => ({
      ...inv,
      lineItems: autoFillLines(),
      invoiceDescription: `Costs incurred since ${longDate(periodStart ?? oneOffSince)}, pulled in automatically.`,
    }));
  };

  /* Auto fill with no period set doesn't guess: it asks, and the answer is
     either for this invoice only or for the job from now on. */
  const onAutoFill = () => {
    if (!periodStart) { setAskingPeriod(true); return; }
    runAutoFill();
  };

  const confirmPeriod = () => {
    const since = oneOffSince;
    setPeriodStart(since);
    setCadenceSaved(periodAnswer === 'cadence');
    setAskingPeriod(false);
    setInvoice(inv => ({
      ...inv,
      lineItems: autoFillLines(),
      invoiceDescription: `Costs incurred since ${longDate(since)}, pulled in automatically.`,
    }));
  };

  return (
    <div className="bds-scope" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--g50)' }}>
      {/* Header: the two tabs are the page, so they sit with the title rather
          than inside the body. */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--bds-color-gray-15)', padding: '14px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>{job.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--bds-color-gray-90)' }}>Invoice {invoice.invoiceNumber}</h1>
              <BdsBadge text="Unreleased" displayType="warning" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BdsIcon name="search" size={14} /> Take tour</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BdsIcon name="comments" size={14} /> Feedback</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BdsIcon name="link" size={14} /> Old layout</span>
          </div>
        </div>

        {/* Invoice / Preview. A pill pair rather than underlined tabs: these
            two are the same document in two states, not two sections of it. */}
        <div style={{ display: 'inline-flex', gap: 4, background: 'var(--bds-color-gray-10, #f1f5f9)', borderRadius: 999, padding: 4, marginBottom: 12 }}>
          {([['invoice', 'Invoice'], ['preview', 'Preview']] as const).map(([key, label]) => (
            <button
              key={key} type="button" onClick={() => setTab(key)}
              style={{
                padding: '8px 22px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 600,
                background: tab === key ? 'var(--bt-midnight, #0f2744)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--bds-color-gray-70)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: tab === 'invoice' ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'invoice' ? (
          <div style={{ padding: '20px 24px 28px' }}>
            {/* The type question, on the invoice. Copy is INVOICE_TYPE_OPTIONS,
                so the cards say exactly what the dialog says. Payment schedule
                is left out on purpose: it isn't a document you fill in, it's a
                schedule that produces several. */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
              {INVOICE_TYPE_OPTIONS.filter(o => o.key === 'standard' || o.key === 'progress').map(opt => {
                const key = opt.key as InvoiceType;
                const on = type === key;
                return (
                  <div
                    key={key}
                    onClick={() => setType(key)}
                    style={{
                      flex: '1 1 320px', maxWidth: 460, cursor: 'pointer', padding: '14px 16px',
                      borderRadius: 'var(--bds-radius-lg)', background: '#fff',
                      border: on ? '2px solid var(--bds-color-blue-70)' : '1px solid var(--bds-color-gray-25)',
                      boxShadow: on ? '0 1px 3px rgba(7,99,251,0.12)' : 'none',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="radio" name="invoice-type" checked={on} onChange={() => setType(key)}
                        style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--bds-color-blue-70)' }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', lineHeight: 1.5, marginTop: 2 }}>{opt.blurb}</div>
                      </div>
                    </label>
                    {/* The document is the part a builder can't picture from a
                        label, so each card can be looked at before it's picked. */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setExampleFor(key); }}
                      style={{ marginTop: 8, marginLeft: 26, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: 'var(--bds-color-blue-70)' }}
                    >
                      Preview example →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Auto fill, standard only: percent complete comes off the
                estimate, not off costs, so a progress invoice has nothing to
                pull in. */}
            {type === 'standard' && (
              <div style={{
                border: '1px solid var(--bds-color-blue-20, #bfdbfe)', background: 'var(--bds-color-blue-5, #eff6ff)',
                borderRadius: 'var(--bds-radius-lg)', padding: '14px 16px', marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ color: 'var(--bds-color-blue-70)', marginTop: 2 }}><BdsIcon name="plus" size={16} /></div>
                  <div style={{ flex: '1 1 420px', minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>
                      {periodStart
                        ? `Generate this invoice for unbilled costs since ${longDate(periodStart)}`
                        : 'Let Buildertrend fill in this invoice'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', lineHeight: 1.55, marginTop: 2 }}>
                      We'll pull in the unbilled costs you usually bill on this job (bills, approved time clock hours,
                      and accounting costs) and add them as line items. You can review and make changes before you send
                      it to your client.
                    </div>
                    {periodStart && (
                      <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', marginTop: 6 }}>
                        {cadenceSaved
                          ? <>This job invoices on <strong>{cadenceSentence}</strong>, so each invoice covers everything since the last one. </>
                          : <>Set for this invoice only. </>}
                        <button
                          type="button" onClick={() => setAskingPeriod(true)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: 'var(--bds-color-blue-70)' }}
                        >
                          Change period
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <BdsButton text="Settings" displayType="secondary" onClick={() => setAskingPeriod(true)} />
                    <BdsButton text="Auto fill" displayType="secondary" icon={<BdsIcon name="plus" size={14} />} onClick={onAutoFill} />
                  </div>
                </div>

                {/* The ask. Two ways to answer the same question: once, or for
                    the job. The cadence answer is the one that keeps every
                    invoice after this one from asking again. */}
                {askingPeriod && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--bds-color-blue-20, #bfdbfe)', paddingTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)', marginBottom: 4 }}>
                      Which costs should we pull in?
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', marginBottom: 12, maxWidth: 640, lineHeight: 1.55 }}>
                      This job hasn't said how often it invoices, so there's no period to fill from yet. Answer once and
                      Buildertrend can fill every invoice on this job.
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                      <input type="radio" name="period-answer" checked={periodAnswer === 'cadence'} onChange={() => setPeriodAnswer('cadence')} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--bds-color-blue-70)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>Set how often this job invoices</div>
                        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>Each invoice covers the costs since the last one. Answered once, used every time.</div>
                      </div>
                    </label>
                    {periodAnswer === 'cadence' && (
                      <div style={{ marginLeft: 26, marginBottom: 14, background: '#fff', border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-md)', padding: '12px 14px', maxWidth: 520 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px 12px', alignItems: 'center' }}>
                          <label style={lbl}>Repeat</label>
                          <select style={inp} value={repeat} onChange={e => setRepeat(e.target.value as Repeat)}>
                            {REPEATS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <label style={lbl}>On</label>
                          <select style={inp} value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))}>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{DAY_ORDINALS[d - 1]}</option>)}
                          </select>
                          <label style={lbl}>Start</label>
                          <input type="date" style={inp} value={oneOffSince} onChange={e => setOneOffSince(e.target.value)} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-70)', marginTop: 10, lineHeight: 1.5 }}>
                          Invoices go out on <strong>{cadenceSentence}</strong>, each one covering the costs since{' '}
                          <strong>{longDate(oneOffSince)}</strong>.
                        </div>
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                      <input type="radio" name="period-answer" checked={periodAnswer === 'once'} onChange={() => setPeriodAnswer('once')} style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--bds-color-blue-70)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>Just this invoice</div>
                        <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)' }}>Pull the costs from a date you pick. Nothing is saved to the job.</div>
                      </div>
                    </label>
                    {periodAnswer === 'once' && (
                      <div style={{ marginLeft: 26, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--bds-color-gray-70)' }}>Costs since</span>
                        <input type="date" style={{ ...inp, width: 180 }} value={oneOffSince} onChange={e => setOneOffSince(e.target.value)} />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <BdsButton text="Pull in costs" displayType="primary" onClick={confirmPeriod} />
                      <BdsButton text="Cancel" displayType="secondary" onClick={() => setAskingPeriod(false)} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* The grid the type chose. Progress reuses the schedule of values
                the progress invoice route already renders. */}
            {type === 'progress' ? (
              <div style={{ background: '#fff', border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-lg)', padding: 16 }}>
                <ProgressInvoiceGrid />
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-lg)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bds-color-gray-5, #f8fafc)', borderBottom: '1px solid var(--bds-color-gray-20)' }}>
                      <th style={th}>Items</th>
                      <th style={th}>Cost type</th>
                      <th style={{ ...th, textAlign: 'right' }}>Unit cost</th>
                      <th style={{ ...th, textAlign: 'right' }}>Quantity</th>
                      <th style={th}>Unit</th>
                      <th style={{ ...th, textAlign: 'right' }}>Builder cost</th>
                      <th style={{ ...th, textAlign: 'right' }}>Markup</th>
                      <th style={{ ...th, textAlign: 'right' }}>Client price</th>
                      <th style={{ ...th, width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--bds-color-gray-10, #f1f5f9)' }}>
                        <td style={td}>
                          <div style={{ color: 'var(--bds-color-gray-90)' }}>{l.description}</div>
                          <div style={{ fontSize: 11, color: 'var(--bds-color-gray-50)' }}>{l.costCode}</div>
                        </td>
                        <td style={td}>{l.costType}</td>
                        <td style={{ ...td, textAlign: 'right' }}>${fmt(l.unitCost)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{l.quantity}</td>
                        <td style={td}>{l.unit}</td>
                        <td style={{ ...td, textAlign: 'right' }}>${fmt(l.unitCost * l.quantity)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{l.markup}%</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(lineTotal(l))}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <button
                            type="button" aria-label="Remove line"
                            onClick={() => setInvoice(inv => ({ ...inv, lineItems: inv.lineItems.filter(x => x.id !== l.id) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-50)', padding: 0 }}
                          >
                            <BdsIcon name="x" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ ...td, color: 'var(--bds-color-gray-50)', padding: '18px 12px' }}>
                          No line items yet. Add them by hand, or let Buildertrend fill them in from this job's costs.
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={9} style={{ padding: '8px 12px' }}>
                        <button
                          type="button"
                          onClick={() => setInvoice(inv => ({
                            ...inv,
                            lineItems: [...inv.lineItems, { id: `m-${inv.lineItems.length + 1}`, description: 'New item', costCode: '', costType: 'Other', unitCost: 0, quantity: 1, unit: '--', markup: 0 }],
                          }))}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-blue-70)' }}
                        >
                          <BdsIcon name="plus" size={14} /> Item
                        </button>
                      </td>
                    </tr>
                    <tr style={{ background: 'var(--bds-color-gray-5, #f8fafc)', borderTop: '1px solid var(--bds-color-gray-20)' }}>
                      <td style={{ ...td, fontWeight: 600 }}>Total</td>
                      <td style={td} colSpan={4}></td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(builderTotal)}</td>
                      <td style={td}></td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>${fmt(subtotal)}</td>
                      <td style={td}></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
                  <div style={{ minWidth: 220, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--bds-color-gray-70)' }}>
                      <span>Subtotal</span><span>${fmt(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--bds-color-gray-70)' }}>
                      <span>Tax</span><span>$0.00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', marginTop: 4, borderTop: '2px solid var(--bds-color-gray-90)', fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>
                      <span>Total price</span><span>${fmt(subtotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preview: the document on the left, the settings that change it on
             the right. Same two previews the invoice routes already render, so
             this tab isn't a second version of the client's invoice. */
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
              <div className="preview-tabs">
                <div className="preview-tabs-left">
                  <button className={'preview-tab' + (previewTab === 'client' ? ' on' : '')} onClick={() => setPreviewTab('client')}>Client preview</button>
                  <button className={'preview-tab' + (previewTab === 'email' ? ' on' : '')} onClick={() => setPreviewTab('email')}>Email preview</button>
                </div>
                <div className="preview-tabs-right">
                  {previewTab === 'client' && (
                    <div className="client-group-toggle" role="tablist" aria-label="Group line items for client">
                      <button type="button" className={'client-group-tab' + (groupBy === 'estimate' ? ' on' : '')} onClick={() => setGroupBy('estimate')} aria-selected={groupBy === 'estimate'}>By estimate</button>
                      <button type="button" className={'client-group-tab' + (groupBy === 'costcode' ? ' on' : '')} onClick={() => setGroupBy('costcode')} aria-selected={groupBy === 'costcode'}>By cost code</button>
                      <button type="button" className={'client-group-tab' + (groupBy === 'all' ? ' on' : '')} onClick={() => setGroupBy('all')} aria-selected={groupBy === 'all'}>All line items</button>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--g50)' }}>
                {previewTab === 'client'
                  ? <ClientPreview invoice={invoice} clientVis={clientVis} groupBy={groupBy} />
                  : <EmailPreview invoice={invoice} />}
              </div>
            </div>

            {/* The rail is what the preview is for: every control in it changes
                the document being looked at, so it only exists on this tab. */}
            <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--bds-color-gray-15)', background: '#fff', overflowY: 'auto', padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>Invoice {invoice.invoiceNumber}</div>
              <button type="button" style={{ background: 'none', border: 'none', padding: 0, marginBottom: 14, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: 'var(--bds-color-blue-70)' }}>
                Edit default settings
              </button>

              {[
                { key: 'customization', label: 'Customization' },
                { key: 'payment', label: 'Payment options' },
                { key: 'design', label: 'Design' },
                { key: 'automation', label: 'Automation' },
              ].map(sec => (
                <div key={sec.key} style={{ border: '1px solid var(--bds-color-gray-20)', borderRadius: 'var(--bds-radius-md)', marginBottom: 10, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setOpenSection(s => (s === sec.key ? null : sec.key))}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px', background: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--bds-color-gray-90)' }}
                  >
                    {sec.label}
                    <BdsIcon name={openSection === sec.key ? 'chevron-up' : 'chevron-down'} size={16} />
                  </button>
                  {openSection === sec.key && (
                    <div style={{ padding: '0 14px 14px', fontSize: 13, color: 'var(--bds-color-gray-70)' }}>
                      {sec.key === 'customization' ? (
                        /* Wired, unlike the other three: these are the columns
                           the client's copy shows, and the preview beside it
                           updates as they're ticked. */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {([['quantity', 'Quantity'], ['unit', 'Unit'], ['unitPrice', 'Unit price'], ['costType', 'Cost type']] as const).map(([key, label]) => (
                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox" checked={!!clientVis[key]}
                                onChange={e => setClientVis(v => ({ ...v, [key]: e.target.checked }))}
                                style={{ width: 15, height: 15, accentColor: 'var(--bds-color-blue-70)' }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div style={{ lineHeight: 1.5 }}>
                          {sec.key === 'payment' && 'Online payments, accepted methods, and deposits. Not wired in this concept.'}
                          {sec.key === 'design' && 'Logo, accent color, and paper layout. Not wired in this concept.'}
                          {sec.key === 'automation' && 'Reminders, recurring sends, and QuickBooks sync. Not wired in this concept.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* One action bar for both tabs: it's one document either way. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', background: '#fff', borderTop: '1px solid var(--bds-color-gray-15)', flexShrink: 0 }}>
        <BdsButton text="Cancel" displayType="secondary" onClick={onExit} />
        <BdsButton text="Client preview" displayType="secondary" onClick={() => { setTab('preview'); setPreviewTab('client'); }} />
        <BdsButton text="Save" displayType="secondary" />
        <BdsButton text="Send" displayType="primary" icon={<BdsIcon name="send" size={14} />} />
      </div>

      {exampleFor && (
        <InvoicePreviewPanel
          mode={INVOICE_TYPE_PREVIEW_MODE[exampleFor]}
          job={job}
          onClose={() => setExampleFor(null)}
        />
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--bds-color-gray-80)' };
const inp: React.CSSProperties = { padding: '7px 10px', fontSize: 13, border: '1px solid var(--bds-color-gray-25)', borderRadius: 6, width: '100%', boxSizing: 'border-box', outline: 'none', color: 'var(--bds-color-gray-90)', fontFamily: 'inherit', background: '#fff' };
const th: React.CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 500, color: 'var(--bds-color-gray-60)', textAlign: 'left', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: 'var(--bds-color-gray-80)', verticalAlign: 'top' };
