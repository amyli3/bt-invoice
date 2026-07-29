import { useState, useEffect } from 'react';
import { Invoice, ColumnVisibility, ClientColumnVisibility } from './types';
import { defaultInvoice, EXISTING_INVOICES, DEMO_MODAL_INVOICE } from './mockData';
import { BdsButton } from './bds';
import TopNav from './components/TopNav';
import JobSidebar from './components/JobSidebar';
import PageHeader from './components/PageHeader';
import InvoiceInfo from './components/InvoiceInfo';
import OwnerPrice from './components/OwnerPrice';
import LineItems from './components/LineItems';
import LineItemsV2 from './components/LineItemsV2';
import Notes from './components/Notes';
import ClientPreview from './components/ClientPreview';
import EmailPreview from './components/EmailPreview';
import ClientColumnToggle from './components/ClientColumnToggle';
import ClientColumnChips from './components/ClientColumnChips';
import EstimateModal from './components/EstimateModal';
import SelectionsModal from './components/SelectionsModal';
import SelectionsModalV2 from './components/SelectionsModalV2';
import SelectionsModalV3 from './components/SelectionsModalV3';
import SelectionsModalV4 from './components/SelectionsModalV4';
import SelectionsModalV5 from './components/SelectionsModalV5';
import AddFromAllModal from './components/AddFromAllModal';
import CostsModal from './components/CostsModal';
import JobPriceSummary from './components/JobPriceSummary';
import JobDetailsClients from './components/JobDetailsClients';
import SelectionsPage from './components/SelectionsPage';
import OptionDetailPage from './components/OptionDetailPage';
import AIAPayApp, { type OverageInfo } from './components/AIAPayApp';
import { INVOICE_SELECTION_SCENARIOS, INVOICE_STANDALONE_SELECTIONS } from './selectionsData';
import ChangeOrderPage, { type COInvoiceTarget } from './components/ChangeOrderPage';
import ChangeOrderListPage from './components/ChangeOrderListPage';
import EstimatePage from './components/EstimatePage';
import ProposalPage from './components/ProposalPage';
import ClientSelections from './components/ClientSelections';
import ClientSelections2 from './components/ClientSelections2';
import ClientSelections3 from './components/ClientSelections3';
import ClientPortal, { ClientTopNav } from './components/ClientPortal';
import ClientPreviewInvoice from './components/ClientPreviewInvoice';
import JobCostingBudget from './components/JobCostingBudget';
import UnderageFlows from './components/UnderageFlows';
import OpenbookFlow from './components/OpenbookFlow';
import OwnerInvoicesPage from './components/OwnerInvoicesPage';
import JobDetailsPage from './components/JobDetailsPage';
import CompanySettingsPage from './components/CompanySettingsPage';
import { JOBS } from './mockData';
import { getNextId } from './mockData';
import { TIME_INTERVAL_DEMO_INVOICES, JULY_TIME_INTERVAL_ITEMS, type DemoInvoiceRow } from './mockData';
import type { InvoicingMode, DrawScheduleLine, Job } from './types';

type PageType = 'invoice' | 'invoice-2' | 'invoice-3' | 'invoice-3-modal' | 'client-preview-invoice' | 'job-price-summary' | 'selections' | 'option-detail' | 'progress-invoice' | 'change-order' | 'change-order-list' | 'client-portal' | 'client-jps' | 'estimate' | 'job-proposal' | 'client-selections' | 'client-selections-2' | 'client-selections-3' | 'job-costing-budget' | 'underage-flows' | 'job-details-clients' | 'owner-invoices' | 'openbook' | 'job-details' | 'company-settings';

const validPages: PageType[] = ['invoice', 'invoice-2', 'invoice-3', 'invoice-3-modal', 'client-preview-invoice', 'job-price-summary', 'selections', 'option-detail', 'progress-invoice', 'change-order', 'change-order-list', 'client-portal', 'client-jps', 'estimate', 'job-proposal', 'client-selections', 'client-selections-2', 'client-selections-3', 'job-costing-budget', 'underage-flows', 'job-details-clients', 'owner-invoices', 'openbook', 'job-details', 'company-settings'];

function getInitialPage(): PageType {
  // Support ?page=X query param (used when hash is occupied by Figma capture)
  const params = new URLSearchParams(window.location.search);
  const qPage = params.get('page');
  if (qPage && validPages.includes(qPage as PageType)) return qPage as PageType;
  const hash = window.location.hash.replace('#', '').split('&')[0];
  if (validPages.includes(hash as PageType)) return hash as PageType;
  return 'invoice-3';
}

