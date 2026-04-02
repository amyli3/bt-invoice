import { Deposit, applyDepositToInvoice } from '../allowanceTypes';

interface Props {
  deposits: Deposit[];
  invoiceTotal: number;
  appliedDepositIds: string[];
  onToggleDeposit: (depositId: string) => void;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DepositManager({ deposits, invoiceTotal, appliedDepositIds, onToggleDeposit }: Props) {
  const available = deposits.filter(d => d.remainingBalance > 0);
  if (available.length === 0) return null;

  // Calculate running totals
  let remainingInvoice = invoiceTotal;
  const applied = appliedDepositIds.map(id => {
    const dep = deposits.find(d => d.id === id);
    if (!dep) return null;
    const result = applyDepositToInvoice(dep, remainingInvoice);
    remainingInvoice = result.remainingInvoice;
    return { deposit: dep, ...result };
  }).filter(Boolean);

  const totalApplied = applied.reduce((sum, a) => sum + (a?.amountApplied ?? 0), 0);

  return (
    <div className="sec">
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Apply Deposits</h3>
      <p style={{ fontSize: 12, color: 'var(--g400)', margin: '0 0 12px' }}>
        Deposits are prepayments — they reduce what the client owes without affecting cost codes or the JCB.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {available.map(dep => {
          const isApplied = appliedDepositIds.includes(dep.id);
          return (
            <label
              key={dep.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                border: `1px solid ${isApplied ? 'var(--bt-blue)' : 'var(--g200)'}`,
                borderRadius: 6,
                background: isApplied ? 'var(--bt-blue-light)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={isApplied}
                onChange={() => onToggleDeposit(dep.id)}
                style={{ accentColor: 'var(--bt-blue)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{dep.description}</div>
                <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 2 }}>
                  {dep.paymentMethod} · Collected {dep.dateCollected}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>${fmt(dep.remainingBalance)}</div>
                <div style={{ fontSize: 11, color: 'var(--g400)' }}>available</div>
              </div>
            </label>
          );
        })}
      </div>

      {totalApplied > 0 && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: '#f0fdf4',
          borderRadius: 6,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <span style={{ color: 'var(--green)', fontWeight: 500 }}>Deposits applied</span>
          <span style={{ fontWeight: 700, color: 'var(--green)' }}>−${fmt(totalApplied)}</span>
        </div>
      )}
    </div>
  );
}
