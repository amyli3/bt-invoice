import { useState, Fragment } from 'react';
import '../bds-tokens.css';
import { BdsActionBar, BdsBadge, BdsButton, BdsIcon, BdsSection, BdsTabs, BdsText } from '../bds';
import { JCB_TOTALS, JCB_ROWS, MARKUP_PCT } from '../jcbMockData';
import {
  panelByCategory,
  panelByCategoryV41Notes,
  panelByLocation,
  panelVarianceTotal,
  type PanelCategoryItem,
} from '../v4PanelData';

/* ── Mock Data ── */

// Pinned to the JCB so the JPS contract baseline always matches the sum of
// originalOwnerPrice across all cost codes.
const originalContractPrice = JCB_TOTALS.originalOwnerPrice;

interface PaymentRow {
  name: string;
  date: string;
  method: string;
  amount: number;
  kind: 'payment' | 'credit';
}
const payments: PaymentRow[] = [
  { name: 'Deposit',                 date: 'Oct 1, 2024',  method: 'Check',       amount: 50000, kind: 'payment' },
  { name: 'Progress payment #1',     date: 'Nov 1, 2024',  method: 'ACH',         amount: 125000, kind: 'payment' },
  { name: 'Progress payment #2',     date: 'Dec 1, 2024',  method: 'ACH',         amount: 150000, kind: 'payment' },
  { name: 'Progress payment #3',     date: 'Jan 15, 2025', method: 'Check',       amount: 80000, kind: 'payment' },
  { name: 'Credit memo — overpayment', date: 'Dec 15, 2024', method: 'Credit memo', amount: 1500,  kind: 'credit' },
];
const paymentsReceived = payments.filter(p => p.kind === 'payment').reduce((s, p) => s + p.amount, 0);
const creditMemos = payments.filter(p => p.kind === 'credit').reduce((s, p) => s + p.amount, 0);

// Approved + pending totals derived after data arrays are declared (see below).

interface SelectionItem {
  name: string;
  category: string;
  date: string;
  price: number;
  impact: number; // +/- on contract price
  allowanceName?: string;
  allowanceBudget?: number;
  allowanceUsed?: number; // cumulative used of that allowance after this selection
  allowanceFromCO?: string; // if this allowance originated from a Change Order
  status: 'approved' | 'pending' | 'declined';
  timing?: 'pre-contract' | 'post-contract';
  approvedBy?: string; // client who approved (matters when a job has multiple clients)
  location?: string; // physical location in the house (for standalone selections)
}

