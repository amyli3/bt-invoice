import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import SelectionsModalV2 from './SelectionsModalV2';
import { BdsButton, BdsTextArea } from '../bds';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Data types ────────────────────────────────────────────────────

interface SOVLine {
  id: string;
  description: string;
  budget: number;
  previousInvoice: number;
  thisInvoice: number;
  storedMaterials: number;
  retainage: number;
  isAllowance?: boolean;
  isFromSelection?: boolean;
  hasError?: boolean;
  errorMsg?: string;
  highlight?: boolean;
  annotation?: string;
  costCodeMismatch?: boolean;
  warningMsg?: string;
  traceCode?: string;
  addedByCO?: string;
  isFromCost?: boolean;
  coAdjustment?: number;
  disablePct?: boolean;
  hideBalance?: boolean;
  hideBudget?: boolean;
  children?: SOVLine[];
}

interface CostGroup {
  id: string;
  label: string;
  lines: SOVLine[];
  isChangeOrder?: boolean;
  isSelection?: boolean;
}

// ─── Estimate line data (maps modal selections to SOV lines) ──────

const ESTIMATE_LINES = {
  kitchen: [
    { id: 'ke1', selId: 'ms-1', desc: '9030 - Kohler Farmhouse Sink', estimate: 2000, approved: 2500, allowanceCode: '9030', selectionCode: '9030' },
    { id: 'ke2', selId: 'ms-2', desc: '9030 - Delta Touchless Faucet', estimate: 1000, approved: 1500, allowanceCode: '9030', selectionCode: '9030' },
    { id: 'ke4', selId: 'ms-4', desc: '9030 - GE Dishwasher', estimate: 2000, approved: 2500, allowanceCode: '9030', selectionCode: '9030' },
  ],
  flooring: [
    { id: 'fe1', selId: 'ms-5', desc: '6010 - Engineered Hardwood — Living Room', estimate: 5000, approved: 4500, allowanceCode: '6010', selectionCode: '6010' },
    { id: 'fe2', selId: 'ms-6', desc: '6010 - Luxury Vinyl Plank — Entryway', estimate: 3000, approved: 2700, allowanceCode: '6010', selectionCode: '6010' },
  ],
  plumbing: [
    { id: 'pe1', selId: 'ms-12', desc: '4010 - Bathroom Faucet Set', estimate: 2000, approved: 2200, allowanceCode: '4010', selectionCode: '4010' },
    { id: 'pe2', selId: 'ms-13', desc: '4010 - Shower Valve Kit', estimate: 2000, approved: 2500, allowanceCode: '4010', selectionCode: '4010' },
  ],
  drywall: [
    { id: 'de1', selId: 'ms-7', desc: '7020 - Recessed Can Lights', estimate: 7000, approved: 8500, allowanceCode: '5003', selectionCode: '7020' },
    { id: 'de2', selId: 'ms-8', desc: '7030 - Pendant Fixtures', estimate: 3000, approved: 4000, allowanceCode: '5003', selectionCode: '7030' },
    { id: 'de3', selId: 'ms-9', desc: '7040 - Under-Cabinet Lighting', estimate: 1000, approved: 2500, allowanceCode: '5003', selectionCode: '7040' },
  ],
  hardware: [
    { id: 'he1', selId: 'ms-14', desc: '5050 - Cabinet Pulls', estimate: 1500, approved: 1200, allowanceCode: '5050', selectionCode: '5050' },
    { id: 'he2', selId: 'ms-15', desc: '5050 - Cabinet Knobs', estimate: 1500, approved: 800,  allowanceCode: '5050', selectionCode: '5050' },
  ],
};

// ─── "Add from Selections" modal data ─────────────────────────────

export interface ModalAllowance {
  id: string;
  name: string;
  costCode: string;
  budgetAmount: number;
  previouslyInvoiced: number;
  selections: ModalSelection[];
  scenarioNote?: string;
}

export interface ModalSelection {
  id: string;
  name: string;
  costCode: string;
  costType: string;
  originalPrice: number;
  approvedPrice: number;
  status: 'approved' | 'invoiced';
}

