import { JCB_ROWS, type BudgetRow } from './jcbMockData';

// Prototype-only: a small picker list so the budget assistant can answer
// "this job" vs "all jobs" questions. Other jobs are scaled copies of the
// sample job's cost codes; `clean` jobs have no projected overrun.

export type MockJob = { id: string; name: string; scale: number; clean?: boolean };

export const JOBS: MockJob[] = [
  { id: 'sample', name: 'Hargrove Residence', scale: 1 },
  { id: 'bwf26', name: 'Miller Kitchen Remodel', scale: 0.4, clean: true },
  { id: 'bwfjob', name: 'Okafor Master Suite Addition', scale: 0.55 },
  { id: 'bigmac', name: 'Lakeview Custom Home', scale: 1.3 },
  { id: 'brat1', name: 'Reyes Basement Finish', scale: 0.8, clean: true },
  { id: 'brat2', name: 'Cedar Ridge Spec Home', scale: 1.6 },
  { id: 'brat3', name: 'Nguyen Bathroom Remodel', scale: 0.7, clean: true },
  { id: 'bobby', name: 'Patel Deck and Porch', scale: 0.3 },
];

const cache = new Map<string, BudgetRow[]>();

export function rowsForJob(job: MockJob): BudgetRow[] {
  if (job.scale === 1 && !job.clean) return JCB_ROWS;
  const hit = cache.get(job.id);
  if (hit) return hit;
  const s = (v: number) => (v === 0 ? 0 : Math.round((v * job.scale) / 100) * 100);
  const rows = JCB_ROWS.map(r => {
    const revised = s(r.revisedBudgetCosts);
    const actual = s(r.actualCosts);
    return {
      ...r,
      originalBudgetCosts: s(r.originalBudgetCosts),
      revisedBudgetCosts: revised,
      committedCosts: s(r.committedCosts),
      actualCosts: job.clean ? Math.min(actual, revised) : actual,
      builderVariance: job.clean ? 0 : s(r.builderVariance),
      projectedCosts: job.clean ? revised : s(r.projectedCosts),
      originalOwnerPrice: s(r.originalOwnerPrice),
      revisedOwnerPrice: s(r.revisedOwnerPrice),
      amountInvoiced: s(r.amountInvoiced),
    };
  });
  cache.set(job.id, rows);
  return rows;
}

export type JobStats = { overBy: number; remainingToInvoice: number; invoiced: number; revisedPrice: number };

export function statsForJob(job: MockJob): JobStats {
  const rows = rowsForJob(job);
  const overBy = rows.reduce((a, r) => a + (r.projectedCosts - r.revisedBudgetCosts), 0);
  const revisedPrice = rows.reduce((a, r) => a + r.revisedOwnerPrice, 0);
  const invoiced = rows.reduce((a, r) => a + r.amountInvoiced, 0);
  return { overBy, remainingToInvoice: revisedPrice - invoiced, invoiced, revisedPrice };
}
