import { Allowance, Selection, allowanceVariance, selectionClientPrice } from '../allowanceTypes';

interface Props {
  allowances: Allowance[];
  selections: Selection[];
  onInvoiceSelection: (selectionId: string) => void;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AllowanceSummary({ allowances, selections, onInvoiceSelection }: Props) {
  return (
    <div className="sec">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Allowances &amp; Selections</h3>
        <span style={{ fontSize: 11, color: 'var(--g400)', fontStyle: 'italic' }}>
          Allowances are informational — invoice selections directly
        </span>
      </div>

      {allowances.map(allowance => {
        const linked = selections.filter(s => s.allowanceId === allowance.id);
        const variance = allowanceVariance(allowance, selections);
        const isOver = variance < 0;
        const isUnder = variance > 0;

        return (
          <div key={allowance.id} style={{
            border: '1px solid var(--g200)',
            borderRadius: 8,
            marginBottom: 12,
            overflow: 'hidden',
          }}>
            {/* Allowance header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--g50)',
              borderBottom: '1px solid var(--g200)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{allowance.name}</div>
                <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 2 }}>
                  {allowance.costCode.code} — {allowance.costCode.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Budget: ${fmt(allowance.budgetAmount)}</div>
                <div style={{
                  fontSize: 12,
                  marginTop: 2,
                  fontWeight: 600,
                  color: isOver ? 'var(--red)' : isUnder ? 'var(--green)' : 'var(--g500)',
                }}>
                  {isOver
                    ? `Overage: $${fmt(Math.abs(variance))}`
                    : isUnder
                    ? `Underage: $${fmt(variance)}`
                    : 'On budget'}
                </div>
              </div>
            </div>

            {/* Selections */}
            {linked.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--g400)', fontSize: 12, fontStyle: 'italic' }}>
                No selections made yet
              </div>
            ) : (
              linked.map(sel => (
                <div key={sel.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--g100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{sel.name}</span>
                      <span className="badge" style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: sel.status === 'approved' ? '#dcfce7' : sel.status === 'invoiced' ? '#dbeafe' : '#fef3c7',
                        color: sel.status === 'approved' ? 'var(--green)' : sel.status === 'invoiced' ? 'var(--bt-blue)' : 'var(--yellow)',
                      }}>
                        {sel.status}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>${fmt(selectionClientPrice(sel))}</span>
                  </div>

                  {/* Option breakdown */}
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'var(--g400)', fontSize: 11, textAlign: 'left' }}>
                        <th style={{ padding: '4px 0', fontWeight: 500 }}>Item</th>
                        <th style={{ padding: '4px 0', fontWeight: 500 }}>Cost Code</th>
                        <th style={{ padding: '4px 0', fontWeight: 500 }}>Type</th>
                        <th style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>Unit Cost</th>
                        <th style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>Client Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sel.options.map(opt => (
                        <tr key={opt.id}>
                          <td style={{ padding: '4px 0' }}>{opt.name}</td>
                          <td style={{ padding: '4px 0', color: 'var(--g400)' }}>{opt.costCode.code}</td>
                          <td style={{ padding: '4px 0', color: 'var(--g400)' }}>{opt.costType}</td>
                          <td style={{ padding: '4px 0', textAlign: 'right' }}>{opt.quantity} {opt.unit}</td>
                          <td style={{ padding: '4px 0', textAlign: 'right' }}>${fmt(opt.unitCost)}</td>
                          <td style={{ padding: '4px 0', textAlign: 'right' }}>
                            ${fmt(opt.unitCost * opt.quantity * (1 + opt.markup / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Invoice button */}
                  {sel.status === 'approved' && (
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-p"
                        style={{ fontSize: 12, padding: '6px 16px' }}
                        onClick={() => onInvoiceSelection(sel.id)}
                      >
                        Add to Invoice
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
