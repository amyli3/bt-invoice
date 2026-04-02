import { useState } from 'react';
import { Invoice } from '../types';
import { Selection, selectionToLineItems, reconcileAllowance } from '../allowanceTypes';
import { allAllowances, allSelections, sampleDeposits, kitchenAllowanceInvoiced } from '../allowanceMockData';
import { getNextId } from '../mockData';
import { fmt } from '../utils';
import AllowanceSummary from './AllowanceSummary';
import DepositManager from './DepositManager';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

type DemoMode = 'option2' | 'option1' | 'comparison';

export default function AllowanceDemo({ invoice, onChange }: Props) {
  const [mode, setMode] = useState<DemoMode>('option2');
  const [selections, setSelections] = useState<Selection[]>(allSelections);
  const [appliedDeposits, setAppliedDeposits] = useState<string[]>([]);

  const handleInvoiceSelection = (selectionId: string) => {
    const sel = selections.find(s => s.id === selectionId);
    if (!sel || sel.status !== 'approved') return;

    const newLineItems = selectionToLineItems(sel).map(li => ({
      id: getNextId(),
      ...li,
    }));

    onChange({
      ...invoice,
      lineItems: [...invoice.lineItems, ...newLineItems],
    });

    setSelections(prev => prev.map(s =>
      s.id === selectionId ? { ...s, status: 'invoiced' as const } : s
    ));
  };

  const handleToggleDeposit = (depositId: string) => {
    setAppliedDeposits(prev =>
      prev.includes(depositId)
        ? prev.filter(id => id !== depositId)
        : [...prev, depositId]
    );
  };

  // Calculate invoice total for deposit application
  const subtotal = invoice.lineItems.reduce(
    (sum, li) => sum + li.unitCost * li.quantity * (1 + li.markup / 100), 0
  );

  // Option 1 reconciliation demo
  const reconResult = reconcileAllowance(kitchenAllowanceInvoiced, selections.filter(s => s.allowanceId === 'allow-1'));

  return (
    <div className="sec" style={{ padding: 0 }}>
      {/* Mode tabs */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--g200)',
        background: 'var(--g50)',
      }}>
        {([
          ['option2', 'Option 2: No Allowance Invoicing'],
          ['option1', 'Option 1: 100% Reconciliation'],
          ['comparison', 'Side-by-Side Comparison'],
        ] as [DemoMode, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: mode === key ? 600 : 400,
              border: 'none',
              borderBottom: mode === key ? '2px solid var(--bt-blue)' : '2px solid transparent',
              background: mode === key ? 'white' : 'transparent',
              color: mode === key ? 'var(--bt-blue)' : 'var(--g500)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'option2' && (
        <div style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px 0', background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', marginBottom: 4 }}>
              Option 2 — Selections-First Model
            </div>
            <p style={{ fontSize: 12, color: '#0c4a6e', margin: '0 0 12px', lineHeight: 1.5 }}>
              Allowances are <strong>informational only</strong> — they set a budget but are never invoiced.
              When selections are approved, they become line items directly.
              Overages and underages are displayed but require no reconciliation.
            </p>
          </div>

          <AllowanceSummary
            allowances={allAllowances}
            selections={selections}
            onInvoiceSelection={handleInvoiceSelection}
          />

          <DepositManager
            deposits={sampleDeposits}
            invoiceTotal={subtotal}
            appliedDepositIds={appliedDeposits}
            onToggleDeposit={handleToggleDeposit}
          />

          {/* What got added to the invoice */}
          {invoice.lineItems.some(li => 'sourceSelectionId' in li) && (
            <div className="sec">
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
                Added to Invoice from Selections
              </h3>
              <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 8 }}>
                These line items were created from approved selections. Each preserves its original cost code.
              </div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--g200)', color: 'var(--g400)', fontSize: 11 }}>
                    <th style={{ padding: '6px 0', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '6px 0', textAlign: 'left' }}>Cost Code</th>
                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Client Price</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems
                    .filter(li => 'sourceSelectionId' in li)
                    .map(li => (
                      <tr key={li.id} style={{ borderBottom: '1px solid var(--g100)' }}>
                        <td style={{ padding: '6px 0' }}>{li.description}</td>
                        <td style={{ padding: '6px 0', color: 'var(--g400)' }}>{li.costCode}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 500 }}>
                          ${fmt(li.unitCost * li.quantity * (1 + li.markup / 100))}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {mode === 'option1' && (
        <div style={{ padding: 0 }}>
          <div style={{ padding: '16px 24px 0', background: '#fefce8', borderBottom: '1px solid #fde68a' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
              Option 1 — 100% Reconciliation Model
            </div>
            <p style={{ fontSize: 12, color: '#78350f', margin: '0 0 12px', lineHeight: 1.5 }}>
              Allowances <strong>can be invoiced</strong>. When selections are approved,
              the system creates negative line items to reverse prior allowance billing
              and positive line items for each selection at its real cost code.
            </p>
          </div>

          <div className="sec">
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Reconciliation Preview</h3>
            <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 12 }}>
              Allowance "{kitchenAllowanceInvoiced.name}" was invoiced for ${fmt(kitchenAllowanceInvoiced.amountInvoiced)}.
              Selections total ${fmt(reconResult.selectionLineItems.reduce(
                (sum, li) => sum + li.unitCost * li.quantity * (1 + li.markup / 100), 0
              ))}.
            </div>

            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--g200)', color: 'var(--g400)', fontSize: 11 }}>
                  <th style={{ padding: '6px 0', textAlign: 'left' }}>Line Item</th>
                  <th style={{ padding: '6px 0', textAlign: 'left' }}>Cost Code</th>
                  <th style={{ padding: '6px 0', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Selection line items */}
                {reconResult.selectionLineItems.map((li, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--g100)' }}>
                    <td style={{ padding: '6px 0' }}>{li.description}</td>
                    <td style={{ padding: '6px 0', color: 'var(--g400)' }}>{li.costCode}</td>
                    <td style={{ padding: '6px 0', color: 'var(--g400)' }}>{li.costType}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--green)' }}>
                      +${fmt(li.unitCost * li.quantity * (1 + li.markup / 100))}
                    </td>
                  </tr>
                ))}
                {/* Reversal line item */}
                {reconResult.reversalLineItem && (
                  <tr style={{ borderBottom: '1px solid var(--g200)', background: '#fef2f2' }}>
                    <td style={{ padding: '6px 0', fontWeight: 500 }}>{reconResult.reversalLineItem.description}</td>
                    <td style={{ padding: '6px 0', color: 'var(--g400)' }}>{reconResult.reversalLineItem.costCode}</td>
                    <td style={{ padding: '6px 0', color: 'var(--g400)' }}>{reconResult.reversalLineItem.costType}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>
                      −${fmt(Math.abs(reconResult.reversalLineItem.unitCost))}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--g300)' }}>
                  <td colSpan={3} style={{ padding: '8px 0', fontWeight: 600 }}>Net Invoice Amount</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                    ${fmt(reconResult.netTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {reconResult.requiresCreditMemo && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#fef2f2',
                borderRadius: 6,
                border: '1px solid #fecaca',
                fontSize: 12,
                color: 'var(--red)',
              }}>
                Net total is negative — a credit memo of ${fmt(Math.abs(reconResult.netTotal))} would be required.
              </div>
            )}

            {!reconResult.requiresCreditMemo && (
              <div style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#f0fdf4',
                borderRadius: 6,
                border: '1px solid #bbf7d0',
                fontSize: 12,
                color: 'var(--green)',
              }}>
                Client owes ${fmt(reconResult.netTotal)} — the overage beyond their original ${fmt(kitchenAllowanceInvoiced.amountInvoiced)} allowance payment.
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'comparison' && (
        <div style={{ padding: '16px 24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>
            Same Scenario, Two Approaches
          </h3>
          <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 16, lineHeight: 1.5 }}>
            Kitchen allowance of $5,000. Homeowner selected $6,200 worth of fixtures (overage of $1,200).
            What does each invoice look like?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Option 2 */}
            <div style={{ border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0369a1' }}>Option 2: Selections-First</div>
                <div style={{ fontSize: 11, color: '#0c4a6e', marginTop: 2 }}>Allowance never invoiced</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Invoice Line Items</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Kohler Farmhouse Sink</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>$2,160.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Delta Touchless Faucet</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>$780.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Plumbing Install Labor</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>$2,280.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>GE Dishwasher</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>$1,078.80</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--g300)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 700 }}>Invoice Total</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700 }}>$6,298.80</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: 'var(--g400)', fontStyle: 'italic' }}>
                        Less: deposit applied
                      </td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--green)' }}>−$3,000.00</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid var(--g200)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 700 }}>Amount Due</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: 'var(--bt-blue)' }}>$3,298.80</td>
                    </tr>
                  </tfoot>
                </table>
                <div style={{ marginTop: 12, fontSize: 11, padding: '8px 10px', background: '#f0fdf4', borderRadius: 4, color: 'var(--green)' }}>
                  JCB: Each cost code shows exact revenue. No reconciliation needed.
                </div>
              </div>
            </div>

            {/* Option 1 */}
            <div style={{ border: '1px solid var(--g200)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', background: '#fefce8', borderBottom: '1px solid #fde68a' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Option 1: 100% Recon</div>
                <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>Allowance was invoiced for $5,000</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Invoice Line Items</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Kohler Farmhouse Sink</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--green)' }}>+$2,160.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Delta Touchless Faucet</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--green)' }}>+$780.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>Plumbing Install Labor</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--green)' }}>+$2,280.00</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
                      <td style={{ padding: '4px 0' }}>GE Dishwasher</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--green)' }}>+$1,078.80</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--g100)', background: '#fef2f2' }}>
                      <td style={{ padding: '4px 0', fontStyle: 'italic' }}>Allowance reversal</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>−$5,000.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--g300)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 700 }}>Invoice Total (overage)</td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700 }}>$1,298.80</td>
                    </tr>
                  </tfoot>
                </table>
                <div style={{ marginTop: 12, fontSize: 11, padding: '8px 10px', background: '#fefce8', borderRadius: 4, color: '#92400e' }}>
                  JCB: Correct after reconciliation. Requires negative line item + validation that net ≥ 0.
                </div>
              </div>
            </div>
          </div>

          {/* Key differences table */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Key Differences</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--g50)', borderBottom: '2px solid var(--g200)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Dimension</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Option 2</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Option 1</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Invoice complexity', 'Simple: positive line items only', 'Mixed: positive + negative line items'],
                  ['Negative totals possible?', 'Never', 'Yes (needs credit memo)'],
                  ['Cost-code accuracy', 'Perfect by default', 'Correct after reconciliation'],
                  ['Pre-billing support', 'No (use deposits instead)', 'Yes (allowance invoicing)'],
                  ['User mental model', 'Invoice what was selected', 'Undo + redo the billing'],
                  ['Engineering effort', 'Low', 'High'],
                  ['Cash flow gap', 'Deposits fill this', 'Built-in'],
                ].map(([dim, o2, o1], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--g100)' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{dim}</td>
                    <td style={{ padding: '6px 10px' }}>{o2}</td>
                    <td style={{ padding: '6px 10px' }}>{o1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
