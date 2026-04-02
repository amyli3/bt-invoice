import { useState, useEffect } from 'react';
import { Invoice, ColumnVisibility, ClientColumnVisibility } from './types';
import { defaultInvoice } from './mockData';
import TopNav from './components/TopNav';
import JobSidebar from './components/JobSidebar';
import PageHeader from './components/PageHeader';
import InvoiceInfo from './components/InvoiceInfo';
import OwnerPrice from './components/OwnerPrice';
import LineItems from './components/LineItems';
import Notes from './components/Notes';
import PaymentHistory from './components/PaymentHistory';
import ClientPreview from './components/ClientPreview';
import EmailPreview from './components/EmailPreview';
import ClientColumnToggle from './components/ClientColumnToggle';
import EstimateModal from './components/EstimateModal';
import SelectionsModal from './components/SelectionsModal';
import SelectionsModalV2 from './components/SelectionsModalV2';
import JobPriceSummary from './components/JobPriceSummary';
import SelectionsPage from './components/SelectionsPage';
import OptionDetailPage from './components/OptionDetailPage';
import { JOBS } from './mockData';
import { getNextId } from './mockData';

export default function App() {
  const [invoice, setInvoice] = useState<Invoice>(defaultInvoice);
  const [jobOpen, setJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(1);
  const [activePage, setActivePage] = useState<'invoice' | 'job-price-summary' | 'selections' | 'option-detail'>('invoice');
  const [selectedOption, setSelectedOption] = useState<{ name: string; category: string; price: number; allowanceName?: string; status: string } | null>(null);
  const [activeView, setActiveView] = useState<'builder' | 'preview'>('builder');
  const [previewTab, setPreviewTab] = useState<'client' | 'email'>('client');

  const [vis, setVis] = useState<ColumnVisibility>({
    items: true, costType: true, unitCost: true, quantity: true,
    unit: true, builderCost: true, markup: true, clientPrice: true, tax: true, bill: false,
  });

  const [clientVis, setClientVis] = useState<ClientColumnVisibility>({
    costType: false, quantity: true, unit: false, unitPrice: true,
  });

  const [estModalOpen, setEstModalOpen] = useState(false);
  const [selModalOpen, setSelModalOpen] = useState(false);
  const [selV2ModalOpen, setSelV2ModalOpen] = useState(false);
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
  const handleAddFromSelections = (items: any[]) => {
    const newItems: any[] = [];
    items.forEach((group: any) => {
      if (group.children && group.children.length > 0) {
        group.children.forEach((child: any) => {
          const isAllowanceLine = child.selection === 'Allowance';
          newItems.push({
            id: getNextId(),
            description: child.lineItem,
            costCode: child.costCode,
            costType: isAllowanceLine ? 'Allowance' : 'Selection',
            unitCost: child.newInvoiceAmt ?? child.price,
            quantity: 1,
            unit: '--',
            markup: 0,
            relatedItem: {
              type: isAllowanceLine ? 'allowance' as const : 'selection' as const,
              name: isAllowanceLine ? group.name : child.selection,
              groupId: group.id,
            },
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

  if (activePage === 'option-detail') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as any)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <div className="content-area">
            <OptionDetailPage onBack={() => { setActivePage(selectedOption ? 'job-price-summary' : 'selections'); setSelectedOption(null); }} selectionData={selectedOption} />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'selections') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as any)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} />
          <div className="content-area">
            <SelectionsPage jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} onOpenOption={() => setActivePage('option-detail')} />
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'job-price-summary') {
    return (
      <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <TopNav onNavigate={(page) => setActivePage(page as any)} />
        <div style={{display: 'flex', flex: 1, minHeight: 0}}>
          <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} />
          <div className="content-area">
            <JobPriceSummary jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} onOpenSelection={(sel) => { setSelectedOption(sel); setActivePage('option-detail'); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <TopNav onNavigate={(page) => setActivePage(page as any)} />
      <div style={{display: 'flex', flex: 1, minHeight: 0}}>
        <JobSidebar open={jobOpen} onToggle={() => setJobOpen(false)} selectedJob={selectedJob} onSelectJob={(id) => { setSelectedJob(id); if (isNarrow) setJobOpen(false); }} />
        <div className="content-area">
          <PageHeader invoice={invoice} jobOpen={jobOpen} onToggleJob={() => setJobOpen(true)} />

          <div className="view-toggle">
            <div className="tabs">
              <button className={"tab" + (activeView === 'builder' ? ' on' : '')} onClick={() => setActiveView('builder')}>Builder</button>
              <button className={"tab" + (activeView === 'preview' ? ' on' : '')} onClick={() => setActiveView('preview')}>Preview</button>
            </div>
          </div>

          <div className="split">
            <div className="builder" style={isNarrow && activeView !== 'builder' ? {display: 'none'} : {}}>
              <InvoiceInfo invoice={invoice} onChange={setInvoice} />
              <OwnerPrice invoice={invoice} onChange={setInvoice} />
              {invoice.mode === 'lineItems' && <LineItems invoice={invoice} onChange={setInvoice} vis={vis} onVisChange={setVis} onOpenEstimate={() => setEstModalOpen(true)} onOpenSelections={() => setSelModalOpen(true)} onOpenSelectionsV2={() => setSelV2ModalOpen(true)} />}
              <Notes invoice={invoice} onChange={setInvoice} />
              <PaymentHistory invoice={invoice} onChange={setInvoice} />
            </div>
            <div className="preview" style={{...(isNarrow && activeView !== 'preview' ? {display: 'none'} : {}), padding: 0, display: isNarrow && activeView !== 'preview' ? 'none' : 'flex', flexDirection: 'column'}}>
              <div className="preview-tabs">
                <div className="preview-tabs-left">
                  <button className={"preview-tab" + (previewTab === 'client' ? ' on' : '')} onClick={() => setPreviewTab('client')}>Client preview</button>
                  <button className={"preview-tab" + (previewTab === 'email' ? ' on' : '')} onClick={() => setPreviewTab('email')}>Email preview</button>
                </div>
                <div className="preview-tabs-right">
                  {previewTab === 'client' && (
                    <ClientColumnToggle columns={clientVis} onChange={setClientVis} />
                  )}
                </div>
              </div>
              <div style={{flex: 1, overflowY: 'auto', padding: 24, background: 'var(--g50)'}}>
                {previewTab === 'client' && <ClientPreview invoice={invoice} clientVis={clientVis} />}
                {previewTab === 'email' && <EmailPreview invoice={invoice} />}
              </div>
            </div>
          </div>

          <div className="bbar">
            <button className="btn btn-s">Cancel</button>
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
      />
      <SelectionsModalV2
        open={selV2ModalOpen}
        onClose={() => setSelV2ModalOpen(false)}
        onAdd={handleAddFromSelections}
        jobName={currentJob?.name || 'Job name'}
        addedGroupIds={invoice.lineItems.filter(li => li.relatedItem?.groupId).map(li => li.relatedItem!.groupId)}
      />
    </div>
  );
}