const allSelections: SelectionItem[] = [
  // Kitchen
  { name: 'Natural Select Red Oak Smooth Solid Hardwood', category: 'Kitchen', date: 'Oct 15, 2024', price: 4000, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4000, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Belwith Keeler Coventry Cabinet w/ Drawer Pull Handle', category: 'Kitchen', date: 'Oct 19, 2024', price: 200, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4200, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Valencia Edge 6 ft. Laminate Countertop', category: 'Kitchen', date: 'Oct 30, 2024', price: 500, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4700, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Custom Hand-Finished Shaker Cabinet Package with Soft-Close Dovetail Drawers and Brushed Nickel Hardware', category: 'Kitchen', date: 'Oct 25, 2024', price: 0, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 4700, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' }, // Long selection title to illustrate wrapping
  { name: 'Brass pendant lighting over island', category: 'Kitchen', date: 'Oct 22, 2024', price: 650, impact: 0, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 0, status: 'declined', location: 'Kitchen' },
  { name: 'Granite Backsplash Upgrade', category: 'Kitchen', date: 'Nov 2, 2024', price: 2100, impact: 1800, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 6800, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Under-cabinet LED lighting', category: 'Kitchen', date: 'Nov 4, 2024', price: 450, impact: 450, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 7250, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Pot filler faucet', category: 'Kitchen', date: '', price: 380, impact: 380, allowanceName: 'Kitchen allowance', allowanceBudget: 5000, allowanceUsed: 7630, status: 'pending', location: 'Kitchen' },

  // Bathroom
  { name: 'Two Handle Center set Bathroom Sink Faucet in Chrome', category: 'Bathroom', date: 'Nov 1, 2024', price: 100, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 100, status: 'approved', approvedBy: 'Mark Johnson', location: 'Master Bath' },
  { name: 'DeerValley Smart Bidet Toilet Sensor Auto', category: 'Bathroom', date: 'Nov 3, 2024', price: 700, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 800, status: 'approved', approvedBy: 'Mark Johnson', location: 'Master Bath' },
  { name: 'Kohler Forte 1.75 GPM Multi-Function Shower Head', category: 'Bathroom', date: 'Nov 4, 2024', price: 100, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 900, status: 'approved', approvedBy: 'Mark Johnson', location: 'Master Bath' },
  { name: 'Heated towel rack', category: 'Bathroom', date: 'Nov 2, 2024', price: 450, impact: 0, allowanceName: 'Bathroom allowance', allowanceBudget: 1000, allowanceUsed: 0, status: 'declined', location: 'Master Bath' },

  // Porch fixtures allowance (from CO #3: Add screened porch)
  { name: 'Outdoor ceiling fan', category: 'Exterior', date: 'Dec 1, 2024', price: 800, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 800, allowanceFromCO: 'Add screened porch', status: 'approved', approvedBy: 'Jenna Johnson', location: 'Exterior' },
  { name: 'Porch pendant lighting (2x)', category: 'Exterior', date: 'Dec 3, 2024', price: 1200, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 2000, allowanceFromCO: 'Add screened porch', status: 'approved', approvedBy: 'Mark Johnson', location: 'Exterior' },
  { name: 'Outlet covers and switch plates', category: 'Exterior', date: 'Dec 5, 2024', price: 400, impact: 0, allowanceName: 'Porch fixtures', allowanceBudget: 3000, allowanceUsed: 2400, allowanceFromCO: 'Add screened porch', status: 'approved', approvedBy: 'Jenna Johnson', location: 'Exterior' },

  // Lighting allowance — spans multiple rooms, so items have per-room locations
  { name: 'Foyer pendant light', category: 'Interior', date: 'Nov 8, 2024', price: 700, impact: 0, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 700, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Foyer' },
  { name: 'Dining room chandelier', category: 'Interior', date: 'Nov 10, 2024', price: 1300, impact: 0, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 2000, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Dining Room' },
  { name: 'Living room track lighting', category: 'Interior', date: 'Nov 14, 2024', price: 500, impact: 500, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 2500, status: 'approved', approvedBy: 'Mark Johnson', location: 'Living Room' },
  { name: 'Master bedroom reading lamps', category: 'Interior', date: 'Nov 18, 2024', price: 420, impact: 420, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 2920, status: 'approved', approvedBy: 'Mark Johnson', location: 'Master Bedroom' },
  { name: 'Stair landing pendant', category: 'Interior', date: 'Nov 20, 2024', price: 380, impact: 380, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 3300, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Stairs' },
  { name: 'Hallway wall sconces (pair)', category: 'Interior', date: '', price: 300, impact: 300, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 3600, status: 'pending', location: 'Hallway' },
  { name: 'Master bath vanity lighting', category: 'Interior', date: '', price: 280, impact: 280, allowanceName: 'Lighting allowance', allowanceBudget: 2000, allowanceUsed: 3880, status: 'pending', location: 'Master Bath' },

  // Flooring allowance — approved selections come in under budget ($5,500 of $8,000) to demo the "under-budget, in progress" case.
  { name: 'Engineered white oak flooring — main level', category: 'Interior', date: 'Nov 12, 2024', price: 3800, impact: 0, allowanceName: 'Flooring allowance', allowanceBudget: 8000, allowanceUsed: 3800, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Whole house' },
  { name: 'Porcelain tile — bathrooms', category: 'Interior', date: 'Nov 14, 2024', price: 1200, impact: 0, allowanceName: 'Flooring allowance', allowanceBudget: 8000, allowanceUsed: 5000, status: 'approved', approvedBy: 'Mark Johnson', location: 'Master Bath' },
  { name: 'Stair tread carpet runner', category: 'Interior', date: 'Nov 18, 2024', price: 500, impact: 0, allowanceName: 'Flooring allowance', allowanceBudget: 8000, allowanceUsed: 5500, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Stairs' },

  // Landscaping allowance — approved selections hit the budget exactly ($4,500 of $4,500) to demo the "on the money, $0 difference" case.
  { name: 'Front yard sod and irrigation', category: 'Exterior', date: 'Nov 22, 2024', price: 2500, impact: 0, allowanceName: 'Landscaping allowance', allowanceBudget: 4500, allowanceUsed: 2500, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Exterior' },
  { name: 'Foundation plantings — shrubs and perennials', category: 'Exterior', date: 'Nov 24, 2024', price: 1400, impact: 0, allowanceName: 'Landscaping allowance', allowanceBudget: 4500, allowanceUsed: 3900, status: 'approved', approvedBy: 'Mark Johnson', location: 'Exterior' },
  { name: 'Walkway pavers', category: 'Exterior', date: 'Nov 26, 2024', price: 600, impact: 0, allowanceName: 'Landscaping allowance', allowanceBudget: 4500, allowanceUsed: 4500, status: 'approved', approvedBy: 'Jenna Johnson', location: 'Exterior' },

  // Standalone selections — pre-contract (included in original price)
  { name: 'Shower Floor Tile — Marble Upgrade', category: 'Exterior', date: 'Oct 2, 2024', price: 480, impact: 0, status: 'approved', timing: 'pre-contract', location: 'Master Bath' },
  { name: 'Upgraded front door hardware', category: 'Exterior', date: 'Oct 5, 2024', price: 350, impact: 0, status: 'approved', timing: 'pre-contract', location: 'Foyer' },
  // Toilet scenario — pre-contract selection at $1,000 (baked into contract baseline)
  { name: 'Kohler Kingston 1.28 GPF Two Piece Elongated Toilet with Right Hand Lever - Less Seat White', category: 'Bathroom', date: 'Oct 8, 2024', price: 1000, impact: 0, status: 'approved', timing: 'pre-contract', approvedBy: 'Jenna Johnson', location: 'Master Bath' },

  // Standalone selections — post-contract (changes after contract signed)
  // Builder updated the price of the pre-contract Toilet selection post-contract: original $1,000 → new $1,500 = +$500 contract impact (delta only; original $1,000 stays in contract baseline)
  { name: 'Kohler Kingston 1.28 GPF Two Piece Elongated Toilet with Right Hand Lever - Less Seat White — price update', category: 'Bathroom', date: 'Nov 25, 2024', price: 500, impact: 500, status: 'approved', timing: 'post-contract', approvedBy: 'Mark Johnson', location: 'Master Bath' },
  { name: 'Garage Door Upgrade — Insulated', category: 'Exterior', date: '', price: 2262, impact: 2262, status: 'pending', timing: 'post-contract', location: 'Exterior' },
  { name: 'Heated Tile Floor System', category: 'Bathroom', date: '', price: 3200, impact: 3200, status: 'pending', timing: 'post-contract', location: 'Master Bath' },
  { name: 'Recessed lighting package', category: 'Kitchen', date: 'Nov 15, 2024', price: 1800, impact: 1800, status: 'approved', timing: 'post-contract', approvedBy: 'Jenna Johnson', location: 'Kitchen' },
  { name: 'Smart thermostat', category: 'Interior', date: 'Nov 22, 2024', price: 420, impact: 420, status: 'approved', timing: 'post-contract', approvedBy: 'Mark Johnson', location: 'Whole house' },
  { name: 'Built-in bookshelf', category: 'Interior', date: '', price: 2800, impact: 2800, status: 'pending', timing: 'post-contract', location: 'Living Room' },
  { name: 'Exterior soffit lighting', category: 'Exterior', date: 'Dec 8, 2024', price: 950, impact: 950, status: 'approved', timing: 'post-contract', approvedBy: 'Jenna Johnson', location: 'Exterior' },
];

interface ChangeOrder {
  name: string;
  date: string;
  price: number;
  status: 'approved' | 'pending' | 'declined';
  includesAllowance?: { name: string; budget: number };
  approvedBy?: string;
}

const changeOrders: ChangeOrder[] = [
  { name: 'Add covered patio', date: 'Oct 20, 2024', price: 4200, status: 'approved', approvedBy: 'Mark Johnson' },
  { name: 'Upgrade electrical panel', date: 'Nov 12, 2024', price: 1800, status: 'approved', approvedBy: 'Jenna Johnson' },
  { name: 'Add screened porch', date: 'Nov 20, 2024', price: 15000, status: 'approved', includesAllowance: { name: 'Porch fixtures', budget: 3000 }, approvedBy: 'Jenna Johnson' },
  { name: 'Add mudroom bench', date: '', price: 1000, status: 'pending' },
];

// Tax rate applied to selection and allowance changes. The breakdown numbers
// above the tax line are ex-tax; tax is pulled out so the client sees a single
// total tax amount, and the grid line items below display tax-inclusive prices.
const TAX_RATE = 0.0825;
const withTax = (n: number) => n * (1 + TAX_RATE);

// Totals derived from mock data so the top cards stay in sync with the tables below
const changeOrdersTotal = changeOrders
  .filter(c => c.status === 'approved')
  .reduce((sum, c) => sum + c.price, 0);
// approvedSelectionsTotal + dependent totals are computed below, after the
// allowances data is declared (we need `complete` flags to filter).

const pendingSelectionsAmt = allSelections
  .filter(s => s.status === 'pending')
  .reduce((sum, s) => sum + s.impact, 0);
const pendingChangeOrders = changeOrders
  .filter(c => c.status === 'pending')
  .reduce((sum, c) => sum + c.price, 0);
const forecastedAdditional = pendingSelectionsAmt + pendingChangeOrders;

// Allowances as first-class entities — exist whether or not selections have been made yet
const allowances: { name: string; budget: number; fromCO?: string; location: string; complete?: boolean }[] = [
  { name: 'Kitchen allowance', budget: 5000, location: 'Kitchen' },
  { name: 'Bathroom allowance', budget: 1000, location: 'Master Bath', complete: true }, // under-budget, marked complete → shows negative Contract impact
  { name: 'Porch fixtures', budget: 3000, fromCO: 'Add screened porch', location: 'Exterior', complete: true },
  { name: 'Lighting allowance', budget: 2000, location: 'Whole house', complete: true }, // over-budget approved ($3,300 / $2,000) → +$1,300 Contract impact when complete
  { name: 'Flooring allowance', budget: 8000, location: 'Whole house' }, // No selections yet
  { name: 'Landscaping allowance', budget: 4500, location: 'Exterior' }, // No selections yet
  { name: 'Appliance allowance', budget: 6000, location: 'Kitchen' }, // No selections yet
  { name: 'Custom millwork and built-in cabinetry coordination allowance', budget: 12000, location: 'Whole house' }, // Long allowance name to illustrate wrapping
];
const allowanceNames = allowances.map(a => a.name);
const allowanceGroups = allowances.map(a => {
  const items = allSelections.filter(s => s.allowanceName === a.name);
  const maxUsed = items.length ? Math.max(0, ...items.map(i => i.allowanceUsed || 0)) : 0;
  return { name: a.name, budget: a.budget, used: maxUsed, items, fromCO: a.fromCO, location: a.location, complete: !!a.complete };
});

// In-progress first, then marked complete. Used by every JPS slice's allowance
// list so the two groups render under separate sub-section headers.
const sortedAllowanceGroups = [
  ...allowanceGroups.filter(g => !g.complete),
  ...allowanceGroups.filter(g => g.complete),
];

// Subtotals for the In progress / Completed sub-sections. Both use the same
// shape (budget / approved) and a third value that differs by state:
//   - In progress → Remaining (budget − approved). Negative when the section
//     is collectively over-budget; positive when collectively under.
//   - Completed → Contract impact (approved − budget, $0 if nothing approved).
function approvedFor(group: typeof allowanceGroups[number]) {
  return group.items.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0);
}
const inProgressAllowanceTotals = allowanceGroups.filter(g => !g.complete).reduce(
  (acc, g) => {
    const approved = approvedFor(g);
    acc.budget += g.budget;
    acc.approved += approved;
    // Difference = approved − budget. Positive when over-budget, negative when
    // under. Matches the per-row formula so the subtotal sign matches its rows.
    // Skip allowances with no approved spending — those render "—" on their
    // row, so excluding them keeps the subtotal in sync with what the user sees.
    acc.difference += approved === 0 ? 0 : g.budget - approved;
    return acc;
  },
  { budget: 0, approved: 0, difference: 0 },
);
const completedAllowanceTotals = allowanceGroups.filter(g => g.complete).reduce(
  (acc, g) => {
    const approved = approvedFor(g);
    acc.budget += g.budget;
    acc.approved += approved;
    acc.contractImpact += approved === 0 ? 0 : approved - g.budget;
    return acc;
  },
  { budget: 0, approved: 0, contractImpact: 0 },
);

// Approved changes from selections:
//   - Standalone approved selections (no allowance) always contribute their impact.
//   - Allowance-bound selections only contribute via their parent allowance, and
//     only once it's marked complete — the per-allowance contract impact rolls in
//     (approvedUsed - budget). In-progress allowances don't impact this total;
//     their running variance lives in the per-row "Remaining" instead.
const standaloneApprovedSelectionsImpact = allSelections
  .filter(s => s.status === 'approved' && !s.allowanceName)
  .reduce((sum, s) => sum + s.impact, 0);
const approvedSelectionsTotal = completedAllowanceTotals.contractImpact + standaloneApprovedSelectionsImpact;
const totalTax = approvedSelectionsTotal * TAX_RATE;
const revisedClientPrice = originalContractPrice + changeOrdersTotal + approvedSelectionsTotal + totalTax;

// Bills grouped by cost code — open book / cost-plus contracts realize price adjustments
// through actuals (bills) vs. budgeted line items. Each cost code has a budget; bills accrue
// against it; variance (positive or negative) flows into the price adjustment.
type BillRow = { name: string; vendor: string; date: string; amount: number };
const costCodes: { name: string; budget: number; bills: BillRow[] }[] = [
  { name: 'Framing', budget: 25000, bills: [
    { name: 'Lumber package', vendor: 'Northwest Lumber', date: 'Sep 15, 2024', amount: 18200 },
    { name: 'Engineered beams', vendor: 'Steel Pro Supply', date: 'Sep 28, 2024', amount: 8300 },
  ] },
  { name: 'Plumbing rough-in', budget: 12000, bills: [
    { name: 'PEX + fittings', vendor: 'Acme Plumbing Supply', date: 'Oct 5, 2024', amount: 6800 },
    { name: 'Plumbing labor — week 1', vendor: 'Diaz Plumbing LLC', date: 'Oct 14, 2024', amount: 4400 },
  ] },
  { name: 'Electrical rough-in', budget: 18000, bills: [
    { name: 'Wire + breakers', vendor: 'CityElec Wholesale', date: 'Oct 22, 2024', amount: 7900 },
    { name: 'Electrical labor', vendor: 'Brightway Electric', date: 'Nov 02, 2024', amount: 11700 },
  ] },
  { name: 'HVAC', budget: 15000, bills: [
    { name: 'Furnace + AC unit', vendor: 'TempControl Co', date: 'Nov 10, 2024', amount: 9200 },
    { name: 'HVAC install labor', vendor: 'TempControl Co', date: 'Nov 18, 2024', amount: 5300 },
  ] },
];

const costCodeVariances = costCodes.map(c => {
  const spent = c.bills.reduce((s, b) => s + b.amount, 0);
  return { ...c, spent, variance: spent - c.budget };
});
const billVarianceTotal = costCodeVariances.reduce((s, c) => s + c.variance, 0);

// V4 panel data + grouped variants are imported from ../v4PanelData (shared with ClientPortal).

// ─── Slice 4 · v5 — JCB-correct customer-payable cost variance ───
// All inputs come from JCB_ROWS in jcbMockData.ts so JPS and JobCostingBudget
// always reconcile. Edit the rows there to drive both screens.
// References:
//   - btwiki.atlassian.net/wiki/spaces/TG/pages/4481384935 (internal JCB breakdown)
//   - buildertrend.com/help-article/job-costing-budget-overview
const REVISED_BUDGET_TOTAL = JCB_TOTALS.revisedBudget;
const MOCK_PROJECTED_COSTS = JCB_TOTALS.projectedCosts;
const MOCK_BUILDER_VARIANCE = JCB_TOTALS.builderVariance;
const MOCK_MARKUP_PCT = MARKUP_PCT;
const costSideDelta = JCB_TOTALS.costSideDelta;
const markupOnDelta = JCB_TOTALS.markupOnDelta;

// Location list kept for reference — not currently used for top-level grouping in any slice.
const LOCATIONS = ['Kitchen', 'Master Bath', 'Foyer', 'Exterior', 'Whole house'];
void LOCATIONS;

// CO-linked allowance summaries for inline display
const coAllowanceSummaries = new Map<string, { budget: number; used: number; remaining: number }>();
allSelections.filter(s => s.allowanceFromCO).forEach(s => {
  const key = s.allowanceFromCO!;
  const existing = coAllowanceSummaries.get(key);
  if (!existing) {
    coAllowanceSummaries.set(key, { budget: s.allowanceBudget!, used: s.allowanceUsed!, remaining: s.allowanceBudget! - s.allowanceUsed! });
  } else if (s.allowanceUsed! > existing.used) {
    existing.used = s.allowanceUsed!;
    existing.remaining = s.allowanceBudget! - s.allowanceUsed!;
  }
});

// Standalone selections — also derived flat for Slice 1
const preContractSelections = allSelections.filter(s => !s.allowanceName && s.timing === 'pre-contract');
const postContractSelections = allSelections.filter(s => !s.allowanceName && s.timing === 'post-contract');

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtSigned = (n: number) => (n > 0 ? '+' : '') + fmt(n);
// Inline icons for activity kinds (Bill / PO / Time clock / Receipt / Cost adjustment).
// 14×14, currentColor — tints with the surrounding text color.
const ActivityKindIcon = ({ kind }: { kind: string }) => {
  switch (kind) {
    case 'Bill':
      return (
        <svg className="jps-kind-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 1.5h7l3 3v10a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M10 1.5V4.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5 8h6M5 10.5h6M5 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'PO':
      return (
        <svg className="jps-kind-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="2.5" width="10" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="6" y="1.5" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="white" />
          <path d="M5.5 8l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 11.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'Time clock':
      return (
        <svg className="jps-kind-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Receipt':
      return (
        <svg className="jps-kind-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 2v12l1.5-1 1.5 1 1.5-1 1.5 1 1.5-1 1.5 1V2H3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'Cost adjustment':
      return (
        <svg className="jps-kind-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M11 2.5l2.5 2.5L6 12.5l-3 .5.5-3L11 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
};

/* ── Component ── */

export default function JobPriceSummary({ jobOpen, onToggleJob, onOpenSelection, onBack }: { jobOpen?: boolean; onToggleJob?: () => void; onOpenSelection?: (sel: { name: string; category: string; price: number; allowanceName?: string; status: string }) => void; onBack?: () => void; onOpenJCB?: () => void }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  // v41 (cost category) budget difference: free-form notes the builder types to
  // record what drove the variance. Keyed by cost code.
  const [categoryNotes, setCategoryNotes] = useState<Record<string, string>>({});
  // v4.1 Notes Save state — confirms to the builder that their notes are now
  // visible to the client. Resets when they edit again.
  const [notesSavedAt, setNotesSavedAt] = useState<Date | null>(null);
  const [notesSnapshot, setNotesSnapshot] = useState<string>('{}');
  const notesDirty = JSON.stringify(categoryNotes) !== notesSnapshot;
  const saveNotes = () => {
    setNotesSnapshot(JSON.stringify(categoryNotes));
    setNotesSavedAt(new Date());
  };
  const [activeSlice, setActiveSlice] = useState<'slice1' | 'slice2' | 'slice3' | 'slice4' | 'slice5'>('slice1');
  // Slice 4 = sandbox for Kendall's open book client financials brief (page 7003570340).
  // v1 inline expandable, v2 always-on list, v3 drill-through, v4 grouped sections,
  // v5 visual contribution bar — iteration of v2 that swaps three nested rows for a stacked
  // bar + decision callout (Sarah review, May 2026).
  const [slice4Version, setSlice4Version] = useState<'v1' | 'v2' | 'v3' | 'v4' | 'v41' | 'v41notes' | 'v411' | 'v45' | 'v5'>('v1');
  const [slice4DrillOpen, setSlice4DrillOpen] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    changeOrders: true,
    payments: true,
    expandAllowances: true,
  });
  type SortColumn = 'title' | 'date' | 'price' | 'impact' | 'budget' | 'spent' | 'remaining';
  type SortDir = 'asc' | 'desc';
  type SortState = { column: SortColumn; direction: SortDir };
  const defaultSort: SortState = { column: 'date', direction: 'asc' };
  // Each table is keyed by gridId so sorting one doesn't disturb the others.
  const [sortByGrid, setSortByGrid] = useState<Record<string, SortState>>({});
  const getSort = (gridId: string): SortState => sortByGrid[gridId] ?? defaultSort;

  // Click a header → if same column, flip direction; otherwise make it active in asc, scoped to gridId.
  const toggleSort = (gridId: string, column: SortColumn) => {
    setSortByGrid(prev => {
      const cur = prev[gridId] ?? defaultSort;
      const next: SortState = cur.column === column
        ? { column, direction: cur.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' };
      return { ...prev, [gridId]: next };
    });
  };

  // Parse the mock date strings ("Oct 15, 2024") to a comparable timestamp. Items without a date sort last.
  const dateToTs = (d?: string) => (d ? new Date(d).getTime() : 0);
  // Items passed in can optionally expose an `impact` field (post/pre-contract) or an extra `_impact` injected at the call site (allowance table, where impact is computed from chronological running total).
  const sortItems = <T extends { name: string; date?: string; price: number; impact?: number; _impact?: number }>(gridId: string, items: T[]) => {
    const out = [...items];
    const { column, direction } = getSort(gridId);
    const sign = direction === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      if (column === 'title') return sign * a.name.localeCompare(b.name);
      if (column === 'price') return sign * (a.price - b.price);
      if (column === 'impact') return sign * ((a._impact ?? a.impact ?? 0) - (b._impact ?? b.impact ?? 0));
      return sign * (dateToTs(a.date) - dateToTs(b.date));
    });
    return out;
  };

  // Phosphor "arrows-down-up" icon — BDS Sort. Active state is blue, inactive muted.
  // When active and descending, flip vertically so the up-arrow cues descending.
  const SortArrows = ({ state }: { state: 'asc' | 'desc' | 'none' }) => {
    const color = state === 'none' ? 'var(--g400)' : 'var(--bt-blue)';
    return (
      <svg
        aria-hidden
        width="9"
        height="9"
        viewBox="0 0 22 22"
        fill="none"
        style={{ display: 'block', flexShrink: 0, transform: state === 'desc' ? 'scaleY(-1)' : undefined }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.99327 0.883379C5.93551 0.38604 5.51284 0 5 0C4.44772 0 4 0.447715 4 1V18.585L1.70711 16.2929L1.6129 16.2097C1.22061 15.9047 0.653377 15.9324 0.292893 16.2929C-0.0976311 16.6834 -0.0976311 17.3166 0.292893 17.7071L4.29289 21.7071L4.3871 21.7903L4.47929 21.854L4.57678 21.9063L4.68786 21.9503L4.79927 21.9798L4.92476 21.9972L5 22L5.11747 21.9932L5.26599 21.9642L5.37134 21.9288L5.48406 21.8753L5.59531 21.8037C5.63433 21.7747 5.67171 21.7425 5.70711 21.7071L9.70711 17.7071L9.7903 17.6129C10.0953 17.2206 10.0676 16.6534 9.70711 16.2929L9.6129 16.2097C9.22061 15.9047 8.65338 15.9324 8.29289 16.2929L6 18.585V1L5.99327 0.883379ZM16.8804 0.00708792L16.8515 0.0110178L16.734 0.0358451L16.6287 0.0712255L16.5159 0.124671L16.4047 0.196335C16.3657 0.225313 16.3283 0.257499 16.2929 0.292893L12.2929 4.29289L12.2097 4.3871C11.9047 4.77939 11.9324 5.34662 12.2929 5.70711L12.3871 5.7903C12.7794 6.09532 13.3466 6.06759 13.7071 5.70711L16 3.415V21L16.0067 21.1166C16.0645 21.614 16.4872 22 17 22C17.5523 22 18 21.5523 18 21V3.415L20.2929 5.70711L20.3871 5.7903C20.7794 6.09532 21.3466 6.06759 21.7071 5.70711C22.0976 5.31658 22.0976 4.68342 21.7071 4.29289L17.7071 0.292893L17.6255 0.219696L17.5207 0.145995L17.4232 0.0936734L17.3121 0.0497381L17.2007 0.0202401L17.0752 0.00279536L17 7.5e-06L16.8804 0.00708792Z"
          fill={color}
        />
      </svg>
    );
  };

  const sortableHeader = (gridId: string, column: SortColumn, label: string, className: string) => {
    const s = getSort(gridId);
    const state: 'asc' | 'desc' | 'none' = s.column !== column ? 'none' : s.direction;
    return (
      <div className={`${className} jps-col-sortable`} onClick={() => toggleSort(gridId, column)} role="button" tabIndex={0}>
        {label}
        <SortArrows state={state} />
      </div>
    );
  };

  // Print-page equivalent — returns a <th> so it drops into the existing table markup.
  const printSortableHeader = (gridId: string, column: SortColumn, label: string, thClass: string = '') => {
    const s = getSort(gridId);
    const state: 'asc' | 'desc' | 'none' = s.column !== column ? 'none' : s.direction;
    return (
      <th className={`${thClass} jps-print-th-sortable`} onClick={() => toggleSort(gridId, column)}>
        <span className="jps-print-th-sortable-inner">{label}<SortArrows state={state} /></span>
      </th>
    );
  };

  const toggleGroup = (name: string) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

  // Combined standalone selections grid — single rendering used across all slices.
  // Merges "— price update" rows into their base (e.g., the toilet scenario) and shows
  // Title / Date / Original price / Revised price / Contract impact + a column-total row.
  const renderCombinedSelectionsGrid = (items: SelectionItem[]) => {
    if (items.length === 0) return null;
    const updateByBase = new Map<string, SelectionItem>();
    for (const s of items) {
      if (s.name.endsWith(' — price update')) {
        updateByBase.set(s.name.replace(' — price update', ''), s);
      }
    }
    const mergedRows = items
      .filter(s => !s.name.endsWith(' — price update'))
      .map(s => {
        const update = updateByBase.get(s.name);
        if (update) {
          return {
            ...s,
            originalPrice: s.price,
            revisedPrice: s.price + update.price,
            contractImpact: update.impact,
            date: update.date || s.date,
          };
        }
        const isPostContract = s.timing === 'post-contract';
        return {
          ...s,
          originalPrice: isPostContract ? 0 : s.price,
          revisedPrice: s.price,
          contractImpact: s.impact,
        };
      });
    const approvedRows = mergedRows.filter(r => r.status === 'approved');
    const pendingRows = mergedRows.filter(r => r.status === 'pending');
    const orderedRows = [...approvedRows, ...pendingRows];
    const totalOriginal = mergedRows.reduce((sum, r) => sum + withTax(r.originalPrice), 0);
    const totalRevised = mergedRows.reduce((sum, r) => sum + withTax(r.revisedPrice), 0);
    const totalImpact = mergedRows.reduce((sum, r) => sum + withTax(r.contractImpact), 0);
    return (
      <div className="jps-table">
        <div className="jps-table-header jps-table-sel-standalone">
          <div className="jps-col-title">Title</div>
          <div className="jps-col-date">Date</div>
          <div className="jps-col-price-orig">Initial price</div>
          <div className="jps-col-price-revised">Approved price</div>
          <div className="jps-col-impact">Contract impact</div>
        </div>
        {orderedRows.map((item, i) => (
          <div key={i} className={`jps-table-row jps-table-sel-standalone${item.status === 'pending' ? ' jps-row-pending' : ''}`}>
            <div className="jps-col-title">
              <div>
                <span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span>
                {item.status === 'pending' && <BdsBadge text="Pending" displayType="warning" />}
              </div>
            </div>
            <div className="jps-col-date">{item.date || '—'}</div>
            <div className="jps-col-price-orig">
              {item.originalPrice > 0
                ? fmt(withTax(item.originalPrice))
                : <span className="jps-impact-neutral">—</span>}
            </div>
            <div className="jps-col-price-revised">{fmt(withTax(item.revisedPrice))}</div>
            <div className="jps-col-impact">
              {item.contractImpact !== 0
                ? <span className="jps-impact-up">{fmtSigned(withTax(item.contractImpact))}</span>
                : <span className="jps-impact-neutral">—</span>}
            </div>
          </div>
        ))}
        <div className="jps-table-row jps-table-sel-standalone jps-row-total">
          <div className="jps-col-title">Total</div>
          <div className="jps-col-date"></div>
          <div className="jps-col-price-orig">{fmt(totalOriginal)}</div>
          <div className="jps-col-price-revised">{fmt(totalRevised)}</div>
          <div className="jps-col-impact">
            {totalImpact > 0
              ? <span className="jps-impact-up">{fmtSigned(totalImpact)}</span>
              : <span className="jps-impact-neutral">—</span>}
          </div>
        </div>
      </div>
    );
  };

  // Keys the "expand/collapse all" button controls — allowances, selections, pending pills, and Slice 4 bills
  const allExpandKeys = [
    ...allowanceNames,
    ...allowanceNames.map(n => `__pending-${n}__`),
    '__pending-co__', '__s3-pending-co__',
    '__s1-pre-contract__', '__s1-post-contract__',
    '__pre-contract__', '__post-contract__',
    '__s3-pre-contract__', '__s3-post-contract__',
    ...costCodes.map(c => `s4-bill-${c.name}`),
  ];
  const anyExpanded = allExpandKeys.some(k => expandedGroups[k]);
  const toggleAll = () => {
    const next = !anyExpanded;
    setExpandedGroups(prev => {
      const updated = { ...prev };
      allExpandKeys.forEach(k => { updated[k] = next; });
      return updated;
    });
  };

  const remainingBalance = revisedClientPrice - paymentsReceived - creditMemos;
  const paidPct = (paymentsReceived / revisedClientPrice * 100);
  const creditPct = (creditMemos / revisedClientPrice * 100);

  // ── Print preview ──────────────────────────────────────────────
  if (showPrint) {
    // Standalone approved selections — split by timing to mirror the JPS Selections section exactly.
    const approvedPostContract = allSelections.filter(s => s.status === 'approved' && !s.allowanceName && s.timing === 'post-contract');
    const approvedPreContract = allSelections.filter(s => s.status === 'approved' && !s.allowanceName && s.timing === 'pre-contract');
    const approvedChangeOrders = changeOrders.filter(c => c.status === 'approved');
    const approvedChangeOrdersTotal = approvedChangeOrders.reduce((s, c) => s + c.price, 0);

    // Slice 2 + 3 include pending items; Slice 3 also surfaces per-item location inside allowances.
    // Slice 1 + Openbook (slice4) intentionally show approved changes only — Openbook's framing is the
    // client-facing price adjustment breakdown, where pending items would muddy the "what changed" story.
    const includePending = activeSlice === 'slice2' || activeSlice === 'slice3';
    const pendingSelections = includePending ? allSelections.filter(s => s.status === 'pending' && !s.allowanceName) : [];
    const pendingAllowanceItems = includePending ? allSelections.filter(s => s.status === 'pending' && s.allowanceName) : [];
    const pendingCOs = includePending ? changeOrders.filter(c => c.status === 'pending') : [];
    const pendingSelectionsSum = pendingSelections.reduce((s, i) => s + i.price, 0);
    const pendingAllowanceSum = pendingAllowanceItems.reduce((s, i) => s + i.price, 0);
    const pendingCOsTotal = pendingCOs.reduce((s, c) => s + c.price, 0);
    const pendingTotal = pendingSelectionsSum + pendingAllowanceSum + pendingCOsTotal;
    const showLocations = activeSlice === 'slice3';

    return (
      <div className="jps-page bds-scope jps-print-wrap">
        {/* Controls — not printed */}
        <div className="jps-print-controls">
          <div className="jps-print-controls-title">Display on printout</div>
          <label className="jps-print-checkbox">
            <input type="checkbox" checked={printOptions.changeOrders} onChange={e => setPrintOptions({ ...printOptions, changeOrders: e.target.checked })} />
            Show change orders
          </label>
          <label className="jps-print-checkbox">
            <input type="checkbox" checked={printOptions.payments} onChange={e => setPrintOptions({ ...printOptions, payments: e.target.checked })} />
            Show payments
          </label>
          <label className="jps-print-checkbox">
            <input type="checkbox" checked={printOptions.expandAllowances} onChange={e => setPrintOptions({ ...printOptions, expandAllowances: e.target.checked })} />
            Expand allowances with selections
          </label>
          <div className="jps-print-controls-actions">
            <BdsButton text="Cancel" displayType="secondary" onClick={() => setShowPrint(false)} />
            <BdsButton text="Print" displayType="primary" onClick={() => window.print()} />
          </div>
        </div>

        {/* Paper preview — what actually prints */}
        <div className="jps-print-paper">
          {/* Header: logo/name on left, company address on right */}
          <div className="jps-print-header">
            <div className="jps-print-logo">
              <div className="jps-print-logo-mark">B</div>
              <div>
                <div className="jps-print-logo-name">ABC Builders LLC</div>
                <div className="jps-print-logo-tag">Custom Homebuilders</div>
              </div>
            </div>
            <div className="jps-print-company">
              ABC Builders LLC<br />
              1234 Construction Ave<br />
              Omaha, NE 68102<br />
              Email: billing@abcbuilders.com<br />
              Phone: (402) 555-0180
            </div>
          </div>

          {/* Title + client/summary row */}
          <h2 className="jps-print-title">Job price summary</h2>
          <div className="jps-print-summary-row">
            <div className="jps-print-client">
              Johnson Residence<br />
              5678 Maple Street<br />
              Omaha, NE 68114
            </div>
            <div className="jps-print-summary-values">
              <div><span>Approved price:</span><strong>{fmt(revisedClientPrice + (activeSlice === 'slice4' || activeSlice === 'slice5' ? billVarianceTotal : 0))}</strong></div>
              <div><span>Amount paid:</span><strong>{fmt(paymentsReceived)}</strong></div>
              <div><span>Remaining to pay:</span><strong>{fmt(remainingBalance + (activeSlice === 'slice4' || activeSlice === 'slice5' ? billVarianceTotal : 0))}</strong></div>
            </div>
          </div>

          {/* Allowances table — shown first, matches JPS view order. Print always shows expanded (nested items). */}
          {allowanceGroups.length > 0 && (() => {
            // Build print rows with derived spent/remaining, plus a representative date (most recent approved item) so the table can sort on any column.
            const printAllowanceRows = allowanceGroups.map(g => {
              const spent = g.items.filter(it => it.status === 'approved').reduce((s, it) => s + it.price, 0);
              const latestTs = g.items.length
                ? Math.max(0, ...g.items.map(it => dateToTs(it.date)))
                : 0;
              return { group: g, spent, remaining: g.budget - spent, latestTs };
            });
            const gridId = 'print-allowances';
            const alSort = getSort(gridId);
            const sortedAllowances = [...printAllowanceRows].sort((a, b) => {
              const sign = alSort.direction === 'asc' ? 1 : -1;
              if (alSort.column === 'title') return sign * a.group.name.localeCompare(b.group.name);
              if (alSort.column === 'budget') return sign * (a.group.budget - b.group.budget);
              if (alSort.column === 'spent') return sign * (a.spent - b.spent);
              if (alSort.column === 'remaining') return sign * (a.remaining - b.remaining);
              if (alSort.column === 'date') {
                // Allowances with no items (no date) always fall to the bottom regardless of asc/desc.
                if (a.latestTs === 0 && b.latestTs !== 0) return 1;
                if (b.latestTs === 0 && a.latestTs !== 0) return -1;
                return sign * (a.latestTs - b.latestTs);
              }
              return 0;
            });
            return (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Allowances</h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    {printSortableHeader(gridId, 'title', 'Title')}
                    {printSortableHeader(gridId, 'date', 'Date', 'jps-print-th-date')}
                    {printSortableHeader(gridId, 'budget', 'Allowance', 'jps-print-th-right')}
                    {printSortableHeader(gridId, 'spent', 'Price', 'jps-print-th-right')}
                    {printSortableHeader(gridId, 'remaining', 'Remaining', 'jps-print-th-right')}
                  </tr>
                </thead>
                <tbody>
                  {sortedAllowances.map(({ group: g, spent, remaining }, i) => {
                    const nestedItems = includePending ? g.items : g.items.filter(it => it.status === 'approved');
                    const showNested = printOptions.expandAllowances;
                    return (
                      <Fragment key={i}>
                        <tr className="jps-print-allowance-row jps-print-allowance-row-expanded">
                          <td><strong>{g.name}</strong></td>
                          <td></td>
                          <td className="jps-print-td-right"><strong>{fmt(g.budget)}</strong></td>
                          <td className="jps-print-td-right"><strong>{fmt(spent)}</strong></td>
                          <td className="jps-print-td-right"><strong>{fmt(remaining)}</strong></td>
                        </tr>
                        {showNested && nestedItems.map((it, j) => (
                          <tr key={`${i}-${j}`} className="jps-print-nested-row">
                            <td className="jps-print-nested-cell">
                              <span className="jps-print-nested-name">{it.name}</span>
                              {it.status === 'pending' && <span className="jps-print-nested-status"> · Pending</span>}
                            </td>
                            <td className="jps-print-td-date">{it.date || '—'}</td>
                            <td></td>
                            <td className="jps-print-td-right">{fmt(it.price)}</td>
                            <td></td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </section>
            );
          })()}

          {/* Selections — combined approved (pre + post) using same merged row logic as the main page */}
          {(() => {
            const approvedAll = [...approvedPreContract, ...approvedPostContract];
            if (approvedAll.length === 0) return null;
            const updateByBase = new Map<string, SelectionItem>();
            for (const s of approvedAll) {
              if (s.name.endsWith(' — price update')) {
                updateByBase.set(s.name.replace(' — price update', ''), s);
              }
            }
            const rows = approvedAll
              .filter(s => !s.name.endsWith(' — price update'))
              .map(s => {
                const update = updateByBase.get(s.name);
                if (update) {
                  return {
                    name: s.name,
                    date: update.date || s.date,
                    originalPrice: s.price,
                    revisedPrice: s.price + update.price,
                    contractImpact: update.impact,
                  };
                }
                const isPost = s.timing === 'post-contract';
                return {
                  name: s.name,
                  date: s.date,
                  originalPrice: isPost ? 0 : s.price,
                  revisedPrice: s.price,
                  contractImpact: s.impact,
                };
              });
            const totalOriginal = rows.reduce((sum, r) => sum + withTax(r.originalPrice), 0);
            const totalRevised = rows.reduce((sum, r) => sum + withTax(r.revisedPrice), 0);
            const totalImpact = rows.reduce((sum, r) => sum + withTax(r.contractImpact), 0);
            return (
              <section className="jps-print-section">
                <h3 className="jps-print-section-title">Selections</h3>
                <table className="jps-print-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="jps-print-th-date">Date</th>
                      <th className="jps-print-th-right">Initial price</th>
                      <th className="jps-print-th-right">Approved price</th>
                      <th className="jps-print-th-right">Contract impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td className="jps-print-td-date">{r.date || '—'}</td>
                        <td className="jps-print-td-right">{r.originalPrice === 0 ? '—' : fmt(withTax(r.originalPrice))}</td>
                        <td className="jps-print-td-right">{fmt(withTax(r.revisedPrice))}</td>
                        <td className="jps-print-td-right">{r.contractImpact === 0 ? fmt(0) : fmtSigned(withTax(r.contractImpact))}</td>
                      </tr>
                    ))}
                    <tr className="jps-print-total-row">
                      <td colSpan={2}><strong>Total</strong></td>
                      <td className="jps-print-td-right"><strong>{fmt(totalOriginal)}</strong></td>
                      <td className="jps-print-td-right"><strong>{fmt(totalRevised)}</strong></td>
                      <td className="jps-print-td-right"><strong>{fmtSigned(totalImpact)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </section>
            );
          })()}

          {/* Pending selections — Slice 2 + 3 only */}
          {includePending && (pendingSelections.length > 0 || pendingAllowanceItems.length > 0) && (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Pending selections <span className="jps-print-section-hint">(awaiting approval)</span></h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    {printSortableHeader('print-pending-sel', 'title', 'Selection title')}
                    {showLocations && <th>Location</th>}
                    {printSortableHeader('print-pending-sel', 'price', 'Price', 'jps-print-th-right')}
                  </tr>
                </thead>
                <tbody>
                  {sortItems('print-pending-sel', [...pendingAllowanceItems, ...pendingSelections]).map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      {showLocations && <td>{s.location || '—'}</td>}
                      <td className="jps-print-td-right">{fmt(s.price)}</td>
                    </tr>
                  ))}
                  <tr className="jps-print-total-row">
                    <td colSpan={showLocations ? 2 : 1}><strong>Total if all approved</strong></td>
                    <td className="jps-print-td-right"><strong>{fmt(pendingSelectionsSum + pendingAllowanceSum)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Change orders table */}
          {printOptions.changeOrders && approvedChangeOrders.length > 0 && (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Change orders</h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    {printSortableHeader('print-co-approved', 'title', 'Title')}
                    {printSortableHeader('print-co-approved', 'date', 'Date', 'jps-print-th-date')}
                    {printSortableHeader('print-co-approved', 'price', 'Amount', 'jps-print-th-right')}
                  </tr>
                </thead>
                <tbody>
                  {sortItems('print-co-approved', approvedChangeOrders).map((co, i) => (
                    <tr key={i}>
                      <td>{co.name}</td>
                      <td className="jps-print-td-date">{co.date || '—'}</td>
                      <td className="jps-print-td-right">{fmt(co.price)}</td>
                    </tr>
                  ))}
                  <tr className="jps-print-total-row">
                    <td colSpan={2}><strong>Total</strong></td>
                    <td className="jps-print-td-right"><strong>{fmt(approvedChangeOrdersTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Pending change orders — Slice 2 + 3 only */}
          {printOptions.changeOrders && includePending && pendingCOs.length > 0 && (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Pending change orders <span className="jps-print-section-hint">(awaiting approval)</span></h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    {printSortableHeader('print-co-pending', 'title', 'Title')}
                    {printSortableHeader('print-co-pending', 'date', 'Date', 'jps-print-th-date')}
                    {printSortableHeader('print-co-pending', 'price', 'Amount', 'jps-print-th-right')}
                  </tr>
                </thead>
                <tbody>
                  {sortItems('print-co-pending', pendingCOs).map((co, i) => (
                    <tr key={i}>
                      <td>{co.name}</td>
                      <td className="jps-print-td-date">{co.date || '—'}</td>
                      <td className="jps-print-td-right">{fmt(co.price)}</td>
                    </tr>
                  ))}
                  <tr className="jps-print-total-row">
                    <td colSpan={2}><strong>Total if all approved</strong></td>
                    <td className="jps-print-td-right"><strong>{fmt(pendingCOsTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Budget difference — openbook (slice4/slice5) only */}
          {(activeSlice === 'slice4' || activeSlice === 'slice5') && (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Budget difference</h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    <th>Cost category</th>
                    <th className="jps-print-th-right">Budget difference</th>
                  </tr>
                </thead>
                <tbody>
                  {panelByCategory.map((group, i) => (
                    <tr key={i}>
                      <td>{group.category}</td>
                      <td className="jps-print-td-right">{fmtSigned(group.variance)}</td>
                    </tr>
                  ))}
                  <tr className="jps-print-total-row">
                    <td><strong>Total</strong></td>
                    <td className="jps-print-td-right"><strong>{fmtSigned(panelVarianceTotal)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Payments table */}
          {printOptions.payments && payments.length > 0 && (
            <section className="jps-print-section">
              <h3 className="jps-print-section-title">Payments</h3>
              <table className="jps-print-table">
                <thead>
                  <tr>
                    {printSortableHeader('print-payments', 'title', 'Title')}
                    {printSortableHeader('print-payments', 'date', 'Date', 'jps-print-th-date')}
                    <th>Payment type</th>
                    {printSortableHeader('print-payments', 'price', 'Amount', 'jps-print-th-right')}
                  </tr>
                </thead>
                <tbody>
                  {sortItems('print-payments', payments.map(p => ({ ...p, price: p.amount }))).map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="jps-print-td-date">{p.date}</td>
                      <td>{p.method}</td>
                      <td className="jps-print-td-right">{fmt(p.amount)}</td>
                    </tr>
                  ))}
                  <tr className="jps-print-total-row">
                    <td colSpan={3}><strong>Total</strong></td>
                    <td className="jps-print-td-right"><strong>{fmt(paymentsReceived + creditMemos)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          {/* Totals block — bottom right. Openbook slice rolls bill contributions into the math. */}
          {(() => {
            const isOpenbook = activeSlice === 'slice4' || activeSlice === 'slice5';
            const billsContrib = isOpenbook ? billVarianceTotal : 0;
            const approvedChangesPrint = changeOrdersTotal + approvedSelectionsTotal + billsContrib;
            const revisedPricePrint = revisedClientPrice + billsContrib;
            const remainingPrint = revisedPricePrint - paymentsReceived - creditMemos;
            return (
          <div className="jps-print-totals">
            <div className="jps-print-totals-group">
              <div className="jps-print-totals-line jps-print-totals-heading"><span>Approved price total</span><strong>{fmt(revisedPricePrint)}</strong></div>
              <div className="jps-print-totals-line jps-print-totals-nested"><span>Initial price total</span><span>{fmt(originalContractPrice)}</span></div>
              <div className="jps-print-totals-line jps-print-totals-nested"><span>Approved changes</span><span>{fmt(approvedChangesPrint)}</span></div>
              <div className="jps-print-totals-line jps-print-totals-nested-2"><span>Selection and allowance changes</span><span>{fmt(approvedSelectionsTotal)}</span></div>
              <div className="jps-print-totals-line jps-print-totals-nested-2"><span>Change orders</span><span>{fmt(changeOrdersTotal)}</span></div>
              {isOpenbook && (
                <div className="jps-print-totals-line jps-print-totals-nested-2"><span>Budget difference</span><span>{fmt(billVarianceTotal)}</span></div>
              )}
              <div className="jps-print-totals-line jps-print-totals-nested"><span>Tax</span><span>{fmt(totalTax)}</span></div>
            </div>
            <div className="jps-print-totals-group">
              <div className="jps-print-totals-line jps-print-totals-heading"><span>Total amount paid</span><strong>{fmt(paymentsReceived + creditMemos)}</strong></div>
              <div className="jps-print-totals-line jps-print-totals-nested"><span>Payments received</span><span>{fmt(paymentsReceived)}</span></div>
              <div className="jps-print-totals-line jps-print-totals-nested"><span>Credit memos</span><span>{fmt(creditMemos)}</span></div>
            </div>
            <div className="jps-print-totals-group">
              <div className="jps-print-totals-line jps-print-totals-heading"><span>Remaining to pay</span><strong>{fmt(remainingPrint)}</strong></div>
            </div>

            {/* Pending footer — Slice 2 + 3 only */}
            {includePending && pendingTotal > 0 && (
              <div className="jps-print-totals-group jps-print-totals-pending">
                <div className="jps-print-totals-line jps-print-totals-heading"><span>If all pending approved</span><strong>+{fmt(pendingTotal)}</strong></div>
                {pendingSelectionsSum + pendingAllowanceSum > 0 && (
                  <div className="jps-print-totals-line jps-print-totals-nested"><span>Pending selections</span><span>+{fmt(pendingSelectionsSum + pendingAllowanceSum)}</span></div>
                )}
                {pendingCOsTotal > 0 && (
                  <div className="jps-print-totals-line jps-print-totals-nested"><span>Pending change orders</span><span>+{fmt(pendingCOsTotal)}</span></div>
                )}
              </div>
            )}
          </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="jps-page bds-scope">
      {/* Page header */}
      <div className="pg-hdr">
        <div className="pg-accent"></div>
        <div className="pg-hdr-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {onBack && (
              <BdsButton displayType="secondary" onClick={onBack} ariaLabel="Back" icon={<BdsIcon name="chevron-left" size={16} />} />
            )}
            {!jobOpen && onToggleJob && (
              <BdsButton displayType="secondary" onClick={onToggleJob} ariaLabel="Toggle job menu" text={<span style={{ fontSize: 16, lineHeight: 1 }}>&#9776;</span>} />
            )}
            <div>
              <div className="pg-hdr-sub">Johnson Residence — Full Remodel</div>
              <div className="pg-title">Job Price Summary</div>
            </div>
          </div>
          <div className="pg-hdr-right">
            {activeSlice === 'slice5' && slice4Version === 'v41notes' ? (
              <BdsButton
                text={notesDirty || !notesSavedAt ? 'Save' : 'Saved'}
                displayType={notesDirty || !notesSavedAt ? 'primary' : 'secondary'}
                onClick={saveNotes}
              />
            ) : (
              <BdsButton text="Send" displayType="secondary" icon={<BdsIcon name="send" size={14} />} />
            )}
            <BdsButton text="Print" displayType="primary" onClick={() => setShowPrint(true)} />
          </div>
        </div>
      </div>

      <div className="jps-body">

        {/* ═══ Slice switcher + expand/collapse all ═══ */}
        <div className="jps-slice-tabs">
          <BdsTabs
            ariaLabel="Slice view"
            activeKey={activeSlice}
            onChange={(k) => {
              const next = k as 'slice1' | 'slice2' | 'slice3' | 'slice4' | 'slice5';
              setActiveSlice(next);
              if (next === 'slice5') setSlice4Version('v41');
            }}
            tabs={[
              { key: 'slice1', label: 'Fixed price' },
              { key: 'slice5', label: 'Openbook' },
            ]}
          />
        </div>

        {/* ═══ SLICE 1 — simplified view: revised price + balance due, allowances grouped by allowance, no pending data ═══ */}
        {activeSlice === 'slice1' && (
          <>
            <div className="jps-panes-row">
              {/* Card 1: Total price */}
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedClientPrice)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <span>Approved changes</span>
                    <span>{fmt(changeOrdersTotal + approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                    <span>{fmt(changeOrdersTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                    <span>{fmt(approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line">
                    <span>Tax</span>
                    <span>{fmt(totalTax)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Balance due */}
              <div className="jps-pane">
                <div className="jps-pane-label">Remaining balance due</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(remainingBalance)}</div>

                <div className="jps-progress-bar" style={{ marginTop: 16 }}>
                  <div className="jps-progress-filled" style={{ width: `${paidPct}%` }}></div>
                  <div className="jps-progress-credit" style={{ width: `${creditPct}%` }}></div>
                </div>

                <div className="jps-pane-breakdown">
                  <div className="jps-breakdown-line">
                    <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#4dabff' }}></span>Payments received</span>
                    <span>−{fmt(paymentsReceived)}</span>
                  </div>
                  <div className="jps-breakdown-line">
                    <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#002F77', borderRadius: 2 }}></span>Credit memos</span>
                    <span>−{fmt(creditMemos)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allowances — approved only, grouped by allowance, no pending */}
            <div className="jps-breakdown-section" id="jps-sec-allowances">
              <div className="jps-section-header">
                <BdsText as="h2" size="heavy-lg" className="jps-section-title">Allowances</BdsText>
              <BdsButton
                displayType="secondary"
                onClick={toggleAll}
                icon={<BdsIcon name={anyExpanded ? 'chevron-up' : 'chevron-down'} size={14} />}
                text={anyExpanded ? 'Collapse all' : 'Expand all'}
              />
              </div>

              {sortedAllowanceGroups.map((group, gi, arr) => {
                const approvedItems = group.items.filter(i => i.status === 'approved');
                const isOpen = expandedGroups[group.name];
                const hasItems = approvedItems.length > 0;
                const showInProgressHeader = !group.complete && gi === 0;
                const showCompletedHeader = group.complete && (gi === 0 || !arr[gi - 1].complete);
                return (
                  <Fragment key={group.name}>
                  {showInProgressHeader && <div className="jps-allowance-divider">In progress</div>}
                  {showCompletedHeader && <div className="jps-allowance-divider">Completed</div>}
                  <div className="jps-cat-group">
                    <button
                      className={`jps-cat-header ${isOpen ? 'jps-cat-header-open' : ''} ${hasItems ? '' : 'jps-cat-header-static'}`}
                      onClick={hasItems ? () => toggleGroup(group.name) : undefined}
                      disabled={!hasItems}
                    >
                      <div className="jps-cat-header-left">
                        {hasItems && <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} />}
                        <span className="jps-cat-name">{group.name}</span>
                      </div>
                      <div className="jps-cat-header-right">
                        {(() => {
                          const approvedUsed = approvedItems.reduce((s, i) => s + i.price, 0);
                          const over = approvedUsed > group.budget;
                          return (
                            <span className="jps-allowance-flow">
                              <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(withTax(group.budget))}</strong></span>
                              <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(withTax(approvedUsed))}</strong></span>
                              <span className="jps-flow-sep">·</span>
                              <span className={over ? 'jps-flow-over' : 'jps-flow-remaining'}>
                                {group.complete
                                  ? <><span>Contract impact</span><strong>{fmtSigned(approvedUsed === 0 ? 0 : withTax(approvedUsed - group.budget))}</strong></>
                                  : <><span>Difference</span><strong>{approvedUsed === 0 ? '—' : fmt(withTax(group.budget - approvedUsed))}</strong></>
                                }
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </button>

                    {isOpen && hasItems && (() => {
                      const approvedTotal = approvedItems.reduce((s, i) => s + i.price, 0);
                      const gridClass = 'jps-table-allowance-dated-no-impact';
                      const gridId = `s1-al-${group.name}`;
                      const displayItems = sortItems(gridId, approvedItems);
                      return (
                      <div className="jps-cat-body">
                        <div className="jps-table">
                          <div className={`jps-table-header ${gridClass}`}>
                            {sortableHeader(gridId, 'title', 'Title', 'jps-col-title')}
                            {sortableHeader(gridId, 'date', 'Date', 'jps-col-date')}
                            {sortableHeader(gridId, 'price', 'Price (incl. tax)', 'jps-col-price')}
                          </div>

                          {displayItems.map((item, i) => (
                            <div key={i} className={`jps-table-row ${gridClass}`}>
                              <div className="jps-col-title">
                                <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                              </div>
                              <div className="jps-col-date">{item.date || '—'}</div>
                              <div className="jps-col-price">{fmt(withTax(item.price))}</div>
                            </div>
                          ))}

                          <div className={`jps-table-row ${gridClass} jps-row-allowance-summary`}>
                            <div className="jps-col-title">
                              <span className="jps-item-name">Total</span>
                            </div>
                            <div className="jps-col-date"></div>
                            <div className="jps-col-price">{fmt(withTax(approvedTotal))}</div>
                          </div>
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                  </Fragment>
                );
              })}
            </div>

            {/* Slice 1: Selections section — approved standalone selections via combined grid */}
            {(() => {
              const preApproved = preContractSelections.filter(s => s.status === 'approved');
              const postApproved = postContractSelections.filter(s => s.status === 'approved');
              if (preApproved.length === 0 && postApproved.length === 0) return null;
              return (
                <div className="jps-breakdown-section">
                  <div className="jps-section-header">
                    <BdsText as="h2" size="heavy-lg" className="jps-section-title">Selections</BdsText>
                  </div>
                  {renderCombinedSelectionsGrid([...preApproved, ...postApproved])}
                </div>
              );
            })()}

            {/* Slice 1: Change Orders — approved only */}
            {(() => {
              const coApproved = changeOrders.filter(c => c.status === 'approved');
              if (coApproved.length === 0) return null;
              return (
                <div className="jps-breakdown-section" id="jps-sec-change-orders">
                  <div className="jps-section-header">
                    <BdsText as="h2" size="heavy-lg" className="jps-section-title">Change Orders</BdsText>
                  </div>
                  <div className="jps-table">
                    <div className="jps-table-header jps-table-co">
                      <div className="jps-col-title">Title</div>
                      <div className="jps-col-date">Approved date</div>
                      <div className="jps-col-impact">Contract impact</div>
                    </div>
                    {coApproved.map((co, i) => (
                      <div key={i} className="jps-table-row jps-table-co">
                        <div className="jps-col-title">
                          <div>
                            <span className="jps-item-name">{co.name}</span>
                          </div>
                        </div>
                        <div className="jps-col-date">{co.date || '—'}</div>
                        <div className="jps-col-impact">
                          <span className={co.price > 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(co.price)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="jps-table-row jps-table-co jps-row-total">
                      <div className="jps-col-title">Total</div>
                      <div className="jps-col-date"></div>
                      <div className="jps-col-impact">{fmtSigned(coApproved.reduce((s, c) => s + c.price, 0))}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Slice 1: Payments */}
            <div className="jps-breakdown-section">
              <div className="jps-section-header">
                <BdsText as="h2" size="heavy-lg" className="jps-section-title">Payments</BdsText>
              </div>
              <div className="jps-table">
                <div className="jps-table-header jps-table-payments">
                  <div className="jps-col-title">Title</div>
                  <div className="jps-col-date">Date</div>
                  <div className="jps-col-method">Payment type</div>
                  <div className="jps-col-amount">Amount</div>
                </div>
                {payments.map((p, i) => (
                  <div key={i} className="jps-table-row jps-table-payments">
                    <div className="jps-col-title"><span className="jps-item-name">{p.name}</span></div>
                    <div className="jps-col-date">{p.date}</div>
                    <div className="jps-col-method">{p.method}</div>
                    <div className="jps-col-amount">{fmt(p.amount)}</div>
                  </div>
                ))}
                <div className="jps-table-row jps-table-payments jps-row-total">
                  <div className="jps-col-title">Total</div>
                  <div className="jps-col-date"></div>
                  <div className="jps-col-method"></div>
                  <div className="jps-col-amount">{fmt(paymentsReceived + creditMemos)}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ SLICE 3 — Slice 2 layout but allowance items sub-grouped by location (key for multi-room allowances like Lighting) ═══ */}
        {activeSlice === 'slice3' && (
          <>
            {/* Summary cards — same 3-card row as Slice 2 */}
            <div className="jps-panes-row">
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedClientPrice)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <span>Approved changes</span>
                    <span>{fmt(changeOrdersTotal + approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                    <span>{fmt(changeOrdersTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                    <span>{fmt(approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line">
                    <span>Tax</span>
                    <span>{fmt(totalTax)}</span>
                  </div>
                </div>
              </div>

              <div className="jps-pane">
                <div className="jps-pane-label">Remaining balance due</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(remainingBalance)}</div>
                <div className="jps-progress-bar" style={{ marginTop: 16 }}>
                  <div className="jps-progress-filled" style={{ width: `${paidPct}%` }}></div>
                  <div className="jps-progress-credit" style={{ width: `${creditPct}%` }}></div>
                </div>
                <div className="jps-pane-breakdown">
                  <div className="jps-breakdown-line">
                    <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#4dabff' }}></span>Payments received</span>
                    <span>−{fmt(paymentsReceived)}</span>
                  </div>
                  <div className="jps-breakdown-line">
                    <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#002F77', borderRadius: 2 }}></span>Credit memos</span>
                    <span>−{fmt(creditMemos)}</span>
                  </div>
                </div>
              </div>

              <div className="jps-pane jps-pane-discussed">
                <div className="jps-pane-label">Awaiting approval</div>
                <div className="jps-pane-big">{fmtSigned(forecastedAdditional)}</div>
                <div className="jps-pane-big-sub">Potential additional cost</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Pending selections</span>
                    <span>{fmtSigned(pendingSelectionsAmt)}</span>
                  </div>
                  <div className="jps-breakdown-line">
                    <span>Pending change orders</span>
                    <span>{fmtSigned(pendingChangeOrders)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allowances — items sub-grouped by location when allowance spans multiple */}
            <div className="jps-breakdown-section" id="jps-sec-allowances">
              <div className="jps-section-header">
                <BdsText as="h2" size="heavy-lg" className="jps-section-title">Allowances</BdsText>
              <BdsButton
                displayType="secondary"
                onClick={toggleAll}
                icon={<BdsIcon name={anyExpanded ? 'chevron-up' : 'chevron-down'} size={14} />}
                text={anyExpanded ? 'Collapse all' : 'Expand all'}
              />
              </div>

              {sortedAllowanceGroups.map((group, gi, arr) => {
                const approvedItems = group.items.filter(i => i.status === 'approved');
                const pendingItems = group.items.filter(i => i.status === 'pending');
                const isOpen = expandedGroups[group.name];
                const hasItems = group.items.length > 0;
                const showInProgressHeader = !group.complete && gi === 0;
                const showCompletedHeader = group.complete && (gi === 0 || !arr[gi - 1].complete);

                // Determine if this allowance spans multiple locations; if so, sub-group items.
                const allLocations = new Set(group.items.map(i => i.location || group.location));
                const spansLocations = allLocations.size > 1;
                const approvedByLocation = approvedItems.reduce((acc, item) => {
                  const loc = item.location || group.location;
                  if (!acc[loc]) acc[loc] = [];
                  acc[loc].push(item);
                  return acc;
                }, {} as Record<string, typeof approvedItems>);

                return (
                  <Fragment key={group.name}>
                  {showInProgressHeader && <div className="jps-allowance-divider">In progress</div>}
                  {showCompletedHeader && <div className="jps-allowance-divider">Completed</div>}
                  <div className="jps-cat-group">
                    <button
                      className={`jps-cat-header ${isOpen ? 'jps-cat-header-open' : ''} ${hasItems ? '' : 'jps-cat-header-static'}`}
                      onClick={hasItems ? () => toggleGroup(group.name) : undefined}
                      disabled={!hasItems}
                    >
                      <div className="jps-cat-header-left">
                        {hasItems && <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} />}
                        <span className="jps-cat-name">{group.name}</span>
                        {group.fromCO && <span className="jps-cat-from-co">From CO: {group.fromCO}</span>}
                      </div>
                      <div className="jps-cat-header-right">
                        {(() => {
                          const approvedUsed = approvedItems.reduce((s, i) => s + i.price, 0);
                          const over = approvedUsed > group.budget;
                          return (
                            <span className="jps-allowance-flow">
                              <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(group.budget)}</strong></span>
                              <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(approvedUsed)}</strong></span>
                              <span className="jps-flow-sep">·</span>
                              <span className={over ? 'jps-flow-over' : 'jps-flow-remaining'}>
                                {group.complete
                                  ? <><span>Contract impact</span><strong>{fmtSigned(approvedUsed === 0 ? 0 : approvedUsed - group.budget)}</strong></>
                                  : <><span>Difference</span><strong>{approvedUsed === 0 ? '—' : fmt(group.budget - approvedUsed)}</strong></>
                                }
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </button>

                    {isOpen && hasItems && (() => {
                      const approvedTotal = approvedItems.reduce((s, i) => s + i.price, 0);
                      const gridClass = 'jps-table-allowance-dated-no-impact';
                      const gridId = `s3-al-${group.name}`;
                      const gridSort = getSort(gridId);
                      const sortedFlat = sortItems(gridId, approvedItems);
                      return (
                      <div className="jps-cat-body">
                        <div className="jps-table">
                          <div className={`jps-table-header ${gridClass}`}>
                            {sortableHeader(gridId, 'title', 'Title', 'jps-col-title')}
                            {sortableHeader(gridId, 'date', 'Date', 'jps-col-date')}
                            {sortableHeader(gridId, 'price', 'Price', 'jps-col-price')}
                          </div>

                          {/* Approved items — grouped by location if allowance spans multiple AND user hasn't re-sorted away from default */}
                          {spansLocations && gridSort.column === 'date' && gridSort.direction === 'asc' ? (
                            Object.entries(approvedByLocation).map(([loc, items]) => (
                              <Fragment key={loc}>
                                <div className={`jps-table-row ${gridClass} jps-row-subgroup`}>
                                  <div className="jps-col-title"><span className="jps-subgroup-label">{loc}</span></div>
                                  <div className="jps-col-date"></div>
                                  <div className="jps-col-price"></div>
                                </div>
                                {items.map((item, i) => (
                                  <div key={i} className={`jps-table-row ${gridClass}`}>
                                    <div className="jps-col-title">
                                      <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                                    </div>
                                    <div className="jps-col-date">{item.date || '—'}</div>
                                    <div className="jps-col-price">{fmt(item.price)}</div>
                                  </div>
                                ))}
                              </Fragment>
                            ))
                          ) : (
                            sortedFlat.map((item, i) => (
                              <div key={i} className={`jps-table-row ${gridClass}`}>
                                <div className="jps-col-title">
                                  <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                                </div>
                                <div className="jps-col-date">{item.date || '—'}</div>
                                <div className="jps-col-price">{fmt(item.price)}</div>
                              </div>
                            ))
                          )}

                          <div className={`jps-table-row ${gridClass} jps-row-allowance-summary`}>
                            <div className="jps-col-title"><span className="jps-item-name">Total</span></div>
                            <div className="jps-col-date"></div>
                            <div className="jps-col-price">{fmt(approvedTotal)}</div>
                          </div>
                        </div>

                        {/* Pending pill — location shown inline when allowance spans multiple rooms */}
                        {pendingItems.length > 0 && (() => {
                          const approvedTotal = approvedItems.reduce((s, it) => s + it.price, 0);
                          const pendingProjected = pendingItems.reduce((sum, it, idx) => {
                            const usedBefore = approvedTotal + pendingItems.slice(0, idx).reduce((a, b) => a + b.price, 0);
                            const remainingBefore = group.budget - usedBefore;
                            return sum + (remainingBefore <= 0 ? it.price : remainingBefore < it.price ? it.price - remainingBefore : 0);
                          }, 0);
                          const pendingKey = `__pending-${group.name}__`;
                          const pendingOpen = !!expandedGroups[pendingKey];
                          return (
                            <div className="jps-pending-block">
                              <button type="button" className="jps-pending-link" onClick={() => toggleGroup(pendingKey)}>
                                <BdsIcon name={pendingOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                                <span>{pendingItems.length} pending {pendingItems.length === 1 ? 'item' : 'items'}</span>
                                {pendingProjected > 0 && <span className="jps-pending-link-amt">(+{fmt(pendingProjected)} if approved)</span>}
                              </button>
                              {pendingOpen && (
                                <ul className="jps-pending-list">
                                  {pendingItems.map((item, i) => (
                                    <li key={`p-${i}`}>
                                      <span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>
                                        {item.name}{spansLocations && item.location ? <span className="jps-pending-list-loc"> · {item.location}</span> : null}
                                      </span>
                                      <span className="jps-pending-list-price">{fmt(item.price)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      );
                    })()}
                  </div>
                  </Fragment>
                );
              })}
            </div>

            {/* Selections section — combined grid */}
            {(preContractSelections.length > 0 || postContractSelections.length > 0) && (
              <div className="jps-breakdown-section">
                <div className="jps-section-header">
                  <BdsText as="h2" size="heavy-lg" className="jps-section-title">Selections</BdsText>
                </div>
                {renderCombinedSelectionsGrid([
                  ...preContractSelections,
                  ...postContractSelections.filter(s => s.status === 'approved'),
                ])}
              </div>
            )}

            {/* Change Orders — approved only; pending as pill below */}
            {(() => {
              const coApproved = changeOrders.filter(c => c.status === 'approved');
              const coPending = changeOrders.filter(c => c.status === 'pending');
              return (
                <div className="jps-breakdown-section" id="jps-sec-change-orders">
                  <div className="jps-section-header">
                    <BdsText as="h2" size="heavy-lg" className="jps-section-title">Change Orders</BdsText>
                  </div>
                  <div className="jps-table">
                    <div className="jps-table-header jps-table-co">
                      <div className="jps-col-title">Title</div>
                      <div className="jps-col-date">Approved date</div>
                      <div className="jps-col-impact">Contract impact</div>
                    </div>
                    {coApproved.map((co, i) => (
                      <div key={i} className="jps-table-row jps-table-co">
                        <div className="jps-col-title">
                          <div>
                            <span className="jps-item-name">{co.name}</span>
                            {co.includesAllowance && (() => {
                              const summary = coAllowanceSummaries.get(co.name);
                              const remaining = summary ? summary.remaining : co.includesAllowance.budget;
                              const isOver = remaining < 0;
                              return (
                                <span className="jps-item-parent">
                                  Includes {fmt(co.includesAllowance.budget)} {co.includesAllowance.name} allowance
                                  {summary && (
                                    isOver
                                      ? <span style={{ color: 'var(--bt-midnight)', fontWeight: 600 }}> · +{fmt(Math.abs(remaining))} remaining</span>
                                      : <span style={{ color: 'var(--g500)', fontWeight: 500 }}> · {fmt(remaining)} remaining</span>
                                  )}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="jps-col-date">{co.date || '—'}</div>
                        <div className="jps-col-impact">
                          <span className={co.price > 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(co.price)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="jps-table-row jps-table-co jps-row-total">
                      <div className="jps-col-title">Total</div>
                      <div className="jps-col-date"></div>
                      <div className="jps-col-impact">{fmtSigned(coApproved.reduce((s, c) => s + c.price, 0))}</div>
                    </div>
                  </div>

                  {coPending.length > 0 && (() => {
                    const pendingProjected = coPending.reduce((s, c) => s + c.price, 0);
                    const coPendingKey = '__s3-pending-co__';
                    const coPendingOpen = !!expandedGroups[coPendingKey];
                    return (
                      <div className="jps-pending-block">
                        <button type="button" className="jps-pending-link" onClick={() => toggleGroup(coPendingKey)}>
                          <BdsIcon name={coPendingOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                          <span>{coPending.length} pending {coPending.length === 1 ? 'item' : 'items'}</span>
                          {pendingProjected > 0 && <span className="jps-pending-link-amt">(+{fmt(pendingProjected)} if approved)</span>}
                        </button>
                        {coPendingOpen && (
                          <ul className="jps-pending-list">
                            {coPending.map((co, i) => (
                              <li key={`p-${i}`}>
                                <span className="jps-item-name">{co.name}</span>
                                <span className="jps-pending-list-price">{fmt(co.price)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Payments */}
            <div className="jps-breakdown-section">
              <div className="jps-section-header">
                <BdsText as="h2" size="heavy-lg" className="jps-section-title">Payments</BdsText>
              </div>
              <div className="jps-table">
                <div className="jps-table-header jps-table-payments">
                  <div className="jps-col-title">Title</div>
                  <div className="jps-col-date">Date</div>
                  <div className="jps-col-method">Payment type</div>
                  <div className="jps-col-amount">Amount</div>
                </div>
                {payments.map((p, i) => (
                  <div key={i} className="jps-table-row jps-table-payments">
                    <div className="jps-col-title"><span className="jps-item-name">{p.name}</span></div>
                    <div className="jps-col-date">{p.date}</div>
                    <div className="jps-col-method">{p.method}</div>
                    <div className="jps-col-amount">{fmt(p.amount)}</div>
                  </div>
                ))}
                <div className="jps-table-row jps-table-payments jps-row-total">
                  <div className="jps-col-title">Total</div>
                  <div className="jps-col-date"></div>
                  <div className="jps-col-method"></div>
                  <div className="jps-col-amount">{fmt(paymentsReceived + creditMemos)}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ SLICE 2 — current full view (three cards + work by location + COs + payments) ═══ */}
        {activeSlice === 'slice2' && <>

        {/* ═══ Three summary cards ═══ */}
        <div className="jps-panes-row">
          {/* Card 1: Total price — original layout */}
          <div className="jps-pane">
            <div className="jps-pane-label">Total price</div>
            <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedClientPrice)}</div>
            <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
              <div className="jps-breakdown-line">
                <span>Original client price</span>
                <span>{fmt(originalContractPrice)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-parent">
                <span>Approved changes</span>
                <span>{fmt(changeOrdersTotal + approvedSelectionsTotal)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-nested">
                <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                <span>{fmt(changeOrdersTotal)}</span>
              </div>
              <div className="jps-breakdown-line jps-breakdown-nested">
                <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                <span>{fmt(approvedSelectionsTotal)}</span>
              </div>
              <div className="jps-breakdown-line">
                <span>Tax</span>
                <span>{fmt(totalTax)}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Balance due + payment progress */}
          <div className="jps-pane">
            <div className="jps-pane-label">Remaining balance due</div>
            <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(remainingBalance)}</div>

            <div className="jps-progress-bar" style={{ marginTop: 16 }}>
              <div className="jps-progress-filled" style={{ width: `${paidPct}%` }}></div>
              <div className="jps-progress-credit" style={{ width: `${creditPct}%` }}></div>
            </div>

            <div className="jps-pane-breakdown">
              <div className="jps-breakdown-line">
                <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#4dabff' }}></span>Payments received</span>
                <span>−{fmt(paymentsReceived)}</span>
              </div>
              <div className="jps-breakdown-line">
                <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#002F77', borderRadius: 2 }}></span>Credit memos</span>
                <span>−{fmt(creditMemos)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Still being discussed — pending + in-flux items */}
          <div className="jps-pane jps-pane-discussed">
            <div className="jps-pane-label">Awaiting approval</div>
            <div className="jps-pane-big">{fmtSigned(forecastedAdditional)}</div>
            <div className="jps-pane-big-sub">Potential additional cost</div>

            <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
              <div className="jps-breakdown-line">
                <span>Pending selections</span>
                <span>{fmtSigned(pendingSelectionsAmt)}</span>
              </div>
              <div className="jps-breakdown-line">
                <span>Pending change orders</span>
                <span>{fmtSigned(pendingChangeOrders)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Allowances ═══ */}
        <div className="jps-breakdown-section" id="jps-sec-allowances">
          <div className="jps-section-header">
            <BdsText as="h2" size="heavy-lg" className="jps-section-title">Allowances</BdsText>
              <BdsButton
                displayType="secondary"
                onClick={toggleAll}
                icon={<BdsIcon name={anyExpanded ? 'chevron-up' : 'chevron-down'} size={14} />}
                text={anyExpanded ? 'Collapse all' : 'Expand all'}
              />
          </div>

          {sortedAllowanceGroups.map((group, gi, arr) => {
            const approvedItems = group.items.filter(i => i.status === 'approved');
            const pendingItems = group.items.filter(i => i.status === 'pending');

            const isOpen = expandedGroups[group.name];

            const hasItems = group.items.length > 0;
            const showInProgressHeader = !group.complete && gi === 0;
            const showCompletedHeader = group.complete && (gi === 0 || !arr[gi - 1].complete);
            const isLastInProgress = !group.complete && (gi === arr.length - 1 || arr[gi + 1].complete);
            const isLastCompleted = group.complete && gi === arr.length - 1;
            return (
              <Fragment key={group.name}>
              {showInProgressHeader && <div className="jps-allowance-divider">In progress</div>}
                  {showCompletedHeader && <div className="jps-allowance-divider">Completed</div>}
              <div className="jps-cat-group">
                <button
                  className={`jps-cat-header ${isOpen ? 'jps-cat-header-open' : ''} ${hasItems ? '' : 'jps-cat-header-static'}`}
                  onClick={hasItems ? () => toggleGroup(group.name) : undefined}
                  disabled={!hasItems}
                >
                  <div className="jps-cat-header-left">
                    {hasItems && <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} />}
                    <span className="jps-cat-name">{group.name}</span>
                  </div>
                  <div className="jps-cat-header-right">
                    {(() => {
                      const approvedUsed = approvedItems.reduce((s, i) => s + i.price, 0);
                      const over = approvedUsed > group.budget;
                      return (
                        <span className="jps-allowance-flow">
                          <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(group.budget)}</strong></span>
                          <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(approvedUsed)}</strong></span>
                          <span className="jps-flow-sep">·</span>
                          <span className={over ? 'jps-flow-over' : 'jps-flow-remaining'}>
                            {group.complete
                                  ? <><span>Contract impact</span><strong>{fmtSigned(approvedUsed === 0 ? 0 : approvedUsed - group.budget)}</strong></>
                                  : <><span>Difference</span><strong>{approvedUsed === 0 ? '—' : fmt(group.budget - approvedUsed)}</strong></>
                                }
                          </span>
                        </span>
                      );
                    })()}
                  </div>
                </button>

                {isOpen && group.items.length > 0 && (() => {
                  const approvedTotal = approvedItems.reduce((s, i) => s + i.price, 0);
                  const gridClass = 'jps-table-allowance-dated-no-impact';
                  const gridId = `s2-al-${group.name}`;
                  const displayItems = sortItems(gridId, approvedItems);
                  return (
                  <div className="jps-cat-body">
                    <div className="jps-table">
                      <div className={`jps-table-header ${gridClass}`}>
                        {sortableHeader(gridId, 'title', 'Title', 'jps-col-title')}
                        {sortableHeader(gridId, 'date', 'Date', 'jps-col-date')}
                        {sortableHeader(gridId, 'price', 'Price', 'jps-col-price')}
                      </div>

                      {/* Approved rows */}
                      {displayItems.map((item, i) => (
                        <div key={i} className={`jps-table-row ${gridClass}`}>
                          <div className="jps-col-title">
                            <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                          </div>
                          <div className="jps-col-date">{item.date || '—'}</div>
                          <div className="jps-col-price">{fmt(item.price)}</div>
                        </div>
                      ))}

                      {/* Selections total — approved-only subtotal. Sits above pending so it's unambiguously "what's locked in". */}
                      <div className={`jps-table-row ${gridClass} jps-row-allowance-summary`}>
                        <div className="jps-col-title">
                          <span className="jps-item-name">Total</span>
                        </div>
                        <div className="jps-col-date"></div>
                        <div className="jps-col-price">{fmt(approvedTotal)}</div>
                      </div>

                    </div>

                    {/* Pending summary — compact link below the table. Click to expand the list. */}
                    {pendingItems.length > 0 && (() => {
                      const approvedTotal = approvedItems.reduce((s, it) => s + it.price, 0);
                      const pendingProjected = pendingItems.reduce((sum, it, idx) => {
                        const usedBefore = approvedTotal + pendingItems.slice(0, idx).reduce((a, b) => a + b.price, 0);
                        const remainingBefore = group.budget - usedBefore;
                        return sum + (remainingBefore <= 0 ? it.price : remainingBefore < it.price ? it.price - remainingBefore : 0);
                      }, 0);
                      const pendingKey = `__pending-${group.name}__`;
                      const pendingOpen = !!expandedGroups[pendingKey];
                      return (
                        <div className="jps-pending-block">
                          <button type="button" className="jps-pending-link" onClick={() => toggleGroup(pendingKey)}>
                            <BdsIcon name={pendingOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                            <span>{pendingItems.length} pending {pendingItems.length === 1 ? 'item' : 'items'}</span>
                            {pendingProjected > 0 && <span className="jps-pending-link-amt">(+{fmt(pendingProjected)} if approved)</span>}
                          </button>

                          {pendingOpen && (
                            <ul className="jps-pending-list">
                              {pendingItems.map((item, i) => (
                                <li key={`p-${i}`}>
                                  <span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span>
                                  <span className="jps-pending-list-price">{fmt(item.price)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  );
                })()}
              </div>
              {isLastInProgress && (
                <div className="jps-cat-group jps-allowance-subtotal-row">
                  <div className="jps-cat-header jps-cat-header-static jps-cat-header-subtotal">
                    <div className="jps-cat-header-left">
                      <span className="jps-cat-name">Subtotal</span>
                    </div>
                    <div className="jps-cat-header-right">
                      <span className="jps-allowance-flow">
                        <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(inProgressAllowanceTotals.budget)}</strong></span>
                        <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(inProgressAllowanceTotals.approved)}</strong></span>
                        <span className="jps-flow-sep">·</span>
                        <span className="jps-flow-remaining"><span>Difference</span><strong>{fmt(inProgressAllowanceTotals.difference)}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {isLastCompleted && (
                <div className="jps-cat-group jps-allowance-subtotal-row">
                  <div className="jps-cat-header jps-cat-header-static jps-cat-header-subtotal">
                    <div className="jps-cat-header-left">
                      <span className="jps-cat-name">Subtotal</span>
                    </div>
                    <div className="jps-cat-header-right">
                      <span className="jps-allowance-flow">
                        <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(completedAllowanceTotals.budget)}</strong></span>
                        <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(completedAllowanceTotals.approved)}</strong></span>
                        <span className="jps-flow-sep">·</span>
                        <span className="jps-flow-remaining"><span>Contract impact</span><strong>{fmtSigned(completedAllowanceTotals.contractImpact)}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              </Fragment>
            );
          })}

        </div>

        {/* ═══ Selections — combined grid ═══ */}
        {(preContractSelections.length > 0 || postContractSelections.length > 0) && (
          <div className="jps-breakdown-section">
            <div className="jps-section-header">
              <BdsText as="h2" size="heavy-lg" className="jps-section-title">Selections</BdsText>
            </div>
            {renderCombinedSelectionsGrid([
              ...preContractSelections,
              ...postContractSelections,
            ])}
          </div>
        )}

        {/* ═══ Change Orders ═══ */}
        <div className="jps-breakdown-section" id="jps-sec-change-orders">
          <div className="jps-section-header">
            <BdsText as="h2" size="heavy-lg" className="jps-section-title">Change Orders</BdsText>
          </div>
          <div className="jps-cat-group">
          {(() => {
            const coApproved = changeOrders.filter(c => c.status === 'approved');
            const coPending = changeOrders.filter(c => c.status === 'pending');
            const coDeclined = changeOrders.filter(c => c.status === 'declined');
            const renderCoRow = (co: ChangeOrder, key: string | number, withBadge = true) => (
              <div key={key} className={`jps-table-row jps-table-co ${co.status === 'pending' ? 'jps-row-pending' : co.status === 'declined' ? 'jps-row-declined' : ''}`}>
                <div className="jps-col-title">
                  <div>
                    <span className="jps-item-name">{co.name}</span>
                  </div>
                  {withBadge && co.status === 'pending' && <BdsBadge text="Pending" displayType="warning" />}
                  {withBadge && co.status === 'declined' && <BdsBadge text="Declined" displayType="default" />}
                </div>
                <div className="jps-col-date">{co.date || '—'}</div>
                <div className="jps-col-impact">
                  <span className={co.price > 0 ? 'jps-impact-up' : 'jps-impact-down'}>
                    {fmtSigned(co.price)}
                  </span>
                </div>
              </div>
            );
            return (
              <>
                <div className="jps-table">
                  <div className="jps-table-header jps-table-co">
                    <div className="jps-col-title">Title</div>
                    <div className="jps-col-date">Approved date</div>
                    <div className="jps-col-impact">Contract impact</div>
                  </div>

                  {coApproved.map((co, i) => renderCoRow(co, i))}
                  {coDeclined.map((co, i) => renderCoRow(co, `d-${i}`))}

                  <div className="jps-table-row jps-table-co jps-row-total">
                    <div className="jps-col-title">Total</div>
                    <div className="jps-col-date"></div>
                    <div className="jps-col-impact">{fmtSigned(coApproved.reduce((s, c) => s + c.price, 0))}</div>
                  </div>
                </div>

                {/* Pending COs — compact link below the table */}
                {coPending.length > 0 && (() => {
                  const pendingProjected = coPending.reduce((s, c) => s + c.price, 0);
                  const coPendingKey = '__pending-co__';
                  const coPendingOpen = !!expandedGroups[coPendingKey];
                  return (
                    <div className="jps-pending-block">
                      <button type="button" className="jps-pending-link" onClick={() => toggleGroup(coPendingKey)}>
                        <BdsIcon name={coPendingOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                        <span>{coPending.length} pending {coPending.length === 1 ? 'item' : 'items'}</span>
                        {pendingProjected > 0 && <span className="jps-pending-link-amt">(+{fmt(pendingProjected)} if approved)</span>}
                      </button>

                      {coPendingOpen && (
                        <ul className="jps-pending-list">
                          {coPending.map((co, i) => (
                            <li key={`p-${i}`}>
                              <span className="jps-item-name">{co.name}</span>
                              <span className="jps-pending-list-price">{fmt(co.price)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}
              </>
            );
          })()}
          </div>
        </div>

        {/* ═══ Payments ═══ */}
        <div className="jps-breakdown-section">
          <div className="jps-section-header">
            <BdsText as="h2" size="heavy-lg" className="jps-section-title">Payments</BdsText>
          </div>
          <div className="jps-table">
            <div className="jps-table-header jps-table-payments">
              <div className="jps-col-title">Title</div>
              <div className="jps-col-date">Date</div>
              <div className="jps-col-method">Payment type</div>
              <div className="jps-col-amount">Amount</div>
            </div>
            {payments.map((p, i) => (
              <div key={i} className="jps-table-row jps-table-payments">
                <div className="jps-col-title"><span className="jps-item-name">{p.name}</span></div>
                <div className="jps-col-date">{p.date}</div>
                <div className="jps-col-method">{p.method}</div>
                <div className="jps-col-amount">{fmt(p.amount)}</div>
              </div>
            ))}
            <div className="jps-table-row jps-table-payments jps-row-total">
              <div className="jps-col-title">Total payments + credits</div>
              <div className="jps-col-date"></div>
              <div className="jps-col-method"></div>
              <div className="jps-col-amount">{fmt(paymentsReceived + creditMemos)}</div>
            </div>
          </div>
        </div>

        </>}
        {/* end SLICE 2 */}

        {/* ═══ SLICE 4 — sandbox for Kendall's open book client financials brief (page 7003570340).
              Each version (v1–v4) wraps the full Slice 1 JPS layout; only the Total-price card varies
              so the price-adjustment treatment can be evaluated in big-picture context. ═══ */}
        {(activeSlice === 'slice4' || activeSlice === 'slice5') && (() => {
          const approvedCOs = changeOrders.filter(c => c.status === 'approved');
          const approvedPostSelections = postContractSelections.filter(s => s.status === 'approved' && s.impact !== 0);
          const allowanceVariances = allowanceGroups
            .map(g => {
              const approvedTotal = g.items.filter(i => i.status === 'approved').reduce((s, i) => s + i.price, 0);
              return { name: g.name, budget: g.budget, spent: approvedTotal, variance: approvedTotal - g.budget };
            })
            .filter(g => g.variance !== 0);
          const coVarianceSum = approvedCOs.reduce((s, c) => s + c.price, 0);
          const selVarianceSum = approvedPostSelections.reduce((s, c) => s + c.impact, 0);
          const allowanceVarianceSum = allowanceVariances.reduce((s, g) => s + g.variance, 0);
          // Slice 4 includes bill variances in the rolled-up adjustment (per Kendall's brief — bills/line items
          // are an assumed contributor pending the spike). Other slices keep the legacy adjustment.
          const priceAdjustment = changeOrdersTotal + approvedSelectionsTotal + billVarianceTotal;
          const revisedPriceS4 = originalContractPrice + priceAdjustment + totalTax;



          // ── Total price card varies by version ──
          let totalPriceCard;
          if (slice4Version === 'v1') {
            // Inline expandable: "Approved changes" parent row is clickable to reveal the nested rows.
            totalPriceCard = (
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedPriceS4)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <button
                    type="button"
                    className={`jps-breakdown-line jps-breakdown-parent jps-breakdown-toggle ${expandedGroups['__s4-v1-adj__'] ? 'jps-breakdown-toggle-open' : ''}`}
                    onClick={() => toggleGroup('__s4-v1-adj__')}
                  >
                    <span className="jps-breakdown-toggle-label">
                      Approved changes
                      <BdsIcon name={expandedGroups['__s4-v1-adj__'] ? 'chevron-up' : 'chevron-down'} size={10} />
                    </span>
                    <span>{fmt(priceAdjustment)}</span>
                  </button>
                  {expandedGroups['__s4-v1-adj__'] && (
                    <>
                      <div className="jps-breakdown-line jps-breakdown-nested">
                        <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                        <span>{fmt(changeOrdersTotal)}</span>
                      </div>
                      <div className="jps-breakdown-line jps-breakdown-nested">
                        <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                        <span>{fmt(approvedSelectionsTotal)}</span>
                      </div>
                      <div className="jps-breakdown-line jps-breakdown-nested">
                        <span>Bills</span>
                        <span className={billVarianceTotal >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmt(billVarianceTotal)}</span>
                      </div>
                    </>
                  )}
                  <div className="jps-breakdown-line"><span>Tax</span><span>{fmt(totalTax)}</span></div>
                </div>
              </div>
            );
          } else if (slice4Version === 'v3') {
            // Drill-through: rollup only — "Approved changes" label is a hyperlink that opens a modal with the breakdown.
            totalPriceCard = (
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedPriceS4)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <button type="button" className="jps-s4-link-label" onClick={() => setSlice4DrillOpen(true)}>Approved changes</button>
                    <span>{fmt(priceAdjustment)}</span>
                  </div>
                  <div className="jps-breakdown-line"><span>Tax</span><span>{fmt(totalTax)}</span></div>
                </div>
              </div>
            );
          } else if (slice4Version === 'v4' || slice4Version === 'v41' || slice4Version === 'v41notes' || slice4Version === 'v411' || slice4Version === 'v45') {
            // v4 / v4.1 / v4.5: v2-style always-on breakdown with a clickable Budget difference
            // row that opens a side panel. v4 = Cost code drill with bills, v4.1 = category totals,
            // v4.1.1 = category totals expandable to bill/PO/time-clock activity,
            // v4.5 = drill grouped by Estimate (location).
            totalPriceCard = (
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedPriceS4)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <span>Approved changes</span>
                    <span>{fmt(priceAdjustment)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                    <span>{fmt(approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                    <span>{fmt(changeOrdersTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-budget-difference')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Budget difference</button>
                    <span className={panelVarianceTotal >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmt(panelVarianceTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line"><span>Tax</span><span>{fmt(totalTax)}</span></div>
                </div>
              </div>
            );
          } else if (slice4Version === 'v5') {
            // v5: one-row collapse. Cost trajectory rolls up Projected − Revised − Builder
            // Variance + Markup into a single client-facing number. Math is correct under
            // the hood; UI stays at v2's density. Breakdown can move to a tooltip later.
            const cv = costSideDelta + markupOnDelta;
            const isOver = cv > 0;
            const trajLabel = 'Budget difference';
            const priceAdjustmentV5 = changeOrdersTotal + approvedSelectionsTotal + cv;
            const revisedPriceV5 = originalContractPrice + priceAdjustmentV5 + totalTax;

            totalPriceCard = (
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedPriceV5)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <span>Approved changes</span>
                    <span>{fmt(priceAdjustmentV5)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change orders</button>
                    <span>{fmt(changeOrdersTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selections and allowances</button>
                    <span>{fmt(approvedSelectionsTotal)}</span>
                  </div>
                  {cv !== 0 && (
                    <div className="jps-breakdown-line jps-breakdown-nested">
                      <button type="button" className="jps-s4-link-label" onClick={() => setSlice4DrillOpen(true)}>{trajLabel}</button>
                      <span className={isOver ? 'jps-impact-up' : 'jps-impact-down'}>{fmt(cv)}</span>
                    </div>
                  )}
                  <div className="jps-breakdown-line"><span>Tax</span><span>{fmt(totalTax)}</span></div>
                </div>
              </div>
            );
          } else {
            // v2: full always-on breakdown including bill variances.
            totalPriceCard = (
              <div className="jps-pane">
                <div className="jps-pane-label">Total price</div>
                <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(revisedPriceS4)}</div>
                <div className="jps-pane-breakdown" style={{ marginTop: 16 }}>
                  <div className="jps-breakdown-line">
                    <span>Original client price</span>
                    <span>{fmt(originalContractPrice)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-parent">
                    <span>Approved changes</span>
                    <span>{fmt(priceAdjustment)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-change-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Change Orders</button>
                    <span>{fmt(changeOrdersTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <button type="button" className="jps-s4-scroll-link" onClick={() => document.getElementById('jps-sec-allowances')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Selection and allowance changes</button>
                    <span>{fmt(approvedSelectionsTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line jps-breakdown-nested">
                    <span>Bills</span>
                    <span className={billVarianceTotal >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmt(billVarianceTotal)}</span>
                  </div>
                  <div className="jps-breakdown-line"><span>Tax</span><span>{fmt(totalTax)}</span></div>
                </div>
              </div>
            );
          }

          // ── Balance due card (Slice 4 uses revisedPriceS4 so progress math stays consistent with bills included) ──
          const remainingBalanceS4 = revisedPriceS4 - paymentsReceived - creditMemos;
          const paidPctS4 = (paymentsReceived / revisedPriceS4) * 100;
          const creditPctS4 = (creditMemos / revisedPriceS4) * 100;
          const balanceDueCard = (
            <div className="jps-pane">
              <div className="jps-pane-label">Remaining balance due</div>
              <div className="jps-pane-big" style={{ marginTop: 4 }}>{fmt(remainingBalanceS4)}</div>
              <div className="jps-progress-bar" style={{ marginTop: 16 }}>
                <div className="jps-progress-filled" style={{ width: `${paidPctS4}%` }}></div>
                <div className="jps-progress-credit" style={{ width: `${creditPctS4}%` }}></div>
              </div>
              <div className="jps-pane-breakdown">
                <div className="jps-breakdown-line">
                  <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#4dabff' }}></span>Payments received</span>
                  <span>−{fmt(paymentsReceived)}</span>
                </div>
                <div className="jps-breakdown-line">
                  <span className="jps-legend-inline"><span className="jps-legend-dot" style={{ background: '#002F77', borderRadius: 2 }}></span>Credit memos</span>
                  <span>−{fmt(creditMemos)}</span>
                </div>
              </div>
            </div>
          );

          return (
            <>
              <div className="jps-slice-tabs" style={{ marginBottom: 16 }}>
                <BdsTabs
                  ariaLabel="Direction"
                  activeKey={slice4Version}
                  onChange={(k) => setSlice4Version(k as 'v1' | 'v2' | 'v3' | 'v4' | 'v41' | 'v41notes' | 'v411' | 'v45')}
                  tabs={activeSlice === 'slice5' ? [
                    { key: 'v41', label: 'v4 · Cost category' },
                    { key: 'v41notes', label: 'v4.1 · Notes' },
                    { key: 'v411', label: 'v4.2 · Largest cost' },
                    { key: 'v45', label: 'v4.3 · Drill down (estimate)' },
                  ] : [
                    { key: 'v1', label: 'v1 · Inline expandable' },
                    { key: 'v2', label: 'v2 · Always-on list' },
                    { key: 'v3', label: 'v3 · Drill-through' },
                  ]}
                />
              </div>

              {/* ─── Two summary cards ─── */}
              <div className="jps-panes-row">
                {totalPriceCard}
                {balanceDueCard}
              </div>

              {/* ─── Approved-changes group wrapper (always flat after v4 was removed) ─── */}
              <div className="jps-s4-approved-group jps-s4-approved-group-flat">

              {/* ─── Allowances ─── */}
              <div className="jps-breakdown-section" id="jps-sec-allowances">
                <div className="jps-section-header">
                  <BdsText as="h2" size="heavy-lg" className="jps-section-title">Allowances</BdsText>
                  <BdsButton
                    displayType="secondary"
                    onClick={toggleAll}
                    icon={<BdsIcon name={anyExpanded ? 'chevron-up' : 'chevron-down'} size={14} />}
                    text={anyExpanded ? 'Collapse all' : 'Expand all'}
                  />
                </div>

                {sortedAllowanceGroups.map((group, gi, arr) => {
                  const approvedItems = group.items.filter(i => i.status === 'approved');
                  const groupKey = `s4-${group.name}`;
                  const isOpen = expandedGroups[groupKey];
                  const hasItems = approvedItems.length > 0;
                  const expandable = hasItems;
                  const showInProgressHeader = !group.complete && gi === 0;
                const showCompletedHeader = group.complete && (gi === 0 || !arr[gi - 1].complete);
                  return (
                    <Fragment key={group.name}>
                    {showInProgressHeader && <div className="jps-allowance-divider">In progress</div>}
                  {showCompletedHeader && <div className="jps-allowance-divider">Completed</div>}
                    <div className="jps-cat-group">
                      <button
                        className={`jps-cat-header ${isOpen && expandable ? 'jps-cat-header-open' : ''} ${expandable ? '' : 'jps-cat-header-static'}`}
                        onClick={expandable ? () => toggleGroup(groupKey) : undefined}
                        disabled={!expandable}
                      >
                        <div className="jps-cat-header-left">
                          {expandable && <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} />}
                          <span className="jps-cat-name">{group.name}</span>
                        </div>
                        <div className="jps-cat-header-right">
                          {(() => {
                            const approvedUsed = approvedItems.reduce((s, i) => s + i.price, 0);
                            const over = approvedUsed > group.budget;
                            return (
                              <span className="jps-allowance-flow">
                                <span className="jps-flow-part"><span>Allowance</span><strong>{fmt(withTax(group.budget))}</strong></span>
                                <span className="jps-flow-part"><span>Approved price</span><strong>{fmt(withTax(approvedUsed))}</strong></span>
                                <span className="jps-flow-sep">·</span>
                                <span className={over ? 'jps-flow-over' : 'jps-flow-remaining'}>
                                  {group.complete
                                  ? <><span>Contract impact</span><strong>{fmtSigned(approvedUsed === 0 ? 0 : withTax(approvedUsed - group.budget))}</strong></>
                                  : <><span>Difference</span><strong>{approvedUsed === 0 ? '—' : fmt(withTax(group.budget - approvedUsed))}</strong></>
                                }
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      </button>

                      {isOpen && expandable && (() => {
                        const approvedTotal = approvedItems.reduce((s, i) => s + i.price, 0);
                        const gridClass = 'jps-table-allowance-dated-no-impact';
                        const gridId = `s4-al-${group.name}`;
                        const displayItems = sortItems(gridId, approvedItems);
                        return (
                          <div className="jps-cat-body">
                            <div className="jps-table">
                              <div className={`jps-table-header ${gridClass}`}>
                                {sortableHeader(gridId, 'title', 'Title', 'jps-col-title')}
                                {sortableHeader(gridId, 'date', 'Date', 'jps-col-date')}
                                {sortableHeader(gridId, 'price', 'Price (incl. tax)', 'jps-col-price')}
                              </div>
                              {displayItems.map((item, i) => (
                                <div key={i} className={`jps-table-row ${gridClass}`}>
                                  <div className="jps-col-title">
                                    <div><span className="jps-item-name" onClick={() => onOpenSelection?.({ name: item.name, category: item.category, price: item.price, allowanceName: item.allowanceName, status: item.status })}>{item.name}</span></div>
                                  </div>
                                  <div className="jps-col-date">{item.date || '—'}</div>
                                  <div className="jps-col-price">{fmt(withTax(item.price))}</div>
                                </div>
                              ))}
                              <div className={`jps-table-row ${gridClass} jps-row-allowance-summary`}>
                                <div className="jps-col-title"><span className="jps-item-name">Total</span></div>
                                <div className="jps-col-date"></div>
                                <div className="jps-col-price">{fmt(withTax(approvedTotal))}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    </Fragment>
                  );
                })}
              </div>

              {/* ─── Selections — combined grid ─── */}
              {(() => {
                const preApproved = preContractSelections.filter(s => s.status === 'approved');
                const postApproved = postContractSelections.filter(s => s.status === 'approved');
                if (preApproved.length === 0 && postApproved.length === 0) return null;
                return (
                  <div className="jps-breakdown-section" id="jps-sec-selections">
                    <div className="jps-section-header">
                      <BdsText as="h2" size="heavy-lg" className="jps-section-title">Selections</BdsText>
                    </div>
                    {renderCombinedSelectionsGrid([...preApproved, ...postApproved])}
                  </div>
                );
              })()}

              {/* ─── Change Orders ─── */}
              {(() => {
                const coApproved = changeOrders.filter(c => c.status === 'approved');
                if (coApproved.length === 0) return null;
                return (
                  <div className="jps-breakdown-section" id="jps-sec-change-orders">
                    <div className="jps-section-header">
                      <BdsText as="h2" size="heavy-lg" className="jps-section-title">Change Orders</BdsText>
                    </div>
                    <div className="jps-table">
                      <div className="jps-table-header jps-table-co">
                        <div className="jps-col-title">Title</div>
                        <div className="jps-col-date">Approved date</div>
                        <div className="jps-col-impact">Contract impact</div>
                      </div>
                      {coApproved.map((co, i) => (
                        <div key={i} className="jps-table-row jps-table-co">
                          <div className="jps-col-title"><div><span className="jps-item-name">{co.name}</span></div></div>
                          <div className="jps-col-date">{co.date || '—'}</div>
                          <div className="jps-col-impact">
                            <span className={co.price > 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(co.price)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="jps-table-row jps-table-co jps-row-total">
                        <div className="jps-col-title">Total</div>
                        <div className="jps-col-date"></div>
                        <div className="jps-col-impact">{fmtSigned(coApproved.reduce((s, c) => s + c.price, 0))}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>
              {/* ─── End approved-changes group wrapper ─── */}

              {/* ─── Budget difference (v4/v41/v41notes/v411/v45) — table layout matching Change Orders ─── */}
              {(slice4Version === 'v4' || slice4Version === 'v41' || slice4Version === 'v41notes' || slice4Version === 'v411' || slice4Version === 'v45') && (
                <div className="jps-breakdown-section" id="jps-sec-budget-difference">
                  <div className="jps-section-header">
                    <BdsText as="h2" size="heavy-lg" className="jps-section-title">Budget difference</BdsText>
                  </div>
                  {slice4Version === 'v41notes' && notesSavedAt && !notesDirty && (
                    <div className="jps-notes-saved-banner" role="status">
                      <BdsIcon name="check" size={14} />
                      <span>Clients will now see updates on this page.</span>
                    </div>
                  )}
                  <div className="jps-s4-side-panel-note">
                    {slice4Version === 'v45'
                      ? "The difference between revised and original budget cost for each location. Approved change orders and selection and allowance changes aren't included."
                      : slice4Version === 'v411'
                      ? "The difference between revised and original budget cost for each cost category. The largest cost is the biggest single bill, PO, or time clock entry on the cost code that's over budget. Approved change orders and selection and allowance changes aren't included."
                      : slice4Version === 'v41' || slice4Version === 'v41notes'
                      ? "The difference between the revised client price and the original client price for each cost category. Approved change orders and selection and allowance changes aren't included."
                      : "The difference between revised and original budget cost for each cost category. Approved change orders and selection and allowance changes aren't included."}
                  </div>
                  <div className="jps-table">
                    {slice4Version === 'v411' ? (
                      <div className="jps-table-header jps-table-budget-cause">
                        <div className="jps-col-title">Cost category</div>
                        <div className="jps-col-cause">Largest cost</div>
                        <div className="jps-col-impact">Budget difference</div>
                      </div>
                    ) : slice4Version === 'v41notes' ? (
                      <div className="jps-table-header jps-table-budget-notes">
                        <div className="jps-col-title">Cost category</div>
                        <div className="jps-col-impact">Budget difference</div>
                        <div className="jps-col-notes">Notes</div>
                      </div>
                    ) : (
                      <div className="jps-table-header jps-table-budget">
                        <div className="jps-col-title">{slice4Version === 'v45' ? 'Location' : 'Cost category'}</div>
                        <div className="jps-col-impact">Budget difference</div>
                      </div>
                    )}
                    {(() => {
                      if (slice4Version === 'v45') return panelByLocation;
                      if (slice4Version === 'v41notes') {
                        // Only categories with a positive overall budget
                        // difference. Underages and $0 categories are hidden
                        // entirely — same reasoning at the row level below.
                        return panelByCategoryV41Notes.filter(g => (g.revisedBudget - g.originalBudget) > 0);
                      }
                      return panelByCategory;
                    })().map((group, gi) => {
                      const isV45 = slice4Version === 'v45';
                      const isV41 = slice4Version === 'v41';
                      const isV41Notes = slice4Version === 'v41notes';
                      const isV411 = slice4Version === 'v411';
                      const groupKey = `bd-loc-${group.category}`;
                      const isOpen = !!expandedGroups[groupKey];
                      const hasItems = group.items.length > 0;
                      if (isV45 && hasItems) {
                        return (
                          <Fragment key={gi}>
                            <div
                              className={`jps-table-row jps-table-budget jps-table-row-toggle ${isOpen ? 'jps-table-row-toggle-open' : ''}`}
                              onClick={() => toggleGroup(groupKey)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(groupKey); } }}
                            >
                              <div className="jps-col-title">
                                <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />
                                <span className="jps-item-name">{group.category}</span>
                              </div>
                              <div className="jps-col-impact">
                                <span className={group.variance >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(group.variance)}</span>
                              </div>
                            </div>
                            {isOpen && group.items.map((item) => (
                              <div key={item.code} className="jps-table-row jps-table-budget jps-table-row-nested">
                                <div className="jps-col-title">
                                  <span className="jps-budget-nested-code">{item.code}</span>
                                  <span className="jps-budget-nested-name">{item.name}</span>
                                </div>
                                <div className="jps-col-impact">
                                  <span className={item.variance >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(item.variance)}</span>
                                </div>
                              </div>
                            ))}
                          </Fragment>
                        );
                      }
                      if (isV41) {
                        // v4 cost category — stripped to a simple 2-col read-only row.
                        const groupPriceDiff = group.revisedBudget - group.originalBudget;
                        return (
                          <div key={gi} className="jps-table-row jps-table-budget">
                            <div className="jps-col-title"><span className="jps-item-name">{group.category}</span></div>
                            <div className="jps-col-impact">
                              <span className={groupPriceDiff >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(groupPriceDiff)}</span>
                            </div>
                          </div>
                        );
                      }
                      if (isV41Notes) {
                        // v4.1 budget difference = revised − original (CO + selection
                        // impact). Filtered to overages only — the visible children
                        // sum may not equal the group's headline number because
                        // zero/underage codes are hidden but still in the rollup.
                        const groupPriceDiff = group.revisedBudget - group.originalBudget;
                        const overItems = group.items.filter(i => (i.revisedBudget - i.originalBudget) > 0);
                        const expandable = overItems.length > 0;
                        return (
                          <Fragment key={gi}>
                            <div
                              className={`jps-table-row jps-table-budget-notes ${expandable ? 'jps-table-row-toggle' : ''} ${isOpen ? 'jps-table-row-toggle-open' : ''}`}
                              onClick={expandable ? () => toggleGroup(groupKey) : undefined}
                              role={expandable ? 'button' : undefined}
                              tabIndex={expandable ? 0 : -1}
                              onKeyDown={expandable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(groupKey); } } : undefined}
                            >
                              <div className="jps-col-title">
                                {expandable && <BdsIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={12} />}
                                <span className="jps-item-name">{group.category}</span>
                              </div>
                              <div className="jps-col-impact">
                                <span className={groupPriceDiff >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(groupPriceDiff)}</span>
                              </div>
                              <div className="jps-col-notes" />
                            </div>
                            {isOpen && overItems.map((item) => {
                              const itemPriceDiff = item.revisedBudget - item.originalBudget;
                              return (
                                <div key={item.code} className="jps-table-row jps-table-budget-notes jps-table-row-nested">
                                  <div className="jps-col-title">
                                    <span className="jps-budget-nested-code">{item.code}</span>
                                    <span className="jps-budget-nested-name">{item.name}</span>
                                  </div>
                                  <div className="jps-col-impact">
                                    <span className={itemPriceDiff >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(itemPriceDiff)}</span>
                                  </div>
                                  <div className="jps-col-notes" onClick={(e) => e.stopPropagation()}>
                                    <textarea
                                      className="jps-notes-input"
                                      placeholder="Add note"
                                      rows={1}
                                      value={categoryNotes[item.code] ?? ''}
                                      onChange={(e) => setCategoryNotes(prev => ({ ...prev, [item.code]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key !== 'Enter' || e.shiftKey) return;
                                        const ta = e.currentTarget;
                                        const pos = ta.selectionStart;
                                        const value = ta.value;
                                        const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
                                        const currentLine = value.slice(lineStart, pos);
                                        if (currentLine === '• ') {
                                          // Empty bullet → strip it and exit list
                                          e.preventDefault();
                                          const next = value.slice(0, lineStart) + value.slice(pos);
                                          setCategoryNotes(prev => ({ ...prev, [item.code]: next }));
                                          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
                                        } else if (currentLine.startsWith('• ')) {
                                          // Continue bullet on next line
                                          e.preventDefault();
                                          const next = value.slice(0, pos) + '\n• ' + value.slice(pos);
                                          setCategoryNotes(prev => ({ ...prev, [item.code]: next }));
                                          requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + 3; });
                                        }
                                      }}
                                      aria-label={`Notes for ${item.code} ${item.name}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </Fragment>
                        );
                      }
                      if (isV411) {
                        // Pick the largest single activity on the over-budget cost code(s). When
                        // nothing is over, fall back to the largest activity across all items so
                        // the column stays informative without claiming a "cause."
                        const overItems = group.items.filter(i => i.variance > 0);
                        const pool = overItems.length ? overItems : group.items;
                        let biggest: { kind: string; name: string; amount: number; item: PanelCategoryItem } | null = null;
                        pool.forEach(item => {
                          item.activity.forEach(act => {
                            if (!biggest || act.amount > biggest.amount) {
                              biggest = { kind: act.kind, name: act.name, amount: act.amount, item };
                            }
                          });
                        });
                        return (
                          <div key={gi} className="jps-table-row jps-table-budget-cause">
                            <div className="jps-col-title"><span className="jps-item-name">{group.category}</span></div>
                            <div className="jps-col-cause">
                              {biggest ? (
                                <>
                                  <span className="jps-cause-name">
                                    <ActivityKindIcon kind={(biggest as { kind: string }).kind} />
                                    <span className="jps-cause-name-text">{(biggest as { name: string }).name}</span>
                                  </span>
                                  <span className="jps-cause-kind">{(biggest as { item: PanelCategoryItem }).item.code} {(biggest as { item: PanelCategoryItem }).item.name} <span className="jps-item-parent">· {fmt((biggest as { amount: number }).amount)}</span></span>
                                </>
                              ) : (
                                <span className="jps-cause-empty">No activity yet</span>
                              )}
                            </div>
                            <div className="jps-col-impact">
                              <span className={group.variance >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(group.variance)}</span>
                              {group.originalBudget > 0 && group.variance !== 0 && (
                                <span className="jps-impact-pct">
                                  {group.variance > 0 ? 'over' : 'under'} original amount of {fmt(group.originalBudget)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={gi} className="jps-table-row jps-table-budget">
                          <div className="jps-col-title"><span className="jps-item-name">{group.category}</span></div>
                          <div className="jps-col-impact">
                            <span className={group.variance >= 0 ? 'jps-impact-up' : 'jps-impact-down'}>{fmtSigned(group.variance)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {slice4Version === 'v411' ? (
                      <div className="jps-table-row jps-table-budget-cause jps-row-total">
                        <div className="jps-col-title">Total</div>
                        <div className="jps-col-cause"></div>
                        <div className="jps-col-impact">{fmtSigned(panelVarianceTotal)}</div>
                      </div>
                    ) : slice4Version === 'v41notes' ? (
                      <div className="jps-table-row jps-table-budget-notes jps-row-total">
                        <div className="jps-col-title">Total</div>
                        <div className="jps-col-impact">{fmtSigned(panelByCategoryV41Notes.reduce((s, g) => s + (g.revisedBudget - g.originalBudget), 0))}</div>
                        <div className="jps-col-notes"></div>
                      </div>
                    ) : slice4Version === 'v41' ? (
                      <div className="jps-table-row jps-table-budget jps-row-total">
                        <div className="jps-col-title">Total</div>
                        <div className="jps-col-impact">{fmtSigned(panelByCategory.reduce((s, g) => s + (g.revisedBudget - g.originalBudget), 0))}</div>
                      </div>
                    ) : (
                      <div className="jps-table-row jps-table-budget jps-row-total">
                        <div className="jps-col-title">Total</div>
                        <div className="jps-col-impact">{fmtSigned(panelVarianceTotal)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Payments ─── */}
              <div className="jps-breakdown-section">
                <div className="jps-section-header">
                  <BdsText as="h2" size="heavy-lg" className="jps-section-title">Payments</BdsText>
                </div>
                <div className="jps-table">
                  <div className="jps-table-header jps-table-payments">
                    <div className="jps-col-title">Title</div>
                    <div className="jps-col-date">Date</div>
                    <div className="jps-col-method">Payment type</div>
                    <div className="jps-col-amount">Amount</div>
                  </div>
                  {payments.map((p, i) => (
                    <div key={i} className="jps-table-row jps-table-payments">
                      <div className="jps-col-title"><span className="jps-item-name">{p.name}</span></div>
                      <div className="jps-col-date">{p.date}</div>
                      <div className="jps-col-method">{p.method}</div>
                      <div className="jps-col-amount">{fmt(p.amount)}</div>
                    </div>
                  ))}
                  <div className="jps-table-row jps-table-payments jps-row-total">
                    <div className="jps-col-title">Total</div>
                    <div className="jps-col-date"></div>
                    <div className="jps-col-method"></div>
                    <div className="jps-col-amount">{fmt(paymentsReceived + creditMemos)}</div>
                  </div>
                </div>
              </div>

              {/* ─── v3 drill-through modal (BDS components, no color, hierarchical amounts) ─── */}
              {slice4Version === 'v3' && slice4DrillOpen && (
                <div className="jps-s4-modal-scrim" onClick={() => setSlice4DrillOpen(false)}>
                  <div className="jps-s4-modal" onClick={(e) => e.stopPropagation()}>
                    <BdsActionBar align="space-between" className="jps-s4-modal-bar">
                      <BdsText as="h3" size="heavy-lg">Approved changes detail</BdsText>
                      <BdsButton displayType="tertiary" icon={<BdsIcon name="x" size={14} />} ariaLabel="Close" onClick={() => setSlice4DrillOpen(false)} />
                    </BdsActionBar>

                    <div className="jps-s4-modal-body">
                      {approvedCOs.length > 0 && (
                        <BdsSection
                          title="Change Orders"
                          slot={<span className="jps-s4-modal-section-total">{fmt(coVarianceSum)}</span>}
                          className="jps-s4-modal-section"
                        >
                          {approvedCOs.map((co, i) => (
                            <div key={i} className="jps-s4-modal-line">
                              <span className="jps-s4-modal-line-name">{co.name}<span className="jps-item-parent"> · {co.date || '—'}</span></span>
                              <span className="jps-s4-modal-line-amt">{fmt(co.price)}</span>
                            </div>
                          ))}
                        </BdsSection>
                      )}

                      {approvedPostSelections.length > 0 && (
                        <BdsSection
                          title="Selection changes"
                          slot={<span className="jps-s4-modal-section-total">{fmt(selVarianceSum)}</span>}
                          className="jps-s4-modal-section"
                        >
                          {approvedPostSelections.map((s, i) => (
                            <div key={i} className="jps-s4-modal-line">
                              <span className="jps-s4-modal-line-name">{s.name}{s.allowanceName ? <span className="jps-item-parent"> · {s.allowanceName}</span> : null}</span>
                              <span className="jps-s4-modal-line-amt">{fmt(s.impact)}</span>
                            </div>
                          ))}
                        </BdsSection>
                      )}

                      {allowanceVariances.length > 0 && (
                        <BdsSection
                          title="Allowance variances"
                          slot={<span className="jps-s4-modal-section-total">{fmt(allowanceVarianceSum)}</span>}
                          className="jps-s4-modal-section"
                        >
                          {allowanceVariances.map((g, i) => (
                            <div key={i} className="jps-s4-modal-line">
                              <span className="jps-s4-modal-line-name">{g.name}<span className="jps-item-parent"> · spent {fmt(g.spent)} of {fmt(g.budget)}</span></span>
                              <span className="jps-s4-modal-line-amt">{fmt(g.variance)}</span>
                            </div>
                          ))}
                        </BdsSection>
                      )}

                      {costCodeVariances.length > 0 && (
                        <BdsSection
                          title="Bills"
                          slot={<span className="jps-s4-modal-section-total">{fmt(billVarianceTotal)}</span>}
                          className="jps-s4-modal-section"
                        >
                          {costCodeVariances.map((c, i) => (
                            <div key={i} className="jps-s4-modal-line">
                              <span className="jps-s4-modal-line-name">{c.name}<span className="jps-item-parent"> · spent {fmt(c.spent)} of {fmt(c.budget)}</span></span>
                              <span className="jps-s4-modal-line-amt">{fmt(c.variance)}</span>
                            </div>
                          ))}
                        </BdsSection>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── v5 drill-through modal — math walkthrough using JCB column terms
                       so each row reconciles back to the Job Costing Budget. ─── */}
              {slice4Version === 'v5' && slice4DrillOpen && (() => {
                const projOverage = MOCK_PROJECTED_COSTS - REVISED_BUDGET_TOTAL;
                const builderStrip = -MOCK_BUILDER_VARIANCE;
                const cvTotal = costSideDelta + markupOnDelta;
                const topContributors = [...JCB_ROWS]
                  .map(r => ({ ...r, variance: r.projectedCosts - r.revisedBudgetCosts }))
                  .filter(r => r.variance !== 0)
                  .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
                  .slice(0, 3);
                return (
                  <div className="jps-s4-modal-scrim" onClick={() => setSlice4DrillOpen(false)}>
                    <div className="jps-s4-modal" onClick={(e) => e.stopPropagation()}>
                      <BdsActionBar align="space-between" className="jps-s4-modal-bar">
                        <BdsText as="h3" size="heavy-lg">Budget difference</BdsText>
                        <BdsButton displayType="tertiary" icon={<BdsIcon name="x" size={14} />} ariaLabel="Close" onClick={() => setSlice4DrillOpen(false)} />
                      </BdsActionBar>

                      <div className="jps-s4-modal-body">
                        <BdsSection
                          title="Revised vs projected"
                          className="jps-s4-modal-section"
                        >
                          <div className="jps-s4-modal-line jps-s4-math-line">
                            <span className="jps-s4-math-val">{fmt(MOCK_PROJECTED_COSTS)}</span>
                            <span className="jps-s4-math-name">Projected costs</span>
                          </div>
                          <div className="jps-s4-modal-line jps-s4-math-line">
                            <span className="jps-s4-math-val">− {fmt(REVISED_BUDGET_TOTAL)}</span>
                            <span className="jps-s4-math-name">Revised budget costs</span>
                          </div>
                          <div className="jps-s4-modal-line jps-s4-math-line jps-s4-math-result">
                            <span className="jps-s4-math-val">{fmtSigned(projOverage)}</span>
                            <span className="jps-s4-math-name">Total</span>
                          </div>
                        </BdsSection>

                        {builderStrip !== 0 && (
                          <BdsSection
                            title="Builder variance"
                            className="jps-s4-modal-section"
                          >
                            <div className="jps-s4-modal-line jps-s4-math-line">
                              <span className="jps-s4-math-val">{fmt(projOverage)}</span>
                              <span className="jps-s4-math-name">Revised vs projected (from above)</span>
                            </div>
                            <div className="jps-s4-modal-line jps-s4-math-line">
                              <span className="jps-s4-math-val">− {fmt(MOCK_BUILDER_VARIANCE)}</span>
                              <span className="jps-s4-math-name">Builder variance</span>
                            </div>
                            <div className="jps-s4-modal-line jps-s4-math-line jps-s4-math-result">
                              <span className="jps-s4-math-val">{fmtSigned(costSideDelta)}</span>
                              <span className="jps-s4-math-name">Total</span>
                            </div>
                          </BdsSection>
                        )}

                        {markupOnDelta !== 0 && (
                          <BdsSection
                            title="Markup"
                            className="jps-s4-modal-section"
                          >
                            <div className="jps-s4-modal-line jps-s4-math-line">
                              <span className="jps-s4-math-val">{fmt(costSideDelta)}</span>
                              <span className="jps-s4-math-name">Client cost change</span>
                            </div>
                            <div className="jps-s4-modal-line jps-s4-math-line">
                              <span className="jps-s4-math-val">× {(MOCK_MARKUP_PCT * 100).toFixed(0)}%</span>
                              <span className="jps-s4-math-name">Markup rate</span>
                            </div>
                            <div className="jps-s4-modal-line jps-s4-math-line jps-s4-math-result">
                              <span className="jps-s4-math-val">{fmtSigned(markupOnDelta)}</span>
                              <span className="jps-s4-math-name">Total</span>
                            </div>
                          </BdsSection>
                        )}

                        {topContributors.length > 0 && (
                          <BdsSection
                            title="Top contributors"
                            className="jps-s4-modal-section"
                          >
                            <div className="jps-s4-modal-section-desc">Cost codes where the projected cost is trending furthest from the revised budget.</div>
                            {topContributors.map(c => (
                              <div key={c.code} className="jps-s4-modal-line jps-s4-math-line">
                                <span className="jps-s4-math-val">{fmtSigned(c.variance)}</span>
                                <span className="jps-s4-math-name">
                                  {c.code} {c.name}
                                  {c.builderVariance !== 0 && (
                                    <span className="jps-item-parent"> · {fmt(c.builderVariance)} absorbed by builder</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </BdsSection>
                        )}

                        <div className="jps-s4-modal-math">
                          <div className="jps-s4-math-row jps-s4-math-row-total">
                            <span>Budget difference</span>
                            <span>{fmtSigned(cvTotal)}</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })()}

            </>
          );
        })()}

      </div>

    </div>
  );
}
