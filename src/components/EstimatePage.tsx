import { useState, Fragment, useRef, useEffect } from 'react';
import { allAllowances, allSelections } from '../allowanceMockData';

type EstimateItem = { id: string; name: string; costCode: string; costCodeRaw: string; desc: string; qty: number; unit: string; unitCost: number; costType: string; builderCost: number; markup: number; };
type EstimateGroup = { group: string; budgetAmount: number; items: EstimateItem[]; };

// All items flat
const allItems: EstimateItem[] = allAllowances.flatMap(allowance => {
  const selections = allSelections.filter(s => allowance.selectionIds.includes(s.id));
  return selections.flatMap(sel =>
    sel.options.map(opt => ({
      id: opt.id,
      name: opt.name,
      costCode: `${opt.costCode.code} - ${opt.costCode.label}`,
      costCodeRaw: opt.costCode.code,
      desc: opt.vendor,
      qty: opt.quantity,
      unit: opt.unit,
      unitCost: opt.unitCost,
      costType: opt.costType,
      builderCost: opt.unitCost * opt.quantity,
      markup: opt.markup,
    }))
  );
});

// Group by proposal worksheet (allowance)
const proposalData: EstimateGroup[] = allAllowances.map(allowance => {
  const selections = allSelections.filter(s => allowance.selectionIds.includes(s.id));
  const items = selections.flatMap(sel =>
    sel.options.map(opt => ({
      id: opt.id,
      name: opt.name,
      costCode: `${opt.costCode.code} - ${opt.costCode.label}`,
      costCodeRaw: opt.costCode.code,
      desc: opt.vendor,
      qty: opt.quantity,
      unit: opt.unit,
      unitCost: opt.unitCost,
      costType: opt.costType,
      builderCost: opt.unitCost * opt.quantity,
      markup: opt.markup,
    }))
  );
  return {
    group: `${allowance.costCode.code} - ${allowance.name}`,
    budgetAmount: allowance.budgetAmount,
    items,
  };
});

// Group by cost code
const costCodeData: EstimateGroup[] = (() => {
  const map = new Map<string, EstimateItem[]>();
  for (const item of allItems) {
    const key = item.costCode;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, items]) => ({
      group: code,
      budgetAmount: 0,
      items,
    }));
})();

const totalBuilderCost = allItems.reduce((s, i) => s + i.builderCost, 0);
const totalOwnerPrice = allItems.reduce((s, i) => s + i.builderCost * (1 + i.markup / 100), 0);
const estimatedProfit = totalOwnerPrice - totalBuilderCost;

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  jobOpen?: boolean;
  onToggleJob?: () => void;
  onBuildProposal?: () => void;
}

