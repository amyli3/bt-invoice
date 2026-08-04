import '../bds-tokens.css';
import { BdsIcon } from '../bds';
import { Job, InvoicingMode } from '../types';
import { INVOICING_MODE_LABELS, JULY_TIME_INTERVAL_ITEMS, defaultInvoice } from '../mockData';

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const GENERIC_DRAW = { title: 'Draw #2 — Inspection', milestone: 'Inspection', amount: 10000, description: '"Inspection" milestone marked complete — Draw #2 of the payment schedule set at proposal signing.' };

/* ── Shared letterhead — same builder block every mode's document opens with ── */
function Letterhead() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: 'var(--bds-color-blue-70)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15,
        }}>
          B
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>{defaultInvoice.from.name}</div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--bds-color-gray-60)', lineHeight: 1.5 }}>
        {defaultInvoice.from.address}, {defaultInvoice.from.city}, {defaultInvoice.from.state} {defaultInvoice.from.zip}<br />
        Phone: {defaultInvoice.from.phone}
      </div>
    </div>
  );
}

/* ── Regular invoice (time-interval) and single-line draw invoice share this layout ── */
function LineItemInvoiceDocument({
  job, invoiceTitle, invoiceId, description, items, footnote,
}: {
  job: Job;
  invoiceTitle: string;
  invoiceId: string;
  description: string;
  items: { description: string; qty: string; unitCost: number | null; markup: number; price: number }[];
  footnote: string;
}) {
  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)', padding: '24px 28px', background: '#fff' }}>
      <Letterhead />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--bds-color-gray-15)' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bds-color-gray-50)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Bill to</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>{job.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--bds-color-gray-60)', marginBottom: 4 }}>Invoice ID: <strong style={{ color: 'var(--bds-color-gray-90)' }}>{invoiceId}</strong></div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--bds-color-gray-90)',
            background: 'var(--bds-color-gray-5, #f7f8fa)', padding: '4px 10px', borderRadius: 6, display: 'inline-block',
          }}>
            Amount due: {fmt(total)}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--bds-color-gray-90)', marginBottom: 12 }}>{invoiceTitle}</div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bds-color-gray-50)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Invoice description</div>
        <div style={{ fontSize: 13, color: 'var(--bds-color-gray-80)', lineHeight: 1.5 }}>{description}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--bds-color-gray-60)', background: 'var(--bds-color-gray-5, #f7f8fa)' }}>
            <th style={{ padding: '8px 8px 8px 10px', fontWeight: 600 }}>Items</th>
            <th style={{ padding: '8px', fontWeight: 600 }}>Qty/Unit</th>
            <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Unit cost</th>
            <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Markup amount</th>
            <th style={{ padding: '8px 10px 8px 8px', fontWeight: 600, textAlign: 'right' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--bds-color-gray-10, #f1f2f4)' }}>
              <td style={{ padding: '8px 8px 8px 10px', color: 'var(--bds-color-gray-90)' }}>{item.description}</td>
              <td style={{ padding: '8px', color: 'var(--bds-color-gray-70)' }}>{item.qty}</td>
              <td style={{ padding: '8px', textAlign: 'right', color: 'var(--bds-color-gray-70)' }}>{item.unitCost !== null ? fmt(item.unitCost) : '—'}</td>
              <td style={{ padding: '8px', textAlign: 'right', color: 'var(--bds-color-gray-70)' }}>{fmt(item.markup)}</td>
              <td style={{ padding: '8px 10px 8px 8px', textAlign: 'right', color: 'var(--bds-color-gray-90)', fontWeight: 500 }}>{fmt(item.price)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>
            <td style={{ padding: '8px 8px 8px 10px' }}>Totals</td>
            <td /><td />
            <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(items.reduce((s, i) => s + i.markup, 0))}</td>
            <td style={{ padding: '8px 10px 8px 8px', textAlign: 'right' }}>{fmt(subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ minWidth: 220, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--bds-color-gray-70)' }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--bds-color-gray-70)' }}>
            <span>Tax</span><span>{fmt(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '1px solid var(--bds-color-gray-15)', fontWeight: 800, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>
            <span>Total price</span><span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--bds-color-gray-50)', marginTop: 16 }}>{footnote}</div>
    </div>
  );
}

function TimeIntervalPreview({ job }: { job: Job }) {
  const items = JULY_TIME_INTERVAL_ITEMS.map(item => ({
    description: item.description, qty: '1.00', unitCost: item.amount, markup: 0, price: item.amount,
  }));
  return (
    <LineItemInvoiceDocument
      job={job}
      invoiceTitle="Invoice #3 - July"
      invoiceId="0003"
      description="Bills and time clock hours logged in July — pulled in automatically."
      items={items}
      footnote="Time interval / Open book — one invoice per period, built from bills and time entries as they're logged."
    />
  );
}

function MilestoneDrawsPreview({ job }: { job: Job }) {
  const draw = job.drawSchedule?.find(d => d.phaseComplete && !d.invoiced) ?? job.drawSchedule?.[0] ?? GENERIC_DRAW;
  const description = 'milestone' in draw && 'description' in draw
    ? (draw as typeof GENERIC_DRAW).description
    : `"${draw.milestone}" milestone marked complete — this draw was set up for ${fmt(draw.amount)} when the proposal was signed.`;
  const items = [{ description: draw.title, qty: '1.00', unitCost: null, markup: 0, price: draw.amount }];
  return (
    <LineItemInvoiceDocument
      job={job}
      invoiceTitle={draw.title}
      invoiceId="0002"
      description={description}
      items={items}
      footnote="Milestone / Draws — one invoice per draw, sent as its schedule phase is marked complete."
    />
  );
}

/* ── AIA — full G702/G703-style application for payment ── */
const AIA_CONTINUATION_GROUPS = [
  { code: '1000-1999', label: 'Preparation', scheduled: 42000, completed: 42000 },
  { code: '2000-2999', label: 'Excavation & Foundation', scheduled: 63000, completed: 63000 },
  { code: '3000-3999', label: 'Rough Structure', scheduled: 105000, completed: 84000 },
  { code: '4000-4999', label: 'Mechanical / Electrical / Plumbing', scheduled: 84000, completed: 37000 },
  { code: '5000-5999', label: 'Interior Finishes', scheduled: 84000, completed: 0 },
  { code: '6000-6999', label: 'Exterior & Sitework', scheduled: 42000, completed: 0 },
];

// Exported so the reimagined full-page invoice can render this same G702/G703
// document on its Client preview tab when the progress path is chosen.
export function AiaPreview({ job }: { job: Job }) {
  const originalContractSum = 420000;
  const changeOrders = 8500;
  const contractSumToDate = originalContractSum + changeOrders;
  const totalCompleted = AIA_CONTINUATION_GROUPS.reduce((s, g) => s + g.completed, 0);
  const retainagePct = 10;
  const totalRetainage = Math.round(totalCompleted * (retainagePct / 100));
  const completedLessRetainage = totalCompleted - totalRetainage;
  const previousPayments = 180800;
  const currentPaymentDue = completedLessRetainage - previousPayments;
  const balanceToFinish = contractSumToDate - completedLessRetainage;

  const appRows: [string, string, boolean?][] = [
    ['1. Original contract amount', fmt(originalContractSum)],
    ['2. Total approved changes', fmt(changeOrders)],
    ['3. Total contract amount', fmt(contractSumToDate)],
    ['4. Total completed', fmt(totalCompleted)],
    ['5. Total retainage', fmt(totalRetainage)],
    ['6. Total completed - retainage', fmt(completedLessRetainage)],
    ['7. Less previous payments', fmt(previousPayments)],
    ['8. Current payment due', fmt(currentPaymentDue), true],
    ['9. Balance to finish, including retainage', fmt(balanceToFinish)],
  ];
  const rowNotes: Record<string, string> = {
    '3. Total contract amount': 'Line 1 + Line 2',
    '6. Total completed - retainage': 'Line 4 − Line 5',
    '8. Current payment due': 'Line 6 − Line 7',
    '9. Balance to finish, including retainage': 'Line 3 − Line 6',
  };

  return (
    <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)', padding: '24px 28px', background: '#fff' }}>
      <Letterhead />

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--bds-color-gray-15)' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bds-color-gray-50)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Client address</div>
          <div style={{ fontSize: 13, color: 'var(--bds-color-gray-90)' }}>{job.name.split(' — ')[0]}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bds-color-gray-50)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>Job name</div>
          <div style={{ fontSize: 13, color: 'var(--bds-color-gray-90)' }}>{job.name}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--bds-color-gray-60)', lineHeight: 1.7 }}>
          <div>Application #: <strong style={{ color: 'var(--bds-color-gray-90)' }}>3</strong></div>
          <div>Invoice date: <strong style={{ color: 'var(--bds-color-gray-90)' }}>Jul 31, 2026</strong></div>
          <div>Amount due: <strong style={{ color: 'var(--bds-color-gray-90)' }}>{fmt(currentPaymentDue)}</strong></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bds-color-gray-90)', marginBottom: 10 }}>Application for payment</div>
          {appRows.map(([label, value, highlight]) => (
            <div key={label}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12.5,
                fontWeight: highlight ? 700 : 500, color: 'var(--bds-color-gray-90)',
                background: highlight ? 'var(--bds-color-blue-5, #eef5ff)' : undefined,
              }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              {rowNotes[label] && <div style={{ fontSize: 10.5, color: 'var(--bds-color-gray-50)', marginTop: -2, marginBottom: 2 }}>{rowNotes[label]}</div>}
            </div>
          ))}

          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--bds-color-gray-90)', margin: '16px 0 6px' }}>Change order summary</div>
          <div style={{ fontSize: 12.5, color: 'var(--bds-color-gray-80)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Total changes approved in previous months</span><span>{fmt(changeOrders)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Total changes approved this month</span><span>{fmt(0)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: 700 }}><span>Total approved changes</span><span>{fmt(changeOrders)}</span></div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--bds-color-gray-90)', marginBottom: 6 }}>Contractor certification</div>
          <p style={{ fontSize: 11.5, color: 'var(--bds-color-gray-70)', lineHeight: 1.5, marginBottom: 10 }}>
            The undersigned Contractor certifies that to the best of the Contractor's knowledge, the Work covered by this Application for Payment has been completed in accordance with the Contract Documents.
          </p>
          <div style={{ fontSize: 11.5, color: 'var(--bds-color-gray-50)', marginBottom: 16 }}>
            By: __________________________&nbsp;&nbsp;&nbsp;Date: __________
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--bds-color-gray-90)', marginBottom: 6 }}>Architect certification</div>
          <p style={{ fontSize: 11.5, color: 'var(--bds-color-gray-70)', lineHeight: 1.5, marginBottom: 6 }}>
            In accordance with the Contract Documents, the Architect certifies that the Work has progressed as indicated and the Contractor is entitled to payment of the AMOUNT CERTIFIED.
          </p>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--bds-color-gray-90)', marginBottom: 10 }}>Amount certified: {fmt(currentPaymentDue)}</div>
          <div style={{ fontSize: 11.5, color: 'var(--bds-color-gray-50)' }}>
            By: __________________________&nbsp;&nbsp;&nbsp;Date: __________
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--bds-color-gray-90)', marginBottom: 8 }}>Continuation sheet</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--bds-color-gray-60)', background: 'var(--bds-color-gray-5, #f7f8fa)' }}>
              <th style={{ padding: '6px 8px 6px 0', fontWeight: 600 }}>Description of work</th>
              <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Scheduled value</th>
              <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>Total completed</th>
              <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>% complete</th>
              <th style={{ padding: '6px 0 6px 8px', fontWeight: 600, textAlign: 'right' }}>Balance to finish</th>
            </tr>
          </thead>
          <tbody>
            {AIA_CONTINUATION_GROUPS.map(g => (
              <tr key={g.code} style={{ borderBottom: '1px solid var(--bds-color-gray-10, #f1f2f4)', fontWeight: 600 }}>
                <td style={{ padding: '7px 8px 7px 0', color: 'var(--bds-color-gray-90)' }}>{g.code} - {g.label}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{fmt(g.scheduled)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{fmt(g.completed)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{fmtPct(g.scheduled ? (g.completed / g.scheduled) * 100 : 0)}</td>
                <td style={{ padding: '7px 0 7px 8px', textAlign: 'right', color: 'var(--bds-color-gray-90)' }}>{fmt(g.scheduled - g.completed)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, color: 'var(--bds-color-gray-90)' }}>
              <td style={{ padding: '8px 8px 8px 0' }}>Totals</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(originalContractSum)}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(totalCompleted)}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{fmtPct((totalCompleted / originalContractSum) * 100)}</td>
              <td style={{ padding: '8px 0 8px 8px', textAlign: 'right' }}>{fmt(originalContractSum - totalCompleted)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{ minWidth: 220, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--bds-color-gray-70)' }}>
            <span>Subtotal</span><span>{fmt(currentPaymentDue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--bds-color-gray-70)' }}>
            <span>Total tax</span><span>{fmt(0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '1px solid var(--bds-color-gray-15)', fontWeight: 800, fontSize: 15, color: 'var(--bds-color-gray-90)' }}>
            <span>Amount due</span><span>{fmt(currentPaymentDue)}</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--bds-color-gray-50)', marginTop: 16 }}>
        Progress invoice (AIA style) — certified pay application (G702/G703 style) billed on percent of work completed.
      </div>
    </div>
  );
}

export default function InvoicePreviewPanel({ mode, job, onClose }: { mode: InvoicingMode; job: Job; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20, 24, 33, 0.5)' }} />
      <div className="bds-scope" style={{
        position: 'relative', width: mode === 'aia-percent-complete' ? 1000 : 720, maxWidth: '96vw',
        maxHeight: '92vh', background: '#fff', borderRadius: 'var(--bds-radius-lg)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--bds-color-gray-15)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bds-color-blue-70)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Example invoice
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--bds-color-gray-90)' }}>{INVOICING_MODE_LABELS[mode].label}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bds-color-gray-60)' }}>
            <BdsIcon name="x" size={20} />
          </button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', background: 'var(--bds-color-gray-5, #f7f8fa)' }}>
          {mode === 'time-interval' && <TimeIntervalPreview job={job} />}
          {mode === 'milestone-draws' && <MilestoneDrawsPreview job={job} />}
          {mode === 'aia-percent-complete' && <AiaPreview job={job} />}
        </div>
      </div>
    </div>
  );
}
