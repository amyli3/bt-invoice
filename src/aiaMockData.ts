import { ScheduleOfValuesLine, ChangeOrder } from './aiaTypes';

// ─── Base Schedule of Values (before selections) ───────────────────

export const baseScheduleOfValues: ScheduleOfValuesLine[] = [
  {
    id: 'sov-1', itemNumber: '1', description: 'General Conditions',
    scheduledValue: 15000, changeOrderDelta: 0, previousApplications: 15000,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '01.00 - General', status: 'active',
  },
  {
    id: 'sov-2', itemNumber: '2', description: 'Site Work & Excavation',
    scheduledValue: 22000, changeOrderDelta: 0, previousApplications: 22000,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '02.00 - Site Work', status: 'active',
  },
  {
    id: 'sov-3', itemNumber: '3', description: 'Foundation',
    scheduledValue: 35000, changeOrderDelta: 0, previousApplications: 35000,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '03.00 - Concrete', status: 'active',
  },
  {
    id: 'sov-4', itemNumber: '4', description: 'Framing — Labor & Material',
    scheduledValue: 48000, changeOrderDelta: 0, previousApplications: 48000,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '04.00 - Framing', status: 'active',
  },
  {
    id: 'sov-5', itemNumber: '5', description: 'Electrical Rough-In',
    scheduledValue: 18000, changeOrderDelta: 0, previousApplications: 12000,
    thisPeriodWorkCompleted: 4000, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '05.00 - Electrical', status: 'active',
  },
  {
    id: 'sov-6', itemNumber: '6', description: 'Plumbing Rough-In',
    scheduledValue: 16000, changeOrderDelta: 0, previousApplications: 10000,
    thisPeriodWorkCompleted: 3500, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '06.00 - Plumbing', status: 'active',
  },
  {
    id: 'sov-7', itemNumber: '7', description: 'HVAC',
    scheduledValue: 20000, changeOrderDelta: 0, previousApplications: 8000,
    thisPeriodWorkCompleted: 5000, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '07.00 - HVAC', status: 'active',
  },
  {
    id: 'sov-8', itemNumber: '8', description: 'Insulation & Drywall',
    scheduledValue: 14000, changeOrderDelta: 0, previousApplications: 0,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 2800,
    retainagePercent: 10, costCode: '08.00 - Drywall', status: 'active',
  },
  // THE ALLOWANCE LINE
  {
    id: 'sov-9', itemNumber: '9', description: 'Kitchen Fixtures Allowance',
    scheduledValue: 5000, changeOrderDelta: 0, previousApplications: 0,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '09.30 - Kitchen Fixtures',
    isAllowance: true, status: 'active',
  },
  {
    id: 'sov-10', itemNumber: '10', description: 'Flooring Allowance',
    scheduledValue: 8000, changeOrderDelta: 0, previousApplications: 0,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '06.10 - Flooring',
    isAllowance: true, status: 'active',
  },
  {
    id: 'sov-11', itemNumber: '11', description: 'Painting',
    scheduledValue: 12000, changeOrderDelta: 0, previousApplications: 0,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '10.00 - Painting', status: 'active',
  },
  {
    id: 'sov-12', itemNumber: '12', description: 'Final Cleanup & Punch',
    scheduledValue: 6000, changeOrderDelta: 0, previousApplications: 0,
    thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
    retainagePercent: 10, costCode: '11.00 - Cleanup', status: 'active',
  },
];

// ─── Change Order: Kitchen Allowance → Selections (overage) ────────

export const kitchenChangeOrder: ChangeOrder = {
  id: 'co-1',
  number: 'CO-001',
  description: 'Kitchen Fixtures — Replace allowance with actual selections (overage $1,298.80)',
  date: '2026-03-10',
  status: 'approved',
  removedLines: ['sov-9'],
  addedLines: [
    {
      id: 'sov-9a', itemNumber: '9A', description: 'Kohler Farmhouse Sink',
      scheduledValue: 0, changeOrderDelta: 2160, previousApplications: 0,
      thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 2160,
      retainagePercent: 10, costCode: '09.30 - Kitchen Fixtures',
      addedByChangeOrder: 'CO-001', status: 'new',
    },
    {
      id: 'sov-9b', itemNumber: '9B', description: 'Delta Touchless Faucet',
      scheduledValue: 0, changeOrderDelta: 780, previousApplications: 0,
      thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 780,
      retainagePercent: 10, costCode: '09.30 - Kitchen Fixtures',
      addedByChangeOrder: 'CO-001', status: 'new',
    },
    {
      id: 'sov-9c', itemNumber: '9C', description: 'Plumbing Install Labor',
      scheduledValue: 0, changeOrderDelta: 2280, previousApplications: 0,
      thisPeriodWorkCompleted: 2280, thisPeriodMaterialsStored: 0,
      retainagePercent: 10, costCode: '09.31 - Plumbing Labor',
      addedByChangeOrder: 'CO-001', status: 'new',
    },
    {
      id: 'sov-9d', itemNumber: '9D', description: 'GE Dishwasher',
      scheduledValue: 0, changeOrderDelta: 1078.80, previousApplications: 0,
      thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 1078.80,
      retainagePercent: 10, costCode: '09.30 - Kitchen Fixtures',
      addedByChangeOrder: 'CO-001', status: 'new',
    },
  ],
  netChange: 1298.80, // 6298.80 - 5000
};

// ─── Change Order: Flooring Allowance → Selections (underage) ──────

export const flooringChangeOrder: ChangeOrder = {
  id: 'co-2',
  number: 'CO-002',
  description: 'Flooring — Replace allowance with actual selections (underage −$1,200.00)',
  date: '2026-03-11',
  status: 'pending',
  removedLines: ['sov-10'],
  addedLines: [
    {
      id: 'sov-10a', itemNumber: '10A', description: 'Engineered Hardwood — Living Room',
      scheduledValue: 0, changeOrderDelta: 4500, previousApplications: 0,
      thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
      retainagePercent: 10, costCode: '06.10 - Flooring',
      addedByChangeOrder: 'CO-002', status: 'new',
    },
    {
      id: 'sov-10b', itemNumber: '10B', description: 'Floor Install Labor',
      scheduledValue: 0, changeOrderDelta: 2700, previousApplications: 0,
      thisPeriodWorkCompleted: 0, thisPeriodMaterialsStored: 0,
      retainagePercent: 10, costCode: '06.11 - Flooring Labor',
      addedByChangeOrder: 'CO-002', status: 'new',
    },
  ],
  netChange: -800, // 7200 - 8000
};

// ─── Scenario for partially-billed allowance ───────────────────────

export const partiallyBilledSchedule: ScheduleOfValuesLine[] = baseScheduleOfValues.map(line =>
  line.id === 'sov-9'
    ? { ...line, previousApplications: 3000, description: 'Kitchen Fixtures Allowance (partially billed)' }
    : line
);
