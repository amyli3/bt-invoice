import { useState } from 'react';
import InvoicesSettingsModal, { type DefaultInvoiceKind } from './InvoicesSettingsModal';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

const s = { stroke: 'currentColor', strokeWidth: 1.4, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONS: Record<string, React.ReactNode> = {
  logo: <Icon><path d="M9 1.5l2 1.2 2.3-.3 1 2.1 2.1 1-.3 2.3 1.2 2-1.2 2 .3 2.3-2.1 1-1 2.1-2.3-.3-2 1.2-2-1.2-2.3.3-1-2.1-2.1-1 .3-2.3-1.2-2 1.2-2-.3-2.3 2.1-1 1-2.1 2.3.3 2-1.2z" {...s} /><circle cx="9" cy="9" r="2.6" {...s} /></Icon>,
  info: <Icon><circle cx="9" cy="9" r="6.75" {...s} /><path d="M9 8.25v4.5M9 5.75v.1" {...s} /></Icon>,
  layers: <Icon><rect x="3.5" y="3.5" width="8" height="8" rx="1" {...s} /><rect x="6.5" y="6.5" width="8" height="8" rx="1" {...s} /></Icon>,
  clipboard: <Icon><rect x="3.5" y="3" width="11" height="13" rx="1.5" {...s} /><path d="M6.5 2.5h5v2h-5z" {...s} /><path d="M6 8h6M6 11h6M6 14h4" {...s} /></Icon>,
  lock: <Icon><rect x="4" y="8" width="10" height="7.5" rx="1.5" {...s} /><path d="M6 8V6a3 3 0 0 1 6 0v2" {...s} /></Icon>,
  idcard: <Icon><circle cx="9" cy="6.5" r="6" {...s} /><path d="M4.5 14.8c1-1.6 2.6-2.5 4.5-2.5s3.5.9 4.5 2.5" {...s} /></Icon>,
  edit: <Icon><path d="M11.5 2.7l3.8 3.8L6 15.8l-4 .8.8-4z" {...s} /></Icon>,
  calendar: <Icon><rect x="3" y="3.5" width="12" height="12" rx="1.5" {...s} /><path d="M6 2.5v2M12 2.5v2M3 7h12" {...s} /></Icon>,
  daily: <Icon><rect x="3.5" y="2.5" width="11" height="13" rx="1.5" {...s} /><path d="M6 6h6M6 9h6M6 12h4" {...s} /></Icon>,
  swap: <Icon><path d="M4 6.5h9M10 3.5l3 3-3 3" {...s} /><path d="M14 11.5H5M8 8.5l-3 3 3 3" {...s} /></Icon>,
  shield: <Icon><path d="M9 2.2l5.5 2v4c0 4-2.3 6.9-5.5 7.8-3.2-.9-5.5-3.8-5.5-7.8v-4z" {...s} /><path d="M6.5 9.2l1.7 1.7 3.3-3.6" {...s} /></Icon>,
  clock: <Icon><circle cx="9" cy="9" r="6.75" {...s} /><path d="M9 5.5V9l2.7 1.6" {...s} /></Icon>,
  umbrella: <Icon><path d="M2.7 8.5a6.3 6.3 0 0 1 12.6 0z" {...s} /><path d="M9 8.5v6.2a1.6 1.6 0 0 1-3.2 0M9 2v.5" {...s} /></Icon>,
  compass: <Icon><circle cx="9" cy="9" r="6.75" {...s} /><path d="M11.5 6.5L10 10l-3.5 1.5L8 8z" {...s} /></Icon>,
  file: <Icon><path d="M5.5 2.5h5l3 3v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z" {...s} /><path d="M10.5 2.5v3h3" {...s} /></Icon>,
  survey: <Icon><rect x="3.5" y="3" width="11" height="13" rx="1.5" {...s} /><path d="M6.5 2.5h5v2h-5z" {...s} /><path d="M6.3 8.3l1 1 2-2.2" {...s} /><path d="M6.3 12.3l1 1 2-2.2" {...s} /></Icon>,
  question: <Icon><path d="M3 4h9.5a2.5 2.5 0 0 1 0 5H8l-2.5 2.5V9H3z" {...s} /><path d="M7 6.3c0-.8.7-1.3 1.5-1.3s1.5.5 1.5 1.2c0 .9-1.5.9-1.5 2" {...s} /></Icon>,
  tag: <Icon><path d="M8.5 2.5H14v5.5L8.2 14a1.5 1.5 0 0 1-2.1 0l-3.6-3.6a1.5 1.5 0 0 1 0-2.1z" {...s} /><circle cx="10.8" cy="5.2" r="1" fill="currentColor" stroke="none" /></Icon>,
  book: <Icon><path d="M9 4.5c-1.2-1-3-1.3-6-1v10.5c3 -.3 4.8 0 6 1 1.2-1 3-1.3 6-1V3.5c-3-.3-4.8 0-6 1z" {...s} /><path d="M9 4.5v10.5" {...s} /></Icon>,
  bids: <Icon><path d="M5.5 2.5h5l3 3v10a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z" {...s} /><path d="M7 8h4M7 11h4M7 5.3l1.3 1.3L11 4" {...s} /></Icon>,
  calc: <Icon><rect x="4" y="2.5" width="10" height="13" rx="1.5" {...s} /><path d="M6 5.5h6M6.3 9h1.4M6.3 11.5h1.4M8.7 9h1.4M8.7 11.5h1.4M11.1 9v4" {...s} /></Icon>,
  budget: <Icon><path d="M4 3.5h10v11H4z" {...s} /><path d="M6.5 6.5h5M6.5 9h5M6.5 11.5h3" {...s} /></Icon>,
  invoice: <Icon><path d="M3.5 3h11v12l-2-1.3-1.8 1.3-1.7-1.3-1.8 1.3-1.7-1.3-2 1.3z" {...s} /><path d="M6 6.5h6M6 9h6M6 11.5h3.5" {...s} /></Icon>,
  card: <Icon><rect x="2.5" y="4.5" width="13" height="9" rx="1.5" {...s} /><path d="M2.5 7.5h13" {...s} /><path d="M5 11h2.5" {...s} /></Icon>,
  percent: <Icon><circle cx="5.5" cy="5.5" r="2" {...s} /><circle cx="12.5" cy="12.5" r="2" {...s} /><path d="M13.5 4.5L4.5 13.5" {...s} /></Icon>,
  rolemgmt: <Icon><circle cx="9" cy="6.7" r="2.7" {...s} /><path d="M4.2 14.8c1.1-2 2.7-3 4.8-3s3.7 1 4.8 3" {...s} /><path d="M13.2 4.3a1.7 1.7 0 1 1 0 3" {...s} /></Icon>,
  users: <Icon><circle cx="6.7" cy="6.5" r="2.4" {...s} /><circle cx="12.2" cy="7.2" r="1.9" {...s} /><path d="M2.3 14.6c.9-2.1 2.4-3.3 4.4-3.3s3.5 1.2 4.4 3.3" {...s} /><path d="M11.3 11.6c1.6.2 2.7 1.3 3.4 3" {...s} /></Icon>,
  home: <Icon><path d="M3 8.5L9 3l6 5.5" {...s} /><path d="M4.5 7.5V15h9V7.5" {...s} /><path d="M7.3 15v-4h3.4v4" {...s} /></Icon>,
  wrench: <Icon><path d="M11.7 3.3a3.3 3.3 0 0 0-4.3 4l-5 5 2.3 2.3 5-5a3.3 3.3 0 0 0 4-4.3l-2 2-1.7-1.7z" {...s} /></Icon>,
};

interface SettingItem {
  key: string;
  icon: keyof typeof ICONS;
  label: string;
}

interface SettingCard {
  title: string;
  items: SettingItem[];
}

const COLUMNS: SettingCard[][] = [
  [
    { title: 'Boogie Construction', items: [
      { key: 'logo', icon: 'logo', label: 'Company logo' },
      { key: 'info', icon: 'info', label: 'Company information' },
      { key: 'subs', icon: 'layers', label: 'Subscriptions' },
      { key: 'jobs', icon: 'clipboard', label: 'Jobs' },
    ] },
    { title: 'Client settings', items: [
      { key: 'perms', icon: 'lock', label: 'Default job permissions' },
    ] },
    { title: 'Sales', items: [
      { key: 'sales', icon: 'idcard', label: 'Sales' },
      { key: 'leadgen', icon: 'edit', label: 'Lead Generation' },
    ] },
  ],
  [
    { title: 'Project management', items: [
      { key: 'schedule', icon: 'calendar', label: 'Schedule' },
      { key: 'dailylogs', icon: 'daily', label: 'Daily Logs' },
      { key: 'co', icon: 'swap', label: 'Change Orders' },
      { key: 'warranty', icon: 'shield', label: 'Warranty' },
      { key: 'timeclock', icon: 'clock', label: 'Time Clock' },
      { key: 'risk', icon: 'umbrella', label: 'Risk insurance' },
      { key: 'clientupdates', icon: 'compass', label: 'Client Updates' },
    ] },
    { title: 'Files', items: [
      { key: 'files', icon: 'file', label: 'Files' },
    ] },
  ],
  [
    { title: 'Messaging', items: [
      { key: 'surveys', icon: 'survey', label: 'Surveys' },
      { key: 'rfis', icon: 'question', label: 'RFIs' },
    ] },
  ],
  [
    { title: 'Financials', items: [
      { key: 'costcodes', icon: 'tag', label: 'Cost codes' },
      { key: 'catalog', icon: 'book', label: 'Catalog' },
      { key: 'bids', icon: 'bids', label: 'Bids' },
      { key: 'estimates', icon: 'calc', label: 'Estimates' },
      { key: 'bills', icon: 'budget', label: 'Bills / POs / Budget' },
      { key: 'invoices', icon: 'invoice', label: 'Invoices' },
      { key: 'payments', icon: 'card', label: 'Online Payments' },
      { key: 'taxes', icon: 'percent', label: 'Taxes' },
    ] },
  ],
  [
    { title: 'Directory', items: [
      { key: 'rolemgmt', icon: 'rolemgmt', label: 'Role management' },
      { key: 'internalusers', icon: 'users', label: 'Internal users' },
      { key: 'clientcontacts', icon: 'home', label: 'Client contacts' },
      { key: 'subsvendors', icon: 'wrench', label: 'Subs/vendors' },
    ] },
  ],
];

const INTEGRATIONS: { key: string; label: string; bg: string; fg: string; glyph: string }[] = [
  { key: 'takeoff', label: 'Buildertrend Takeoff', bg: '#e8f1fc', fg: '#0065db', glyph: 'b' },
  { key: 'lowes', label: "Lowe's PRO", bg: '#00259e', fg: '#ffffff', glyph: 'L' },
  { key: 'homedepot', label: 'The Home Depot', bg: '#f96302', fg: '#ffffff', glyph: 'H' },
  { key: 'gusto', label: 'Gusto', bg: '#fef0e6', fg: '#f45d48', glyph: 'g' },
  { key: 'hubspot', label: 'HubSpot', bg: '#fff2ec', fg: '#ff7a59', glyph: 'H' },
  { key: 'salesforce', label: 'Salesforce', bg: '#e8f3fd', fg: '#00a1e0', glyph: 'S' },
  { key: 'pipedrive', label: 'Pipedrive', bg: '#e6f4ea', fg: '#26825a', glyph: 'P' },
  { key: 'marketplace', label: 'Buildertrend Marketplace', bg: '#f1f3f5', fg: '#4b5563', glyph: '🛒' },
];

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--g100)', borderRadius: 10,
      boxShadow: '0 1px 2px rgba(16,24,40,0.04)', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 18px 10px', fontSize: 16, fontWeight: 700, color: 'var(--g800)' }}>{title}</div>
      <div style={{ paddingBottom: 6 }}>{children}</div>
    </div>
  );
}

