import type { ReactNode } from 'react';
import SelectionFloorPlan, { FLOOR_PLAN_ROOMS, WHOLE_HOUSE_ID, RoomSummary } from './SelectionFloorPlan';

/* Full-width floor plan page: the plan on the left, the mood board for the
 * whole house (or the picked room) on the right. Opened from the small plan
 * in the selections rail, so the selections page never has to squeeze. */

interface Props {
  onBack: () => void;
  summaries: Record<string, RoomSummary>;
  photos: Record<string, string[]>;
  selectedRoom: string | null;
  onSelectRoom: (id: string | null) => void;
  board: ReactNode;
  // Jump back to the selections list filtered to a room
  onShowChoices: (room: string | null) => void;
  // Opened from a room's look: show only that room's photos, no plan
  roomOnly?: boolean;
}

export default function FloorPlanPage({ onBack, summaries, photos, selectedRoom, onSelectRoom, board, onShowChoices, roomOnly }: Props) {
  const roomLabel = [...FLOOR_PLAN_ROOMS, { id: WHOLE_HOUSE_ID, label: 'Throughout the house' }].find(r => r.id === selectedRoom)?.label;
  const sum = selectedRoom ? summaries[selectedRoom] : null;
  const needs = sum && (sum.state === 'open' || sum.state === 'overdue');

  return (
    <div className="fpp">
      <div className="fpp-head">
        <button type="button" className="mb-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to selections
        </button>
        <h2 className="fpp-title">{roomOnly ? `${roomLabel} look` : 'Floor plan'}</h2>
        <span style={{ flex: 1 }} />
        {needs && (
          <button type="button" className="fpp-cta" onClick={() => onShowChoices(selectedRoom)}>
            Make {roomLabel?.toLowerCase()} choices ({sum!.open})
          </button>
        )}
      </div>
      {/* The plan is the page. A room's photo board only appears once a room is picked. */}
      {!roomOnly && (
        <div className="fpp-plan">
          <SelectionFloorPlan fullPage summaries={summaries} photos={photos} selectedRoom={selectedRoom} onSelectRoom={onSelectRoom} />
        </div>
      )}
      {selectedRoom && <div className={`fpp-board ${roomOnly ? 'fpp-board-room-only' : ''}`}>{board}</div>}
    </div>
  );
}
