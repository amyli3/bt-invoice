import { useState } from 'react';
import { INVOICE_SELECTION_SCENARIOS } from '../selectionsData';

interface SelectionData {
  name: string;
  category: string;
  price: number;
  allowanceName?: string;
  status: string;
}

interface Props {
  onBack: () => void;
  selectionData?: SelectionData | null;
  prefilledAllowance?: string | null;
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/bath|shower|tub|toilet|vanity/.test(n)) return 'Bathroom';
  if (/floor|hardwood|vinyl|carpet|tile/.test(n)) return 'Flooring';
  if (/light|pendant|sconce|chandelier/.test(n)) return 'Lighting';
  if (/paint|wall/.test(n)) return 'Interior';
  if (/door|mailbox|hardware/.test(n)) return 'Exterior';
  return 'Kitchen';
}

function inferLocation(name: string): string {
  const n = name.toLowerCase();
  if (/basement|lower/.test(n)) return 'Basement';
  if (/master|bedroom/.test(n)) return 'Upper floor';
  return 'Main floor';
}

export default function OptionDetailPage({ onBack, selectionData, prefilledAllowance }: Props) {
  const isViewing = !!selectionData;
  const isPending = selectionData?.status === 'pending';
  const [title, setTitle] = useState(selectionData?.name || '');
  const [description, setDescription] = useState('');
  const [allowance, setAllowance] = useState(
    selectionData?.allowanceName || prefilledAllowance || 'None'
  );
  const [category, setCategory] = useState(
    selectionData?.category && selectionData.category !== '' && selectionData.category !== 'None'
      ? selectionData.category
      : selectionData
        ? inferCategory(selectionData.name)
        : 'None'
  );
  const [location, setLocation] = useState(selectionData ? inferLocation(selectionData.name) : 'None');
  const [productUrl, setProductUrl] = useState('');
  const [optionStatus, setOptionStatus] = useState(selectionData?.status || 'draft');

  const [lineItems, setLineItems] = useState<{ title: string; description: string; quantity: string; unit: string; unitCost: string; costType: string; costCode: string; touched: boolean }[]>(
    selectionData ? [{ title: selectionData.name, description: '', quantity: '1.0000', unit: '', unitCost: selectionData.price.toFixed(4), costType: 'Material', costCode: '', touched: false }] : []
  );

  // Sample specs are seeded based on the inferred category so the section shows
  // realistic detail for prototypes. Real data would come from the catalog/PIM.
  const seedSpecs = (): { label: string; value: string }[] => {
    if (!isViewing) return [];
    const cat = (selectionData?.category || inferCategory(selectionData?.name || '')).toLowerCase();
    if (cat.includes('plumb') || cat.includes('bath') || cat.includes('fixture')) {
      return [
        { label: 'Brand', value: 'Kohler' },
        { label: 'Model number', value: 'K-22972-CP' },
        { label: 'Finish', value: 'Polished chrome' },
        { label: 'Material', value: 'Brass' },
        { label: 'Dimensions', value: '8" spread, 6.5" spout reach' },
        { label: 'Flow rate', value: '1.2 GPM' },
        { label: 'Mount type', value: 'Deck mount, 3-hole' },
        { label: 'Warranty', value: 'Lifetime limited' },
        { label: 'Certifications', value: 'WaterSense, ADA, cUPC' },
        { label: 'Lead time', value: '2–3 weeks' },
      ];
    }
    if (cat.includes('floor') || cat.includes('tile')) {
      return [
        { label: 'Brand', value: 'Shaw Floors' },
        { label: 'Collection', value: 'Natural Classics' },
        { label: 'Material', value: 'Solid hardwood — White Oak' },
        { label: 'Finish', value: 'Wire-brushed, matte' },
        { label: 'Plank size', value: '5" × 3/4"' },
        { label: 'Coverage', value: '24.5 sq ft per box' },
        { label: 'Janka hardness', value: '1,360' },
        { label: 'Installation', value: 'Nail-down or glue' },
        { label: 'Warranty', value: '50-year residential' },
        { label: 'Lead time', value: '3–4 weeks' },
      ];
    }
    if (cat.includes('light')) {
      return [
        { label: 'Brand', value: 'Visual Comfort' },
        { label: 'Model number', value: 'CHC-1610-AI' },
        { label: 'Finish', value: 'Aged iron' },
        { label: 'Dimensions', value: '24"W × 28"H' },
        { label: 'Bulb type', value: '6 × E26 / max 60W' },
        { label: 'Bulbs included', value: 'No' },
        { label: 'Damp rated', value: 'Yes (covered outdoor)' },
        { label: 'Voltage', value: '120V' },
        { label: 'Dimmable', value: 'Yes — TRIAC compatible' },
        { label: 'Lead time', value: '4–6 weeks' },
      ];
    }
    if (cat.includes('kitchen') || cat.includes('cabinet') || cat.includes('appliance')) {
      return [
        { label: 'Brand', value: 'Bosch' },
        { label: 'Model number', value: 'SHP65CM5N' },
        { label: 'Series', value: '500 Series' },
        { label: 'Color', value: 'Stainless steel' },
        { label: 'Dimensions', value: '23.56"W × 33.875"H × 23.75"D' },
        { label: 'Capacity', value: '16 place settings' },
        { label: 'Energy use', value: '269 kWh/yr — Energy Star' },
        { label: 'Decibel rating', value: '44 dBA' },
        { label: 'Warranty', value: '1-year full / 2-year limited' },
        { label: 'Lead time', value: '1–2 weeks' },
      ];
    }
    if (cat.includes('paint') || cat.includes('interior')) {
      return [
        { label: 'Brand', value: 'Benjamin Moore' },
        { label: 'Product line', value: 'Aura — interior' },
        { label: 'Color code', value: 'OC-117 Simply White' },
        { label: 'Sheen', value: 'Eggshell' },
        { label: 'Coverage', value: '350–400 sq ft per gallon' },
        { label: 'VOC', value: '< 50 g/L' },
        { label: 'Dry to touch', value: '1 hour' },
        { label: 'Recoat', value: '4 hours' },
        { label: 'Cleanup', value: 'Soap and water' },
      ];
    }
    return [
      { label: 'Brand', value: '—' },
      { label: 'Model number', value: '—' },
      { label: 'Material', value: '—' },
      { label: 'Finish', value: '—' },
      { label: 'Dimensions', value: '—' },
      { label: 'Warranty', value: '—' },
    ];
  };
  const [specs, setSpecs] = useState(seedSpecs);

  return (
    <div className="jps-page">
      {/* Header */}
      <div className="pg-hdr">
        <div className="pg-accent"></div>
        <div className="pg-hdr-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div className="pg-hdr-sub">Amy - selections test job &bull; Selection Option</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="pg-title">{isViewing ? title : 'Add Option'}</span>
                <span className={`sp-badge ${optionStatus === 'approved' ? 'sp-badge-success' : optionStatus === 'pending' ? 'sp-badge-warning' : 'sp-badge-default'}`}>
                  {optionStatus === 'approved' ? 'Approved' : optionStatus === 'pending' ? 'Pending' : 'Draft'}
                </span>
              </div>
              <button className="od-back-link" onClick={onBack}>&larr; Back</button>
            </div>
          </div>
          <div className="pg-hdr-right" style={{ gap: 8 }}>
            {isPending && optionStatus === 'pending' && (
              <>
                <button className="btn btn-danger" onClick={() => setOptionStatus('declined')}>Decline</button>
                <button className="btn btn-success" onClick={() => setOptionStatus('approved')}>Approve</button>
              </>
            )}
            <button className="btn btn-s" onClick={onBack}>{isViewing ? 'Close' : 'Cancel'}</button>
            <div className="od-split-btn">
              <button className="od-split-main">Save</button>
              <button className="od-split-caret">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5.5L7 9.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="od-body">
        <div className="od-content">

          {/* Details + Specs/Images */}
          <div className="od-two-col">
            {/* Left: Details */}
            <div>
              <h3 className="od-section-title">Details</h3>

              <div className="od-field">
                <label className="fl">Title <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="fi" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="od-field">
                <label className="fl">Description</label>
                <textarea className="fi" rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>

              <div className="od-field">
                <label className="fl">Allowance</label>
                <select className="fi" value={allowance} onChange={e => setAllowance(e.target.value)}>
                  <option value="None">None</option>
                  {INVOICE_SELECTION_SCENARIOS.map(ma => (
                    <option key={ma.id} value={ma.name}>{ma.name}</option>
                  ))}
                </select>
              </div>

              <div className="od-field-row">
                <div className="od-field" style={{ flex: 1 }}>
                  <label className="fl">Category</label>
                  <div className="od-field-with-actions">
                    <select className="fi" value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="None">None</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Bathroom">Bathroom</option>
                      <option value="Flooring">Flooring</option>
                      <option value="Lighting">Lighting</option>
                      <option value="Interior">Interior</option>
                      <option value="Exterior">Exterior</option>
                    </select>
                    <button className="od-field-action" title="Add">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <button className="od-field-action" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L12 2L14 4L4.5 13.5L2 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
                <div className="od-field" style={{ flex: 1 }}>
                  <label className="fl">Location</label>
                  <div className="od-field-with-actions">
                    <select className="fi" value={location} onChange={e => setLocation(e.target.value)}>
                      <option value="None">None</option>
                      <option value="Main floor">Main floor</option>
                      <option value="Upper floor">Upper floor</option>
                      <option value="Basement">Basement</option>
                    </select>
                    <button className="od-field-action" title="Add">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <button className="od-field-action" title="Edit">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L12 2L14 4L4.5 13.5L2 14Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="od-field">
                <label className="fl">Product URL</label>
                <div className="od-field-with-actions">
                  <input className="fi" value={productUrl} onChange={e => setProductUrl(e.target.value)} />
                  <button className="od-field-action" title="Open link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3H3V13H13V10M9 3H13V7M13 3L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Specs + Images */}
            <div>
              <h3 className="od-section-title">Specs</h3>
              {specs.length === 0 ? (
                <p className="od-placeholder-text">Save to add specs</p>
              ) : (
                <div style={{
                  border: '1px solid var(--g200)', borderRadius: 'var(--radius)',
                  overflow: 'hidden', marginBottom: 12, background: 'white',
                }}>
                  {specs.map((s, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '40% 1fr 32px',
                      borderBottom: i === specs.length - 1 ? 'none' : '1px solid var(--g100)',
                      alignItems: 'stretch',
                    }}>
                      <input
                        value={s.label}
                        onChange={e => {
                          const next = [...specs];
                          next[i] = { ...next[i], label: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Label"
                        style={{
                          padding: '8px 10px', fontSize: 13, fontWeight: 500,
                          color: 'var(--g700)', border: 'none', background: 'var(--g50)',
                          borderRight: '1px solid var(--g100)', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      />
                      <input
                        value={s.value}
                        onChange={e => {
                          const next = [...specs];
                          next[i] = { ...next[i], value: e.target.value };
                          setSpecs(next);
                        }}
                        placeholder="Value"
                        style={{
                          padding: '8px 10px', fontSize: 13,
                          color: 'var(--g800)', border: 'none', background: 'white',
                          fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                        title="Remove"
                        style={{
                          padding: 0, border: 'none', background: 'white',
                          color: 'var(--g400)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderLeft: '1px solid var(--g100)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="btn btn-s"
                onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                style={{ gap: 4 }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Add spec
              </button>

              <h3 className="od-section-title" style={{ marginTop: 24 }}>Images and attachments</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-s">Add</button>
                <button className="btn btn-s">Create new doc</button>
              </div>
            </div>
          </div>

          <hr className="od-divider" />

          {/* Price Details */}
          <h3 className="od-section-title">Price details</h3>
          <div className="od-price-toolbar">
            <button className="btn btn-s" style={{ gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Checked actions
            </button>
            <button className="btn btn-s">Add from catalog</button>
          </div>
          <div className="od-price-table-wrap">

            <div className="od-price-scroll">
              <table className="od-price-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <div className="od-checkbox" />
                    </th>
                    <th>Items</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Unit cost</th>
                    <th>Cost type</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, i) => {
                    const update = (field: string, value: string) => {
                      const next = [...lineItems];
                      (next[i] as any)[field] = value;
                      setLineItems(next);
                    };
                    return (
                      <tr key={i} className="od-edit-row">
                        <td><div className="od-checkbox" /></td>
                        <td>
                          <label className="fl">Title</label>
                          <input className="fi" value={li.title} onChange={e => update('title', e.target.value)} />
                        </td>
                        <td>
                          <label className="fl">Description</label>
                          <textarea className="fi" rows={2} value={li.description} onChange={e => update('description', e.target.value)} style={{ resize: 'vertical' }} />
                        </td>
                        <td>
                          <label className="fl">Quantity</label>
                          <input className="fi" value={li.quantity} onChange={e => update('quantity', e.target.value)} />
                        </td>
                        <td>
                          <label className="fl">Unit</label>
                          <input className="fi" value={li.unit} onChange={e => update('unit', e.target.value)} />
                        </td>
                        <td>
                          <label className="fl">Unit cost</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--g400)', fontSize: 13 }}>$</span>
                            <input className="fi" value={li.unitCost} onChange={e => update('unitCost', e.target.value)} />
                          </div>
                        </td>
                        <td>
                          <label className="fl">Cost type</label>
                          <select className="fi" value={li.costType} onChange={e => update('costType', e.target.value)}>
                            <option value="None">None</option>
                            <option value="Material">Material</option>
                            <option value="Labor">Labor</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {lineItems.map((li, i) => {
                    const showError = li.touched && !li.costCode;
                    return (
                      <tr key={`cc-${i}`} className="od-edit-row">
                        <td></td>
                        <td colSpan={6}>
                          <label className="fl">Cost code <span style={{ color: 'var(--red)' }}>*</span></label>
                          <select
                            className={`fi ${showError ? 'od-field-error' : ''}`}
                            style={{ maxWidth: 240 }}
                            value={li.costCode}
                            onChange={e => { const next = [...lineItems]; next[i].costCode = e.target.value; setLineItems(next); }}
                            onBlur={() => { const next = [...lineItems]; next[i].touched = true; setLineItems(next); }}
                          >
                            <option value=""></option>
                            <option value="1110">1110 - Blueprints</option>
                            <option value="15.20">15.20 - Tile Materials</option>
                            <option value="12.20">12.20 - Cabinets</option>
                          </select>
                          {showError && <span className="od-error-msg">Required</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={7}>
                      <button className="btn-g" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0' }} onClick={() => setLineItems([...lineItems, { title: '', description: '', quantity: '1.0000', unit: '', unitCost: '0.0000', costType: 'None', costCode: '', touched: false }])}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: 'var(--bt-blue)', color: 'white', fontSize: 12, fontWeight: 700 }}>+</span>
                        Item
                      </button>
                    </td>
                  </tr>
                  <tr className="od-totals-row">
                    <td colSpan={7}><strong>Totals</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
          <div className="od-price-footer">
            <div><strong>Total price: {lineItems.reduce((s, li) => s + (parseFloat(li.unitCost) || 0) * (parseFloat(li.quantity) || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</strong></div>
            <a href="#" className="btn-g">See full price breakdown</a>
          </div>

        </div>
      </div>
    </div>
  );
}
