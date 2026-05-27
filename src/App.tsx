import { useState, useEffect } from 'react';
import { Invoice, ColumnVisibility, ClientColumnVisibility } from './types';
import { defaultInvoice } from './mockData';
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
import EstimateModal from './components/EstimateModal';
import SelectionsModal from './components/SelectionsModal';
import SelectionsModalV2 from './components/SelectionsModalV2';
import JobPriceSummary from './components/JobPriceSummary';
import SelectionsPage from './components/SelectionsPage';
import OptionDetailPage from './components/OptionDetailPage';
import AIAPayApp, { type OverageInfo } from './components/AIAPayApp';
import { INVOICE_SELECTION_SCENARIOS, INVOICE_STANDALONE_SELECTIONS } from './selectionsData';
import ChangeOrderPage from './components/ChangeOrderPage';
import ChangeOrderListPage from './components/ChangeOrderListPage';
import EstimatePage from './components/EstimatePage';
import ClientSelections from './components/ClientSelections';
import ClientSelections2 from './components/ClientSelections2';
import ClientSelections3 from './components/ClientSelections3';
import ClientPortal, { ClientTopNav } from './components/ClientPortal';
import MobileBudget from './components/MobileBudget';
import JobCostingBudget from './components/JobCostingBudget';
import UnderageFlows from './components/UnderageFlows';
import { JOBS } from './mockData';
import { getNextId } from './mockData';

type PageType = 'invoice' | 'invoice-2' | 'job-price-summary' | 'selections' | 'option-detail' | 'progress-invoice' | 'change-order' | 'change-order-list' | 'client-portal' | 'client-jps' | 'estimate' | 'client-selections' | 'client-selections-2' | 'client-selections-3' | 'mobile-budget' | 'job-costing-budget' | 'underage-flows';

const validPages: PageType[] = ['invoice', 'invoice-2', 'job-price-summary', 'selections', 'option-detail', 'progress-invoice', 'change-order', 'change-order-list', 'client-portal', 'client-jps', 'estimate', 'client-selections', 'client-selections-2', 'client-selections-3', 'mobile-budget', 'job-costing-budget', 'underage-flows'];

