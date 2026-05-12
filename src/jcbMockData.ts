// ─── Job Costing Budget — shared mock data ───
// Single source of truth for the JCB rows used by both
// JobCostingBudget.tsx (the budget screen) and
// JobPriceSummary.tsx Slice 4 v5 (customer-payable cost variance).
//
// References:
//   BTNet/Clients.App/src/entity/budget/JobCostingBudget/
//   btwiki.atlassian.net/wiki/spaces/TG/pages/4481384935

export interface BudgetRow {
  code: string;
  name: string;
  costType: 'Labor' | 'Material' | 'Subcontractor' | 'Other';
  category: string;
  originalBudgetCosts: number;
  revisedBudgetCosts: number;
  committedCosts: number;
  actualCosts: number;
  builderVariance: number;
  projectedCosts: number;
  originalOwnerPrice: number;
  revisedOwnerPrice: number;
  amountInvoiced: number;
}

// Full residential build — 23 cost codes summing to $494,000 revised budget,
// $568,100 originalOwnerPrice (the JPS contract baseline).
// Variance is concentrated in the 4 mechanical/structural codes that have
// builder activity to date; the rest track on budget.
export const JCB_ROWS: BudgetRow[] = [
  // ── Site & general conditions ──
  { code: '0010', name: 'Permits & inspection fees', costType: 'Other',         category: 'Site',     originalBudgetCosts: 6500,  revisedBudgetCosts: 6500,  committedCosts: 0, actualCosts: 6500,  builderVariance: 0, projectedCosts: 6500,  originalOwnerPrice: 7475,  revisedOwnerPrice: 7475,  amountInvoiced: 7475  },
  { code: '1100', name: 'Site preparation & excavation', costType: 'Subcontractor', category: 'Site', originalBudgetCosts: 18500, revisedBudgetCosts: 18500, committedCosts: 0, actualCosts: 18500, builderVariance: 0, projectedCosts: 18500, originalOwnerPrice: 21275, revisedOwnerPrice: 21275, amountInvoiced: 18000 },
  { code: '1400', name: 'Construction supervision', costType: 'Labor',          category: 'Site',     originalBudgetCosts: 34500, revisedBudgetCosts: 34500, committedCosts: 0, actualCosts: 20700, builderVariance: 0, projectedCosts: 34500, originalOwnerPrice: 39675, revisedOwnerPrice: 39675, amountInvoiced: 22000 },
  { code: '2800', name: 'Landscaping',            costType: 'Subcontractor',   category: 'Site',     originalBudgetCosts: 13500, revisedBudgetCosts: 13500, committedCosts: 0, actualCosts: 0,     builderVariance: 0, projectedCosts: 13500, originalOwnerPrice: 15525, revisedOwnerPrice: 15525, amountInvoiced: 0     },
  // ── Structural ──
  { code: '3300', name: 'Foundation & concrete',  costType: 'Subcontractor',   category: 'Structural', originalBudgetCosts: 42000, revisedBudgetCosts: 42000, committedCosts: 0, actualCosts: 42000, builderVariance: 0,    projectedCosts: 42000, originalOwnerPrice: 48300, revisedOwnerPrice: 48300, amountInvoiced: 38000 },
  { code: '3100', name: 'Framing',                costType: 'Subcontractor',   category: 'Structural', originalBudgetCosts: 25000, revisedBudgetCosts: 25000, committedCosts: 0, actualCosts: 26500, builderVariance: 1200, projectedCosts: 28200, originalOwnerPrice: 28750, revisedOwnerPrice: 31050, amountInvoiced: 21000 },
  { code: '7200', name: 'Insulation',             costType: 'Subcontractor',   category: 'Structural', originalBudgetCosts: 12500, revisedBudgetCosts: 12500, committedCosts: 0, actualCosts: 12500, builderVariance: 0,    projectedCosts: 12500, originalOwnerPrice: 14375, revisedOwnerPrice: 14375, amountInvoiced: 11000 },
  // ── Exterior ──
  { code: '7300', name: 'Roofing',                costType: 'Subcontractor',   category: 'Exterior', originalBudgetCosts: 24000, revisedBudgetCosts: 24000, committedCosts: 0, actualCosts: 24000, builderVariance: 0, projectedCosts: 24000, originalOwnerPrice: 27600, revisedOwnerPrice: 27600, amountInvoiced: 22000 },
  { code: '7600', name: 'Siding & exterior trim', costType: 'Subcontractor',   category: 'Exterior', originalBudgetCosts: 30000, revisedBudgetCosts: 30000, committedCosts: 0, actualCosts: 21000, builderVariance: 0, projectedCosts: 30000, originalOwnerPrice: 34500, revisedOwnerPrice: 34500, amountInvoiced: 18000 },
  { code: '8500', name: 'Windows & exterior doors', costType: 'Material',      category: 'Exterior', originalBudgetCosts: 36000, revisedBudgetCosts: 36000, committedCosts: 0, actualCosts: 32400, builderVariance: 0, projectedCosts: 36000, originalOwnerPrice: 41400, revisedOwnerPrice: 41400, amountInvoiced: 30000 },
  // ── Mechanical ──
  { code: '4500', name: 'HVAC',                   costType: 'Subcontractor',   category: 'Mechanical', originalBudgetCosts: 15000, revisedBudgetCosts: 15000, committedCosts: 0, actualCosts: 14500, builderVariance: 0, projectedCosts: 16100, originalOwnerPrice: 17250, revisedOwnerPrice: 18515, amountInvoiced: 10000 },
  { code: '4400', name: 'Plumbing rough-in',      costType: 'Subcontractor',   category: 'Mechanical', originalBudgetCosts: 12000, revisedBudgetCosts: 12000, committedCosts: 0, actualCosts: 11200, builderVariance: 0, projectedCosts: 12200, originalOwnerPrice: 13800, revisedOwnerPrice: 14030, amountInvoiced: 9000  },
  { code: '7500', name: 'Electrical rough-in',    costType: 'Subcontractor',   category: 'Mechanical', originalBudgetCosts: 18000, revisedBudgetCosts: 18000, committedCosts: 0, actualCosts: 19600, builderVariance: 0, projectedCosts: 20800, originalOwnerPrice: 20700, revisedOwnerPrice: 23920, amountInvoiced: 14000 },
  { code: '7700', name: 'Plumbing fixtures',      costType: 'Material',        category: 'Mechanical', originalBudgetCosts: 14000, revisedBudgetCosts: 14000, committedCosts: 0, actualCosts: 1400,  builderVariance: 0, projectedCosts: 14000, originalOwnerPrice: 16100, revisedOwnerPrice: 16100, amountInvoiced: 0     },
  { code: '7800', name: 'Electrical fixtures & lighting', costType: 'Material', category: 'Mechanical', originalBudgetCosts: 9500, revisedBudgetCosts: 9500, committedCosts: 0, actualCosts: 0,    builderVariance: 0, projectedCosts: 9500,  originalOwnerPrice: 10925, revisedOwnerPrice: 10925, amountInvoiced: 0     },
  // ── Interior ──
  { code: '6200', name: 'Interior trim & doors',  costType: 'Labor',           category: 'Interior', originalBudgetCosts: 20000, revisedBudgetCosts: 20000, committedCosts: 0, actualCosts: 6000,  builderVariance: 0, projectedCosts: 20000, originalOwnerPrice: 23000, revisedOwnerPrice: 23000, amountInvoiced: 4000  },
  { code: '6400', name: 'Cabinetry',              costType: 'Material',        category: 'Interior', originalBudgetCosts: 48000, revisedBudgetCosts: 48000, committedCosts: 0, actualCosts: 24000, builderVariance: 0, projectedCosts: 48000, originalOwnerPrice: 55200, revisedOwnerPrice: 55200, amountInvoiced: 20000 },
  { code: '6500', name: 'Countertops',            costType: 'Material',        category: 'Interior', originalBudgetCosts: 15500, revisedBudgetCosts: 15500, committedCosts: 0, actualCosts: 0,     builderVariance: 0, projectedCosts: 15500, originalOwnerPrice: 17825, revisedOwnerPrice: 17825, amountInvoiced: 0     },
  { code: '6800', name: 'Appliances',             costType: 'Material',        category: 'Interior', originalBudgetCosts: 10000, revisedBudgetCosts: 10000, committedCosts: 0, actualCosts: 0,     builderVariance: 0, projectedCosts: 10000, originalOwnerPrice: 11500, revisedOwnerPrice: 11500, amountInvoiced: 0     },
  { code: '9200', name: 'Drywall',                costType: 'Subcontractor',   category: 'Interior', originalBudgetCosts: 22000, revisedBudgetCosts: 22000, committedCosts: 0, actualCosts: 22000, builderVariance: 0, projectedCosts: 22000, originalOwnerPrice: 25300, revisedOwnerPrice: 25300, amountInvoiced: 20000 },
  // ── Finishes ──
  { code: '9400', name: 'Tile & stone',           costType: 'Subcontractor',   category: 'Finishes', originalBudgetCosts: 14000, revisedBudgetCosts: 14000, committedCosts: 0, actualCosts: 5600,  builderVariance: 0, projectedCosts: 14000, originalOwnerPrice: 16100, revisedOwnerPrice: 16100, amountInvoiced: 4000  },
  { code: '9700', name: 'Flooring',               costType: 'Subcontractor',   category: 'Finishes', originalBudgetCosts: 36000, revisedBudgetCosts: 36000, committedCosts: 0, actualCosts: 7200,  builderVariance: 0, projectedCosts: 36000, originalOwnerPrice: 41400, revisedOwnerPrice: 41400, amountInvoiced: 5000  },
  { code: '9900', name: 'Interior paint',         costType: 'Subcontractor',   category: 'Finishes', originalBudgetCosts: 17500, revisedBudgetCosts: 17500, committedCosts: 0, actualCosts: 8750,  builderVariance: 0, projectedCosts: 17500, originalOwnerPrice: 20125, revisedOwnerPrice: 20125, amountInvoiced: 6000  },
];

