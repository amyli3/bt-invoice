import { useRef, useState } from 'react';

/* Compact floor plan for the client selections page, drawn like a stripped
 * down spec plan. Rooms share walls, a small dot shows what still needs a
 * decision, and anything already chosen shows up inside the room as a photo
 * collage. Clicking a room filters the page to it. */

export type RoomState = 'overdue' | 'open' | 'done' | 'empty';

export interface FloorPlanRoom {
  id: string;
  label: string;
  // Position and size as percentages of the plan. Rooms tile the full plan.
  x: number; y: number; w: number; h: number;
}

export interface RoomSummary {
  state: RoomState;
  open: number;
  overdue: number;
  done: number;
}

// Array order is also the rooms-list order, so the room with the most
// to decide (master bath) leads. Position on the plan comes from x/y.
export const FLOOR_PLAN_ROOMS: FloorPlanRoom[] = [
  { id: 'master-bath', label: 'Master bath', x: 69, y: 0, w: 31, h: 46 },
  { id: 'kitchen', label: 'Kitchen', x: 0, y: 0, w: 32, h: 56 },
  { id: 'dining', label: 'Dining', x: 32, y: 0, w: 20, h: 56 },
  { id: 'powder', label: 'Powder', x: 52, y: 0, w: 17, h: 30 },
  { id: 'foyer', label: 'Foyer', x: 52, y: 30, w: 17, h: 70 },
  { id: 'living', label: 'Living', x: 0, y: 56, w: 52, h: 44 },
  { id: 'bedrooms', label: 'Bedrooms', x: 69, y: 46, w: 31, h: 54 },
];

export const WHOLE_HOUSE_ID = 'whole-house';

// Map an option's group ("Kitchen flooring", "Master bath shower", ...) to a room.
export function roomForGroup(group: string): string {
  const g = group.toLowerCase();
  if (g.startsWith('kitchen')) return 'kitchen';
  if (g.startsWith('master bath')) return 'master-bath';
  if (g.startsWith('bedroom')) return 'bedrooms';
  if (g.startsWith('powder')) return 'powder';
  if (g.startsWith('dining')) return 'dining';
  if (g.startsWith('living')) return 'living';
  if (g.startsWith('foyer') || g.startsWith('entry')) return 'foyer';
  return WHOLE_HOUSE_ID;
}

