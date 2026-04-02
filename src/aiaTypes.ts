// ─── AIA G702/G703 Types ───────────────────────────────────────────

export interface ScheduleOfValuesLine {
  id: string;
  itemNumber: string;              // "1", "2", "9A", etc.
  description: string;
  scheduledValue: number;          // Original contract amount
  changeOrderDelta: number;        // Net change orders (+/-)
  previousApplications: number;    // Billed in prior pay apps
  thisPeriodWorkCompleted: number; // Work completed this period
  thisPeriodMaterialsStored: number; // Materials stored this period
  retainagePercent: number;        // Typically 10%
  costCode?: string;
  isAllowance?: boolean;
  replacedByChangeOrder?: string;  // CO number that replaced this line
  addedByChangeOrder?: string;     // CO number that added this line
  status: 'active' | 'replaced' | 'new';
}

export interface ChangeOrder {
  id: string;
  number: string;                  // "CO-001"
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  removedLines: string[];          // Line IDs being replaced
  addedLines: ScheduleOfValuesLine[];
  netChange: number;
}

export interface PayApplication {
  id: string;
  number: number;                  // Pay App #1, #2, etc.
  periodTo: string;
  scheduleOfValues: ScheduleOfValuesLine[];
  changeOrders: ChangeOrder[];
  retainagePercent: number;
}

// ─── Computed Helpers ──────────────────────────────────────────────

export function lineRevisedValue(line: ScheduleOfValuesLine): number {
  return line.scheduledValue + line.changeOrderDelta;
}

export function lineTotalCompleted(line: ScheduleOfValuesLine): number {
  return line.previousApplications + line.thisPeriodWorkCompleted + line.thisPeriodMaterialsStored;
}

export function linePercentComplete(line: ScheduleOfValuesLine): number {
  const revised = lineRevisedValue(line);
  if (revised === 0) return 0;
  return (lineTotalCompleted(line) / revised) * 100;
}

export function lineBalanceToFinish(line: ScheduleOfValuesLine): number {
  return lineRevisedValue(line) - lineTotalCompleted(line);
}

export function lineRetainage(line: ScheduleOfValuesLine): number {
  return lineTotalCompleted(line) * (line.retainagePercent / 100);
}

export function payAppTotals(lines: ScheduleOfValuesLine[]) {
  const active = lines.filter(l => l.status !== 'replaced');
  return {
    originalContract: active.reduce((s, l) => s + l.scheduledValue, 0),
    changeOrderTotal: active.reduce((s, l) => s + l.changeOrderDelta, 0),
    revisedContract: active.reduce((s, l) => s + lineRevisedValue(l), 0),
    previousApplications: active.reduce((s, l) => s + l.previousApplications, 0),
    thisPeriodWork: active.reduce((s, l) => s + l.thisPeriodWorkCompleted, 0),
    thisPeriodMaterials: active.reduce((s, l) => s + l.thisPeriodMaterialsStored, 0),
    totalCompleted: active.reduce((s, l) => s + lineTotalCompleted(l), 0),
    totalRetainage: active.reduce((s, l) => s + lineRetainage(l), 0),
    balanceToFinish: active.reduce((s, l) => s + lineBalanceToFinish(l), 0),
  };
}
