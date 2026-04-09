import { useState, useCallback } from 'react';

/* ── Mock data ── */
const selectionGroups = [
  {
    id: 'sel-1', name: 'Kitchen allowance', allowance: 500, dueDate: '2026-04-10', status: 'action_needed' as const,
    description: 'Choose your kitchen sink, faucet, dishwasher, countertop, and backsplash. Your builder has pre-selected options within your budget.',
    options: [
      { id: 'o1', name: 'Kohler Elmbrook Farmhouse Sink', vendor: 'Kohler', price: 2160, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', images: ['https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', 'https://images.thdstatic.com/productImages/ee9fa0be-2001-480b-852c-bc1cd926941c/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-77_600.jpg', 'https://photos-us.bazaarvoice.com/photo/2/cGhvdG86aG9tZWRlcG90/dca91f51-7570-55e9-9033-b407853daf71'], selected: false, group: 'Sink', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/KOHLER-Elmbrook-Cast-Iron-33-in-Single-Bowl-Farmhouse-Apron-Front-Kitchen-Sink-in-White-K-28668-0/316246054' },
      { id: 'o1b', name: 'Kraus Bellucci Undermount Sink', vendor: 'Kraus', price: 1890, image: 'https://images.thdstatic.com/productImages/fe4a0711-acbe-565f-bafa-1c99f5efca67/svn/metallic-black-kraus-undermount-kitchen-sinks-kguw2-33mbl-e1_600.jpg', selected: false, group: 'Sink', tier: 'base' as const, url: 'https://www.homedepot.com/p/KRAUS-Bellucci-White-Granite-Composite-32-in-Single-Bowl-Undermount-Workstation-Kitchen-Sink-with-WasteGuard-Garbage-Disposal-KGUW1-33WH-100-75MB/319044830' },
      { id: 'o2', name: 'Delta Kylo Touchless Faucet — Black', vendor: 'Delta', price: 780, image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', images: ['https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', 'https://mobileimages.lowes.com/productimages/aaa2b119-847d-4b26-9417-06db97eabd42/68533231.jpeg'], selected: false, group: 'Faucet', tier: 'upgrade' as const, url: 'https://www.lowes.com/pd/Delta-Kylo-Matte-Black-Single-Handle-Pull-down-Touchless-Kitchen-Faucet-with-Sprayer-Deck-Plate-Included/5015280915' },
      { id: 'o2b', name: 'Moen Arbor MotionSense — Stainless', vendor: 'Moen', price: 650, image: 'https://images.thdstatic.com/productImages/147e2f7b-38ca-4270-94a1-816a9ebba445/svn/spot-resist-stainless-steel-moen-bar-faucets-5995srs-64_600.jpg', selected: false, group: 'Faucet', tier: 'base' as const, url: 'https://www.homedepot.com/p/MOEN-Arbor-Single-Handle-Pull-Down-Sprayer-Kitchen-Faucet-with-Power-Boost-in-Spot-Resist-Stainless-7594SRS/204725308' },
      { id: 'o3', name: 'GE Profile Dishwasher', vendor: 'GE Appliances', price: 1079, image: 'https://photos-us.bazaarvoice.com/photo/2/cGhvdG86Z2VfYXBwbGlhbmNlcw/a5145a5a-4744-57ed-90cf-cc641b9178cd', selected: false, group: 'Dishwasher', tier: 'base' as const, url: 'https://www.homedepot.com/p/GE-Profile-24-in-Smart-Built-In-Top-Control-45-dBA-Fingerprint-Resistant-Stainless-Dishwasher-with-Microban-Technology-PDT705SYWFS/331066211' },
      { id: 'o4', name: 'Bosch 500 Series Dishwasher', vendor: 'Bosch', price: 1349, image: 'https://us.bosch-press.com/pressportal/us/media/dam_images_us/pi266_usus/shp65dm5n_lifestyleimage_1_master.jpg', selected: false, group: 'Dishwasher', tier: 'upgrade' as const, url: 'https://www.homedepot.com/p/Bosch-500-Series-24-in-Stainless-Steel-Top-Control-Tall-Tub-Pocket-Handle-Dishwasher-with-Stainless-Steel-Tub-Quiet-44-dBA-SHP65CM5N/325602597' },
      { id: 'o4b', name: 'Quartz Countertop — Calacatta Laza', vendor: 'MSI', price: 3200, image: 'https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/large/calacatta-laza-quartz-4.jpg', selected: false, group: 'Countertop', tier: 'upgrade' as const },
      { id: 'o4c', name: 'Granite Countertop — White Ice', vendor: 'MSI', price: 2800, image: 'https://cabinetmakerwarehouse.com/cdn/shop/files/Formica-9476-White-Ice-Granite-Traditiona-Kitchen-scaled.jpg?v=1717089142&width=1080', selected: false, group: 'Countertop', tier: 'base' as const },
      { id: 'o4d', name: 'Marble Hexagon Backsplash', vendor: 'TileBar', price: 950, image: 'https://www.tileclub.com/cdn/shop/files/carrara-hexagon-tile-backsplash-2.jpg?v=1723504600', selected: false, group: 'Backsplash', tier: 'upgrade' as const },
      { id: 'o4e', name: 'White Subway Tile Backsplash', vendor: 'Merola Tile', price: 620, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Backsplash', tier: 'base' as const },
    ],
  },
  {
    id: 'sel-2', name: 'Main floor flooring', allowance: 0, dueDate: '2026-04-05', status: 'overdue' as const,
    description: 'Select your flooring for the living room, hallway, and dining area. 800 sq ft total.',
    options: [
      { id: 'o5', name: 'Shaw Natural Classics — White Oak', vendor: 'Shaw Floors', price: 5800, image: 'https://shawfloors.widen.net/content/maw31txwtx/jpeg/sw774_01147_main', selected: false, group: 'Flooring', tier: 'upgrade' as const },
      { id: 'o6', name: 'Lifeproof Vinyl Plank — Dusk Cherry', vendor: 'Lifeproof', price: 3200, image: 'https://images.thdstatic.com/productImages/eb9b442d-4536-470d-81e4-f1bea67caf9d/svn/dusk-cherry-lifeproof-vinyl-plank-flooring-i06204lp-64_600.jpg', selected: false, group: 'Flooring', tier: 'base' as const },
      { id: 'o6b', name: 'TrafficMaster Laminate — Lakeshore Pecan', vendor: 'TrafficMaster', price: 2400, image: 'https://images.thdstatic.com/productImages/a08ca173-0a82-4dbe-90fb-7bdd3e8309a7/svn/lakeshore-pecan-stone-trafficmaster-laminate-wood-flooring-50560-77_600.jpg', selected: false, group: 'Flooring', tier: 'base' as const },
      { id: 'o6c', name: 'Bruce Solid Hardwood — Butterscotch Oak', vendor: 'Bruce', price: 5800, image: 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg', selected: false, group: 'Flooring', tier: 'upgrade' as const },
    ],
  },
  {
    id: 'sel-3', name: 'Master bathroom allowance', allowance: 300, dueDate: '2026-04-20', status: 'pending' as const,
    description: 'Choose tile, vanity, fixtures, and mirror for the master bathroom.',
    options: [
      { id: 'o7', name: 'Carrara White Marble Floor Tile', vendor: 'TileBar', price: 2800, image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGYKPyoe2Rzl-1bS94z9jjJrgknQCps5Ce5qwPPfI0-R7MOIqopooLat3pDoWs2LmGHx0WEc3lGD93Gy0TnSnoFvsEsSami58-o4SCkcg0n9cgZLY_fdtC4w', selected: false, group: 'Floor tile', tier: 'upgrade' as const },
      { id: 'o8a', name: 'Porcelain Hex Tile — White', vendor: 'Merola Tile', price: 2200, image: 'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg', selected: false, group: 'Floor tile', tier: 'base' as const },
      { id: 'o8', name: 'Glossy White Subway Tile', vendor: 'Merola Tile', price: 1200, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', selected: false, group: 'Shower tile', tier: 'base' as const },
      { id: 'o8b', name: 'Herringbone Marble Mosaic', vendor: 'TileBar', price: 1800, image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg', selected: false, group: 'Shower tile', tier: 'upgrade' as const },
      { id: 'o8e', name: 'Arabesque Lantern Mosaic — White', vendor: 'MSI', price: 1450, image: 'https://images.thdstatic.com/productImages/342247dc-6a7d-47d3-ad33-2e140184c3fe/svn/carrara-white-glass-tile-mabq-whi-10-4f_600.jpg', selected: false, group: 'Shower tile', tier: 'upgrade' as const },
      { id: 'o8f', name: 'Large Format Porcelain — Calacatta', vendor: 'Daltile', price: 1650, image: 'https://www.mineraltiles.com/cdn/shop/files/florence-calacatta-gold-porcelain-tile-39x39.jpg?v=1712084519&width=1150', selected: false, group: 'Shower tile', tier: 'upgrade' as const },
      { id: 'o8g', name: 'Penny Round Mosaic — Matte White', vendor: 'Merola Tile', price: 980, image: 'https://m.media-amazon.com/images/I/51u37UdURlL._AC_UF350,350_QL80_.jpg', selected: false, group: 'Shower tile', tier: 'base' as const },
      { id: 'o8h', name: 'Basketweave Marble Mosaic', vendor: 'Jeffrey Court', price: 1550, image: 'https://m.media-amazon.com/images/I/71ptOTYeLGL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Shower tile', tier: 'upgrade' as const },
      { id: 'o8c', name: 'Double Vanity — 60" White Shaker', vendor: 'Home Decorators', price: 1850, image: 'https://m.media-amazon.com/images/I/81esKlRUTpL._AC_UF894,1000_QL80_.jpg', selected: false, group: 'Vanity', tier: 'base' as const },
      { id: 'o8d', name: 'Frameless LED Mirror — 36" Round', vendor: 'TOOLKISS', price: 320, image: 'https://m.media-amazon.com/images/I/71uP4Hcb4jL.jpg', selected: false, group: 'Mirror', tier: 'base' as const },
    ],
  },
  {
    id: 'sel-4', name: 'Lighting package', allowance: 6000, dueDate: '2026-05-01', status: 'approved' as const,
    description: 'Your builder has reviewed and confirmed your lighting choices. These are locked in for your project.',
    options: [
      { id: 'o9', name: 'Modern Chandelier — Dining', vendor: 'West Elm', price: 2400, image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg', selected: true, group: 'Chandelier', tier: 'upgrade' as const },
      { id: 'o10', name: 'Recessed Lighting (8x)', vendor: 'Commercial Electric', price: 1920, image: 'https://images.thdstatic.com/productImages/b9e47a4d-a64c-4755-90eb-3cebd7d8b345/svn/white-commercial-electric-recessed-lighting-retrofit-trims-ns01da09fr2-259-1d_1000.jpg', selected: true, group: 'Recessed', tier: 'base' as const },
      { id: 'o11', name: 'Pendant Lights — Kitchen Island (3x)', vendor: 'Hukoro', price: 1350, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', selected: true, group: 'Pendant', tier: 'base' as const },
    ],
  },
];

const statusConfig = {
  overdue: { label: 'Overdue', color: '#B5254C', bg: '#FFEEEA' },
  action_needed: { label: 'Action needed', color: '#854D00', bg: '#FDF3D3' },
  pending: { label: 'Not started', color: '#4E555F', bg: '#F1F4FA' },
  approved: { label: 'Approved', color: '#057E4B', bg: '#DDFDEF' },
  ready: { label: 'Ready to submit', color: '#057E4B', bg: '#DDFDEF' },
  in_progress: { label: 'In progress', color: '#004FD6', bg: '#E6F6FF' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function daysUntil(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} days overdue — overdue choices can delay project completion and may increase costs`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff} days`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Swipe Selection Mode ── */
function SwipeMode({ group, onDone, onToggle, onViewImage }: {
  group: typeof selectionGroups[0];
  onDone: () => void;
  onToggle: (optId: string) => void;
  onViewImage?: (src: string, name: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [history, setHistory] = useState<{ optId: string; action: 'add' | 'skip' | 'decline' }[]>([]);

  const selectedSoFar = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
  const opt = group.options[idx];
  const isLast = idx >= group.options.length;

  const [, setDeclined] = useState<Set<string>>(new Set());

  const handleAction = useCallback((action: 'add' | 'decline' | 'skip') => {
    if (!opt) return;
    if (action === 'skip') {
      setDeclined(prev => new Set(prev).add(opt.id));
    }
    setSwipeDir(action === 'add' ? 'right' : 'left');
    setHistory(prev => [...prev, { optId: opt.id, action }]);
    if (action === 'add' && !opt.selected) onToggle(opt.id);
    if (action === 'decline' && opt.selected) onToggle(opt.id);
    setTimeout(() => {
      setSwipeDir(null);
      setIdx(i => i + 1);
    }, 250);
  }, [opt, onToggle]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    onToggle(last.optId);
    setIdx(i => i - 1);
  };

  const remainingIfAdded = opt ? group.allowance - selectedSoFar - (opt.selected ? 0 : opt.price) : 0;

  if (isLast) {
    const finalTotal = group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
    const finalDiff = group.allowance - finalTotal;
    return (
      <div className="sw-overlay">
        <div className="sw-container sw-review">
          <div className="sw-review-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#DDFDEF"/><path d="M7 12.5l3 3 7-7" stroke="#057E4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="sw-review-title">Review your selections</h2>
          <p className="sw-review-sub">{group.name}</p>

          <div className="sw-review-items">
            {group.options.map(o => (
              <div key={o.id} className={`sw-review-item ${o.selected ? 'sw-review-item-on' : 'sw-review-item-off'}`} onClick={() => onToggle(o.id)}>
                <div className="sw-review-item-left">
                  {o.selected ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#057E4B"/><path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#DEE3EB" strokeWidth="2"/></svg>
                  )}
                  <span style={{ textDecoration: o.selected ? 'none' : 'line-through', opacity: o.selected ? 1 : 0.5 }}>{o.name}</span>
                </div>
                <span style={{ opacity: o.selected ? 1 : 0.5 }}>${fmt(o.price)}</span>
              </div>
            ))}
          </div>

          <div className="sw-review-summary">
            <div className="sw-review-row"><span>Allowance</span><span>${fmt(group.allowance)}</span></div>
            <div className="sw-review-row"><span>Selected</span><span>-${fmt(finalTotal)}</span></div>
            <div className={`sw-review-row sw-review-total ${finalDiff < 0 ? 'cs-over' : 'cs-under'}`}>
              <span>{finalDiff >= 0 ? 'Remaining' : 'Overage'}</span>
              <span>{finalDiff < 0 ? '+' : ''}${fmt(Math.abs(finalDiff))}</span>
            </div>
          </div>

          <div className="sw-review-actions">
            <button className="bds-button bds-button-primary" onClick={onDone}>Submit choices</button>
            <button className="bds-button bds-button-tertiary" onClick={onDone}>Save and go back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-overlay">
      <div className="sw-container">
        {/* Top bar */}
        <div className="sw-topbar">
          <button className="sw-close" onClick={onDone}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="sw-progress">
            <span className="sw-progress-text">{idx + 1} of {group.options.length}</span>
            <div className="sw-progress-bar">
              <div className="sw-progress-fill" style={{ width: `${((idx + 1) / group.options.length) * 100}%` }} />
            </div>
          </div>
          <div className="sw-budget-pill">
            <span className="sw-budget-label">Budget left</span>
            <span className={`sw-budget-amt ${selectedSoFar > group.allowance ? 'cs-over' : ''}`}>${fmt(group.allowance - selectedSoFar)}</span>
          </div>
        </div>

        {/* Card */}
        <div className={`sw-card ${swipeDir === 'right' ? 'sw-card-right' : ''} ${swipeDir === 'left' ? 'sw-card-left' : ''}`}>
          {opt.image ? (
            <div className="sw-card-img" style={{ backgroundImage: `url(${opt.image})`, cursor: 'zoom-in' }} onClick={() => onViewImage?.(opt.image, opt.name)}>
              <button className="sw-zoom-btn" onClick={(e) => { e.stopPropagation(); onViewImage?.(opt.image, opt.name); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </button>
            </div>
          ) : (
            <div className="sw-card-img sw-card-img-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
          )}
          <div className="sw-card-body">
            <div className="sw-card-vendor">{opt.vendor}</div>
            <div className="sw-card-name">{opt.name}</div>
            <div className="sw-card-price">${fmt(opt.price)}</div>
            <div className={`sw-card-impact ${remainingIfAdded < 0 ? 'cs-over' : ''}`}>
              {!opt.selected
                ? remainingIfAdded >= 0
                  ? `$${fmt(remainingIfAdded)} remaining if you add this`
                  : `$${fmt(Math.abs(remainingIfAdded))} over budget if you add this`
                : 'Currently in your selections'
              }
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="sw-actions">
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-decline" onClick={() => handleAction('decline')} title="Skip">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span className="sw-action-label sw-hint-decline">Decline</span>
          </div>
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-skip" onClick={() => handleAction('skip')} title="Skip for now">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <span className="sw-action-label">Skip</span>
          </div>
          {history.length > 0 && (
            <div className="sw-action-col">
              <button className="sw-btn sw-btn-undo" onClick={handleUndo} title="Undo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
              <span className="sw-action-label">Undo</span>
            </div>
          )}
          <div className="sw-action-col">
            <button className="sw-btn sw-btn-add" onClick={() => handleAction('add')} title="Add to selections">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
            <span className="sw-action-label sw-hint-add">Choose</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
type Persona = 'spec' | 'custom';
const personaConfig: Record<Persona, { label: string; jobName: string; heroTitle: string; heroDesc: string; showAllowance: boolean; showTiers: boolean; showDelta: boolean; pricingLabel: string }> = {
  custom: { label: 'Custom / Remodel', jobName: 'Johnson Residence — Full Remodel', heroTitle: 'Your selections', heroDesc: 'Review and approve materials and finishes for your project. Pricing is shown per item.', showAllowance: true, showTiers: false, showDelta: false, pricingLabel: 'Approved price' },
  spec: { label: 'Spec / Production', jobName: 'Lot 14 — Oakwood Estates', heroTitle: 'Your selections', heroDesc: 'Choose your finishes, fixtures, and materials. Your allowance budget is shown for each category.', showAllowance: true, showTiers: false, showDelta: true, pricingLabel: 'Additional cost' },
};

export default function ClientSelections() {
  const [persona, setPersona] = useState<Persona>('custom');
  const pc = personaConfig[persona];
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('compact');
  const [expandedId] = useState<string | null>(null);
  const [selections, setSelections] = useState(selectionGroups);
  const [filter, setFilter] = useState<'all' | 'action' | 'approved'>('all');
  const [swipeGroupId, setSwipeGroupId] = useState<string | null>(null);

  const [lightboxImg, setLightboxImg] = useState<{images: string[]; name: string; index: number; url?: string} | null>(null);
  const [requestGroupId, setRequestGroupId] = useState<string | null>(null);
  const [requestText, setRequestText] = useState('');
  const [requestLink, setRequestLink] = useState('');
  const [requestImage, setRequestImage] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const [submittedGroups, setSubmittedGroups] = useState<Set<string>>(new Set());
  const [declinedOptions, setDeclinedOptions] = useState<Set<string>>(new Set());
  const [cardImgIndex, setCardImgIndex] = useState<Record<string, number>>({});
  const [showDeclined, setShowDeclined] = useState<Set<string>>(new Set());
  const [, setRequestedGroups] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<{groupId: string; text: string; link: string; image: string | null; autoApprove: boolean; date: string}[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const declineOption = (optionId: string, groupId: string) => {
    if (submittedGroups.has(groupId)) {
      setSubmittedGroups(prev => { const n = new Set(prev); n.delete(groupId); return n; });
    }
    setDeclinedOptions(prev => new Set(prev).add(optionId));
    // Also deselect if it was selected
    setSelections(prev => prev.map(g =>
      g.id === groupId ? { ...g, options: g.options.map(o => o.id === optionId ? { ...o, selected: false } : o) } : g
    ));
  };

  const undeclineOption = (optionId: string) => {
    setDeclinedOptions(prev => { const n = new Set(prev); n.delete(optionId); return n; });
  };

  const toggleOption = (groupId: string, optionId: string) => {
    // Remove from submitted if user changes their mind
    if (submittedGroups.has(groupId)) {
      setSubmittedGroups(prev => { const n = new Set(prev); n.delete(groupId); return n; });
    }
    setSelections(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const targetOpt = g.options.find(o => o.id === optionId);
      if (!targetOpt) return g;
      const isSelecting = !targetOpt.selected;
      const optGroup = (targetOpt as any).group;

      // If selecting and option has a group with multiple items, auto-decline siblings
      if (isSelecting && optGroup) {
        const siblings = g.options.filter(o => (o as any).group === optGroup && o.id !== optionId);
        const hasGroupSiblings = siblings.length > 0;
        if (hasGroupSiblings) {
          // Auto-decline siblings
          const newDeclined = new Set(declinedOptions);
          siblings.forEach(sib => newDeclined.add(sib.id));
          setDeclinedOptions(newDeclined);
          const declinedNames = siblings.map(s => s.name);
          if (declinedNames.length > 0) showToast(`${declinedNames.join(', ')} auto-declined`);
          // Deselect siblings
          return { ...g, options: g.options.map(o => {
            if (o.id === optionId) return { ...o, selected: true };
            if ((o as any).group === optGroup && o.id !== optionId) return { ...o, selected: false };
            return o;
          })};
        }
      }

      // Remove from declined if re-selecting
      if (isSelecting && declinedOptions.has(optionId)) {
        setDeclinedOptions(prev => { const n = new Set(prev); n.delete(optionId); return n; });
      }

      // Undo auto-decline on siblings when deselecting
      if (!isSelecting && optGroup) {
        const siblings = g.options.filter(o => (o as any).group === optGroup && o.id !== optionId);
        if (siblings.length > 0) {
          const newDeclined = new Set(declinedOptions);
          siblings.forEach(sib => newDeclined.delete(sib.id));
          setDeclinedOptions(newDeclined);
          const restoredNames = siblings.filter(s => declinedOptions.has(s.id)).map(s => s.name);
          if (restoredNames.length > 0) showToast(`${restoredNames.join(', ')} restored`);
        }
      }

      return { ...g, options: g.options.map(o => o.id === optionId ? { ...o, selected: !o.selected } : o) };
    }));
  };

  // Calculate upgrade cost — only the delta above the base option counts against the allowance
  const getUpgradeCost = (group: typeof selectionGroups[0]) => {
    let cost = 0;
    const optGroups = new Map<string, typeof group.options>();
    group.options.forEach(opt => {
      const g = (opt as any).group || opt.id;
      if (!optGroups.has(g)) optGroups.set(g, []);
      optGroups.get(g)!.push(opt);
    });
    optGroups.forEach((opts) => {
      const selected = opts.find(o => o.selected);
      if (!selected) return;
      if ((selected as any).tier === 'base') return; // no extra cost
      const baseOpt = opts.find(o => (o as any).tier === 'base');
      if (baseOpt) {
        cost += selected.price - baseOpt.price; // only the delta
      } else {
        cost += selected.price; // no base option exists, full price
      }
    });
    return cost;
  };

  const getSelectedTotal = (group: typeof selectionGroups[0]) => {
    return group.options.filter(o => o.selected).reduce((s, o) => s + o.price, 0);
  };

  const totalAllowance = selections.reduce((s, g) => s + g.allowance, 0);
  const totalUpgradeCost = selections.reduce((s, g) => s + getUpgradeCost(g), 0);
  const totalSelectedPrice = selections.reduce((s, g) => s + getSelectedTotal(g), 0);
  const totalRemaining = totalAllowance - totalSelectedPrice;
  const getDynamicStatus = (group: typeof selectionGroups[0]) => {
    if (group.status === 'approved') return 'approved';
    const optGroups = new Set(group.options.map(o => (o as any).group || o.id));
    const made = Array.from(optGroups).filter(g =>
      group.options.some(o => ((o as any).group || o.id) === g && o.selected)
    ).length;
    if (made === optGroups.size) return 'ready';
    if (made > 0) return 'in_progress';
    return group.status;
  };

  const dynamicStatuses = selections.map(g => getDynamicStatus(g));
  const actionCount = dynamicStatuses.filter(s => s === 'overdue' || s === 'action_needed').length;
  const readyCount = dynamicStatuses.filter(s => s === 'ready').length;
  const approvedCount = dynamicStatuses.filter(s => s === 'approved').length;
  const completedCount = approvedCount + readyCount;

  // Groups ready to submit (all choices made, not yet submitted or approved)
  const pendingSubmit = selections.filter((g, i) =>
    dynamicStatuses[i] === 'ready' &&
    !submittedGroups.has(g.id)
  );

  const handleSubmitAll = () => {
    setSelections(prev => prev.map(g => {
      if (pendingSubmit.some(p => p.id === g.id)) {
        return { ...g, status: 'approved' as const };
      }
      return g;
    }));
    showToast('Selections submitted.');
  };

  const sorted = [...selections].sort((a, b) => {
    const aApproved = a.status === 'approved' ? 1 : 0;
    const bApproved = b.status === 'approved' ? 1 : 0;
    return aApproved - bApproved;
  });

  const filtered = filter === 'all' ? sorted
    : filter === 'action' ? sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'overdue' || ds === 'action_needed' || ds === 'pending'; })
    : sorted.filter(s => { const ds = getDynamicStatus(s); return ds === 'approved' || ds === 'ready'; });

  const swipeGroup = selections.find(g => g.id === swipeGroupId);

  return (
    <>
      {swipeGroup && (
        <SwipeMode
          group={swipeGroup}
          onDone={() => setSwipeGroupId(null)}
          onToggle={(optId) => toggleOption(swipeGroup.id, optId)}
          onViewImage={(src, name) => setLightboxImg({images: [src], name, index: 0})/* swipe mode doesn't pass url */}
        />
      )}
      {/* Lightbox */}
      {lightboxImg && (
        <div className="sw-overlay lb-overlay" onClick={() => setLightboxImg(null)}>
          <button className="lb-close" onClick={() => setLightboxImg(null)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="lb-content" onClick={e => e.stopPropagation()}>
            <div className="lb-img-row">
              {lightboxImg.images.length > 1 && lightboxImg.index > 0 && (
                <button className="lb-arrow" onClick={() => setLightboxImg({...lightboxImg, index: lightboxImg.index - 1})}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              )}
              <img src={lightboxImg.images[lightboxImg.index]} alt={lightboxImg.name} className="lb-img" />
              {lightboxImg.images.length > 1 && lightboxImg.index < lightboxImg.images.length - 1 && (
                <button className="lb-arrow" onClick={() => setLightboxImg({...lightboxImg, index: lightboxImg.index + 1})}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )}
            </div>
            {lightboxImg.images.length > 1 && (
              <div className="lb-dots">
                {lightboxImg.images.map((_, i) => (
                  <button key={i} className={`lb-dot ${i === lightboxImg.index ? 'lb-dot-active' : ''}`} onClick={(e) => { e.stopPropagation(); setLightboxImg({...lightboxImg, index: i}); }} />
                ))}
              </div>
            )}
            {lightboxImg.url ? (
              <a className="lb-caption lb-caption-link" href={lightboxImg.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                {lightboxImg.name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            ) : (
              <div className="lb-caption">{lightboxImg.name}</div>
            )}
          </div>
        </div>
      )}

      {/* Request different option modal */}
      {requestGroupId && (() => {
        const rg = selections.find(g => g.id === requestGroupId);
        return (
          <div className="sw-overlay" style={{background: 'rgba(0,0,0,0.5)', zIndex: 1500}} onClick={() => { setRequestGroupId(null); setRequestText(''); setRequestLink(''); setRequestImage(null); setRequestSent(false); }}>
            <div className="cs-request-modal" onClick={e => e.stopPropagation()}>
              {!requestSent ? (
                <>
                  <h3 className="cs-request-title">Request a different option</h3>
                  <p className="cs-request-sub">Don't see what you're looking for in <strong>{rg?.name}</strong>? Describe the product you'd like and your builder will review it.</p>
                  <div className="cs-request-field">
                    <label className="cs-request-label">What are you looking for?</label>
                    <textarea
                      className="cs-request-input"
                      placeholder="Describe the product, brand, model, or link to what you'd like..."
                      value={requestText}
                      onChange={e => setRequestText(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="cs-request-field">
                    <label className="cs-request-label">Link to product (optional)</label>
                    <div className="cs-request-link-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E96A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      <input
                        className="cs-request-link-input"
                        placeholder="https://www.homedepot.com/..."
                        value={requestLink}
                        onChange={e => setRequestLink(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="cs-request-field">
                    <label className="cs-request-label">Photo (optional)</label>
                    {requestImage ? (
                      <div className="cs-request-image-preview">
                        <img src={requestImage} alt="Attached" className="cs-request-image-thumb" />
                        <button className="cs-request-image-remove" onClick={() => setRequestImage(null)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ) : (
                      <label className="cs-request-upload">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E96A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        <span>Upload a photo or screenshot</span>
                        <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setRequestImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                  <label className="cs-request-auto">
                    <input type="checkbox" checked={autoApprove} onChange={e => setAutoApprove(e.target.checked)} />
                    <span>Automatically add to my selections if my builder approves this option</span>
                  </label>
                  <div className="cs-request-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E96A0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>{autoApprove ? 'If your builder adds this option, it\'ll be automatically selected for you. This may affect your allowance budget.' : 'Your builder will add the option and you\'ll be notified to review and select it.'}</span>
                  </div>
                  <div className="cs-request-actions">
                    <button className="bds-button bds-button-primary" disabled={!requestText.trim()} onClick={() => {
                      setRequestSent(true);
                      if (requestGroupId) {
                        setRequestedGroups(prev => new Set(prev).add(requestGroupId));
                        const newReq = { groupId: requestGroupId, text: requestText, link: requestLink, image: requestImage, autoApprove, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
                        setRequests(prev => {
                          const existing = prev.findIndex(r => r.groupId === requestGroupId && r.text === requestText);
                          if (existing >= 0) {
                            const updated = [...prev];
                            updated[existing] = newReq;
                            return updated;
                          }
                          // Replace if editing same group
                          const sameGroup = prev.findIndex(r => r.groupId === requestGroupId);
                          if (sameGroup >= 0) {
                            const updated = [...prev];
                            updated[sameGroup] = newReq;
                            return updated;
                          }
                          return [...prev, newReq];
                        });
                      }
                    }}>Send request</button>
                    <button className="bds-button bds-button-tertiary" onClick={() => { setRequestGroupId(null); setRequestText(''); setRequestLink(''); setRequestImage(null); }}>Cancel</button>
                  </div>
                </>
              ) : (
                <div className="cs-request-success">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#DDFDEF"/><path d="M7 12.5l3 3 7-7" stroke="#057E4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <h3 className="cs-request-title">Request sent</h3>
                  <p className="cs-request-sub">Your builder has been notified. They'll add the option to your selections once they've reviewed it and confirmed pricing.</p>
                  <button className="bds-button bds-button-primary" onClick={() => { setRequestGroupId(null); setRequestText(''); setRequestLink(''); setRequestImage(null); setRequestSent(false); }}>Done</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Persona toggle */}
      <div className="cs-persona-bar">
        <span className="cs-persona-label">Persona:</span>
        {(Object.keys(personaConfig) as Persona[]).map(p => (
          <button key={p} className={`cs-persona-btn ${persona === p ? 'cs-persona-active' : ''}`} onClick={() => setPersona(p)}>{personaConfig[p].label}</button>
        ))}
      </div>

      <div className="cs-page">
        {/* Hero */}
        <div className="cs-hero">
          <div className="cs-hero-sub">{pc.jobName}</div>
          <h1 className="cs-hero-title">{pc.heroTitle}</h1>
          <p className="cs-hero-desc">{pc.heroDesc}</p>
        </div>

        {/* Budget stats */}
        <div className="cs-hero-stats">
          {pc.showDelta ? (
            /* Spec: allowance + additional cost + completed */
            <>
              <div className="cs-stat">
                <div className="cs-stat-value">$0.00</div>
                <div className="cs-stat-label">Allowance</div>
              </div>
              <div className="cs-stat-divider" />
              <div className="cs-stat">
                <div className={`cs-stat-value ${totalUpgradeCost > 0 ? 'cs-over' : ''}`}>${fmt(totalUpgradeCost)}</div>
                <div className="cs-stat-label">Additional cost</div>
              </div>
              <div className="cs-stat-divider" />
              <div className="cs-stat">
                <div className="cs-stat-value">{completedCount}/{selections.length}</div>
                <div className="cs-stat-label">Completed</div>
              </div>
            </>
          ) : (
            /* Custom/Remodel: allowance, price, remaining, completed */
            <>
              <div className="cs-stat">
                <div className="cs-stat-value">${fmt(totalAllowance)}</div>
                <div className="cs-stat-label">Allowance</div>
              </div>
              <div className="cs-stat-divider" />
              <div className="cs-stat">
                <div className="cs-stat-value">${fmt(totalSelectedPrice)}</div>
                <div className="cs-stat-label">{pc.pricingLabel}</div>
              </div>
              <div className="cs-stat-divider" />
              <div className="cs-stat">
                <div className={`cs-stat-value ${totalRemaining < 0 ? 'cs-over' : 'cs-under'}`}>{totalRemaining < 0 ? '-' : ''}${fmt(Math.abs(totalRemaining))}</div>
                <div className="cs-stat-label">Allowance remaining</div>
              </div>
              <div className="cs-stat-divider" />
              <div className="cs-stat">
                <div className="cs-stat-value">{completedCount}/{selections.length}</div>
                <div className="cs-stat-label">Completed</div>
              </div>
            </>
          )}
        </div>

        {false && actionCount > 0 && (
          <div className="cs-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#854D00" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#854D00" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="#854D00"/></svg>
            <span>{actionCount} selection{actionCount > 1 ? 's' : ''} need{actionCount === 1 ? 's' : ''} your attention — your builder is waiting on your choices.</span>
          </div>
        )}

        <div className="cs-filters">
          <div className="cs-filter-left">
            <button className={`cs-filter-btn ${filter === 'all' ? 'cs-filter-active' : ''}`} onClick={() => setFilter('all')}>All ({selections.length})</button>
            <button className={`cs-filter-btn ${filter === 'action' ? 'cs-filter-active' : ''}`} onClick={() => setFilter('action')}>Needs attention ({actionCount})</button>
            <button className={`cs-filter-btn ${filter === 'approved' ? 'cs-filter-active' : ''}`} onClick={() => setFilter('approved')}>Completed ({completedCount})</button>
          </div>
          <div className="cs-view-toggle">
            <button className={`cs-view-btn ${viewMode === 'compact' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('compact')} title="Compact list">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <button className={`cs-view-btn ${viewMode === 'grid' ? 'cs-view-active' : ''}`} onClick={() => setViewMode('grid')} title="Card grid">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
          </div>
        </div>

        <div className="cs-cards">
          {(() => {
            const renderCard = (group: typeof selections[0]) => {
            const upgradeCost = getUpgradeCost(group);
            const selectedTotal = getSelectedTotal(group);
            const diff = group.allowance - selectedTotal;
            void expandedId; // keep state for swipe mode
            const dynamicStatus = getDynamicStatus(group);
            const sc = statusConfig[dynamicStatus as keyof typeof statusConfig];
            const dueDays = daysUntil(group.dueDate);
            const isOverdue = group.status === 'overdue';
            const optGroups = new Set(group.options.map(o => (o as any).group || o.id));
            const totalChoices = optGroups.size;
            const madeChoices = Array.from(optGroups).filter(g =>
              group.options.some(o => ((o as any).group || o.id) === g && o.selected)
            ).length;

            return (
              <div key={group.id} className={`cs-section ${isOverdue ? 'cs-card-overdue' : ''}`}>
                {/* Section header */}
                <div className="cs-section-header">
                  <div className="cs-section-left">
                    <span className="cs-status-dot" style={{ background: sc.color }} />
                    <h3 className="cs-section-name">{group.name}</h3>
                    <span className="cs-status-badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <span className="cs-section-meta">{madeChoices} of {totalChoices} choices made &middot; Due {formatDate(group.dueDate)} ({dueDays})</span>
                  </div>
                  <div className="cs-section-right">
                    {pc.showDelta ? (
                      /* Spec: show allowance $0 + additional cost */
                      <>
                        <span className="cs-section-allowance">Allowance: $0.00</span>
                        {upgradeCost > 0 && (
                          <span className="cs-section-remaining cs-over">Additional cost: ${fmt(upgradeCost)}</span>
                        )}
                      </>
                    ) : (
                      /* Custom/Remodel: show allowance and remaining */
                      <>
                        <span className="cs-section-allowance">Allowance: ${fmt(group.allowance)}</span>
                        {diff >= 0 ? (
                          <span className="cs-section-remaining cs-under">Remaining: ${fmt(diff)}</span>
                        ) : (
                          <span className="cs-section-remaining cs-over">Over: -${fmt(Math.abs(diff))}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                  <div className="cs-section-body">

                    {/* Shopping card grid */}
                    {(() => {
                      const optGroupMap = new Map<string, typeof group.options>();
                      group.options.forEach(opt => {
                        const g = (opt as any).group || 'Other';
                        if (!optGroupMap.has(g)) optGroupMap.set(g, []);
                        optGroupMap.get(g)!.push(opt);
                      });
                      return Array.from(optGroupMap.entries()).map(([gName, unsortedOpts]) => {
                        const opts = [...unsortedOpts].sort((a, b) => {
                          if (group.status === 'approved') {
                            // Chosen first, then unchosen, then declined
                            const aStatus = a.selected ? 0 : declinedOptions.has(a.id) ? 2 : 1;
                            const bStatus = b.selected ? 0 : declinedOptions.has(b.id) ? 2 : 1;
                            if (aStatus !== bStatus) return aStatus - bStatus;
                          }
                          // Within same status, base before upgrade
                          const tierOrder = { base: 0, upgrade: 1 };
                          const aTier = (a as any).tier || 'upgrade';
                          const bTier = (b as any).tier || 'upgrade';
                          return (tierOrder[aTier as keyof typeof tierOrder] ?? 1) - (tierOrder[bTier as keyof typeof tierOrder] ?? 1);
                        });
                        const isMultiChoice = opts.length > 1;
                        const isApproved = group.status === 'approved';
                        const declinedKey = `${group.id}-${gName}`;
                        const isDeclinedExpanded = showDeclined.has(declinedKey);
                        const chosenOpts = isApproved && !isDeclinedExpanded ? opts.filter(o => o.selected) : opts;
                        const hiddenCount = isApproved ? opts.filter(o => !o.selected).length : 0;
                        // Note: sort already places chosen above declined when approved
                        return (
                          <div key={gName} className="cs-opt-group">
                            {isMultiChoice && (
                              <div className="cs-opt-group-header">
                                <span className="cs-opt-group-name">{gName}</span>
                                {group.status !== 'approved' && <span className="cs-opt-group-hint">Choose one</span>}
                              </div>
                            )}
                            {viewMode === 'compact' ? (
                              /* ── Compact row view (like builder side) ── */
                              <div className="cs-compact-list">
                                {chosenOpts.map(opt => {
                                  const isDeclined = declinedOptions.has(opt.id);
                                  const baseOpt = opts.find(o => (o as any).tier === 'base');
                                  const delta = baseOpt && (opt as any).tier === 'upgrade' ? opt.price - baseOpt.price : 0;
                                  const statusLabel = opt.selected ? 'Chosen' : isDeclined ? 'Declined' : '';
                                  const statusCls = opt.selected ? 'cs-row-status-approved' : isDeclined ? 'cs-row-status-declined' : '';
                                  return (
                                    <div key={opt.id} className={`cs-compact-row ${opt.selected ? 'cs-compact-row-selected' : ''} ${isDeclined ? 'cs-compact-row-declined' : ''}`}>
                                      <div className="cs-compact-thumb" style={{ backgroundImage: opt.image ? `url(${opt.image})` : undefined }} onClick={() => opt.image && setLightboxImg({images: (opt as any).images || [opt.image], name: opt.name, index: 0, url: (opt as any).url})} />
                                      <div className="cs-compact-info">
                                        <div className="cs-compact-name-row">
                                          <span className="cs-compact-name" style={{ textDecoration: isDeclined ? 'line-through' : 'none', opacity: isDeclined ? 0.5 : 1 }}>{opt.name}</span>
                                          {statusLabel && <span className={`cs-compact-status ${statusCls}`}>{statusLabel}</span>}
                                        </div>
                                        {opt.vendor && <span className="cs-compact-vendor">{opt.vendor}</span>}
                                      </div>
                                      <div className="cs-compact-price">
                                        {pc.showTiers ? (
                                          (opt as any).tier === 'base' ? (
                                            <><span className="cs-tier-badge cs-tier-base">Included</span><span className="cs-preview-price-included">$0</span></>
                                          ) : (opt as any).tier === 'upgrade' ? (
                                            <><span className="cs-tier-badge cs-tier-upgrade">Upgrade</span><span>${fmt(delta)}</span></>
                                          ) : <span>${fmt(opt.price)}</span>
                                        ) : pc.showDelta ? (
                                          (opt as any).tier === 'base' ? <span className="cs-preview-price-included">$0</span>
                                          : <span>${fmt(delta)}</span>
                                        ) : <span>${fmt(opt.price)}</span>}
                                      </div>
                                      <div className="cs-compact-actions">
                                        {group.status !== 'approved' && (
                                          isDeclined ? (
                                            <button className="cs-icon-btn cs-icon-btn-undo" onClick={() => undeclineOption(opt.id)} title="Undo">
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                                            </button>
                                          ) : opt.selected ? (
                                            <button className="cs-icon-btn cs-icon-btn-undo" onClick={() => toggleOption(group.id, opt.id)} title="Undo">
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                                            </button>
                                          ) : (
                                            <>
                                              <button className="cs-icon-btn cs-icon-btn-decline" onClick={() => declineOption(opt.id, group.id)} title="Skip">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                              </button>
                                              <button className="cs-icon-btn cs-icon-btn-approve" onClick={() => toggleOption(group.id, opt.id)} title="Choose">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                                              </button>
                                            </>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* ── Card views: grid (original) or list (big picture) ── */
                              <div className={viewMode === 'grid' ? 'cs-shop-grid' : 'cs-shop-list'}>
                                {chosenOpts.map(opt => {
                                  const isDeclined = declinedOptions.has(opt.id);
                                  const baseOpt = opts.find(o => (o as any).tier === 'base');
                                  const delta = baseOpt && (opt as any).tier === 'upgrade' ? opt.price - baseOpt.price : 0;
                                  return (
                                    <div key={opt.id} className={`cs-shop-card ${opt.selected ? 'cs-shop-card-selected' : ''} ${isDeclined ? 'cs-shop-card-declined' : ''}`}>
                                      {(() => {
                                        const images = (opt as any).images || (opt.image ? [opt.image] : []);
                                        const imgIdx = cardImgIndex[opt.id] || 0;
                                        const currentImg = images[imgIdx] || opt.image;
                                        const hasMultiple = images.length > 1;
                                        return (
                                          <div
                                            className="cs-shop-img"
                                            style={{ backgroundImage: currentImg ? `url(${currentImg})` : undefined, opacity: isDeclined ? 0.4 : 1 }}
                                            onClick={() => currentImg && setLightboxImg({images, name: opt.name, index: imgIdx, url: (opt as any).url})}
                                          >
                                            {!currentImg && <div className="cs-shop-img-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C7D0D9" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                                            {opt.selected && <div className="cs-shop-badge-selected"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
                                            {isDeclined && <div className="cs-shop-badge-declined"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>}
                                            {hasMultiple && imgIdx > 0 && (
                                              <button className="cs-shop-arrow cs-shop-arrow-left" onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: imgIdx - 1})); }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                              </button>
                                            )}
                                            {hasMultiple && imgIdx < images.length - 1 && (
                                              <button className="cs-shop-arrow cs-shop-arrow-right" onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: imgIdx + 1})); }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                              </button>
                                            )}
                                            {hasMultiple && (
                                              <div className="cs-shop-dots">
                                                {images.map((_: string, i: number) => (
                                                  <span key={i} className={`cs-shop-dot ${i === imgIdx ? 'cs-shop-dot-active' : ''}`} onClick={(e) => { e.stopPropagation(); setCardImgIndex(prev => ({...prev, [opt.id]: i})); }} />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div className="cs-shop-info" style={{ opacity: isDeclined ? 0.5 : 1 }}>
                                        <div className="cs-shop-name-row">
                                          <span className="cs-shop-name" style={{ textDecoration: isDeclined ? 'line-through' : 'none' }}>{opt.name}</span>
                                          {opt.selected && <span className="cs-shop-approved-badge">Chosen</span>}
                                          {isDeclined && <span className="cs-shop-declined-badge">Declined</span>}
                                        </div>
                                        <div className="cs-shop-price-row">
                                          {pc.showTiers ? (
                                            (opt as any).tier === 'base' ? (
                                              <><span className="cs-tier-badge cs-tier-base">Included</span><span className="cs-shop-price cs-preview-price-included">$0</span></>
                                            ) : (opt as any).tier === 'upgrade' ? (
                                              <><span className="cs-tier-badge cs-tier-upgrade">Upgrade</span><span className="cs-shop-price">${fmt(delta)}</span></>
                                            ) : <span className="cs-shop-price">${fmt(opt.price)}</span>
                                          ) : pc.showDelta ? (
                                            (opt as any).tier === 'base' ? <span className="cs-shop-price cs-preview-price-included">$0</span>
                                            : <span className="cs-shop-price">${fmt(delta)}</span>
                                          ) : <span className="cs-shop-price">${fmt(opt.price)}</span>}
                                        </div>
                                        {group.status !== 'approved' && (
                                          <div className="cs-shop-actions">
                                            {isDeclined ? (
                                              <button className="bds-button bds-button-secondary cs-prev-btn-sm" onClick={() => undeclineOption(opt.id)}>Undo</button>
                                            ) : opt.selected ? (
                                              <button className="bds-button bds-button-secondary cs-prev-btn-sm" onClick={() => toggleOption(group.id, opt.id)}>Undo</button>
                                            ) : (
                                              <>
                                                <button className="bds-button bds-button-secondary cs-prev-btn-sm" onClick={() => declineOption(opt.id, group.id)}>Decline</button>
                                                <button className="bds-button bds-button-primary cs-prev-btn-sm" onClick={() => toggleOption(group.id, opt.id)}>Choose</button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {/* All declined in this group — prompt to request or show existing request */}
                            {group.status !== 'approved' && opts.every(o => declinedOptions.has(o.id)) && (() => {
                              const existingRequest = requests.find(r => r.groupId === group.id && r.text.toLowerCase().includes(gName.toLowerCase()));
                              if (existingRequest) {
                                return null;
                              }
                              return (
                                <div className="cs-all-declined">
                                  <div className="cs-all-declined-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854D00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="#854D00"/></svg>
                                    <span>You've skipped all {gName.toLowerCase()} options. Request a different one or undo to choose.</span>
                                  </div>
                                  <button className="cs-prev-btn cs-prev-request" onClick={(e) => {
                                    e.stopPropagation();
                                    setRequestGroupId(group.id);
                                    setRequestText(`Looking for a different ${gName.toLowerCase()} option — declined the current choices.`);
                                  }}>Request a different {gName.toLowerCase()}</button>
                                </div>
                              );
                            })()}
                            {isApproved && hiddenCount > 0 && (
                              <button className="cs-show-declined" onClick={() => setShowDeclined(prev => {
                                const next = new Set(prev);
                                if (next.has(declinedKey)) next.delete(declinedKey); else next.add(declinedKey);
                                return next;
                              })}>
                                {isDeclinedExpanded ? 'Hide declined options' : `Show declined options (${hiddenCount})`}
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Pending requests */}
                    {requests.filter(r => r.groupId === group.id).length > 0 && (
                      <div className="cs-requests-list">
                        <div className="cs-requests-title">Your requests</div>
                        {requests.filter(r => r.groupId === group.id).map((r, i) => (
                          <div key={i} className="cs-request-item">
                            <div className="cs-request-item-top">
                              <span className="cs-request-pending-badge">Pending</span>
                              <span className="cs-request-item-date">{r.date}</span>
                            </div>
                            <div className="cs-request-item-text">{r.text}</div>
                            {r.link && (
                              <a className="cs-request-item-link" href={r.link} target="_blank" rel="noopener noreferrer">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                {r.link.length > 50 ? r.link.slice(0, 50) + '...' : r.link}
                              </a>
                            )}
                            {r.image && <img src={r.image} alt="Attached" className="cs-request-item-img" />}
                            {r.autoApprove && <div className="cs-request-item-auto">Auto-select if approved</div>}
                            <button className="bds-button bds-button-secondary cs-request-item-edit" onClick={(e) => {
                              e.stopPropagation();
                              setRequestGroupId(group.id);
                              setRequestText(r.text);
                              setRequestLink(r.link);
                              setRequestImage(r.image);
                              setAutoApprove(r.autoApprove);
                            }}>Edit request</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {group.status !== 'approved' ? (
                      <div className="cs-section-actions">
                        <button className="bds-button bds-button-secondary cs-mobile-only" onClick={() => setSwipeGroupId(group.id)}>
                          {madeChoices > 0 ? 'Change selections' : 'Start selecting'}
                        </button>
                        <button className="bds-button bds-button-secondary" onClick={() => setRequestGroupId(group.id)}>Request an option</button>
                      </div>
                    ) : null}
                  </div>
              </div>
            );
            };

            if (filter === 'all') {
              // Use original status for grouping so cards don't jump while making choices
              const overdue = filtered.filter(g => g.status === 'overdue');
              const dueSoon = filtered.filter(g => g.status === 'action_needed');
              const notStarted = filtered.filter(g => g.status === 'pending' || g.status === 'in_progress');
              const approved = filtered.filter(g => g.status === 'approved');
              return (
                <>
                  {overdue.length > 0 && <><h2 className="cs-group-title cs-group-overdue">Overdue</h2>{overdue.map(renderCard)}</>}
                  {dueSoon.length > 0 && <><h2 className="cs-group-title">Choices due soon</h2>{dueSoon.map(renderCard)}</>}
                  {notStarted.length > 0 && <><h2 className="cs-group-title">Not started</h2>{notStarted.map(renderCard)}</>}
                  {approved.length > 0 && <><h2 className="cs-group-title">Approved</h2>{approved.map(renderCard)}</>}
                </>
              );
            }
            return filtered.map(renderCard);
          })()}
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="cs-toast">{toastMsg}</div>
        )}
      </div>

      {/* Sticky footer */}
      {pendingSubmit.length > 0 && (
        <div className="cs-sticky-footer">
          <div className="cs-sticky-inner">
            <div className="cs-sticky-info">
              <strong>{pendingSubmit.length} selection{pendingSubmit.length > 1 ? 's' : ''}</strong> ready — submit to lock in your choices
            </div>
            <button className="bds-button bds-button-primary" onClick={handleSubmitAll}>
              Submit choices
            </button>
          </div>
        </div>
      )}
    </>
  );
}
