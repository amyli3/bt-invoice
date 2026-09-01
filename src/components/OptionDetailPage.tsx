import { useState } from 'react';
import { INVOICE_SELECTION_SCENARIOS } from '../selectionsData';
import { JOB_SCHEDULE_ITEMS } from '../mockData';

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

// Mock schedule items for the prototype. Real data comes from the project's schedule.
const SCHEDULE_ITEMS = JOB_SCHEDULE_ITEMS;

function computeAutoDueDate(
  itemId: string,
  offsetDays: number,
  direction: 'before' | 'after',
  anchor: 'start' | 'end'
): string {
  const item = SCHEDULE_ITEMS.find(s => s.id === itemId);
  if (!item) return '';
  const base = new Date((anchor === 'start' ? item.start : item.end) + 'T00:00:00');
  base.setDate(base.getDate() + (direction === 'before' ? -offsetDays : offsetDays));
  return base.toISOString().split('T')[0];
}

function formatLongDate(d: string): string {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(optionStatus: string, dueDate: string): {
  label: string;
  className: string;
} {
  if (optionStatus === 'approved') return { label: 'Approved', className: 'sp-badge-success' };
  if (optionStatus === 'declined') return { label: 'Declined', className: 'sp-badge-danger' };
  if (optionStatus === 'draft') return { label: 'Draft', className: 'sp-badge-default' };
  // Pending — derive from due date
  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Overdue', className: 'sp-badge-danger' };
    if (diffDays <= 7) return { label: 'Due soon', className: 'sp-badge-warning' };
  }
  return { label: 'Pending', className: 'sp-badge-warning' };
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
  const [dueDate, setDueDate] = useState('');
  const [linkedScheduleId, setLinkedScheduleId] = useState('');
  const [offsetDays, setOffsetDays] = useState('5');
  const [offsetDirection, setOffsetDirection] = useState<'before' | 'after'>('before');
  const [offsetAnchor, setOffsetAnchor] = useState<'start' | 'end'>('start');
  const [optionStatus, setOptionStatus] = useState(selectionData?.status || 'draft');

  const isLinkedToSchedule = !!linkedScheduleId;
  const autoDueDate = isLinkedToSchedule
    ? computeAutoDueDate(linkedScheduleId, parseInt(offsetDays) || 0, offsetDirection, offsetAnchor)
    : '';

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
  const [slice, setSlice] = useState<1 | 2 | 3 | 4>(1);

  // Image mode: 'single' is the ticket-scoped version (one product-URL image,
  // display + delete, no carousel / no add-more). 'multi' adds the gallery +
  // add-image extension. Toggle lets reviewers compare both.
  const [imageMode, setImageMode] = useState<'single' | 'multi'>('single');

  // ADO 277207 — AI autofill returns a product image hotlink. The form displays
  // it, shows an add affordance when there's none, and lets the builder remove
  // the autofilled image (local state only) while autofilled + in create state.
  // Beyond the ticket, builders can add more images of their own; those are
  // always removable. Each image tracks its source so the autofill delete-gating
  // from the AC stays intact.
  const sampleAutofillImage = (): string => {
    const cat = (selectionData?.category || inferCategory(selectionData?.name || '')).toLowerCase();
    if (cat.includes('floor') || cat.includes('tile')) {
      return 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg';
    }
    if (cat.includes('light')) return 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg';
    return 'https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg';
  };
  // Stand-in pool for builder-added images so additional adds show distinct photos.
  const ADDED_IMAGE_POOL = [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQp_5oxh0J8UiRFoPUZjhkoDNurftH-7n96IQ&s',
    'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg',
    'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg',
  ];

  type OptionImage = { url: string; source: 'autofill' | 'added' };

  // Prototype harness: simulate the autofill-create state so all AC states are
  // viewable. `isAutofilled` + create state (!isViewing) gate the delete button.
  const [isAutofilled] = useState(true);
  const [images, setImages] = useState<OptionImage[]>([{ url: sampleAutofillImage(), source: 'autofill' }]);
  const [heroIdx, setHeroIdx] = useState(0);
  const safeHeroIdx = Math.min(heroIdx, Math.max(0, images.length - 1));

  const effectiveDueDate = (slice === 2 && isLinkedToSchedule) ? autoDueDate : dueDate;
  const statusBadge = getStatusBadge(optionStatus, effectiveDueDate);

  const isAutofillCreate = isAutofilled && !isViewing;
  // Per AC: the autofilled image is removable only while autofilled + creating.
  // Builder-added images are always removable. No API call — local state only.
  const canRemoveImage = (img: OptionImage) =>
    img.source === 'added' || (img.source === 'autofill' && isAutofillCreate);
  const removeImage = (i: number) => {
    const next = images.filter((_, j) => j !== i);
    setImages(next);
    if (heroIdx >= next.length) setHeroIdx(Math.max(0, next.length - 1));
  };
  const addImage = () => {
    const url = ADDED_IMAGE_POOL[images.filter(im => im.source === 'added').length % ADDED_IMAGE_POOL.length];
    setImages([...images, { url, source: 'added' }]);
    setHeroIdx(images.length);
  };

  const hero = images[safeHeroIdx];
  const hasImages = images.length > 0;

  const isMulti = imageMode === 'multi';

  const imageGallery = (
    <div className="od-gallery">
      {hasImages && (
        <div
          className="od-gallery-hero"
          style={{ backgroundImage: `url(${hero.url})` }}
        >
          {canRemoveImage(hero) && (
            <button
              type="button"
              className="od-gallery-delete"
              onClick={() => removeImage(safeHeroIdx)}
              aria-label="Remove image"
              title="Remove image"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 4h11M6 4V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4M12.5 4l-.5 8.4a1 1 0 0 1-1 .95H5a1 1 0 0 1-1-.95L3.5 4M6.5 6.7v4M9.5 6.7v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Multi mode only — thumbnail strip + add-more. Single mode keeps just the
          one product-URL image with its delete control. */}
      {isMulti && (
        <>
          {images.length > 1 && (
            <div className="od-gallery-thumbs">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`od-gallery-thumb${i === safeHeroIdx ? ' od-gallery-thumb-active' : ''}`}
                  style={{ backgroundImage: `url(${img.url})` }}
                  onClick={() => setHeroIdx(i)}
                  title={img.source === 'autofill' ? 'Autofilled image' : 'Added image'}
                >
                  {canRemoveImage(img) && (
                    <button
                      type="button"
                      className="od-gallery-thumb-remove"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      aria-label="Remove image"
                    >
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-s" onClick={addImage} style={{ gap: 4, marginTop: hasImages ? 10 : 0 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add image
          </button>
        </>
      )}

      {/* Single mode — when there's no image, still let the builder add the one
          product image (not "more"). */}
      {!isMulti && !hasImages && (
        <button className="btn btn-s" onClick={addImage} style={{ gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add image
        </button>
      )}
    </div>
  );

  // Whole image section incl. heading. In single mode the section only exists to
  // show the autofilled image, so it hides entirely when there's none (the
  // Product URL field itself lives separately and still shows). Multi mode keeps
  // the section visible for its add-image affordance.
  const imageSection = (!isMulti && !hasImages) ? null : (
    <>
      <label className="fl">Product URL image</label>
      {imageGallery}
    </>
  );

  // Attachments. In single mode (no separate image gallery section to add to),
  // this reverts to the original combined "Images and attachments" title.
  const attachmentsBlock = (
    <>
      <h3 className="od-section-title" style={{ marginTop: 24 }}>
        {isMulti ? 'Attachments' : 'Images and attachments'}
      </h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className="btn btn-s">Add</button>
        <button className="btn btn-s">Create new doc</button>
      </div>
    </>
  );

  // Due-date section, reused across layouts (depends on slice state).
  const dueDateBlock = (
    <>
      <h3 className="od-section-title">Due date</h3>
      {slice === 2 && (
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`tab${!isLinkedToSchedule ? ' on' : ''}`}
            onClick={() => setLinkedScheduleId('')}
          >
            Due date
          </button>
          <button
            type="button"
            className={`tab${isLinkedToSchedule ? ' on' : ''}`}
            onClick={() => {
              if (!isLinkedToSchedule) setLinkedScheduleId(SCHEDULE_ITEMS[0].id);
            }}
          >
            Link to schedule item
          </button>
        </div>
      )}
      {(slice === 1 || !isLinkedToSchedule) ? (
        <div className="od-field">
          <label className="fl">Due date</label>
          <input
            type="date"
            className="fi"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </div>
      ) : (
        <>
          <div className="od-field">
            <label className="fl">Schedule item</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <select
                className="fi"
                value={linkedScheduleId}
                onChange={e => setLinkedScheduleId(e.target.value)}
                style={{ maxWidth: 320, flex: '1 1 220px' }}
              >
                {SCHEDULE_ITEMS.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <button type="button" className="btn-g" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Add</button>
              <button type="button" className="btn-g" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Edit</button>
            </div>
          </div>
          <div className="od-field" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {(() => {
              const item = SCHEDULE_ITEMS.find(s => s.id === linkedScheduleId);
              return (
                <>
                  <div>
                    <label className="fl">Schedule date</label>
                    {item && (
                      <div className="tabs">
                        <button
                          type="button"
                          className={`tab${offsetAnchor === 'start' ? ' on' : ''}`}
                          onClick={() => setOffsetAnchor('start')}
                        >
                          {formatLongDate(item.start)}
                        </button>
                        <button
                          type="button"
                          className={`tab${offsetAnchor === 'end' ? ' on' : ''}`}
                          onClick={() => setOffsetAnchor('end')}
                        >
                          {formatLongDate(item.end)}
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="fl">Offset</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        className="fi"
                        type="number"
                        min={0}
                        value={offsetDays}
                        onChange={e => setOffsetDays(e.target.value)}
                        style={{ width: 56 }}
                      />
                      <select
                        className="fi"
                        value={offsetDirection}
                        onChange={e => setOffsetDirection(e.target.value as 'before' | 'after')}
                        style={{ width: 140 }}
                      >
                        <option value="before">days before</option>
                        <option value="after">days after</option>
                      </select>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="od-field">
            <label className="fl">Due date</label>
            <div style={{ padding: '8px 0', fontSize: 14, color: 'var(--g700)', fontWeight: 500 }}>
              {formatLongDate(autoDueDate)}
            </div>
          </div>
        </>
      )}
    </>
  );

  // Specs section, reused across layouts.
  const specsBlock = (
    <>
      <h3 className="od-section-title" style={{ marginTop: 24 }}>Specs</h3>
      {specs.length === 0 ? null : (
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
    </>
  );

  // Details fields (left column), reused across layouts.
  const detailsBlock = (
    <>
      <h3 className="od-section-title">Details</h3>

      <div className="od-field-row">
        <div className="od-field" style={{ flex: 2 }}>
          <label className="fl">Title <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="fi" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        {/* Slice 1 shows the due date inline with the Title. Slice 2 moves it to
            the bottom section, so it's hidden here. */}
        {slice !== 2 && (
          <div className="od-field" style={{ flex: 1 }}>
            <label className="fl">Due date</label>
            <input
              type="date"
              className="fi"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        )}
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
    </>
  );

  // Product URL — drives AI autofill, so it sits in the right column directly
  // above the Image it generates.
  const productUrlBlock = (
    <div className="od-field">
      <label className="fl">Product URL</label>
      <div className="od-field-with-actions">
        <input className="fi" value={productUrl} onChange={e => setProductUrl(e.target.value)} />
        <button className="od-field-action" title="Open link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3H3V13H13V10M9 3H13V7M13 3L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );

  // Slice 3 / 4 — email notification mocks. Fixed offsets keep the prototype
  // readable regardless of today's date.
  const isEmailSlice = slice === 3 || slice === 4;
  const isOverdueEmail = slice === 3;
  const emailDayOffset = isOverdueEmail ? 5 : 3;
  const emailDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (isOverdueEmail ? -emailDayOffset : emailDayOffset));
    return d.toISOString().slice(0, 10);
  })();
  const emailHeadline = isOverdueEmail ? 'Selection overdue' : 'Selection due soon';
  const emailBody = isOverdueEmail
    ? `is ${emailDayOffset} days overdue. Make your choice to keep the project on schedule.`
    : `is due in ${emailDayOffset} days. Make your choice to keep the project on schedule.`;
  const emailDaysLabel = isOverdueEmail ? 'Days overdue' : 'Days remaining';
  const emailDaysValue = `${emailDayOffset} days`;
  const emailSelectionTitle = title || 'Kitchen faucet';
  const emailJobName = 'Amy - selections test job';
  const emailAllowance = allowance && allowance !== 'None' ? allowance : 'Plumbing fixtures';
  const emailTotalPrice = lineItems.reduce(
    (s, li) => s + (parseFloat(li.unitCost) || 0) * (parseFloat(li.quantity) || 0),
    0
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="pg-title">{isViewing ? title : 'Add Option'}</span>
                <span className={`sp-badge ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              </div>
              <button className="od-back-link" onClick={onBack}>&larr; Back</button>
            </div>
          </div>
          <div className="pg-hdr-right" style={{ gap: 8 }}>
            <div className="tabs" style={{ marginRight: 4 }}>
              <button type="button" className={`tab${slice === 1 ? ' on' : ''}`} onClick={() => setSlice(1)}>Slice 1</button>
              <button type="button" className={`tab${slice === 2 ? ' on' : ''}`} onClick={() => setSlice(2)}>Slice 2</button>
              <button type="button" className={`tab${slice === 3 ? ' on' : ''}`} onClick={() => setSlice(3)}>Slice 3</button>
              <button type="button" className={`tab${slice === 4 ? ' on' : ''}`} onClick={() => setSlice(4)}>Slice 4</button>
            </div>
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

          {isEmailSlice && (
            <div style={{
              background: 'var(--g50, #F5F6F8)',
              padding: '32px 24px',
              borderRadius: 'var(--radius)',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{
                background: 'white',
                width: '100%',
                maxWidth: 600,
                borderRadius: 6,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                fontFamily: 'inherit',
              }}>
                {/* Email body */}
                <div style={{ padding: '32px 40px 24px' }}>
                  {/* Logo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="14" stroke="#00B4D8" strokeWidth="2" fill="none" />
                      <path d="M11 9h7a4 4 0 0 1 0 8h-7V9zm0 8h8a4 4 0 0 1 0 8h-8v-8z" fill="#0B1F3A" />
                    </svg>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#0B1F3A', letterSpacing: -0.2 }}>Buildertrend</span>
                  </div>

                  <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0B1F3A', margin: '0 0 20px' }}>
                    {emailHeadline}
                  </h1>

                  <p style={{ fontSize: 15, color: '#1F2937', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Hi Sadie,
                  </p>

                  <p style={{ fontSize: 15, color: '#1F2937', margin: '0 0 24px', lineHeight: 1.5 }}>
                    The selection <strong>{emailSelectionTitle}</strong> for <strong>{emailJobName}</strong> {emailBody}
                  </p>

                  {/* Details card */}
                  <div style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    padding: '20px 24px',
                    marginBottom: 24,
                  }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0B1F3A',
                      paddingBottom: 12,
                      marginBottom: 12,
                      borderBottom: '1px solid #E5E7EB',
                    }}>
                      Selection
                    </div>
                    {[
                      { label: 'Title', value: emailSelectionTitle },
                      { label: 'Allowance', value: emailAllowance },
                      { label: 'Due date', value: formatLongDate(emailDueDate) },
                      { label: emailDaysLabel, value: emailDaysValue },
                      ...(emailTotalPrice > 0 ? [{
                        label: 'Price',
                        value: emailTotalPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
                      }] : []),
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', padding: '6px 0', fontSize: 14 }}>
                        <div style={{ width: 160, fontWeight: 600, color: '#1F2937' }}>{row.label}</div>
                        <div style={{ flex: 1, color: '#1F2937' }}>{row.value}</div>
                      </div>
                    ))}
                    <button
                      type="button"
                      style={{
                        marginTop: 16,
                        background: '#1357DF',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Make selection
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 1.5, margin: '0 0 8px' }}>
                    You received this email because Brothers Grimm Construction Company uses Buildertrend for project communication and you are following this feature in your notification preferences. If you need help, visit our FAQs or contact us.
                  </p>
                </div>

                {/* Footer */}
                <div style={{
                  background: '#EEF1F6',
                  padding: '24px 40px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="16" cy="16" r="14" stroke="#00B4D8" strokeWidth="2" fill="none" />
                      <path d="M11 9h7a4 4 0 0 1 0 8h-7V9zm0 8h8a4 4 0 0 1 0 8h-8v-8z" fill="#0B1F3A" />
                    </svg>
                    <div style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>Buildertrend Solutions</div>
                      <div>11818 I Street</div>
                      <div>Omaha, NE, 68137 U.S.</div>
                      <div>(886) 584-2038</div>
                    </div>
                  </div>
                  <a href="#" style={{ fontSize: 13, color: '#0B1F3A', textDecoration: 'underline', fontWeight: 600 }}>Contact us</a>
                </div>
                <div style={{
                  background: '#EEF1F6',
                  borderTop: '1px solid #D6DCE5',
                  padding: '14px 40px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <a href="#" style={{ color: '#0B1F3A', textDecoration: 'underline' }}>Privacy Policy</a>
                  <a href="#" style={{ color: '#0B1F3A', textDecoration: 'underline' }}>Change notification preferences</a>
                  <a href="#" style={{ color: '#0B1F3A', textDecoration: 'underline' }}>Unsubscribe</a>
                </div>
              </div>
            </div>
          )}

          {!isEmailSlice && (<>

          {/* Prototype controls — image mode toggle. ADO 277207. Not shipped UI. */}
          <div className="od-layout-switch">
            <span className="od-layout-switch-label">Image mode</span>
            <div className="tabs">
              <button type="button" className={`tab${imageMode === 'multi' ? ' on' : ''}`} onClick={() => setImageMode('multi')}>Carousel + add more</button>
              <button type="button" className={`tab${imageMode === 'single' ? ' on' : ''}`} onClick={() => setImageMode('single')}>Single image only</button>
            </div>
          </div>

          {/* Left: identity fields + Product URL at the bottom. Right: image on
              top, then Attachments + Specs. */}
          <div className="od-two-col">
            <div>
              {detailsBlock}
              {productUrlBlock}
              {/* Slice 2 — schedule-linked due date sits below Product URL, with
                  Specs beneath it. Slice 1 keeps the due date inline with the
                  Title and Specs follows directly. */}
              {slice === 2 && dueDateBlock}
              {specsBlock}
            </div>
            <div>
              {imageSection}
              {attachmentsBlock}
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

          </>)}

        </div>
      </div>
    </div>
  );
}
