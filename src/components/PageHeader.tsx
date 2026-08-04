import { Invoice } from '../types';

interface Props {
  invoice: Invoice;
  jobOpen: boolean;
  onToggleJob: () => void;
  onClose?: () => void;
  /** Invoice (modal): the Details / Client preview tab row sits directly under
      this header and carries its own rule, so the header drops its divider and
      the job-drawer toggle. */
  flush?: boolean;
}

export default function PageHeader({ invoice, jobOpen, onToggleJob, onClose, flush = false }: Props) {
  return (
    <div className={"pg-hdr" + (flush ? " pg-hdr-flush" : "")}>
      <div className="pg-accent"></div>
      <div className="pg-hdr-content">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          {!jobOpen && !flush && (
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
          {invoice.invoiceNumber && invoice.status !== 'Unreleased' && invoice.status !== 'Draft' && (
            <span style={{ fontSize: 13, color: 'var(--g500)' }}>#{invoice.invoiceNumber}</span>
          )}
          <span className={invoice.status === 'Draft' ? 'status status-draft' : 'status status-unreleased'}>{invoice.status}</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g500)', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
