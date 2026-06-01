// Shared V4 panel data used by the JPS openbook demo and the client portal
// "Budget difference" drill-through.
//   Revised budget = Original budget + CO impact + Selection impact
//   Spent          = Sum of activity amounts
//   Variance       = Spent − Revised budget

export type ActivityKind = 'Bill' | 'PO' | 'Time clock' | 'Receipt' | 'Cost adjustment';
export type V4Activity = { kind: ActivityKind; name: string; amount: number };
export type V4CostCode = {
  code: string;
  name: string;
  rangeLabel: string;
  estimateGroup: string;
  location: string;
  originalBudget: number;
  coImpact: number;
  selectionImpact: number;
  activity: V4Activity[];
};

export type PanelCategoryItem = {
  name: string;
  code: string;
  originalBudget: number;
  coImpact: number;
  selectionImpact: number;
  revisedBudget: number;
  spent: number;
  variance: number;
  activity: V4Activity[];
};
export type PanelCategory = {
  category: string;
  items: PanelCategoryItem[];
  originalBudget: number;
  revisedBudget: number;
  variance: number;
};

export const V4_PANEL_DATA: V4CostCode[] = [
  {
    code: '3100', name: 'Framing',
    rangeLabel: '3000-3999 Framing',
    estimateGroup: 'Phase 2 · framing',
    location: 'Whole house',
    originalBudget: 25000, coImpact: 1043, selectionImpact: 0,
    activity: [
      { kind: 'Bill',       name: 'Lumber package',     amount: 18200 },
      { kind: 'Bill',       name: 'Engineered beams',   amount: 8300 },
      { kind: 'Time clock', name: 'Carpentry — week 4', amount: 2200 },
    ],
  },
  {
    code: '4400', name: 'Plumbing rough-in',
    rangeLabel: '4000-4999 Plumbing & HVAC',
    estimateGroup: 'Phase 3 · MEP rough-in',
    location: 'Bathrooms',
    originalBudget: 12000, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'PEX + fittings',          amount: 6800 },
      { kind: 'Bill', name: 'Plumbing labor — week 1', amount: 4400 },
      { kind: 'PO',   name: 'Extra valves',            amount: 1200 },
    ],
  },
  {
    code: '4500', name: 'HVAC',
    rangeLabel: '4000-4999 Plumbing & HVAC',
    estimateGroup: 'Phase 3 · MEP rough-in',
    location: 'Whole house',
    originalBudget: 15000, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill',       name: 'Furnace + AC unit',        amount: 9200 },
      { kind: 'Bill',       name: 'HVAC install labor',       amount: 5300 },
      { kind: 'Time clock', name: 'Coordination supervision', amount: 280 },
    ],
  },
  {
    code: '7500', name: 'Electrical rough-in',
    rangeLabel: '7000-7999 Electrical',
    estimateGroup: 'Phase 3 · MEP rough-in',
    location: 'Kitchen and baths',
    originalBudget: 18000, coImpact: 0, selectionImpact: 1183,
    activity: [
      { kind: 'Bill',            name: 'Wire + breakers',            amount: 7900 },
      { kind: 'Bill',            name: 'Electrical labor',           amount: 11700 },
      { kind: 'PO',              name: 'Sub-panel upgrade',          amount: 1100 },
      { kind: 'Cost adjustment', name: 'Materials price correction', amount: 400 },
    ],
  },
  {
    code: '1100', name: 'Site preparation',
    rangeLabel: '1000-1999 Sitework',
    estimateGroup: 'Phase 1 · sitework',
    location: 'Site',
    originalBudget: 8500, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill',       name: 'Grading',         amount: 3200 },
      { kind: 'Bill',       name: 'Site clearing',   amount: 2800 },
      { kind: 'Time clock', name: 'Excavation crew', amount: 2100 },
    ],
  },
  {
    code: '2200', name: 'Foundation',
    rangeLabel: '2000-2999 Foundation',
    estimateGroup: 'Phase 1 · sitework',
    location: 'Whole house',
    originalBudget: 22000, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'Concrete pour',     amount: 14500 },
      { kind: 'Bill', name: 'Rebar + footings',  amount: 3800 },
      { kind: 'Bill', name: 'Foundation labor',  amount: 3700 },
    ],
  },
  {
    code: '5200', name: 'Roofing',
    rangeLabel: '5000-5999 Roofing',
    estimateGroup: 'Phase 2 · roofing',
    location: 'Whole house',
    originalBudget: 18500, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'Shingles + flashing', amount: 8200 },
      { kind: 'Bill', name: 'Roofing labor',       amount: 7800 },
      { kind: 'PO',   name: 'Underlayment',        amount: 2200 },
    ],
  },
  {
    code: '6100', name: 'Windows and doors',
    rangeLabel: '6000-6999 Doors & windows',
    estimateGroup: 'Phase 3 · openings',
    location: 'Whole house',
    originalBudget: 24000, coImpact: 0, selectionImpact: 1500,
    activity: [
      { kind: 'Bill', name: 'Window package',       amount: 15200 },
      { kind: 'Bill', name: 'Exterior door package', amount: 7800 },
      { kind: 'Bill', name: 'Install labor',        amount: 3200 },
    ],
  },
  {
    code: '8100', name: 'Insulation',
    rangeLabel: '8000-8999 Insulation',
    estimateGroup: 'Phase 4 · insulation',
    location: 'Whole house',
    originalBudget: 7500, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'Insulation materials', amount: 4300 },
      { kind: 'Bill', name: 'Insulation labor',     amount: 3100 },
    ],
  },
  {
    code: '9300', name: 'Drywall',
    rangeLabel: '9000-9999 Finishes',
    estimateGroup: 'Phase 4 · finishes',
    location: 'Whole house',
    originalBudget: 9500, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'Drywall materials', amount: 4200 },
      { kind: 'Bill', name: 'Drywall labor',     amount: 5650 },
    ],
  },
  {
    code: '9400', name: 'Cabinetry',
    rangeLabel: '9000-9999 Finishes',
    estimateGroup: 'Phase 5 · cabinetry',
    location: 'Kitchen and baths',
    originalBudget: 14000, coImpact: 0, selectionImpact: 850,
    activity: [
      { kind: 'Bill', name: 'Kitchen cabinets',   amount: 9800 },
      { kind: 'Bill', name: 'Bath vanities',      amount: 3200 },
      { kind: 'PO',   name: 'Cabinet hardware',   amount: 1150 },
    ],
  },
  {
    code: '9600', name: 'Flooring',
    rangeLabel: '9000-9999 Finishes',
    estimateGroup: 'Phase 5 · finishes',
    location: 'Whole house',
    originalBudget: 16000, coImpact: 0, selectionImpact: 0,
    activity: [
      { kind: 'Bill', name: 'Hardwood materials', amount: 9200 },
      { kind: 'Bill', name: 'Tile materials',     amount: 2800 },
      { kind: 'Bill', name: 'Flooring labor',     amount: 4500 },
    ],
  },
];

