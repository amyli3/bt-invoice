import { useState } from 'react';

interface SelectionData {
  name: string;
  category: string;
  price: number;
  allowanceName?: string;
  status: string;
}

interface Props {
  onBack: () => void;
  isNew?: boolean;
  selectionData?: SelectionData | null;
}

export default function OptionDetailPage({ onBack, isNew = true, selectionData }: Props) {
  const isViewing = !!selectionData;
  const isPending = selectionData?.status === 'pending';
  const [title, setTitle] = useState(selectionData?.name || '');
  const [description, setDescription] = useState('');
  const [allowance, setAllowance] = useState(selectionData?.allowanceName || 'None');
  const [category, setCategory] = useState(selectionData?.category || 'None');
  const [location, setLocation] = useState('None');
  const [productUrl, setProductUrl] = useState('');
  const [optionStatus, setOptionStatus] = useState(selectionData?.status || 'draft');

  const [lineItems, setLineItems] = useState<{ title: string; description: string; quantity: string; unit: string; unitCost: string; costType: string; costCode: string; touched: boolean }[]>(
    selectionData ? [{ title: selectionData.name, description: '', quantity: '1.0000', unit: '', unitCost: selectionData.price.toFixed(4), costType: 'Material', costCode: '', touched: false }] : []
  );

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
                  <option value="Tiles">Tiles</option>
                  <option value="Cabinets">Cabinets</option>
                  <option value="Kitchen allowance">Kitchen allowance</option>
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
              <p className="od-placeholder-text">Save to add specs</p>

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