export const MARKUP_PCT = 0.15;

// Derived totals — computed once so JPS and JCB always agree.
export const JCB_TOTALS = (() => {
  const revisedBudget      = JCB_ROWS.reduce((s, r) => s + r.revisedBudgetCosts,  0);
  const projectedCosts     = JCB_ROWS.reduce((s, r) => s + r.projectedCosts,      0);
  const builderVariance    = JCB_ROWS.reduce((s, r) => s + r.builderVariance,     0);
  const actualCosts        = JCB_ROWS.reduce((s, r) => s + r.actualCosts,         0);
  const originalOwnerPrice = JCB_ROWS.reduce((s, r) => s + r.originalOwnerPrice,  0);
  const revisedOwnerPrice  = JCB_ROWS.reduce((s, r) => s + r.revisedOwnerPrice,   0);
  // Customer-payable cost movement (Open Book): excludes builder-only variance.
  const costSideDelta      = projectedCosts - revisedBudget - builderVariance;
  const markupOnDelta      = costSideDelta * MARKUP_PCT;
  const customerImpact     = costSideDelta + markupOnDelta;
  return { revisedBudget, projectedCosts, builderVariance, actualCosts, originalOwnerPrice, revisedOwnerPrice, costSideDelta, markupOnDelta, customerImpact };
})();
