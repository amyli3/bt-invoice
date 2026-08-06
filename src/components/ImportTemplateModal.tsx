import { useState } from 'react';
import '../bds-tokens.css';
import { BdsButton } from '../bds';
import { INVOICE_TEMPLATES } from '../mockData';

/* The shipped "Import Data From Template" modal, which is where builders
   already go to copy anything off a template job. Invoicing doesn't get its own
   version of this: the same modal, arrived at from the invoice type question,
   with Invoices pre-checked because that's what they came for.

   Everything outside Financial > Invoices is inert here. It's rendered rather
   than trimmed so the modal is recognizable, and so it's obvious that an
   invoice import is one checkbox in a bigger copy operation. */

const GROUPS: { title: string; items: string[] }[] = [
  { title: 'Project Management', items: ['Schedule', 'Tasks', 'Specifications', 'Plans'] },
  { title: 'Files', items: ['Document Folders', 'Photo Folders', 'Video Folders'] },
  { title: 'Messaging', items: ['Surveys'] },
];

const FINANCIAL_AFTER_INVOICES = ['Bid Packages', 'Estimates', 'Purchase Orders', 'Bills'];

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--bds-color-gray-90)', cursor: 'pointer', userSelect: 'none', padding: '6px 0' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: 'var(--bds-color-blue-70)', margin: 0 }}
      />
      {label}
    </label>
  );
}

export default function ImportTemplateModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (templateId: string) => void;
}) {
  const [sourceTemplate, setSourceTemplate] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({ Invoices: true });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const set = (key: string) => (v: boolean) => setChecked(prev => ({ ...prev, [key]: v }));
  // Nothing to copy without a source, and nothing to do if Invoices is off.
  const canImport = !!sourceTemplate && !!checked.Invoices;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="est-modal bds-scope" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="est-modal-hdr">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--bds-color-gray-90)', margin: 0 }}>Import Data From Template</h2>
          <button className="est-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="est-modal-body" style={{ padding: 0 }}>
          <div style={{ border: '1px solid var(--bds-color-gray-15)', borderRadius: 'var(--bds-radius-lg)', margin: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bds-color-gray-15)', fontSize: 15, fontWeight: 600, color: 'var(--bds-color-gray-90)' }}>
              Import Options
            </div>

            <div style={{ padding: '18px 20px 24px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bds-color-gray-90)', marginBottom: 10 }}>Source</div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)', marginBottom: 6 }}>
                Source Template <span style={{ color: 'var(--bds-color-danger-70, #c53030)' }}>*</span>
              </label>
              <select
                className="bds-r-input"
                style={{ width: '100%', maxWidth: 420 }}
                value={sourceTemplate}
                onChange={e => setSourceTemplate(e.target.value)}
              >
                <option value="">-- Choose a Template --</option>
                {INVOICE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--bds-color-gray-90)', margin: '26px 0 8px' }}>Items to Copy</div>

              {GROUPS.map(group => (
                <div key={group.title} style={{ borderBottom: '1px solid var(--bds-color-gray-15)', padding: '10px 0 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-70)', marginBottom: 4 }}>{group.title}</div>
                  {group.items.map(item => (
                    <Check key={item} label={item} checked={!!checked[item]} onChange={set(item)} />
                  ))}
                </div>
              ))}

              <div style={{ padding: '10px 0 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bds-color-gray-70)', marginBottom: 4 }}>Financial</div>
                <Check label="Invoices" checked={!!checked.Invoices} onChange={set('Invoices')} />
                {/* Shifts the copied invoices' dates onto this job's timeline,
                    which is the one thing that can't carry over from a template. */}
                {checked.Invoices && (
                  <div style={{ display: 'flex', gap: 16, margin: '6px 0 10px 26px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)', marginBottom: 6 }}>Date</label>
                      <input type="date" className="bds-r-input" style={{ width: 170 }} value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--bds-color-gray-80)', marginBottom: 6 }}>Time</label>
                      <input type="time" className="bds-r-input" style={{ width: 170 }} value={time} onChange={e => setTime(e.target.value)} />
                    </div>
                  </div>
                )}
                {FINANCIAL_AFTER_INVOICES.map(item => (
                  <Check key={item} label={item} checked={!!checked[item]} onChange={set(item)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="est-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BdsButton text="Import" displayType="primary" disabled={!canImport} onClick={() => onImport(sourceTemplate)} />
        </div>
      </div>
    </div>
  );
}
