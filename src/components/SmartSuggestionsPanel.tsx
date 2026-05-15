import { useMemo, useState } from 'react';
import { LineItem } from '../types';
import { fmt } from '../utils';

type HeldUnderage = { id: string; name: string; costCode: string; amount: number };
type OverageEntry = { id: string; name: string; costCode: string; overageAmount: number };

interface Props {
  heldUnderages: HeldUnderage[];
  overages: OverageEntry[];
  lineItems: LineItem[];
  onApply: (overageId: string, preferredSourceId?: string) => void;
  onUndo: (overageId: string) => void;
  onRelease: () => void;
  onDismiss?: () => void;
}

export default function SmartSuggestionsPanel({ heldUnderages, overages, lineItems, onApply, onUndo, onRelease, onDismiss }: Props) {
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const remainingPool = useMemo(() => {
    const used: Record<string, number> = {};
    lineItems.forEach(li => {
      if (li.reallocation) {
        const sid = li.reallocation.sourceAllowanceId;
        used[sid] = (used[sid] || 0) + (-li.unitCost);
      } else if (li.relatedItem?.type === 'allowance' && li.unitCost < 0) {
        // Bare credits (no reallocation target) also consume the pool
        const sid = li.relatedItem.groupId;
        used[sid] = (used[sid] || 0) + (-li.unitCost);
      }
    });
    return heldUnderages
      .map(u => ({ ...u, amount: u.amount - (used[u.id] || 0) }))
      .filter(u => u.amount > 0);
  }, [heldUnderages, lineItems]);

  // Smart panel only acts on overages ALREADY on the invoice. For each,
  // it computes current coverage state (applied sources + uncovered remainder)
  // and surfaces an Apply (when there's an uncovered amount + available pool)
  // or Undo (when a reallocation already targets this overage).
  type Row = {
    overage: OverageEntry;
    appliedSources: { name: string; amount: number }[];
    appliedTotal: number;
    uncovered: number;
    suggested: { id: string; name: string; amount: number }[];
  };
  const rows: Row[] = useMemo(() => {
    const existingGroupIds = new Set(lineItems.filter(li => li.relatedItem?.groupId).map(li => li.relatedItem!.groupId));
    const onInvoice = overages.filter(o => existingGroupIds.has(o.id));
    const pool = remainingPool.map(u => ({ ...u }));
    return onInvoice.map(o => {
      const coverageLines = lineItems.filter(li => li.reallocation?.targetAllowanceId === o.id);
      const appliedSources = coverageLines.map(li => ({
        name: li.relatedItem?.name || li.reallocation?.targetName || 'Source',
        amount: -li.unitCost,
      }));
      const appliedTotal = appliedSources.reduce((s, a) => s + a.amount, 0);
      const uncovered = o.overageAmount - appliedTotal;
      const suggested: { id: string; name: string; amount: number }[] = [];
      if (uncovered > 0) {
        let need = uncovered;
        while (need > 0 && pool.length > 0) {
          const src = pool[0];
          const take = Math.min(src.amount, need);
          if (take > 0) suggested.push({ id: src.id, name: src.name, amount: take });
          src.amount -= take;
          need -= take;
          if (src.amount === 0) pool.shift();
        }
      }
      return { overage: o, appliedSources, appliedTotal, uncovered, suggested };
    }).filter(r => r.appliedTotal > 0 || r.suggested.length > 0);
  }, [overages, lineItems, remainingPool]);

  const remainingTotal = remainingPool.reduce((s, u) => s + u.amount, 0);
  if (rows.length === 0 && remainingTotal === 0) return null;

  return (
    <div className="smart-panel">
      <div className="smart-panel-header">
        <div className="smart-panel-title">
          <span className="smart-panel-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.2 5.5L13.5 7L9.2 8.5L8 13L6.8 8.5L2.5 7L6.8 5.5L8 1Z" fill="currentColor"/>
              <path d="M13 11.5L13.6 13L15 13.6L13.6 14.2L13 15.6L12.4 14.2L11 13.6L12.4 13L13 11.5Z" fill="currentColor"/>
            </svg>
          </span>
          <span>Smart suggestions</span>
          <span className="smart-panel-summary">
            ${fmt(remainingTotal)} unspent underage to apply · {rows.length} overage{rows.length === 1 ? '' : 's'} on this invoice
          </span>
        </div>
        {onDismiss && (
          <button className="smart-panel-close" onClick={onDismiss} title="Hide suggestions">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <div className="smart-panel-list">
        {rows.map(r => {
          const fullyCovered = r.uncovered === 0 && r.appliedTotal > 0;
          const partiallyCovered = r.appliedTotal > 0 && r.uncovered > 0;
          return (
            <div key={r.overage.id} className={"smart-panel-row" + (r.appliedTotal > 0 ? " smart-panel-row-covered" : "")}>
              <div className="smart-panel-row-text">
                <div className="smart-panel-row-line">
                  {fullyCovered && <span className="smart-panel-status-icon" aria-hidden="true">✓</span>}
                  <strong>{r.overage.name}</strong> · <strong>${fmt(r.overage.overageAmount)}</strong> over budget
                </div>
                {r.appliedTotal > 0 && (
                  <div className="smart-panel-row-sub">
                    Covered: <strong>${fmt(r.appliedTotal)}</strong> from{' '}
                    {r.appliedSources.map((s, i) => (
                      <span key={i}>
                        {i > 0 ? (i === r.appliedSources.length - 1 ? ' + ' : ', ') : ''}
                        <strong>{s.name}</strong> (${fmt(s.amount)})
                      </span>
                    ))}
                  </div>
                )}
                {r.suggested.length > 0 && (
                  <div className="smart-panel-row-sub">
                    {partiallyCovered ? 'Cover the remaining ' : 'Cover with '}
                    {r.suggested.map((s, i) => (
                      <span key={s.id}>
                        {i > 0 ? (i === r.suggested.length - 1 ? ' + ' : ', ') : ''}
                        <strong>${fmt(s.amount)}</strong> from <strong>{s.name}</strong>
                      </span>
                    ))}
                    {r.uncovered > r.suggested.reduce((s, x) => s + x.amount, 0) && (
                      <> · <strong>${fmt(r.uncovered - r.suggested.reduce((s, x) => s + x.amount, 0))}</strong> still uncovered</>
                    )}
                  </div>
                )}
              </div>
              <div className="smart-panel-row-actions">
                {r.suggested.length > 0 && (
                  <div className="smart-panel-apply-split">
                    <button className="btn btn-p smart-panel-apply" onClick={() => onApply(r.overage.id)}>
                      {partiallyCovered ? 'Apply more' : 'Apply'}
                    </button>
                    <button
                      className="smart-panel-apply-caret"
                      onClick={() => setPickerOpenFor(pickerOpenFor === r.overage.id ? null : r.overage.id)}
                      title="Choose source"
                      aria-haspopup="menu"
                      aria-expanded={pickerOpenFor === r.overage.id}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {pickerOpenFor === r.overage.id && (
                      <>
                        <div className="smart-panel-picker-backdrop" onClick={() => setPickerOpenFor(null)} />
                        <div className="smart-panel-picker" role="menu">
                          <div className="smart-panel-picker-label">Apply from a specific underage</div>
                          {remainingPool.map(u => {
                            const applyAmount = Math.min(u.amount, r.uncovered);
                            return (
                              <button
                                key={u.id}
                                className="smart-panel-picker-item"
                                onClick={() => { onApply(r.overage.id, u.id); setPickerOpenFor(null); }}
                              >
                                <span className="smart-panel-picker-name">{u.name}</span>
                                <span className="smart-panel-picker-amt">
                                  ${fmt(applyAmount)}
                                  <span className="smart-panel-picker-avail"> of ${fmt(u.amount)}</span>
                                </span>
                              </button>
                            );
                          })}
                          {remainingPool.length === 0 && (
                            <div className="smart-panel-picker-empty">No underage funds available</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {r.appliedTotal > 0 && (
                  <button className="smart-panel-undo" onClick={() => onUndo(r.overage.id)}>
                    Undo
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {remainingTotal > 0 && rows.every(r => r.uncovered === 0) && (
          <div className="smart-panel-row smart-panel-row-release">
            <div className="smart-panel-row-text">
              <div className="smart-panel-row-line">
                <strong>${fmt(remainingTotal)}</strong> unspent underage with no overage to cover
              </div>
              <div className="smart-panel-row-sub">
                Release as a credit on this invoice — {remainingPool.map((u, i) => (
                  <span key={u.id}>
                    {i > 0 ? (i === remainingPool.length - 1 ? ' + ' : ', ') : ''}
                    <strong>${fmt(u.amount)}</strong> from <strong>{u.name}</strong>
                  </span>
                ))}
              </div>
            </div>
            <button className="btn btn-p smart-panel-apply" onClick={onRelease}>
              Release as credit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
