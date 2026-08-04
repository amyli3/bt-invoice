import { useState, useEffect } from 'react';
import { Invoice, ColumnVisibility, ClientColumnVisibility } from './types';
import { defaultInvoice, EXISTING_INVOICES, DEMO_INVOICE } from './mockData';
import { BdsButton } from './bds';
import TopNav from './components/TopNav';
import JobSidebar from './components/JobSidebar';
import PageHeader from './components/PageHeader';
import InvoiceInfo from './components/InvoiceInfo';
import OwnerPrice, { PriceModeToggle } from './components/OwnerPrice';
import InvoiceKindPicker, { type InvoiceKind } from './components/InvoiceKindPicker';
import ProgressInvoiceGrid from './components/ProgressInvoiceGrid';
import { AiaPreview } from './components/InvoicePreviewPanel';
import LineItems from './components/LineItems';
import LineItemsV2, { AddFromDropdown, type BillingModel } from './components/LineItemsV2';
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

type PageType = 'invoice' | 'invoice-2' | 'invoice-3' | 'invoice-3-modal' | 'invoice-full-page' | 'invoice-full-page-reimagined' | 'client-preview-invoice' | 'job-price-summary' | 'selections' | 'option-detail' | 'progress-invoice' | 'change-order' | 'change-order-list' | 'client-portal' | 'client-jps' | 'estimate' | 'job-proposal' | 'client-selections' | 'client-selections-2' | 'client-selections-3' | 'job-costing-budget' | 'underage-flows' | 'job-details-clients' | 'owner-invoices' | 'openbook' | 'job-details' | 'company-settings';

