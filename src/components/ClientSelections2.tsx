import { useState, useMemo, useEffect } from 'react';
import '../bds-tokens.css';
import './ClientSelections2.css';

/* ── Mock data ── */
type Tier = 'base' | 'upgrade';
interface Option {
  id: string; name: string; vendor: string; price: number; image: string;
  group: string; tier: Tier; images?: string[];
}
interface Category {
  id: string; name: string; vendor: string; allowance: number;
  dueDate: string; description: string; options: Option[];
}

const selectionGroups: Category[] = [
  {
    id: 'sel-1', name: 'Flooring', vendor: 'Cornerstone Flooring',
    allowance: 18500, dueDate: '2026-04-15',
    description: 'Pick the floor for each room.',
    options: [
      { id: 'fl-k1', name: 'Lifeproof Vinyl Plank — Dusk Cherry', vendor: 'Lifeproof', price: 3200, image: 'https://images.thdstatic.com/productImages/eb9b442d-4536-470d-81e4-f1bea67caf9d/svn/dusk-cherry-lifeproof-vinyl-plank-flooring-i06204lp-64_600.jpg', group: 'Kitchen', tier: 'base' },
      { id: 'fl-k2', name: 'Shaw Natural Classics — White Oak', vendor: 'Shaw', price: 4800, image: 'https://shawfloors.widen.net/content/maw31txwtx/jpeg/sw774_01147_main', group: 'Kitchen', tier: 'upgrade' },
      { id: 'fl-l1', name: 'TrafficMaster Laminate — Lakeshore Pecan', vendor: 'TrafficMaster', price: 2400, image: 'https://images.thdstatic.com/productImages/a08ca173-0a82-4dbe-90fb-7bdd3e8309a7/svn/lakeshore-pecan-stone-trafficmaster-laminate-wood-flooring-50560-77_600.jpg', group: 'Living', tier: 'base' },
      { id: 'fl-l2', name: 'Bruce Solid Hardwood — Butterscotch Oak', vendor: 'Bruce', price: 5800, image: 'https://images.thdstatic.com/productImages/c29747ad-e373-456b-8cdd-fc380f7fd554/svn/butterscotch-bruce-solid-hardwood-ahs626-64_1000.jpg', group: 'Living', tier: 'upgrade' },
      { id: 'fl-m1', name: 'Mohawk Plush Carpet — Sandstone', vendor: 'Mohawk', price: 1600, image: 'https://cdn11.bigcommerce.com/s-2d2cb/images/stencil/1280x1280/products/74638/189074/28326_00__21267.1668113654.jpg?c=2', group: 'Bedroom', tier: 'base' },
      { id: 'fl-m2', name: 'Stainmaster Berber Carpet — Driftwood', vendor: 'Stainmaster', price: 2300, image: 'https://mobileimages.lowes.com/productimages/fe119674-3be7-4753-ab30-ac78df03cf27/72813536.jpeg', group: 'Bedroom', tier: 'upgrade' },
    ],
  },
  {
    id: 'sel-2', name: 'Tile', vendor: 'Premier Tile & Stone',
    allowance: 9500, dueDate: '2026-05-01',
    description: 'Choose tile for backsplashes, shower walls, and bath floors.',
    options: [
      { id: 'tl-k1', name: 'White Subway Tile Backsplash', vendor: 'Merola', price: 620, image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg', group: 'Kitchen backsplash', tier: 'base' },
      { id: 'tl-k2', name: 'Marble Hexagon Backsplash', vendor: 'TileBar', price: 950, image: 'https://www.tileclub.com/cdn/shop/files/carrara-hexagon-tile-backsplash-2.jpg?v=1723504600', group: 'Kitchen backsplash', tier: 'upgrade' },
      { id: 'tl-mbf1', name: 'Porcelain Hex Tile — White', vendor: 'Merola', price: 2200, image: 'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg', group: 'Master bath floor', tier: 'base' },
      { id: 'tl-s3', name: 'Herringbone Marble Mosaic', vendor: 'TileBar', price: 1800, image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg', group: 'Master bath shower', tier: 'upgrade' },
      { id: 'tl-s4', name: 'Arabesque Lantern Mosaic', vendor: 'MSI', price: 1450, image: 'https://images.thdstatic.com/productImages/342247dc-6a7d-47d3-ad33-2e140184c3fe/svn/carrara-white-glass-tile-mabq-whi-10-4f_600.jpg', group: 'Master bath shower', tier: 'upgrade' },
    ],
  },
  {
    id: 'sel-3', name: 'Plumbing', vendor: 'Ferguson Plumbing Supply',
    allowance: 5800, dueDate: '2026-05-15',
    description: 'Pick faucets and sinks.',
    options: [
      { id: 'pl-ks1', name: 'Kraus Bellucci Undermount Sink', vendor: 'Kraus', price: 1890, image: 'https://images.thdstatic.com/productImages/fe4a0711-acbe-565f-bafa-1c99f5efca67/svn/metallic-black-kraus-undermount-kitchen-sinks-kguw2-33mbl-e1_600.jpg', group: 'Kitchen sink', tier: 'base' },
      { id: 'pl-ks2', name: 'Kohler Elmbrook Farmhouse Sink', vendor: 'Kohler', price: 2160, image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg', group: 'Kitchen sink', tier: 'upgrade' },
      { id: 'pl-kf2', name: 'Delta Kylo Touchless — Black', vendor: 'Delta', price: 780, image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg', group: 'Kitchen faucet', tier: 'upgrade' },
      { id: 'pl-mf2', name: 'Delta Trinsic Widespread — Matte Black', vendor: 'Delta', price: 380, image: 'https://m.media-amazon.com/images/I/71FK1buvW+L.jpg', group: 'Bath faucet', tier: 'upgrade' },
    ],
  },
  {
    id: 'sel-4', name: 'Countertops & cabinets', vendor: 'Allied Cabinets & Stone',
    allowance: 9200, dueDate: '2026-05-20',
    description: 'Pick countertop materials and vanity finishes.',
    options: [
      { id: 'cb-kc1', name: 'Granite — White Ice', vendor: 'MSI', price: 2800, image: 'https://cabinetmakerwarehouse.com/cdn/shop/files/Formica-9476-White-Ice-Granite-Traditiona-Kitchen-scaled.jpg?v=1717089142&width=1080', group: 'Kitchen counter', tier: 'base' },
      { id: 'cb-kc2', name: 'Quartz — Calacatta Laza', vendor: 'MSI', price: 3200, image: 'https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/large/calacatta-laza-quartz-4.jpg', group: 'Kitchen counter', tier: 'upgrade' },
      { id: 'cb-mv2', name: 'Double Vanity — 60" Espresso', vendor: 'Home Decorators', price: 2650, image: 'https://whalenfurniture.com/wp-content/uploads/2023/09/60in-Estehaus-Vanity_SL60EHV.jpg', group: 'Master bath vanity', tier: 'upgrade' },
      { id: 'cb-mm1', name: 'Frameless LED Mirror — 36"', vendor: 'TOOLKISS', price: 320, image: 'https://m.media-amazon.com/images/I/71uP4Hcb4jL.jpg', group: 'Master bath mirror', tier: 'base' },
    ],
  },
  {
    id: 'sel-5', name: 'Appliances', vendor: 'Capitol Appliance',
    allowance: 2400, dueDate: '2026-06-01',
    description: 'Pick your kitchen appliances.',
    options: [
      { id: 'ap-d1', name: 'GE Profile Dishwasher', vendor: 'GE', price: 1079, image: 'https://reviewed-com-res.cloudinary.com/image/fetch/s--1szEEAgv--/b_white,c_limit,cs_srgb,f_auto,fl_progressive.strip_profile,g_center,q_auto,w_1200/https://reviewed-production.s3.amazonaws.com/1662062743549/114647_Profile_Dish_CoBranding_2400x2500_1.jpeg', group: 'Dishwasher', tier: 'base' },
      { id: 'ap-d2', name: 'Bosch 500 Series Dishwasher', vendor: 'Bosch', price: 1349, image: 'https://us.bosch-press.com/pressportal/us/media/dam_images_us/pi266_usus/shp65dm5n_lifestyleimage_1_master.jpg', group: 'Dishwasher', tier: 'upgrade' },
    ],
  },
  {
    id: 'sel-6', name: 'Lighting', vendor: 'Capitol Lighting',
    allowance: 6000, dueDate: '2026-04-20',
    description: 'Already approved by your builder.',
    options: [
      { id: 'lt-1', name: 'Modern Chandelier — Dining', vendor: 'West Elm', price: 2400, image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg', group: 'Dining chandelier', tier: 'upgrade' },
      { id: 'lt-2', name: 'Recessed Lighting (8x)', vendor: 'Commercial Electric', price: 1920, image: 'https://images.thdstatic.com/productImages/b9e47a4d-a64c-4755-90eb-3cebd7d8b345/svn/white-commercial-electric-recessed-lighting-retrofit-trims-ns01da09fr2-259-1d_1000.jpg', group: 'Recessed', tier: 'base' },
      { id: 'lt-3', name: 'Pendants — Kitchen Island (3x)', vendor: 'Hukoro', price: 1350, image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg', group: 'Pendants', tier: 'base' },
    ],
  },
];

/* ── Helpers ── */
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtMoney = (n: number) => '$' + fmt(n);

function dueText(dateStr: string, isApproved: boolean): { label: string; tone: 'urgent' | 'soon' | 'ok' | 'done' } {
  if (isApproved) return { label: 'Locked in', tone: 'done' };
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, tone: 'urgent' };
  if (diff <= 7) return { label: `Due in ${diff}d`, tone: 'soon' };
  return { label: `Due ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, tone: 'ok' };
}

const CLIENT_FIRST = 'Rodger';
const JOB_NAME = 'Johnson Residence';

/* ── Status mapping (plain language for clients) ── */
function statusFor(cat: Category, picked: Set<string>, approved: Set<string>): {
  key: 'approved' | 'sent' | 'pending' | 'started' | 'overdue';
  label: string; tone: 'done' | 'sent' | 'urgent' | 'started' | 'pending';
} {
  if (approved.has(cat.id)) return { key: 'approved', label: 'Approved', tone: 'done' };
  const pickedHere = cat.options.filter(o => picked.has(o.id));
  const groupsHere = new Set(cat.options.map(o => o.group));
  const groupsPicked = new Set(pickedHere.map(o => o.group));
  if (groupsPicked.size === groupsHere.size && groupsHere.size > 0) {
    return { key: 'sent', label: 'Ready to send', tone: 'sent' };
  }
  const diff = Math.ceil((new Date(cat.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { key: 'overdue', label: 'Overdue', tone: 'urgent' };
  if (groupsPicked.size > 0) return { key: 'started', label: 'In progress', tone: 'started' };
  return { key: 'pending', label: 'Your pick', tone: 'pending' };
}

/* ── Component ── */
export default function ClientSelections2() {
  const [mobilePreview] = useState(true);
  const [openCatId, setOpenCatId] = useState<string | null>(null);
  const [tab, setTab] = useState<'decide' | 'saved' | 'updates'>('decide');
  const [saved, setSaved] = useState<Set<string>>(new Set(['fl-l2', 'tl-s3', 'pl-kf2', 'cb-mv2', 'ap-d2']));
  const [picked, setPicked] = useState<Set<string>>(new Set(['lt-1', 'lt-2', 'lt-3']));
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [approvedCats] = useState<Set<string>>(new Set(['sel-6']));
  const [askingId, setAskingId] = useState<string | null>(null);
  const [askDraft, setAskDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const toggleSaved = (id: string) => {
    setSaved(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); showToast('Removed from saved'); }
      else { n.add(id); showToast('Saved'); }
      return n;
    });
  };

  const pickOption = (id: string, group: string, catId: string) => {
    const cat = selectionGroups.find(c => c.id === catId)!;
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(id)) {
        n.delete(id);
        showToast('Pick undone');
      } else {
        cat.options.filter(o => o.group === group).forEach(o => n.delete(o.id));
        n.add(id);
        showToast('Picked');
      }
      return n;
    });
    setSkipped(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const skipOption = (id: string) => {
    setSkipped(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else { n.add(id); showToast('Skipped'); }
      return n;
    });
    setPicked(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  /* ── Computed ── */
  const totalAllowance = selectionGroups.reduce((s, c) => s + c.allowance, 0);
  const pickedCost = useMemo(() => selectionGroups.reduce((sum, cat) => {
    const groupTotals = new Map<string, number>();
    cat.options.forEach(o => {
      if (picked.has(o.id)) groupTotals.set(o.group, o.price);
    });
    return sum + Array.from(groupTotals.values()).reduce((a, b) => a + b, 0);
  }, 0), [picked]);
  const remaining = totalAllowance - pickedCost;

  const statuses = selectionGroups.map(c => statusFor(c, picked, approvedCats));
  const pendingCount = statuses.filter(s => s.key !== 'approved').length;
  const doneCount = statuses.filter(s => s.key === 'approved').length;
  const readyToSendCount = statuses.filter(s => s.key === 'sent').length;

  const upNext = selectionGroups
    .map((c, i) => ({ cat: c, st: statuses[i] }))
    .filter(({ st }) => st.key !== 'approved' && st.key !== 'sent')
    .sort((a, b) => new Date(a.cat.dueDate).getTime() - new Date(b.cat.dueDate).getTime())
    .slice(0, 4);

  const openCat = openCatId ? selectionGroups.find(c => c.id === openCatId) : null;
  const openStatus = openCat ? statusFor(openCat, picked, approvedCats) : null;

  const savedOptions = useMemo(() => {
    return selectionGroups.flatMap(c => c.options.filter(o => saved.has(o.id)).map(o => ({ ...o, catName: c.name, catId: c.id })));
  }, [saved]);

  const updates = useMemo(() => ([
    { id: 'u1', who: 'Sarah (your builder)', when: '2h ago', text: 'Lighting is approved on our end — looks great!', cat: 'Lighting' },
    { id: 'u2', who: 'Sarah (your builder)', when: 'Yesterday', text: 'Heads up: tile decision is due May 1 to keep the schedule.', cat: 'Tile' },
    { id: 'u3', who: 'System', when: '3d ago', text: 'New flooring options were added to your queue.', cat: 'Flooring' },
  ]), []);

  return (
    <>
      <div className={`cs2-container ${mobilePreview ? 'cs2-force-mobile' : ''}`}>
        <div className="cs2-app">
          {/* Header */}
          <header className="cs2-topbar">
            <div className="cs2-topbar-job">{JOB_NAME}</div>
            <button className="cs2-topbar-bell" aria-label="Notifications">
              <Icon name="bell" />
              {readyToSendCount + (pendingCount - readyToSendCount) > 0 && <span className="cs2-bell-dot" />}
            </button>
          </header>

          {/* Hero */}
          <section className="cs2-hero">
            <div className="cs2-hero-greet">Hi, {CLIENT_FIRST} 👋</div>
            <h1 className="cs2-hero-title">
              {pendingCount === 0
                ? `You're all done.`
                : `${pendingCount} pick${pendingCount === 1 ? '' : 's'} left.`}
            </h1>
            <p className="cs2-hero-sub">
              {pendingCount === 0 ? 'Sit back — your builder takes it from here.' : 'Take your time. Save what you like, ask questions, decide when ready.'}
            </p>

            <div className="cs2-stats">
              <div className="cs2-stat">
                <div className="cs2-stat-num cs2-stat-num-action">{pendingCount}</div>
                <div className="cs2-stat-label">Need you</div>
              </div>
              <div className="cs2-stat">
                <div className="cs2-stat-num cs2-stat-num-done">{doneCount}</div>
                <div className="cs2-stat-label">Approved</div>
              </div>
              <div className="cs2-stat">
                <div className="cs2-stat-num cs2-stat-num-budget">{fmtMoney(remaining)}</div>
                <div className="cs2-stat-label">Budget left</div>
              </div>
            </div>

            {readyToSendCount > 0 && (
              <button className="cs2-send-cta" onClick={() => showToast(`Sent ${readyToSendCount} to your builder`)}>
                Send {readyToSendCount} to builder
                <Icon name="arrow-right" />
              </button>
            )}
          </section>

          {tab === 'decide' && (
            <>
              {/* Up next horizontal scroll */}
              {upNext.length > 0 && (
                <section className="cs2-block">
                  <h2 className="cs2-block-title">Up next</h2>
                  <div className="cs2-upnext">
                    {upNext.map(({ cat, st }) => {
                      const due = dueText(cat.dueDate, false);
                      const top4 = cat.options.slice(0, 4);
                      return (
                        <button key={cat.id} className="cs2-upcard" onClick={() => setOpenCatId(cat.id)}>
                          <div className="cs2-upcard-mosaic">
                            {top4.map((o, i) => (
                              <div key={o.id} className={`cs2-upcard-tile cs2-upcard-tile-${i}`} style={{ backgroundImage: `url(${o.image})` }} />
                            ))}
                          </div>
                          <div className="cs2-upcard-body">
                            <div className="cs2-upcard-row">
                              <h3 className="cs2-upcard-name">{cat.name}</h3>
                              <span className={`cs2-pill cs2-pill-${st.tone}`}>{st.label}</span>
                            </div>
                            <div className="cs2-upcard-row">
                              <span className={`cs2-due cs2-due-${due.tone}`}>{due.label}</span>
                              <span className="cs2-upcard-budget">{fmtMoney(cat.allowance)} budget</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* All categories list */}
              <section className="cs2-block">
                <h2 className="cs2-block-title">All categories</h2>
                <ul className="cs2-cats">
                  {selectionGroups.map((cat, i) => {
                    const st = statuses[i];
                    const due = dueText(cat.dueDate, st.key === 'approved');
                    const thumb = cat.options[0]?.image;
                    return (
                      <li key={cat.id}>
                        <button className="cs2-cat-row" onClick={() => setOpenCatId(cat.id)}>
                          <div className="cs2-cat-thumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined} />
                          <div className="cs2-cat-mid">
                            <div className="cs2-cat-name">{cat.name}</div>
                            <div className="cs2-cat-meta">
                              <span className={`cs2-pill cs2-pill-${st.tone}`}>{st.label}</span>
                              <span className={`cs2-due cs2-due-${due.tone}`}>{due.label}</span>
                            </div>
                          </div>
                          <Icon name="chevron-right" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}

          {tab === 'saved' && (
            <section className="cs2-block">
              <h2 className="cs2-block-title">Saved for later</h2>
              {savedOptions.length === 0 ? (
                <div className="cs2-empty">
                  <div className="cs2-empty-icon">♡</div>
                  <div className="cs2-empty-title">Nothing saved yet</div>
                  <div className="cs2-empty-sub">Tap the heart on any option to save it for later.</div>
                </div>
              ) : (
                <div className="cs2-saved-grid">
                  {savedOptions.map(o => (
                    <article key={o.id} className="cs2-saved-card">
                      <div className="cs2-saved-img" style={{ backgroundImage: `url(${o.image})` }} onClick={() => setLightbox({ src: o.image, name: o.name })} />
                      <button className="cs2-saved-heart cs2-saved-heart-on" onClick={() => toggleSaved(o.id)} aria-label="Remove">
                        <Icon name="heart-fill" />
                      </button>
                      <div className="cs2-saved-body">
                        <div className="cs2-saved-cat">{o.catName}</div>
                        <div className="cs2-saved-name">{o.name}</div>
                        <div className="cs2-saved-price">{fmtMoney(o.price)}</div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'updates' && (
            <section className="cs2-block">
              <h2 className="cs2-block-title">Updates</h2>
              <ul className="cs2-updates">
                {updates.map(u => (
                  <li key={u.id} className="cs2-update">
                    <div className="cs2-update-avatar">{u.who[0]}</div>
                    <div className="cs2-update-body">
                      <div className="cs2-update-meta"><strong>{u.who}</strong> · {u.when}</div>
                      <div className="cs2-update-text">{u.text}</div>
                      <div className="cs2-update-tag">{u.cat}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="cs2-spacer" />
        </div>

        {/* Bottom tab bar */}
        <nav className="cs2-tabbar">
          <button className={`cs2-tab ${tab === 'decide' ? 'cs2-tab-on' : ''}`} onClick={() => setTab('decide')}>
            <Icon name="grid" />
            <span>Decide</span>
          </button>
          <button className={`cs2-tab ${tab === 'saved' ? 'cs2-tab-on' : ''}`} onClick={() => setTab('saved')}>
            <Icon name="heart" />
            <span>Saved {saved.size > 0 ? `(${saved.size})` : ''}</span>
          </button>
          <button className={`cs2-tab ${tab === 'updates' ? 'cs2-tab-on' : ''}`} onClick={() => setTab('updates')}>
            <Icon name="bell" />
            <span>Updates</span>
          </button>
        </nav>

        {/* Category sheet */}
        {openCat && openStatus && (
          <CategorySheet
            cat={openCat}
            status={openStatus}
            picked={picked}
            saved={saved}
            skipped={skipped}
            onPick={pickOption}
            onSkip={skipOption}
            onToggleSaved={toggleSaved}
            onAsk={(id) => { setAskingId(id); setAskDraft(''); }}
            onClose={() => setOpenCatId(null)}
            onImage={(src, name) => setLightbox({ src, name })}
          />
        )}

        {/* Ask sheet */}
        {askingId && (() => {
          const opt = selectionGroups.flatMap(c => c.options).find(o => o.id === askingId);
          if (!opt) return null;
          return (
            <div className="cs2-modal-overlay" onClick={() => setAskingId(null)}>
              <div className="cs2-ask" onClick={e => e.stopPropagation()}>
                <div className="cs2-ask-grip" />
                <div className="cs2-ask-header">
                  <div>
                    <div className="cs2-ask-title">Ask about this</div>
                    <div className="cs2-ask-sub">{opt.name}</div>
                  </div>
                  <button className="cs2-ask-close" onClick={() => setAskingId(null)} aria-label="Close"><Icon name="x" /></button>
                </div>
                <textarea
                  className="cs2-ask-input"
                  value={askDraft}
                  onChange={e => setAskDraft(e.target.value)}
                  placeholder="What's your question?"
                  autoFocus
                  rows={4}
                />
                <button
                  className="cs2-ask-send"
                  disabled={!askDraft.trim()}
                  onClick={() => { setAskingId(null); showToast('Question sent to builder'); }}
                >
                  Send to builder
                </button>
              </div>
            </div>
          );
        })()}

        {/* Lightbox */}
        {lightbox && (
          <div className="cs2-lightbox" onClick={() => setLightbox(null)}>
            <button className="cs2-lightbox-close" aria-label="Close"><Icon name="x" /></button>
            <img src={lightbox.src} alt={lightbox.name} />
            <div className="cs2-lightbox-cap">{lightbox.name}</div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="cs2-toast" role="status" aria-live="polite">
            <Icon name="check" /> {toast}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Category sheet ── */
function CategorySheet({
  cat, status, picked, saved, skipped, onPick, onSkip, onToggleSaved, onAsk, onClose, onImage,
}: {
  cat: Category;
  status: { key: string; label: string; tone: string };
  picked: Set<string>; saved: Set<string>; skipped: Set<string>;
  onPick: (id: string, group: string, catId: string) => void;
  onSkip: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAsk: (id: string) => void;
  onClose: () => void;
  onImage: (src: string, name: string) => void;
}) {
  const groups = Array.from(new Set(cat.options.map(o => o.group)));
  const due = dueText(cat.dueDate, status.key === 'approved');
  const pickedHere = cat.options.filter(o => picked.has(o.id));
  const spent = pickedHere.reduce((s, o) => s + o.price, 0);
  const overUnder = cat.allowance - spent;

  return (
    <div className="cs2-sheet-overlay" onClick={onClose}>
      <div className="cs2-sheet" onClick={e => e.stopPropagation()}>
        <div className="cs2-sheet-grip" />
        <header className="cs2-sheet-header">
          <div>
            <div className="cs2-sheet-eyebrow">
              <span className={`cs2-pill cs2-pill-${status.tone}`}>{status.label}</span>
              <span className={`cs2-due cs2-due-${due.tone}`}>{due.label}</span>
            </div>
            <h2 className="cs2-sheet-title">{cat.name}</h2>
            <p className="cs2-sheet-sub">{cat.description}</p>
          </div>
          <button className="cs2-sheet-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </header>

        {/* Budget bar */}
        <div className="cs2-budget">
          <div className="cs2-budget-row">
            <span className="cs2-budget-label">Your budget</span>
            <span className="cs2-budget-amt">{fmtMoney(cat.allowance)}</span>
          </div>
          <div className="cs2-budget-bar">
            <div
              className={`cs2-budget-fill ${spent > cat.allowance ? 'cs2-budget-fill-over' : ''}`}
              style={{ width: `${Math.min(100, (spent / cat.allowance) * 100)}%` }}
            />
          </div>
          <div className="cs2-budget-row">
            <span className="cs2-budget-spent">{fmtMoney(spent)} picked so far</span>
            <span className={`cs2-budget-rem ${overUnder < 0 ? 'cs2-over' : ''}`}>
              {overUnder >= 0 ? `${fmtMoney(overUnder)} left` : `${fmtMoney(Math.abs(overUnder))} over`}
            </span>
          </div>
        </div>

        <div className="cs2-sheet-body">
          {groups.map(g => (
            <div key={g} className="cs2-group">
              <h3 className="cs2-group-title">{g}</h3>
              <div className="cs2-options">
                {(() => {
                  const optsInGroup = cat.options.filter(o => o.group === g);
                  const baseOpt = optsInGroup.find(o => o.tier === 'base');
                  const builderPickIds = new Set(['fl-l2', 'tl-s3', 'pl-kf2', 'cb-mv2', 'ap-d2']);
                  return optsInGroup.map(opt => {
                  const isPicked = picked.has(opt.id);
                  const isSaved = saved.has(opt.id);
                  const isSkipped = skipped.has(opt.id);
                  const delta = baseOpt && opt.tier === 'upgrade' ? opt.price - baseOpt.price : 0;
                  const isBuilderPick = builderPickIds.has(opt.id);
                  return (
                    <article
                      key={opt.id}
                      className={`cs2-opt ${isPicked ? 'cs2-opt-picked' : ''} ${isSkipped ? 'cs2-opt-skipped' : ''}`}
                    >
                      <div className="cs2-opt-img-wrap" onClick={() => onImage(opt.image, opt.name)}>
                        <div className="cs2-opt-img" style={{ backgroundImage: `url(${opt.image})` }} />
                        {opt.tier === 'base' && <span className="cs2-opt-tier cs2-opt-tier-base">Included</span>}
                        {opt.tier === 'upgrade' && <span className="cs2-opt-tier">Upgrade</span>}
                        {isBuilderPick && <span className="cs2-opt-pick">★ Builder's pick</span>}
                        {isPicked && <div className="cs2-opt-picked-overlay"><Icon name="check" /></div>}
                      </div>
                      <div className="cs2-opt-content">
                        <div className="cs2-opt-row">
                          <div className="cs2-opt-name">{opt.name}</div>
                          <button
                            className={`cs2-heart ${isSaved ? 'cs2-heart-on' : ''}`}
                            onClick={() => onToggleSaved(opt.id)}
                            aria-label={isSaved ? 'Saved' : 'Save'}
                          >
                            <Icon name={isSaved ? 'heart-fill' : 'heart'} />
                          </button>
                        </div>
                        <div className="cs2-opt-vendor">{opt.vendor}</div>
                        <div className="cs2-opt-price-row">
                          <span className="cs2-opt-price">{fmtMoney(opt.price)}</span>
                          {delta > 0 && <span className="cs2-opt-delta">+{fmtMoney(delta)} over base</span>}
                          {opt.tier === 'base' && optsInGroup.some(o => o.tier === 'upgrade') && (
                            <span className="cs2-opt-delta cs2-opt-delta-good">Save vs upgrade</span>
                          )}
                        </div>
                        {status.key !== 'approved' && (
                          <div className="cs2-opt-actions">
                            <button className="cs2-act cs2-act-ask" onClick={() => onAsk(opt.id)}>
                              <Icon name="chat" /> Ask
                            </button>
                            <button
                              className={`cs2-act cs2-act-skip ${isSkipped ? 'cs2-act-skip-on' : ''}`}
                              onClick={() => onSkip(opt.id)}
                            >
                              <Icon name="x" /> Skip
                            </button>
                            <button
                              className={`cs2-act cs2-act-pick ${isPicked ? 'cs2-act-pick-on' : ''}`}
                              onClick={() => onPick(opt.id, opt.group, cat.id)}
                            >
                              <Icon name="check" /> {isPicked ? 'Picked' : 'Pick'}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                });
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Icons ── */
function Icon({ name }: { name: string }) {
  switch (name) {
    case 'check': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
    case 'x': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case 'heart': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>;
    case 'heart-fill': return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>;
    case 'chat': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    case 'bell': return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
    case 'grid': return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'arrow-right': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
    case 'chevron-right': return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>;
    case 'phone': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>;
    case 'desktop': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>;
    default: return null;
  }
}