interface Props {
  summaries: Record<string, RoomSummary>;
  // Photos of options already chosen in each room
  photos: Record<string, string[]>;
  selectedRoom: string | null;
  onSelectRoom: (id: string | null) => void;
  // Rail version: no collapse/resize, smaller labels, fewer photos
  compact?: boolean;
  // Phone-sized context (real phone or the Mobile preview): start collapsed
  startCollapsed?: boolean;
  // Full-page floor plan: always open, full width, no collapse or resize
  fullPage?: boolean;
  // Rail version only: show an expand/shrink control
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

// Simple line drawings shown in rooms that have no photos yet.
export const ROOM_ICONS: Record<string, JSX.Element> = {
  kitchen: ( // sink with faucet
    <svg viewBox="0 0 64 48"><rect x="4" y="18" width="56" height="26" rx="4" /><rect x="9" y="23" width="20" height="16" rx="2" /><line x1="13" y1="28" x2="25" y2="28" /><line x1="13" y1="33" x2="25" y2="33" /><rect x="33" y="23" width="22" height="16" rx="3" /><circle cx="44" cy="31" r="2.5" /><path d="M30 18V8a4 4 0 0 1 8 0v3" /></svg>
  ),
  dining: ( // table with two chairs
    <svg viewBox="0 0 64 48"><line x1="14" y1="20" x2="50" y2="20" /><line x1="20" y1="20" x2="20" y2="40" /><line x1="44" y1="20" x2="44" y2="40" /><path d="M6 12v28M6 28h8v12" /><path d="M58 12v28M58 28h-8v12" /><path d="M28 20v-5h8v5" /></svg>
  ),
  powder: ( // pedestal sink
    <svg viewBox="0 0 64 48"><path d="M10 14h44a2 2 0 0 1 2 2v2a12 12 0 0 1-12 12H20A12 12 0 0 1 8 18v-2a2 2 0 0 1 2-2z" /><path d="M26 30l2 14h8l2-14" /><path d="M32 14V6h6" /><ellipse cx="32" cy="19" rx="8" ry="2.5" /></svg>
  ),
  foyer: ( // front door
    <svg viewBox="0 0 64 48"><rect x="20" y="4" width="24" height="40" rx="1" /><rect x="25" y="9" width="14" height="12" /><rect x="25" y="25" width="14" height="14" /><circle cx="40" cy="24" r="1.5" /><line x1="10" y1="44" x2="54" y2="44" /></svg>
  ),
  living: ( // sofa
    <svg viewBox="0 0 64 48"><path d="M12 22v-8a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v8" /><rect x="4" y="22" width="10" height="16" rx="3" /><rect x="50" y="22" width="10" height="16" rx="3" /><path d="M14 30h36v8H14z" /><line x1="32" y1="30" x2="32" y2="38" /><line x1="9" y1="38" x2="9" y2="43" /><line x1="55" y1="38" x2="55" y2="43" /></svg>
  ),
  'master-bath': ( // toilet
    <svg viewBox="0 0 64 48"><rect x="18" y="4" width="28" height="12" rx="2" /><path d="M14 20h36c0 9-7 15-15 15h-6c-8 0-15-6-15-15z" /><path d="M24 35l-2 9h20l-2-9" /></svg>
  ),
  bedrooms: ( // bed
    <svg viewBox="0 0 64 48"><path d="M6 10v34M58 26v18M6 36h52" /><path d="M6 26h52" /><rect x="10" y="17" width="14" height="9" rx="3" /><path d="M28 26v-6a3 3 0 0 1 3-3h22a5 5 0 0 1 5 5v4" /></svg>
  ),
};

const MAX_PHOTOS = 4;
const WIDTH_KEY = 'ws-floorplan-width';
const COLLAPSED_KEY = 'ws-floorplan-collapsed';
const MIN_WIDTH = 360;

function readWidth(): number | null {
  try { const v = Number(localStorage.getItem(WIDTH_KEY)); return v >= MIN_WIDTH ? v : null; } catch { return null; }
}

function describe(label: string, s: RoomSummary) {
  if (s.state === 'empty') return `${label}: nothing to choose`;
  if (s.state === 'done') return `${label}: all choices made`;
  const parts = [`${s.open} choice${s.open === 1 ? '' : 's'} due soon`];
  if (s.overdue) parts.push(`${s.overdue} overdue`);
  return `${label}: ${parts.join(', ')}`;
}

export default function SelectionFloorPlan({ summaries, photos, selectedRoom, onSelectRoom, compact = false, expanded = false, onToggleExpanded, startCollapsed, fullPage = false }: Props) {
  const empty: RoomSummary = { state: 'empty', open: 0, overdue: 0, done: 0 };
  const toggle = (id: string) => onSelectRoom(selectedRoom === id ? null : id);
  // Rail preview: the whole plan opens the floor plan page; rooms aren't separate buttons
  const previewOnly = compact && !!onToggleExpanded;

  // Drag the right edge to resize. Height follows via aspect-ratio.
  const planRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(() => compact || fullPage ? null : readWidth());
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (compact || fullPage) return false;
    // Phones start collapsed so the choices are on the first screen
    const phone = startCollapsed || (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches);
    if (startCollapsed) return true;
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      return saved === null ? phone : saved === '1';
    } catch { return phone; }
  });
  const toggleCollapsed = () => {
    setCollapsed(c => {
      try { localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };
  const startDrag = (e: React.PointerEvent) => {
    const plan = planRef.current;
    if (!plan) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = plan.getBoundingClientRect().width;
    const maxW = plan.parentElement?.getBoundingClientRect().width ?? startW;
    let w = startW;
    const move = (ev: PointerEvent) => {
      w = Math.round(Math.min(maxW, Math.max(MIN_WIDTH, startW + ev.clientX - startX)));
      setWidth(w);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
      try { localStorage.setItem(WIDTH_KEY, String(w)); } catch { /* ignore */ }
    };
    document.body.style.cursor = 'ew-resize';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const nudge = (delta: number) => {
    const plan = planRef.current;
    if (!plan) return;
    const maxW = plan.parentElement?.getBoundingClientRect().width ?? 0;
    const w = Math.round(Math.min(maxW, Math.max(MIN_WIDTH, plan.getBoundingClientRect().width + delta)));
    setWidth(w);
    try { localStorage.setItem(WIDTH_KEY, String(w)); } catch { /* ignore */ }
  };

  return (
    <section className={`fp-card ${compact ? 'fp-compact' : ''} ${compact && expanded ? 'fp-compact-expanded' : ''} ${fullPage ? 'fp-full' : ''}`} aria-label="Selections by room">
      {!fullPage && <div className="fp-head">
        {compact ? (
          <span className="fp-eyebrow">Floor plan</span>
        ) : (
          <button type="button" className="fp-collapse" aria-expanded={!collapsed} onClick={toggleCollapsed}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9" /></svg>
            <span className="fp-eyebrow">Floor plan</span>
          </button>
        )}
        <span style={{ marginLeft: 'auto' }} />
        {compact && onToggleExpanded && (
          <button type="button" className="fp-expand" aria-label="Open floor plan" title="Open floor plan" onClick={onToggleExpanded}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          </button>
        )}
      </div>}

      {!collapsed && <div
        className={`fp-plan ${previewOnly ? 'fp-plan-link' : ''}`}
        ref={planRef}
        style={width ? { width, maxWidth: '100%' } : undefined}
        {...(previewOnly ? {
          role: 'button', tabIndex: 0, 'aria-label': 'Open floor plan', title: 'Open floor plan',
          onClick: onToggleExpanded,
          onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpanded?.(); } },
        } : {})}
      >
        {FLOOR_PLAN_ROOMS.map(room => {
          const s = summaries[room.id] ?? empty;
          const pics = photos[room.id] ?? [];
          const shown = pics.slice(0, compact && !expanded ? 2 : MAX_PHOTOS);
          const extra = pics.length - shown.length;
          const isSelected = selectedRoom === room.id;
          return (
            <RoomTag
              key={room.id}
              asButton={!previewOnly}
              className={`fp-room fp-room-${s.state} ${isSelected ? 'fp-selected' : ''} ${selectedRoom && !isSelected ? 'fp-dim' : ''}`}
              style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
              disabled={s.state === 'empty'}
              pressed={isSelected}
              label={describe(room.label, s)}
              onClick={() => toggle(room.id)}
            >
              <span className="fp-room-top">
                <span className="fp-room-label">{room.label}</span>
              </span>
              {shown.length === 0 && ROOM_ICONS[room.id] && (
                <span className="fp-room-icon" aria-hidden="true">{ROOM_ICONS[room.id]}</span>
              )}
              {shown.length > 0 && (
                <span className={`fp-collage fp-collage-${shown.length}`}>
                  {shown.map((src, i) => (
                    <span key={i} className="fp-photo" style={{ backgroundImage: `url(${src})` }}>
                      {i === shown.length - 1 && extra > 0 && <span className="fp-photo-more">+{extra}</span>}
                    </span>
                  ))}
                </span>
              )}
            </RoomTag>
          );
        })}
        {!compact && !fullPage && (
          <span
            className="fp-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize floor plan"
            tabIndex={0}
            onPointerDown={startDrag}
            onDoubleClick={() => { setWidth(null); try { localStorage.removeItem(WIDTH_KEY); } catch { /* ignore */ } }}
            onKeyDown={(e) => { if (e.key === 'ArrowRight') nudge(24); if (e.key === 'ArrowLeft') nudge(-24); }}
            title="Drag to resize. Double-click to reset."
          />
        )}
      </div>}
    </section>
  );
}


// Small inline room icon for headings, lists and chips
export function RoomIcon({ room, size = 20 }: { room: string; size?: number }) {
  const icon = ROOM_ICONS[room];
  if (!icon) return null;
  return <span className="room-icon" style={{ width: size, height: size }} aria-hidden="true">{icon}</span>;
}

// A room on the plan: a real button on the full page, a plain shape in the rail preview
function RoomTag({ asButton, className, style, disabled, pressed, label, onClick, children }: {
  asButton: boolean; className: string; style: React.CSSProperties; disabled: boolean; pressed: boolean;
  label: string; onClick: () => void; children: React.ReactNode;
}) {
  if (!asButton) return <span className={className} style={style}>{children}</span>;
  return (
    <button type="button" className={className} style={style} disabled={disabled} aria-pressed={pressed} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