function SettingsRow({ icon, label, onClick }: SettingItem & { onClick?: () => void }) {
  return (
    <button
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 18px', border: 'none', background: 'none', textAlign: 'left',
        fontSize: 14, color: 'var(--g700)', cursor: 'pointer', fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--g50)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
      onClick={onClick}
    >
      <span style={{ display: 'flex', color: 'var(--g600)' }}>{ICONS[icon]}</span>
      {label}
    </button>
  );
}

interface Props {
  defaultInvoiceKind?: DefaultInvoiceKind;
  onDefaultInvoiceKindChange?: (kind: DefaultInvoiceKind) => void;
}

export default function CompanySettingsPage({ defaultInvoiceKind, onDefaultInvoiceKindChange }: Props) {
  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false);

  return (
    <div className="bds-scope" style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#eef0f8' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '28px 32px 48px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--g800)', margin: '0 0 24px' }}>Company settings</h1>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20, alignItems: 'start',
        }}>
          {COLUMNS.map((cards, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {cards.map(card => (
                <SettingsCard key={card.title} title={card.title}>
                  {card.items.map(item => (
                    <SettingsRow
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      onClick={item.key === 'invoices' ? () => setInvoicesModalOpen(true) : undefined}
                    />
                  ))}
                </SettingsCard>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsCard title="Integrations">
              {INTEGRATIONS.map(int => (
                <button
                  key={int.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '8px 18px', border: 'none', background: 'none', textAlign: 'left',
                    fontSize: 14, color: 'var(--g700)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--g50)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    background: int.bg, color: int.fg, fontSize: 11, fontWeight: 700,
                  }}>
                    {int.glyph}
                  </span>
                  {int.label}
                </button>
              ))}
            </SettingsCard>
          </div>
        </div>
      </div>
      {invoicesModalOpen && (
        <InvoicesSettingsModal
          onClose={() => setInvoicesModalOpen(false)}
          defaultInvoiceKind={defaultInvoiceKind}
          onDefaultInvoiceKindChange={onDefaultInvoiceKindChange}
        />
      )}
    </div>
  );
}
