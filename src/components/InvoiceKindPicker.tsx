export type InvoiceKind = 'regular' | 'progress';

interface Props {
  onPick: (kind: InvoiceKind) => void;
}

/* Decision point on the reimagined full-page invoice: instead of leading with a
   Flat fee / Line items toggle, the builder first says what kind of invoice this
   is. The choice determines which grid loads below — the regular line-items grid
   or the progress invoice's schedule of values. Same centered empty-state shape
   as the Change Order page's "No line items yet".

   The choice is switchable after the fact via the "Billing: X · Change" chip,
   which returns here. Caveat worth knowing: switching with line items already
   entered leaves the previous type's lines behind. Closing the invoice also
   resets the choice, which is the clean path. */
export default function InvoiceKindPicker({ onPick }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bt-midnight)', marginBottom: 6 }}>
        How are you billing this invoice?
      </div>
      <div style={{ fontSize: 14, color: 'var(--g500)', marginBottom: 20 }}>
        Pick how you want to bill and we'll set up the right line items for you.
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-p" onClick={() => onPick('regular')}>Regular invoice</button>
        <button type="button" className="btn btn-p" onClick={() => onPick('progress')}>Progress invoice</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 14 }}>
        You can switch this later. It only changes how line items are entered.
      </div>
    </div>
  );
}