export const MODAL_ALLOWANCES: ModalAllowance[] = [
  {
    id: 'ma-1',
    name: 'Kitchen Allowance',
    costCode: '9030 - Kitchen Fixtures',
    budgetAmount: 5000,
    previouslyInvoiced: 5000,
    scenarioNote: 'Scenario 1 · Allowance previously invoiced, selections go over → invoice the overage',
    selections: [
      { id: 'ms-1', name: 'Kohler Farmhouse Sink', costCode: '9030', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
      { id: 'ms-2', name: 'Delta Touchless Faucet', costCode: '9030', costType: 'Material', originalPrice: 1000, approvedPrice: 1500, status: 'approved' },
      { id: 'ms-4', name: 'GE Dishwasher', costCode: '9030', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-2',
    name: 'Flooring Allowance',
    costCode: '6010 - Flooring',
    budgetAmount: 8000,
    previouslyInvoiced: 8000,
    scenarioNote: 'Scenario 4 · Allowance previously invoiced, selections come in under → net negative credit to client',
    selections: [
      { id: 'ms-5', name: 'Engineered Hardwood — Living Room', costCode: '6010', costType: 'Material', originalPrice: 5000, approvedPrice: 4500, status: 'approved' },
      { id: 'ms-6', name: 'Luxury Vinyl Plank — Entryway', costCode: '6010', costType: 'Labor', originalPrice: 3000, approvedPrice: 2700, status: 'approved' },
    ],
  },
  {
    id: 'ma-5',
    name: 'Plumbing Allowance',
    costCode: '4010 - Plumbing',
    budgetAmount: 4000,
    previouslyInvoiced: 0,
    scenarioNote: 'Scenario 2 · Allowance not yet invoiced, selections go over → invoice selections only (allowance row shows --)',
    selections: [
      { id: 'ms-12', name: 'Bathroom Faucet Set', costCode: '4010', costType: 'Material', originalPrice: 2000, approvedPrice: 2200, status: 'approved' },
      { id: 'ms-13', name: 'Shower Valve Kit', costCode: '4010', costType: 'Material', originalPrice: 2000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-3',
    name: 'Lighting Allowance',
    costCode: '5003 - Lighting',
    budgetAmount: 11000,
    previouslyInvoiced: 11000,
    scenarioNote: 'Scenario · Allowance previously invoiced, selections have different cost codes and go over → reverse the allowance and bill selections at their real codes (net overage)',
    selections: [
      { id: 'ms-7', name: 'Recessed Can Lights', costCode: '7020', costType: 'Material', originalPrice: 7000, approvedPrice: 8500, status: 'approved' },
      { id: 'ms-8', name: 'Pendant Fixtures', costCode: '7030', costType: 'Material', originalPrice: 3000, approvedPrice: 4000, status: 'approved' },
      { id: 'ms-9', name: 'Under-Cabinet Lighting', costCode: '7040', costType: 'Material', originalPrice: 1000, approvedPrice: 2500, status: 'approved' },
    ],
  },
  {
    id: 'ma-6',
    name: 'Cabinet Hardware Allowance',
    costCode: '5050 - Cabinet Hardware',
    budgetAmount: 3000,
    previouslyInvoiced: 3000,
    scenarioNote: 'Scenario · Allowance previously invoiced, selections at same cost code come in under → mark complete to issue credit for the underage',
    selections: [
      { id: 'ms-14', name: 'Cabinet Pulls', costCode: '5050', costType: 'Material', originalPrice: 1500, approvedPrice: 1200, status: 'approved' },
      { id: 'ms-15', name: 'Cabinet Knobs', costCode: '5050', costType: 'Material', originalPrice: 1500, approvedPrice: 800,  status: 'approved' },
    ],
  },
];

// ─── Cost Data (Bills, Time Clock, QB Costs) ─────────────────────
interface CostRecord {
  id: string;
  vendor: string;
  description: string;
  costCode: string;
  costType: 'Bills' | 'Time Clock' | 'QuickBooks Cost';
  date: string;
  amount: number;
}

const COST_RECORDS: CostRecord[] = [
  // Masonry costs (previously invoiced scenario)
  { id: 'cost-1', vendor: 'Stone Supply Co. #4892', description: 'Limestone blocks & mortar', costCode: '4100', costType: 'Bills', date: '2025-08-25', amount: 48000 },
  { id: 'cost-2', vendor: 'ABC Masonry Contractors', description: 'Foundation wall labor', costCode: '4100', costType: 'Bills', date: '2025-08-28', amount: 25000 },
  { id: 'cost-3', vendor: 'Masonry crew', description: 'Aug 1 – Aug 28, 2025', costCode: '4100', costType: 'Time Clock', date: '2025-08-28', amount: 5600 },
  // Framing costs (happy path — same invoice)
  { id: 'cost-4', vendor: 'Acme Lumber #7201', description: 'Framing lumber delivery', costCode: '3100', costType: 'Bills', date: '2025-09-10', amount: 32000 },
  { id: 'cost-5', vendor: 'ProFrame Contractors', description: 'Rough carpentry labor', costCode: '3100', costType: 'Bills', date: '2025-09-15', amount: 18500 },
  // Foundation costs (under budget scenario — $19,500 total vs $28,000 budget)
  { id: 'cost-6', vendor: 'Heartland Concrete Co', description: 'Foundation pour & forms', costCode: '2010', costType: 'Bills', date: '2025-07-15', amount: 8200 },
  { id: 'cost-7', vendor: 'Bedrock Excavation', description: 'Excavation & grading', costCode: '2010', costType: 'Bills', date: '2025-07-10', amount: 7000 },
  { id: 'cost-8', vendor: 'Heartland Concrete Co', description: 'Rebar & waterproofing', costCode: '2010', costType: 'Bills', date: '2025-07-18', amount: 4300 },
];

// Change order data — available for builder to pull in
interface ChangeOrderRecord {
  id: string;
  title: string;
  costCode: string;
  costType: string;
  amount: number;
  status: 'approved' | 'pending';
}

const CHANGE_ORDERS: ChangeOrderRecord[] = [
  { id: 'co-1', title: 'Change order #1', costCode: '4100', costType: 'Materials', amount: 13600, status: 'approved' },
  { id: 'co-2', title: 'Change order #2', costCode: '3100', costType: 'Labor', amount: 8500, status: 'approved' },
  // Budget reallocation: move $8,500 unused budget from Foundation to Framing (which has overage)
  { id: 'co-3a', title: 'Change order #3', costCode: '3100', costType: 'Labor', amount: 8500, status: 'pending' },
  { id: 'co-3b', title: 'Change order #3', costCode: '2010', costType: 'Materials', amount: -8500, status: 'pending' },
];

// ─── Scenario builders ─────────────────────────────────────────────

function makeEstimateGroups() {
  return {
    kitchen: {
      id: 'g3', label: 'Kitchen',
      lines: [{
        id: 'kitchen-allowance',
        description: '9030 - Kitchen Allowance',
        budget: 5000,
        previousInvoice: 5000,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        isAllowance: true,
      } as SOVLine],
    },
    flooring: {
      id: 'g4', label: 'Living Room Flooring',
      lines: [{
        id: 'flooring-allowance',
        description: '6010 - Flooring Allowance',
        budget: 8000,
        previousInvoice: 8000,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        isAllowance: true,
        annotation: 'Previously invoiced $8,000 — will reverse when selections are added',
      } as SOVLine],
    },
    plumbing: {
      id: 'g7', label: 'Plumbing',
      lines: [{
        id: 'plumbing-allowance',
        description: '4010 - Plumbing Allowance',
        budget: 4000,
        previousInvoice: 0,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        isAllowance: true,
      } as SOVLine],
    },
    drywall: {
      id: 'g5', label: 'Lighting',
      lines: [{
        id: 'drywall-allowance',
        description: '5003 - Lighting Allowance',
        budget: 11000,
        previousInvoice: 11000,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        isAllowance: true,
        annotation: 'Previously invoiced $11,000 — will reverse when selections are added',
      } as SOVLine],
    },
    hardware: {
      id: 'g6', label: 'Cabinet Hardware',
      lines: [{
        id: 'hardware-allowance',
        description: '5050 - Cabinet Hardware Allowance',
        budget: 3000,
        previousInvoice: 3000,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        isAllowance: true,
        annotation: 'Previously invoiced $3,000 — will reverse when selections are added',
      } as SOVLine],
    },
    masonry: {
      id: 'g8', label: 'Masonry',
      lines: [{
        id: 'masonry-stone',
        description: '4100 - Stone Masonry',
        budget: 65000,
        previousInvoice: 0,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
      } as SOVLine],
    },
    framing: {
      id: 'g9', label: 'Rough Carpentry',
      lines: [{
        id: 'framing-rough',
        description: '3100 - Framing (C)',
        budget: 42000,
        previousInvoice: 0,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
      } as SOVLine],
    },
    electrical: {
      id: 'g11', label: 'Foundation',
      lines: [{
        id: 'electrical-rough',
        description: '2010 - Foundation (C)',
        budget: 28000,
        previousInvoice: 0,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
      } as SOVLine],
    },
  };
}

// CO Columns view: estimate lines get coAdjustment when selections added (all three categories)
function getCostCodeViewGroups(addedIds: string[], completedIds: Set<string> = new Set()): CostGroup[] {
  const est = makeEstimateGroups();

  // Kitchen: combined into one allowance line — aggregate CO adjustments from added selections
  const addedKitchenItems = ESTIMATE_LINES.kitchen.filter(i => addedIds.includes(i.selId));
  const kitchenCOAdj = addedKitchenItems.reduce((s, i) => s + (i.approved - i.estimate), 0);
  est.kitchen.lines = [{
    id: 'kitchen-allowance',
    description: '9030 - Kitchen Allowance',
    budget: 5000,
    coAdjustment: kitchenCOAdj,
    previousInvoice: 5000,
    thisInvoice: addedKitchenItems.length > 0 ? kitchenCOAdj : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: addedKitchenItems.length === 0,
    isFromSelection: addedKitchenItems.length > 0,
  } as SOVLine];

  // Flooring: previously invoiced $8k. CO adj = total approved - budget. This invoice = just the overage (or credit).
  const addedFlooringCO = ESTIMATE_LINES.flooring.filter(i => addedIds.includes(i.selId));
  const flooringApprovedTotal = addedFlooringCO.reduce((s, i) => s + i.approved, 0);
  const flooringCOAdj = addedFlooringCO.length > 0 ? flooringApprovedTotal - 8000 : 0;
  const flooringChildren: SOVLine[] = addedFlooringCO.map(item => ({
    id: `child-${item.id}`,
    description: `${item.desc.replace(/^\d+ - /, '')}`,
    budget: item.estimate,
    coAdjustment: item.approved - item.estimate,
    previousInvoice: 0,
    thisInvoice: item.approved,
    storedMaterials: 0,
    retainage: 0,
    isFromSelection: true,
  } as SOVLine));

  est.flooring.lines = [{
    id: 'flooring-allowance',
    description: '6010 - Flooring Allowance',
    budget: 8000,
    coAdjustment: flooringCOAdj,
    previousInvoice: 8000,
    thisInvoice: addedFlooringCO.length > 0 ? flooringCOAdj : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    isFromSelection: addedFlooringCO.length > 0,
    children: flooringChildren.length > 0 ? flooringChildren : undefined,
  } as SOVLine];

  // Drywall (Lighting Allowance): previously invoiced $11k at 5003. Actual selections are
  // at electrical codes (7020/7030/7040). Reverse the allowance via an approved change and
  // add each selection as a flat top-level line — scheduled $0 since these aren't in the
  // original contract, full approved goes in approved changes and this invoice.
  // regroupByCostCode then buckets the allowance into Finishings (5000s) and the new
  // lines into Electrical (7000s), so each dollar lives at the code where the work is.
  // Net invoice change: +$4k overage.
  const addedDrywallCO = ESTIMATE_LINES.drywall.filter(i => addedIds.includes(i.selId));
  const drywallSelectionLines: SOVLine[] = addedDrywallCO.map(item => ({
    id: `child-${item.id}`,
    description: item.desc,
    budget: 0,
    coAdjustment: item.approved,
    previousInvoice: 0,
    thisInvoice: item.approved,
    storedMaterials: 0,
    retainage: 0,
    isFromSelection: true,
  } as SOVLine));

  est.drywall.lines = [{
    id: 'drywall-allowance',
    description: '5003 - Lighting Allowance',
    budget: 11000,
    coAdjustment: addedDrywallCO.length > 0 ? -11000 : 0,
    previousInvoice: 11000,
    thisInvoice: addedDrywallCO.length > 0 ? -11000 : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    isFromSelection: addedDrywallCO.length > 0,
  } as SOVLine, ...drywallSelectionLines];

  // Plumbing: never previously invoiced, same cost code — invoice full selection amounts.
  // Nothing was billed before, so This period = budget + approved-change overage (= the full
  // approved selection total, e.g. $4,000 + $700 = $4,700). Matches the estimate view and the
  // wizard's "Invoice amount"; cost-code view previously hard-coded This period to $0 (bug).
  const addedPlumbingCO = ESTIMATE_LINES.plumbing.filter(i => addedIds.includes(i.selId));
  const plumbingCOAdj = addedPlumbingCO.reduce((s, i) => s + (i.approved - i.estimate), 0);
  est.plumbing.lines = [{
    id: 'plumbing-allowance',
    description: '4010 - Plumbing Allowance',
    budget: 4000,
    coAdjustment: plumbingCOAdj,
    previousInvoice: 0,
    thisInvoice: addedPlumbingCO.length > 0 ? 4000 + plumbingCOAdj : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: addedPlumbingCO.length === 0,
    isFromSelection: addedPlumbingCO.length > 0,
  } as SOVLine];

  // Hardware (Cabinet Hardware Allowance): previously invoiced $3k at 5050. Selections at
  // the SAME cost code (5050) total $2k → -$1k underage credit. Because the codes match,
  // no reclassification is needed — the credit flows directly on the allowance row as a
  // negative thisInvoice. Gated behind mark-complete: until the builder confirms the
  // client is done picking, the allowance stays open with no SOV impact.
  const addedHardwareCO = ESTIMATE_LINES.hardware.filter(i => addedIds.includes(i.selId));
  const hardwareComplete = completedIds.has('ma-6');
  const hardwareActive = addedHardwareCO.length > 0 && hardwareComplete;
  const hardwareSelectionsSum = addedHardwareCO.reduce((s, i) => s + i.approved, 0);
  const hardwareCredit = hardwareActive ? hardwareSelectionsSum - 3000 : 0; // negative for underage
  const hardwareChildren: SOVLine[] = hardwareActive ? addedHardwareCO.map(item => ({
    id: `child-${item.id}`,
    description: item.desc.replace(/^\d+ - /, ''),
    budget: item.estimate,
    coAdjustment: item.approved - item.estimate,
    previousInvoice: 0,
    thisInvoice: item.approved - item.estimate,
    storedMaterials: 0,
    retainage: 0,
    isFromSelection: true,
    hideBalance: true,
  } as SOVLine)) : [];

  est.hardware.lines = [{
    id: 'hardware-allowance',
    description: '5050 - Cabinet Hardware Allowance',
    budget: 3000,
    coAdjustment: hardwareCredit,
    previousInvoice: 3000,
    thisInvoice: hardwareCredit,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    isFromSelection: hardwareActive,
    children: hardwareChildren.length > 0 ? hardwareChildren : undefined,
  } as SOVLine];

  return [est.electrical, est.masonry, est.framing, est.kitchen, est.flooring, est.plumbing, est.drywall, est.hardware];
}

// Helper to build adjustment lines from any estimate group.
// Matched items (selectionCode === allowanceCode) group under one allowance parent.
// Mismatched items emit as flat top-level rows at their own selection cost codes —
// keeps cost-code identity visible instead of burying it under an allowance bucket
// that no longer reflects where the money is actually being billed.
function buildAdjLines(items: typeof ESTIMATE_LINES.kitchen, addedIds: string[], allowanceName: string, _allowanceBudget: number, costCodeLabel: string = allowanceName): SOVLine[] {
  const addedItems = items.filter(item => addedIds.includes(item.selId));
  if (addedItems.length === 0) return [];

  const matchedItems = addedItems.filter(item => item.selectionCode === item.allowanceCode);
  const mismatchedItems = addedItems.filter(item => item.selectionCode !== item.allowanceCode);

  // Flat rows for mismatched items
  const flatLines: SOVLine[] = mismatchedItems.map(item => ({
    id: `adj-${item.id}`,
    description: item.desc,
    budget: item.approved,
    previousInvoice: 0,
    thisInvoice: item.approved,
    storedMaterials: 0,
    retainage: 0,
    isFromSelection: true,
    hideBalance: true,
  } as SOVLine));

  if (matchedItems.length === 0) return flatLines;

  // Group matched items by allowance cost code to create parent rows
  const byCostCode: Record<string, typeof matchedItems> = {};
  for (const item of matchedItems) {
    const code = item.allowanceCode;
    if (!byCostCode[code]) byCostCode[code] = [];
    byCostCode[code].push(item);
  }

  const groupedLines = Object.entries(byCostCode).map(([code, codeItems]) => {
    const totalBudget = codeItems.reduce((s, item) => {
      const codeMismatch = item.selectionCode !== item.allowanceCode;
      return s + (codeMismatch ? item.approved : (item.approved - item.estimate));
    }, 0);
    const totalThisInvoice = codeItems.reduce((s, item) => {
      const codeMismatch = item.selectionCode !== item.allowanceCode;
      return s + (codeMismatch ? item.approved : (item.approved - item.estimate));
    }, 0);

    // Build children — individual selection lines
    const children: SOVLine[] = codeItems.map(item => {
      const delta = item.approved - item.estimate;
      const codeMismatch = item.selectionCode !== item.allowanceCode;
      const adjAmount = codeMismatch ? item.approved : delta;
      // Look up cost type from MODAL_ALLOWANCES
      const selData = MODAL_ALLOWANCES.flatMap(a => a.selections).find(s => s.id === item.selId);
      const costType = selData?.costType || 'Material';
      return {
        id: `adj-${item.id}`,
        description: item.desc.replace(/^\d+ - /, ''),
        budget: codeMismatch ? item.approved : delta,
        previousInvoice: 0,
        thisInvoice: adjAmount,
        storedMaterials: 0,
        retainage: 0,
        isFromSelection: true,
        disablePct: false,
        hideBalance: true,
        highlight: adjAmount < 0,
        traceCode: `${item.selectionCode} - ${costType}`,
        costCodeMismatch: codeMismatch,
      } as SOVLine;
    });

    return {
      id: `adj-group-${code}-${allowanceName.replace(/\s/g, '')}`,
      // Grouped by the selection cost code, labeled by the cost code (not the allowance title).
      description: `${code} - ${costCodeLabel}`,
      budget: totalBudget,
      previousInvoice: 0,
      thisInvoice: totalThisInvoice,
      storedMaterials: 0,
      retainage: 0,
      isFromSelection: true,
      hideBalance: true,
      children,
    } as SOVLine;
  });

  return [...groupedLines, ...flatLines];
}

// Selection Adjustments: estimate lines stay, adjustments appear in own section (not a CO)
function getSelAdjGroups(addedIds: string[], completedIds: Set<string> = new Set()): CostGroup[] {
  const est = makeEstimateGroups();

  // Kitchen: combined into one allowance line — already invoiced at budget
  // Budget stays $5,000 (covers base estimates); overage handled by adjustment lines
  est.kitchen.lines = [{
    id: 'kitchen-allowance',
    description: '9030 - Kitchen Allowance',
    budget: 5000,
    previousInvoice: 5000,
    thisInvoice: 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
  } as SOVLine];

  // Flooring: previously invoiced $8,000. Selections total $7,200 = $800 credit (underage).
  const addedFlooringItems = ESTIMATE_LINES.flooring.filter(i => addedIds.includes(i.selId));
  est.flooring.lines = [{
    id: 'flooring-allowance',
    description: '6010 - Flooring Allowance',
    budget: 8000,
    previousInvoice: 8000,
    thisInvoice: 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    annotation: addedFlooringItems.length > 0
      ? 'Previously invoiced $8,000 — adjustments shown in Approved changes'
      : 'Previously invoiced $8,000 — will adjust when selections are added',
  } as SOVLine];

  // Drywall: allowance was already invoiced ($11,000) in a prior application.
  // Reverse the approved amount of each selection, but cap at the allowance budget.
  // Grid shows $0 budget for the allowance row when selections are added.
  const addedDrywallItems = ESTIMATE_LINES.drywall.filter(i => addedIds.includes(i.selId));
  const drywallApprovedSum = addedDrywallItems.reduce((s, i) => s + i.approved, 0);
  const drywallReversal = Math.min(drywallApprovedSum, 11000);
  const drywallAllowanceRemaining = 11000 - drywallReversal;
  est.drywall.lines = [{
    id: 'drywall-allowance',
    description: '5003 - Lighting Allowance',
    budget: addedDrywallItems.length > 0 ? 0 : 11000,
    previousInvoice: 11000,
    thisInvoice: drywallReversal > 0 ? -drywallReversal : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    disablePct: addedDrywallItems.length > 0,
    hideBalance: addedDrywallItems.length > 0,
    annotation: drywallReversal > 0
      ? `Previously invoiced $11,000 — reversing $${fmt(drywallReversal)} for invoiced selections · $${fmt(Math.max(0, drywallAllowanceRemaining))} remaining on allowance`
      : 'Previously invoiced $11,000 — will reverse as selections are added',
  } as SOVLine];

  // Plumbing: never previously invoiced — invoice full budget this period when selections are added
  const addedPlumbingItems = ESTIMATE_LINES.plumbing.filter(i => addedIds.includes(i.selId));
  est.plumbing.lines = [{
    id: 'plumbing-allowance',
    description: '4010 - Plumbing Allowance',
    budget: 4000,
    previousInvoice: 0,
    thisInvoice: addedPlumbingItems.length > 0 ? 4000 : 0,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
  } as SOVLine];

  // Hardware: matched cost codes (5050 throughout). When marked complete, the underage
  // is billed back as a credit directly on the allowance row — no reclassification needed
  // since selections live at the same cost code as the allowance.
  const addedHardwareItems = ESTIMATE_LINES.hardware.filter(i => addedIds.includes(i.selId));
  const hardwareCompleteEst = completedIds.has('ma-6');
  const hardwareActiveEst = addedHardwareItems.length > 0 && hardwareCompleteEst;
  const hardwareSumEst = addedHardwareItems.reduce((s, i) => s + i.approved, 0);
  const hardwareCreditEst = hardwareActiveEst ? hardwareSumEst - 3000 : 0;
  est.hardware.lines = [{
    id: 'hardware-allowance',
    description: '5050 - Cabinet Hardware Allowance',
    budget: 3000,
    previousInvoice: 3000,
    thisInvoice: hardwareCreditEst,
    storedMaterials: 0,
    retainage: 0,
    isAllowance: true,
    // When marked complete with a credit issued, the line is closed out — hide the
    // % and balance columns so the row doesn't look like there's still more to bill.
    // Estimate mode has no Approved changes column to communicate the revised total.
    disablePct: hardwareActiveEst,
    hideBalance: hardwareActiveEst,
    annotation: hardwareActiveEst
      ? `Marked complete · selections came in $${fmt(Math.abs(hardwareCreditEst))} under — credit issued`
      : addedHardwareItems.length > 0
        ? 'Previously invoiced $3,000 — mark complete to issue the underage credit'
        : 'Previously invoiced $3,000 — will credit any underage when marked complete',
  } as SOVLine];

  const groups: CostGroup[] = [est.electrical, est.masonry, est.framing, est.kitchen, est.flooring, est.plumbing, est.drywall, est.hardware];

  // Build all adjustment lines grouped by allowance
  const kitchenAdj = buildAdjLines(ESTIMATE_LINES.kitchen, addedIds, 'Kitchen Allowance', 5000, 'Kitchen Fixtures');
  const flooringAdj = buildAdjLines(ESTIMATE_LINES.flooring, addedIds, 'Flooring Allowance', 8000, 'Flooring');
  const plumbingAdj = buildAdjLines(ESTIMATE_LINES.plumbing, addedIds, 'Plumbing Allowance', 4000, 'Plumbing');
  const drywallAdj = buildAdjLines(ESTIMATE_LINES.drywall, addedIds, 'Lighting Allowance', 11000, 'Lighting');
  // Hardware (matched codes): the underage credit lives directly on the allowance row above,
  // so no Approved changes entries are needed for it.

  const allAdjLines = [...kitchenAdj, ...flooringAdj, ...plumbingAdj, ...drywallAdj];

  // Combine selection adjustments into "Approved changes" group
  if (allAdjLines.length > 0) {
    groups.push({
      id: 'approved-changes',
      label: 'Approved changes',
      lines: allAdjLines,
    });
  }

  return groups;
}

// ─── Group-by-cost-code regrouper ─────────────────────────────────

// Cost code range labels for grouping
const COST_CODE_RANGES: { min: number; max: number; label: string }[] = [
  { min: 2000, max: 2999, label: '2000 - 2999 Specialties' },
  { min: 3000, max: 3999, label: '3000 - 3999 Structural' },
  { min: 4000, max: 4999, label: '4000 - 4999 Plumbing' },
  { min: 5000, max: 5999, label: '5000 - 5999 Finishings' },
  { min: 6000, max: 6999, label: '6000 - 6999 Flooring' },
  { min: 7000, max: 7999, label: '7000 - 7999 Electrical' },
  { min: 9000, max: 9999, label: '9000 - 9999 Kitchen' },
];

function getCostCodeNumber(desc: string): number {
  const match = desc.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getRangeLabel(code: number): string {
  for (const r of COST_CODE_RANGES) {
    if (code >= r.min && code <= r.max) return r.label;
  }
  return `${Math.floor(code / 1000) * 1000} - ${Math.floor(code / 1000) * 1000 + 999} Other`;
}

function regroupByCostCode(groups: CostGroup[]): CostGroup[] {
  // Separate special groups (COs, Selection Adjustments) from estimate groups
  const specialGroups = groups.filter(g => g.isChangeOrder || g.isSelection);
  const estimateGroups = groups.filter(g => !g.isChangeOrder && !g.isSelection);

  // Collect all estimate lines and regroup by cost code range
  const allLines = estimateGroups.flatMap(g => g.lines);
  const byRange: Record<string, SOVLine[]> = {};

  for (const line of allLines) {
    const code = getCostCodeNumber(line.description);
    const rangeLabel = getRangeLabel(code);
    if (!byRange[rangeLabel]) byRange[rangeLabel] = [];
    byRange[rangeLabel].push(line);
  }

  // Also regroup selection adjustment lines by cost code range
  const adjGroups = specialGroups.filter(g => g.isSelection);
  const coGroups = specialGroups.filter(g => g.isChangeOrder);

  const adjLines = adjGroups.flatMap(g => g.lines);
  const adjByRange: Record<string, SOVLine[]> = {};

  for (const line of adjLines) {
    const code = getCostCodeNumber(line.description);
    const rangeLabel = getRangeLabel(code);
    if (!adjByRange[rangeLabel]) adjByRange[rangeLabel] = [];
    adjByRange[rangeLabel].push(line);
  }

  // Sort range keys by the numeric prefix
  const sortedRanges = Object.keys(byRange).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    return numA - numB;
  });

  const result: CostGroup[] = sortedRanges.map((rangeLabel, i) => ({
    id: `cc-${i}`,
    label: rangeLabel,
    lines: byRange[rangeLabel],
  }));

  // Add regrouped adjustment lines by cost code range
  const sortedAdjRanges = Object.keys(adjByRange).sort((a, b) => parseInt(a) - parseInt(b));
  for (const rangeLabel of sortedAdjRanges) {
    result.push({
      id: `cc-adj-${rangeLabel}`,
      label: `${rangeLabel} — Selection Adjustments`,
      isSelection: true,
      lines: adjByRange[rangeLabel],
    });
  }

  // CO groups stay as-is
  result.push(...coGroups);

  return result;
}

// ─── Helpers ───────────────────────────────────────────────────────

function lineCompleted(l: SOVLine) { return l.previousInvoice + l.thisInvoice + l.storedMaterials; }

function lineBalance(l: SOVLine) { return l.hideBalance ? 0 : l.budget - lineCompleted(l); }

function groupTotals(group: CostGroup) {
  const lines = group.lines;
  return {
    budget: lines.reduce((s, l) => s + l.budget, 0),
    previousInvoice: lines.reduce((s, l) => s + l.previousInvoice, 0),
    thisInvoice: lines.reduce((s, l) => s + l.thisInvoice, 0),
    storedMaterials: lines.reduce((s, l) => s + l.storedMaterials, 0),
    completed: lines.reduce((s, l) => s + lineCompleted(l), 0),
    balance: lines.reduce((s, l) => s + lineBalance(l), 0),
    retainage: lines.reduce((s, l) => s + l.retainage, 0),
  };
}

function grandTotals(groups: CostGroup[]) {
  const all = groups.flatMap(g => g.lines);
  return {
    budget: all.reduce((s, l) => s + l.budget, 0),
    previousInvoice: all.reduce((s, l) => s + l.previousInvoice, 0),
    thisInvoice: all.reduce((s, l) => s + l.thisInvoice, 0),
    storedMaterials: all.reduce((s, l) => s + l.storedMaterials, 0),
    completed: all.reduce((s, l) => s + lineCompleted(l), 0),
    balance: all.reduce((s, l) => s + lineBalance(l), 0),
    retainage: all.reduce((s, l) => s + l.retainage, 0),
  };
}

// ─── Row Components ────────────────────────────────────────────────

function GroupRow({ group, expanded, onToggle, showCOCols }: { group: CostGroup; expanded: boolean; onToggle: () => void; showCOCols?: boolean }) {
  const t = groupTotals(group);
  const groupCO = group.lines.reduce((s, l) => s + (l.coAdjustment || 0), 0);
  const groupRevised = t.budget + groupCO;
  const pctBase = showCOCols ? groupRevised : t.budget;
  const pct = pctBase > 0 ? (t.completed / pctBase * 100) : 0;
  const isOverage = pct > 100.5 && pctBase > 0;
  const balance = showCOCols
    ? group.lines.reduce((s, l) => {
        if (l.hideBalance) return s;
        const revised = l.budget + (l.coAdjustment || 0);
        return s + (revised - lineCompleted(l));
      }, 0)
    : t.balance;
  return (
    <tr
      style={{ background: '#f8fafc', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}
      onClick={onToggle}
    >
      <td style={{ ...cellStyle, fontWeight: 600, paddingLeft: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
          {group.label}
          {group.isChangeOrder && (
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: '#dbeafe', color: '#1d4ed8', fontWeight: 500 }}>CO</span>
          )}
          {group.isSelection && (
            <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: '#f3e8ff', color: '#7c3aed', fontWeight: 500 }}>Selections</span>
          )}
        </span>
      </td>
      <td style={numCellStyle}><strong>${fmt(t.budget)}</strong></td>
      {showCOCols && <td style={numCellStyle}><strong>{groupCO !== 0 ? `${groupCO > 0 ? '+' : ''}$${fmt(groupCO)}` : '—'}</strong></td>}
      {showCOCols && <td style={numCellStyle}><strong>${fmt(groupRevised)}</strong></td>}
      <td style={numCellStyle}><strong>${fmt(t.previousInvoice)}</strong></td>
      <td style={numCellStyle}><strong>${fmt(t.thisInvoice)}</strong></td>
      <td style={numCellStyle}><strong>${fmt(t.storedMaterials)}</strong></td>
      <td style={numCellStyle}><strong>${fmt(t.completed)}</strong></td>
      <td style={{ ...numCellStyle, textAlign: 'center', color: isOverage ? '#dc2626' : undefined, fontWeight: isOverage ? 700 : undefined }}><strong>{pctBase > 0 ? `${pct.toFixed(0)}%` : '—'}</strong></td>
      <td style={{ ...numCellStyle, color: balance < -0.01 ? '#dc2626' : undefined }}><strong>{balance < -0.01 ? `-$${fmt(Math.abs(balance))}` : `$${fmt(balance)}`}</strong></td>
      <td style={numCellStyle}><strong>${fmt(t.retainage)}</strong></td>
      <td style={{ ...pinnedColStyle, background: '#f8fafc' }} />
    </tr>
  );
}

function LineRow({ line, pctOverride, onPctChange, showCOCols, onLineClick, onRemove, pendingDelete, depth = 0 }: {
  line: SOVLine;
  pctOverride?: number;
  onPctChange?: (lineId: string, pct: number) => void;
  showCOCols?: boolean;
  onLineClick?: (lineId: string) => void;
  onRemove?: (lineId: string) => void;
  pendingDelete?: boolean;
  depth?: number;
}) {
  const [childExpanded, setChildExpanded] = useState(false);
  const hasChildren = line.children && line.children.length > 0;
  const coAdj = line.coAdjustment || 0;
  const revisedBudget = line.budget + coAdj;
  const pctBase = showCOCols ? revisedBudget : line.budget;
  // Base % from original data (before any user override) — used as floor for cost lines
  const baseCompleted = line.thisInvoice + line.previousInvoice + line.storedMaterials;
  const basePct = pctBase > 0 ? Math.round(baseCompleted / pctBase * 100) : 0;

  const effectiveThisInvoice = pctOverride !== undefined && pctBase > 0
    ? Math.round((pctOverride / 100) * pctBase - line.previousInvoice - line.storedMaterials)
    : line.thisInvoice;
  const completed = effectiveThisInvoice + line.previousInvoice + line.storedMaterials;
  const pct = pctBase > 0 ? (completed / pctBase * 100) : 0;
  const balance = pctBase - completed;
  // Minimum % = what's already been invoiced — can't go below this
  const minPct = pctBase > 0 ? Math.round((line.previousInvoice + line.storedMaterials) / pctBase * 100) : 0;
  // For cost lines: floor is the % from costs+CO, not just previous invoices
  const costFloorPct = line.isFromCost ? basePct : minPct;

  const pctInfo = line.budget === 0 && completed > 0 && !line.isFromSelection
    ? { text: 'ERR', broken: true }
    : pct > 100.5 ? { text: `${pct.toFixed(0)}%`, broken: true }
    : pct < 0 ? { text: `${pct.toFixed(0)}%`, broken: true }
    : { text: `${pct.toFixed(0)}%`, broken: false };

  return (
    <>
      <tr className="aia-sov-row" style={{
        borderBottom: '1px solid #f1f5f9',
        background: pendingDelete ? '#fef8f8' : line.hasError ? '#fef2f2' : line.highlight ? '#fffbeb' : line.isFromSelection ? '#f0fdf4' : 'white',
        opacity: pendingDelete ? 0.5 : 1,
        transition: 'opacity 0.15s',
      }}>
        <td style={{ ...cellStyle, paddingLeft: 36 + depth * 28 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {hasChildren && (
              <svg
                width="12" height="12" viewBox="0 0 12 12"
                style={{ transform: childExpanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0, cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setChildExpanded(!childExpanded); }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            )}
            {!line.isFromSelection && !line.addedByCO && !line.isAllowance && !line.disablePct && (
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M26.9945 4.85074C26.9182 3.81588 26.0544 3 25 3H7L6.85074 3.00549C5.81588 3.08183 5 3.94564 5 5V27L5.00549 27.1493C5.08183 28.1841 5.94564 29 7 29H25L25.1493 28.9945C26.1841 28.9182 27 28.0544 27 27V5L26.9945 4.85074ZM7 5H25V27H7V5ZM11 22C11.8284 22 12.5 22.6716 12.5 23.5C12.5 24.3284 11.8284 25 11 25C10.1716 25 9.5 24.3284 9.5 23.5C9.5 22.6716 10.1716 22 11 22ZM17.5 23.5C17.5 22.6716 16.8284 22 16 22C15.1716 22 14.5 22.6716 14.5 23.5C14.5 24.3284 15.1716 25 16 25C16.8284 25 17.5 24.3284 17.5 23.5ZM21 22C21.8284 22 22.5 22.6716 22.5 23.5C22.5 24.3284 21.8284 25 21 25C20.1716 25 19.5 24.3284 19.5 23.5C19.5 22.6716 20.1716 22 21 22ZM12.5 18.5C12.5 17.6716 11.8284 17 11 17C10.1716 17 9.5 17.6716 9.5 18.5C9.5 19.3284 10.1716 20 11 20C11.8284 20 12.5 19.3284 12.5 18.5ZM16 17C16.8284 17 17.5 17.6716 17.5 18.5C17.5 19.3284 16.8284 20 16 20C15.1716 20 14.5 19.3284 14.5 18.5C14.5 17.6716 15.1716 17 16 17ZM22.5 18.5C22.5 17.6716 21.8284 17 21 17C20.1716 17 19.5 17.6716 19.5 18.5C19.5 19.3284 20.1716 20 21 20C21.8284 20 22.5 19.3284 22.5 18.5ZM22 7C22.5128 7 22.9355 7.38604 22.9933 7.88338L23 8V14C23 14.5128 22.614 14.9355 22.1166 14.9933L22 15H10C9.48716 15 9.06449 14.614 9.00673 14.1166L9 14V8C9 7.48716 9.38604 7.06449 9.88338 7.00673L10 7H22ZM11 9H21V13H11V9Z" fill="#202227"/>
              </svg>
            )}
            {line.isFromSelection && !line.addedByCO && !line.isAllowance && (
              <svg width="14" height="14" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M3.10887 1.65304C3.29196 0.614695 4.24544 -0.0943093 5.27783 0.010202L5.42578 0.0307185L12.3194 1.24626C13.3578 1.42935 14.0668 2.38283 13.9623 3.41522L13.9418 3.56317L12.556 11.416L20.05 8.68856C21.0385 8.32876 22.1265 8.79705 22.5543 9.73909L22.6134 9.8839L25.0075 16.4618C25.1753 16.9228 25.1674 17.4281 24.9878 17.8818L24.9864 23.3422C24.9864 24.3966 24.1706 25.2604 23.1357 25.3367L22.9864 25.3422H5.48644C5.20012 25.3422 4.91927 25.3204 4.63683 25.2762C1.67321 24.8119 -0.353451 21.9856 0.0514701 19.0171L0.0854597 18.7996L3.10887 1.65304ZM22.986 19.326L11.95 23.342L22.9864 23.3422L22.986 19.326ZM2.05508 19.1469L5.07848 2.00033L11.9721 3.21587L8.93329 20.45L8.89543 20.6357C8.48394 22.4102 6.76677 23.5848 4.94602 23.3003C3.02845 22.9998 1.71023 21.1026 2.05508 19.1469ZM20.734 10.5679L12.155 13.69L10.9029 20.7973C10.8491 21.1025 10.771 21.3974 10.671 21.6805L23.1281 17.1458L20.734 10.5679ZM6.98647 19.8422C6.98647 19.0138 6.3149 18.3422 5.48647 18.3422C4.65805 18.3422 3.98647 19.0138 3.98647 19.8422C3.98647 20.6707 4.65805 21.3422 5.48647 21.3422C6.3149 21.3422 6.98647 20.6707 6.98647 19.8422Z" fill="#202227"/>
              </svg>
            )}
            {line.addedByCO && depth === 0 && (
              <svg width="11" height="14" viewBox="0 0 20 26" fill="none" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.91 0.00399798L15 0L15.0752 0.00278786L15.2007 0.0202401L15.3121 0.0497381L15.4232 0.0936734L15.5207 0.145995L15.6254 0.219689L15.7071 0.292893L19.7071 4.29289C20.0976 4.68342 20.0976 5.31658 19.7071 5.70711C19.3466 6.06759 18.7794 6.09532 18.3871 5.7903L18.2929 5.70711L16 3.415V7.09839C16 9.16872 14.9333 11.0864 13.1893 12.1805L12.9768 12.3078L4.01544 17.4286C2.83474 18.1033 2.08228 19.3284 2.00635 20.676L2 20.9016V25C2 25.5523 1.55228 26 1 26C0.487164 26 0.0644928 25.614 0.00672773 25.1166L0 25V20.9016C0 18.8313 1.06668 16.9136 2.81066 15.8195L3.02317 15.6922L11.9846 10.5714C13.1653 9.89667 13.9177 8.67163 13.9937 7.32405L14 7.09839V3.415L11.7071 5.70711C11.3466 6.06759 10.7794 6.09532 10.3871 5.7903L10.2929 5.70711C9.93241 5.34662 9.90468 4.77939 10.2097 4.3871L10.2929 4.29289L14.2929 0.292893C14.3283 0.257499 14.3657 0.225313 14.4047 0.196335L14.5159 0.124671L14.6287 0.0712255L14.734 0.0358451L14.8515 0.0110178L14.91 0.00399798ZM15 16C15.5128 16 15.9355 16.386 15.9933 16.8834L16 17V25C16 25.5523 15.5523 26 15 26C14.4872 26 14.0645 25.614 14.0067 25.1166L14 25V17C14 16.4477 14.4477 16 15 16ZM1.99327 1.88338C1.93551 1.38604 1.51284 1 1 1C0.447715 1 0 1.44772 0 2V12L0.00672773 12.1166C0.0644928 12.614 0.487164 13 1 13C1.55228 13 2 12.5523 2 12V2L1.99327 1.88338Z" fill="#202227"/>
              </svg>
            )}
            {line.isAllowance && (
              <svg width="15" height="11" viewBox="0 0 30 22" fill="none" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M3.51857 1.4061C1.64633 2.24861 0 3.61874 0 5.5V10.5C0 12.3821 1.64529 13.7523 3.51783 14.5948C4.77391 15.1599 6.3076 15.5765 8 15.8037V16.5C8 18.3821 9.64529 19.7523 11.5178 20.5948C13.4838 21.4793 16.1298 22 19 22C21.8702 22 24.5162 21.4793 26.4822 20.5948C28.3547 19.7523 30 18.3821 30 16.5V11.5131L30 11.5C30 9.84589 28.7143 8.58928 27.189 7.75913C25.8124 7.00988 24.0109 6.46881 22 6.19548V5.5C22 3.61874 20.3537 2.24861 18.4814 1.4061C16.5153 0.521349 13.8693 0 11 0C8.13066 0 5.48468 0.521349 3.51857 1.4061ZM4.3393 3.22994C2.59225 4.01611 2 4.89598 2 5.5C2 6.10402 2.59225 6.98389 4.3393 7.77006C5.13218 8.12685 6.08627 8.42432 7.15729 8.6373C7.18196 8.6412 7.20634 8.646 7.23038 8.65167C8.37378 8.87383 9.64802 9 11 9C12.352 9 13.6262 8.87383 14.7696 8.65167C14.7937 8.646 14.818 8.6412 14.8427 8.6373C15.9137 8.42432 16.8678 8.12685 17.6607 7.77006C19.4077 6.98389 20 6.10402 20 5.5C20 4.89598 19.4077 4.01611 17.6607 3.22994C16.0075 2.48601 13.6535 2 11 2C8.34649 2 5.99248 2.48601 4.3393 3.22994ZM14 10.8034C13.0435 10.932 12.0363 11 11 11C9.9637 11 8.95653 10.932 8 10.8034V13.7839C8.93561 13.9232 9.94401 14 11 14C12.056 14 13.0644 13.9232 14 13.7839V10.8034ZM16 13.363V10.4293C16.9071 10.2078 17.7423 9.92652 18.4814 9.5939C19.0172 9.3528 19.5345 9.06848 20 8.74135V10.5C20 11.1054 19.4078 11.9852 17.6616 12.7709C17.1669 12.9934 16.6095 13.1928 16 13.363ZM14 16.4303C13.4389 16.2942 12.9059 16.1359 12.407 15.9578C11.9455 15.9857 11.4758 16 11 16C10.6633 16 10.3298 15.9928 10 15.9788V16.5C10 17.1054 10.5922 17.9852 12.3384 18.7709C12.8331 18.9934 13.3905 19.1928 14 19.363V16.4303ZM16 19.7839V16.8029C16.9558 16.9313 17.9631 17 19 17C20.0364 17 21.0435 16.9321 22 16.8037V19.7839C21.0644 19.9232 20.056 20 19 20C17.944 20 16.9356 19.9232 16 19.7839ZM6 10.4293C5.09294 10.2078 4.25771 9.92652 3.51857 9.5939C2.98278 9.3528 2.46549 9.06848 2 8.74135V10.5C2 11.1054 2.59221 11.9852 4.33842 12.7709C4.83306 12.9934 5.39049 13.1928 6 13.363V10.4293ZM28 11.4949L28 11.5V11.507C27.9954 12.1122 27.401 12.9882 25.6616 13.7708C24.8712 14.1264 23.9205 14.423 22.8533 14.6357C22.8216 14.6404 22.7903 14.6465 22.7596 14.6541C21.619 14.8747 20.3483 15 19 15C18.521 15 18.0511 14.984 17.593 14.9534C17.9025 14.8417 18.1994 14.722 18.4822 14.5948C20.3547 13.7523 22 12.3821 22 10.5V8.21582C23.7141 8.47406 25.173 8.93892 26.2329 9.5158C27.5627 10.2395 27.9972 10.9742 28 11.4949ZM24 16.4299V19.363C24.6095 19.1928 25.1669 18.9934 25.6616 18.7709C27.4078 17.9852 28 17.1054 28 16.5V14.7427C27.5348 15.0696 27.0178 15.3538 26.4822 15.5947C25.7429 15.9274 24.9074 16.2085 24 16.4299Z" fill="#202227"/>
              </svg>
            )}
            <span
              onClick={
                line.addedByCO && onLineClick
                  ? (e) => { e.stopPropagation(); onLineClick(line.id); }
                  : hasChildren
                    ? (e) => { e.stopPropagation(); setChildExpanded(!childExpanded); }
                    : onLineClick
                      ? (e) => { e.stopPropagation(); onLineClick(line.id); }
                      : undefined
              }
              style={
                (line.addedByCO && onLineClick) || (!hasChildren && onLineClick)
                  ? { cursor: 'pointer', color: '#0065db', textDecoration: 'underline', textDecorationColor: '#bfdbfe', textUnderlineOffset: 2 }
                  : hasChildren ? { cursor: 'pointer' } : undefined
              }
            >{line.description}</span>

          </span>
          {line.traceCode && (
            <div style={{ marginTop: 3, paddingLeft: depth > 0 ? 0 : 36, fontSize: 11, color: '#94a3b8' }}>
              {line.traceCode}
            </div>
          )}
        </td>
        <td style={numCellStyle}>{line.hideBudget ? <span style={{ color: '#94a3b8' }}>--</span> : `$${fmt(line.budget)}`}</td>
        {showCOCols && (
          <td style={numCellStyle}>
            {coAdj !== 0 ? `${coAdj > 0 ? '+' : ''}$${fmt(coAdj)}` : <span style={{ color: '#94a3b8' }}>--</span>}
          </td>
        )}
        {showCOCols && (
          <td style={{ ...numCellStyle, fontWeight: coAdj !== 0 ? 600 : 400 }}>
            {line.hideBudget ? <span style={{ color: '#94a3b8' }}>--</span> : `$${fmt(revisedBudget)}`}
          </td>
        )}
        <td style={numCellStyle}>${fmt(line.previousInvoice)}</td>
        <td
          className={effectiveThisInvoice < 0 && line.annotation ? 'aia-tooltip-cell' : undefined}
          style={{
            ...numCellStyle,
            background: effectiveThisInvoice < 0 && line.annotation ? '#fefce8' : undefined,
            color: effectiveThisInvoice < 0 && !line.annotation ? '#dc2626' : undefined,
            position: 'relative',
          }}
        >
          {effectiveThisInvoice < 0 && line.annotation && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4, verticalAlign: 'middle', color: '#92400e', cursor: 'help' }}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1"/>
              <path d="M8 5.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
          {effectiveThisInvoice < 0 ? `-$${fmt(Math.abs(effectiveThisInvoice))}` : `$${fmt(effectiveThisInvoice)}`}
          {effectiveThisInvoice < 0 && line.annotation && (
            <div className="aia-tooltip-popup" style={{
              position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
              background: 'white', color: '#334155', padding: '12px 16px', borderRadius: 8,
              fontSize: 12, lineHeight: 1.5, width: 280, border: '1px solid #e2e8f0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s', zIndex: 50,
              wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal', textAlign: 'left',
            }}>
              {line.annotation}
            </div>
          )}
        </td>
        <td style={numCellStyle}>${fmt(line.storedMaterials)}</td>
        <td style={numCellStyle}>${fmt(completed)}</td>
        <td style={{ ...numCellStyle, textAlign: 'center', padding: '0 4px' }}>
          {line.disablePct ? (
            <span style={{ color: '#94a3b8' }}>--</span>
          ) : (line.isFromCost && onPctChange) ? (
            <input
              type="number"
              min={costFloorPct}
              max={100}
              value={pctOverride !== undefined ? pctOverride : Math.round(pct)}
              onChange={(e) => onPctChange(line.id, Math.max(costFloorPct, Math.min(100, Number(e.target.value))))}
              title={`Minimum ${costFloorPct}% — costs already applied`}
              style={{
                width: 48,
                padding: '2px 4px',
                fontSize: 12,
                textAlign: 'center',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: 'white',
                color: pctInfo.broken ? '#dc2626' : '#334155',
                fontWeight: pctInfo.broken ? 700 : 400,
              }}
            />
          ) : onPctChange ? (
            <input
              type="number"
              min={minPct}
              max={100}
              value={pctOverride !== undefined ? pctOverride : Math.round(pct)}
              onChange={(e) => onPctChange(line.id, Math.max(minPct, Math.min(100, Number(e.target.value))))}
              title={minPct > 0 ? `Minimum ${minPct}% — already invoiced` : undefined}
              style={{
                width: 48,
                padding: '2px 4px',
                fontSize: 12,
                textAlign: 'center',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: 'white',
                color: pctInfo.broken ? '#dc2626' : '#334155',
                fontWeight: pctInfo.broken ? 700 : 400,
              }}
            />
          ) : (
            <span style={{
              color: pctInfo.broken ? '#dc2626' : undefined,
              fontWeight: pctInfo.broken ? 700 : 400,
            }}>
              {pctInfo.text}
            </span>
          )}
        </td>
        <td style={numCellStyle}>
          {line.hideBalance ? (line.disablePct ? <span style={{ color: '#94a3b8' }}>--</span> : '$0.00') : (balance < -0.01) ? `-$${fmt(Math.abs(balance))}` : `$${fmt(Math.abs(balance))}`}
        </td>
        <td style={numCellStyle}>${fmt(line.retainage)}</td>
        <td style={{ ...pinnedColStyle, background: 'white' }}>
          {(line.isFromSelection || line.isFromCost) && !line.isAllowance && onRemove && (
            <button
              className="aia-row-delete"
              onClick={(e) => { e.stopPropagation(); onRemove(line.id); }}
              title="Remove from invoice"
              style={{
                width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0',
                background: '#fef2f2', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0,
                opacity: 0, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M19 3C20.5977 3 21.9037 4.24892 21.9949 5.82373L22 6L21.9995 7H26.9995C27.5518 7 27.9995 7.44771 27.9995 8C27.9995 8.51284 27.6135 8.93551 27.1161 8.99327L26.9995 9H25.9995L26 27C26 28.0544 25.1841 28.9182 24.1493 28.9945L24 29H8C6.94564 29 6.08184 28.1841 6.00549 27.1493L6 27L5.99951 9H4.99951C4.44723 9 3.99951 8.55229 3.99951 8C3.99951 7.48717 4.38555 7.0645 4.88289 7.00673L4.99951 7H9.99951L10 6C10 4.40232 11.2489 3.09634 12.8237 3.00509L13 3H19ZM23.9995 9H7.99951L8 27H24L23.9995 9ZM13.9933 13.8834C13.9355 13.386 13.5128 13 13 13C12.4477 13 12 13.4477 12 14V22L12.0067 22.1166C12.0645 22.614 12.4872 23 13 23C13.5523 23 14 22.5523 14 22V14L13.9933 13.8834ZM19 13C19.5128 13 19.9355 13.386 19.9933 13.8834L20 14V22C20 22.5523 19.5523 23 19 23C18.4872 23 18.0645 22.614 18.0067 22.1166L18 22V14C18 13.4477 18.4477 13 19 13ZM13 5H19L19.1166 5.00673C19.614 5.06449 20 5.48716 20 6L19.9995 7H11.9995L12 6L12.0067 5.88338C12.0645 5.38604 12.4872 5 13 5Z" fill="#dc2626"/>
              </svg>
            </button>
          )}
        </td>
      </tr>
      {hasChildren && childExpanded && line.children!.map(child => (
        <LineRow
          key={child.id}
          line={child}
          showCOCols={showCOCols}
          onLineClick={onLineClick}
          onRemove={onRemove}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

function GroupSection({ group, expanded, onToggle, pctOverrides, onPctChange, showCOCols, onLineClick, onRemove, pendingDeleteIds }: {
  group: CostGroup; expanded: boolean; onToggle: () => void;
  pctOverrides?: Record<string, number>;
  onPctChange?: (lineId: string, pct: number) => void;
  showCOCols?: boolean;
  onLineClick?: (lineId: string) => void;
  onRemove?: (lineId: string) => void;
  pendingDeleteIds?: Set<string>;
}) {
  return (
    <>
      <GroupRow group={group} expanded={expanded} onToggle={onToggle} showCOCols={showCOCols} />
      {expanded && group.lines.map(line => (
        <LineRow
          key={line.id}
          line={line}
          pctOverride={pctOverrides?.[line.id]}
          onPctChange={onPctChange}
          showCOCols={showCOCols}
          onLineClick={onLineClick}
          onRemove={onRemove}
          pendingDelete={pendingDeleteIds?.has(line.id)}
        />
      ))}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export interface OverageInfo {
  costCode: string;
  label: string;
  budget: number;
  invoiced: number;
  overage: number;
}

export default function AIAPayApp({ onNavigate, approvedCOIds, addedCostIds: externalCostIds, onCostIdsChange, addedCOIds: externalCOIds, onCOIdsChange, groupBy: externalGroupBy, onGroupByChange, onOveragesChange }: { onNavigate?: (page: string) => void; approvedCOIds?: string[]; addedCostIds?: string[]; onCostIdsChange?: (ids: string[]) => void; addedCOIds?: string[]; onCOIdsChange?: (ids: string[]) => void; groupBy?: 'estimate' | 'costcode'; onGroupByChange?: (v: 'estimate' | 'costcode') => void; onOveragesChange?: (overages: OverageInfo[]) => void }) {
  const [localGroupBy, setLocalGroupBy] = useState<'estimate' | 'costcode'>('estimate');
  const groupBy = externalGroupBy ?? localGroupBy;
  const setGroupBy = (v: 'estimate' | 'costcode') => { setLocalGroupBy(v); onGroupByChange?.(v); };
  const [showSwitchViewDialog, setShowSwitchViewDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // line ID pending delete
  // Cost codes that were previously invoiced (negative adjustment scenario)
  const previouslyInvoicedCodes = new Set(['4100']);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ g2: true, g3: true, g4: true, g5: true, g7: true, g8: true, g9: true, g11: true, seladj: true, 'co-standalone': true, 'approved-changes': true });
  const [dateTab, setDateTab] = useState<'date' | 'schedule'>('date');
  const [pctOverrides, setPctOverrides] = useState<Record<string, number>>({});

  // "Add from" modal state
  const [showAddFromModal, setShowAddFromModal] = useState(false);
  const [showSelectionsV2Modal, setShowSelectionsV2Modal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showCOModal, setShowCOModal] = useState(false);
  const [addFromDropdownOpen, setAddFromDropdownOpen] = useState(false);
  const addFromDropdownRef = useRef<HTMLDivElement>(null);

  // Cost IDs — use external state if provided, local fallback otherwise
  const [localCostIds, setLocalCostIds] = useState<string[]>([]);
  const addedCostIds = externalCostIds ?? localCostIds;
  const setAddedCostIds = (updater: string[] | ((prev: string[]) => string[])) => {
    const next = typeof updater === 'function' ? updater(addedCostIds) : updater;
    setLocalCostIds(next);
    onCostIdsChange?.(next);
  };
  // CO IDs — use external state if provided, local fallback otherwise
  const [localCOIds, setLocalCOIds] = useState<string[]>([]);
  const addedCOIds = externalCOIds ?? localCOIds;
  const setAddedCOIds = (updater: string[] | ((prev: string[]) => string[])) => {
    const next = typeof updater === 'function' ? updater(addedCOIds) : updater;
    setLocalCOIds(next);
    onCOIdsChange?.(next);
  };

  // Auto-pull approved COs into the progress invoice
  useEffect(() => {
    if (!approvedCOIds || approvedCOIds.length === 0) return;
    setAddedCOIds(prev => {
      const newIds = approvedCOIds.filter(id => !prev.includes(id));
      return newIds.length > 0 ? [...prev, ...newIds] : prev;
    });
  }, [approvedCOIds]);

  useEffect(() => {
    if (!addFromDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (addFromDropdownRef.current && !addFromDropdownRef.current.contains(e.target as Node)) setAddFromDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addFromDropdownOpen]);
  const [modalChecked, setModalChecked] = useState<Record<string, boolean>>({});
  const [addedSelectionIds, setAddedSelectionIds] = useState<string[]>([]);
  // V1 selections wizard (which had the mark-complete affordance) was archived
  // in favor of the V2 wizard. The completed-allowance set is still read by the
  // continuation-sheet grouping below, but nothing toggles it anymore.
  const [completedAllowanceIds] = useState<Set<string>>(new Set());

  const handlePctChange = (lineId: string, pct: number) => {
    setPctOverrides(prev => ({ ...prev, [lineId]: pct }));
  };

  const handleModalToggleAll = (allowanceId: string) => {
    const allowance = MODAL_ALLOWANCES.find(a => a.id === allowanceId);
    if (!allowance) return;
    const available = allowance.selections.filter(s => !addedSelectionIds.includes(s.id));
    const allChecked = available.every(s => modalChecked[s.id]);
    const updates: Record<string, boolean> = {};
    available.forEach(s => { updates[s.id] = !allChecked; });
    setModalChecked(prev => ({ ...prev, ...updates }));
  };

  const handleAddSelections = () => {
    const newIds = Object.entries(modalChecked)
      .filter(([_, checked]) => checked)
      .map(([id]) => id)
      .filter(id => !addedSelectionIds.includes(id));
    setAddedSelectionIds(prev => [...prev, ...newIds]);
    // Auto-fill % complete to 100 for newly added selection lines
    const allEstItems = [...ESTIMATE_LINES.kitchen, ...ESTIMATE_LINES.flooring, ...ESTIMATE_LINES.plumbing, ...ESTIMATE_LINES.drywall, ...ESTIMATE_LINES.hardware];
    const pctUpdates: Record<string, number> = {};
    for (const selId of newIds) {
      const estItem = allEstItems.find(i => i.selId === selId);
      if (estItem) {
        // Kitchen lines use the estimate item id directly; drywall/flooring use child- prefix
        pctUpdates[estItem.id] = 100;
        pctUpdates[`child-${estItem.id}`] = 100;
        pctUpdates[`adj-${estItem.id}`] = 100;
      }
    }
    setPctOverrides(prev => ({ ...prev, ...pctUpdates }));
    setModalChecked({});
    setShowAddFromModal(false);
  };

  // Remove a selection from the invoice — removes ALL selections from the same allowance group
  // Actually perform line removal
  const doRemoveLine = (lineId: string) => {
    // Check if it's a cost line or a cost child — find the matching cost code and remove all costs for it
    const allLines = groups.flatMap(g => g.lines);
    const costLine = allLines.find(l => l.id === lineId && l.isFromCost);
    // Also check if it's a child of a cost line
    const parentCostLine = !costLine
      ? allLines.find(l => l.isFromCost && l.children?.some(ch => ch.id === lineId))
      : null;
    const targetLine = costLine || parentCostLine;
    if (targetLine) {
      const match = targetLine.description.match(/^(\d+)/);
      const code = match ? match[1] : '';
      if (code) {
        // Remove all cost records with this cost code
        const costIdsToRemove = COST_RECORDS.filter(c => c.costCode === code).map(c => c.id);
        setAddedCostIds(prev => prev.filter(id => !costIdsToRemove.includes(id)));
        // Also remove related CO IDs
        const coIdsToRemove = CHANGE_ORDERS.filter(co => co.costCode === code).map(co => co.id);
        setAddedCOIds(prev => prev.filter(id => !coIdsToRemove.includes(id)));
      }
      return;
    }

    // Selection line removal (existing logic)
    const estGroups = [
      { items: ESTIMATE_LINES.kitchen, selIds: ESTIMATE_LINES.kitchen.map(i => i.selId) },
      { items: ESTIMATE_LINES.flooring, selIds: ESTIMATE_LINES.flooring.map(i => i.selId) },
      { items: ESTIMATE_LINES.plumbing, selIds: ESTIMATE_LINES.plumbing.map(i => i.selId) },
      { items: ESTIMATE_LINES.drywall, selIds: ESTIMATE_LINES.drywall.map(i => i.selId) },
      { items: ESTIMATE_LINES.hardware, selIds: ESTIMATE_LINES.hardware.map(i => i.selId) },
    ];
    const rawId = lineId.replace(/^(adj-|child-)/, '');
    const group = estGroups.find(g => g.items.some(i => i.id === rawId));
    if (group) {
      const groupSelIds = new Set(group.selIds);
      setAddedSelectionIds(prev => prev.filter(id => !groupSelIds.has(id)));
    }
  };

  // Always show confirmation before deleting any line
  const handleRemoveLine = (lineId: string) => {
    setDeleteConfirm(lineId);
  };

  // Ellipsis menu
  const [ellipsisOpen, setEllipsisOpen] = useState(false);

  // Certification state
  const [contractorCert, setContractorCert] = useState({ firstName: '', lastName: '', date: '', signature: '' });
  const [architectCert, setArchitectCert] = useState({ firstName: '', lastName: '', date: '', signature: '' });
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const parsePaymentTermDays = (term: string): number | null => {
    const t = term.trim().toLowerCase();
    if (!t || t === 'none') return null;
    if (t === 'due upon receipt' || t === 'upon receipt' || t === 'receipt') return 0;
    const netMatch = t.match(/^net\s*(\d+)$/);
    if (netMatch) return parseInt(netMatch[1], 10);
    const num = parseInt(t, 10);
    if (!isNaN(num) && num >= 0 && String(num) === t) return num;
    return null;
  };
  const dueDate = (() => {
    if (!invoiceDate) return '';
    const days = parsePaymentTermDays(paymentTerms);
    if (days === null) return '';
    const d = new Date(invoiceDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  // Client preview modal
  const [showClientPreview, setShowClientPreview] = useState(false);

  // Selection detail panel state
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const checkedCount = Object.values(modalChecked).filter(Boolean).length;

  // Aggregate added costs by cost code
  const costsByCostCode: Record<string, number> = {};
  if (addedCostIds.length > 0) {
    const addedCosts = COST_RECORDS.filter(c => addedCostIds.includes(c.id));
    for (const c of addedCosts) {
      costsByCostCode[c.costCode] = (costsByCostCode[c.costCode] || 0) + c.amount;
    }
  }

  // Aggregate added COs by cost code
  const cosByCostCode: Record<string, number> = {};
  if (addedCOIds.length > 0) {
    const addedCOs = CHANGE_ORDERS.filter(co => addedCOIds.includes(co.id));
    for (const co of addedCOs) {
      cosByCostCode[co.costCode] = (cosByCostCode[co.costCode] || 0) + co.amount;
    }
  }

  // groupBy determines both the data shape and column visibility
  const rawGroups = groupBy === 'costcode'
    ? getCostCodeViewGroups(addedSelectionIds, completedAllowanceIds)
    : getSelAdjGroups(addedSelectionIds, completedAllowanceIds);
  const baseGroups = groupBy === 'costcode' ? regroupByCostCode(rawGroups) : rawGroups;

  // Build cost children lookup — individual bills grouped by cost code
  const costChildrenByCode: Record<string, SOVLine[]> = {};
  if (addedCostIds.length > 0) {
    const addedCosts = COST_RECORDS.filter(c => addedCostIds.includes(c.id));
    for (const c of addedCosts) {
      if (!costChildrenByCode[c.costCode]) costChildrenByCode[c.costCode] = [];
      costChildrenByCode[c.costCode].push({
        id: `cost-child-${c.id}`,
        description: c.vendor,
        budget: 0,
        previousInvoice: 0,
        thisInvoice: c.amount,
        storedMaterials: 0,
        retainage: 0,
        isFromCost: true,
        disablePct: true,
        hideBalance: true,
        hideBudget: true,
      });
    }
  }

  // Apply costs to matching estimate lines
  const groupsWithCosts = baseGroups.map(g => ({
    ...g,
    lines: g.lines.map(line => {
      const match = line.description.match(/^(\d+)/);
      const code = match ? match[1] : '';
      const costAmt = costsByCostCode[code] || 0;
      const coAmt = cosByCostCode[code] || 0;
      if (costAmt <= 0) return line;

      const costChildren = costChildrenByCode[code] || [];
      const wasPreviouslyInvoiced = previouslyInvoicedCodes.has(code);

      // Build CO child for cost code view — shows amount in approved changes column
      const matchingCO = coAmt !== 0
        ? CHANGE_ORDERS.find(co => co.costCode === code && addedCOIds.includes(co.id))
        : null;
      const coChildLine: SOVLine | null = (matchingCO && groupBy === 'costcode') ? {
        id: `cost-co-child-${matchingCO.id}`,
        description: matchingCO.title,
        budget: 0,
        previousInvoice: 0,
        thisInvoice: 0,
        storedMaterials: 0,
        retainage: 0,
        coAdjustment: matchingCO.amount,
        addedByCO: matchingCO.title,
        disablePct: true,
        hideBalance: true,
        hideBudget: true,
      } : null;

      if (wasPreviouslyInvoiced) {
        // ── Previously invoiced scenario (e.g. Masonry) ──
        // Costs were in a prior application → show in "Previous invoice"
        const prevChildren = costChildren.map(ch => ({
          ...ch,
          previousInvoice: ch.thisInvoice,
          thisInvoice: 0,
        }));
        if (coAmt > 0) {
          // CO added → in cost code view, CO shows in Approved Changes column so thisInvoice nets to 0
          // In estimate view, thisInvoice is negative because the CO is a separate line
          const overage = costAmt - line.budget;
          const thisInv = groupBy === 'costcode' ? 0 : -overage;
          return {
            ...line,
            previousInvoice: line.previousInvoice + costAmt,
            thisInvoice: thisInv,
            coAdjustment: coAmt,
            isFromCost: true,
            hideBalance: true,
            annotation: groupBy === 'costcode' ? undefined : 'A change order covers an overage for this item, so we reduced this amount to prevent invoicing your client twice',
            children: [...prevChildren, ...(coChildLine ? [coChildLine] : [])],
          };
        }
        return {
          ...line,
          previousInvoice: line.previousInvoice + costAmt,
          thisInvoice: 0,
          isFromCost: true,
          children: prevChildren,
        };
      } else {
        // ── Happy path (e.g. Framing) — costs + CO in same invoice ──
        // This invoice = full cost amount regardless of CO
        // CO adjusts the budget via approved changes column
        return {
          ...line,
          thisInvoice: line.thisInvoice + costAmt,
          coAdjustment: coAmt !== 0 ? coAmt : undefined,
          isFromCost: true,
          children: [...costChildren, ...(coChildLine ? [coChildLine] : [])],
        };
      }
    }),
  }));

  // Build approved changes CO lines for estimate view — grouped by CO title
  const coLines: SOVLine[] = (() => {
    if (addedCOIds.length === 0) return [];
    const addedCOs = CHANGE_ORDERS.filter(co => addedCOIds.includes(co.id));
    const allEstLines = groupsWithCosts.flatMap(g => g.lines);
    // Group by title
    const byTitle: Record<string, typeof addedCOs> = {};
    for (const co of addedCOs) {
      if (!byTitle[co.title]) byTitle[co.title] = [];
      byTitle[co.title].push(co);
    }
    return Object.entries(byTitle).map(([title, cos]) => {
      const netAmount = cos.reduce((s, co) => s + co.amount, 0);
      const children: SOVLine[] = cos.map(co => {
        const originalLine = allEstLines.find(l => {
          const m = l.description.match(/^(\d+)/);
          return m && m[1] === co.costCode;
        });
        const traceLabel = originalLine
          ? originalLine.description
          : `${co.costCode} - ${co.costType}`;
        return {
          id: `co-child-${co.id}`,
          description: traceLabel,
          budget: co.amount,
          previousInvoice: 0,
          thisInvoice: co.amount,
          storedMaterials: 0,
          retainage: 0,
          addedByCO: title,
          disablePct: true,
          hideBalance: true,
        } as SOVLine;
      });
      return {
        id: `co-line-${cos[0].id}`,
        description: title,
        budget: netAmount,
        previousInvoice: 0,
        thisInvoice: netAmount,
        storedMaterials: 0,
        retainage: 0,
        addedByCO: title,
        children,
      } as SOVLine;
    });
  })();

  // Merge CO lines into the Approved changes group if it exists, or create one
  // In cost code view, CO amounts show inline via coAdjustment — no separate group needed
  const groups = (() => {
    const result = [...groupsWithCosts];
    if (coLines.length > 0 && groupBy !== 'costcode') {
      const acIdx = result.findIndex(g => g.id === 'approved-changes');
      if (acIdx >= 0) {
        result[acIdx] = {
          ...result[acIdx],
          lines: [...result[acIdx].lines, ...coLines],
        };
      } else {
        result.push({
          id: 'approved-changes',
          label: 'Approved changes',
          lines: coLines,
        });
      }
    }
    return result;
  })();

  // Detect overages — estimate lines where thisInvoice exceeds budget
  const overages: { costCode: string; label: string; budget: number; invoiced: number; overage: number }[] = [];
  for (const g of groups) {
    for (const line of g.lines) {
      if (!line.isFromCost || !line.budget) continue;
      const match = line.description.match(/^(\d+)/);
      const code = match ? match[1] : '';
      const coAdj = cosByCostCode[code] || 0;
      const adjustedBudget = line.budget + coAdj;
      const completed = line.thisInvoice + line.previousInvoice + line.storedMaterials;
      if (completed > adjustedBudget && adjustedBudget > 0) {
        overages.push({
          costCode: code,
          label: line.description,
          budget: adjustedBudget,
          invoiced: completed,
          overage: completed - adjustedBudget,
        });
      }
    }
  }

  // Report overages to parent so CO page can use them
  const overagesKey = overages.map(o => `${o.costCode}:${o.overage}`).join(',');
  useEffect(() => {
    onOveragesChange?.(overages);
  }, [overagesKey]);

  const showCOCols = groupBy === 'costcode';
  const totals = grandTotals(groups);

  // Compute which line IDs would be deleted if deleteConfirm is acted on
  const pendingDeleteIds: Set<string> = (() => {
    if (!deleteConfirm) return new Set<string>();
    const ids = new Set<string>();

    // Check if it's a cost line or child of a cost line
    const allGroupLines = groups.flatMap(g => g.lines);
    const costLine = allGroupLines.find(l => l.id === deleteConfirm && l.isFromCost);
    const parentCostLine = !costLine
      ? allGroupLines.find(l => l.isFromCost && l.children?.some(ch => ch.id === deleteConfirm))
      : null;
    const targetCostLine = costLine || parentCostLine;
    if (targetCostLine) {
      const match = targetCostLine.description.match(/^(\d+)/);
      const code = match ? match[1] : '';
      if (code) {
        for (const g of groups) {
          for (const l of g.lines) {
            if (l.isFromCost) {
              const m = l.description.match(/^(\d+)/);
              if (m && m[1] === code) {
                ids.add(l.id);
                // Also mark children for pending delete visual
                if (l.children) l.children.forEach(ch => ids.add(ch.id));
              }
            }
          }
        }
      }
      return ids;
    }

    // Selection line — find all lines from the same allowance group
    const rawId = deleteConfirm.replace(/^(adj-|child-)/, '');
    const estGroups2 = [
      { items: ESTIMATE_LINES.kitchen },
      { items: ESTIMATE_LINES.flooring },
      { items: ESTIMATE_LINES.plumbing },
      { items: ESTIMATE_LINES.drywall },
      { items: ESTIMATE_LINES.hardware },
    ];
    const estGroup = estGroups2.find(g => g.items.some(i => i.id === rawId));
    if (estGroup) {
      for (const item of estGroup.items) {
        ids.add(item.id);
        ids.add(`adj-${item.id}`);
        ids.add(`child-${item.id}`);
      }
    }
    ids.add(deleteConfirm);
    return ids;
  })();

  const toggleGroup = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Shared data shape for the V1 (SelectionsModal) and V2 (SelectionsModalV2)
  // wizards — both consume the same SelectionGroup[] derived from MODAL_ALLOWANCES.
  const selectionsWizardData = MODAL_ALLOWANCES.map(ma => {
    const selectionsTotal = ma.selections.reduce((s, sel) => s + sel.approvedPrice, 0);
    const billableSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? 0 : sel.approvedPrice), 0);
    const invoicedSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? sel.approvedPrice : 0), 0);
    const notPreviouslyInvoiced = ma.previouslyInvoiced === 0;
    const anyInvoicedSelection = ma.selections.some(s => s.status === 'invoiced');
    const allowanceCodePrefix = ma.costCode.split(' ')[0];
    const allMismatched = ma.selections.every(sel => sel.costCode !== allowanceCodePrefix);
    const canMarkComplete = ma.id === 'ma-6';
    const markedComplete = completedAllowanceIds.has(ma.id);
    const gatedPending = canMarkComplete && !markedComplete;

    let allowanceNewInvoiceAmt: number | null;
    let invoiceBalance: number;
    let creditOnAllowanceRow = false;
    if (anyInvoicedSelection) {
      allowanceNewInvoiceAmt = null;
      invoiceBalance = billableSelectionsTotal;
    } else if (notPreviouslyInvoiced) {
      allowanceNewInvoiceAmt = null;
      invoiceBalance = billableSelectionsTotal;
    } else if (gatedPending) {
      allowanceNewInvoiceAmt = null;
      invoiceBalance = 0;
    } else if (allMismatched) {
      allowanceNewInvoiceAmt = -ma.budgetAmount;
      invoiceBalance = billableSelectionsTotal - ma.budgetAmount;
    } else if (canMarkComplete && markedComplete) {
      allowanceNewInvoiceAmt = selectionsTotal - ma.budgetAmount;
      invoiceBalance = selectionsTotal - ma.budgetAmount;
      creditOnAllowanceRow = true;
    } else {
      const matchedReversal = Math.min(selectionsTotal, ma.budgetAmount);
      allowanceNewInvoiceAmt = -matchedReversal;
      invoiceBalance = selectionsTotal - matchedReversal;
    }
    const previouslyInvoicedDisplay = anyInvoicedSelection ? invoicedSelectionsTotal : ma.previouslyInvoiced;
    return {
      id: ma.id,
      type: 'allowance' as const,
      name: ma.name,
      scenarioNote: ma.scenarioNote,
      canMarkComplete,
      isComplete: markedComplete,
      revisedPrice: selectionsTotal,
      previouslyInvoiced: previouslyInvoicedDisplay,
      invoiceBalance,
      allowanceBudget: ma.budgetAmount,
      overage: selectionsTotal - ma.budgetAmount,
      children: [
        {
          id: `${ma.id}-rev`,
          lineItem: ma.name,
          costCode: ma.costCode,
          selection: 'Allowance',
          price: ma.budgetAmount,
          newInvoiceAmt: allowanceNewInvoiceAmt,
        },
        ...ma.selections.map(sel => ({
          id: sel.id,
          lineItem: sel.name,
          costCode: `${sel.costCode} - ${sel.costType}`,
          selection: sel.name,
          price: sel.approvedPrice,
          newInvoiceAmt: sel.status === 'invoiced'
            ? null
            : gatedPending
              ? null
              : creditOnAllowanceRow
                ? 0
                : sel.approvedPrice,
        })),
      ],
    };
  }).filter(row => {
    const allowanceRev = row.children[0]?.newInvoiceAmt;
    return row.invoiceBalance !== 0 || allowanceRev !== null || row.canMarkComplete;
  });

  const handleSelectionsWizardAdd = (items: any[]) => {
    const newIds: string[] = [];
    items.forEach((group: any) => {
      if (group.children && group.children.length > 0) {
        group.children.forEach((child: any) => {
          if (child.selection === 'Allowance') return;
          // When "Combine same-cost-code lines" is on, the wizard nets several
          // selections into ONE line that carries a single child.id but lists every
          // underlying selection in sourceChildIds. Expand it so ALL of them land on
          // the invoice — otherwise only the first (e.g. just "Kohler Farmhouse Sink")
          // is pulled in even though the wizard billed the full overage.
          const ids: string[] = Array.isArray(child.sourceChildIds) && child.sourceChildIds.length > 0
            ? child.sourceChildIds
            : (child.id ? [child.id] : []);
          // Skip allowance-origin ids (e.g. "ma-1-rev") rolled into a netted line —
          // they aren't real selection ids and match nothing on the schedule of values.
          ids.forEach((id) => { if (id && !id.endsWith('-rev')) newIds.push(id); });
        });
      }
    });
    if (newIds.length > 0) {
      setAddedSelectionIds(prev => [...prev, ...newIds.filter(id => !prev.includes(id))]);
    }
  };

  return (
    <div className="aia-page" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Modal chrome */}
      <div className="aia-chrome" style={{ background: 'white', borderRadius: 12, margin: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Modal header */}
        <div className="aia-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Johnson Residence</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Progress invoice</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, background: '#f1f5f9', color: '#64748b', fontWeight: 500 }}>
              Application 002
            </span>
            <button style={iconBtnStyle}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="aia-body" style={{ padding: '20px 24px' }}>
          {/* Overage warning banner */}
          {overages.length > 0 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8,
              padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 4 }}>
                  This invoice exceeds the budgeted amount
                </div>
                {overages.map(o => (
                  <div key={o.costCode} style={{ fontSize: 13, color: '#92400e', marginBottom: 2 }}>
                    {o.label} is over budget by <strong>${fmt(o.overage)}</strong>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: '#a16207', marginTop: 6 }}>
                  We recommend creating a change order for the overage amounts.
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('change-order')}
                style={{
                  flexShrink: 0, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  background: '#0065db', color: 'white', border: 'none', borderRadius: 6,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                Create change order
              </button>
            </div>
          )}

          {/* Progress invoice information */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>Progress invoice information</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input style={inputStyle} defaultValue="Application 2" readOnly />
              </div>
              <div style={{ width: 120 }}>
                <label style={labelStyle}>ID #</label>
                <input style={inputStyle} defaultValue="002" readOnly />
              </div>
            </div>
            <div style={{ display: 'inline-flex', marginBottom: 12, border: '1px solid #B1B4B5', borderRadius: 5, overflow: 'hidden' }}>
              <button
                onClick={() => setDateTab('date')}
                style={{
                  padding: '7px 20px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  border: dateTab === 'date' ? '1px solid #0763FB' : '1px solid transparent',
                  borderRadius: dateTab === 'date' ? 4 : 0,
                  background: 'white',
                  color: dateTab === 'date' ? '#004FD6' : '#26292E',
                  fontWeight: dateTab === 'date' ? 500 : 400,
                  margin: dateTab === 'date' ? -1 : 0,
                  position: 'relative', zIndex: dateTab === 'date' ? 1 : 0,
                }}
              >
                Invoice date
              </button>
              <div style={{ width: 1, background: dateTab === 'date' ? '#0763FB' : '#B1B4B5', alignSelf: 'stretch' }} />
              <button
                onClick={() => setDateTab('schedule')}
                style={{
                  padding: '7px 20px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                  border: dateTab === 'schedule' ? '1px solid #0763FB' : '1px solid transparent',
                  borderRadius: dateTab === 'schedule' ? 4 : 0,
                  background: 'white',
                  color: dateTab === 'schedule' ? '#004FD6' : '#26292E',
                  fontWeight: dateTab === 'schedule' ? 500 : 400,
                  margin: dateTab === 'schedule' ? -1 : 0,
                  position: 'relative', zIndex: dateTab === 'schedule' ? 1 : 0,
                }}
              >
                Link to schedule item
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Invoice date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Payment terms</label>
                <input
                  list="payment-terms-options"
                  style={{ ...inputStyle, minWidth: 180 }}
                  placeholder="Select or type days"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                />
                <datalist id="payment-terms-options">
                  <option value="None" />
                  <option value="Due upon receipt" />
                  <option value="Net 3" />
                  <option value="Net 5" />
                  <option value="Net 7" />
                  <option value="Net 10" />
                  <option value="Net 15" />
                  <option value="Net 30" />
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>Due date</label>
                <div style={{ padding: '8px 0', fontSize: 13, color: dueDate ? '#0f172a' : '#94a3b8', fontWeight: dueDate ? 500 : 400 }}>
                  {dueDate || '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Continuation sheet */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Continuation sheet</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <select
                value={groupBy}
                onChange={e => {
                  const val = e.target.value as 'estimate' | 'costcode';
                  if (val === 'estimate' && groupBy === 'costcode') {
                    setShowSwitchViewDialog(true);
                    e.target.value = 'costcode'; // reset select visually
                  } else {
                    setGroupBy(val);
                  }
                }}
                style={{
                  fontSize: 12, padding: '5px 28px 5px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
                  background: 'white', cursor: 'pointer', color: '#334155', fontWeight: 500,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4L5 6.5L7.5 4' stroke='%2364748b' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="estimate">Group by Estimate</option>
                <option value="costcode">Group by cost code</option>
              </select>
              <div style={{ position: 'relative' }} ref={addFromDropdownRef}>
                <button className="btn btn-s" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => setAddFromDropdownOpen(!addFromDropdownOpen)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Add from
                  <svg width="12" height="12" viewBox="0 0 12 8" fill="none" style={{ marginLeft: 2 }}>
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {addFromDropdownOpen && (
                  <div className="add-from-dropdown">
                    <button className="add-from-option" onClick={() => { setAddFromDropdownOpen(false); setShowSelectionsV2Modal(true); }}>
                      <span style={{ fontWeight: 500 }}>Selections</span>
                    </button>
                    <button className="add-from-option" onClick={() => { setAddFromDropdownOpen(false); setShowCostModal(true); }}>
                      <span style={{ fontWeight: 500 }}>Costs</span>
                    </button>
                    <button className="add-from-option" onClick={() => { setAddFromDropdownOpen(false); setShowCOModal(true); }}>
                      <span style={{ fontWeight: 500 }}>Change orders</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 960 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: 240 }}>Description</th>
                      <th style={headerCellStyle}>{showCOCols ? 'Scheduled value' : 'Budget'}</th>
                      {showCOCols && <th style={{ ...headerCellStyle }}>Approved changes</th>}
                      {showCOCols && <th style={{ ...headerCellStyle }}>Revised value</th>}
                      <th style={headerCellStyle}>Previous invoice</th>
                      <th style={headerCellStyle}>This invoice</th>
                      <th style={headerCellStyle}>Stored materials</th>
                      <th style={headerCellStyle}>Completed</th>
                      <th style={{ ...headerCellStyle, textAlign: 'center' }}>% complete</th>
                      <th style={headerCellStyle}>Balance to finish</th>
                      <th style={headerCellStyle}>Retainage</th>
                      <th style={{ ...headerCellStyle, ...pinnedColStyle, background: '#f8fafc', width: 44 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(group => (
                      <GroupSection
                        key={group.id}
                        group={group}
                        expanded={expanded[group.id] ?? true}
                        onToggle={() => toggleGroup(group.id)}
                        pctOverrides={pctOverrides}
                        onPctChange={handlePctChange}
                        showCOCols={showCOCols}
                        onLineClick={(lineId) => {
                          // CO lines navigate to the change order page
                          const allLines = groups.flatMap(g => g.lines);
                          const line = allLines.find(l => l.id === lineId);
                          if (line?.addedByCO) {
                            onNavigate?.('change-order');
                          } else {
                            setSelectedLineId(lineId);
                          }
                        }}
                        onRemove={handleRemoveLine}
                        pendingDeleteIds={pendingDeleteIds}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const grandCO = groups.flatMap(g => g.lines).reduce((s, l) => s + (l.coAdjustment || 0), 0);
                      const grandRevised = totals.budget + grandCO;
                      const pctBase = showCOCols ? grandRevised : totals.budget;
                      const grandPct = pctBase > 0 ? (totals.completed / pctBase * 100) : 0;
                      const grandBalance = showCOCols ? grandRevised - totals.completed : totals.balance;
                      return (
                        <tr style={{ background: '#f0f4ff', borderTop: '2px solid #cbd5e1' }}>
                          <td style={{ ...cellStyle, fontWeight: 700, paddingLeft: 12, color: '#0f172a' }}>Total:</td>
                          <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(totals.budget)}</td>
                          {showCOCols && <td style={{ ...numCellStyle, fontWeight: 700 }}>{grandCO !== 0 ? `${grandCO > 0 ? '+' : ''}$${fmt(grandCO)}` : '—'}</td>}
                          {showCOCols && <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(grandRevised)}</td>}
                          <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(totals.previousInvoice)}</td>
                          <td style={{
                            ...numCellStyle, fontWeight: 700,
                            color: totals.thisInvoice < 0 ? '#dc2626' : undefined,
                          }}>
                            {totals.thisInvoice < 0 ? `-$${fmt(Math.abs(totals.thisInvoice))}` : `$${fmt(totals.thisInvoice)}`}
                          </td>
                          <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(totals.storedMaterials)}</td>
                          <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(totals.completed)}</td>
                          <td style={{ ...numCellStyle, fontWeight: 700, textAlign: 'center' }}>
                            {pctBase > 0 ? `${grandPct.toFixed(0)}%` : '—'}
                          </td>
                          <td style={{
                            ...numCellStyle, fontWeight: 700,
                            color: grandBalance < 0 ? '#dc2626' : undefined,
                          }}>
                            {grandBalance < 0 ? `-$${fmt(Math.abs(grandBalance))}` : `$${fmt(grandBalance)}`}
                          </td>
                          <td style={{ ...numCellStyle, fontWeight: 700 }}>${fmt(totals.retainage)}</td>
                          <td style={{ ...pinnedColStyle, background: '#f0f4ff' }} />
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom sections — 2x2 grid, paired rows match height */}
          <div className="aia-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            {/* Internal notes */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Internal notes</div>
              <BdsTextArea
                id="aia-internal-notes"
                placeholder="Add a note..."
                rows={3}
                style={{ flex: 1, minHeight: 72, resize: 'vertical' }}
              />
            </div>

            {/* QuickBooks status */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>QuickBooks status</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 12 }}>
                <span style={{ fontWeight: 500, color: '#334155' }}>Invoice status</span>
                <span style={{ color: '#94a3b8' }}>Not invoiced</span>
              </div>
              <div style={{ alignSelf: 'flex-start' }}>
                <BdsButton
                  displayType="secondary"
                  text="Create invoice"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 30C23.2843 30 30 23.2843 30 15C30 6.71573 23.2843 0 15 0C6.71573 0 0 6.71573 0 15C0 23.2843 6.71573 30 15 30Z" fill="#2CA01C"/>
                      <path d="M4.16602 15.0001C4.16602 18.2334 6.76602 20.8334 9.99935 20.8334H10.8327V18.6667H9.99935C7.96601 18.6667 6.33268 17.0334 6.33268 15.0001C6.33268 12.9667 7.96601 11.3334 9.99935 11.3334H11.9993C11.9993 11.3334 11.9993 22.4667 11.9993 22.6667C11.9993 23.8667 12.966 24.8334 14.166 24.8334V9.16675C14.166 9.16675 11.9327 9.16675 9.99935 9.16675C6.76602 9.16675 4.16602 11.8001 4.16602 15.0001ZM19.9993 9.16675H19.166V11.3334H19.9993C22.0327 11.3334 23.666 12.9667 23.666 15.0001C23.666 17.0334 22.0327 18.6667 19.9993 18.6667H17.9993C17.9993 18.6667 17.9993 7.53341 17.9993 7.33341C17.9993 6.13341 17.0327 5.16675 15.8327 5.16675V20.8334C15.8327 20.8334 18.066 20.8334 19.9993 20.8334C23.2327 20.8334 25.8327 18.2334 25.8327 15.0001C25.8327 11.8001 23.1993 9.16675 19.9993 9.16675Z" fill="white"/>
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Invoice description */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Invoice description</div>
              <BdsTextArea
                id="aia-invoice-description"
                placeholder="Describe the work invoiced..."
                rows={4}
                style={{ flex: 1, minHeight: 96, resize: 'vertical', borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
              />
              {/* Rich text toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 2, padding: '6px 10px', flexWrap: 'wrap',
                border: '1px solid #e2e8f0', borderRadius: '0 0 6px 6px', background: 'white',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 12, color: '#26292E', cursor: 'pointer' }}>
                  Font
                  <svg width="8" height="8" viewBox="0 0 8 6" fill="none"><path d="M1 1l3 3 3-3" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 12, color: '#26292E', cursor: 'pointer' }}>
                  Size
                  <svg width="8" height="8" viewBox="0 0 8 6" fill="none"><path d="M1 1l3 3 3-3" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 4px' }} />
                <span style={{ padding: '3px 6px', fontSize: 13, cursor: 'pointer', color: '#26292E', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  A<svg width="6" height="6" viewBox="0 0 6 4" fill="none"><path d="M0.5 0.5l2.5 2.5 2.5-2.5" stroke="#64748b" strokeWidth="1" strokeLinecap="round"/></svg>
                </span>
                <span style={{ padding: '3px 6px', fontSize: 13, cursor: 'pointer', background: '#fef3c7', borderRadius: 2, color: '#26292E', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  A<svg width="6" height="6" viewBox="0 0 6 4" fill="none"><path d="M0.5 0.5l2.5 2.5 2.5-2.5" stroke="#64748b" strokeWidth="1" strokeLinecap="round"/></svg>
                </span>
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 6px' }} />
                {['B', 'I', 'U', 'S'].map(c => (
                  <span key={c} style={{
                    padding: '3px 7px', fontSize: 13, cursor: 'pointer', color: '#26292E',
                    fontWeight: c === 'B' ? 700 : 400,
                    fontStyle: c === 'I' ? 'italic' : 'normal',
                    textDecoration: c === 'U' ? 'underline' : c === 'S' ? 'line-through' : 'none',
                  }}>{c}</span>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 6px' }} />
                {[
                  <svg key="al" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6.5h8M2 10h12M2 13.5h8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  <svg key="ac" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6.5h8M2 10h12M4 13.5h8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  <svg key="ar" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6.5h8M2 10h12M6 13.5h8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                  <svg key="aj" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                ].map((icon, i) => (
                  <span key={i} style={{ padding: '3px 4px', cursor: 'pointer', display: 'inline-flex' }}>{icon}</span>
                ))}
                <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 6px' }} />
                <span style={{ padding: '3px 4px', cursor: 'pointer', display: 'inline-flex' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M6.5 9.5l3-3M7 11l-1.5 1.5a2.12 2.12 0 01-3-3L4 8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M9 5l1.5-1.5a2.12 2.12 0 013 3L12 8" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Attachments */}
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Attachments</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <BdsButton
                  displayType="secondary"
                  text="Add"
                  icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                />
                <BdsButton
                  displayType="secondary"
                  text="Create new doc"
                  icon={<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1.5 1.5h6L10.5 4.5v8a0 0 0 0 1 0 0h-9a0 0 0 0 1 0 0v-11a0 0 0 0 1 0 0z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 1.5v3h3.5M6 7v4M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                />
              </div>
              {/* Attachment thumbnails - fake bill images */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { vendor: 'ABC Lumber Co.', number: '#10472', amount: '2,450.00', date: '04/18/26' },
                  { vendor: 'Midwest Electric', number: '#88219', amount: '1,180.50', date: '04/20/26' },
                ].map((bill, i) => (
                  <div key={i} style={{
                    width: 80, height: 100, borderRadius: 6, border: '1px solid #e2e8f0',
                    background: 'white', overflow: 'hidden', flexShrink: 0, position: 'relative',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}>
                    <div style={{ padding: '6px 6px 0 6px' }}>
                      <div style={{ fontSize: 5, fontWeight: 700, color: '#0f172a', letterSpacing: 0.3 }}>BILL</div>
                      <div style={{ fontSize: 4, color: '#64748b', marginTop: 1, lineHeight: 1.2 }}>{bill.vendor}</div>
                      <div style={{ fontSize: 3.5, color: '#94a3b8', marginTop: 1 }}>{bill.number}</div>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[...Array(5)].map((_, j) => (
                          <div key={j} style={{ height: 2, background: '#f1f5f9', borderRadius: 1, width: `${90 - j * 8}%` }} />
                        ))}
                      </div>
                      <div style={{ marginTop: 6, borderTop: '1px solid #e2e8f0', paddingTop: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 3.5, color: '#64748b' }}>Total</span>
                        <span style={{ fontSize: 5, fontWeight: 700, color: '#0f172a' }}>${bill.amount}</span>
                      </div>
                      <div style={{ fontSize: 3.5, color: '#94a3b8', marginTop: 2, textAlign: 'right' }}>{bill.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Certifications (Contractor | Architecture) ─── */}
          <div className="aia-certs-row" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            {/* Contractor certification */}
            <div className="aia-cert" style={{ background: '#f8fafc', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Contractor certification</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>
                By submitting this invoice, the Contractor certifies to the best of their knowledge that:
                <ul style={{ margin: '6px 0 0 18px', paddingLeft: 0 }}>
                  <li>All work billed has been delivered or performed in accordance with the contract documents and applicable standards;</li>
                  <li>The amounts stated accurately reflect work completed and are due under the contract;</li>
                  <li>All prior payments received have been properly applied to subcontractors, suppliers, and other obligations related to previous work;</li>
                  <li>There are no liens, claims, or encumbrances against the work covered by this invoice; and</li>
                  <li>Based on completion of work and compliance with contract terms, payment in the amount stated is now due and payable.</li>
                </ul>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>First name</label><input style={{...inputStyle, background: 'white'}} value={contractorCert.firstName} onChange={e => setContractorCert(p => ({ ...p, firstName: e.target.value }))} /></div>
                <div><label style={labelStyle}>Last name</label><input style={{...inputStyle, background: 'white'}} value={contractorCert.lastName} onChange={e => setContractorCert(p => ({ ...p, lastName: e.target.value }))} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Date</label><input type="date" style={{...inputStyle, background: 'white'}} value={contractorCert.date} onChange={e => setContractorCert(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <label style={labelStyle}>Signature</label>
              <SignaturePad dataUrl={contractorCert.signature} onChange={(sig: string) => setContractorCert(p => ({ ...p, signature: sig }))} />
            </div>

            {/* Architecture certification */}
            <div className="aia-cert" style={{ background: '#f8fafc', borderRadius: 8, padding: '20px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Architecture certification</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>
                Based on site observations and the information provided in this application, the Architect confirms that
                the work has progressed as shown, meets the requirements of the contract documents, and that the
                Contractor is entitled to payment of the Amount Certified.
                <br /><br />
                If the Amount Certified differs from the amount requested, an explanation and any revised figures is
                attached to this application and shown on the continuation sheet.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={labelStyle}>First name</label><input style={{...inputStyle, background: 'white'}} value={architectCert.firstName} onChange={e => setArchitectCert(p => ({ ...p, firstName: e.target.value }))} /></div>
                <div><label style={labelStyle}>Last name</label><input style={{...inputStyle, background: 'white'}} value={architectCert.lastName} onChange={e => setArchitectCert(p => ({ ...p, lastName: e.target.value }))} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Date</label><input type="date" style={{...inputStyle, background: 'white'}} value={architectCert.date} onChange={e => setArchitectCert(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <label style={labelStyle}>Signature</label>
              <SignaturePad dataUrl={architectCert.signature} onChange={(sig: string) => setArchitectCert(p => ({ ...p, signature: sig }))} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '12px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setEllipsisOpen(!ellipsisOpen)}
              style={{ ...footerBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 12, paddingRight: 12 }}
            >
              <svg width="16" height="4" viewBox="0 0 16 4"><circle cx="2" cy="2" r="1.5" fill="#64748b"/><circle cx="8" cy="2" r="1.5" fill="#64748b"/><circle cx="14" cy="2" r="1.5" fill="#64748b"/></svg>
            </button>
            {ellipsisOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setEllipsisOpen(false)} />
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, zIndex: 100,
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
                }}>
                  {['Export', 'Print', 'Delete'].map(item => (
                    <button
                      key={item}
                      onClick={() => { setEllipsisOpen(false); if (item === 'Print') window.print(); }}
                      style={{
                        width: '100%', padding: '10px 16px', fontSize: 13, border: 'none', background: 'white',
                        cursor: 'pointer', textAlign: 'left', color: item === 'Delete' ? '#dc2626' : '#334155',
                        fontWeight: item === 'Delete' ? 500 : 400,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => setShowClientPreview(true)} style={footerBtnStyle}>Client Preview</button>
          <button style={footerBtnStyle}>Save</button>
          <button style={{ ...footerBtnStyle, border: 'none', background: '#0065db', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M4.2568 1.51524C4.0345 1.39243 3.78007 1.34025 3.52738 1.36564C3.27468 1.39103 3.03572 1.49279 2.8423 1.65736C2.64888 1.82194 2.51017 2.04153 2.44466 2.2869C2.37918 2.5321 2.39007 2.79191 2.47555 3.03086L4.95999 9.99981L2.47524 16.9696C2.38989 17.2085 2.37922 17.4676 2.44466 17.7127C2.51017 17.9581 2.64888 18.1777 2.8423 18.3423C3.03572 18.5068 3.27468 18.6086 3.52738 18.634C3.78007 18.6594 4.0345 18.6072 4.2568 18.4844L17.4525 11.0936L17.4541 11.0926C17.6488 10.9846 17.811 10.8265 17.9241 10.6347C18.0375 10.4423 18.0973 10.2231 18.0973 9.99981C18.0973 9.77652 18.0375 9.55731 17.9241 9.36496C17.811 9.17316 17.6488 9.01506 17.4541 8.90698L17.4525 8.90606L4.25999 1.517L4.2568 1.51524ZM16.8445 9.99823L17.1499 9.45293L16.8473 9.99981L16.8445 10.0014L3.65234 17.3902L6.06424 10.6248H10.6264C10.9716 10.6248 11.2514 10.345 11.2514 9.99981C11.2514 9.65463 10.9716 9.37481 10.6264 9.37481H6.06424L3.65265 2.61024L3.65234 2.60938L16.8445 9.99823Z" fill="white"/></svg>
            Send
          </button>
        </div>
      </div>



      {/* ─── Selection Detail Modal ─────────────────────────────────── */}
      {selectedLineId && (() => {
        // Look up the estimate line data across all categories
        const allEstItems = [
          ...ESTIMATE_LINES.kitchen.map(i => ({ ...i, category: 'kitchen' as const })),
          ...ESTIMATE_LINES.flooring.map(i => ({ ...i, category: 'flooring' as const })),
          ...ESTIMATE_LINES.plumbing.map(i => ({ ...i, category: 'plumbing' as const })),
          ...ESTIMATE_LINES.drywall.map(i => ({ ...i, category: 'drywall' as const })),
          ...ESTIMATE_LINES.hardware.map(i => ({ ...i, category: 'hardware' as const })),
        ];
        // Match on either the estimate line id or the adjustment line id (adj-xxx)
        const rawId = selectedLineId.replace(/^adj-/, '');
        const estItem = allEstItems.find(i => i.id === rawId);
        if (!estItem) return null;

        // Find the parent allowance
        const allowance = MODAL_ALLOWANCES.find(a =>
          a.selections.some(s => s.id === estItem.selId)
        );
        const selection = allowance?.selections.find(s => s.id === estItem.selId);
        if (!allowance || !selection) return null;

        const delta = estItem.approved - estItem.estimate;

        return (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setSelectedLineId(null)}
          >
            <div
              style={{
                background: 'white', borderRadius: 12, width: 680, maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Selection item</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selection.name}</div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: '2px 10px', borderRadius: 10, fontWeight: 600,
                    background: '#dcfce7', color: '#15803d',
                  }}>Approved</span>
                </div>
                <button
                  onClick={() => setSelectedLineId(null)}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {/* General Information */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#0f172a' }}>General information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Title</label>
                      <div style={{ ...inputStyle, background: '#f8fafc', color: '#334155' }}>{selection.name}</div>
                    </div>
                    <div>
                      <label style={labelStyle}>Cost code</label>
                      <div style={{ ...inputStyle, background: '#f8fafc', color: '#334155' }}>{selection.costCode}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Description</label>
                    <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', minHeight: 48 }}>
                      {selection.name} — {selection.costType} item from {allowance.name}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Item type</label>
                      <div style={{ ...inputStyle, background: '#f8fafc', color: '#334155' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                          background: selection.costType === 'Labor' ? '#dbeafe' : '#f3e8ff',
                          color: selection.costType === 'Labor' ? '#1d4ed8' : '#7c3aed',
                        }}>{selection.costType}</span>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Add to invoice</label>
                      <div style={{ ...inputStyle, background: '#f8fafc', color: '#334155' }}>
                        {addedSelectionIds.includes(selection.id) ? 'Yes — added to invoice' : 'Not yet added'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Allowance */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>Linked allowance</div>
                  <div style={{
                    padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 8l-1.5 1.5a2.12 2.12 0 103 3L9 11" stroke="#0065db" strokeWidth="1.2" strokeLinecap="round"/><path d="M8 6l1.5-1.5a2.12 2.12 0 10-3-3L5 3" stroke="#0065db" strokeWidth="1.2" strokeLinecap="round"/><path d="M5.5 8.5l3-3" stroke="#0065db" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        {allowance.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{allowance.costCode}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Allowance budget</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>${fmt(allowance.budgetAmount)}</div>
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>Price details</div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Item</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Cost code</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Item type</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Original (est.)</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Approved</th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Invoiced</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{selection.name}</td>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{selection.costCode}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                              background: selection.costType === 'Labor' ? '#dbeafe' : '#f3e8ff',
                              color: selection.costType === 'Labor' ? '#1d4ed8' : '#7c3aed',
                            }}>{selection.costType}</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8', textDecoration: delta !== 0 ? 'line-through' : 'none' }}>
                            ${fmt(selection.originalPrice)}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: delta > 0 ? '#dc2626' : delta < 0 ? '#15803d' : '#334155' }}>
                            ${fmt(selection.approvedPrice)}
                          </td>
                          {(() => {
                            const invoicedPct = addedSelectionIds.includes(selection.id) ? 100 : 0;
                            return (
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                                  background: invoicedPct === 100 ? '#dcfce7' : invoicedPct > 0 ? '#fef3c7' : '#f1f5f9',
                                  color: invoicedPct === 100 ? '#15803d' : invoicedPct > 0 ? '#92400e' : '#94a3b8',
                                }}>{invoicedPct}%</span>
                              </td>
                            );
                          })()}
                        </tr>
                      </tbody>
                    </table>
                    {/* Totals row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', gap: 24 }}>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: '#64748b' }}>Total price: </span>
                        <strong>${fmt(selection.approvedPrice)}</strong>
                      </div>
                      {delta !== 0 && (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: '#64748b' }}>Adjustment: </span>
                          <strong style={{ color: delta > 0 ? '#dc2626' : '#15803d' }}>
                            {delta > 0 ? '+' : ''}${fmt(delta)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0, background: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
                <button
                  onClick={() => setSelectedLineId(null)}
                  style={{ padding: '8px 20px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Add from Selections Modal ─────────────────────────────── */}
      {showAddFromModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowAddFromModal(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: 12, width: 720, maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Selections &amp; Allowances</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Select allowances to add to the continuation sheet</div>
              </div>
              <button
                onClick={() => setShowAddFromModal(false)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              {MODAL_ALLOWANCES.map(allowance => {
                const selectionsTotal = allowance.selections.reduce((s, sel) => s + sel.approvedPrice, 0);
                const originalTotal = allowance.selections.reduce((s, sel) => s + sel.originalPrice, 0);
                const variance = allowance.budgetAmount - selectionsTotal;
                const isOver = variance < 0;
                // Block invoicing only when matched codes + under-budget + previously invoiced —
                // in that case there's nothing to do. Mismatched codes still produce a credit at
                // the real cost codes even when under budget, so we leave those clickable.
                const allowanceCodePrefix = allowance.costCode.split(' ')[0];
                const allMismatched = allowance.selections.every(sel => sel.costCode !== allowanceCodePrefix);
                const isUnderage = !isOver && allowance.previouslyInvoiced >= allowance.budgetAmount && !allMismatched;
                const isFullyInvoiced = allowance.previouslyInvoiced >= allowance.budgetAmount;
                const availableSelections = allowance.selections.filter(s => !addedSelectionIds.includes(s.id));
                const allAvailableChecked = availableSelections.length > 0 && availableSelections.every(s => modalChecked[s.id]);

                return (
                  <div key={allowance.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
                    {/* Allowance header */}
                    <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {availableSelections.length > 0 && !isUnderage && (
                            <input
                              type="checkbox"
                              checked={allAvailableChecked}
                              onChange={() => handleModalToggleAll(allowance.id)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0065db' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{allowance.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{allowance.costCode}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Allowance budget</div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>${fmt(allowance.budgetAmount)}</div>
                          {isFullyInvoiced && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Invoiced: ${fmt(allowance.previouslyInvoiced)}</div>
                          )}
                        </div>
                      </div>
                      {/* Variance bar */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: '#94a3b8' }}>Original est: </span>
                          <span style={{ fontWeight: 500 }}>${fmt(originalTotal)}</span>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: '#94a3b8' }}>Approved: </span>
                          <span style={{ fontWeight: 600 }}>${fmt(selectionsTotal)}</span>
                        </div>
                        <div style={{ fontSize: 11, marginLeft: 'auto' }}>
                          <span style={{
                            fontWeight: 600,
                            color: isOver ? '#dc2626' : '#15803d',
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: isOver ? '#fef2f2' : '#f0fdf4',
                          }}>
                            {isOver ? `Overage: $${fmt(Math.abs(variance))}` : `Underage: $${fmt(variance)}`}
                          </span>
                        </div>
                      </div>
                      {isUnderage && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10,
                          borderTop: '1px solid #e2e8f0', fontSize: 12, color: '#64748b',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                            <circle cx="8" cy="8" r="7" stroke="#94a3b8" strokeWidth="1.2"/>
                            <path d="M8 5v3.5M8 10.5v.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                          Allowance already invoiced at ${fmt(allowance.previouslyInvoiced)}. Selections are ${fmt(variance)} under budget — no additional invoicing needed.
                        </div>
                      )}
                    </div>

                    {/* Selection items */}
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Selection item</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Cost code</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Type</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Original price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Approved price</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allowance.selections.map(sel => {
                          const alreadyAdded = addedSelectionIds.includes(sel.id);
                          const blocked = isUnderage && !alreadyAdded;
                          const isChecked = modalChecked[sel.id] || false;
                          const priceChanged = sel.approvedPrice !== sel.originalPrice;
                          const priceUp = sel.approvedPrice > sel.originalPrice;

                          return (
                            <tr
                              key={sel.id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: alreadyAdded ? '#f8fafc' : blocked ? '#f8fafc' : isChecked ? '#f0f9ff' : 'white',
                                opacity: alreadyAdded || blocked ? 0.5 : 1,
                              }}
                            >
                              <td style={{ padding: '10px 12px', fontWeight: 500 }}>{sel.name}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{sel.costCode}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                                  background: sel.costType === 'Labor' ? '#dbeafe' : '#f3e8ff',
                                  color: sel.costType === 'Labor' ? '#1d4ed8' : '#7c3aed',
                                }}>{sel.costType}</span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8', textDecoration: priceChanged ? 'line-through' : 'none' }}>
                                ${fmt(sel.originalPrice)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: priceUp ? '#dc2626' : priceChanged ? '#15803d' : '#334155' }}>
                                ${fmt(sel.approvedPrice)}
                              </td>
                              {(() => {
                                const diff = sel.approvedPrice - sel.originalPrice;
                                return (
                                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: diff > 0 ? '#dc2626' : diff < 0 ? '#15803d' : '#94a3b8' }}>
                                    {diff === 0 ? '—' : `${diff > 0 ? '+' : '-'}$${fmt(Math.abs(diff))}`}
                                  </td>
                                );
                              })()}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Modal footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#f8fafc', borderRadius: '0 0 12px 12px' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {(() => {
                  const selectedAllowances = MODAL_ALLOWANCES.filter(a => {
                    const available = a.selections.filter(s => !addedSelectionIds.includes(s.id));
                    return available.length > 0 && available.every(s => modalChecked[s.id]);
                  });
                  const selectedTotal = selectedAllowances.flatMap(a => a.selections)
                    .filter(s => modalChecked[s.id] && !addedSelectionIds.includes(s.id))
                    .reduce((sum, s) => sum + s.approvedPrice, 0);
                  return selectedAllowances.length > 0 ? (
                    <span>{selectedAllowances.length} allowance{selectedAllowances.length > 1 ? 's' : ''} selected — <strong>${fmt(selectedTotal)}</strong> will be added</span>
                  ) : (
                    <span>Select allowances to add to the invoice</span>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowAddFromModal(false)}
                  style={{ padding: '8px 20px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelections}
                  disabled={checkedCount === 0}
                  style={{
                    padding: '8px 20px', fontSize: 13, border: 'none', borderRadius: 6,
                    background: checkedCount > 0 ? '#0065db' : '#e2e8f0',
                    color: checkedCount > 0 ? 'white' : '#94a3b8',
                    cursor: checkedCount > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  Add to invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Client Preview Modal ─── */}
      {showClientPreview && (
        <ClientPreviewModal
          groups={groups}
          totals={totals}
          showCOCols={showCOCols}
          contractorCert={contractorCert}
          architectCert={architectCert}
          onClose={() => setShowClientPreview(false)}
        />
      )}

      {/* Selections Modal V2 — same data, new wizard from invoice-2 */}
      <SelectionsModalV2
        open={showSelectionsV2Modal}
        onClose={() => setShowSelectionsV2Modal(false)}
        data={selectionsWizardData}
        onAdd={handleSelectionsWizardAdd}
        addedChildIds={addedSelectionIds}
      />

      {/* ─── Switch View Confirmation Dialog ─────────────────────────── */}
      {showSwitchViewDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowSwitchViewDialog(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: 12, width: 420, padding: '24px 28px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Switch view
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
              The cost code view is recommended for jobs with selections and allowances so you can track how amounts were reallocated across cost codes.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowSwitchViewDialog(false)}
                style={{
                  padding: '9px 20px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 6,
                  background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setGroupBy('estimate'); setShowSwitchViewDialog(false); }}
                style={{
                  padding: '9px 20px', fontSize: 14, border: 'none', borderRadius: 6,
                  background: '#0065db', color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Group by estimate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Line Item Confirmation ────────────────────────────── */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: 'white', borderRadius: 12, width: 420, padding: '24px 28px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
              Delete line item?
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
              Are you sure you want to delete the selected bill line items?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '9px 20px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 6,
                  background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { doRemoveLine(deleteConfirm); setDeleteConfirm(null); }}
                style={{
                  padding: '9px 20px', fontSize: 14, border: 'none', borderRadius: 6,
                  background: '#dc2626', color: 'white', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Costs to Invoice Modal ─────────────────────────────── */}
      {showCostModal && (
        <AddCostsModal
          onClose={() => setShowCostModal(false)}
          addedCostIds={addedCostIds}
          onAdd={(ids) => {
            setAddedCostIds(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
            setShowCostModal(false);
          }}
        />
      )}

      {/* ─── Add Change Orders Modal ────────────────────────────────── */}
      {showCOModal && (
        <AddCOModal
          onClose={() => setShowCOModal(false)}
          addedCOIds={addedCOIds}
          onAdd={(ids) => {
            setAddedCOIds(prev => [...prev, ...ids.filter(id => !prev.includes(id))]);
            setShowCOModal(false);
          }}
        />
      )}

    </div>
  );
}

// ─── Signature Pad ──────────────────────────────────────────────────

function SignaturePad({ dataUrl, onChange }: { dataUrl: string; onChange: (sig: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!dataUrl);

  useEffect(() => {
    if (dataUrl && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height); ctx.drawImage(img, 0, 0); };
      img.src = dataUrl;
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    if (canvasRef.current) onChange(canvasRef.current.toDataURL());
  };

  const clear = () => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHasDrawn(false);
    onChange('');
  };

  return (
    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', height: 100, cursor: 'crosshair', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={600} height={200} style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      {!hasDrawn && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#cbd5e1', fontSize: 12, fontStyle: 'italic' }}>
          Draw your signature
        </div>
      )}
      {hasDrawn && (
        <button onClick={clear} style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 11, color: '#0065db', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Client Preview Modal ───────────────────────────────────────────

interface ClientPreviewModalProps {
  groups: CostGroup[];
  totals: { budget: number; previousInvoice: number; thisInvoice: number; storedMaterials: number; completed: number; balance: number; retainage: number };
  showCOCols: boolean;
  contractorCert: { firstName: string; lastName: string; date: string; signature: string };
  architectCert: { firstName: string; lastName: string; date: string; signature: string };
  onClose: () => void;
}

function ClientPreviewModal({ groups, totals, showCOCols, contractorCert, architectCert: _architectCert, onClose }: ClientPreviewModalProps) {
  void _architectCert;
  const fmtDate = (s: string) => {
    if (!s) return '';
    return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  // Split the schedule of values into Original contract vs Approved changes so the cover
  // reconciles in BOTH grouping modes. The two views model approved changes differently:
  //   • Cost-code view: approved changes live in each line's `coAdjustment` (a column).
  //   • Estimate view: approved changes are their own group ("Approved changes" / CO group)
  //     and carry the amount in `budget` — there is no coAdjustment.
  // Summing only coAdjustment zeroed out approved changes in estimate view and mis-attributed
  // those amounts to Original contract. Classify per group instead (matches #270276 cover-sheet
  // model + #277657). Grand total is unchanged in both views — only the line 1 / line 2 split.
  const isApprovedChangeGroup = (g: CostGroup): boolean =>
    !!(g.isChangeOrder || g.isSelection || g.id === 'approved-changes');
  let originalContract = 0;
  let approvedChangesTotal = 0;
  for (const g of groups) {
    const acg = isApprovedChangeGroup(g);
    for (const l of g.lines) {
      approvedChangesTotal += l.coAdjustment || 0;
      if (acg) {
        approvedChangesTotal += l.budget;
      } else {
        originalContract += l.budget;
      }
    }
  }
  const contractSum = originalContract + approvedChangesTotal;
  // Continuation-sheet partition: original-contract lines vs the approved-change lines
  // (selections + change orders), so the cover can list the selection items under a
  // dedicated "Approved changes" section.
  const contractGroupLines = groups.filter(g => !isApprovedChangeGroup(g)).flatMap(g => g.lines);
  const approvedChangeLines = groups.filter(isApprovedChangeGroup).flatMap(g => g.lines);
  const completedStored = totals.completed;
  const retainage = totals.retainage;
  const totalEarned = completedStored - retainage;
  const previousCerts = totals.previousInvoice;
  const currentPaymentDue = totalEarned - previousCerts;
  const balanceToFinish = contractSum - totalEarned;

  const handlePrint = () => window.print();

  // Page styles
  const pageStyle: React.CSSProperties = {
    background: 'white', maxWidth: 1100, margin: '0 auto 24px', padding: '40px 48px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
    borderRadius: 4, fontSize: 13, color: '#475569', fontFamily: "'Inter', sans-serif",
  };

  const dotLine = (label: string, value: string, bold?: boolean) => (
    <div style={{ display: 'flex', alignItems: 'baseline', padding: '5px 0', fontSize: 13, fontWeight: bold ? 600 : 400, color: bold ? '#0f172a' : '#475569' }}>
      <span>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #cbd5e1', margin: '0 8px', minWidth: 20 }} />
      <span style={{ fontWeight: bold ? 700 : 600, color: bold ? '#0f172a' : '#1e293b', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );

  const tdCover: React.CSSProperties = { padding: showCOCols ? '8px 7px' : '8px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' };
  const renderCoverLine = (line: SOVLine, indent = false) => {
    const coAdj = line.coAdjustment || 0;
    const revised = line.budget + coAdj;
    // In cost-code mode the schedule reconciles against revised budget (budget + approved
    // changes), matching the on-screen grid; otherwise against budget.
    const divisor = showCOCols ? revised : line.budget;
    const completed = line.previousInvoice + line.thisInvoice + line.storedMaterials;
    const pct = divisor > 0 ? (completed / divisor * 100) : 0;
    const balance = divisor - completed;
    return (
      <tr key={line.id}>
        <td style={{ ...tdCover, color: indent ? '#64748b' : '#475569', paddingLeft: indent ? 28 : 10 }}>{line.description}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(line.budget)}</td>
        {showCOCols && <td style={{ ...tdCover, textAlign: 'right' }}>{coAdj !== 0 ? `${coAdj > 0 ? '+' : '-'}$${fmt(Math.abs(coAdj))}` : '—'}</td>}
        {showCOCols && <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(revised)}</td>}
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(line.previousInvoice)}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(line.thisInvoice)}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(line.storedMaterials)}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(completed)}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>{pct > 0 ? `${pct.toFixed(0)}%` : '0%'}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(balance)}</td>
        <td style={{ ...tdCover, textAlign: 'right' }}>${fmt(line.retainage)}</td>
      </tr>
    );
  };

  return ReactDOM.createPortal(
    <div onClick={onClose} className="aia-preview-backdrop" style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 24px',
    }}>
      <div onClick={e => e.stopPropagation()} className="aia-preview-modal" style={{
        background: 'white', borderRadius: 12, width: '96vw', maxWidth: showCOCols ? 1520 : 1200,
        maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,26,67,0.22)', animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Johnson Residence</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Progress invoice</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20, padding: 4, borderRadius: 6, lineHeight: 1 }}>
            &times;
          </button>
        </div>

        {/* Body — two pages */}
        <div className="aia-preview-body" style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f1f5f9' }}>
          {/* PAGE 1 — Cover */}
          <div className="aia-preview-page" style={{ ...pageStyle, maxWidth: showCOCols ? 1480 : pageStyle.maxWidth }}>
            {/* Company header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0f172a', color: '#00d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>R</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Riverbend</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Custom Homebuilders</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                Riverbend Custom Homebuilders<br />
                123 River St, Chicago IL, PO 87901<br />
                Email: builder-email@gmail.com<br />
                Phone: 123-456-7890
              </div>
            </div>

            {/* Client address + application info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, padding: '16px 20px', background: '#f8fafc', borderRadius: 6, gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Client address</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                  John Gonzalez<br />1842 W Maple Grove Ave,<br />Chicago, IL 60622
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12 }}>
                <div><strong style={{ color: '#0f172a' }}>Application #:</strong> 0001</div>
                <div><strong style={{ color: '#0f172a' }}>Invoice date:</strong> 12/2/2025</div>
                <div><strong style={{ color: '#0f172a' }}>Amount due:</strong> ${fmt(Math.max(currentPaymentDue, 0))}</div>
              </div>
            </div>

            {/* Two-column: Application for Payment + Contractor Certification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Application for Payment</div>
                {dotLine('1. Original contract amount', `$${fmt(originalContract)}`)}
                {dotLine('2. Total approved changes', `$${fmt(approvedChangesTotal)}`)}
                {dotLine('3. Total contract sum (Line 1 + 2)', `$${fmt(contractSum)}`, true)}
                {dotLine('4. Total completed & stored to date', `$${fmt(completedStored)}`)}
                <div style={{ paddingLeft: 16, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  ("Completed & stored to date" column on continuation sheet)
                </div>
                {dotLine('5. Total retainage', `$${fmt(retainage)}`)}
                <div style={{ paddingLeft: 16, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  (Line 5a + 5b or Total in "Retainage" column)
                </div>
                {dotLine('6. Total earned − retainage', `$${fmt(totalEarned)}`, true)}
                <div style={{ paddingLeft: 16, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  (Line 4 − Line 5 total)
                </div>
                {dotLine('7. Less previous certificates for payment', `$${fmt(previousCerts)}`)}
                {dotLine('8. Current payment due', `$${fmt(Math.max(currentPaymentDue, 0))}`, true)}
                {dotLine('9. Balance to finish, including retainage', `$${fmt(Math.max(balanceToFinish, 0))}`)}
                <div style={{ paddingLeft: 16, fontSize: 11, color: '#94a3b8' }}>(Line 3 − Line 6)</div>
              </div>

              {/* Contractor certification */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Contractor certification</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                  By submitting this invoice, the Contractor certifies to the best of their knowledge that:
                  <ul style={{ margin: '8px 0 12px 18px' }}>
                    <li>All work billed has been delivered or performed in accordance with the contract documents and applicable standards;</li>
                    <li>The amounts stated accurately reflect work completed and are due under the contract;</li>
                    <li>All prior payments received have been properly applied to subcontractors, suppliers, and other obligations related to previous work;</li>
                    <li>There are no liens, claims, or encumbrances against the work covered by this invoice; and</li>
                    <li>Based on completion of work and compliance with contract terms, payment in the amount stated is now due and payable.</li>
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</div>
                    <div style={{ fontWeight: 500, color: '#0f172a', borderBottom: '1px solid #e2e8f0', padding: '2px 0', minWidth: 120 }}>
                      {contractorCert.firstName} {contractorCert.lastName}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</div>
                    <div style={{ fontWeight: 500, color: '#0f172a', borderBottom: '1px solid #e2e8f0', padding: '2px 0', minWidth: 80 }}>
                      {fmtDate(contractorCert.date)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signature</div>
                  <div style={{ height: 48, borderBottom: '1px solid #e2e8f0', minWidth: 200 }}>
                    {contractorCert.signature && <img src={contractorCert.signature} alt="Contractor signature" style={{ height: '100%' }} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Approved changes summary — change orders + selection adjustments */}
            <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0', margin: '20px 0' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Approved changes summary</div>
            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 8 }}>
              {dotLine('Total changes approved in previous application', `$${fmt(0)}`)}
              {dotLine('Total changes approved this application', `$${fmt(approvedChangesTotal)}`)}
              {dotLine('Total approved changes amount', `$${fmt(approvedChangesTotal)}`)}
            </div>
          </div>

          {/* PAGE 2 — Continuation Sheet */}
          <div className="aia-preview-page" style={{ ...pageStyle, marginBottom: 0, maxWidth: showCOCols ? 1480 : pageStyle.maxWidth, padding: showCOCols ? '40px 32px' : pageStyle.padding }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Continuation sheet</div>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: showCOCols ? 11 : 12, minWidth: showCOCols ? 1040 : 'auto' }}>
              <thead>
                <tr>
                  {(showCOCols
                    ? ['Description', 'Scheduled value', 'Approved changes', 'Revised value', 'Previous invoice', 'This invoice', 'Stored materials', 'Completed', '% complete', 'Balance to finish', 'Retainage']
                    : ['Description', 'Scheduled value', 'Previous invoice', 'This invoice', 'Stored materials', 'Completed', '% complete', 'Balance to finish', 'Retainage']
                  ).map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: showCOCols ? '8px 7px' : '8px 10px', fontSize: showCOCols ? 10 : 11, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contractGroupLines.map(line => renderCoverLine(line))}
                {/* Approved changes section — selection items + change orders surfaced
                    as net-new contract value, like change orders. */}
                {approvedChangeLines.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={showCOCols ? 11 : 9} style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        Approved changes
                      </td>
                    </tr>
                    {approvedChangeLines.flatMap(line =>
                      line.children && line.children.length > 0
                        ? [renderCoverLine(line), ...line.children.map(ch => renderCoverLine(ch, true))]
                        : [renderCoverLine(line)]
                    )}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#eff6ff' }}>
                  {(() => {
                    const tf: React.CSSProperties = { padding: '10px', fontWeight: 700, textAlign: 'right', borderTop: '2px solid #e2e8f0' };
                    const divisor = showCOCols ? contractSum : totals.budget;
                    const totalBalance = showCOCols ? contractSum - totals.completed : totals.balance;
                    return (
                      <>
                        <td style={{ ...tf, textAlign: 'left', color: '#0f172a' }}>Total:</td>
                        <td style={tf}>${fmt(showCOCols ? originalContract : totals.budget)}</td>
                        {showCOCols && <td style={tf}>{approvedChangesTotal !== 0 ? `${approvedChangesTotal > 0 ? '+' : '-'}$${fmt(Math.abs(approvedChangesTotal))}` : '—'}</td>}
                        {showCOCols && <td style={tf}>${fmt(contractSum)}</td>}
                        <td style={tf}>${fmt(totals.previousInvoice)}</td>
                        <td style={tf}>${fmt(totals.thisInvoice)}</td>
                        <td style={tf}>${fmt(totals.storedMaterials)}</td>
                        <td style={tf}>${fmt(totals.completed)}</td>
                        <td style={tf}>{divisor > 0 ? `${(totals.completed / divisor * 100).toFixed(0)}%` : '—'}</td>
                        <td style={tf}>${fmt(totalBalance)}</td>
                        <td style={tf}>${fmt(totals.retainage)}</td>
                      </>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button onClick={handlePrint} style={{ padding: '8px 20px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print
          </button>
          <button onClick={onClose} style={{ padding: '8px 20px', fontSize: 13, border: 'none', borderRadius: 6, background: '#0065db', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Add Costs Modal ──────────────────────────────────────────────

function AddCostsModal({ onClose, addedCostIds, onAdd }: {
  onClose: () => void;
  addedCostIds: string[];
  onAdd: (ids: string[]) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [recordType, setRecordType] = useState<Record<string, boolean>>({ Bills: true, 'Time Clock': true, 'QuickBooks Cost': true });
  const [includeDescs, setIncludeDescs] = useState(true);
  const [importAttachments, setImportAttachments] = useState(false);
  const [includeInternalNotes, setIncludeInternalNotes] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const available = COST_RECORDS.filter(c => !addedCostIds.includes(c.id) && recordType[c.costType]);
  const allChecked = available.length > 0 && available.every(c => checked[c.id]);
  const checkedItems = available.filter(c => checked[c.id]);
  const checkedCount = checkedItems.length;
  const totalCosts = checkedItems.reduce((s, c) => s + c.amount, 0);
  const markup = 0;
  const invoiceAmount = totalCosts + markup;

  const toggleAll = () => { const val = !allChecked; const next: Record<string, boolean> = {}; available.forEach(c => { next[c.id] = val; }); setChecked(next); };
  const toggleExpand = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  const expandAll = () => { const e: Record<string, boolean> = {}; available.forEach(c => { e[c.id] = true; }); setExpandedRows(e); };
  const collapseAll = () => setExpandedRows({});
  const removeRecordType = (type: string) => setRecordType(prev => ({ ...prev, [type]: false }));
  const fmtDate2 = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const attachCounts: Record<string, number> = { 'cost-1': 2, 'cost-2': 2, 'cost-4': 1 };

  // Record type chip configs
  const chipConfigs = [
    { key: 'Bills', label: 'Bills', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="#334155" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h3" stroke="#334155" strokeWidth="1" strokeLinecap="round"/></svg> },
    { key: 'Time Clock', label: 'Time Clock', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#334155" strokeWidth="1.2"/><path d="M8 5v3.5l2.5 1.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key: 'QuickBooks Cost', label: 'QuickBooks Cost', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="#334155" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h3" stroke="#334155" strokeWidth="1" strokeLinecap="round"/></svg> },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, width: 920, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Job title</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Add costs to invoice</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* ── Filter bar ── */}
        <div style={{ padding: '0 28px 20px', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0' }}>
          {/* Date */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Date</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#94a3b8' }}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1"/><path d="M8 5.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#334155', background: 'white', cursor: 'pointer' }}>
              10/1/2025-10/31/2025
              <svg width="12" height="12" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Record type */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Record type</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {chipConfigs.filter(t => recordType[t.key]).map(t => (
                <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#334155', background: 'white', whiteSpace: 'nowrap' }}>
                  {t.icon}
                  {t.label}
                  <button onClick={() => removeRecordType(t.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2, color: '#94a3b8' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Bill options */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Bill options</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeDescs} onChange={() => setIncludeDescs(!includeDescs)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Include line item descriptions &amp; notes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={importAttachments} onChange={() => setImportAttachments(!importAttachments)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
                Import attachments to invoice
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: '#94a3b8' }}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1"/><path d="M8 5.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </label>
            </div>
          </div>

          {/* Time clock options */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Time clock options</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={includeInternalNotes} onChange={() => setIncludeInternalNotes(!includeInternalNotes)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
              Include internal notes
            </label>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 28px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {/* Select all + Expand/Collapse */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
              Select all
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={expandAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontWeight: 500, fontFamily: 'inherit' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 5l5 5 5-5" stroke="#334155" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Expand all
              </button>
              <button onClick={collapseAll} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155', fontWeight: 500, fontFamily: 'inherit' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 11l5-5 5 5" stroke="#334155" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Collapse all
              </button>
            </div>
          </div>

          {/* Cost rows */}
          {available.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>No cost records match the current filters.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {available.map(cost => {
                const isChecked = checked[cost.id] || false;
                const isExpanded = expandedRows[cost.id] || false;
                const isBill = cost.costType === 'Bills' || cost.costType === 'QuickBooks Cost';
                const isTC = cost.costType === 'Time Clock';
                const attCount = attachCounts[cost.id] || 0;

                return (
                  <div key={cost.id} style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                      onClick={() => setChecked(prev => ({ ...prev, [cost.id]: !prev[cost.id] }))}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: 16, height: 16, accentColor: '#0065db', cursor: 'pointer', flexShrink: 0 }} />
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(cost.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#64748b', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {/* Title + subtitle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{cost.vendor}</div>
                        {cost.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{cost.description}</div>}
                      </div>

                      {/* Attachments */}
                      {attCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#64748b', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 8l-5.5 5.5a3.54 3.54 0 01-5-5L9 3a2.36 2.36 0 013.33 3.33L6.83 11.83a1.18 1.18 0 01-1.66-1.66L10.5 4.83" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {attCount}
                        </span>
                      )}

                      {/* Date */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M2 6h12M5.5 1v3M10.5 1v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                        {isTC ? `Shift dates: ${fmtDate2(cost.date)}` : `Invoice date: ${fmtDate2(cost.date)}`}
                      </span>

                      {/* Amount + type icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 14, color: '#0f172a' }}>
                          {isBill ? 'Bill total: ' : 'Time Clock total: '}
                          <strong>${fmt(cost.amount)}</strong>
                        </span>
                        {isBill ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#94a3b8' }}><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#94a3b8' }}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.1"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </div>
                    </div>

                    {/* Expanded table */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #e2e8f0', padding: '0 18px 12px 54px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              {['Item', 'Cost code', 'Cost types'].map(h => (
                                <th key={h} style={{ padding: '8px 12px 8px 0', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#64748b' }}>{h}</th>
                              ))}
                              {['Builder cost', '% Markup', 'Invoice amount'].map(h => (
                                <th key={h} style={{ padding: '8px 0 8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: '#64748b' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '10px 12px 10px 0', color: '#334155' }}>{cost.vendor}</td>
                              <td style={{ padding: '10px 12px 10px 0', color: '#334155' }}>{cost.costCode === '4100' ? '4100 - Stone Masonry' : cost.costCode === '6100' ? '3100 - Framing (C)' : cost.costCode}</td>
                              <td style={{ padding: '10px 12px 10px 0', color: '#64748b' }}>None</td>
                              <td style={{ padding: '10px 0 10px 12px', textAlign: 'right', color: '#334155' }}>${fmt(cost.amount)}</td>
                              <td style={{ padding: '10px 0 10px 12px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                  <input type="text" defaultValue="0.00" style={{ width: 48, padding: '4px 6px', fontSize: 12, border: 'none', outline: 'none', textAlign: 'right', fontFamily: 'inherit' }} />
                                  <span style={{ padding: '4px 6px', fontSize: 12, color: '#64748b', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>%</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 0 10px 12px', textAlign: 'right', fontWeight: 500, color: '#0f172a' }}>${fmt(cost.amount)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '16px 28px', background: 'white', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Total costs</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>${fmt(totalCosts)}</div>
            </div>
            <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300, lineHeight: 1 }}>+</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Markup</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>${fmt(markup)}</div>
            </div>
            <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300, lineHeight: 1 }}>=</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Invoice amount</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>${fmt(invoiceAmount)}</div>
            </div>
          </div>
          <button
            onClick={() => { const ids = available.filter(c => checked[c.id]).map(c => c.id); if (ids.length > 0) onAdd(ids); }}
            disabled={checkedCount === 0}
            style={{ padding: '10px 24px', fontSize: 14, border: 'none', borderRadius: 6, fontWeight: 600, background: checkedCount > 0 ? '#0065db' : '#cbd5e1', color: 'white', cursor: checkedCount > 0 ? 'pointer' : 'not-allowed' }}
          >
            Add costs to invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Change Orders Modal ──────────────────────────────────────

function AddCOModal({ onClose, addedCOIds, onAdd }: {
  onClose: () => void;
  addedCOIds: string[];
  onAdd: (ids: string[]) => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [includeDescs, setIncludeDescs] = useState(true);
  const [adjustPct, setAdjustPct] = useState('100.00');
  const [linePcts, setLinePcts] = useState<Record<string, number>>({});
  const available = CHANGE_ORDERS.filter(co => co.status === 'approved' && !addedCOIds.includes(co.id));
  const checkedCount = available.filter(co => checked[co.id]).length;

  const applyAll = () => {
    const pct = parseFloat(adjustPct) || 0;
    const updates: Record<string, number> = {};
    available.forEach(co => { updates[co.id] = pct; });
    setLinePcts(updates);
  };

  const getLineAmt = (co: ChangeOrderRecord) => {
    const pct = linePcts[co.id] ?? 0;
    return co.amount * pct / 100;
  };

  const invoiceSubtotal = available
    .filter(co => checked[co.id])
    .reduce((s, co) => s + getLineAmt(co), 0);

  // Select all
  const allChecked = available.length > 0 && available.every(co => checked[co.id]);
  const toggleAll = () => {
    const val = !allChecked;
    const next: Record<string, boolean> = {};
    available.forEach(co => { next[co.id] = val; });
    setChecked(next);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', borderRadius: 12, width: 1020, maxWidth: '96vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Add line items to invoice</div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6 }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ background: '#f8fafc', margin: '0 28px', borderRadius: 8, padding: '20px 24px' }}>
            {/* Section banner */}
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Change Order Line Items</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Select any line items to add to the invoice and indicate the percentage or amount to invoice.
            </div>

            {/* Include descriptions checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={includeDescs} onChange={() => setIncludeDescs(!includeDescs)} style={{ width: 16, height: 16, accentColor: '#0065db' }} />
              Include line item descriptions &amp; notes
            </label>

            {/* Adjust Invoice % */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Adjust Invoice %</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', background: 'white' }}>
                <input
                  type="text"
                  value={adjustPct}
                  onChange={e => setAdjustPct(e.target.value)}
                  style={{
                    width: 64, padding: '6px 10px', fontSize: 13, border: 'none', outline: 'none',
                    textAlign: 'right', color: '#0f172a', fontFamily: 'inherit',
                  }}
                />
                <span style={{ padding: '6px 8px', fontSize: 13, color: '#64748b', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>%</span>
              </div>
              <button
                onClick={applyAll}
                style={{
                  padding: '6px 14px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6,
                  background: 'white', cursor: 'pointer', color: '#334155', fontFamily: 'inherit',
                }}
              >
                Apply all
              </button>
            </div>

            {available.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                {addedCOIds.length > 0 ? 'All available change orders have been added.' : 'No approved change orders available.'}
              </div>
            ) : (
              <>
                {/* Table */}
                <div style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1.2fr 140px 90px 100px 1fr 110px 130px',
                    padding: '10px 16px', borderBottom: '1px solid #e2e8f0',
                    fontSize: 12, fontWeight: 500, color: '#64748b', gap: 12, alignItems: 'center',
                  }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: '#0065db', cursor: 'pointer' }} />
                    <span>Title</span>
                    <span>Cost code</span>
                    <span>Cost types</span>
                    <span style={{ textAlign: 'right' }}>Client price</span>
                    <span>Invoice overview</span>
                    <span style={{ textAlign: 'right' }}>New invoice %</span>
                    <span style={{ textAlign: 'right' }}>New invoice amount</span>
                  </div>

                  {available.map(co => {
                    const isChecked = checked[co.id] || false;
                    const pct = linePcts[co.id] ?? 0;
                    const lineAmt = getLineAmt(co);
                    const overviewPct = Math.min(pct, 100);

                    return (
                      <div key={co.id}>
                        {/* CO group row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '36px 1.2fr 140px 90px 100px 1fr 110px 130px',
                            padding: '14px 16px', gap: 12, alignItems: 'center',
                            borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                          }}
                          onClick={() => setChecked(prev => ({ ...prev, [co.id]: !prev[co.id] }))}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: 16, height: 16, accentColor: '#0065db', cursor: 'pointer' }} />
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{co.title}</span>
                          <span />
                          <span />
                          <span style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>${fmt(co.amount)}</span>
                          <span />
                          <span />
                          <span />
                        </div>

                        {/* CO child line */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '36px 1.2fr 140px 90px 100px 1fr 110px 130px',
                          padding: '12px 16px', gap: 12, alignItems: 'center',
                          borderBottom: '1px solid #f1f5f9', fontSize: 13,
                        }}>
                          <input type="checkbox" checked={isChecked} onChange={() => setChecked(prev => ({ ...prev, [co.id]: !prev[co.id] }))} style={{ width: 16, height: 16, accentColor: '#0065db', cursor: 'pointer' }} />
                          <span style={{ color: '#334155', paddingLeft: 8 }}>--</span>
                          <span style={{ color: '#334155' }}>Buildertrend Flat Rate</span>
                          <span style={{ color: '#64748b' }}>None</span>
                          <span style={{ textAlign: 'right', color: '#334155' }}>${fmt(co.amount)}</span>
                          {/* Invoice overview progress bar */}
                          <div style={{ padding: '0 4px' }}>
                            <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 4, width: `${overviewPct}%`,
                                background: overviewPct > 0 ? '#94a3b8' : 'transparent',
                                transition: 'width 0.2s',
                              }} />
                            </div>
                          </div>
                          {/* New invoice % */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', background: 'white' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={pct}
                                onChange={e => setLinePcts(prev => ({ ...prev, [co.id]: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                                style={{
                                  width: 52, padding: '5px 6px', fontSize: 12, border: 'none', outline: 'none',
                                  textAlign: 'right', color: '#0f172a', fontFamily: 'inherit',
                                }}
                              />
                              <span style={{ padding: '5px 6px', fontSize: 12, color: '#64748b', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' }}>%</span>
                            </div>
                          </div>
                          {/* New invoice amount */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden', background: 'white' }}>
                              <span style={{ padding: '5px 6px', fontSize: 12, color: '#64748b', borderRight: '1px solid #e2e8f0', background: '#f8fafc' }}>$</span>
                              <input
                                type="text"
                                value={fmt(lineAmt)}
                                readOnly
                                style={{
                                  width: 68, padding: '5px 6px', fontSize: 12, border: 'none', outline: 'none',
                                  textAlign: 'right', color: '#0f172a', fontFamily: 'inherit', background: 'white',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Invoice subtotal */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, padding: '14px 14px 4px', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Invoice subtotal</span>
                  <span style={{ fontWeight: 700, color: '#0f172a', minWidth: 80, textAlign: 'right' }}>${fmt(invoiceSubtotal)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            onClick={() => {
              const ids = available.filter(co => checked[co.id]).map(co => co.id);
              if (ids.length > 0) onAdd(ids);
            }}
            disabled={checkedCount === 0}
            style={{
              padding: '10px 24px', fontSize: 14, border: 'none', borderRadius: 6, fontWeight: 600,
              background: checkedCount > 0 ? '#0065db' : '#cbd5e1',
              color: 'white',
              cursor: checkedCount > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Add line items to invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const pinnedColStyle: React.CSSProperties = {
  position: 'sticky', right: 0, width: 44, minWidth: 44, textAlign: 'center',
  padding: '4px 8px', borderLeft: '1px solid #e2e8f0', background: 'white', zIndex: 1,
};

const cellStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13,
};

const numCellStyle: React.CSSProperties = {
  ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
};

const headerCellStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 12, fontWeight: 500, color: '#64748b',
  textAlign: 'right', whiteSpace: 'nowrap', background: '#f8fafc',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6,
  width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a',
};

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6,
};

const footerBtnStyle: React.CSSProperties = {
  padding: '8px 20px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#334155',
  height: 36, boxSizing: 'border-box',
};
