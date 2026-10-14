import { useSyncExternalStore } from 'react';
import { allAllowances, allSelections } from './allowanceMockData';

/* The job's schedule phases. Estimate scope links to one of these so the
   schedule is what says the work is done: a linked line is 100% complete once
   its phase is marked complete and 0% before. Names line up with the draw
   milestones so a draw and the scope behind it point at the same phase. */
export const SCHEDULE_PHASES: { id: string; name: string; dates: string; percent: number; complete: boolean }[] = [
  { id: 'ph-demo', name: 'Demolition', percent: 100, dates: 'Mar 3 - Mar 14', complete: true },
  { id: 'ph-inspection', name: 'Inspection', percent: 100, dates: 'Mar 17 - Mar 21', complete: true },
  { id: 'ph-removal', name: 'Removal', percent: 60, dates: 'Mar 24 - Apr 4', complete: false },
  { id: 'ph-install', name: 'Installation', percent: 15, dates: 'Apr 7 - May 16', complete: false },
  { id: 'ph-final-inspection', name: 'Final Inspection', percent: 0, dates: 'May 19 - May 23', complete: false },
  { id: 'ph-punch', name: 'Punch list and closeout', percent: 0, dates: 'May 26 - Jun 6', complete: false },
];

export const phaseById = (id?: string) => SCHEDULE_PHASES.find(p => p.id === id);

/* Estimate scope that mirrors the progress invoice's schedule of values, one
   estimate line per schedule line, so the link from estimate to invoice is one
   to one. Ids are "est-" plus the schedule line id. */
export const SOV_ESTIMATE_LINES: { id: string; name: string; costCode: string; costCodeName: string; group: string; owner: number; costType: string; vendor: string }[] = [
  { id: 'est-sov-1', name: 'Framing labor', costCode: '2100', costCodeName: 'Rough Carpentry', group: 'Structure', owner: 42000, costType: 'Labor', vendor: 'Ridgeline Framing' },
  { id: 'est-sov-2', name: 'Framing lumber package', costCode: '2100', costCodeName: 'Rough Carpentry', group: 'Structure', owner: 16800, costType: 'Material', vendor: 'Heartland Lumber' },
  { id: 'est-sov-3', name: 'Rough plumbing', costCode: '2200', costCodeName: 'Plumbing', group: 'Mechanicals', owner: 18000, costType: 'Labor', vendor: 'Allied Plumbing' },
  { id: 'est-sov-4', name: 'Electrical rough-in', costCode: '2300', costCodeName: 'Electrical', group: 'Mechanicals', owner: 16000, costType: 'Labor', vendor: 'Bright Electric' },
  { id: 'est-sov-5', name: 'Cabinet hardware materials', costCode: '6090', costCodeName: 'Cabinets', group: 'Kitchen', owner: 9500, costType: 'Material', vendor: 'Cabinet Supply Co' },
  { id: 'est-sov-6', name: 'Kitchen countertop allowance', costCode: '6200', costCodeName: 'Countertops', group: 'Kitchen', owner: 14000, costType: 'Material', vendor: 'Stone & Surface' },
  { id: 'est-sov-7', name: 'Tile backsplash', costCode: '9070', costCodeName: 'Tile', group: 'Kitchen', owner: 6400, costType: 'Material', vendor: 'Tile Depot' },
  { id: 'est-sov-8', name: 'Tile, guest bath', costCode: '9070', costCodeName: 'Tile', group: 'Baths', owner: 5200, costType: 'Material', vendor: 'Tile Depot' },
];

/* Estimate item id -> schedule phase id. A module store rather than props so
   the estimate page and the invoice read the same links without threading
   them through App. */
/* Pre-assigned so the demo starts linked and only needs editing. Framing sits
   in a complete phase (bills in full), plumbing and electrical in one that is
   part way through, and the rest further out. */
const SEED_LINKS: Record<string, string> = {
  'est-sov-1': 'ph-inspection',
  'est-sov-2': 'ph-inspection',
  'est-sov-3': 'ph-removal',
  'est-sov-4': 'ph-removal',
  'est-sov-5': 'ph-install',
  'est-sov-6': 'ph-install',
  'est-sov-7': 'ph-install',
  'est-sov-8': 'ph-final-inspection',
};
allAllowances.forEach((a, i) => {
  allSelections.filter(s => a.selectionIds.includes(s.id)).forEach(sel =>
    sel.options.forEach(o => { SEED_LINKS[o.id] = i === 0 ? 'ph-install' : 'ph-final-inspection'; }),
  );
});
let links: Record<string, string> = { ...SEED_LINKS };
const listeners = new Set<() => void>();

export function setPhaseLinks(ids: string[], phaseId: string) {
  const next = { ...links };
  ids.forEach(id => { if (phaseId) next[id] = phaseId; else delete next[id]; });
  links = next;
  listeners.forEach(l => l());
}

export function usePhaseLinks(): Record<string, string> {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => links,
  );
}