const validPages: PageType[] = ['invoice', 'invoice-2', 'invoice-3', 'invoice-3-modal', 'invoice-full-page', 'invoice-full-page-reimagined', 'client-preview-invoice', 'job-price-summary', 'selections', 'option-detail', 'progress-invoice', 'change-order', 'change-order-list', 'client-portal', 'client-jps', 'estimate', 'job-proposal', 'client-selections', 'client-selections-2', 'client-selections-3', 'job-costing-budget', 'underage-flows', 'job-details-clients', 'owner-invoices', 'openbook', 'job-details', 'company-settings'];

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
  // "Invoice (full page - reimagined)" only — which grid the builder chose at
  // the decision point. null = decision not made yet, so the picker shows.
  const [reimaginedKind, setReimaginedKind] = useState<InvoiceKind | null>(null);
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
  // "Combined view 2" — the same wizard with Costs as a fourth record type. Its
  // own flag so it and the original combined view can be compared side by side.
  const [addAllV2ModalOpen, setAddAllV2ModalOpen] = useState(false);
  // Width of the docked "Add from" panel on the tabs/modal layout. null = the
  // responsive default; dragging the divider between the invoice form and the
  // panel pins an explicit pixel width so the builder can size it themselves.
  const [dockedPanelWidth, setDockedPanelWidth] = useState<number | null>(null);
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
  // Which page the pre-filled invoice was opened on. autoFilledDraw/Period stay
  // in state as you move around the prototype, so without this the note would
  // follow you onto every other invoice route.
  const [prefillPage, setPrefillPage] = useState<PageType | null>(null);
  const startDrawInvoice = (job: typeof JOBS[number], draw: NonNullable<typeof job.drawSchedule>[number]) => {
    setInvoice({
      ...defaultInvoice,
      // Created from the "review draft invoice" banner, so it opens as a draft:
      // nothing has gone to the client until it's sent.
      status: 'Draft',
      title: draw.title,
      mode: 'flatFee',
      type: 'progress',
      flatFeeAmount: draw.amount,
      invoiceDescription: `${draw.milestone} milestone marked complete. Draw #${draw.drawNumber} of the payment schedule set at proposal signing.`,
      to: { ...defaultInvoice.to, name: job.name },
    });
    setAutoFilledDraw({ drawNumber: draw.drawNumber, milestone: draw.milestone });
    setAutoFilledPeriod(null);
    setPrefillPage('invoice-3');
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
    setPrefillPage(null);
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
      status: 'Draft',
      title: row.title,
      mode: 'lineItems',
      type: 'invoice',
      lineItems,
      invoiceDescription: `Bills and time clock hours logged in ${row.period ?? 'this period'}, pulled in automatically.`,
      to: { ...defaultInvoice.to, name: job.name },
    });
    setAutoFilledDraw(null);
    setAutoFilledPeriod({ period: row.period ?? '' });
    setPrefillPage('invoice-3');
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
  /* Cost plus and time-and-materials are both open book: the client sees the
     costs and pays them, so Auto fill reads cost records. Fixed price bills the
     contract, so it reads contract lines. Jobs with no contractType set fall in
     with open book, which is what the existing cost-based fill assumed. */
  const jobBillingModel: BillingModel =
    currentJob?.contractType === 'fixed-price' ? 'fixedPrice' : 'openBook';
  const billingModel: BillingModel = jobBillingModel;
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

  // 'invoice-full-page-reimagined' is a copy of the full page whose line-items
  // section leads with a Regular / Progress decision instead of a Flat fee /
  // Line items toggle — everything else about the page is identical, so it
  // travels with 'invoice-full-page' through all the layout flags below.
  const isReimaginedFullPage = activePage === 'invoice-full-page-reimagined';
  const isFullPageInvoice = activePage === 'invoice-full-page' || isReimaginedFullPage;
  const isInvoiceV2Like = activePage === 'invoice-2' || activePage === 'invoice-3' || activePage === 'invoice-3-modal' || isFullPageInvoice;
  // 'invoice-3', 'invoice-3-modal' and the full-page routes are the same
  // reimagine builder content — the latter are just presented with the
  // Details/Client preview tab layout (as a modal, or as a full page) instead
  // of the side-by-side Builder/Preview split. Anything gated on "am I in the
  // invoice-3 experience" (wizards launched from "Add from", the pre-fill
  // banners) needs all of them.
  const isInvoice3Family = activePage === 'invoice-3' || activePage === 'invoice-3-modal' || isFullPageInvoice;
  const showInvoiceAsModal = activePage === 'invoice-3-modal';
  // The full-page routes reuse the modal's Details/Client-preview tab layout,
  // just rendered inline in the content area instead of inside the modal
  // backdrop — see showInvoiceAsModal-only usages below for what stays modal-specific.
  const useTabsLayout = showInvoiceAsModal || isFullPageInvoice;
  // Progress path on the reimagined page previews as a G702/G703 pay
  // application, not the regular invoice document — so the Client preview tab
  // swaps in AiaPreview and drops the Customize panel, whose column/line-item
  // options only describe the regular invoice.
  const showProgressClientPreview = isReimaginedFullPage && reimaginedKind === 'progress';

  // Leaving Details closes any open "Add from" panel — it's docked next to
  // the builder form, which isn't shown on the Client preview tab.
  const openClientPreviewTab = () => {
    setEstModalOpen(false);
    setSelV5ModalOpen(false);
    setSelV2on3ModalOpen(false);
    setAddAllModalOpen(false);
    setAddAllV2ModalOpen(false);
    setCostsModalOpen(false);
    setModalDetailsTab('client-preview');
  };

  // Details / Client preview switcher — the shared BDS segmented control
  // (same `.tabs` component as "Invoice date | Link to schedule item"), matching
  // the Change Order page's tab treatment.
  const renderDetailsTabs = () => (
    <div className="tabs" role="tablist" aria-label="Invoice view">
      <button
        type="button"
        role="tab"
        aria-selected={modalDetailsTab === 'details'}
        className={"tab" + (modalDetailsTab === 'details' ? ' on' : '')}
        onClick={() => setModalDetailsTab('details')}
      >
        Details
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={modalDetailsTab === 'client-preview'}
        className={"tab" + (modalDetailsTab === 'client-preview' ? ' on' : '')}
        onClick={openClientPreviewTab}
      >
        Client preview
      </button>
    </div>
  );

  /* Split by job: the header NAMES the billing type (subtitle, next to the
     title), and the control that CHANGES it sits beside the grid it changes.
     Reading what kind of invoice this is is a header concern; switching it is a
     line-items concern, since the type is what decides which grid you get.

     Cost of putting the control by the grid: it needs three placements, because
     each container disappears in some mode. Line items row, schedule-of-values
     header, and Owner price for flat fee, which renders no grid at all.

     Known tradeoff, unchanged: switching with line items already entered leaves
     the previous type's lines behind. Leaving the invoice resets the choice (see
     leaveInvoice), so close-and-reopen is still the clean path. */
  /* The title already names the type, but only until the builder types their own
     title over it. So the subtitle leads with the type name just in that case,
     and otherwise carries the explanation alone rather than repeating the H1. */
  const billingKindSubtitle = (() => {
    const name = reimaginedKind === 'progress' ? 'Progress invoice' : 'Regular invoice';
    const how = reimaginedKind === 'progress'
      ? 'billed on percent complete against the schedule of values'
      : 'billed by line item';
    return invoice.title
      ? `${name} · ${how}`
      : how.charAt(0).toUpperCase() + how.slice(1);
  })();

  /* Picking a kind sets invoice.type as well, so the title, the client preview
     and anything else keyed on type agree with the grid that's showing. Without
     this the header rendered "Invoice" over a schedule of values. */
  const pickBillingKind = (kind: InvoiceKind | null) => {
    setReimaginedKind(kind);
    if (kind) setInvoice(inv => ({ ...inv, type: kind === 'progress' ? 'progress' : 'invoice' }));
  };

  const renderBillingKindSwitch = () => (
    <button
      type="button"
      onClick={() => pickBillingKind(null)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--bt-blue)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
    >
      Switch billing type
    </button>
  );

  /* Leaving the invoice also clears the billing type, so reopening starts at
     "How are you billing this invoice?" with a clean grid. */
  const leaveInvoice = () => {
    setReimaginedKind(null);
    setActivePage('owner-invoices');
  };

  // The Details tab's form sections. Rendered either on their own (modal) or as
  // the left column beside the QuickBooks rail (full page).
  const renderDetailsForm = () => (
    <>
      <InvoiceInfo invoice={invoice} onChange={setInvoice} />
      <OwnerPrice
        invoice={invoice}
        onChange={setInvoice}
        // Full page only: the toggle moves inline with "Add from" below.
        // Flat-fee mode keeps it here, since LineItemsV2 (and therefore that
        // inline slot) isn't rendered in that mode — otherwise there'd be no way
        // back to line items. On the reimagined page it's also irrelevant until
        // the builder has chosen the regular path.
        hideModeToggle={isReimaginedFullPage
          ? (reimaginedKind !== 'regular' || invoice.mode === 'lineItems')
          : (isFullPageInvoice && invoice.mode === 'lineItems')}
        modeToggleExtra={isReimaginedFullPage && reimaginedKind !== null ? renderBillingKindSwitch() : undefined}
      />

      {/* Reimagined page: decide Regular vs Progress first, then load that grid. */}
      {isReimaginedFullPage && reimaginedKind === null && (
        <div className="sec" style={{ borderBottom: 'none' }}>
          <InvoiceKindPicker onPick={pickBillingKind} />
        </div>
      )}
      {isReimaginedFullPage && reimaginedKind === 'progress' && (
        <div className="sec" style={{ paddingBottom: 0 }}>
          {/* The label doesn't repeat the type: the header subtitle above already
              carries it. The switch sits in the grid toolbar's LEFT cluster and
              "Add from" on the right, which is the same arrangement the
              line-items path uses, so neither control moves between paths. */}
          <div className="sec-title" style={{ fontSize: 14, margin: '0 0 8px' }}>Schedule of values</div>
          <ProgressInvoiceGrid
            toolbarLeft={renderBillingKindSwitch()}
            toolbarRight={
              <>
                <AddFromDropdown
                  onOpenEstimate={() => { setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setEstModalOpen(true); }}
                  onOpenSelections2b={() => { setEstModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setSelV5ModalOpen(true); }}
                  onOpenSelections3={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setSelV2on3ModalOpen(true); }}
                  onOpenAll={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setAddAllModalOpen(true); }}
                  onOpenAll2={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setCostsModalOpen(false); setAddAllModalOpen(false); setAddAllV2ModalOpen(true); }}
                  onOpenCosts={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setAddAllV2ModalOpen(false); setCostsModalOpen(true); }}
                />
              </>
            }
          />
        </div>
      )}

      {(!isReimaginedFullPage || reimaginedKind === 'regular') && invoice.mode === 'lineItems' && (
        <LineItemsV2
          invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} stackView={stackView} onStackViewChange={setStackView}
          modeToggle={isReimaginedFullPage && reimaginedKind !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <PriceModeToggle invoice={invoice} onChange={setInvoice} />
              {renderBillingKindSwitch()}
            </div>
          ) : isFullPageInvoice ? <PriceModeToggle invoice={invoice} onChange={setInvoice} /> : undefined}
          // Only one "Add from" panel docks at a time — opening one closes any other.
          onOpenEstimate={() => { setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setEstModalOpen(true); }}
          onOpenSelections={() => setSelV2ModalOpen(true)}
          onOpenSelections2={() => setSelV4ModalOpen(true)}
          onOpenSelections2b={() => { setEstModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setSelV5ModalOpen(true); }}
          onOpenSelections3={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setAddAllModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setSelV2on3ModalOpen(true); }}
          onOpenAll={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setCostsModalOpen(false); setAddAllV2ModalOpen(false); setAddAllModalOpen(true); }}
          onOpenAll2={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setCostsModalOpen(false); setAddAllModalOpen(false); setAddAllV2ModalOpen(true); }}
          onOpenCosts={() => { setEstModalOpen(false); setSelV5ModalOpen(false); setSelV2on3ModalOpen(false); setAddAllModalOpen(false); setAddAllV2ModalOpen(false); setCostsModalOpen(true); }}
          // Invoice (modal) only — other pages keep the single-source wizards.
          hideSingleSourceOptions={showInvoiceAsModal}
          billingModel={billingModel}
          notice={invoice.mode === 'lineItems' ? prefillNotice : undefined}
        />
      )}
      <Notes invoice={invoice} onChange={setInvoice} variant={isFullPageInvoice ? 'full-page' : 'default'} />
    </>
  );

  // Drag-to-resize for the docked "Add from" panel. The panel's right edge is
  // pinned to the modal, so the new width is just (right edge − pointer x),
  // clamped so neither side collapses. Double-click the divider to reset.
  const startDockedPanelDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const panel = e.currentTarget.parentElement;
    const row = panel?.parentElement;
    if (!panel || !row) return;
    const right = panel.getBoundingClientRect().right;
    const rowWidth = row.getBoundingClientRect().width;
    const move = (ev: MouseEvent) => {
      const next = right - ev.clientX;
      setDockedPanelWidth(Math.max(360, Math.min(next, rowWidth - 320)));
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  // "We pre-filled this invoice" sits with the line items it's explaining
  // (under the Add from row) rather than at the top of the page, where it read
  // as a page-level announcement far away from the lines it describes.
  const prefillReason = autoFilledDraw
    ? `the "${autoFilledDraw.milestone}" schedule phase was marked complete, which is Draw #${autoFilledDraw.drawNumber} on this job's payment schedule.`
    : autoFilledPeriod
    ? `bills and time clock hours logged in ${autoFilledPeriod.period} were pulled in automatically.`
    : null;
  const prefillNotice = prefillReason && activePage === prefillPage ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 10,
      background: '#EEF5FF', border: '1px solid #B8D4FF', borderRadius: 8, fontSize: 13, color: '#1A3A6B',
    }}>
      <span style={{ fontSize: 15 }}>✨</span>
      <span style={{ flex: 1 }}>
        <strong>We pre-filled this invoice</strong> {prefillReason}
      </span>
      <button
        type="button"
        onClick={() => { setAutoFilledDraw(null); setAutoFilledPeriod(null); setPrefillPage(null); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A3A6B', fontSize: 13, textDecoration: 'underline' }}
      >
        Dismiss
      </button>
    </div>
  ) : null;

  const renderInvoiceBuilder = () => (
    <>
      {/* Flat-fee invoices (the draws path) have no line-items section to hang
          the note under, so it stays at the top of the builder for those. */}
      {invoice.mode !== 'lineItems' && prefillNotice && (
        <div style={{ margin: '12px 16px 0' }}>{prefillNotice}</div>
      )}
      {isFullPageInvoice ? (
        // Invoice (full page) — job breadcrumb, title + status, back link, then
        // a row with the Details/Client preview tabs on the left and the record
        // actions on the right. Mirrors the Change Order page's header, instead
        // of the dialog-style PageHeader + bottom action bar the modal uses.
        <div style={{ padding: '16px 24px', background: 'white', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--g500)' }}>{currentJob?.name ?? invoice.to.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--g800)' }}>
              {invoice.title || (invoice.type === 'progress' ? 'Progress invoice' : 'Invoice')}
            </span>
            <span className={invoice.status === 'Draft' ? 'status status-draft' : 'status status-unreleased'}>{invoice.status}</span>
          </div>
          {isReimaginedFullPage && reimaginedKind !== null && (
            <div style={{ fontSize: 13, color: 'var(--g500)', marginTop: 2 }}>{billingKindSubtitle}</div>
          )}
          <button
            type="button"
            onClick={leaveInvoice}
            style={{ background: 'none', border: 'none', padding: 0, marginTop: 4, cursor: 'pointer', fontSize: 13, color: 'var(--bt-blue)', fontFamily: 'inherit' }}
          >
            ← Back to Invoices
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {renderDetailsTabs()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-s" onClick={() => { setInvoice(defaultInvoice); setAutoFilledDraw(null); leaveInvoice(); }}>Cancel</button>
              <button className="btn btn-s">Save</button>
              <button className="btn btn-p">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.25485 1.51548C4.03255 1.39268 3.77812 1.34049 3.52542 1.36588C3.27273 1.39127 3.03377 1.49303 2.84035 1.65761C2.64692 1.82219 2.50822 2.04178 2.4427 2.28715C2.37723 2.53235 2.38812 2.79215 2.4736 3.03111L4.95804 10.0001L2.47328 16.9699C2.38793 17.2087 2.37726 17.4679 2.4427 17.713C2.50822 17.9583 2.64692 18.1779 2.84035 18.3425C3.03377 18.5071 3.27273 18.6088 3.52542 18.6342C3.77812 18.6596 4.03255 18.6074 4.25485 18.4846L17.4505 11.0938L17.4522 11.0929C17.6468 10.9848 17.8091 10.8267 17.9221 10.6349C18.0355 10.4425 18.0954 10.2233 18.0954 10.0001C18.0954 9.77677 18.0355 9.55756 17.9221 9.36521C17.8091 9.17341 17.6468 9.0153 17.4522 8.90723L17.4505 8.9063L4.25804 1.51725L4.25485 1.51548ZM16.8425 9.99847L17.1479 9.45318L16.8454 10.0001L16.8425 10.0016L3.65039 17.3905L6.06228 10.6251H10.6245C10.9697 10.6251 11.2495 10.3452 11.2495 10.0001C11.2495 9.65487 10.9697 9.37505 10.6245 9.37505H6.06228L3.6507 2.61049L3.65039 2.60962L16.8425 9.99847Z" fill="currentColor"/>
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <PageHeader invoice={invoice} jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} onClose={leaveInvoice} flush={showInvoiceAsModal} />
      )}

      {useTabsLayout ? (
        <>
          {showInvoiceAsModal && (
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--g200)', flexShrink: 0 }}>
              {renderDetailsTabs()}
            </div>
          )}

          {modalDetailsTab === 'details' ? (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className={"builder builder-full" + (isFullPageInvoice ? ' builder-flush' : '')} style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
                {renderDetailsForm()}
              </div>

              {(estModalOpen || selV5ModalOpen || selV2on3ModalOpen || addAllModalOpen || addAllV2ModalOpen || costsModalOpen) && (
                <div style={{
                  // Default sizing is responsive; dragging the divider pins a px width.
                  // minWidth keeps the panel readable when the window gets narrow, and
                  // maxWidth stops it (pinned or not) from crushing the invoice form —
                  // whichever the window allows, the panel's own content scrolls.
                  width: dockedPanelWidth ?? 'clamp(560px, 52vw, 1200px)',
                  minWidth: 'min(100%, 440px)',
                  maxWidth: 'max(min(100%, 440px), calc(100% - 320px))',
                  flexShrink: 0,
                  borderLeft: '1px solid var(--g200)', background: 'white',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
                }}>
                  {/* Drag the divider to widen / narrow the panel. */}
                  <div
                    onMouseDown={startDockedPanelDrag}
                    onDoubleClick={() => setDockedPanelWidth(null)}
                    title="Drag to resize · double-click to reset"
                    style={{ position: 'absolute', left: -4, top: 0, bottom: 0, width: 9, cursor: 'col-resize', zIndex: 20 }}
                  >
                    <div style={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)', width: 3, height: 46, borderRadius: 2, background: 'var(--g300)' }} />
                  </div>
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
                      onAddSelections={handleAddFromSelections}
                      addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
                    />
                  )}
                  {addAllV2ModalOpen && (
                    <AddFromAllModal
                      variant="panel"
                      includeCosts
                      open={addAllV2ModalOpen}
                      onClose={() => setAddAllV2ModalOpen(false)}
                      onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
                      onAddSelections={handleAddFromSelections}
                      addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
                    />
                  )}
                  {costsModalOpen && (
                    <CostsModal
                      variant="panel"
                      open={costsModalOpen}
                      onClose={() => setCostsModalOpen(false)}
                      onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
                      jobName={currentJob?.name}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 24, background: 'var(--g50)' }}>
                {!showProgressClientPreview && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    {!customizePanelOpen && (
                      <button type="button" className="btn btn-s" onClick={() => setCustomizePanelOpen(true)}>
                        Customize
                      </button>
                    )}
                  </div>
                )}
                {showProgressClientPreview ? (
                  <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                    <AiaPreview job={currentJobWithOverrides} />
                  </div>
                ) : (
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
                )}
              </div>

              {!showProgressClientPreview && customizePanelOpen && (
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
                ? <LineItemsV2 invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} stackView={stackView} onStackViewChange={setStackView} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelV2ModalOpen(true)} onOpenSelections2={() => setSelV4ModalOpen(true)} onOpenSelections2b={() => setSelV5ModalOpen(true)} onOpenSelections3={() => setSelV2on3ModalOpen(true)} onOpenAll={() => setAddAllModalOpen(true)} onOpenAll2={() => setAddAllV2ModalOpen(true)} onOpenCosts={() => setCostsModalOpen(true)} billingModel={billingModel} notice={invoice.mode === 'lineItems' ? prefillNotice : undefined} />
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

      {!isFullPageInvoice && (
        <div className="bbar" style={useTabsLayout ? { background: 'var(--g50)', boxShadow: '0 -1px 0 var(--g200)' } : undefined}>
          <button className="btn btn-s" onClick={() => { setInvoice(defaultInvoice); setAutoFilledDraw(null); setReimaginedKind(null); if (useTabsLayout) setActivePage('owner-invoices'); }}>Cancel</button>
          {isInvoiceV2Like && !isNarrow && !useTabsLayout && (
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
      )}
    </>
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <TopNav onNavigate={(page) => {
        // Both demo presentations show the same plain invoice. Plain "Invoice"
        // resets to a blank one so it never inherits the demo content (or a
        // progress invoice loaded by an earlier flow).
        if (page === 'invoice-3-modal' || page === 'invoice-full-page') setInvoice(DEMO_INVOICE);
        else if (page === 'invoice-full-page-reimagined') {
          // Start this one at the decision point with a blank invoice, since
          // picking a billing type is the first step of the flow.
          setInvoice(defaultInvoice);
          setReimaginedKind(null);
        }
        else if (page === 'invoice-3') setInvoice(defaultInvoice);
        setActivePage(page as PageType);
      }} />
      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} onOpenJobDetails={(id) => { setJobDetailsReturnPage(activePage); setSelectedJob(id); setActivePage('job-details'); }} />
        <div className="content-area" style={useTabsLayout ? {overflowY: 'auto'} : undefined}>
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
        <div className="modal-backdrop" onClick={leaveInvoice}>
          {/* maxHeight overrides .est-modal's 88vh cap, which would otherwise
              win over the height below and keep the modal short. */}
          <div className="est-modal" style={{height: '98vh', maxHeight: '98vh', width: '99vw', maxWidth: 2400}} onClick={e => e.stopPropagation()}>
            {renderInvoiceBuilder()}
          </div>
        </div>
      )}
      <EstimateModal
        open={estModalOpen && !useTabsLayout}
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
        open={selV5ModalOpen && isInvoice3Family && !useTabsLayout}
        onClose={() => setSelV5ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        targetInvoice={wizardTargetInvoice}
        newInvoiceType={invoice.type ?? 'invoice'}
      />
      <SelectionsModalV2
        open={selV2on3ModalOpen && isInvoice3Family && !useTabsLayout}
        onClose={() => setSelV2on3ModalOpen(false)}
        onAdd={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
        data={selection3Data}
      />
      <AddFromAllModal
        open={addAllModalOpen && isInvoice3Family && !useTabsLayout}
        onClose={() => setAddAllModalOpen(false)}
        onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
        onAddSelections={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
      />
      <AddFromAllModal
        includeCosts
        open={addAllV2ModalOpen && isInvoice3Family && !useTabsLayout}
        onClose={() => setAddAllV2ModalOpen(false)}
        onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
        onAddSelections={handleAddFromSelections}
        addedChildIds={invoice.lineItems.flatMap(li => li.relatedItem?.childIds ?? [])}
      />
      <CostsModal
        open={costsModalOpen && isInvoice3Family && !useTabsLayout}
        onClose={() => setCostsModalOpen(false)}
        onAdd={(items) => setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...items] }))}
        jobName={currentJob?.name}
      />
    </div>
  );
}