export function computePanelGroups(grouper: (item: V4CostCode) => string): PanelCategory[] {
  const groups = new Map<string, PanelCategoryItem[]>();
  V4_PANEL_DATA.forEach(cc => {
    const category = grouper(cc);
    const revised = cc.originalBudget + cc.coImpact + cc.selectionImpact;
    const spent = cc.activity.reduce((s, a) => s + a.amount, 0);
    const item: PanelCategoryItem = {
      name: cc.name,
      code: cc.code,
      originalBudget: cc.originalBudget,
      coImpact: cc.coImpact,
      selectionImpact: cc.selectionImpact,
      revisedBudget: revised,
      spent,
      variance: spent - revised,
      activity: cc.activity,
    };
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(item);
  });
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items: [...items].sort((a, b) => Number(a.code) - Number(b.code)),
    originalBudget: items.reduce((s, i) => s + i.originalBudget, 0),
    revisedBudget: items.reduce((s, i) => s + i.revisedBudget, 0),
    variance: items.reduce((s, i) => s + i.variance, 0),
  }));
}

const leadingNumber = (label: string) => {
  const m = label.match(/^(\d+)/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
};

export const panelByCategory = computePanelGroups(item => item.rangeLabel)
  .sort((a, b) => leadingNumber(a.category) - leadingNumber(b.category));
export const panelByEstimate = computePanelGroups(item => item.estimateGroup);
export const panelByLocation = computePanelGroups(item => item.location);
export const panelVarianceTotal = panelByCategory.reduce((s, g) => s + g.variance, 0);

// ─────────────────────────────────────────────────────────────────────────────
// v4.1 · Notes enriched dataset. Adds fake cost codes per category so the
// "expand category → see cost codes" interaction has more rows. Each category
// gets a mix of overage / zero codes; the v41notes view filters to overages
// only. Math is internally consistent — each category's revised budget is the
// sum of its codes' revised budgets.
const V41_NOTES_EXTRA: V4CostCode[] = [
  // 1000-1999 sitework
  { code: '1300', name: 'Erosion control',     rangeLabel: '1000-1999 Sitework',  estimateGroup: 'Phase 1 · sitework',   location: 'Site',          originalBudget: 3500,  coImpact: 420,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Silt fence + straw', amount: 1800 }] },
  { code: '1500', name: 'Temporary utilities', rangeLabel: '1000-1999 Sitework',  estimateGroup: 'Phase 1 · sitework',   location: 'Site',          originalBudget: 2200,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Power pole rental',  amount: 1100 }] },
  // 2000-2999 foundation
  { code: '2400', name: 'Waterproofing',       rangeLabel: '2000-2999 Foundation', estimateGroup: 'Phase 1 · sitework',  location: 'Whole house',   originalBudget: 4800,  coImpact: 350,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Membrane + drain board', amount: 3100 }] },
  { code: '2600', name: 'Backfill and grading', rangeLabel: '2000-2999 Foundation', estimateGroup: 'Phase 1 · sitework', location: 'Site',          originalBudget: 3200,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Backfill labor',     amount: 2400 }] },
  // 3000-3999 structural
  { code: '3300', name: 'Sheathing',           rangeLabel: '3000-3999 Framing', estimateGroup: 'Phase 2 · framing',   location: 'Whole house',   originalBudget: 6500,  coImpact: 580,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'OSB + house wrap',   amount: 4100 }] },
  { code: '3500', name: 'Beams and trusses',   rangeLabel: '3000-3999 Framing', estimateGroup: 'Phase 2 · framing',   location: 'Whole house',   originalBudget: 8800,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Truss package',      amount: 6200 }] },
  // 4000-4999 plumbing (already has 4400, 4500)
  { code: '4200', name: 'Water service',       rangeLabel: '4000-4999 Plumbing & HVAC',   estimateGroup: 'Phase 3 · MEP rough-in', location: 'Site',       originalBudget: 4500,  coImpact: 310,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Water line + meter', amount: 3400 }] },
  { code: '4700', name: 'Gas line',            rangeLabel: '4000-4999 Plumbing & HVAC',   estimateGroup: 'Phase 3 · MEP rough-in', location: 'Kitchen',    originalBudget: 2400,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Gas line install',   amount: 1900 }] },
  // 5000-5999 roofing (already has 5200)
  { code: '5400', name: 'Gutters and downspouts', rangeLabel: '5000-5999 Roofing', estimateGroup: 'Phase 2 · roofing',   location: 'Whole house',   originalBudget: 3200,  coImpact: 250,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Aluminum gutters',   amount: 2400 }] },
  { code: '5600', name: 'Skylights',           rangeLabel: '5000-5999 Roofing',    estimateGroup: 'Phase 2 · roofing',   location: 'Whole house',   originalBudget: 1800,  coImpact: 0,    selectionImpact: 320,  activity: [{ kind: 'Bill', name: 'Skylight units',     amount: 1500 }] },
  // 6000-6999 openings (already has 6100)
  { code: '6300', name: 'Interior doors',      rangeLabel: '6000-6999 Doors & windows',   estimateGroup: 'Phase 3 · openings',  location: 'Whole house',   originalBudget: 5200,  coImpact: 0,    selectionImpact: 480,  activity: [{ kind: 'Bill', name: 'Door slabs + hardware', amount: 3700 }] },
  { code: '6500', name: 'Garage doors',        rangeLabel: '6000-6999 Doors & windows',   estimateGroup: 'Phase 3 · openings',  location: 'Garage',        originalBudget: 3800,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Garage door unit',   amount: 3200 }] },
  // 7000-7999 electrical (already has 7500)
  { code: '7200', name: 'Lighting fixtures',   rangeLabel: '7000-7999 Electrical', estimateGroup: 'Phase 4 · finishes',  location: 'Whole house',   originalBudget: 4200,  coImpact: 0,    selectionImpact: 720,  activity: [{ kind: 'Bill', name: 'Fixture package',    amount: 3100 }] },
  { code: '7800', name: 'Low voltage',         rangeLabel: '7000-7999 Electrical', estimateGroup: 'Phase 4 · finishes',  location: 'Whole house',   originalBudget: 2800,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Data + AV rough',    amount: 2100 }] },
  // 8000-8999 thermal (already has 8100)
  { code: '8300', name: 'Air sealing',         rangeLabel: '8000-8999 Insulation',    estimateGroup: 'Phase 4 · insulation', location: 'Whole house', originalBudget: 1800,  coImpact: 200,  selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Caulk + foam',       amount: 1400 }] },
  // 9000-9999 finishes (already has 9300, 9400, 9600)
  { code: '9500', name: 'Countertops',         rangeLabel: '9000-9999 Finishes',   estimateGroup: 'Phase 5 · cabinetry', location: 'Kitchen and baths', originalBudget: 7200, coImpact: 0, selectionImpact: 640, activity: [{ kind: 'Bill', name: 'Quartz slabs',       amount: 5800 }] },
  { code: '9700', name: 'Interior paint',      rangeLabel: '9000-9999 Finishes',   estimateGroup: 'Phase 5 · finishes',  location: 'Whole house',   originalBudget: 6500,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Paint + labor',      amount: 5200 }] },
  { code: '9800', name: 'Trim and millwork',   rangeLabel: '9000-9999 Finishes',   estimateGroup: 'Phase 5 · finishes',  location: 'Whole house',   originalBudget: 5400,  coImpact: 0,    selectionImpact: 0,    activity: [{ kind: 'Bill', name: 'Base + casing',      amount: 4100 }] },
];

const V41_NOTES_PANEL_DATA: V4CostCode[] = [...V4_PANEL_DATA, ...V41_NOTES_EXTRA];

function computeGroupsFromData(data: V4CostCode[], grouper: (item: V4CostCode) => string): PanelCategory[] {
  const groups = new Map<string, PanelCategoryItem[]>();
  data.forEach(cc => {
    const category = grouper(cc);
    const revised = cc.originalBudget + cc.coImpact + cc.selectionImpact;
    const spent = cc.activity.reduce((s, a) => s + a.amount, 0);
    const item: PanelCategoryItem = {
      name: cc.name, code: cc.code,
      originalBudget: cc.originalBudget, coImpact: cc.coImpact, selectionImpact: cc.selectionImpact,
      revisedBudget: revised, spent, variance: spent - revised, activity: cc.activity,
    };
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(item);
  });
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items: [...items].sort((a, b) => Number(a.code) - Number(b.code)),
    originalBudget: items.reduce((s, i) => s + i.originalBudget, 0),
    revisedBudget: items.reduce((s, i) => s + i.revisedBudget, 0),
    variance: items.reduce((s, i) => s + i.variance, 0),
  }));
}

export const panelByCategoryV41Notes = computeGroupsFromData(V41_NOTES_PANEL_DATA, item => item.rangeLabel)
  .sort((a, b) => leadingNumber(a.category) - leadingNumber(b.category));

// Match JPS `fmtSigned`: positive prefixed with "+", negative uses default currency negative formatting.
const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
export const fmtSignedUsd = (n: number) => (n > 0 ? '+' : '') + fmtUsd(n);
