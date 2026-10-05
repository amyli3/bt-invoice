import { useState, useEffect, type ReactNode } from 'react';
import { useReviewSettings, setReviewSetting } from '../reviewSettings';

/**
 * ReviewFrame — a floating "Review" control for walking stakeholders through
 * the prototype at a chosen screen size.
 *
 * Wraps the whole app. On Desktop it renders its children untouched, so the
 * normal prototype is exactly what it was. On Tablet or Phone it loads the
 * app into a device-sized iframe, which is how the invoice presentation work
 * gets reviewed at the widths a client actually opens an invoice on.
 *
 * It has to be an iframe rather than a resized div: the app's responsive
 * rules are CSS media queries, and those measure the browser window. Inside
 * a narrow div they'd still see a wide window and lay out for desktop, so a
 * phone "preview" would show a squeezed desktop page instead of the mobile
 * one. An iframe gets its own viewport, so the real breakpoints run.
 */

type ViewportKey = 'desktop' | 'tablet' | 'phone';

/* Real device viewports rather than round numbers, so the breakpoints in
   index.css (1100 / 960 / 600px) get exercised the way they would be on a
   device. Height is capped to the window at render time. */
const VIEWPORTS: { key: ViewportKey; label: string; width: number; height: number }[] = [
  { key: 'desktop', label: 'Desktop', width: 0, height: 0 },
  { key: 'tablet', label: 'Tablet', width: 834, height: 1112 },
  { key: 'phone', label: 'Phone', width: 390, height: 844 },
];

// Marks the iframe's own copy of the app, so it renders the page bare
// instead of nesting another Review pill inside the device.
const EMBED_PARAM = 'rf-embed';
const isEmbedded = new URLSearchParams(window.location.search).has(EMBED_PARAM);

/* Presentation variants the pill can flip. These are comparison switches for
   a review, not builder settings, so they live here rather than as controls
   on the invoice itself. See src/reviewSettings.ts. */
const REVIEW_VARIANTS = [
  {
    key: 'contractType' as const,
    label: 'Contract',
    options: [
      { value: 'open-book' as const, label: 'Open book' },
      { value: 'fixed-price' as const, label: 'Fixed price' },
    ],
    note: {
      'open-book': 'Costs are the contract, so the builder markup is stated in the price breakdown.',
      'fixed-price': 'The client bought a result at a contract price, so no fee row renders.',
    } as Record<string, string>,
  },
  {
    key: 'coLayout' as const,
    label: 'Change orders',
    options: [
      { value: 'inline' as const, label: 'Same grid' },
      { value: 'ownGrid' as const, label: 'Own grid' },
    ],
    note: {
      inline: 'One line-item grid, so the client reads one column of prices to one total.',
      ownGrid: 'A second grid with its own total, so the client reconciles two tables to one amount due.',
    } as Record<string, string>,
  },
];

export default function ReviewFrame({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const settings = useReviewSettings();
  const [viewport, setViewport] = useState<ViewportKey>('desktop');
  // The device opens on whatever page the reviewer is currently looking at.
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isEmbedded) return <>{children}</>;

  const active = VIEWPORTS.find(v => v.key === viewport)!;
  const framed = viewport !== 'desktop';

  return (
    <>
      {framed ? (
        <div className="rf-backdrop">
          <div className="rf-device" style={{ width: active.width, height: `min(${active.height}px, calc(100vh - 88px))` }}>
            {/* Keyed on the size so switching devices remounts the frame at
                the new width, rather than reusing a viewport the app has
                already laid out for. */}
            <iframe
              key={active.key}
              className="rf-iframe"
              title={`Prototype at ${active.label} size`}
              src={`${window.location.pathname}?${EMBED_PARAM}=1${hash}`}
            />
          </div>
          <div className="rf-device-label">{active.label} · {active.width} × {active.height}</div>
        </div>
      ) : (
        children
      )}

      {open && (
        <div className="rf-panel" role="dialog" aria-label="Review controls">
          <div className="rf-panel-head">
            <span className="rf-panel-title">
              <SlidersIcon />
              Review controls
            </span>
            <button type="button" className="rf-close" onClick={() => setOpen(false)} aria-label="Close review controls">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="rf-group-label">Viewport</div>
          <div className="rf-seg" role="radiogroup" aria-label="Viewport">
            {VIEWPORTS.map(v => (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={viewport === v.key}
                className={'rf-seg-btn' + (viewport === v.key ? ' on' : '')}
                onClick={() => setViewport(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* The presentation variants. Only meaningful on the invoice pages,
              but harmless elsewhere, and hiding them per-route would make the
              pill's contents shift underfoot mid-walkthrough. */}
          {REVIEW_VARIANTS.map(v => (
            <div key={v.key}>
              <div className="rf-group-label" style={{ marginTop: 18 }}>{v.label}</div>
              <div className="rf-seg" role="radiogroup" aria-label={v.label}>
                {v.options.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={settings[v.key] === o.value}
                    className={'rf-seg-btn' + (settings[v.key] === o.value ? ' on' : '')}
                    onClick={() => setReviewSetting(v.key, o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="rf-note rf-note-tight">{v.note[settings[v.key]]}</p>
            </div>
          ))}

          <p className="rf-note">
            {framed
              ? `Showing the prototype at ${active.width} × ${active.height}, so the real mobile breakpoints run. The device opens on the page you were on; changing size restarts the flow from there.`
              : 'Switch to Tablet or Phone to review the invoice at the width a client opens it on.'}
          </p>
        </div>
      )}

      <button type="button" className="rf-pill" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <SlidersIcon />
        Review
      </button>
    </>
  );
}

function SlidersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 6h9M15 6h3M2 14h3M9 14h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="13" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7" cy="14" r="2.1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