export default function App() {
  const [invoice, setInvoice] = useState<Invoice>(defaultInvoice);
  const [jobOpen, setJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(1);
  const [activePage, _setActivePage] = useState<PageType>(getInitialPage);
  // Shared state — persists across page navigation
  const [approvedCOIds, setApprovedCOIds] = useState<string[]>([]);
  const [addedCostIds, setAddedCostIds] = useState<string[]>(['cost-1', 'cost-2', 'cost-3', 'cost-6', 'cost-7', 'cost-8']);
  const [addedCOIds, setAddedCOIds] = useState<string[]>([]);
  const [piGroupBy, setPiGroupBy] = useState<'estimate' | 'costcode'>('estimate');
  const [currentOverages, setCurrentOverages] = useState<OverageInfo[]>([]);
  const [selectedCOId, setSelectedCOId] = useState<string | null>(null);

  const setActivePage = (page: PageType | string) => {
    // Handle change-order:id navigation
    if (typeof page === 'string' && page.startsWith('change-order:')) {
      setSelectedCOId(page.split(':')[1]);
      _setActivePage('change-order' as PageType);
      return;
    }
    if (page === 'change-order') setSelectedCOId(null);
    _setActivePage(page as PageType);
    window.location.hash = page;
  };
  const [selectedOption, setSelectedOption] = useState<{ name: string; category: string; price: number; allowanceName?: string; status: string } | null>(null);
  const [optionOpenedFrom, setOptionOpenedFrom] = useState<PageType>('job-price-summary');
  const [prefilledAllowance, setPrefilledAllowance] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'builder' | 'preview'>('builder');
  const [previewHidden, setPreviewHidden] = useState(true);
  const [previewTab, setPreviewTab] = useState<'client' | 'email'>('client');
  // "Invoice (modal)" only — Details/Client preview as top-level tabs. On the
  // Client preview tab, "Customize" slides open a panel (mirrors BT's Bill
  // modal side-panel pattern) with the same display/column options as the
  // real invoice client-preview editor. The full-page Invoice route is untouched.
  const [modalDetailsTab, setModalDetailsTab] = useState<'details' | 'client-preview'>('details');
  const [customizePanelOpen, setCustomizePanelOpen] = useState(true);
  const [clientHideLineItems, setClientHideLineItems] = useState(false);
  const [clientShowQrCode, setClientShowQrCode] = useState(false);
  const [clientShowCustomFields, setClientShowCustomFields] = useState(false);
  const [clientShowDescription, setClientShowDescription] = useState(true);
  const [clientShowIntroText, setClientShowIntroText] = useState(true);
  const [clientShowClosingText, setClientShowClosingText] = useState(false);
  const [customizeSavedAsDefault, setCustomizeSavedAsDefault] = useState(false);

  const [vis, setVis] = useState<ColumnVisibility>({
    items: true, costType: true, unitCost: true, quantity: true,
    unit: true, builderCost: true, markup: true, clientPrice: true, tax: true, bill: false,
  });

  const [clientVis, setClientVis] = useState<ClientColumnVisibility>({
    costType: false, quantity: true, unit: false, unitPrice: true,
  });
  const [clientGroupBy, setClientGroupBy] = useState<'estimate' | 'costcode' | 'all'>('estimate');
  // "Invoice (modal)" Customize view panel — the built-in factory defaults,
  // used by both the initial state above and the panel's "Reset" button.
  const DEFAULT_CLIENT_VIS: ClientColumnVisibility = { costType: false, quantity: true, unit: false, unitPrice: true };
  const DEFAULT_CLIENT_GROUP_BY: 'estimate' | 'costcode' | 'all' = 'estimate';

  // JPS openbook — builder toggle for showing the whole-job budget difference to the
  // client. Single on/off, default off. Lifted here so the builder view drives the
  // client (#client-jps) view.
  const [shareBudgetDiff, setShareBudgetDiff] = useState(false);

  const [estModalOpen, setEstModalOpen] = useState(false);
  const [selModalOpen, setSelModalOpen] = useState(false);
  const [selV2ModalOpen, setSelV2ModalOpen] = useState(false);
  const [selV4ModalOpen, setSelV4ModalOpen] = useState(false);
  const [selV5ModalOpen, setSelV5ModalOpen] = useState(false);
  // How grouped allowance lines render on the invoice: 'summary' = one rolled-up
  // line per allowance; 'itemized' = broken out, nested by cost code. Set by the
  // wizard's "Group line items" checkbox and flippable via the invoice toggle.
  const [stackView, setStackView] = useState<'summary' | 'itemized'>('summary');
  const [selV2on3ModalOpen, setSelV2on3ModalOpen] = useState(false);
  const [addAllModalOpen, setAddAllModalOpen] = useState(false);
  const [costsModalOpen, setCostsModalOpen] = useState(false);
  const [selectionsWizardOpen, setSelectionsWizardOpen] = useState(false);
  const [wizardPreselectIds, setWizardPreselectIds] = useState<string[]>([]);
  // Which existing invoice the Selections wizard is adding to, if any (vs. a
  // brand-new invoice). Drives the "Add to Invoice #X" framing in the wizard.
  const [wizardTargetInvoice, setWizardTargetInvoice] = useState<{ invoiceNumber: string; title: string; type: 'invoice' | 'progress' } | null>(null);
  const [completedAllowanceIds, setCompletedAllowanceIds] = useState<Set<string>>(new Set());
  // Set when a draw invoice is auto-filled from the job's draw schedule (the
  // "Invoicing moment" -> Milestone/Draws path) so invoice-3 can show why it
  // was pre-filled. Cleared on dismiss or when leaving the invoice builder.
  const [autoFilledDraw, setAutoFilledDraw] = useState<{ drawNumber: number; milestone: string } | null>(null);
  // Same idea as autoFilledDraw, for the time-interval/open-book path — set
  // when a period's bills and time-clock hours were pulled in automatically.
  const [autoFilledPeriod, setAutoFilledPeriod] = useState<{ period: string } | null>(null);
  const startDrawInvoice = (job: typeof JOBS[number], draw: NonNullable<typeof job.drawSchedule>[number]) => {
    setInvoice({
      ...defaultInvoice,
      title: draw.title,
      mode: 'flatFee',
      type: 'progress',
      flatFeeAmount: draw.amount,
      invoiceDescription: `${draw.milestone} milestone marked complete — Draw #${draw.drawNumber} of the payment schedule set at proposal signing.`,
      to: { ...defaultInvoice.to, name: job.name },
    });
    setAutoFilledDraw({ drawNumber: draw.drawNumber, milestone: draw.milestone });
    setAutoFilledPeriod(null);
    setActivePage('invoice-3');
  };
  // A plain one-off invoice, independent of the job's billing mode — any job,
  // fixed-price or open-book, can need one for something outside its normal
  // billing cadence (e.g. a one-time reimbursable). Always available, never
  // gated behind the mode picker.
  const startRegularInvoice = (job: typeof JOBS[number]) => {
    setInvoice({ ...defaultInvoice, to: { ...defaultInvoice.to, name: job.name } });
    setAutoFilledDraw(null);
    setAutoFilledPeriod(null);
    setActivePage('invoice-3');
  };
  // Time interval / Open book's "ready to invoice" moment — pull in the
  // period's bills and time-clock hours as if Buildertrend gathered them
  // automatically, instead of dropping the builder into a blank invoice.
  const startTimeIntervalInvoice = (job: typeof JOBS[number], row: DemoInvoiceRow) => {
    const lineItems = JULY_TIME_INTERVAL_ITEMS.map(item => ({
      id: getNextId(),
      description: item.description,
      costCode: item.costCode,
      costType: item.costType,
      unitCost: item.amount,
      quantity: 1,
      unit: '--',
      markup: 0,
    }));
    setInvoice({
      ...defaultInvoice,
      title: row.title,
      mode: 'lineItems',
      type: 'invoice',
      lineItems,
      invoiceDescription: `Bills and time clock hours logged in ${row.period ?? 'this period'} — pulled in automatically.`,
      to: { ...defaultInvoice.to, name: job.name },
    });
    setAutoFilledDraw(null);
    setAutoFilledPeriod({ period: row.period ?? '' });
    setActivePage('invoice-3');
  };
  // Per-job invoicing-mode decision, made once via the InvoicingModePicker
  // (surfaced inline on Owner Invoices) and remembered from then on.
  const [invoicingModeByJob, setInvoicingModeByJob] = useState<Record<number, InvoicingMode>>({});
  const [showModePicker, setShowModePicker] = useState(false);
  // Draw/payment schedules created or edited via PaymentScheduleModal, keyed
  // by job id — overlaid on top of the job's baked-in mock drawSchedule (if
  // any) so a newly-created schedule immediately drives what shows as
  // ready-to-invoice.
  const [drawScheduleOverrides, setDrawScheduleOverrides] = useState<Record<number, DrawScheduleLine[]>>({});
  // Contract price pushed from Estimate's "Send to budget" into Job details —
  // locked there (not hand-editable) until the estimate is unlocked again.
  const [contractPriceByJob, setContractPriceByJob] = useState<Record<number, number>>({});
  const [estimateLockedByJob, setEstimateLockedByJob] = useState<Record<number, boolean>>({});
  // Contract type / construction-loan financing set on Job Details — feed
  // recommendInvoicingMode, so changing either re-opens the mode picker
  // (instead of silently leaving a now-stale recommendation in place).
  const [contractTypeOverrides, setContractTypeOverrides] = useState<Record<number, 'fixed-price' | 'open-book'>>({});
  const [fundedByLoanOverrides, setFundedByLoanOverrides] = useState<Record<number, boolean>>({});
  const updateJobFinancials = (jobId: number, patch: { contractType?: 'fixed-price' | 'open-book'; fundedByLoan?: boolean }) => {
    if (patch.contractType) setContractTypeOverrides(prev => ({ ...prev, [jobId]: patch.contractType! }));
    if (patch.fundedByLoan !== undefined) setFundedByLoanOverrides(prev => ({ ...prev, [jobId]: patch.fundedByLoan! }));
    setInvoicingModeByJob(prev => {
      if (!(jobId in prev)) return prev;
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  };
  // Where to return when leaving the Job details page — captured at the
  // moment the info icon is clicked from whatever page the sidebar was on.
  const [jobDetailsReturnPage, setJobDetailsReturnPage] = useState<PageType>('job-price-summary');
  const goInvoiceForMode = (mode: InvoicingMode) => {
    const job = currentJobWithOverrides;
    if (mode === 'aia-percent-complete') { setActivePage('progress-invoice'); return; }
    // Time interval / Open book: if a period's invoice is ready (bills/time
    // clock hours logged, not yet released), pull those in pre-filled —
    // otherwise fall back to the same plain builder as "Regular invoice".
    if (mode === 'time-interval') {
      const readyRow = TIME_INTERVAL_DEMO_INVOICES.find(r => r.status === 'Unreleased');
      if (readyRow) { startTimeIntervalInvoice(job, readyRow); } else { startRegularInvoice(job); }
      return;
    }
    // milestone-draws: jump straight to the first ready-but-not-yet-invoiced draw, pre-filled.
    const nextDraw = job.drawSchedule?.find(d => d.phaseComplete && !d.invoiced) ?? job.drawSchedule?.[0];
    if (nextDraw) { startDrawInvoice(job, nextDraw); } else { setActivePage('invoice-3'); }
  };
  // The merged "Invoice" action (draws + time-interval collapsed into one
  // split-button option) — prefer a genuinely ready draw, then a ready
  // time-interval period, else fall back to a blank invoice.
  const startSmartInvoice = () => {
    const job = currentJobWithOverrides;
    const nextDraw = job.drawSchedule?.find(d => d.phaseComplete && !d.invoiced);
    if (nextDraw) { startDrawInvoice(job, nextDraw); return; }
    const readyRow = TIME_INTERVAL_DEMO_INVOICES.find(r => r.status === 'Unreleased');
    if (readyRow) { startTimeIntervalInvoice(job, readyRow); return; }
    startRegularInvoice(job);
  };
  const toggleAllowanceComplete = (id: string) => {
    setCompletedAllowanceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const handleAddFromEstimate = (items: any[]) => {
    const newItems = items.map((i: any) => {
      const pct = i.invoicePct || 0;
      const price = i.type === 'line' ? i.price : i.clientPrice;
      const invoiceAmt = price * pct / 100;
      const isGroup = i.type === 'allowance' || i.type === 'selection';
      return {
        id: getNextId(),
        description: i.name,
        costCode: i.costCode || '',
        costType: i.costType || (i.type === 'allowance' ? 'Allowance' : i.type === 'selection' ? 'Selection' : 'Material'),
        unitCost: invoiceAmt,
        quantity: 1,
        unit: '--',
        markup: 0,
        ...(isGroup ? { relatedItem: { type: i.type, name: i.name, groupId: i.id } } : {}),
      };
    });
    if (newItems.length > 0) {
      setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...newItems] }));
    }
  };
  // Underage reallocation: pair held underages (from complete allowances with
  // unspent budget) with overages on the invoice modal. Greedy fill in the
  // order the held bucket lists them — surfaces the math for the banner and
  // drives the one-click apply action.
  const heldUnderages = INVOICE_SELECTION_SCENARIOS.flatMap(ma => {
    const approved = ma.selections.reduce((s, sel) => s + sel.approvedPrice, 0);
    const delta = ma.budgetAmount - approved;
    const isComplete = !!ma.closeoutMode || completedAllowanceIds.has(ma.id);
    if (!isComplete || delta <= 0) return [];
    return [{ id: ma.id, name: ma.name, costCode: ma.costCode, amount: delta }];
  });


  const handleApplyReallocation = (apps: { source: { id: string; name: string; costCode: string }; target: { id: string; name: string; costCode: string }; amount: number; targetOverageTotal: number }[]) => {
    // Underage credit lines only — the matching target overage allowance gets
    // added via the regular Add from selections flow when the builder checks
    // it. Self-targeted apps (source === target) are bare credits with no
    // reallocation metadata, surfacing as a credit at the source cost code.
    const newItems = apps.map(app => {
      const isBareCredit = app.source.id === app.target.id;
      return {
        id: getNextId(),
        description: isBareCredit
          ? `${app.source.name} – allowance underage credit`
          : `${app.source.name} – reallocated to ${app.target.name}`,
        costCode: app.source.costCode,
        costType: 'Allowance',
        unitCost: -app.amount,
        quantity: 1,
        unit: '--',
        markup: 0,
        relatedItem: { type: 'allowance' as const, name: app.source.name, groupId: app.source.id },
        ...(isBareCredit ? {} : { reallocation: { sourceAllowanceId: app.source.id, targetAllowanceId: app.target.id, targetName: app.target.name, targetCostCode: app.target.costCode } }),
      };
    });
    if (newItems.length > 0) setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...newItems] }));
  };

  const handleAddFromSelections = (items: any[], opts?: { grouped?: boolean }) => {
    // The wizard's "Group line items" checkbox sets the invoice's initial view.
    if (opts && opts.grouped !== undefined) setStackView(opts.grouped ? 'summary' : 'itemized');
    setInvoice(inv => {
      let lineItems = [...inv.lineItems];
      items.forEach((group: any) => {
        // If the wizard says an existing allowance line needs adjusting (because
        // this round's new selections changed the math), update it in place
        // instead of stacking another line.
        if (group.allowanceUpdate !== undefined && group.allowanceChildId) {
          const idx = lineItems.findIndex(li =>
            li.relatedItem?.childIds?.includes(group.allowanceChildId),
          );
          if (idx !== -1) {
            const li = lineItems[idx];
            const isPureAllowanceLine =
              li.relatedItem?.type === 'allowance' &&
              li.relatedItem?.childIds?.length === 1;
            // When the allowance nets to $0 and the line isn't rolled up with
            // other content, drop it entirely instead of leaving a noise row.
            if (group.allowanceUpdate === 0 && isPureAllowanceLine) {
              lineItems = [...lineItems.slice(0, idx), ...lineItems.slice(idx + 1)];
            } else {
              const updated: any = { ...li, unitCost: group.allowanceUpdate };
              if (group.allowanceUpdateChildIds) {
                updated.relatedItem = { ...li.relatedItem, childIds: group.allowanceUpdateChildIds };
              }
              if (group.allowanceUpdateRolledUp) {
                updated.rolledUp = group.allowanceUpdateRolledUp;
              }
              lineItems[idx] = updated;
            }
          }
        }
        if (group.children && group.children.length > 0) {
          group.children.forEach((child: any) => {
            // Skip any row whose new-invoice amount is null — informational rows
            // not billable on this invoice (e.g., already-invoiced selections,
            // unbilled allowance placeholders).
            if (child.newInvoiceAmt === null) return;
            const isAllowanceLine = child.selection === 'Allowance';
            const childIds: string[] = child.sourceChildIds ?? [child.id];
            lineItems.push({
              id: getNextId(),
              description: child.lineItem,
              costCode: child.costCode,
              costType: isAllowanceLine ? 'Allowance' : 'Selection',
              unitCost: child.newInvoiceAmt,
              quantity: 1,
              unit: '--',
              markup: 0,
              relatedItem: {
                type: isAllowanceLine ? 'allowance' as const : 'selection' as const,
                name: isAllowanceLine ? group.name : child.selection,
                groupId: group.id,
                childIds,
              },
              // Preserve the wizard's breakdown so the invoice can expand the line.
              ...(child.rolledUp ? { rolledUp: child.rolledUp } : {}),
            });
          });
        } else if (group.allowanceUpdate === undefined) {
          // Fallback only when there's no allowanceUpdate — otherwise this round
          // is a pure in-place line adjustment, not a new line addition.
          lineItems.push({
            id: getNextId(),
            description: group.name,
            costCode: '',
            costType: group.type === 'allowance' ? 'Allowance' : 'Selection',
            unitCost: group.invoiceBalance,
            quantity: 1,
            unit: '--',
            markup: 0,
            relatedItem: { type: group.type, name: group.name, groupId: group.id },
          });
        }
      });
      return { ...inv, lineItems };
    });
  };
  const currentJob = JOBS.find(j => j.id === selectedJob);
  // Overlay any locally-created/edited payment schedule + financials onto a
  // job — this is what invoicing logic and Owner Invoices should actually read.
  const withJobOverrides = (job: Job): Job => {
    const contractTypeOverride = contractTypeOverrides[job.id];
    return {
      ...job,
      drawSchedule: drawScheduleOverrides[job.id] ?? job.drawSchedule,
      contractType: contractTypeOverride === 'open-book'
        ? 'cost-plus'
        : contractTypeOverride ?? job.contractType,
      fundedByConstructionLoan: fundedByLoanOverrides[job.id] ?? job.fundedByConstructionLoan,
    };
  };
  const currentJobWithOverrides: Job = withJobOverrides(currentJob ?? JOBS[0]);
  // EstimatePage is hardcoded to Johnson Residence (job 1) regardless of
  // which job is selected in the sidebar — so its own job-scoped state
  // (invoicing mode, financials) always reads/writes job 1 specifically.
  const estimateJobWithOverrides: Job = withJobOverrides(JOBS[0]);

  // Build the data shape consumed by both SelectionsModal (V1) and
  // SelectionsModalV2 — keeps the per-scenario math in one place.
  const selectionsModalData = INVOICE_SELECTION_SCENARIOS.map(ma => {
    const selectionsTotal = ma.selections.reduce((s, sel) => s + sel.approvedPrice, 0);
    const billableSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? 0 : sel.approvedPrice), 0);
    const invoicedSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? sel.approvedPrice : 0), 0);
    const notPreviouslyInvoiced = ma.previouslyInvoiced === 0;
    const anyInvoicedSelection = ma.selections.some(s => s.status === 'invoiced');
    const markedComplete = !!ma.closeoutMode || completedAllowanceIds.has(ma.id);

    let allowanceNewInvoiceAmt: number | null;
    let invoiceBalance: number;
    if (anyInvoicedSelection) {
      allowanceNewInvoiceAmt = null;
      invoiceBalance = billableSelectionsTotal;
    } else if (notPreviouslyInvoiced) {
      allowanceNewInvoiceAmt = null;
      invoiceBalance = billableSelectionsTotal;
    } else {
      if (markedComplete) {
        allowanceNewInvoiceAmt = -ma.budgetAmount;
        invoiceBalance = selectionsTotal - ma.budgetAmount;
      } else {
        const matchedReversal = Math.min(selectionsTotal, ma.budgetAmount);
        allowanceNewInvoiceAmt = -matchedReversal;
        invoiceBalance = selectionsTotal - matchedReversal;
      }
    }
    const previouslyInvoicedDisplay = anyInvoicedSelection ? invoicedSelectionsTotal : ma.previouslyInvoiced;
    return {
      id: ma.id,
      type: 'allowance' as 'allowance' | 'selection',
      name: ma.name,
      scenarioNote: ma.scenarioNote,
      scenarioNoteV3: ma.scenarioNoteV3,
      // Raw allowance pre-bill amount (no override). V3 displays this as
      // "Previously invoiced" so the label means specifically "what was
      // billed for THIS allowance on a prior invoice" — not the sum of
      // selections billed earlier.
      allowancePreInvoiced: ma.previouslyInvoiced,
      canMarkComplete: ma.id === 'ma-2',
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
          costType: 'Allowance',
          selection: 'Allowance',
          price: ma.budgetAmount,
          newInvoiceAmt: allowanceNewInvoiceAmt,
        },
        ...ma.selections.map(sel => {
          const selectionCostCode = sel.costCode.includes(' ')
            ? sel.costCode
            : ma.costCode;
          return {
            id: sel.id,
            lineItem: sel.name,
            costCode: selectionCostCode,
            costType: sel.costType,
            selection: sel.name,
            price: sel.approvedPrice,
            newInvoiceAmt: sel.status === 'invoiced' ? null : sel.approvedPrice,
          };
        }),
      ],
    };
  }).filter(row => {
    const allowanceRev = row.children[0]?.newInvoiceAmt;
    return row.invoiceBalance !== 0 || allowanceRev !== null;
  }).concat(
    INVOICE_STANDALONE_SELECTIONS.map(ss => ({
      id: ss.id,
      type: 'selection' as const,
      name: ss.name,
      scenarioNote: ss.scenarioNote,
      scenarioNoteV3: undefined,
      allowancePreInvoiced: 0,
      canMarkComplete: false,
      isComplete: false,
      revisedPrice: ss.approvedPrice,
      previouslyInvoiced: 0,
      invoiceBalance: ss.approvedPrice,
      allowanceBudget: 0,
      overage: 0,
      children: [
        {
          id: `${ss.id}-row`,
          lineItem: ss.name,
          costCode: `${ss.costCode} - ${ss.costType}`,
          costType: ss.costType,
          selection: ss.name,
          price: ss.approvedPrice,
          newInvoiceAmt: ss.approvedPrice,
        },
      ],
    }))
  );

  // Standalone allowances — allowances with no selections nested yet. Builders
  // can invoice the allowance amount itself before any selection is chosen.
  // Only surfaced in the Selection 3 (allowance-billable) wizard.
  const standaloneAllowanceData = [
    { id: 'sa-1', name: 'Landscaping Allowance', costCode: '2050 - Sitework', budget: 6000, preInvoiced: 0 },
    { id: 'sa-2', name: 'Appliance Allowance', costCode: '9060 - Appliances', budget: 4500, preInvoiced: 0 },
  ].map(a => ({
    id: a.id,
    type: 'allowance' as 'allowance' | 'selection',
    name: a.name,
    scenarioNote: 'Allowance with no selections chosen yet — invoice the allowance amount directly.',
    scenarioNoteV3: undefined,
    allowancePreInvoiced: a.preInvoiced,
    canMarkComplete: false,
    isComplete: false,
    revisedPrice: a.budget,
    previouslyInvoiced: a.preInvoiced,
    invoiceBalance: a.budget,
    allowanceBudget: a.budget,
    overage: 0,
    children: [
      {
        id: `${a.id}-rev`,
        lineItem: a.name,
        costCode: a.costCode,
        costType: 'Allowance',
        selection: 'Allowance',
        price: a.budget,
        newInvoiceAmt: a.budget,
      },
    ],
  }));
  const selection3Data = [...selectionsModalData, ...standaloneAllowanceData];

  const [isNarrow, setIsNarrow] = useState(window.innerWidth <= 960);
  useEffect(() => {
    const handler = () => {
      const narrow = window.innerWidth <= 960;
      setIsNarrow(narrow);
      if (narrow) setJobOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (activePage === 'client-portal') {
    return <ClientPortal onNavigate={(page) => setActivePage(page as PageType)} />;
  }

  if (activePage === 'client-jps') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <ClientTopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <JobPriceSummary jobOpen={false} isClient shareBudgetDiff={shareBudgetDiff} onBack={() => setActivePage('client-portal')} onOpenSelection={(sel) => { setSelectedOption(sel); setOptionOpenedFrom('client-jps'); setActivePage('option-detail'); }} onOpenJCB={() => setActivePage('job-costing-budget')} />
        </div>
      </div>
    );
  }

  if (activePage === 'client-selections') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <ClientTopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflow: 'auto'}}>
          <ClientSelections />
        </div>
      </div>
    );
  }

  if (activePage === 'client-selections-2') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <ClientTopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflow: 'auto'}}>
          <ClientSelections2 />
        </div>
      </div>
    );
  }

  if (activePage === 'client-selections-3') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <ClientTopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflow: 'auto'}}>
          <ClientSelections3 />
        </div>
      </div>
    );
  }

  if (activePage === 'change-order-list') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <ChangeOrderListPage onNavigate={(page) => setActivePage(page as PageType)} approvedCOIds={approvedCOIds} />
        </div>
      </div>
    );
  }

  if (activePage === 'change-order') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <ChangeOrderPage
            onBack={() => setActivePage(selectedCOId ? 'change-order-list' : 'progress-invoice')}
            overages={currentOverages}
            coId={selectedCOId}
            onApprove={(invoiceTarget?: COInvoiceTarget, coLineItems?: Invoice['lineItems'], coTitle?: string) => {
              // Mark the CO approved either way — this is what makes it
              // eligible for manual "Add change order" later if the builder
              // didn't choose to auto-invoice it now.
              let newIds: string[] = [];
              if (selectedCOId === 'co-3') {
                // Budget reallocation CO
                newIds = ['co-3a', 'co-3b'].filter(id => !addedCOIds.includes(id));
              } else {
                const coMap: Record<string, string> = { '4100': 'co-1', '6100': 'co-2' };
                newIds = currentOverages
                  .map(o => coMap[o.costCode])
                  .filter((id): id is string => !!id && !addedCOIds.includes(id));
              }
              if (newIds.length > 0) {
                setApprovedCOIds(prev => [...prev, ...newIds]);
              }

              // "Invoice client upon approval" was checked — route the CO to
              // wherever the builder chose.
              if (invoiceTarget?.type === 'openbook') {
                if (newIds.length > 0) setAddedCOIds(prev => [...prev, ...newIds]);
              } else if (invoiceTarget?.type === 'new' && coLineItems && coLineItems.length > 0) {
                setInvoice({ ...defaultInvoice, type: invoiceTarget.invoiceType, title: coTitle ?? '', lineItems: coLineItems });
                setWizardTargetInvoice(null);
                setActivePage('invoice-3');
              } else if (invoiceTarget?.type === 'existing' && coLineItems && coLineItems.length > 0) {
                const existing = EXISTING_INVOICES.find(inv => inv.invoiceNumber === invoiceTarget.invoiceNumber);
                if (existing) {
                  setInvoice({ ...existing, lineItems: [...existing.lineItems, ...coLineItems] });
                  setWizardTargetInvoice({ invoiceNumber: existing.invoiceNumber, title: existing.title, type: existing.type ?? 'invoice' });
                  setActivePage('invoice-3');
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (activePage === 'client-preview-invoice') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, minHeight: 0}}>
          <ClientPreviewInvoice />
        </div>
      </div>
    );
  }

  if (activePage === 'owner-invoices') {
    const job = currentJobWithOverrides;
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); setShowModePicker(false); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <OwnerInvoicesPage
              job={job}
              invoicingMode={invoicingModeByJob[job.id]}
              showModePicker={showModePicker}
              onSetInvoicingMode={(mode) => { setInvoicingModeByJob(prev => ({ ...prev, [job.id]: mode })); setShowModePicker(false); }}
              onRequestChangeMode={() => setShowModePicker(true)}
              onAddInvoice={goInvoiceForMode}
              onAddInvoiceSmart={startSmartInvoice}
              onSavePaymentSchedule={(draws) => setDrawScheduleOverrides(prev => ({ ...prev, [job.id]: draws }))}
              onDeletePaymentSchedule={() => setDrawScheduleOverrides(prev => ({ ...prev, [job.id]: [] }))}
              onOpenJobDetails={() => { setJobDetailsReturnPage(activePage); setActivePage('job-details'); }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-details') {
    const job = currentJobWithOverrides;
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setSelectedJob(id); }} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <JobDetailsPage
              job={job}
              onBack={() => setActivePage(jobDetailsReturnPage)}
              contractPrice={contractPriceByJob[job.id]}
              contractPriceLocked={!!estimateLockedByJob[job.id]}
              contractType={contractTypeOverrides[job.id] ?? (job.contractType === 'fixed-price' ? 'fixed-price' : 'open-book')}
              onContractTypeChange={(v) => updateJobFinancials(job.id, { contractType: v })}
              fundedByLoan={(fundedByLoanOverrides[job.id] ?? job.fundedByConstructionLoan ?? true) ? 'yes' : 'no'}
              onFundedByLoanChange={(v) => updateJobFinancials(job.id, { fundedByLoan: v === 'yes' })}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'openbook') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <OpenbookFlow />
        </div>
      </div>
    );
  }

  if (activePage === 'company-settings') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <CompanySettingsPage />
        </div>
      </div>
    );
  }

  if (activePage === 'progress-invoice') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <AIAPayApp onNavigate={(page) => setActivePage(page as PageType)} approvedCOIds={approvedCOIds} addedCostIds={addedCostIds} onCostIdsChange={setAddedCostIds} addedCOIds={addedCOIds} onCOIdsChange={setAddedCOIds} groupBy={piGroupBy} onGroupByChange={setPiGroupBy} onOveragesChange={setCurrentOverages} />
        </div>
      </div>
    );
  }

  if (activePage === 'estimate') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area">
            <EstimatePage
              jobOpen={jobOpen}
              onToggleJob={() => setJobOpen(true)}
              locked={!!estimateLockedByJob[1]}
              job={estimateJobWithOverrides}
              invoicingMode={invoicingModeByJob[1]}
              onSetInvoicingMode={(mode) => setInvoicingModeByJob(prev => ({ ...prev, [1]: mode }))}
              existingDrawSchedule={drawScheduleOverrides[1] ?? JOBS[0].drawSchedule}
              onScheduleCreated={(draws) => {
                // EstimatePage is hardcoded to Johnson Residence (job 1) for now.
                setDrawScheduleOverrides(prev => ({ ...prev, [1]: draws }));
                setInvoicingModeByJob(prev => ({ ...prev, [1]: 'milestone-draws' }));
              }}
              onSendToBudget={(total) => {
                setContractPriceByJob(prev => ({ ...prev, [1]: total }));
                setEstimateLockedByJob(prev => ({ ...prev, [1]: true }));
                // Production drops builders on Job Costing Budget after
                // sending to budget — the payment-schedule offer now lives
                // inside the Send to Budget modal itself, before this navigate.
                setActivePage('job-costing-budget');
              }}
              onUnlock={() => setEstimateLockedByJob(prev => ({ ...prev, [1]: false }))}
              onBuildProposal={() => setActivePage('job-proposal')}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-proposal') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{flex: 1, overflowY: 'auto'}}>
          <ProposalPage onBack={() => setActivePage('estimate')} />
        </div>
      </div>
    );
  }

  if (activePage === 'option-detail') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <div className="content-area">
            <OptionDetailPage onBack={() => { setActivePage(optionOpenedFrom); setSelectedOption(null); setPrefilledAllowance(null); }} selectionData={selectedOption} prefilledAllowance={prefilledAllowance} />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'selections') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area">
            <SelectionsPage
              jobOpen={jobOpen}
              onToggleJob={() => setJobOpen(true)}
              onOpenOption={(sel) => { if (sel) setSelectedOption(sel); setPrefilledAllowance(null); setOptionOpenedFrom('selections'); setActivePage('option-detail'); }}
              onAddToAllowance={(name) => { setSelectedOption(null); setPrefilledAllowance(name); setOptionOpenedFrom('selections'); setActivePage('option-detail'); }}
              completedAllowanceIds={completedAllowanceIds}
              onToggleAllowanceComplete={toggleAllowanceComplete}
              onOpenInvoice={() => setActivePage('invoice')}
              onOpenReallocation={() => { setActivePage('invoice-2'); setSelModalOpen(true); }}
              onOpenInvoiceWizard={(ids, target) => {
                if (target?.type === 'existing') {
                  const existing = EXISTING_INVOICES.find(inv => inv.invoiceNumber === target.invoiceNumber);
                  setInvoice(existing ?? defaultInvoice);
                  setWizardTargetInvoice(existing ? { invoiceNumber: existing.invoiceNumber, title: existing.title, type: existing.type ?? 'invoice' } : null);
                } else {
                  setInvoice({ ...defaultInvoice, type: target?.invoiceType ?? 'invoice' });
                  setWizardTargetInvoice(null);
                }
                setWizardPreselectIds(ids ?? []);
                // Open the wizard as an overlay on the selections grid itself.
                // Navigation to the invoice builder happens on "Add" (see the
                // SelectionsModalV5 mount below), not up front.
                setSelV5ModalOpen(true);
              }}
            />
          </div>
        </div>
        <SelectionsModalV2
          open={selectionsWizardOpen}
          onClose={() => setSelectionsWizardOpen(false)}
          onAdd={(items) => {
            handleAddFromSelections(items);
            setSelectionsWizardOpen(false);
            setActivePage('invoice-2');
          }}
          data={selectionsModalData}
          initialCheckedIds={wizardPreselectIds}
        />
        <SelectionsModalV5
          open={selV5ModalOpen && activePage === 'selections'}
          onClose={() => setSelV5ModalOpen(false)}
          onAdd={(items, opts) => {
            // Add the selected rows to the invoice, then take the builder to
            // the invoice builder to see the result. The wizard calls onClose
            // right after onAdd, so this only fires on "Add", not on Cancel.
            handleAddFromSelections(items, opts);
            setActivePage('invoice-3');
          }}
          addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
          targetInvoice={wizardTargetInvoice}
          newInvoiceType={invoice.type ?? 'invoice'}
        />
      </div>
    );
  }

  if (activePage === 'underage-flows') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <UnderageFlows />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-costing-budget') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <JobCostingBudget onBack={() => setActivePage('invoice')} onOpenJPS={() => setActivePage('job-price-summary')} />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-details-clients') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <JobDetailsClients shareBudgetDiff={shareBudgetDiff} onShareBudgetDiffChange={setShareBudgetDiff} onBack={() => setActivePage('job-price-summary')} />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-price-summary') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
          <div className="content-area">
            <JobPriceSummary jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} shareBudgetDiff={shareBudgetDiff} onShareBudgetDiffChange={setShareBudgetDiff} onOpenSelection={(sel) => { setSelectedOption(sel); setOptionOpenedFrom('job-price-summary'); setActivePage('option-detail'); }} onOpenJCB={() => setActivePage('job-costing-budget')} onOpenClientPermissions={() => setActivePage('job-details-clients')} />
          </div>
        </div>
      </div>
    );
  }

  const isInvoiceV2Like = activePage === 'invoice-2' || activePage === 'invoice-3' || activePage === 'invoice-3-modal';
  // 'invoice-3' and 'invoice-3-modal' are the same reimagine builder content —
  // the latter is just presented as a modal over Owner Invoices instead of a
  // full page. Anything gated on "am I in the invoice-3 experience" (wizards
  // launched from "Add from", the pre-fill banners) needs both.
  const isInvoice3Family = activePage === 'invoice-3' || activePage === 'invoice-3-modal';
  const showInvoiceAsModal = activePage === 'invoice-3-modal';

  const renderInvoiceBuilder = () => (
    <>
      {autoFilledDraw && isInvoice3Family && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '12px 16px 0',
          background: '#EEF5FF', border: '1px solid #B8D4FF', borderRadius: 8, fontSize: 13, color: '#1A3A6B',
        }}>
          <span style={{fontSize: 15}}>✨</span>
          <span style={{flex: 1}}>
            <strong>We pre-filled this invoice</strong> — the "{autoFilledDraw.milestone}" schedule phase was marked complete, which is Draw #{autoFilledDraw.drawNumber} on this job's payment schedule.
          </span>
          <button
            type="button"
            onClick={() => setAutoFilledDraw(null)}
            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#1A3A6B', fontSize: 13, textDecoration: 'underline'}}
          >
            Dismiss
          </button>
        </div>
      )}
      {autoFilledPeriod && isInvoice3Family && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '12px 16px 0',
          background: '#EEF5FF', border: '1px solid #B8D4FF', borderRadius: 8, fontSize: 13, color: '#1A3A6B',
        }}>
          <span style={{fontSize: 15}}>✨</span>
          <span style={{flex: 1}}>
            <strong>We pre-filled this invoice</strong> — bills and time clock hours logged in {autoFilledPeriod.period} were pulled in automatically.
          </span>
          <button
            type="button"
            onClick={() => setAutoFilledPeriod(null)}
            style={{background: 'none', border: 'none', cursor: 'pointer', color: '#1A3A6B', fontSize: 13, textDecoration: 'underline'}}
          >
            Dismiss
          </button>
        </div>
      )}
      <PageHeader invoice={invoice} jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} onClose={() => setActivePage('owner-invoices')} />

      {showInvoiceAsModal ? (
        <>
          {/* Invoice (modal) only — Details/Client preview as top-level tabs,
              matching the real "Progress invoice" dialog's tab pattern,
              instead of the side-by-side split the full-page route uses. */}
          <div style={{ display: 'flex', gap: 24, padding: '0 24px', borderBottom: '1px solid var(--g200)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setModalDetailsTab('details')}
              style={{
                background: 'none', border: 'none', padding: '12px 2px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: modalDetailsTab === 'details' ? 'var(--bt-blue, #0065db)' : 'var(--g500)',
                borderBottom: modalDetailsTab === 'details' ? '2px solid var(--bt-blue, #0065db)' : '2px solid transparent',
              }}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => {
                // Leaving Details closes any open "Add from" panel — it's
                // docked next to the builder form, which isn't shown here.
                setEstModalOpen(false);
                setSelV5ModalOpen(false);
                setSelV2on3ModalOpen(false);
                setAddAllModalOpen(false);
                setCostsModalOpen(false);
                setModalDetailsTab('client-preview');
              }}
              style={{
                background: 'none', border: 'none', padding: '12px 2px', cursor: 'pointer',
                fontSize: 14, fontWeight: 600, color: modalDetailsTab === 'client-preview' ? 'var(--bt-blue, #0065db)' : 'var(--g500)',
                borderBottom: modalDetailsTab === 'client-preview' ? '2px solid var(--bt-blue, #0065db)' : '2px solid transparent',
              }}
            >
              Client preview
            </button>
          </div>

          {modalDetailsTab === 'details' ? (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="builder builder-full" style={{ flex: 1, minHeight: 0 }}>
                <InvoiceInfo invoice={invoice} onChange={setInvoice} />
                <OwnerPrice invoice={invoice} onChange={setInvoice} />
                {invoice.mode === 'lineItems' && (
                  <LineItemsV2
                    invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} stackView={stackView} onStackViewChange={setStackView}
                    // Only one "Add from" panel docks at a time — opening one closes any other.
                    onOpenEstimate={() => { setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setEstModalOpen(true); }}
                    onOpenSelections={() => setSelV2ModalOpen(true)}
                    onOpenSelections2={() => setSelV4ModalOpen(true)}
                    onOpenSelections2b={() => { setEstModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setSelV5ModalOpen(true); }}
                    onOpenSelections3={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setSelV2on3ModalOpen(true); }}
                    onOpenAll={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setCostsModalOpen(false); setAddAllModalOpen(true); }}
                    onOpenCosts={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(true); }}
                  />
                )}
                <Notes invoice={invoice} onChange={setInvoice} />
              </div>

              {(estModalOpen || selV5ModalOpen || selV2on3ModalOpen || addAllModalOpen || costsModalOpen) && (
                <div style={{ width: 'clamp(560px, 46vw, 980px)', flexShrink: 0, borderLeft: '1px solid var(--g200)', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {estModalOpen && (
                    <EstimateModal
                      variant="panel"
                      open={estModalOpen}
                      onClose={() => setEstModalOpen(false)}
                      onAdd={handleAddFromEstimate}
                      jobName={currentJob?.name || 'Job name'}
                    />
                  )}
                  {selV5ModalOpen && (
                    <SelectionsModalV5
                      variant="panel"
                      open={selV5ModalOpen}
                      onClose={() => setSelV5ModalOpen(false)}
                      onAdd={handleAddFromSelections}
                      addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
                      targetInvoice={wizardTargetInvoice}
                      newInvoiceType={invoice.type ?? 'invoice'}
                    />
                  )}
                  {selV2on3ModalOpen && (
                    <SelectionsModalV2
                      variant="panel"
                      open={selV2on3ModalOpen}
                      onClose={() => setSelV2on3ModalOpen(false)}
                      onAdd={handleAddFromSelections}
                      addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
                      data={selection3Data}
                    />
                  )}
                  {addAllModalOpen && (
                    <AddFromAllModal
                      variant="panel"
                      open={addAllModalOpen}
                      onClose={() => setAddAllModalOpen(false)}
                      onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
                    />
                  )}
                  {costsModalOpen && (
                    <CostsModal
                      variant="panel"
                      open={costsModalOpen}
                      onClose={() => setCostsModalOpen(false)}
                      onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 24, background: 'var(--g50)' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  {!customizePanelOpen && (
                    <button type="button" className="btn btn-s" onClick={() => setCustomizePanelOpen(true)}>
                      Customize
                    </button>
                  )}
                </div>
                <ClientPreview
                  invoice={invoice}
                  clientVis={clientVis}
                  groupBy={clientGroupBy}
                  hideLineItems={clientHideLineItems}
                  showQrCode={clientShowQrCode}
                  showCustomFields={clientShowCustomFields}
                  showDescription={clientShowDescription}
                  showIntroText={clientShowIntroText}
                  showClosingText={clientShowClosingText}
                  maxWidth={780}
                  minHeight="100%"
                />
              </div>

              {customizePanelOpen && (
                <div style={{ width: 280, flexShrink: 0, borderLeft: '1px solid var(--g200)', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <strong style={{ fontSize: 14 }}>Customize view</strong>
                      <button
                        type="button"
                        onClick={() => setCustomizePanelOpen(false)}
                        aria-label="Close customize panel"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'var(--g500)', padding: 4 }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>Display to client</div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer', marginBottom: 10 }}>
                        <input type="checkbox" checked={clientHideLineItems} onChange={e => { setClientHideLineItems(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                        Hide line items
                      </label>
                      {!clientHideLineItems && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={clientGroupBy === 'costcode'} onChange={e => { setClientGroupBy(e.target.checked ? 'costcode' : 'estimate'); setCustomizeSavedAsDefault(false); }} />
                          Combine line items by cost code
                        </label>
                      )}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>Columns</div>
                      <ClientColumnChips columns={clientVis} onChange={v => { setClientVis(v); setCustomizeSavedAsDefault(false); }} />
                      <div style={{ fontSize: 11, color: 'var(--g400)', marginTop: 6 }}>Description and Amount always show.</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--g500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>General information</div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer', marginBottom: 10 }}>
                        <input type="checkbox" checked={clientShowQrCode} onChange={e => { setClientShowQrCode(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                        QR code
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer', marginBottom: 10 }}>
                        <input type="checkbox" checked={clientShowCustomFields} onChange={e => { setClientShowCustomFields(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                        Custom fields
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={clientShowDescription} onChange={e => { setClientShowDescription(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                        Description
                      </label>
                      {clientShowDescription && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, paddingLeft: 22 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={clientShowIntroText} onChange={e => { setClientShowIntroText(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                            Intro text
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--g700)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={clientShowClosingText} onChange={e => { setClientShowClosingText(e.target.checked); setCustomizeSavedAsDefault(false); }} />
                            Closing text
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, borderTop: '1px solid var(--g200)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customizeSavedAsDefault && (
                      <div style={{ fontSize: 12, color: 'var(--green, #1a7f4e)', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Saved as default</div>
                    )}
                    <div className="bds-scope" style={{ display: 'flex', gap: 6 }}>
                      <BdsButton
                        displayType="secondary"
                        text="Reset"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setClientHideLineItems(false);
                          setClientGroupBy(DEFAULT_CLIENT_GROUP_BY);
                          setClientVis(DEFAULT_CLIENT_VIS);
                          setClientShowQrCode(false);
                          setClientShowCustomFields(false);
                          setClientShowDescription(true);
                          setClientShowIntroText(true);
                          setClientShowClosingText(false);
                          setCustomizeSavedAsDefault(false);
                        }}
                      />
                      <BdsButton
                        displayType="primary"
                        text="Set as default"
                        style={{ flex: 1 }}
                        onClick={() => setCustomizeSavedAsDefault(true)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="view-toggle">
            <div className="tabs">
              <button className={"tab" + (activeView === 'builder' ? ' on' : '')} onClick={() => setActiveView('builder')}>Builder</button>
              <button className={"tab" + (activeView === 'preview' ? ' on' : '')} onClick={() => setActiveView('preview')}>Preview</button>
            </div>
          </div>

          <div className="split">
            <div
              className={"builder" + (previewHidden && isInvoiceV2Like && !isNarrow ? ' builder-full' : '')}
              style={isNarrow && activeView !== 'builder' ? {display: 'none'} : {}}
            >
              <InvoiceInfo invoice={invoice} onChange={setInvoice} />
              <OwnerPrice invoice={invoice} onChange={setInvoice} />
              {invoice.mode === 'lineItems' && (isInvoiceV2Like
                ? <LineItemsV2 invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} stackView={stackView} onStackViewChange={setStackView} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelV2ModalOpen(true)} onOpenSelections2={() => setSelV4ModalOpen(true)} onOpenSelections2b={() => setSelV5ModalOpen(true)} onOpenSelections3={() => setSelV2on3ModalOpen(true)} onOpenAll={() => setAddAllModalOpen(true)} onOpenCosts={() => setCostsModalOpen(true)} />
                : <LineItems invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelModalOpen(true)} />)}
              <Notes invoice={invoice} onChange={setInvoice} />
            </div>
            <div className="preview" style={{
              ...(isNarrow && activeView !== 'preview' ? {display: 'none'} : {}),
              padding: 0,
              display: (isNarrow && activeView !== 'preview') || (previewHidden && isInvoiceV2Like && !isNarrow) ? 'none' : 'flex',
              flexDirection: 'column',
            }}>
              <div className="preview-tabs">
                <div className="preview-tabs-left">
                  <button className={"preview-tab" + (previewTab === 'client' ? ' on' : '')} onClick={() => setPreviewTab('client')}>Client preview</button>
                  <button className={"preview-tab" + (previewTab === 'email' ? ' on' : '')} onClick={() => setPreviewTab('email')}>Email preview</button>
                </div>
                <div className="preview-tabs-right">
                  {previewTab === 'client' && (
                    <>
                      {isInvoiceV2Like && (
                        <div className="client-group-toggle" role="tablist" aria-label="Group line items for client">
                          <button type="button" className={"client-group-tab" + (clientGroupBy === 'estimate' ? ' on' : '')} onClick={() => setClientGroupBy('estimate')} aria-selected={clientGroupBy === 'estimate'}>By estimate</button>
                          <button type="button" className={"client-group-tab" + (clientGroupBy === 'costcode' ? ' on' : '')} onClick={() => setClientGroupBy('costcode')} aria-selected={clientGroupBy === 'costcode'}>By cost code</button>
                          <button type="button" className={"client-group-tab" + (clientGroupBy === 'all' ? ' on' : '')} onClick={() => setClientGroupBy('all')} aria-selected={clientGroupBy === 'all'}>All line items</button>
                        </div>
                      )}
                      <ClientColumnToggle columns={clientVis} onChange={setClientVis} />
                    </>
                  )}
                </div>
              </div>
              <div style={{flex: 1, overflowY: 'auto', padding: 24, background: 'var(--g50)'}}>
                {previewTab === 'client' && <ClientPreview invoice={invoice} clientVis={clientVis} groupBy={isInvoiceV2Like ? clientGroupBy : 'estimate'} />}
                {previewTab === 'email' && <EmailPreview invoice={invoice} />}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bbar" style={showInvoiceAsModal ? { background: 'var(--g50)', boxShadow: '0 -1px 0 var(--g200)' } : undefined}>
        <button className="btn btn-s" onClick={() => { setInvoice(defaultInvoice); setAutoFilledDraw(null); if (showInvoiceAsModal) setActivePage('owner-invoices'); }}>Cancel</button>
        {isInvoiceV2Like && !isNarrow && !showInvoiceAsModal && (
          <button
            type="button"
            className="btn btn-s"
            onClick={() => setPreviewHidden(h => !h)}
            title={previewHidden ? 'Show client preview' : 'Hide client preview'}
            aria-pressed={!previewHidden}
          >
            Client preview
          </button>
        )}
        <button className="btn btn-s">Save</button>
        <button className="btn btn-p">Send</button>
      </div>
    </>
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <TopNav onNavigate={(page) => {
        if (page === 'invoice-3-modal') setInvoice(DEMO_MODAL_INVOICE);
        setActivePage(page as PageType);
      }} />
      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
        <div className="content-area" style={showInvoiceAsModal ? {overflowY: 'auto'} : undefined}>
          {showInvoiceAsModal
            ? <OwnerInvoicesPage
                job={currentJobWithOverrides}
                invoicingMode={invoicingModeByJob[currentJobWithOverrides.id]}
                showModePicker={showModePicker}
                onSetInvoicingMode={(mode) => { setInvoicingModeByJob(prev => ({ ...prev, [currentJobWithOverrides.id]: mode })); setShowModePicker(false); }}
                onRequestChangeMode={() => setShowModePicker(true)}
                onAddInvoice={goInvoiceForMode}
                onAddInvoiceSmart={startSmartInvoice}
                onSavePaymentSchedule={(draws) => setDrawScheduleOverrides(prev => ({ ...prev, [currentJobWithOverrides.id]: draws }))}
                onDeletePaymentSchedule={() => setDrawScheduleOverrides(prev => ({ ...prev, [currentJobWithOverrides.id]: [] }))}
                onOpenJobDetails={() => { setJobDetailsReturnPage(activePage); setActivePage('job-details'); }}
              />
            : renderInvoiceBuilder()}
        </div>
      </div>
      {showInvoiceAsModal && (
        <div className="modal-backdrop" onClick={() => setActivePage('owner-invoices')}>
          <div className="est-modal" style={{height: '92vh', width: '99vw', maxWidth: 1900}} onClick={e => e.stopPropagation()}>
            {renderInvoiceBuilder()}
          </div>
        </div>
      )}
      <EstimateModal
        open={estModalOpen && !showInvoiceAsModal}
        onClose={() => setEstModalOpen(false)}
        onAdd={handleAddFromEstimate}
        jobName={currentJob?.name || 'Job name'}
      />
      <SelectionsModal
        open={selModalOpen}
        onClose={() => setSelModalOpen(false)}
        onAdd={handleAddFromSelections}
        jobName={currentJob?.name || 'Job name'}
        addedGroupIds={invoice.lineItems.filter(li => li.relatedItem?.groupId).map(li => li.relatedItem!.groupId)}
        onMarkComplete={toggleAllowanceComplete}
        heldUnderages={isInvoiceV2Like ? heldUnderages : []}
        onApplyReallocation={isInvoiceV2Like ? handleApplyReallocation : undefined}
        showNegativeBalances
        data={selectionsModalData}
      />
      <SelectionsModalV2
        open={selV2ModalOpen && activePage === 'invoice-2'}
        onClose={() => setSelV2ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        data={selectionsModalData}
      />
      <SelectionsModalV3
        open={selV2ModalOpen && isInvoice3Family}
        onClose={() => setSelV2ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        data={selection3Data}
      />
      <SelectionsModalV4
        open={selV4ModalOpen && isInvoice3Family}
        onClose={() => setSelV4ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
      />
      <SelectionsModalV5
        open={selV5ModalOpen && isInvoice3Family && !showInvoiceAsModal}
        onClose={() => setSelV5ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        targetInvoice={wizardTargetInvoice}
        newInvoiceType={invoice.type ?? 'invoice'}
      />
      <SelectionsModalV2
        open={selV2on3ModalOpen && isInvoice3Family && !showInvoiceAsModal}
        onClose={() => setSelV2on3ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        data={selection3Data}
      />
      <AddFromAllModal
        open={addAllModalOpen && isInvoice3Family && !showInvoiceAsModal}
        onClose={() => setAddAllModalOpen(false)}
        onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
      />
      <CostsModal
        open={costsModalOpen && isInvoice3Family && !showInvoiceAsModal}
        onClose={() => setCostsModalOpen(false)}
        onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
      />
    </div>
  );
}