export default function EstimatePage({ jobOpen, onToggleJob, onBuildProposal }: Props) {
  const [groupBy, setGroupBy] = useState<'proposal' | 'costcode'>('proposal');
  const estimateData = groupBy === 'proposal' ? proposalData : costCodeData;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(proposalData.map(g => g.group)));
  const [groupByOpen, setGroupByOpen] = useState(false);
  const groupByRef = useRef<HTMLDivElement>(null);
  const groupByBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number; left: number}>({top: 0, left: 0});

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (groupByRef.current && !groupByRef.current.contains(e.target as Node)) setGroupByOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchGroupBy = (mode: 'proposal' | 'costcode') => {
    setGroupBy(mode);
    const data = mode === 'proposal' ? proposalData : costCodeData;
    setExpandedGroups(new Set(data.map(g => g.group)));
    setGroupByOpen(false);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(estimateData.map(g => g.group)));
  const collapseAll = () => setExpandedGroups(new Set());

  return (
    <div className="ep-page">
      {/* Header - spans full width */}
      <div className="pg-hdr">
        <div className="pg-accent"></div>
        <div className="pg-hdr-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!jobOpen && onToggleJob && (
              <button onClick={onToggleJob} style={{background: 'none', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer', color: 'var(--g500)', fontSize: 16, display: 'flex', alignItems: 'center', lineHeight: 1}}>
                &#9776;
              </button>
            )}
            <div>
              <div className="pg-hdr-sub">Johnson Residence — Full Remodel &nbsp;›&nbsp; Estimate</div>
              <div className="pg-title">Estimate</div>
            </div>
          </div>
          <div className="pg-hdr-right">
            <div className="ep-summary">
              <div className="ep-summary-item">
                <span className="ep-summary-label">Total owner price</span>
                <span className="ep-summary-value">${fmt(totalOwnerPrice)}</span>
              </div>
              <span className="ep-summary-op">=</span>
              <div className="ep-summary-item">
                <span className="ep-summary-label">Total builder cost</span>
                <span className="ep-summary-value">${fmt(totalBuilderCost)}</span>
              </div>
              <span className="ep-summary-op">+</span>
              <div className="ep-summary-item">
                <span className="ep-summary-label">Estimated profit</span>
                <span className="ep-summary-value ep-profit">${fmt(estimatedProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ep-lower">
      <div className="ep-body">
      {/* Action bar */}
      <div className="ep-actions">
        <div className="ep-actions-left">
          <button className="btn btn-s">Proposal dashboard</button>
          <button className="btn btn-s" onClick={expandedGroups.size === estimateData.length ? collapseAll : expandAll}>
            {expandedGroups.size === estimateData.length ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="ep-actions-right">
          <button className="btn btn-s">Lock estimate</button>
          <button className="btn btn-s">Send to budget</button>
          <button className="btn btn-p" onClick={onBuildProposal}>Build proposal</button>
          <button className="btn btn-s">Export</button>
        </div>
      </div>

      {/* Table */}
      <div className="ep-table-wrap">
        <table className="ep-table">
          <colgroup>
            <col style={{width: '4%'}} />
            <col style={{width: '24%'}} />
            <col style={{width: '16%'}} />
            <col style={{width: '8%'}} />
            <col style={{width: '6%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '10%'}} />
            <col style={{width: '12%'}} />
            <col style={{width: '10%'}} />
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Items</th>
              <th>Description</th>
              <th style={{textAlign: 'center'}}>Quantity</th>
              <th style={{textAlign: 'center'}}>Unit</th>
              <th style={{textAlign: 'right'}}>Unit cost</th>
              <th>Cost type</th>
              <th style={{textAlign: 'right'}}>Builder cost</th>
              <th style={{textAlign: 'right'}}>Markup</th>
            </tr>
          </thead>
          <tbody>
            {estimateData.map(group => (
              <Fragment key={group.group}>
                <tr className="ep-group-row" onClick={() => toggleGroup(group.group)}>
                  <td>
                    <span className={`ep-chevron ${expandedGroups.has(group.group) ? 'ep-chevron-open' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                  </td>
                  <td colSpan={6}>
                    <span className="ep-group-name">{group.group}</span>
                    <span className="ep-group-budget">Budget: ${fmt(group.budgetAmount)}</span>
                    <button className="ep-add-btn" onClick={e => e.stopPropagation()} title="Add item">+</button>
                  </td>
                  <td style={{textAlign: 'right', fontWeight: 600}}>${fmt(group.items.reduce((s, i) => s + i.builderCost, 0))}</td>
                  <td></td>
                </tr>
                {expandedGroups.has(group.group) && group.items.map(item => (
                  <tr key={item.id} className="ep-item-row">
                    <td>
                      <input type="checkbox" className="ep-checkbox" />
                    </td>
                    <td>
                      <div className="ep-item-name">{item.name}</div>
                      <div className="ep-item-code">{item.costCode}</div>
                    </td>
                    <td className="ep-cell-muted">{item.desc}</td>
                    <td style={{textAlign: 'center'}}>{item.qty}</td>
                    <td style={{textAlign: 'center'}}>{item.unit}</td>
                    <td style={{textAlign: 'right'}}>${fmt(item.unitCost)}</td>
                    <td>
                      <span className={`ep-cost-type ep-cost-type-${item.costType.toLowerCase()}`}>{item.costType}</span>
                    </td>
                    <td style={{textAlign: 'right', fontWeight: 600}}>${fmt(item.builderCost)}</td>
                    <td style={{textAlign: 'right'}}>{item.markup > 0 ? `${item.markup}.0%` : '0.0%'}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr className="ep-totals-row">
              <td></td>
              <td colSpan={6}><strong>Totals</strong></td>
              <td style={{textAlign: 'right'}}><strong>${fmt(totalBuilderCost)}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>{/* end ep-body */}

      {/* Right toolbar */}
      <div className="ep-toolbar">
        {/* Settings - BdsIconGearSix */}
        <button className="ep-tb-btn" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 32 32">
            <path fill="currentColor" fillRule="evenodd" d="M12.435 2.704a1 1 0 0 0-.711-.038 14 14 0 0 0-5.135 2.969l-.085.088-.073.096a1 1 0 0 0-.169.573l.057 3.4-.057.088-.223.37-.209.377-.048.094-2.976 1.652-.103.066a1 1 0 0 0-.39.597 14 14 0 0 0 .005 5.932l.034.117.046.112a1 1 0 0 0 .412.432l2.974 1.65.047.095.209.377.222.37.057.088-.057 3.404.006.123a1 1 0 0 0 .322.635 14 14 0 0 0 5.14 2.962l.118.03.12.015a1 1 0 0 0 .58-.14l2.917-1.751.104.006.431.009.432-.008.105-.006 2.92 1.752.108.057a1 1 0 0 0 .712.038 14 14 0 0 0 5.134-2.97l.085-.087.074-.097a1 1 0 0 0 .168-.572l-.058-3.401.058-.088.223-.37.21-.377.045-.093 2.978-1.653.104-.066a1 1 0 0 0 .389-.597 14 14 0 0 0-.005-5.931l-.033-.118-.047-.112a1 1 0 0 0-.412-.432l-2.974-1.652-.047-.092-.208-.378-.223-.37-.058-.088.058-3.404-.005-.123a1 1 0 0 0-.323-.635 14 14 0 0 0-5.139-2.962l-.118-.03-.12-.015a1 1 0 0 0-.58.14l-2.917 1.75-.105-.005L16 4.498l-.431.008-.105.006-2.92-1.752zm-.843 2.132.32-.122 2.786 1.67.11.058a1 1 0 0 0 .478.083 9.5 9.5 0 0 1 1.424 0l.124.002.122-.013a1 1 0 0 0 .345-.128l2.781-1.67.325.121.409.17c.947.415 1.838.95 2.649 1.593l.265.218-.054 3.246.006.124a1 1 0 0 0 .167.456q.403.59.711 1.234l.06.108.073.099a1 1 0 0 0 .283.234l2.838 1.575.066.406.053.423c.107.99.09 1.99-.05 2.976l-.066.404-2.838 1.577-.104.066a1 1 0 0 0-.312.374 9.5 9.5 0 0 1-.713 1.232l-.063.107-.05.112a1 1 0 0 0-.061.362l.054 3.244-.266.22-.352.27a12 12 0 0 1-2.703 1.497l-.323.12-2.783-1.669-.11-.056a1 1 0 0 0-.479-.083q-.712.053-1.424-.002l-.123-.001-.123.013a1 1 0 0 0-.344.128l-2.784 1.669-.322-.12-.41-.17A12 12 0 0 1 8.537 25.4l-.267-.22.055-3.244-.005-.123a1 1 0 0 0-.168-.457 9.5 9.5 0 0 1-.71-1.234l-.061-.108-.073-.099a1 1 0 0 0-.283-.234l-2.839-1.576-.065-.405-.053-.423c-.107-.99-.09-1.99.051-2.976l.064-.405 2.84-1.576.104-.066a1 1 0 0 0 .311-.373q.31-.643.713-1.233l.063-.106.05-.113a1 1 0 0 0 .061-.362L8.27 6.822l.267-.22.352-.269a12 12 0 0 1 2.704-1.497M16 9a7 7 0 1 1 0 14 7 7 0 0 1 0-14m-5 7a5 5 0 1 1 10 0 5 5 0 0 1-10 0" clipRule="evenodd"/>
          </svg>
        </button>
        {/* Filter - BdsIconFunnel */}
        <button className="ep-tb-btn" title="Filter">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 32 32">
            <path fill="currentColor" fillRule="evenodd" d="M5.26 5h21.48a2 2 0 0 1 1.48 3.345L20 17.387v7.078a2 2 0 0 1-.89 1.664l-4 2.667A2 2 0 0 1 12 27.13v-9.744L3.78 8.345A2 2 0 0 1 5.26 5m21.478 2H5.261l8.219 9.041a2 2 0 0 1 .511 1.16l.009.186v9.744l4-2.666v-7.078a2 2 0 0 1 .52-1.346z" clipRule="evenodd"/>
          </svg>
        </button>
        {/* Group by (3rd icon) - interactive */}
        <div className="ep-tb-dropdown-wrap" ref={groupByRef}>
          <button ref={groupByBtnRef} className={`ep-tb-btn ${groupByOpen ? 'ep-tb-btn-active' : ''}`} title="Group by" onClick={() => {
            if (!groupByOpen && groupByBtnRef.current) {
              const rect = groupByBtnRef.current.getBoundingClientRect();
              setDropdownPos({ top: rect.top, left: rect.left - 190 });
            }
            setGroupByOpen(!groupByOpen);
          }}>
            <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.00238156 5.35408C0.00238156 5.50357 0.0669526 5.64693 0.181891 5.75264C0.296829 5.85834 0.452719 5.91772 0.615265 5.91772C0.777812 5.91772 0.933702 5.85834 1.04864 5.75264C1.16358 5.64693 1.22815 5.50357 1.22815 5.35408L1.22815 5.07227H0.00238156V5.35408Z" fill="currentColor"/>
              <path d="M3.06442 2.25391C2.45834 2.25391 1.86586 2.41919 1.36192 2.72886C0.85798 3.03852 0.465205 3.47866 0.233266 3.99362C0.078518 4.33719 2.72492e-06 4.70378 0 5.07209H1.22577C1.22577 4.96186 1.23749 4.85137 1.2611 4.74221C1.33204 4.4142 1.50716 4.11291 1.7643 3.87643C2.02144 3.63996 2.34905 3.47891 2.70572 3.41367C2.82442 3.39196 2.94456 3.38118 3.06442 3.38118V2.25391Z" fill="currentColor"/>
              <path d="M4.11093 0.165177L6.56246 2.41972C6.61945 2.47207 6.66465 2.53423 6.6955 2.60266C6.72634 2.67108 6.74221 2.74442 6.74221 2.8185C6.74221 2.89257 6.72634 2.96591 6.6955 3.03433C6.66465 3.10276 6.61945 3.16492 6.56246 3.21727L4.11093 5.47181C4.05398 5.52418 3.98638 5.56572 3.91198 5.59406C3.83758 5.6224 3.75784 5.63699 3.67731 5.63699C3.59678 5.63699 3.51704 5.6224 3.44264 5.59406C3.36824 5.56572 3.30064 5.52418 3.2437 5.47181C3.18675 5.41945 3.14158 5.35728 3.11077 5.28886C3.07995 5.22043 3.06409 5.1471 3.06409 5.07304C3.06409 4.99898 3.07995 4.92565 3.11077 4.85723C3.14158 4.7888 3.18675 4.72664 3.2437 4.67427L4.6495 3.38213H3.06443V2.25486H4.6495L3.2437 0.962723C3.12869 0.856962 3.06409 0.713519 3.06409 0.56395C3.06409 0.414381 3.12869 0.270938 3.2437 0.165177C3.3587 0.0594162 3.51467 0 3.67731 0C3.83995 0 3.99593 0.0594157 4.11093 0.165177Z" fill="currentColor"/>
              <path d="M18.9976 10.1459C18.9976 9.99643 18.933 9.85307 18.8181 9.74736C18.7032 9.64166 18.5473 9.58228 18.3847 9.58228C18.2222 9.58228 18.0663 9.64166 17.9514 9.74736C17.8364 9.85307 17.7719 9.99643 17.7719 10.1459V10.4277H18.9976V10.1459Z" fill="currentColor"/>
              <path d="M15.9356 13.2461C16.5417 13.2461 17.1341 13.0808 17.6381 12.7711C18.142 12.4615 18.5348 12.0213 18.7667 11.5064C18.9215 11.1628 19 10.7962 19 10.4279H17.7742C17.7742 10.5381 17.7625 10.6486 17.7389 10.7578C17.668 11.0858 17.4928 11.3871 17.2357 11.6236C16.9786 11.86 16.6509 12.0211 16.2943 12.0863C16.1756 12.108 16.0554 12.1188 15.9356 12.1188V13.2461Z" fill="currentColor"/>
              <path d="M14.8891 15.3348L12.4375 13.0803C12.3806 13.0279 12.3353 12.9658 12.3045 12.8973C12.2737 12.8289 12.2578 12.7556 12.2578 12.6815C12.2578 12.6074 12.2737 12.5341 12.3045 12.4657C12.3353 12.3972 12.3806 12.3351 12.4375 12.2827L14.8891 10.0282C14.946 9.97582 15.0136 9.93428 15.088 9.90594C15.1624 9.8776 15.2422 9.86301 15.3227 9.86301C15.4032 9.86301 15.483 9.8776 15.5574 9.90594C15.6318 9.93428 15.6994 9.97582 15.7563 10.0282C15.8132 10.0806 15.8584 10.1427 15.8892 10.2111C15.9201 10.2796 15.9359 10.3529 15.9359 10.427C15.9359 10.501 15.9201 10.5744 15.8892 10.6428C15.8584 10.7112 15.8132 10.7734 15.7563 10.8257L14.3505 12.1179H15.9356V13.2451H14.3505L15.7563 14.5373C15.8713 14.643 15.9359 14.7865 15.9359 14.9361C15.9359 15.0856 15.8713 15.2291 15.7563 15.3348C15.6413 15.4406 15.4853 15.5 15.3227 15.5C15.1601 15.5 15.0041 15.4406 14.8891 15.3348Z" fill="currentColor"/>
              <path d="M9.85699 6.125H2.50238C2.17729 6.125 1.86551 6.24377 1.63563 6.45517C1.40575 6.66658 1.27661 6.9533 1.27661 7.25227V12.8886C1.27661 13.1876 1.40575 13.4743 1.63563 13.6857C1.86551 13.8971 2.17729 14.0159 2.50238 14.0159H9.85699C10.1821 14.0159 10.4939 13.8971 10.7237 13.6857C10.9536 13.4743 11.0828 13.1876 11.0828 12.8886V7.25227C11.0828 6.9533 10.9536 6.66658 10.7237 6.45517C10.4939 6.24377 10.1821 6.125 9.85699 6.125Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M16.5479 0.564453H9.1933C8.8682 0.564453 8.55642 0.683219 8.32655 0.894624C8.09667 1.10603 7.96753 1.39275 7.96753 1.69173V3.94627C7.96753 4.24524 8.09667 4.53197 8.32655 4.74337C8.55642 4.95478 8.8682 5.07354 9.1933 5.07354H12.2577V7.32809C12.2577 7.62706 12.3869 7.91379 12.6167 8.12519C12.8466 8.3366 13.1584 8.45536 13.4835 8.45536H16.5479C16.873 8.45536 17.1848 8.3366 17.4147 8.12519C17.6445 7.91379 17.7737 7.62706 17.7737 7.32809V1.69173C17.7737 1.39275 17.6445 1.10603 17.4147 0.894624C17.1848 0.683219 16.873 0.564453 16.5479 0.564453ZM13.4835 1.69173V3.94627H16.5479V1.69173H13.4835ZM16.5479 7.32809V5.07354H13.4835V7.32809H16.5479ZM12.2577 1.69173H9.1933V3.94627H12.2577V1.69173ZM13.4835 1.69173V0.564453H16.5479V1.69173H13.4835ZM16.5479 1.69173H17.7737V3.94627H16.5479V1.69173ZM12.2577 0.564453V1.69173H9.1933V0.564453H12.2577ZM17.7737 7.32809H16.5479V5.07354H17.7737V7.32809Z" fill="currentColor"/>
              <path d="M12.2577 0.564453H9.1933V1.69173H12.2577V0.564453Z" fill="currentColor"/>
              <path d="M16.5479 0.564453H13.4835V1.69173H16.5479V0.564453Z" fill="currentColor"/>
              <path d="M17.7737 3.94627V1.69173H16.5479V3.94627H17.7737Z" fill="currentColor"/>
              <path d="M17.7737 7.32809V5.07354H16.5479V7.32809H17.7737Z" fill="currentColor"/>
            </svg>
          </button>
          {groupByOpen && (
            <div className="ep-tb-dropdown" style={{top: dropdownPos.top, left: dropdownPos.left}}>
              <button className={`ep-tb-dropdown-item ${groupBy === 'proposal' ? 'active' : ''}`} onClick={() => switchGroupBy('proposal')}>Proposal worksheet</button>
              <button className={`ep-tb-dropdown-item ${groupBy === 'costcode' ? 'active' : ''}`} onClick={() => switchGroupBy('costcode')}>Cost code</button>
            </div>
          )}
        </div>
        <div className="ep-tb-divider" />
        {/* Sort */}
        <button className="ep-tb-btn" title="Sort">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.31754 13.3083C7.37565 13.3663 7.42175 13.4353 7.4532 13.5112C7.48465 13.587 7.50084 13.6684 7.50084 13.7505C7.50084 13.8326 7.48465 13.914 7.4532 13.9898C7.42175 14.0657 7.37565 14.1346 7.31754 14.1927L4.81754 16.6927C4.75949 16.7508 4.69056 16.7969 4.61469 16.8283C4.53881 16.8598 4.45748 16.876 4.37535 16.876C4.29321 16.876 4.21188 16.8598 4.13601 16.8283C4.06014 16.7969 3.99121 16.7508 3.93316 16.6927L1.43316 14.1927C1.31588 14.0754 1.25 13.9163 1.25 13.7505C1.25 13.5846 1.31588 13.4256 1.43316 13.3083C1.55044 13.191 1.7095 13.1251 1.87535 13.1251C2.0412 13.1251 2.20026 13.191 2.31754 13.3083L3.75035 14.7419V5.25909L2.31754 6.69268C2.20026 6.80995 2.0412 6.87584 1.87535 6.87584C1.7095 6.87584 1.55044 6.80995 1.43316 6.69268C1.31588 6.5754 1.25 6.41634 1.25 6.25049C1.25 6.08464 1.31588 5.92558 1.43316 5.8083L3.93316 3.3083C3.99121 3.25019 4.06014 3.20409 4.13601 3.17264C4.21188 3.14119 4.29321 3.125 4.37535 3.125C4.45748 3.125 4.53881 3.14119 4.61469 3.17264C4.69056 3.20409 4.75949 3.25019 4.81754 3.3083L7.31754 5.8083C7.43481 5.92558 7.5007 6.08464 7.5007 6.25049C7.5007 6.41634 7.43481 6.5754 7.31754 6.69268C7.20026 6.80995 7.0412 6.87584 6.87535 6.87584C6.7095 6.87584 6.55044 6.80995 6.43316 6.69268L5.00035 5.25909V14.7419L6.43316 13.3083C6.49121 13.2502 6.56014 13.2041 6.63601 13.1726C6.71188 13.1412 6.79321 13.125 6.87535 13.125C6.95748 13.125 7.03881 13.1412 7.11469 13.1726C7.19056 13.2041 7.25949 13.2502 7.31754 13.3083Z" fill="currentColor"/>
            <path d="M18.75 6.87499C18.75 7.04075 18.6842 7.19972 18.5669 7.31693C18.4497 7.43414 18.2908 7.49999 18.125 7.49999H13.125C12.9592 7.49999 12.8003 7.43414 12.6831 7.31693C12.5658 7.19972 12.5 7.04075 12.5 6.87499C12.5 6.70923 12.5658 6.55026 12.6831 6.43305C12.8003 6.31584 12.9592 6.24999 13.125 6.24999H18.125C18.2908 6.24999 18.4497 6.31584 18.5669 6.43305C18.6842 6.55026 18.75 6.70923 18.75 6.87499ZM18.125 9.37499H13.125C12.9592 9.37499 12.8003 9.44084 12.6831 9.55805C12.5658 9.67526 12.5 9.83423 12.5 9.99999C12.5 10.1658 12.5658 10.3247 12.6831 10.4419C12.8003 10.5591 12.9592 10.625 13.125 10.625H18.125C18.2908 10.625 18.4497 10.5591 18.5669 10.4419C18.6842 10.3247 18.75 10.1658 18.75 9.99999C18.75 9.83423 18.6842 9.67526 18.5669 9.55805C18.4497 9.44084 18.2908 9.37499 18.125 9.37499Z" fill="currentColor"/>
            <path d="M18.75 16.25C18.75 16.4158 18.6842 16.5747 18.5669 16.6919C18.4497 16.8091 18.2908 16.875 18.125 16.875H13.125C12.9592 16.875 12.8003 16.8091 12.6831 16.6919C12.5658 16.5747 12.5 16.4158 12.5 16.25C12.5 16.0842 12.5658 15.9253 12.6831 15.808C12.8003 15.6908 12.9592 15.625 13.125 15.625H18.125C18.2908 15.625 18.4497 15.6908 18.5669 15.808C18.6842 15.9253 18.75 16.0842 18.75 16.25ZM10 13.75H18.125C18.2908 13.75 18.4497 13.6841 18.5669 13.5669C18.6842 13.4497 18.75 13.2908 18.75 13.125C18.75 12.9592 18.6842 12.8003 18.5669 12.683C18.4497 12.5658 18.2908 12.5 18.125 12.5H10C9.83424 12.5 9.67527 12.5658 9.55806 12.683C9.44085 12.8003 9.375 12.9592 9.375 13.125C9.375 13.2908 9.44085 13.4497 9.55806 13.5669C9.67527 13.6841 9.83424 13.75 10 13.75Z" fill="currentColor"/>
            <path d="M18.125 4.375H10C9.83425 4.375 9.67528 4.30915 9.55807 4.19194C9.44086 4.07473 9.37501 3.91576 9.37501 3.75C9.37501 3.58424 9.44086 3.42527 9.55807 3.30806C9.67528 3.19085 9.83425 3.125 10 3.125H18.125C18.2908 3.125 18.4497 3.19085 18.567 3.30806C18.6842 3.42527 18.75 3.58424 18.75 3.75C18.75 3.91576 18.6842 4.07473 18.567 4.19194C18.4497 4.30915 18.2908 4.375 18.125 4.375Z" fill="currentColor"/>
          </svg>
        </button>
        {/* Add line */}
        <button className="ep-tb-btn" title="Add line item">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.375 10.625L17.5 10.625C17.6658 10.625 17.8247 10.5592 17.9419 10.4419C18.0592 10.3247 18.125 10.1658 18.125 10C18.125 9.83424 18.0592 9.67527 17.9419 9.55806C17.8247 9.44085 17.6658 9.375 17.5 9.375H9.375C9.20924 9.375 9.05027 9.44085 8.93306 9.55806C8.81585 9.67527 8.75 9.83424 8.75 10C8.75 10.1658 8.81585 10.3247 8.93306 10.4419C9.05027 10.5592 9.20924 10.625 9.375 10.625ZM2.5 10.625H3.75V11.875C3.75 12.0408 3.81585 12.1997 3.93306 12.3169C4.05027 12.4342 4.20924 12.5 4.375 12.5C4.54076 12.5 4.69973 12.4342 4.81694 12.3169C4.93415 12.1997 5 12.0408 5 11.875V10.625H6.25C6.41576 10.625 6.57473 10.5592 6.69194 10.4419C6.80915 10.3247 6.875 10.1658 6.875 10C6.875 9.83424 6.80915 9.67527 6.69194 9.55806C6.57473 9.44085 6.41576 9.375 6.25 9.375H5V8.125C5 7.95924 4.93415 7.80027 4.81694 7.68306C4.69973 7.56585 4.54076 7.5 4.375 7.5C4.20924 7.5 4.05027 7.56585 3.93306 7.68306C3.81585 7.80027 3.75 7.95924 3.75 8.125V9.375H2.5C2.33424 9.375 2.17527 9.44085 2.05806 9.55806C1.94085 9.67527 1.875 9.83424 1.875 10C1.875 10.1658 1.94085 10.3247 2.05806 10.4419C2.17527 10.5592 2.33424 10.625 2.5 10.625Z" fill="currentColor"/>
          </svg>
        </button>
        {/* Add line (duplicate) */}
        <button className="ep-tb-btn" title="Duplicate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <div className="ep-tb-divider" />
        {/* Book */}
        <button className="ep-tb-btn" title="Catalog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        </button>
        {/* Tag */}
        <button className="ep-tb-btn" title="Tag">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        </button>
        <div className="ep-tb-divider" />
        {/* Delete */}
        <button className="ep-tb-btn ep-tb-btn-muted" title="Delete">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8F9BA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
        <div className="ep-tb-divider" />
        {/* Edit */}
        <button className="ep-tb-btn" title="Edit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        {/* Percent */}
        <button className="ep-tb-btn ep-tb-btn-muted" title="Markup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8F9BA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        </button>
        <div className="ep-tb-divider" />
        {/* Download */}
        <button className="ep-tb-btn" title="Import">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        {/* Resize */}
        <button className="ep-tb-btn" title="Resize">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004FD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="14" rx="2"/><path d="M16 16v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h4"/></svg>
        </button>
      </div>{/* end ep-toolbar */}
      </div>{/* end ep-lower */}
    </div>
  );
}

