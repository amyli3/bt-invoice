import { useState } from 'react';

export type InvoiceKind = 'regular' | 'progress';

interface Props {
  onPick: (kind: InvoiceKind, makeDefault: boolean) => void;
}

/* Decision point on the reimagined full-page invoice: instead of leading with a
   Flat fee / Line items toggle, the builder first says what kind of invoice this
   is. The choice determines which grid loads below — the regular line-items grid
   or the progress invoice's schedule of values. Same centered empty-state shape
   as the Change Order page's "No line items yet".

   The choice is switchable after the fact via the "Billing: X · Change" chip,
   which returns here. Caveat worth knowing: switching with line items already
   entered leaves the previous type's lines behind. Closing the invoice also
   resets the choice, which is the clean path.

   Most builders bill the same way every time, so the checkbox turns this step
   off for good: it writes the pick to Company settings > Invoices > Default
   invoice type, and from then on new invoices open straight into that grid.
   Reachable again from "Switch billing type", which is also how a builder with
   a saved default gets back here to change it.

   Deliberately does NOT restate the current default or where to find the
   setting: the checkbox is the only thing on this screen that touches the
   default, and naming Company settings here sent people away mid-task. */
export default function InvoiceKindPicker({ onPick }: Props) {
  const [makeDefault, setMakeDefault] = useState(false);

  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bt-midnight)', marginBottom: 6 }}>
        How are you billing this invoice?
      </div>
      {/* Keyed to each option rather than one compound sentence: the builder is
          choosing between two grids, so the copy says what each grid asks them
          to fill in. Named in the same order as the buttons below. */}
      <div style={{ fontSize: 14, color: 'var(--g500)', marginBottom: 20, lineHeight: 1.5, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
        <div>
          <b style={{ color: 'var(--g700)' }}>Standard invoice</b> bills the amounts you're charging, line by line, or as one flat fee.
        </div>
        <div style={{ marginTop: 2 }}>
          <b style={{ color: 'var(--g700)' }}>Progress invoice</b> bills a percent of each contract line, tracked against a schedule of values.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-p" onClick={() => onPick('regular', makeDefault)}>Standard invoice</button>
        <button type="button" className="btn btn-p" onClick={() => onPick('progress', makeDefault)}>Progress invoice</button>
      </div>

      {/* The checkbox is set before the pick, so its label can't name a type.
          It reads as "whichever I click next", which is why it sits under the
          buttons rather than beside either one. */}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18,
        fontSize: 13, color: 'var(--g700)', cursor: 'pointer', userSelect: 'none',
      }}>
        <input
          type="checkbox"
          checked={makeDefault}
          onChange={(e) => setMakeDefault(e.target.checked)}
          style={{ width: 15, height: 15, accentColor: 'var(--bt-blue)', margin: 0 }}
        />
        Always bill this way. Skip this step on new invoices.
      </label>
    </div>
  );
}
