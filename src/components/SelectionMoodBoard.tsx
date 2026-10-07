/* Mood board view of the house. The whole-house board shows each room as a
 * large photo collage; clicking a room drills into that room's own board with
 * every chosen item, plus what still needs a decision. */

import { useState } from 'react';
import { FLOOR_PLAN_ROOMS, RoomSummary } from './SelectionFloorPlan';

export interface BoardItem {
  id: string;
  name: string;
  image?: string;
  room: string;
  // e.g. "Kitchen flooring"
  slot: string;
  status: 'chosen' | 'approved';
}

interface Props {
  items: BoardItem[];
  // Open choices per room, to show what is still missing
  openSlots: Record<string, string[]>;
  summaries: Record<string, RoomSummary>;
  selectedRoom: string | null;
  onSelectRoom: (id: string | null) => void;
  onOpenItem?: (id: string) => void;
}

const ROOMS = FLOOR_PLAN_ROOMS.map(r => ({ id: r.id, label: r.label }));

function stateText(s?: RoomSummary) {
  if (!s || s.state === 'empty') return '';
  if (s.state === 'done') return 'All chosen';
  if (s.state === 'overdue') return `${s.overdue} overdue`;
  return `${s.open} due soon`;
}

export default function SelectionMoodBoard({ items, openSlots, summaries, selectedRoom, onSelectRoom, onOpenItem }: Props) {
  // Photos that fail to load are dropped instead of leaving a blank tile
  const [broken, setBroken] = useState<Set<string>>(new Set());
  if (selectedRoom) {
    const room = ROOMS.find(r => r.id === selectedRoom);
    const roomItems = items.filter(i => i.room === selectedRoom && i.image && !broken.has(i.id));
    const missing = openSlots[selectedRoom] ?? [];
    return (
      <section className="mb-room" aria-label={`${room?.label} mood board`}>
        <div className="mb-room-head">
          <button type="button" className="mb-back" onClick={() => onSelectRoom(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Whole house
          </button>
          <h2 className="mb-room-title">{room?.label}</h2>
          <span className={`mb-state mb-state-${summaries[selectedRoom]?.state ?? 'empty'}`}>{stateText(summaries[selectedRoom])}</span>
        </div>
        {roomItems.length === 0 && missing.length === 0 ? (
          <div className="mb-empty">Nothing to choose in this room.</div>
        ) : (
          <div className="mb-masonry" style={{ ['--mb-cols' as string]: String(Math.min(5, Math.max(2, Math.ceil(Math.sqrt((roomItems.length + missing.length) * 1.6))))) }}>
            {roomItems.map((it, i) => (
              <button
                key={it.id}
                type="button"
                className={`mb-tile mb-tile-photo ${i % 4 === 0 ? 'mb-tile-tall' : ''}`}
                aria-label={`${it.slot}: ${it.name}`}
                onClick={() => onOpenItem?.(it.id)}
              >
                <img className="mb-tile-img" src={it.image} alt="" loading="lazy" onError={() => setBroken(prev => new Set(prev).add(it.id))} />
                <span className="mb-tile-hover">
                  <span className="mb-tile-slot">{it.slot}</span>
                  <span className="mb-tile-name">{it.name}</span>
                </span>
              </button>
            ))}
            {missing.map(slot => (
              <div key={slot} className="mb-tile mb-tile-missing">
                <span className="mb-missing-plus" aria-hidden="true">+</span>
                <span className="mb-tile-slot">{slot}</span>
                <span className="mb-missing-text">Not chosen yet</span>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mb-house" aria-label="House mood board">
      <div className="mb-house-grid">
        {ROOMS.map(r => {
          const s = summaries[r.id];
          if (!s) return null;
          const pics = items.filter(i => i.room === r.id && i.image).map(i => i.image as string);
          const shown = pics.slice(0, 5);
          return (
            <button key={r.id} type="button" className={`mb-room-card ${pics.length === 0 ? 'mb-room-card-empty' : ''}`} onClick={() => onSelectRoom(r.id)}>
              <span className={`mb-collage mb-collage-${Math.max(1, shown.length)}`}>
                {shown.length === 0 ? (
                  <span className="mb-collage-empty">Nothing chosen yet</span>
                ) : shown.map((src, i) => (
                  <span key={i} className="mb-collage-img" style={{ backgroundImage: `url(${src})` }}>
                    {i === shown.length - 1 && pics.length > shown.length && <span className="mb-more">+{pics.length - shown.length}</span>}
                  </span>
                ))}
              </span>
              <span className="mb-room-card-foot">
                <span className="mb-room-card-name">{r.label}</span>
                <span className={`mb-state mb-state-${s.state}`}>{stateText(s)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
