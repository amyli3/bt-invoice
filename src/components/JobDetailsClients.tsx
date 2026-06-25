import { useState } from 'react';
import { BdsButton } from '../bds';

/**
 * Job details → Clients permissions page (focused prototype of the BT screen).
 * Only the "Budget difference" control is functional — it drives whether the client
 * sees the budget difference on the Job Price Summary (shareBudgetDiff). Everything
 * else is faithful-but-static chrome so the navigation flow from the JPS reads right.
 */
export default function JobDetailsClients({
  shareBudgetDiff = false,
  onShareBudgetDiffChange,
  onBack,
}: {
  shareBudgetDiff?: boolean;
  onShareBudgetDiffChange?: (v: boolean) => void;
  onBack?: () => void;
}) {
  // Local-only state for the visual checkboxes (so they feel live in the demo).
  const [vis, setVis] = useState<Record<string, boolean>>({
    pmPhone: true, schedPhases: false, schedItems: true,
    coRequests: true, warranty: false,
    jps: true, remainingBalance: true, pos: false, invoices: true, budget: true, related: true,
  });
  const toggle = (k: string) => setVis(v => ({ ...v, [k]: !v[k] }));

  // The "Job Price Summary" permission is the opt-in itself:
  //   checked  → client sees the live JPS in their portal (default).
  //   unchecked → JPS is hidden; builder shares point-in-time PDF copies manually.

  const Check = ({ checked, onClick, label, hint, indent }: { checked: boolean; onClick: () => void; label: string; hint?: string; indent?: boolean }) => (
    <button type="button" className={`jdc-check-row${indent ? ' jdc-indent' : ''}`} onClick={onClick} role="checkbox" aria-checked={checked}>
      <span className={`jdc-check${checked ? ' on' : ''}`} aria-hidden="true">
        {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
      </span>
      <span className="jdc-check-text">
        <span className="jdc-check-label">{label}</span>
        {hint && <span className="jdc-check-hint">{hint}</span>}
      </span>
    </button>
  );

  return (
    <div className="jdc-page bds-scope">
      {/* Header */}
      <div className="jdc-hdr">
        <div className="jdc-hdr-titleblock">
          <div className="jdc-hdr-title-row">
            <h1 className="jdc-hdr-title">Amy's Kitchen (Non BWF)</h1>
            <span className="jdc-status">Open</span>
          </div>
          <button type="button" className="jdc-back" onClick={onBack}>← Back to Estimate</button>
        </div>
        <div className="jdc-hdr-actions">
          <BdsButton displayType="secondary" text="Cancel" onClick={onBack} />
          <BdsButton displayType="primary" text="Save" onClick={onBack} />
        </div>
      </div>

      {/* Tabs */}
      <div className="jdc-tabs" role="tablist">
        {['Job details', 'Clients', 'Internal users', 'Subs/vendors', 'Advanced settings', "Builder's Risk Insurance"].map(t => (
          <button key={t} type="button" role="tab" className={`jdc-tab${t === 'Clients' ? ' on' : ''}`} aria-selected={t === 'Clients'}>{t}</button>
        ))}
      </div>

      {/* Client permissions card */}
      <div className="jdc-card">
        <div className="jdc-card-head">
          <h2 className="jdc-card-title">Client permissions</h2>
          <BdsButton displayType="secondary" text="Edit from Client Portal" />
        </div>

        <div className="jdc-cols">
          {/* Project management */}
          <div className="jdc-col">
            <h3 className="jdc-col-title">Project management</h3>
            <div className="jdc-subhead">Client can view:</div>
            <Check checked={vis.pmPhone} onClick={() => toggle('pmPhone')} label="Project manager's phone number" />
            <Check checked={vis.schedPhases} onClick={() => toggle('schedPhases')} label="Schedule phases" />
            <Check checked={vis.schedItems} onClick={() => toggle('schedItems')} label="Schedule items" />
            {vis.schedItems && (
              <div className="jdc-indent jdc-timeframe">
                <div className="jdc-subhead">Time frame</div>
                <div className="jdc-select">Full schedule <span className="jdc-select-caret">▾</span></div>
              </div>
            )}
            <div className="jdc-subhead" style={{ marginTop: 16 }}>Client can submit:</div>
            <Check checked={vis.coRequests} onClick={() => toggle('coRequests')} label="Change Order requests" />
            <Check checked={vis.warranty} onClick={() => toggle('warranty')} label="Warranty claims" />
          </div>

          {/* Financial */}
          <div className="jdc-col">
            <h3 className="jdc-col-title">Financial</h3>
            <div className="jdc-subhead">Client can view:</div>
            <Check
              checked={vis.jps}
              onClick={() => toggle('jps')}
              label="Job Price Summary"
              hint={vis.jps ? 'Your client sees the live job price summary in their portal, kept up to date automatically.' : undefined}
            />
            {vis.jps ? (
              /* Live in portal — budget difference is an optional add-on to what the client sees */
              <Check
                checked={shareBudgetDiff}
                onClick={() => onShareBudgetDiffChange?.(!shareBudgetDiff)}
                label="Budget difference"
                hint="Show the budget difference on the client's Job Price Summary."
                indent
              />
            ) : (
              /* Hidden from portal — builder opts into sharing point-in-time copies manually */
              <div className="jdc-indent jdc-jps-mode">
                <div className="jdc-mode-head">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  <span>Hidden from the client portal</span>
                </div>
                <p className="jdc-mode-hint">
                  Your client won’t see the job price summary on their own. Instead, send them a point-in-time copy whenever you’re ready — it goes out as a PDF snapshot of the summary exactly as it looks the moment you send it.
                </p>
                <div className="jdc-mode-actions">
                  <BdsButton
                    displayType="secondary"
                    text="Send job price summary…"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                  />
                  <span className="jdc-mode-laststamp">Last sent May 2026</span>
                </div>
              </div>
            )}
            <Check checked={vis.remainingBalance} onClick={() => toggle('remainingBalance')} label="Remaining Invoice Balance" />
            <Check checked={vis.pos} onClick={() => toggle('pos')} label="Purchase Orders/Bills" />
            <Check checked={vis.invoices} onClick={() => toggle('invoices')} label="Invoices" />
            <Check checked={vis.budget} onClick={() => toggle('budget')} label="Budget" />
            {vis.budget && (
              <>
                <label className="jdc-indent jdc-radio"><input type="radio" name="budgetFormat" defaultChecked /> Use the Job Costing Budget format</label>
                <label className="jdc-indent jdc-radio"><input type="radio" name="budgetFormat" /> Use the legacy Budget format</label>
                <div className="jdc-indent jdc-subhead" style={{ marginTop: 8 }}>Columns:</div>
                <div className="jdc-indent jdc-chips">
                  {['Original budget costs', 'Revised budget costs', 'Committed costs', 'Actual costs', 'Builder variance', 'Projected costs', 'Cost to complete', 'Revised vs projected', 'Original owner price', 'Total revised price'].map(c => (
                    <span key={c} className="jdc-chip">{c} <span className="jdc-chip-x">×</span></span>
                  ))}
                </div>
              </>
            )}
            <Check checked={vis.related} onClick={() => toggle('related')} label="Related items" />
          </div>
        </div>
      </div>
    </div>
  );
}
