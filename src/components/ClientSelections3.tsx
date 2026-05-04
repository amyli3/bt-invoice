import { useState, useMemo, useEffect } from 'react';
import '../bds-tokens.css';
import { BdsButton, BdsBadge } from '../bds';
import ClientSelections2 from './ClientSelections2';

/* ── Selection 3 ──
 * Mobile-first client experience for selections.
 * Designed around the OOUX framework from Selections strategy 2026:
 *   Object: Allowance (container) → Option (choice)
 *   Actions: approve / decline / ask / view
 *   States: awaiting / approved / declined  (option)
 *           open / complete                 (allowance)
 *
 * The desktop frame is a phone mockup so the mobile-first design is honest
 * to its target form factor while still browsable in the prototype.
 *
 * BDS: production version should use BDS mobile patterns — top app bar,
 * bottom sheet, cards, action sheet. */

type OptionStatus = 'awaiting' | 'approved' | 'declined';
type Comment = { id: string; from: 'builder' | 'client'; text: string; ts: string };

type Option = {
  id: string;
  name: string;
  vendor: string;
  model?: string;
  finish?: string;
  price: number;
  qty: number;
  unit: string;
  image: string;
  description?: string;
  specs?: { label: string; value: string }[];
  group: string;
  status: OptionStatus;
  comments: Comment[];
};

type Allowance = {
  id: string;
  name: string;
  vendor: string;
  budget: number;
  dueDate: string;
  description: string;
  options: Option[];
};

