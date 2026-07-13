import { Invoice } from '../types';

interface Props {
  invoice: Invoice;
  jobOpen: boolean;
  onToggleJob: () => void;
}

export default function PageHeader({ invoice, jobOpen, onToggleJob }: Props) {
  return (
    <div className="pg-hdr">
      <div className="pg-accent"></div>
      <div className="pg-hdr-content">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {!jobOpen && (
            <button onClick={onToggleJob} style={{background: 'none', border: '1px solid var(--g200)', borderRadius: 'var(--radius)', padding: '4px 8px', cursor: 'pointer', color: 'var(--g500)', fontSize: 16, display: 'flex', alignItems: 'center', lineHeight: 1}}>
              &#9776;
            </button>
          )}
          <div>
            <div className="pg-hdr-sub">{invoice.to.name}</div>
            <div className="pg-title">{invoice.type === 'progress' ? 'Progress invoice' : 'Invoice'}</div>
          </div>
        </div>
        <div className="pg-hdr-right">
          {invoice.invoiceNumber && invoice.status !== 'Unreleased' && (
            <span style={{ fontSize: 13, color: 'var(--g500)' }}>#{invoice.invoiceNumber}</span>
          )}
          <span className="status status-unreleased">{invoice.status}</span>
        </div>
      </div>
    </div>
  );
}