function getInitialPage(): PageType {
  // Support ?page=X query param (used when hash is occupied by Figma capture)
  const params = new URLSearchParams(window.location.search);
  const qPage = params.get('page');
  if (qPage && validPages.includes(qPage as PageType)) return qPage as PageType;
  const hash = window.location.hash.replace('#', '').split('&')[0];
  if (validPages.includes(hash as PageType)) return hash as PageType;
  return 'invoice';
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

  const [vis, setVis] = useState<ColumnVisibility>({
    items: true, costType: true, unitCost: true, quantity: true,
    unit: true, builderCost: true, markup: true, clientPrice: true, tax: true, bill: false,
  });

  const [clientVis, setClientVis] = useState<ClientColumnVisibility>({
    costType: false, quantity: true, unit: false, unitPrice: true,
  });
  const [clientGroupBy, setClientGroupBy] = useState<'estimate' | 'costcode' | 'all'>('estimate');

  const [estModalOpen, setEstModalOpen] = useState(false);
  const [selModalOpen, setSelModalOpen] = useState(false);
  const [selV2ModalOpen, setSelV2ModalOpen] = useState(false);
  const [completedAllowanceIds, setCompletedAllowanceIds] = useState<Set<string>>(new Set());
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
    const isComplete = ma.closeoutMode === 'credit' || completedAllowanceIds.has(ma.id);
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

  const handleAddFromSelections = (items: any[]) => {
    const newItems: any[] = [];
    items.forEach((group: any) => {
      if (group.children && group.children.length > 0) {
        group.children.forEach((child: any) => {
          // Skip any row whose new-invoice amount is null — informational rows
          // not billable on this invoice (e.g., already-invoiced selections,
          // unbilled allowance placeholders).
          if (child.newInvoiceAmt === null) return;
          const isAllowanceLine = child.selection === 'Allowance';
          newItems.push({
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
            },
            // Preserve the wizard's breakdown so the invoice can expand the line.
            ...(child.rolledUp ? { rolledUp: child.rolledUp } : {}),
          });
        });
      } else {
        newItems.push({
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
    if (newItems.length > 0) {
      setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...newItems] }));
    }
  };
  const currentJob = JOBS.find(j => j.id === selectedJob);

  // Build the data shape consumed by both SelectionsModal (V1) and
  // SelectionsModalV2 — keeps the per-scenario math in one place.
  const selectionsModalData = INVOICE_SELECTION_SCENARIOS.map(ma => {
    const selectionsTotal = ma.selections.reduce((s, sel) => s + sel.approvedPrice, 0);
    const billableSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? 0 : sel.approvedPrice), 0);
    const invoicedSelectionsTotal = ma.selections.reduce((s, sel) => s + (sel.status === 'invoiced' ? sel.approvedPrice : 0), 0);
    const notPreviouslyInvoiced = ma.previouslyInvoiced === 0;
    const anyInvoicedSelection = ma.selections.some(s => s.status === 'invoiced');
    const markedComplete = ma.closeoutMode === 'credit' || completedAllowanceIds.has(ma.id);

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
          <JobPriceSummary jobOpen={false} onBack={() => setActivePage('client-portal')} onOpenSelection={(sel) => { setSelectedOption(sel); setOptionOpenedFrom('client-jps'); setActivePage('option-detail'); }} onOpenJCB={() => setActivePage('job-costing-budget')} />
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
            onApprove={() => {
              if (selectedCOId === 'co-3') {
                // Budget reallocation CO
                const newIds = ['co-3a', 'co-3b'].filter(id => !addedCOIds.includes(id));
                if (newIds.length > 0) {
                  setApprovedCOIds(prev => [...prev, ...newIds]);
                  setAddedCOIds(prev => [...prev, ...newIds]);
                }
              } else {
                const coMap: Record<string, string> = { '4100': 'co-1', '6100': 'co-2' };
                const newIds = currentOverages
                  .map(o => coMap[o.costCode])
                  .filter((id): id is string => !!id && !addedCOIds.includes(id));
                if (newIds.length > 0) {
                  setApprovedCOIds(prev => [...prev, ...newIds]);
                  setAddedCOIds(prev => [...prev, ...newIds]);
                }
              }
            }}
          />
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
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
          <div className="content-area">
            <EstimatePage jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} />
          </div>
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
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
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
              onInvoiceSelected={(ids, _target) => {
                // Map selected row IDs from the grid to invoice line items.
                // Allowance rows match by group.id; selection/standalone rows
                // match by child.id. Skip rows that aren't billable
                // (already-invoiced selections, pre-invoiced allowance lines).
                const idSet = new Set(ids);
                const newItems = selectionsModalData.flatMap(group =>
                  group.children
                    .filter(child => {
                      if (child.newInvoiceAmt === null) return false;
                      if (child.selection === 'Allowance') return idSet.has(group.id);
                      return idSet.has(child.id);
                    })
                    .map(child => {
                      const isAllowanceLine = child.selection === 'Allowance';
                      return {
                        id: getNextId(),
                        description: child.lineItem,
                        costCode: child.costCode,
                        costType: isAllowanceLine ? 'Allowance' : (child.costType || 'Selection'),
                        unitCost: child.price,
                        quantity: 1,
                        unit: '--',
                        markup: 0,
                        relatedItem: {
                          type: isAllowanceLine ? 'allowance' as const : 'selection' as const,
                          name: isAllowanceLine ? group.name : child.selection,
                          groupId: group.id,
                        },
                      };
                    }),
                );
                if (newItems.length > 0) {
                  setInvoice(inv => ({ ...inv, lineItems: [...inv.lineItems, ...newItems] }));
                }
                setActivePage('invoice-2');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'mobile-budget') {
    return <MobileBudget onBack={() => setActivePage('invoice')} />;
  }

  if (activePage === 'underage-flows') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
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
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
          <div className="content-area" style={{overflowY: 'auto'}}>
            <JobCostingBudget onBack={() => setActivePage('invoice')} onOpenJPS={() => setActivePage('job-price-summary')} />
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
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
          <div className="content-area">
            <JobPriceSummary jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} onOpenSelection={(sel) => { setSelectedOption(sel); setOptionOpenedFrom('job-price-summary'); setActivePage('option-detail'); }} onOpenJCB={() => setActivePage('job-costing-budget')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <TopNav onNavigate={(page) => setActivePage(page as PageType)} />
      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} onHomeClick={() => setActivePage('client-portal')} />
        <div className="content-area">
          <PageHeader invoice={invoice} jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} />

          <div className="view-toggle">
            <div className="tabs">
              <button className={"tab" + (activeView === 'builder' ? ' on' : '')} onClick={() => setActiveView('builder')}>Builder</button>
              <button className={"tab" + (activeView === 'preview' ? ' on' : '')} onClick={() => setActiveView('preview')}>Preview</button>
            </div>
          </div>

          <div className="split">
            <div
              className={"builder" + (previewHidden && activePage === 'invoice-2' && !isNarrow ? ' builder-full' : '')}
              style={isNarrow && activeView !== 'builder' ? {display: 'none'} : {}}
            >
              <InvoiceInfo invoice={invoice} onChange={setInvoice} />
              <OwnerPrice invoice={invoice} onChange={setInvoice} />
              {invoice.mode === 'lineItems' && (activePage === 'invoice-2'
                ? <LineItemsV2 invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelV2ModalOpen(true)} />
                : <LineItems invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelModalOpen(true)} />)}
              <Notes invoice={invoice} onChange={setInvoice} />
            </div>
            <div className="preview" style={{
              ...(isNarrow && activeView !== 'preview' ? {display: 'none'} : {}),
              padding: 0,
              display: (isNarrow && activeView !== 'preview') || (previewHidden && activePage === 'invoice-2' && !isNarrow) ? 'none' : 'flex',
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
                      {activePage === 'invoice-2' && (
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
                {previewTab === 'client' && <ClientPreview invoice={invoice} clientVis={clientVis} groupBy={activePage === 'invoice-2' ? clientGroupBy : 'estimate'} />}
                {previewTab === 'email' && <EmailPreview invoice={invoice} />}
              </div>
            </div>
          </div>

          <div className="bbar">
            <button className="btn btn-s" onClick={() => setInvoice(defaultInvoice)}>Cancel</button>
            {activePage === 'invoice-2' && !isNarrow && (
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
        </div>
      </div>
      <EstimateModal
        open={estModalOpen}
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
        heldUnderages={activePage === 'invoice-2' ? heldUnderages : []}
        onApplyReallocation={activePage === 'invoice-2' ? handleApplyReallocation : undefined}
        showNegativeBalances
        data={selectionsModalData}
      />
      <SelectionsModalV2
        open={selV2ModalOpen}
        onClose={() => setSelV2ModalOpen(false)}
        onAdd={handleAddFromSelections}
        jobName={currentJob?.name || 'Job name'}
        addedGroupIds={invoice.lineItems.filter(li => li.relatedItem?.groupId).map(li => li.relatedItem!.groupId)}
        data={selectionsModalData}
      />
    </div>
  );
}