const initialAllowances: Allowance[] = [
  {
    id: 'al-1',
    name: 'Kitchen plumbing',
    vendor: 'Ferguson Plumbing Supply',
    budget: 2400,
    dueDate: '2026-05-12',
    description: 'Sink and faucet for the new kitchen. Pick one of each.',
    options: [
      {
        id: 'op-ks1',
        name: 'Kraus Bellucci undermount sink',
        vendor: 'Kraus',
        model: 'KGUW1-33WH',
        finish: 'White granite composite',
        price: 1090,
        qty: 1,
        unit: 'ea',
        image: 'https://images.thdstatic.com/productImages/fe4a0711-acbe-565f-bafa-1c99f5efca67/svn/metallic-black-kraus-undermount-kitchen-sinks-kguw2-33mbl-e1_600.jpg',
        description: 'Single-bowl workstation sink with garbage disposal.',
        specs: [
          { label: 'Material', value: 'Granite composite' },
          { label: 'Mount', value: 'Undermount' },
          { label: 'Bowl', value: 'Single' },
          { label: 'Dimensions', value: '32" × 19"' },
        ],
        group: 'Sink',
        status: 'awaiting',
        comments: [
          { id: 'c1', from: 'builder', text: 'This is the spec we priced into your contract.', ts: 'Apr 22' },
        ],
      },
      {
        id: 'op-ks2',
        name: 'Kohler Elmbrook farmhouse sink',
        vendor: 'Kohler',
        model: 'K-28668-0',
        finish: 'White cast iron',
        price: 1360,
        qty: 1,
        unit: 'ea',
        image: 'https://images.thdstatic.com/productImages/d9b0b956-0169-4319-ad0e-f96098bc1fcc/svn/white-kohler-farmhouse-kitchen-sinks-k-28668-0-e1_600.jpg',
        description: 'Apron-front farmhouse sink, cast iron with enamel finish.',
        specs: [
          { label: 'Material', value: 'Cast iron' },
          { label: 'Mount', value: 'Apron-front' },
          { label: 'Bowl', value: 'Single' },
          { label: 'Dimensions', value: '33" × 18"' },
        ],
        group: 'Sink',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-kf1',
        name: 'Moen Arbor pull-down faucet',
        vendor: 'Moen',
        model: '7594SRS',
        finish: 'Spot-resist stainless',
        price: 320,
        qty: 1,
        unit: 'ea',
        image: 'https://m.media-amazon.com/images/I/81Tdwh-vFUL.jpg',
        description: 'High-arc pull-down sprayer with PowerBoost.',
        specs: [
          { label: 'Finish', value: 'Spot-resist stainless' },
          { label: 'Sprayer', value: 'Pull-down' },
          { label: 'Handles', value: 'Single' },
        ],
        group: 'Faucet',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-kf2',
        name: 'Delta Kylo touchless faucet',
        vendor: 'Delta',
        model: '9913T-BL-DST',
        finish: 'Matte black',
        price: 480,
        qty: 1,
        unit: 'ea',
        image: 'https://mobileimages.lowes.com/productimages/b9f5b84c-5ac7-417f-aa2c-4ba4131f2aa7/69082796.jpeg',
        description: 'Touchless pull-down faucet with motion sensor.',
        specs: [
          { label: 'Finish', value: 'Matte black' },
          { label: 'Sprayer', value: 'Touchless pull-down' },
          { label: 'Handles', value: 'Single' },
        ],
        group: 'Faucet',
        status: 'awaiting',
        comments: [
          { id: 'c2', from: 'builder', text: 'This is an upgrade — touchless adds about $160 over the base option.', ts: 'Apr 24' },
        ],
      },
    ],
  },
  {
    id: 'al-2',
    name: 'Master bath tile',
    vendor: 'Premier Tile & Stone',
    budget: 4200,
    dueDate: '2026-05-20',
    description: 'Floor and shower wall tile for the master bath.',
    options: [
      {
        id: 'op-tf1',
        name: 'Porcelain hex tile, white',
        vendor: 'Merola Tile',
        model: 'FCD10WTX',
        finish: 'Matte white',
        price: 1800,
        qty: 220,
        unit: 'sqft',
        image: 'https://images.thdstatic.com/productImages/356a61c1-2e11-4f60-8b64-1b35ad5f289b/svn/white-medium-sheen-merola-tile-porcelain-tile-fcd10wtx-e1_600.jpg',
        description: 'Classic hex floor tile, easy to maintain.',
        specs: [
          { label: 'Material', value: 'Porcelain' },
          { label: 'Size', value: '10" hex' },
          { label: 'Finish', value: 'Matte' },
        ],
        group: 'Floor',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-tf2',
        name: 'Carrara marble floor tile',
        vendor: 'TileBar',
        model: 'CARM-12X12',
        finish: 'Honed white',
        price: 2400,
        qty: 220,
        unit: 'sqft',
        image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSGYKPyoe2Rzl-1bS94z9jjJrgknQCps5Ce5qwPPfI0-R7MOIqopooLat3pDoWs2LmGHx0WEc3lGD93Gy0TnSnoFvsEsSami58-o4SCkcg0n9cgZLY_fdtC4w',
        description: 'Genuine Carrara marble floor tile.',
        specs: [
          { label: 'Material', value: 'Marble' },
          { label: 'Size', value: '12" × 12"' },
          { label: 'Finish', value: 'Honed' },
        ],
        group: 'Floor',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-tw1',
        name: 'Glossy white subway',
        vendor: 'Merola Tile',
        model: 'WEB3CHGW',
        finish: 'Glossy white',
        price: 980,
        qty: 110,
        unit: 'sqft',
        image: 'https://images.thdstatic.com/productImages/502e06ba-dcea-4c4b-b2f0-5cc5a55a2704/svn/glossy-white-merola-tile-ceramic-tile-web3chgw-64_600.jpg',
        description: 'Classic 3"×6" subway tile for the shower walls.',
        specs: [
          { label: 'Material', value: 'Ceramic' },
          { label: 'Size', value: '3" × 6"' },
          { label: 'Finish', value: 'Glossy' },
        ],
        group: 'Shower wall',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-tw2',
        name: 'Herringbone marble mosaic',
        vendor: 'TileBar',
        model: 'C72XH-HERR',
        finish: 'Honed white',
        price: 1900,
        qty: 110,
        unit: 'sqft',
        image: 'https://www.stonecenteronline.com/media/catalog/product/cache/f77b4f15034ebe734bb6931a52e0b5ed/c/7/c72xh-carrara-white-marble-1x3-herringbone-mosaic-tile-honed.jpg',
        description: 'Carrara marble mosaic in herringbone pattern.',
        specs: [
          { label: 'Material', value: 'Marble mosaic' },
          { label: 'Pattern', value: 'Herringbone' },
          { label: 'Finish', value: 'Honed' },
        ],
        group: 'Shower wall',
        status: 'awaiting',
        comments: [],
      },
    ],
  },
  {
    id: 'al-3',
    name: 'Lighting',
    vendor: 'Capitol Lighting',
    budget: 3200,
    dueDate: '2026-04-25',
    description: 'Statement fixtures for the kitchen, dining, and entry.',
    options: [
      {
        id: 'op-lt1',
        name: 'Modern brass chandelier',
        vendor: 'West Elm',
        model: 'WE-CH-08',
        finish: 'Brushed brass',
        price: 1200,
        qty: 1,
        unit: 'ea',
        image: 'https://images.thdstatic.com/productImages/10674fff-fe26-4bfd-b382-b9d2f4ffe230/svn/matte-gold-26-lnc-chandeliers-nbbfbzhd1362236-e4_600.jpg',
        description: '8-light modern chandelier for the dining room.',
        specs: [
          { label: 'Finish', value: 'Brushed brass' },
          { label: 'Bulbs', value: '8' },
          { label: 'Diameter', value: '32"' },
        ],
        group: 'Dining chandelier',
        status: 'awaiting',
        comments: [
          { id: 'c3', from: 'client', text: 'Love this one — please order it.', ts: 'Apr 18' },
          { id: 'c4', from: 'builder', text: 'Approved and added to your order list.', ts: 'Apr 19' },
        ],
      },
      {
        id: 'op-lt2',
        name: 'Black pendant set (3)',
        vendor: 'Hukoro',
        model: 'YLC900504',
        finish: 'Matte black',
        price: 720,
        qty: 3,
        unit: 'ea',
        image: 'https://images.thdstatic.com/productImages/ba4f0ae8-66d7-4ba0-8767-2482a5886153/svn/black-henveton-pendant-lights-ylc900504-1b-e1_1000.jpg',
        description: 'Three matching pendants for the kitchen island.',
        specs: [
          { label: 'Finish', value: 'Matte black' },
          { label: 'Quantity', value: '3' },
        ],
        group: 'Kitchen pendants',
        status: 'awaiting',
        comments: [],
      },
      {
        id: 'op-lt3',
        name: 'Recessed cans (8)',
        vendor: 'Commercial Electric',
        model: 'NS01DA09FR2-259',
        finish: 'White',
        price: 1280,
        qty: 8,
        unit: 'ea',
        image: 'https://images.thdstatic.com/productImages/b9e47a4d-a64c-4755-90eb-3cebd7d8b345/svn/white-commercial-electric-recessed-lighting-retrofit-trims-ns01da09fr2-259-1d_1000.jpg',
        description: '4" LED recessed lights for the great room.',
        specs: [
          { label: 'Type', value: 'LED recessed' },
          { label: 'Diameter', value: '4"' },
          { label: 'Quantity', value: '8' },
        ],
        group: 'Great room cans',
        status: 'awaiting',
        comments: [],
      },
    ],
  },
];

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function daysFromNow(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (d < 0) return { label: `${Math.abs(d)} days late`, tone: 'overdue' as const };
  if (d === 0) return { label: 'Due today', tone: 'urgent' as const };
  if (d === 1) return { label: 'Due tomorrow', tone: 'urgent' as const };
  if (d <= 7) return { label: `Due in ${d} days`, tone: 'soon' as const };
  return { label: `Due ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, tone: 'normal' as const };
}

/* ── Allowance state derivation ──
 * Open: any option still awaiting
 * Complete: every option approved or declined */
function getAllowanceState(a: Allowance) {
  const allDecided = a.options.every(o => o.status !== 'awaiting');
  return allDecided ? ('complete' as const) : ('open' as const);
}

function getApprovedTotal(a: Allowance) {
  return a.options.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0);
}

function getAwaitingCount(a: Allowance) {
  return a.options.filter(o => o.status === 'awaiting').length;
}

/* ── Icons (small inline SVG, no extra deps) ── */
const Icon = {
  back: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  message: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  store: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M5 9v11h14V9"/><path d="M9 22V12h6v10"/></svg>,
};

/* ── Status pill ── */
function StatusPill({ status, compact = false }: { status: OptionStatus; compact?: boolean }) {
  const cfg = {
    awaiting: { label: compact ? 'Awaiting' : 'Awaiting your choice', bg: '#FFF7DC', fg: '#854D00' },
    approved: { label: 'Approved', bg: '#DDFDEF', fg: '#057E4B' },
    declined: { label: 'Declined', bg: '#F1F4FA', fg: '#666D7C' },
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '3px 8px',
      borderRadius: 999, background: cfg.bg, color: cfg.fg,
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

/* ── Budget meter ── */
function BudgetMeter({ used, budget, compact = false }: { used: number; budget: number; compact?: boolean }) {
  const pct = budget > 0 ? Math.min(100, (used / budget) * 100) : 0;
  const over = used > budget;
  const remaining = budget - used;
  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#666D7C', fontWeight: 500 }}>
            ${fmt(used)} of ${fmt(budget)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: over ? '#B5254C' : '#057E4B' }}>
            {over ? `$${fmt(Math.abs(remaining))} over` : `$${fmt(remaining)} left`}
          </span>
        </div>
      )}
      <div style={{ height: 6, background: '#EAEEF5', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: over ? '#B5254C' : pct > 80 ? '#854D00' : '#057E4B',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}

/* ── Phone status bar ── */
function StatusBar() {
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      fontSize: 14, fontWeight: 600, color: '#202227',
      background: '#fff',
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0" y="6" width="3" height="5" rx="0.5" fill="#202227"/><rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="#202227"/><rect x="9" y="2" width="3" height="9" rx="0.5" fill="#202227"/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="#202227"/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 8.5L0.5 3 1.5 2 7 6.5 12.5 2 13.5 3z" fill="#202227"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="#202227"/><rect x="2" y="2" width="14" height="7" rx="1" fill="#202227"/><rect x="19.5" y="3.5" width="2" height="4" rx="1" fill="#202227"/></svg>
      </div>
    </div>
  );
}

/* ── Top app bar ── */
function AppBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div style={{
      height: 52, display: 'flex', alignItems: 'center',
      padding: '0 12px', borderBottom: '1px solid #EAEEF5',
      background: '#fff', position: 'sticky', top: 0, zIndex: 10,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 36, height: 36, border: 'none', background: 'transparent',
          color: '#202227', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: 8,
        }}>
          {Icon.back}
        </button>
      )}
      <div style={{
        flex: 1, fontSize: 16, fontWeight: 700, color: '#202227',
        textAlign: 'center', padding: onBack ? '0 8px' : '0 16px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {title}
      </div>
      <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

/* ── Version 1 wrapper ──
 * Lets the user flip between the desktop list view and CS2's mobile preview.
 * Both share CS2's visual language so they feel like one product at two sizes. */
function V1DesktopMobileWrap({
  allowances, onApprove, onDecline,
}: {
  allowances: Allowance[];
  onApprove: (allowanceId: string, optionId: string) => void;
  onDecline: (allowanceId: string, optionId: string) => void;
}) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const segBtn = (key: 'desktop' | 'mobile', label: string) => {
    const active = mode === key;
    return (
      <button
        onClick={() => setMode(key)}
        style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          background: active ? '#1A2939' : 'transparent',
          color: active ? '#fff' : '#4E555F',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          letterSpacing: '-0.005em',
        }}
      >{label}</button>
    );
  };
  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#FAF7F2' }}>
      <div style={{
        position: 'fixed', top: 216, right: 16, zIndex: 50,
        display: 'inline-flex', gap: 2, padding: 3,
        background: 'rgba(26, 41, 57, 0.06)', borderRadius: 999,
      }}>
        {segBtn('desktop', 'Desktop')}
        {segBtn('mobile', 'Mobile')}
      </div>
      {mode === 'desktop' ? (
        <DesktopAllowanceListView
          allowances={allowances}
          onApprove={onApprove}
          onDecline={onDecline}
        />
      ) : (
        <ClientSelections2 />
      )}
    </div>
  );
}

/* ── Desktop list view (Version 1) ──
 * Real desktop layout (multi-column, wide) but styled in CS2's mobile
 * design language — same warm palette, typography, and card aesthetic — so
 * the desktop and mobile experiences feel like the same product. */
function DesktopAllowanceListView({
  allowances, onApprove, onDecline,
}: {
  allowances: Allowance[];
  onApprove: (allowanceId: string, optionId: string) => void;
  onDecline: (allowanceId: string, optionId: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(allowances[0]?.id ?? null);
  const totalBudget = allowances.reduce((s, a) => s + a.budget, 0);
  const totalApproved = allowances.reduce((s, a) => s + getApprovedTotal(a), 0);
  const totalAwaiting = allowances.reduce((s, a) => s + getAwaitingCount(a), 0);
  const completeCount = allowances.filter(a => getAllowanceState(a) === 'complete').length;

  const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  const stat = (label: string, value: string, valueColor?: string) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '4px 8px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor || '#1A2939', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: '#8E96A0', fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );

  const statusPill = (status: OptionStatus) => {
    const map = {
      awaiting: { bg: 'rgba(181, 37, 76, 0.08)', fg: '#B5254C', label: 'Awaiting' },
      approved: { bg: 'rgba(5, 126, 75, 0.10)', fg: '#057E4B', label: 'Approved' },
      declined: { bg: 'rgba(26, 41, 57, 0.06)', fg: '#4E555F', label: 'Declined' },
    } as const;
    const s = map[status];
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 600,
        background: s.bg, color: s.fg, borderRadius: 999, letterSpacing: '-0.005em',
      }}>{s.label}</span>
    );
  };

  const allowanceStatusPill = (a: Allowance) => {
    const state = getAllowanceState(a);
    const awaiting = getAwaitingCount(a);
    if (state === 'complete') return statusPill('approved');
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', fontSize: 11, fontWeight: 600,
        background: 'rgba(181, 37, 76, 0.08)', color: '#B5254C',
        borderRadius: 999, letterSpacing: '-0.005em',
      }}>{awaiting} awaiting</span>
    );
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: '#FAF7F2',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
      color: '#1A2939',
      WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 64px' }}>
        <div style={{ fontSize: 13, color: '#4E555F', fontWeight: 500, marginBottom: 4 }}>Johnson Residence</div>
        <div style={{ fontSize: 14, color: '#4E555F', fontWeight: 500, marginBottom: 4 }}>Hi, Rodger 👋</div>
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: '#1A2939', lineHeight: 1.1,
          letterSpacing: '-0.025em', margin: '0 0 8px',
        }}>
          {totalAwaiting === 0 ? "You're all caught up." : `${totalAwaiting} pick${totalAwaiting === 1 ? '' : 's'} left.`}
        </h1>
        <p style={{ fontSize: 14, color: '#4E555F', lineHeight: 1.5, margin: '0 0 20px' }}>
          Review options for each allowance, then approve the ones you want.
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          background: '#FFFFFF', padding: '16px 8px',
          borderRadius: 20, border: '1px solid rgba(26, 41, 57, 0.06)',
          marginBottom: 24, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{ borderRight: '1px solid #EAEEF5' }}>{stat('Total budget', fmtMoney(totalBudget))}</div>
          <div style={{ borderRight: '1px solid #EAEEF5' }}>{stat('Approved', fmtMoney(totalApproved), '#057E4B')}</div>
          {stat('Awaiting', String(totalAwaiting), totalAwaiting > 0 ? '#B5254C' : undefined)}
        </div>

        <div style={{ fontSize: 12, color: '#8E96A0', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {completeCount} of {allowances.length} complete
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allowances.map((a) => {
            const isOpen = expandedId === a.id;
            const approvedTotal = getApprovedTotal(a);
            const due = daysFromNow(a.dueDate);
            return (
              <div key={a.id} style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid rgba(26, 41, 57, 0.06)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : a.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '2.4fr 1fr 1fr 1.2fr 32px',
                    gap: 16, width: '100%', padding: '18px 20px', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    alignItems: 'center', fontFamily: 'inherit', color: '#1A2939',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em' }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: '#8E96A0', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {Icon.store}
                      {a.vendor}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: due.tone === 'overdue' || due.tone === 'urgent' ? '#B5254C' : due.tone === 'soon' ? '#B5254C' : '#4E555F',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {Icon.clock}
                    {due.label}
                  </div>
                  <div>{allowanceStatusPill(a)}</div>
                  <div style={{ fontSize: 13, color: '#4E555F' }}>
                    <strong style={{ color: '#1A2939', fontWeight: 700 }}>{fmtMoney(approvedTotal)}</strong>
                    <span style={{ color: '#8E96A0' }}> / {fmtMoney(a.budget)}</span>
                  </div>
                  <div style={{
                    color: '#8E96A0', display: 'flex', justifyContent: 'flex-end',
                    transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s',
                  }}>{Icon.chevron}</div>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #EAEEF5' }}>
                    {a.description && (
                      <p style={{ fontSize: 13, color: '#4E555F', margin: '14px 0 16px', lineHeight: 1.5 }}>{a.description}</p>
                    )}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12,
                    }}>
                      {a.options.map(opt => (
                        <div key={opt.id} style={{
                          background: '#FAF7F2', border: '1px solid rgba(26, 41, 57, 0.06)',
                          borderRadius: 14, overflow: 'hidden',
                          display: 'flex', flexDirection: 'column',
                        }}>
                          <div style={{
                            width: '100%', aspectRatio: '4/3', background: '#EAEEF5',
                            backgroundImage: `url(${opt.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                          }} />
                          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{opt.name}</div>
                                <div style={{ fontSize: 12, color: '#8E96A0', marginTop: 2 }}>{opt.vendor}</div>
                              </div>
                              {statusPill(opt.status)}
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: '#1A2939', letterSpacing: '-0.02em' }}>{fmtMoney(opt.price)}</div>
                            {opt.status === 'awaiting' && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                <button
                                  onClick={() => onDecline(a.id, opt.id)}
                                  style={{
                                    flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: 600,
                                    background: '#fff', color: '#4E555F',
                                    border: '1px solid rgba(26, 41, 57, 0.12)',
                                    borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                                  }}
                                >Decline</button>
                                <button
                                  onClick={() => onApprove(a.id, opt.id)}
                                  style={{
                                    flex: 1, padding: '10px 12px', fontSize: 13, fontWeight: 600,
                                    background: '#1A2939', color: '#fff', border: 'none',
                                    borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                                  }}
                                >Approve</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Phone frame wrapper for desktop preview ── */
function PhoneFrame({
  children, version, onVersionChange,
}: {
  children: React.ReactNode;
  version: 'v1' | 'v2' | 'v3';
  onVersionChange: (v: 'v1' | 'v2' | 'v3') => void;
}) {
  const tabBtn = (key: 'v1' | 'v2' | 'v3', label: string, sub: string) => {
    const active = version === key;
    return (
      <button
        onClick={() => onVersionChange(key)}
        style={{
          width: '100%', padding: '8px 12px', border: 'none', cursor: 'pointer',
          background: active ? '#fff' : 'transparent',
          color: active ? '#202227' : '#666D7C',
          borderRadius: 8, fontFamily: 'inherit',
          textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1,
          boxShadow: active ? '0 1px 3px rgba(20,28,50,0.08), 0 0 0 1px rgba(20,28,50,0.06)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 10, color: active ? '#666D7C' : '#8E96A0', fontWeight: 500 }}>{sub}</span>
      </button>
    );
  };
  const isV1 = version === 'v1';
  return (
    <div style={{
      minHeight: '100vh',
      background: isV1 ? '#FAFBFC' : 'linear-gradient(180deg, #F1F4FA, #E8ECF3)',
      padding: isV1 ? '0' : '16px 16px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      position: 'relative',
    }}>
      {/* Floating version tabs — top right of the page */}
      <div style={{
        position: 'fixed',
        top: 64, right: 16,
        background: '#EAEEF5', borderRadius: 10, padding: 3,
        display: 'flex', flexDirection: 'column', gap: 3,
        width: 156, zIndex: 50,
        boxShadow: '0 4px 12px rgba(20, 28, 50, 0.06)',
      }}>
        {tabBtn('v1', 'Version 1', 'Desktop view')}
        {tabBtn('v2', 'Version 2', 'Browse list')}
        {tabBtn('v3', 'Version 3', 'Swipe deck')}
      </div>
      {isV1 ? (
        <div style={{ width: '100%', flex: 1, alignSelf: 'stretch' }}>
          {children}
        </div>
      ) : (
        <div style={{
          width: 340, height: 'min(820px, calc(100vh - 80px))',
          background: '#000', borderRadius: 42,
          padding: 10, boxShadow: '0 20px 60px rgba(20, 28, 50, 0.18), 0 0 0 1px rgba(20, 28, 50, 0.08)',
          position: 'relative',
        }}>
          <div style={{
            width: '100%', height: '100%', background: '#fff',
            borderRadius: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              width: 110, height: 28, background: '#000', borderRadius: 999, zIndex: 100,
            }} />
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Home view ── */
function HomeView({
  allowances, onOpen, onOpenNotifications, awaitingTotal,
}: {
  allowances: Allowance[];
  onOpen: (id: string) => void;
  onOpenNotifications: () => void;
  awaitingTotal: number;
}) {
  const totalBudget = allowances.reduce((s, a) => s + a.budget, 0);
  const totalApproved = allowances.reduce((s, a) => s + getApprovedTotal(a), 0);
  const totalRemaining = totalBudget - totalApproved;

  // Sort: open + most urgent first, then complete
  const sorted = [...allowances].sort((a, b) => {
    const aState = getAllowanceState(a);
    const bState = getAllowanceState(b);
    if (aState !== bState) return aState === 'open' ? -1 : 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <>
      <StatusBar />
      <AppBar
        title="Selections"
        right={
          <button onClick={onOpenNotifications} style={{
            position: 'relative', width: 36, height: 36, border: 'none',
            background: 'transparent', color: '#202227', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
          }}>
            {Icon.bell}
            {awaitingTotal > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, borderRadius: 999,
                background: '#B5254C', color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>{awaitingTotal}</span>
            )}
          </button>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC' }}>
        {/* Job hero */}
        <div style={{ padding: '20px 20px 16px', background: '#fff', borderBottom: '1px solid #EAEEF5' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666D7C', marginBottom: 4 }}>Johnson Residence</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#202227', lineHeight: 1.2, marginBottom: 4 }}>
            {awaitingTotal > 0 ? `${awaitingTotal} ${awaitingTotal === 1 ? 'choice' : 'choices'} to make` : 'All caught up'}
          </div>
          <div style={{ fontSize: 13, color: '#4E555F', lineHeight: 1.5 }}>
            {awaitingTotal > 0
              ? "Review what your builder shared, then approve or decline."
              : "You've made all your selections. Your builder will reach out if anything changes."}
          </div>
        </div>

        {/* Budget summary card */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            background: '#fff', border: '1px solid #EAEEF5', borderRadius: 14,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#202227' }}>Selection budget</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: totalRemaining < 0 ? '#B5254C' : '#057E4B' }}>
                {totalRemaining < 0 ? `$${fmt(Math.abs(totalRemaining))} over` : `$${fmt(totalRemaining)} left`}
              </span>
            </div>
            <BudgetMeter used={totalApproved} budget={totalBudget} compact />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#666D7C' }}>
              <span>${fmt(totalApproved)} approved</span>
              <span>${fmt(totalBudget)} total</span>
            </div>
          </div>
        </div>

        {/* Allowance list */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#202227', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Categories
          </div>
          {sorted.map(a => {
            const state = getAllowanceState(a);
            const awaiting = getAwaitingCount(a);
            const approvedTotal = getApprovedTotal(a);
            const due = daysFromNow(a.dueDate);
            const dueColor = due.tone === 'overdue' ? '#B5254C'
              : due.tone === 'urgent' ? '#854D00'
              : due.tone === 'soon' ? '#854D00'
              : '#666D7C';
            const dueBg = due.tone === 'overdue' ? '#FFEEEA'
              : due.tone === 'urgent' ? '#FDF3D3'
              : due.tone === 'soon' ? '#FDF3D3'
              : '#F1F4FA';
            return (
              <button
                key={a.id}
                onClick={() => onOpen(a.id)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: '#fff', border: '1px solid #EAEEF5', borderRadius: 14,
                  padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#202227', marginBottom: 2, wordBreak: 'break-word' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#666D7C', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                      <span style={{ flexShrink: 0, display: 'inline-flex' }}>{Icon.store}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.vendor}</span>
                    </div>
                  </div>
                  <div style={{ color: '#C7D0D9', flexShrink: 0 }}>{Icon.chevron}</div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {state === 'complete' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 999, background: '#DDFDEF', color: '#057E4B',
                    }}>
                      {Icon.check}<span>Complete</span>
                    </span>
                  ) : awaiting > 0 ? (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 999, background: '#FFF7DC', color: '#854D00',
                    }}>
                      {awaiting} {awaiting === 1 ? 'choice' : 'choices'} awaiting
                    </span>
                  ) : null}
                  {state !== 'complete' && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 999, background: dueBg, color: dueColor,
                    }}>
                      {Icon.clock}<span>{due.label}</span>
                    </span>
                  )}
                </div>

                <BudgetMeter used={approvedTotal} budget={a.budget} />
              </button>
            );
          })}
        </div>

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

/* ── Allowance detail view ── */
function AllowanceView({
  allowance, onBack, onOpenOption, onApprove, onDecline,
}: {
  allowance: Allowance;
  onBack: () => void;
  onOpenOption: (id: string) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const approved = getApprovedTotal(allowance);
  const groups = useMemo(() => {
    const map = new Map<string, Option[]>();
    allowance.options.forEach(o => {
      if (!map.has(o.group)) map.set(o.group, []);
      map.get(o.group)!.push(o);
    });
    return Array.from(map.entries());
  }, [allowance]);

  const due = daysFromNow(allowance.dueDate);

  return (
    <>
      <StatusBar />
      <AppBar title={allowance.name} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC' }}>
        {/* Allowance summary */}
        <div style={{ padding: 20, background: '#fff', borderBottom: '1px solid #EAEEF5' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666D7C', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{Icon.store}<span>{allowance.vendor}</span></span>
            <span style={{ color: '#C7D0D9' }}>·</span>
            <span style={{ color: due.tone === 'overdue' ? '#B5254C' : due.tone === 'urgent' ? '#854D00' : '#666D7C' }}>
              {due.label}
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#4E555F', lineHeight: 1.5, margin: '0 0 14px' }}>
            {allowance.description}
          </p>
          <BudgetMeter used={approved} budget={allowance.budget} />
        </div>

        {/* Groups of options */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map(([groupName, opts]) => (
            <div key={groupName}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#202227', textTransform: 'uppercase',
                letterSpacing: 0.4, padding: '0 4px 8px',
              }}>
                {groupName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {opts.map(o => (
                  <OptionCard
                    key={o.id}
                    option={o}
                    onOpen={() => onOpenOption(o.id)}
                    onApprove={() => onApprove(o.id)}
                    onDecline={() => onDecline(o.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 32 }} />
      </div>
    </>
  );
}

/* ── Option card ── */
function OptionCard({
  option, onOpen, onApprove, onDecline,
}: {
  option: Option;
  onOpen: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const unread = option.comments.filter(c => c.from === 'builder').length;
  return (
    <div style={{
      background: '#fff', border: '1px solid #EAEEF5', borderRadius: 14,
      overflow: 'hidden', opacity: option.status === 'declined' ? 0.65 : 1,
    }}>
      <button
        onClick={onOpen}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer', background: 'transparent',
          border: 'none', padding: 0, fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: '100%', height: 160, backgroundImage: `url(${option.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundColor: '#F1F4FA',
        }} />
        <div style={{ padding: '12px 14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {option.vendor}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#202227', lineHeight: 1.3, marginTop: 2, wordBreak: 'break-word' }}>
                {option.name}
              </div>
            </div>
            <StatusPill status={option.status} compact />
          </div>
          <div style={{ fontSize: 13, color: '#4E555F', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: '#202227' }}>${fmt(option.price)}</span>
            <span style={{ color: '#8E96A0' }}> · {option.qty} {option.unit}</span>
            {unread > 0 && (
              <span style={{
                marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#004FD6', fontWeight: 600,
              }}>
                {Icon.message}<span>{unread} {unread === 1 ? 'note' : 'notes'} from builder</span>
              </span>
            )}
          </div>
        </div>
      </button>

      {option.status === 'awaiting' ? (
        <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
          <BdsButton
            text="Decline"
            displayType="tertiary"
            onClick={onDecline}
            style={{ flex: 1 }}
            icon={Icon.x}
          />
          <BdsButton
            text="Approve"
            displayType="primary"
            onClick={onApprove}
            style={{ flex: 1 }}
            icon={Icon.check}
          />
        </div>
      ) : (
        <div style={{ padding: '0 14px 14px' }}>
          <BdsButton
            text="View details"
            displayType="tertiary"
            onClick={onOpen}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Option detail view ── */
function OptionView({
  option, allowance, onBack, onApprove, onDecline, onAddComment,
}: {
  option: Option;
  allowance: Allowance;
  onBack: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onAddComment: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onAddComment(t);
    setDraft('');
  };

  // Forecast: how this option would affect the budget if approved/declined
  const otherApproved = allowance.options
    .filter(o => o.id !== option.id && o.status === 'approved')
    .reduce((s, o) => s + o.price, 0);
  const ifApproved = allowance.budget - (otherApproved + option.price);

  return (
    <>
      <StatusBar />
      <AppBar title="Option" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          width: '100%', height: 200, backgroundImage: `url(${option.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#F1F4FA',
          flexShrink: 0,
        }} />

        <div style={{ background: '#fff', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#666D7C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.vendor}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#202227', lineHeight: 1.25, marginTop: 2, wordBreak: 'break-word' }}>
                {option.name}
              </div>
            </div>
            <StatusPill status={option.status} compact />
          </div>

          {option.description && (
            <p style={{ fontSize: 14, color: '#4E555F', lineHeight: 1.5, margin: '0 0 16px' }}>
              {option.description}
            </p>
          )}

          {/* Line items */}
          <div style={{
            background: '#F7F9FC', border: '1px solid #EAEEF5', borderRadius: 12,
            padding: 14, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666D7C', marginBottom: 8 }}>
              <span>Unit price</span>
              <span>${fmt2(option.price / option.qty)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666D7C', marginBottom: 8 }}>
              <span>Quantity</span>
              <span>{option.qty} {option.unit}</span>
            </div>
            <div style={{ borderTop: '1px solid #EAEEF5', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#202227' }}>
              <span>Total</span>
              <span>${fmt2(option.price)}</span>
            </div>
          </div>

          {/* Specs */}
          {option.specs && option.specs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#202227', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                Specs
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {option.specs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#666D7C' }}>{s.label}</span>
                    <span style={{ color: '#202227', fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget impact */}
          {option.status === 'awaiting' && (
            <div style={{
              background: '#F0F8FF', border: '1px solid #CCE0FA', borderRadius: 12,
              padding: 14, marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#004FD6', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                If you approve this
              </div>
              <div style={{ fontSize: 14, color: '#202227', lineHeight: 1.5 }}>
                {ifApproved >= 0
                  ? <>You'll have <strong>${fmt(ifApproved)} left</strong> in the {allowance.name.toLowerCase()} budget.</>
                  : <>You'll be <strong style={{ color: '#B5254C' }}>${fmt(Math.abs(ifApproved))} over</strong> the {allowance.name.toLowerCase()} budget.</>
                }
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#202227', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
              Conversation
            </div>
            {option.comments.length === 0 ? (
              <div style={{ fontSize: 13, color: '#8E96A0', padding: '12px 0' }}>
                No notes yet. Ask your builder anything about this option.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                {option.comments.map(c => (
                  <div
                    key={c.id}
                    style={{
                      alignSelf: c.from === 'client' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: c.from === 'client' ? '#004FD6' : '#F1F4FA',
                      color: c.from === 'client' ? '#fff' : '#202227',
                      padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.4,
                    }}
                  >
                    <div>{c.text}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                      {c.from === 'client' ? 'You' : 'Your builder'} · {c.ts}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="Ask a question…"
                style={{
                  flex: 1, padding: '10px 12px', fontSize: 13,
                  border: '1px solid #DEE3EB', borderRadius: 999,
                  fontFamily: 'inherit', outline: 'none', background: '#fff',
                }}
              />
              <BdsButton
                text="Send"
                displayType="secondary"
                onClick={submit}
                disabled={!draft.trim()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      {option.status === 'awaiting' && (
        <div style={{
          padding: 16, background: '#fff', borderTop: '1px solid #EAEEF5',
          display: 'flex', gap: 10,
        }}>
          <BdsButton
            text="Decline"
            displayType="tertiary"
            onClick={onDecline}
            style={{ flex: 1 }}
            icon={Icon.x}
          />
          <BdsButton
            text="Approve"
            displayType="primary"
            onClick={onApprove}
            style={{ flex: 1 }}
            icon={Icon.check}
          />
        </div>
      )}
      {option.status === 'approved' && (
        <div style={{
          padding: 16, background: '#fff', borderTop: '1px solid #EAEEF5',
          display: 'flex', gap: 10,
        }}>
          <BdsButton
            text="Change my mind"
            displayType="tertiary"
            onClick={onDecline}
            style={{ flex: 1 }}
          />
        </div>
      )}
      {option.status === 'declined' && (
        <div style={{
          padding: 16, background: '#fff', borderTop: '1px solid #EAEEF5',
          display: 'flex', gap: 10,
        }}>
          <BdsButton
            text="Reconsider"
            displayType="primary"
            onClick={onApprove}
            style={{ flex: 1 }}
          />
        </div>
      )}
    </>
  );
}

/* ── Notification sheet ── */
function NotificationSheet({
  allowances, onClose, onJump,
}: {
  allowances: Allowance[];
  onClose: () => void;
  onJump: (allowanceId: string, optionId?: string) => void;
}) {
  const items: { allowanceId: string; optionId?: string; title: string; body: string; ts: string }[] = [];
  allowances.forEach(a => {
    a.options.forEach(o => {
      o.comments.filter(c => c.from === 'builder').forEach(c => {
        items.push({
          allowanceId: a.id, optionId: o.id,
          title: `${a.name} · ${o.name}`,
          body: c.text, ts: c.ts,
        });
      });
    });
    const due = daysFromNow(a.dueDate);
    if (due.tone === 'overdue' || due.tone === 'urgent' || due.tone === 'soon') {
      const awaiting = getAwaitingCount(a);
      if (awaiting > 0) {
        items.push({
          allowanceId: a.id,
          title: a.name,
          body: `${awaiting} ${awaiting === 1 ? 'choice' : 'choices'} ${due.label.toLowerCase()}`,
          ts: '',
        });
      }
    }
  });

  return (
    <>
      <StatusBar />
      <AppBar title="Notifications" onBack={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: 16 }}>
        {items.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#8E96A0', fontSize: 14 }}>
            You're all caught up.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => onJump(it.allowanceId, it.optionId)}
                style={{
                  textAlign: 'left', cursor: 'pointer', background: '#fff',
                  border: '1px solid #EAEEF5', borderRadius: 12, padding: 14,
                  fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#202227' }}>{it.title}</div>
                <div style={{ fontSize: 13, color: '#4E555F', lineHeight: 1.4 }}>{it.body}</div>
                {it.ts && <div style={{ fontSize: 11, color: '#8E96A0' }}>{it.ts}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Swipe Allowance View (v2) ──
 * Tinder-like deck. One option at a time. Big image, big buttons.
 * Skips already-decided options when entering. */
function SwipeAllowanceView({
  allowance, onBack, onOpenOption, onApprove, onDecline, onFavorite, onMaybe,
  favorited, maybe,
}: {
  allowance: Allowance;
  onBack: () => void;
  onOpenOption: (id: string) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onFavorite: (id: string) => void;
  onMaybe: (id: string) => void;
  favorited: Set<string>;
  maybe: Set<string>;
}) {
  // Build a deck of options that still need a decision (or any if none awaiting)
  const allOpts = allowance.options;
  const awaitingOpts = allOpts.filter(o => o.status === 'awaiting');
  const deckSource = awaitingOpts.length > 0 ? awaitingOpts : allOpts;

  const [idx, setIdx] = useState(0);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | 'fade' | null>(null);
  type DeckAction = 'approve' | 'decline' | 'favorite' | 'maybe';
  const [history, setHistory] = useState<{ optId: string; action: DeckAction }[]>([]);

  // Reset if allowance changes
  useEffect(() => { setIdx(0); setHistory([]); }, [allowance.id]);

  const total = deckSource.length;
  const current = deckSource[idx];
  const isDone = idx >= total;

  const approved = allowance.options.filter(o => o.status === 'approved').reduce((s, o) => s + o.price, 0);
  const projected = approved + history
    .filter(h => h.action === 'approve')
    .reduce((s, h) => {
      const o = allOpts.find(x => x.id === h.optId);
      // Avoid double-counting if option was already approved
      return o && o.status !== 'approved' ? s + o.price : s;
    }, 0);
  const remaining = allowance.budget - projected;

  const handleAction = (action: DeckAction) => {
    if (!current) return;
    const dirMap = { approve: 'right', decline: 'left', favorite: 'up', maybe: 'fade' } as const;
    setSwipeDir(dirMap[action]);
    setHistory(prev => [...prev, { optId: current.id, action }]);
    if (action === 'approve') onApprove(current.id);
    else if (action === 'decline') onDecline(current.id);
    else if (action === 'favorite') onFavorite(current.id);
    else onMaybe(current.id);
    setTimeout(() => {
      setSwipeDir(null);
      setIdx(i => i + 1);
    }, 240);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    // Revert by setting back to awaiting via approve/decline toggle: easier to just call setOptionStatus,
    // but we don't have it here — flip state by approving if last was decline & vice versa is wrong.
    // Cleanest: use the parent handlers to bring it back to awaiting via a custom flow. For prototype,
    // simply move index back; user can re-decide. The state remains the latest decision.
    setHistory(prev => prev.slice(0, -1));
    setIdx(i => Math.max(0, i - 1));
    void last;
  };

  // ── Done summary ──
  if (isDone) {
    const finalApproved = allowance.options.filter(o => o.status === 'approved');
    const finalDeclined = allowance.options.filter(o => o.status === 'declined');
    const finalTotal = finalApproved.reduce((s, o) => s + o.price, 0);
    const diff = allowance.budget - finalTotal;
    return (
      <>
        <StatusBar />
        <AppBar title={allowance.name} onBack={onBack} />
        <div style={{ flex: 1, overflowY: 'auto', background: '#F7F9FC', padding: 20 }}>
          <div style={{
            background: '#fff', border: '1px solid #EAEEF5', borderRadius: 16,
            padding: 24, textAlign: 'center', marginBottom: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 999, background: '#DDFDEF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#057E4B',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#202227', marginBottom: 4 }}>
              All choices made
            </div>
            <div style={{ fontSize: 14, color: '#4E555F', lineHeight: 1.5 }}>
              Your builder will get a notification with your decisions.
            </div>
          </div>

          <div style={{
            background: '#fff', border: '1px solid #EAEEF5', borderRadius: 14, padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#202227', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>
              Budget summary
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#666D7C' }}>Budget</span>
              <span style={{ color: '#202227', fontWeight: 600 }}>${fmt(allowance.budget)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: '#666D7C' }}>Approved</span>
              <span style={{ color: '#202227', fontWeight: 600 }}>${fmt(finalTotal)}</span>
            </div>
            <div style={{ borderTop: '1px solid #EAEEF5', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: '#202227' }}>{diff >= 0 ? 'Remaining' : 'Over budget'}</span>
              <span style={{ color: diff < 0 ? '#B5254C' : '#057E4B' }}>
                {diff < 0 ? '+' : ''}${fmt(Math.abs(diff))}
              </span>
            </div>
          </div>

          {finalApproved.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#202227', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                Approved ({finalApproved.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {finalApproved.map(o => (
                  <div key={o.id} style={{
                    background: '#fff', border: '1px solid #EAEEF5', borderRadius: 12,
                    padding: 12, display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      backgroundImage: `url(${o.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: '#F1F4FA', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#202227', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: '#666D7C' }}>{o.group}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#202227' }}>${fmt(o.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {finalDeclined.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
                Declined ({finalDeclined.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {finalDeclined.map(o => (
                  <div key={o.id} style={{
                    background: '#fff', border: '1px solid #EAEEF5', borderRadius: 12,
                    padding: 12, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7,
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      backgroundImage: `url(${o.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                      backgroundColor: '#F1F4FA', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#666D7C', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: '#8E96A0' }}>{o.group}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <BdsButton
            text="Back to selections"
            displayType="primary"
            onClick={onBack}
            style={{ width: '100%' }}
          />
        </div>
      </>
    );
  }

  if (!current) return null;
  const next = deckSource[idx + 1];
  const ifApproved = allowance.budget - projected - current.price;

  return (
    <>
      <StatusBar />
      {/* Custom top bar with progress + budget */}
      <div style={{
        height: 64, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', borderBottom: '1px solid #EAEEF5',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, border: 'none', background: 'transparent',
          color: '#202227', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', borderRadius: 8,
        }}>
          {Icon.x}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#202227', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {idx + 1} of {total} · {allowance.name}
          </div>
          <div style={{ height: 4, background: '#EAEEF5', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${((idx + 1) / total) * 100}%`, height: '100%',
              background: '#004FD6', transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 999,
          background: remaining < 0 ? '#FFEEEA' : '#DDFDEF',
          display: 'inline-flex', alignItems: 'baseline', gap: 4,
          flexShrink: 1, minWidth: 0, maxWidth: '40%',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: remaining < 0 ? '#B5254C' : '#057E4B',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            ${fmt(Math.abs(remaining))}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: remaining < 0 ? '#B5254C' : '#057E4B',
            opacity: 0.8, textTransform: 'lowercase',
          }}>
            {remaining < 0 ? 'over' : 'left'}
          </span>
        </div>
      </div>

      {/* Card stack */}
      <div style={{
        flex: 1, padding: '12px 12px 0', position: 'relative',
        background: '#F7F9FC', overflow: 'hidden', minHeight: 0,
      }}>
        {/* Peek of next card */}
        {next && (
          <div style={{
            position: 'absolute', top: 20, left: 22, right: 22, height: 'calc(100% - 28px)',
            background: '#fff', border: '1px solid #EAEEF5', borderRadius: 16,
            transform: 'scale(0.95)', opacity: 0.5, pointerEvents: 'none',
          }} />
        )}
        {/* Current card */}
        <div
          onClick={() => onOpenOption(current.id)}
          style={{
            position: 'relative',
            background: '#fff', border: '1px solid #EAEEF5', borderRadius: 18,
            height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            cursor: 'pointer',
            transform: swipeDir === 'right' ? 'translateX(120%) rotate(12deg)'
              : swipeDir === 'left' ? 'translateX(-120%) rotate(-12deg)'
              : swipeDir === 'up' ? 'translateY(-120%) scale(0.9)'
              : 'none',
            opacity: swipeDir ? 0 : 1,
            transition: swipeDir ? 'transform 0.24s ease, opacity 0.24s ease' : 'none',
          }}
        >
          <div style={{
            width: '100%', flex: '0 0 56%',
            backgroundImage: `url(${current.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: '#F1F4FA', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 700, color: '#202227',
              textTransform: 'uppercase', letterSpacing: 0.3,
            }}>
              {current.group}
            </div>
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              padding: '6px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Tap for details</span>
            </div>
          </div>
          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#666D7C', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.vendor}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#202227', lineHeight: 1.25, marginBottom: 6, wordBreak: 'break-word' }}>
              {current.name}
            </div>
            {current.description && (
              <div style={{
                fontSize: 12, color: '#4E555F', lineHeight: 1.4, marginBottom: 10,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}>
                {current.description}
              </div>
            )}
            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#202227' }}>
                  ${fmt(current.price)}
                </span>
                <span style={{ fontSize: 12, color: '#8E96A0', flexShrink: 0 }}>
                  {current.qty} {current.unit}
                </span>
              </div>
              <div style={{
                fontSize: 12, padding: '8px 10px', borderRadius: 8,
                background: ifApproved < 0 ? '#FFEEEA' : '#F0F8FF',
                color: ifApproved < 0 ? '#B5254C' : '#004FD6',
                fontWeight: 500, lineHeight: 1.4,
              }}>
                {ifApproved >= 0
                  ? <>If approved: <strong>${fmt(ifApproved)} left</strong></>
                  : <>If approved: <strong>${fmt(Math.abs(ifApproved))} over</strong></>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        padding: '8px 12px 14px', background: '#F7F9FC',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        flexShrink: 0,
      }}>
        {history.length > 0 && (
          <button
            onClick={handleUndo}
            style={{
              padding: '4px 12px', borderRadius: 999, border: '1px solid #EAEEF5',
              background: '#fff', color: '#666D7C', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            aria-label="Undo"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Undo
          </button>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => handleAction('decline')}
              style={{
                width: 52, height: 52, borderRadius: 999, border: '2px solid #FFEEEA',
                background: '#fff', color: '#B5254C', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(181,37,76,0.15)',
              }}
              aria-label="Decline"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#B5254C' }}>Decline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => handleAction('maybe')}
              style={{
                width: 44, height: 44, borderRadius: 999, border: '2px solid #FFF1D6',
                background: maybe.has(current.id) ? '#FFF1D6' : '#fff',
                color: '#B07700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(176,119,0,0.12)',
              }}
              aria-label="Maybe"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#B07700' }}>Maybe</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => handleAction('favorite')}
              style={{
                width: 44, height: 44, borderRadius: 999, border: '2px solid #FFE4EC',
                background: favorited.has(current.id) ? '#FFE4EC' : '#fff',
                color: '#D63384', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(214,51,132,0.12)',
              }}
              aria-label="Save for later"
            >
              <svg width="18" height="18" viewBox="0 0 24 24"
                fill={favorited.has(current.id) ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#D63384' }}>Save</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => handleAction('approve')}
              style={{
                width: 52, height: 52, borderRadius: 999, border: '2px solid #DDFDEF',
                background: '#fff', color: '#057E4B', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5,126,75,0.15)',
              }}
              aria-label="Approve"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#057E4B' }}>Approve</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main ── */
export default function ClientSelections3() {
  const [allowances, setAllowances] = useState<Allowance[]>(() => {
    try {
      const raw = localStorage.getItem('client-selections-3-v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return initialAllowances;
  });
  const [view, setView] = useState<'home' | 'allowance' | 'option' | 'notifications'>('home');
  const [activeAllowanceId, setActiveAllowanceId] = useState<string | null>(null);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [maybe, setMaybe] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>(() => {
    try { return (localStorage.getItem('client-selections-3-version') as 'v1' | 'v2' | 'v3') || 'v1'; } catch { return 'v1'; }
  });

  useEffect(() => {
    try { localStorage.setItem('client-selections-3-version', version); } catch {}
  }, [version]);

  useEffect(() => {
    try { localStorage.setItem('client-selections-3-v2', JSON.stringify(allowances)); } catch {}
  }, [allowances]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const activeAllowance = allowances.find(a => a.id === activeAllowanceId) || null;
  const activeOption = activeAllowance?.options.find(o => o.id === activeOptionId) || null;
  const awaitingTotal = allowances.reduce((s, a) => s + getAwaitingCount(a), 0);

  const setOptionStatus = (allowanceId: string, optionId: string, status: OptionStatus) => {
    setAllowances(prev => prev.map(a => a.id !== allowanceId ? a : ({
      ...a, options: a.options.map(o => o.id !== optionId ? o : ({ ...o, status })),
    })));
  };

  const handleApprove = (optionId: string) => {
    if (!activeAllowance) return;
    setOptionStatus(activeAllowance.id, optionId, 'approved');
    const opt = activeAllowance.options.find(o => o.id === optionId);
    showToast(`${opt?.name || 'Option'} approved`);
  };
  const handleDecline = (optionId: string) => {
    if (!activeAllowance) return;
    setOptionStatus(activeAllowance.id, optionId, 'declined');
    const opt = activeAllowance.options.find(o => o.id === optionId);
    showToast(`${opt?.name || 'Option'} declined`);
  };

  const handleFavorite = (optionId: string) => {
    setFavorited(prev => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
    setMaybe(prev => { const n = new Set(prev); n.delete(optionId); return n; });
    showToast('Saved for later');
  };

  const handleMaybe = (optionId: string) => {
    setMaybe(prev => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
    setFavorited(prev => { const n = new Set(prev); n.delete(optionId); return n; });
    showToast('Marked as maybe');
  };

  const handleAddComment = (text: string) => {
    if (!activeAllowance || !activeOption) return;
    const newC: Comment = {
      id: `c-${Date.now()}`, from: 'client', text,
      ts: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    setAllowances(prev => prev.map(a => a.id !== activeAllowance.id ? a : ({
      ...a, options: a.options.map(o => o.id !== activeOption.id ? o : ({ ...o, comments: [...o.comments, newC] })),
    })));
    showToast('Question sent');
  };

  return (
    <PhoneFrame version={version} onVersionChange={(v) => { setVersion(v); setView('home'); setActiveAllowanceId(null); setActiveOptionId(null); }}>
      {version === 'v1' && (
        <V1DesktopMobileWrap
          allowances={allowances}
          onApprove={(allowanceId, optionId) => {
            setOptionStatus(allowanceId, optionId, 'approved');
            const a = allowances.find(x => x.id === allowanceId);
            const opt = a?.options.find(o => o.id === optionId);
            showToast(`${opt?.name || 'Option'} approved`);
          }}
          onDecline={(allowanceId, optionId) => {
            setOptionStatus(allowanceId, optionId, 'declined');
            const a = allowances.find(x => x.id === allowanceId);
            const opt = a?.options.find(o => o.id === optionId);
            showToast(`${opt?.name || 'Option'} declined`);
          }}
        />
      )}
      {version !== 'v1' && view === 'home' && (
        <HomeView
          allowances={allowances}
          awaitingTotal={awaitingTotal}
          onOpen={(id) => { setActiveAllowanceId(id); setView('allowance'); }}
          onOpenNotifications={() => setView('notifications')}
        />
      )}
      {view === 'allowance' && activeAllowance && version === 'v2' && (
        <AllowanceView
          allowance={activeAllowance}
          onBack={() => { setView('home'); setActiveAllowanceId(null); }}
          onOpenOption={(id) => { setActiveOptionId(id); setView('option'); }}
          onApprove={(id) => handleApprove(id)}
          onDecline={(id) => handleDecline(id)}
        />
      )}
      {view === 'allowance' && activeAllowance && version === 'v3' && (
        <SwipeAllowanceView
          allowance={activeAllowance}
          onBack={() => { setView('home'); setActiveAllowanceId(null); }}
          onOpenOption={(id) => { setActiveOptionId(id); setView('option'); }}
          onApprove={(id) => handleApprove(id)}
          onDecline={(id) => handleDecline(id)}
          onFavorite={handleFavorite}
          onMaybe={handleMaybe}
          favorited={favorited}
          maybe={maybe}
        />
      )}
      {version !== 'v1' && view === 'option' && activeAllowance && activeOption && (
        <OptionView
          option={activeOption}
          allowance={activeAllowance}
          onBack={() => { setView('allowance'); setActiveOptionId(null); }}
          onApprove={() => { handleApprove(activeOption.id); }}
          onDecline={() => { handleDecline(activeOption.id); }}
          onAddComment={handleAddComment}
        />
      )}
      {version !== 'v1' && view === 'notifications' && (
        <NotificationSheet
          allowances={allowances}
          onClose={() => setView('home')}
          onJump={(allowanceId, optionId) => {
            setActiveAllowanceId(allowanceId);
            if (optionId) {
              setActiveOptionId(optionId);
              setView('option');
            } else {
              setView('allowance');
            }
          }}
        />
      )}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#202227', color: '#fff', padding: '10px 16px',
          borderRadius: 999, fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 200,
          maxWidth: '85%', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </PhoneFrame>
  );
}

// Suppress unused import warning — BdsBadge kept for future use in notifications
void BdsBadge;
