import { useState } from 'react';
import { Invoice } from '../types';
import { calcDueDate, fmtDate } from '../utils';

interface Props {
  invoice: Invoice;
  onChange: (inv: Invoice) => void;
}

// Mock schedule items for the prototype. Real data comes from the project's schedule.
const SCHEDULE_ITEMS = [
  { id: 'sch-1', name: 'Demolition',        start: '2025-04-05', end: '2025-04-11' },
  { id: 'sch-2', name: 'Foundation pour',   start: '2025-04-15', end: '2025-04-20' },
  { id: 'sch-3', name: 'Framing',           start: '2025-05-01', end: '2025-05-15' },
  { id: 'sch-4', name: 'Plumbing rough-in', start: '2025-06-20', end: '2025-06-25' },
  { id: 'sch-5', name: 'Tile install',      start: '2025-07-25', end: '2025-08-05' },
];

type ScheduleAnchor = 'start' | 'end';

export default function InvoiceInfo({ invoice, onChange }: Props) {
  const [linkedScheduleId, setLinkedScheduleId] = useState('');
  const [scheduleAnchor, setScheduleAnchor] = useState<ScheduleAnchor>('start');

  const isLinkedToSchedule = !!linkedScheduleId;
  const linkedItem = SCHEDULE_ITEMS.find(s => s.id === linkedScheduleId);

  const handleDateChange = (date: string) => {
    const dueDate = calcDueDate(date, invoice.paymentTerms);
    onChange({ ...invoice, date, dueDate });
  };
  const handleTermsChange = (terms: string) => {
    const dueDate = calcDueDate(invoice.date, terms);
    onChange({ ...invoice, paymentTerms: terms, dueDate });
  };

  const linkSchedule = (id: string, anchor: ScheduleAnchor) => {
    setLinkedScheduleId(id);
    setScheduleAnchor(anchor);
    const item = SCHEDULE_ITEMS.find(s => s.id === id);
    if (item) {
      const date = anchor === 'start' ? item.start : item.end;
      handleDateChange(date);
    }
  };

  const switchToScheduleTab = () => {
    if (!isLinkedToSchedule) {
      linkSchedule(SCHEDULE_ITEMS[0].id, 'start');
    }
  };

  const switchToDueDateTab = () => {
    setLinkedScheduleId('');
  };

  const setAnchor = (anchor: ScheduleAnchor) => {
    if (linkedItem) {
      linkSchedule(linkedItem.id, anchor);
    }
  };

  const setLinkedItem = (id: string) => {
    linkSchedule(id, scheduleAnchor);
  };

  return (
    <div className="sec">
      <div className="sec-title">Invoice information</div>
      <div className="g3">
        <div><label className="fl">Title</label><input className="fi" value={invoice.title} onChange={e => onChange({ ...invoice, title: e.target.value })} /></div>
        <div><label className="fl">ID #</label><input className="fi" value={invoice.invoiceNumber} onChange={e => onChange({ ...invoice, invoiceNumber: e.target.value })} /></div>
        <div><label className="fl">Date paid</label><input type="date" className="fi" value={invoice.datePaid} onChange={e => onChange({ ...invoice, datePaid: e.target.value })} /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="tabs">
          <button type="button" className={`tab${!isLinkedToSchedule ? ' on' : ''}`} onClick={switchToDueDateTab}>Invoice date</button>
          <button type="button" className={`tab${isLinkedToSchedule ? ' on' : ''}`} onClick={switchToScheduleTab}>Link to schedule item</button>
        </div>
      </div>

      {isLinkedToSchedule && linkedItem && (
        <div style={{ marginTop: 12 }}>
          <label className="fl">Schedule item</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select className="fi" value={linkedItem.id} onChange={e => setLinkedItem(e.target.value)} style={{ maxWidth: 320 }}>
              {SCHEDULE_ITEMS.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button type="button" className="btn-g" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Add</button>
            <button type="button" className="btn-g" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Edit</button>
          </div>
        </div>
      )}

      <div className="g3" style={{ marginTop: 12 }}>
        <div>
          <label className="fl">Invoice date</label>
          {!isLinkedToSchedule ? (
            <input type="date" className="fi" value={invoice.date} onChange={e => handleDateChange(e.target.value)} />
          ) : linkedItem ? (
            <div className="tabs">
              <button type="button" className={`tab${scheduleAnchor === 'start' ? ' on' : ''}`} onClick={() => setAnchor('start')}>{fmtDate(linkedItem.start)}</button>
              <button type="button" className={`tab${scheduleAnchor === 'end' ? ' on' : ''}`} onClick={() => setAnchor('end')}>{fmtDate(linkedItem.end)}</button>
            </div>
          ) : null}
        </div>
        <div>
          <label className="fl">Payment terms</label>
          <select className="fi" value={invoice.paymentTerms} onChange={e => handleTermsChange(e.target.value)}>
            <option>None</option>
            <option>Net 7</option>
            <option>Net 15</option>
            <option>Net 30</option>
            <option>Net 45</option>
            <option>Net 60</option>
            <option>Due on Receipt</option>
          </select>
        </div>
        <div>
          <label className="fl">Due date</label>
          <div style={{ padding: '8px 0', fontSize: 14, color: 'var(--g700)', fontWeight: 500 }}>{fmtDate(invoice.dueDate)}</div>
        </div>
      </div>
    </div>
  );
}
