import { useState, useRef, useEffect } from 'react';
import { ColumnVisibility } from '../types';
import { ALL_COLUMNS } from '../mockData';

interface Props {
  columns: ColumnVisibility;
  onChange: (vis: ColumnVisibility) => void;
}

export default function ColumnToggle({ columns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visCount = ALL_COLUMNS.filter(c => columns[c.key] && !c.alwaysOn).length;
  const totalToggleable = ALL_COLUMNS.filter(c => !c.alwaysOn).length;

  const showAll = () => {
    const next = {...columns};
    ALL_COLUMNS.forEach(c => { if (!c.alwaysOn) next[c.key] = true; });
    onChange(next);
  };
  const hideAll = () => {
    const next = {...columns};
    ALL_COLUMNS.forEach(c => { if (!c.alwaysOn) next[c.key] = false; });
    onChange(next);
  };
  const toggle = (key: string) => onChange({...columns, [key]: !columns[key]});

  return (
    <div className="col-vis-wrap" ref={ref}>
      <button className="col-vis-trigger" onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Columns
        {visCount < totalToggleable && <span className="count">{visCount}</span>}
      </button>
      {open && (
        <>
          <div className="col-vis-backdrop" onClick={() => setOpen(false)} />
          <div className="col-vis-pop" style={{zIndex: 30}}>
            <div className="col-vis-pop-header">Toggle columns</div>
            {ALL_COLUMNS.map(col => (
              <div key={col.key}
                className={"col-vis-item" + (col.alwaysOn ? " locked" : "")}
                onClick={() => { if (!col.alwaysOn) toggle(col.key); }}
              >
                <div className={"col-vis-check" + (columns[col.key] ? " on" : "")} />
                <span>{col.label}</span>
                {col.alwaysOn && <span style={{marginLeft: 'auto', fontSize: 10, color: 'var(--g400)'}}>Required</span>}
              </div>
            ))}
            <div className="col-vis-pop-footer">
              <button onClick={showAll}>Show all</button>
              <button onClick={hideAll}>Hide all</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
