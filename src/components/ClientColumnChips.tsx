import { useState, useRef, useEffect } from 'react';
import { ClientColumnVisibility } from '../types';
import { CLIENT_COLUMNS } from '../mockData';

interface Props {
  columns: ClientColumnVisibility;
  onChange: (vis: ClientColumnVisibility) => void;
}

// "Invoice (modal)" customize panel only — selected columns show as removable
// chips; clicking the box opens a checklist to add/remove more.
export default function ClientColumnChips({ columns, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (key: string) => onChange({ ...columns, [key]: !columns[key] });
  const visibleCols = CLIENT_COLUMNS.filter(c => columns[c.key]);
  const allOn = CLIENT_COLUMNS.every(c => columns[c.key]);
  const toggleAll = () => {
    const next = { ...columns };
    CLIENT_COLUMNS.forEach(c => { next[c.key] = !allOn; });
    onChange(next);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          minHeight: 34, padding: '6px 8px', border: '1px solid var(--g200)', borderRadius: 6,
          background: 'white', cursor: 'text',
        }}
      >
        {visibleCols.length === 0 && <span style={{ fontSize: 12, color: 'var(--g400)' }}>Select columns&hellip;</span>}
        {visibleCols.map(c => (
          <span
            key={c.key}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px 2px 8px',
              background: 'var(--g50)', border: '1px solid var(--g200)', borderRadius: 4, fontSize: 12, color: 'var(--g700)',
            }}
          >
            {c.label}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggle(c.key); }}
              aria-label={`Remove ${c.label}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g400)', fontSize: 13, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--g400)', fontSize: 11 }}>▾</span>
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white',
            border: '1px solid var(--g200)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 30, maxHeight: 240, overflowY: 'auto',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--g700)', padding: '8px 10px', borderBottom: '1px solid var(--g100)', cursor: 'pointer' }}>
            <input type="checkbox" checked={allOn} onChange={toggleAll} />
            Check All
          </label>
          {CLIENT_COLUMNS.map(c => (
            <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', padding: '7px 10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!columns[c.key]} onChange={() => toggle(c.key)} />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
