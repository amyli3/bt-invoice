import { useState, useRef, useEffect } from 'react';
import { ClientColumnVisibility } from '../types';
import { CLIENT_COLUMNS } from '../mockData';

interface Props {
  columns: ClientColumnVisibility;
  onChange: (vis: ClientColumnVisibility) => void;
}

export default function ClientColumnToggle({ columns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const toggle = (key: string) => onChange({...columns, [key]: !columns[key]});
  return (
    <div style={{position: 'relative', display: 'inline-block'}} ref={ref}>
      <button className="client-col-btn" onClick={() => setOpen(!open)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Customize
      </button>
      {open && (
        <>
          <div className="col-vis-backdrop" onClick={() => setOpen(false)} />
          <div className="col-vis-pop" style={{zIndex: 30, right: 0, left: 'auto'}}>
            <div className="col-vis-pop-header">Client sees</div>
            <div className="col-vis-item locked">
              <div className="col-vis-check on" /><span>Description</span><span style={{marginLeft: 'auto', fontSize: 10, color: 'var(--g400)'}}>Always</span>
            </div>
            {CLIENT_COLUMNS.map(col => (
              <div key={col.key} className="col-vis-item" onClick={() => toggle(col.key)}>
                <div className={"col-vis-check" + (columns[col.key] ? " on" : "")} />
                <span>{col.label}</span>
              </div>
            ))}
            <div className="col-vis-item locked">
              <div className="col-vis-check on" /><span>Amount</span><span style={{marginLeft: 'auto', fontSize: 10, color: 'var(--g400)'}}>Always</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
