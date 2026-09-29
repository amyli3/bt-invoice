import { useState, useRef, useEffect } from 'react';
import { ClientDetailVisibility } from '../types';
import { CLIENT_DETAIL_OPTIONS } from '../mockData';

interface Props {
  detail: ClientDetailVisibility;
  onChange: (d: ClientDetailVisibility) => void;
  /** Fixed-price vs open-book changes the recommended default, not the options.
      On fixed price the client is buying a result, so cost provenance is noise
      at best and an invitation to line-item interrogation at worst; on open
      book the same fields are the contract. Drives the preset buttons and the
      "recommended" hint only — every option stays reachable either way. */
  contractType?: 'fixed-price' | 'cost-plus' | 'time-and-materials';
}

/* "What backup does the client see?" — the disclosure control that sits beside
   the column picker.

   Kept separate from ClientColumnToggle on purpose. Columns are a layout
   question ("how wide is this table"); these are a trust question ("does the
   homeowner see which sub we paid and what we pay our lead carpenter"). The
   feedback corpus splits hard on the answer and splits by contract type, so
   the control leads with two presets and lets the builder tune from there.

   Off is the default for all five. The fixed-price majority wants none of it,
   and shipping detail on by default is the specific complaint in Paul G's
   feedback about bill attachments. */
export default function ClientDetailToggle({ detail, onChange, contractType }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isOpenBook = contractType === 'cost-plus' || contractType === 'time-and-materials';
  const toggle = (key: string) => onChange({ ...detail, [key]: !detail[key] });
  const onCount = CLIENT_DETAIL_OPTIONS.filter(o => detail[o.key]).length;

  // Summary preset: the client sees that a real vendor was paid on a real
  // document, without the receipt pile or anyone's hourly rate. This is the
  // shape Renee described for lender packages (cost code, vendor, bill #, $).
  const applySummary = () => onChange({
    vendor: true, billNumber: true, billDate: true, attachments: false, laborDetail: false,
  });
  // Full backup: everything, which is what a true open-book contract promises.
  const applyFull = () => onChange({
    vendor: true, billNumber: true, billDate: true, attachments: true, laborDetail: true,
  });
  const applyNone = () => onChange({
    vendor: false, billNumber: false, billDate: false, attachments: false, laborDetail: false,
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button className="client-col-btn" onClick={() => setOpen(!open)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
        Client sees backup{onCount > 0 ? ` (${onCount})` : ''}
      </button>
      {open && (
        <>
          <div className="col-vis-backdrop" onClick={() => setOpen(false)} />
          <div className="col-vis-pop" style={{ zIndex: 30, right: 0, left: 'auto', width: 320 }}>
            <div className="col-vis-pop-header">What backup does the client see?</div>

            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--g100)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={applyNone} className="client-col-btn" style={{ flex: 1, justifyContent: 'center' }}>None</button>
                <button onClick={applySummary} className="client-col-btn" style={{ flex: 1, justifyContent: 'center' }}>Summary</button>
                <button onClick={applyFull} className="client-col-btn" style={{ flex: 1, justifyContent: 'center' }}>Full</button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--g500)', marginTop: 6, lineHeight: 1.45 }}>
                {isOpenBook
                  ? 'This job is open book, so the client is entitled to see where their money went. Full backup is the usual choice.'
                  : 'This job is fixed price, so the client is buying a result, not your costs. None is the usual choice.'}
              </div>
            </div>

            {CLIENT_DETAIL_OPTIONS.map(o => (
              <div key={o.key} className="col-vis-item" onClick={() => toggle(o.key)} style={{ alignItems: 'flex-start' }}>
                <div className={'col-vis-check' + (detail[o.key] ? ' on' : '')} style={{ marginTop: 3 }} />
                <div>
                  <div>{o.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 1 }}>{o.hint}</div>
                </div>
              </div>
            ))}

            {detail.laborDetail && (
              <div style={{ padding: '8px 10px', borderTop: '1px solid var(--g100)', background: 'var(--amber-bg, #fff8e6)' }}>
                <div style={{ fontSize: 10, color: 'var(--g600)', lineHeight: 1.5 }}>
                  Labor by employee shows each person's hourly rate to the client. On a
                  fixed-price job that is usually more than you want to share.
                </div>
              </div>
            )}

            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--g100)' }}>
              <div style={{ fontSize: 10, color: 'var(--g500)', lineHeight: 1.5 }}>
                Applies to every invoice on this job. Lines added from the estimate,
                change orders or selections have no backup to show.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
