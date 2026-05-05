import { useState } from 'react';

// Rebar and concrete work - worker installing rebar
const imgSiteWork1 = 'https://www.fandr.com/wp-content/uploads/2025/07/Placement-and-Inspection-of-Rebar-CRSI.jpg';
// Concrete pour - truck pouring concrete
const imgSiteWork2 = 'https://www.outpostcs.com/media/images/blog/Pouring%20Concrete/pouring.png';
// Pool excavation - excavator digging a pool
const imgSiteWork3 = 'https://www.riverpoolsandspas.com/hs-fs/hubfs/Blog_Article_Pics/thumbnail_still.jpg?width=1400&height=788&name=thumbnail_still.jpg';

/* ── Tiny BDS-mimic primitives ── */

function BdsText({ size = 'normal-sm', children, className = '', style }: {
  size?: 'normal-sm' | 'normal-md' | 'normal-lg' | 'distinct-sm' | 'distinct-md' | 'distinct-lg' | 'heavy-sm' | 'heavy-md' | 'heavy-lg';
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return <span className={`bds-text bds-text-${size} ${className}`} style={style}>{children}</span>;
}

function BdsAvatar({ text, size = 'sm', colorize = 'blue' }: {
  text: string; size?: 'xs' | 'sm' | 'md' | 'lg'; colorize?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'indigo' | 'default';
}) {
  const initials = text.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className={`bds-avatar bds-avatar-${size} bds-avatar-${colorize}`}>{initials}</div>;
}

function BdsBadge({ text, displayType = 'default' }: {
  text: string; displayType?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}) {
  return <span className={`bds-badge bds-badge-${displayType}`}>{text}</span>;
}

function BdsButton({ text, displayType = 'primary', onClick }: {
  text: string; displayType?: 'primary' | 'secondary' | 'tertiary'; onClick?: () => void;
}) {
  return <button className={`bds-button bds-button-${displayType}`} onClick={onClick}>{text}</button>;
}

function BdsLink({ children, href = '#' }: { children: React.ReactNode; href?: string; }) {
  return <a className="bds-link" href={href}>{children}</a>;
}


function BdsSection({ title, slot, children }: {
  title?: string; slot?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bds-section">
      {title && (
        <div className="bds-section-header">
          <BdsText size="distinct-lg">{title}</BdsText>
          {slot && <div className="bds-section-header-slot">{slot}</div>}
        </div>
      )}
      <div className="bds-section-body">{children}</div>
    </div>
  );
}

/* ── Icon components ── */
function IconCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>;
}
function IconCreditCard() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function IconZap() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconMail() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function IconChat() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function IconChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconMapPin() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconPhone() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
}
function IconMailSmall() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

/* ── Main component ── */

const caretDown = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function ClientTopNav({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  const [finOpen, setFinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <div className="topnav">
      <div className="topnav-left">
        <button className="topnav-item">Project management {caretDown}</button>
        <button className="topnav-item">Files {caretDown}</button>
        <button className="topnav-item">Messaging {caretDown}</button>
        <div className="topnav-dropdown-wrap">
          <button className="topnav-item" onClick={() => setFinOpen(!finOpen)}>Financial {caretDown}</button>
          {finOpen && (
            <div className="topnav-dropdown">
              <button className="topnav-dropdown-item" onClick={() => { setFinOpen(false); onNavigate?.('client-selections'); }}>Selections</button>
              <button className="topnav-dropdown-item" onClick={() => { setFinOpen(false); onNavigate?.('client-selections-2'); }}>Selections (exploration)</button>
              <button className="topnav-dropdown-item" onClick={() => { setFinOpen(false); onNavigate?.('client-jps'); }}>Job price summary</button>
            </div>
          )}
        </div>
      </div>
      <div className="topnav-right">
        <div style={{position:'relative'}}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}>
            <circle cx="9" cy="9" r="5.5" stroke="#666d7c" strokeWidth="1.5"/>
            <path d="M13 13L16.5 16.5" stroke="#666d7c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input className="topnav-search" placeholder="Search" style={{paddingLeft:'32px'}} />
        </div>
        <button className="topnav-icon-btn" title="Notifications">
          <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.46934 0.00011506C10.8367 0.025573 13.5623 2.76972 13.6539 6.14562L13.6559 6.3214V6.87512C13.6559 9.17622 14.0515 10.8021 14.6715 11.8693C14.8974 12.2552 14.9003 12.7329 14.6783 13.1212C14.4734 13.4795 14.1061 13.7116 13.6979 13.7462L13.5943 13.7501H10.5465C10.5465 15.476 9.14737 16.8751 7.42149 16.8751C5.74102 16.8751 4.3704 15.5489 4.29942 13.8859L4.29649 13.7501H1.24668C0.799263 13.749 0.386604 13.5087 0.164654 13.1202C-0.0571361 12.7318 -0.0545461 12.2542 0.170513 11.8702C0.766979 10.844 1.15503 9.30549 1.18516 7.14855L1.18711 6.87512V6.25109C1.18487 4.58758 1.84694 2.99199 3.02598 1.81847C4.20522 0.644901 5.80479 -0.00998248 7.46934 0.00011506ZM5.54649 13.7501C5.54649 14.7856 6.38596 15.6251 7.42149 15.6251C8.42003 15.6251 9.23653 14.8447 9.29356 13.8605L9.29649 13.7501H5.54649ZM7.2711 1.25304C6.00917 1.29322 4.80601 1.81034 3.90782 2.70422C3.00968 3.59809 2.4872 4.7983 2.44102 6.06066L2.43711 6.25012V6.87512C2.43711 9.28646 2.02441 11.0802 1.33751 12.3448L1.24961 12.5011H13.5934L13.5055 12.3448C12.8476 11.1332 12.4415 9.43568 12.4088 7.17394L12.4059 6.87512V6.3214C12.4059 3.59902 10.2757 1.35702 7.61387 1.25402L7.45958 1.25012L7.2711 1.25304Z" fill="white"/></svg>
        </button>
        <button className="topnav-icon-btn" title="Help">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.125 0C12.6123 0 16.25 3.63769 16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0ZM8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125C15 4.32804 11.922 1.25 8.125 1.25ZM8.125 11.25C8.64277 11.25 9.0625 11.6697 9.0625 12.1875C9.0625 12.7053 8.64277 13.125 8.125 13.125C7.60723 13.125 7.1875 12.7053 7.1875 12.1875C7.1875 11.6697 7.60723 11.25 8.125 11.25ZM8.125 3.75C9.67817 3.75002 10.9373 5.00937 10.9375 6.5625C10.9375 7.84787 10.0751 8.93187 8.89746 9.26758L8.74902 9.30469L8.75 9.375C8.75 9.69539 8.50889 9.95981 8.19824 9.99609L8.125 10C7.80448 10 7.54001 9.75908 7.50391 9.44824L7.5 9.375V8.75C7.50019 8.40498 7.77994 8.125 8.125 8.125C8.98793 8.12498 9.6875 7.42543 9.6875 6.5625C9.68731 5.69973 8.98781 5.00002 8.125 5C7.29662 5 6.6184 5.64497 6.56543 6.45996L6.5625 6.5625C6.5625 6.90766 6.28266 7.18748 5.9375 7.1875C5.59232 7.1875 5.3125 6.90768 5.3125 6.5625C5.31269 5.00936 6.57182 3.75 8.125 3.75Z" fill="white"/></svg>
        </button>
        <div className="topnav-dropdown-wrap">
          <button className="topnav-icon-btn" title="Profile" onClick={() => setProfileOpen(!profileOpen)}>
            <span className="topnav-avatar">RB</span>
          </button>
          {profileOpen && (
            <div className="topnav-dropdown" style={{right: 0, left: 'auto', minWidth: 200}}>
              <div style={{padding: '10px 14px', borderBottom: '1px solid var(--g200)'}}>
                <div style={{fontWeight: 600, fontSize: 13, color: '#202227'}}>Rodger Beckett</div>
                <div style={{fontSize: 12, color: '#8E96A0'}}>Client</div>
              </div>
              <button className="topnav-dropdown-item" onClick={() => { setProfileOpen(false); onNavigate?.('client-portal'); }}>Client home</button>
              <button className="topnav-dropdown-item" onClick={() => { setProfileOpen(false); onNavigate?.('invoice'); }}>Switch to builder view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientPortal({ onNavigate }: { onNavigate?: (page: string) => void }) {
  // Project financials experimentation — companion to the JPS "Openbook" slice.
  // v1 = today's fixed-price-style baseline; v2-v4 explore open book breakdowns.
  const [clientFinVersion, setClientFinVersion] = useState<'v1' | 'v2' | 'v3' | 'v4'>('v1');
  const [finDrillOpen, setFinDrillOpen] = useState(false);
  const [finExpandOpen, setFinExpandOpen] = useState(false);

  // Mock financials — synced with JPS / Openbook so totals match across surfaces.
  // Allowance variances are intentionally NOT a separate contributor: + variances are already
  // captured inside selection impacts, and unused (− variance) allowance budget doesn't refund the client.
  const fin = {
    contractPrice: 568078,
    changeOrders: 21000,         // sum of approved COs in JPS
    selectionsApprovedImpact: 4470, // sum of approved selection impacts in JPS
    billVariance: 1800,          // sum of cost-code variances in JPS Openbook
    tax: 368.78,                 // approvedSelectionsTotal * 0.0825
    paymentsReceived: 405000,    // sum of payments in JPS
    creditMemos: 1500,           // credit memo entry in JPS
    nextPayment: 20000,
  };
  const approvedChanges = fin.changeOrders + fin.selectionsApprovedImpact + fin.billVariance;
  const currentPrice = fin.contractPrice + approvedChanges + fin.tax;
  const remainingToPay = currentPrice - fin.paymentsReceived - fin.creditMemos;
  const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <div className="cp-page">
      <ClientTopNav onNavigate={onNavigate} />

      <div className="cp-body">
        {/* Left sidebar */}
        <div className="cp-sidebar">
          <div className="cp-welcome">
            <BdsAvatar text="Rodger Beckett" size="lg" colorize="blue" />
            <BdsText size="distinct-md">Welcome, Rodger!</BdsText>
          </div>

          <select className="cp-job-select">
            <option>Johnson Residence — Full Remodel</option>
            <option>Martinez Kitchen &amp; Bath</option>
          </select>

          <div className="cp-builder-card">
            <div className="cp-builder-header">
              <svg width="160" height="35" viewBox="0 0 177 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M33.813 35.8087C33.813 37.2111 32.4073 38.178 31.0977 37.6764L19.4566 33.2181C18.0731 32.6883 17.7258 30.8906 18.8123 29.8836L22.7808 26.2054C23.499 25.5398 23.6297 24.4521 23.0895 23.6354L17.6488 15.4079C17.0052 14.4347 17.3279 13.1195 18.3489 12.5547L30.8449 5.64201C32.1779 4.90461 33.813 5.86872 33.813 7.39208L33.813 35.8087Z" fill="#697EF5"/>
                <path d="M0.0964355 2.90762C0.0964355 1.50528 1.50214 0.538366 2.81173 1.03991L14.4529 5.49821C15.8363 6.02806 16.1837 7.82572 15.0971 8.83278L11.1286 12.5109C10.4104 13.1765 10.2798 14.2642 10.8199 15.081L16.2606 23.3084C16.9042 24.2816 16.5815 25.5969 15.5605 26.1617L3.06456 33.0743C1.73156 33.8117 0.0964355 32.8476 0.0964355 31.3243V2.90762Z" fill="#314CD8"/>
                <path d="M40 21.6016H45.4525V14.6896H46.7354L50.6109 21.6016H56.3841L51.8137 13.6096C53.8182 12.8266 55.2615 11.2876 55.2615 8.53362V8.42562C55.2615 4.34862 52.4819 2.29662 47.4838 2.29662H40V21.6016ZM45.4525 11.0986V6.45462H47.2432C49.0072 6.45462 49.9694 7.07562 49.9694 8.64162V8.74962C49.9694 10.3156 49.0607 11.0986 47.2165 11.0986H45.4525Z" fill="#202227"/>
                <path d="M58.8769 21.6016H63.6611V7.48062H58.8769V21.6016ZM61.2557 6.13062C62.7524 6.13062 63.9017 5.07762 63.9017 3.64662C63.9017 2.21562 62.7524 1.13562 61.2557 1.13562C59.7589 1.13562 58.6363 2.21562 58.6363 3.64662C58.6363 5.07762 59.7589 6.13062 61.2557 6.13062Z" fill="#202227"/>
                <path d="M71.0894 21.6016H76.3013L81.4063 7.48062H76.8358L73.976 16.5796L71.0626 7.48062H65.9576L71.0894 21.6016Z" fill="#202227"/>
                <path d="M89.5716 21.9256C93.7946 21.9256 96.2268 20.1166 96.6545 16.9306H92.1642C91.9771 17.8756 91.3089 18.6046 89.732 18.6046C88.0214 18.6046 86.9523 17.5246 86.8186 15.6616H96.6545V14.3926C96.6545 9.31662 93.3669 7.10262 89.5449 7.10262C85.3219 7.10262 81.9809 9.96462 81.9809 14.5006V14.7166C81.9809 19.3336 85.1883 21.9256 89.5716 21.9256ZM86.8721 12.9346C87.1127 11.2336 88.1016 10.2886 89.5449 10.2886C91.0951 10.2886 91.9236 11.2336 92.0038 12.9346H86.8721Z" fill="#202227"/>
                <path d="M99.2379 21.6016H104.022V14.9056C104.022 12.6376 105.626 11.7196 108.539 11.8006V7.29162C106.374 7.26462 104.904 8.18262 104.022 10.2886V7.48062H99.2379V21.6016Z" fill="#202227"/>
                <path d="M120.319 21.9256C123.606 21.9256 126.253 19.4956 126.253 14.6356V14.4196C126.253 9.58662 123.606 7.10262 120.346 7.10262C118.234 7.10262 116.791 8.23662 115.989 9.58662V1.27062H111.205V21.6016H115.989V19.4146C116.684 20.9266 118.234 21.9256 120.319 21.9256ZM118.635 18.2266C116.898 18.2266 115.855 17.0116 115.855 14.6086V14.3926C115.855 12.0166 116.898 10.7476 118.635 10.7476C120.319 10.7476 121.388 11.9356 121.388 14.4196V14.6356C121.388 16.9576 120.426 18.2266 118.635 18.2266Z" fill="#202227"/>
                <path d="M135.756 21.9256C139.979 21.9256 142.412 20.1166 142.839 16.9306H138.349C138.162 17.8756 137.494 18.6046 135.917 18.6046C134.206 18.6046 133.137 17.5246 133.003 15.6616H142.839V14.3926C142.839 9.31662 139.552 7.10262 135.73 7.10262C131.507 7.10262 128.166 9.96462 128.166 14.5006V14.7166C128.166 19.3336 131.373 21.9256 135.756 21.9256ZM133.057 12.9346C133.297 11.2336 134.286 10.2886 135.73 10.2886C137.28 10.2886 138.108 11.2336 138.189 12.9346H133.057Z" fill="#202227"/>
                <path d="M145.423 21.6016H150.207V13.6906C150.207 11.8816 151.169 11.0176 152.586 11.0176C153.975 11.0176 154.59 11.8006 154.59 13.3936V21.6016H159.374V12.4216C159.374 8.80362 157.503 7.10262 154.804 7.10262C152.479 7.10262 150.955 8.29062 150.207 9.74862V7.48062H145.423V21.6016Z" fill="#202227"/>
                <path d="M167.821 21.9256C169.933 21.9256 171.483 20.7646 172.178 19.3066V21.6016H176.962V1.27062H172.178V9.47862C171.376 8.04762 170.066 7.10262 167.874 7.10262C164.56 7.10262 161.941 9.66762 161.941 14.4736V14.6896C161.941 19.5766 164.587 21.9256 167.821 21.9256ZM169.505 18.2266C167.848 18.2266 166.805 17.0116 166.805 14.6356V14.4196C166.805 11.9626 167.768 10.7476 169.558 10.7476C171.322 10.7476 172.311 12.0166 172.311 14.3926V14.6086C172.311 17.0116 171.242 18.2266 169.505 18.2266Z" fill="#202227"/>
                <path d="M43.9676 37.5807C45.8682 37.5807 47.2224 36.6087 47.5194 34.6287H46.5572C46.3434 36.0207 45.3812 36.7287 43.9913 36.7287C42.162 36.7287 41.0691 35.4087 41.0691 33.2247V33.1287C41.0691 30.9687 42.2451 29.5887 44.0032 29.5887C45.4525 29.5887 46.2008 30.2607 46.4147 31.5687H47.4363C47.2581 29.7087 45.7613 28.7607 43.9913 28.7607C41.6868 28.7607 40 30.5967 40 33.1407V33.2367C40 35.8767 41.5086 37.5807 43.9676 37.5807Z" fill="#4E555F"/>
                <path d="M50.8273 37.5807C51.8252 37.5807 52.5142 37.0647 52.7992 36.4767V37.4727H53.7852V31.1967H52.7992V35.0007C52.7992 36.1287 51.9677 36.7167 51.0887 36.7167C50.1146 36.7167 49.6513 36.2247 49.6513 35.1207V31.1967H48.6654V35.1687C48.6654 36.8967 49.5919 37.5807 50.8273 37.5807Z" fill="#4E555F"/>
                <path d="M57.4053 37.5807C58.914 37.5807 59.6861 36.8127 59.6861 35.6727C59.6861 34.3407 58.7833 34.0527 57.5004 33.8127C56.36 33.6087 56.0511 33.3807 56.0511 32.8167C56.0511 32.2767 56.5144 31.9167 57.2271 31.9167C58.0112 31.9167 58.3913 32.2167 58.5338 32.9007H59.4841C59.3178 31.5447 58.3556 31.0887 57.239 31.0887C56.2649 31.0887 55.1364 31.6887 55.1364 32.8527C55.1364 33.9447 55.6829 34.4007 57.2984 34.7007C58.2606 34.8807 58.7477 35.0967 58.7477 35.7567C58.7477 36.4287 58.3319 36.7527 57.3934 36.7527C56.3956 36.7527 56.0036 36.2847 55.9323 35.5407H54.9701C55.0295 36.8247 55.9205 37.5807 57.4053 37.5807Z" fill="#4E555F"/>
                <path d="M62.7802 37.5567C63.1841 37.5567 63.4217 37.4967 63.6236 37.4247V36.5847C63.4098 36.6687 63.1722 36.7167 62.8634 36.7167C62.3644 36.7167 62.0912 36.4167 62.0912 35.8047V32.0367H63.5405V31.1967H62.0912V29.7687H61.1053V31.1967H60.2143V32.0367H61.1053V35.9007C61.1053 36.8847 61.6517 37.5567 62.7802 37.5567Z" fill="#4E555F"/>
                <path d="M67.4067 36.7527C66.1475 36.7527 65.3754 35.8167 65.3754 34.3887V34.2927C65.3754 32.8527 66.1594 31.9167 67.4067 31.9167C68.6421 31.9167 69.438 32.8527 69.438 34.3047V34.3887C69.438 35.8047 68.654 36.7527 67.4067 36.7527ZM67.3948 37.5807C69.1648 37.5807 70.4596 36.2727 70.4596 34.3767V34.2807C70.4596 32.3967 69.1648 31.0887 67.4067 31.0887C65.6486 31.0887 64.3538 32.4087 64.3538 34.2927V34.3887C64.3538 36.2247 65.6248 37.5807 67.3948 37.5807Z" fill="#4E555F"/>
                <path d="M71.6893 37.4727H72.6752V33.6327C72.6752 32.5047 73.5067 31.9527 74.3145 31.9527C75.1698 31.9527 75.6331 32.4087 75.6331 33.5127V37.4727H76.619V33.6327C76.619 32.5047 77.4506 31.9527 78.2583 31.9527C79.1136 31.9527 79.5769 32.4087 79.5769 33.5127V37.4727H80.5629V33.5847C80.5629 31.7607 79.5888 31.0887 78.4722 31.0887C77.7 31.0887 76.7735 31.4487 76.3458 32.2647C76.0251 31.4247 75.3242 31.0887 74.5283 31.0887C73.6374 31.0887 72.9603 31.5687 72.6752 32.1567V31.1967H71.6893V37.4727Z" fill="#4E555F"/>
                <path d="M85.1221 37.4727H86.1556V33.6567H90.6221V37.4727H91.6555V28.8927H90.6221V32.7807H86.1556V28.8927H85.1221V37.4727Z" fill="#4E555F"/>
                <path d="M96.0207 36.7527C94.7615 36.7527 93.9894 35.8167 93.9894 34.3887V34.2927C93.9894 32.8527 94.7734 31.9167 96.0207 31.9167C97.2561 31.9167 98.052 32.8527 98.052 34.3047V34.3887C98.052 35.8047 97.268 36.7527 96.0207 36.7527ZM96.0088 37.5807C97.7788 37.5807 99.0736 36.2727 99.0736 34.3767V34.2807C99.0736 32.3967 97.7788 31.0887 96.0207 31.0887C94.2626 31.0887 92.9678 32.4087 92.9678 34.2927V34.3887C92.9678 36.2247 94.2388 37.5807 96.0088 37.5807Z" fill="#4E555F"/>
                <path d="M100.303 37.4727H101.289V33.6327C101.289 32.5047 102.121 31.9527 102.929 31.9527C103.784 31.9527 104.247 32.4087 104.247 33.5127V37.4727H105.233V33.6327C105.233 32.5047 106.065 31.9527 106.872 31.9527C107.728 31.9527 108.191 32.4087 108.191 33.5127V37.4727H109.177V33.5847C109.177 31.7607 108.203 31.0887 107.086 31.0887C106.314 31.0887 105.387 31.4487 104.96 32.2647C104.639 31.4247 103.938 31.0887 103.142 31.0887C102.251 31.0887 101.574 31.5687 101.289 32.1567V31.1967H100.303V37.4727Z" fill="#4E555F"/>
                <path d="M113.36 37.5807C114.762 37.5807 115.795 36.9207 116.009 35.6607H115.023C114.893 36.3927 114.334 36.7527 113.372 36.7527C112.101 36.7527 111.424 35.9607 111.376 34.5327H116.057V34.2087C116.057 31.9647 114.702 31.0887 113.265 31.0887C111.555 31.0887 110.355 32.4087 110.355 34.3047V34.4007C110.355 36.3327 111.602 37.5807 113.36 37.5807ZM111.412 33.7287C111.578 32.6127 112.255 31.9167 113.265 31.9167C114.287 31.9167 114.952 32.4327 115.047 33.7287H111.412Z" fill="#4E555F"/>
                <path d="M120.361 37.5807C122.072 37.5807 123.188 36.2607 123.188 34.3407V34.2447C123.188 32.2887 121.989 31.0887 120.361 31.0887C119.458 31.0887 118.615 31.6407 118.259 32.2527V28.1967H117.273V37.4727H118.259V36.4407C118.615 37.0647 119.351 37.5807 120.361 37.5807ZM120.266 36.7527C119.054 36.7527 118.223 35.9967 118.223 34.3887V34.2927C118.223 32.6847 119.102 31.9167 120.254 31.9167C121.3 31.9167 122.167 32.7087 122.167 34.2927V34.3887C122.167 35.9127 121.501 36.7527 120.266 36.7527Z" fill="#4E555F"/>
                <path d="M126.526 37.5807C127.524 37.5807 128.213 37.0647 128.498 36.4767V37.4727H129.484V31.1967H128.498V35.0007C128.498 36.1287 127.666 36.7167 126.787 36.7167C125.813 36.7167 125.35 36.2247 125.35 35.1207V31.1967H124.364V35.1687C124.364 36.8967 125.29 37.5807 126.526 37.5807Z" fill="#4E555F"/>
                <path d="M131.203 37.4727H132.189V31.1967H131.203V37.4727ZM131.678 29.8887C132.035 29.8887 132.332 29.5887 132.332 29.2287C132.332 28.8687 132.035 28.5687 131.678 28.5687C131.322 28.5687 131.025 28.8687 131.025 29.2287C131.025 29.5887 131.322 29.8887 131.678 29.8887Z" fill="#4E555F"/>
                <path d="M133.934 37.4727H134.932V28.1967H133.934V37.4727Z" fill="#4E555F"/>
                <path d="M138.993 37.5807C139.895 37.5807 140.763 37.0047 141.119 36.3927V37.4727H142.105V28.1967H141.119V32.2047C140.763 31.5927 140.121 31.0887 139.088 31.0887C137.377 31.0887 136.189 32.4447 136.189 34.3647V34.4607C136.189 36.4167 137.365 37.5807 138.993 37.5807ZM139.1 36.7527C138.054 36.7527 137.211 35.9967 137.211 34.4127V34.3167C137.211 32.7927 137.947 31.9167 139.183 31.9167C140.394 31.9167 141.155 32.6727 141.155 34.2807V34.3767C141.155 35.9847 140.252 36.7527 139.1 36.7527Z" fill="#4E555F"/>
                <path d="M146.345 37.5807C147.747 37.5807 148.78 36.9207 148.994 35.6607H148.008C147.878 36.3927 147.319 36.7527 146.357 36.7527C145.086 36.7527 144.409 35.9607 144.361 34.5327H149.042V34.2087C149.042 31.9647 147.688 31.0887 146.25 31.0887C144.54 31.0887 143.34 32.4087 143.34 34.3047V34.4007C143.34 36.3327 144.587 37.5807 146.345 37.5807ZM144.397 33.7287C144.563 32.6127 145.24 31.9167 146.25 31.9167C147.272 31.9167 147.937 32.4327 148.032 33.7287H144.397Z" fill="#4E555F"/>
                <path d="M150.258 37.4727H151.244V34.0287C151.244 32.4807 152.04 32.0847 153.287 32.0247V31.0887C152.17 31.1247 151.636 31.6167 151.244 32.3247V31.1967H150.258V37.4727Z" fill="#4E555F"/>
                <path d="M156.293 37.5807C157.802 37.5807 158.574 36.8127 158.574 35.6727C158.574 34.3407 157.671 34.0527 156.388 33.8127C155.248 33.6087 154.939 33.3807 154.939 32.8167C154.939 32.2767 155.402 31.9167 156.115 31.9167C156.899 31.9167 157.279 32.2167 157.422 32.9007H158.372C158.206 31.5447 157.244 31.0887 156.127 31.0887C155.153 31.0887 154.024 31.6887 154.024 32.8527C154.024 33.9447 154.571 34.4007 156.186 34.7007C157.149 34.8807 157.636 35.0967 157.636 35.7567C157.636 36.4287 157.22 36.7527 156.281 36.7527C155.284 36.7527 154.892 36.2847 154.82 35.5407H153.858C153.918 36.8247 154.808 37.5807 156.293 37.5807Z" fill="#4E555F"/>
              </svg>
            </div>
            <div className="cp-builder-info">
              <div className="cp-builder-info-row"><IconMapPin /><BdsText size="normal-sm">501 Duke Ln. Fort Collins, CO 80525</BdsText></div>
              <div className="cp-builder-info-row"><IconPhone /><BdsText size="normal-sm">469-444-4578</BdsText></div>
              <div className="cp-builder-info-row"><IconMailSmall /><BdsLink>Contact us</BdsLink></div>
            </div>
          </div>

          <BdsText size="distinct-md" className="cp-sidebar-section-title">Action Items</BdsText>
          <div className="cp-action-list">
            <div className="cp-action-item">
              <IconCheck /><BdsText size="normal-md">Incomplete to-dos</BdsText>
              <BdsBadge text="6" displayType="success" />
              <IconChevronRight />
            </div>
            <div className="cp-action-item">
              <IconCreditCard /><BdsText size="normal-md">Upcoming Payments</BdsText>
              <IconChevronRight />
            </div>
            <div className="cp-action-sub">
              <BdsText size="normal-md">Deposits</BdsText>
              <BdsBadge text="1" displayType="info" />
              <IconChevronRight />
            </div>
            <div className="cp-action-sub">
              <BdsText size="normal-md">Invoices</BdsText>
              <BdsBadge text="1" displayType="info" />
              <IconChevronRight />
            </div>
            <div className="cp-action-item">
              <IconZap /><BdsText size="normal-md">Pending Change Orders</BdsText>
              <BdsBadge text="4" displayType="success" />
              <IconChevronRight />
            </div>
          </div>

          <BdsText size="distinct-md" className="cp-sidebar-section-title">Communications</BdsText>
          <div className="cp-action-list">
            <div className="cp-action-item">
              <IconMail /><BdsText size="normal-md">Messages</BdsText>
              <BdsBadge text="6" displayType="info" />
              <IconChevronRight />
            </div>
            <div className="cp-action-item">
              <IconChat /><BdsText size="normal-md">Chats</BdsText>
              <BdsBadge text="4" displayType="info" />
              <IconChevronRight />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="cp-main">
          {/* Project Financials — version-aware experimentation surface (Kendall's brief, May 2026) */}
          <BdsSection title="Project financials" slot={
            <BdsButton text="Job price summary" displayType="secondary" onClick={() => onNavigate?.('client-jps')} />
          }>
            {/* Version pill selector */}
            <div className="cp-fin-version-selector">
              <span className="cp-fin-version-label">Try a version:</span>
              {([
                ['v1', 'v1 · Today (fixed-price)'],
                ['v2', 'v2 · Open book always-on'],
                ['v3', 'v3 · Drill-through panel'],
                ['v4', 'v4 · Inline expandable'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  className={`cp-fin-version-pill ${clientFinVersion === key ? 'cp-fin-version-pill-on' : ''}`}
                  onClick={() => { setClientFinVersion(key); setFinDrillOpen(false); setFinExpandOpen(false); }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="cp-financials-grid">
              {/* ── First card — varies by version ── */}
              {clientFinVersion === 'v1' && (
                <div className="cp-fin-card">
                  <div className="cp-fin-row"><BdsText size="normal-md">Contract price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.contractPrice)}</BdsText></div>
                  <div className="cp-fin-row"><BdsText size="normal-md">Change orders</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.changeOrders)}</BdsText></div>
                  <div className="cp-fin-row"><BdsText size="normal-md">Selections</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.selectionsApprovedImpact)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-total"><BdsText size="distinct-sm">Total cost</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.contractPrice + fin.changeOrders + fin.selectionsApprovedImpact)}</BdsText></div>
                </div>
              )}

              {clientFinVersion === 'v2' && (
                <div className="cp-fin-card">
                  <div className="cp-fin-row"><BdsText size="normal-md">Contract price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.contractPrice)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-row-parent"><BdsText size="normal-md">Approved changes</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(approvedChanges)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Change orders</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.changeOrders)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Selection changes</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.selectionsApprovedImpact)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Bills</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.billVariance)}</BdsText></div>
                  <div className="cp-fin-row"><BdsText size="normal-md">Tax</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.tax)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-total"><BdsText size="distinct-sm">Current price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(currentPrice)}</BdsText></div>
                </div>
              )}

              {clientFinVersion === 'v3' && (
                <div className="cp-fin-card">
                  <div className="cp-fin-row"><BdsText size="normal-md">Contract price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.contractPrice)}</BdsText></div>
                  <div className="cp-fin-row">
                    <button type="button" className="cp-fin-link-label" onClick={() => setFinDrillOpen(true)}>Approved changes</button>
                    <span className="cp-dots" />
                    <BdsText size="distinct-sm">{fmtUsd(approvedChanges)}</BdsText>
                  </div>
                  <div className="cp-fin-row"><BdsText size="normal-md">Tax</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.tax)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-total"><BdsText size="distinct-sm">Current price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(currentPrice)}</BdsText></div>
                </div>
              )}

              {clientFinVersion === 'v4' && (
                <div className="cp-fin-card">
                  <div className="cp-fin-row"><BdsText size="normal-md">Contract price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.contractPrice)}</BdsText></div>
                  <button type="button" className={`cp-fin-row cp-fin-row-toggle ${finExpandOpen ? 'cp-fin-row-toggle-open' : ''}`} onClick={() => setFinExpandOpen(o => !o)}>
                    <span className="cp-fin-row-toggle-label">
                      <BdsText size="normal-md">Approved changes</BdsText>
                      <span className={`cp-fin-row-chevron ${finExpandOpen ? 'cp-fin-row-chevron-open' : ''}`}>›</span>
                    </span>
                    <span className="cp-dots" />
                    <BdsText size="distinct-sm">{fmtUsd(approvedChanges)}</BdsText>
                  </button>
                  {finExpandOpen && (
                    <>
                      <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Change orders</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.changeOrders)}</BdsText></div>
                      <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Selection changes</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.selectionsApprovedImpact)}</BdsText></div>
                      <div className="cp-fin-row cp-fin-row-nested"><BdsText size="normal-sm">Bills</BdsText><span className="cp-dots" /><BdsText size="normal-sm">{fmtUsd(fin.billVariance)}</BdsText></div>
                    </>
                  )}
                  <div className="cp-fin-row"><BdsText size="normal-md">Tax</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(fin.tax)}</BdsText></div>
                  <div className="cp-fin-row cp-fin-total"><BdsText size="distinct-sm">Current price</BdsText><span className="cp-dots" /><BdsText size="distinct-sm">{fmtUsd(currentPrice)}</BdsText></div>
                </div>
              )}

              {/* Total paid / remaining card — synced with JPS payments + credits */}
              <div className="cp-fin-card cp-fin-stacked">
                <div>
                  <BdsText size="heavy-sm">{fmtUsd(fin.paymentsReceived)}</BdsText>
                  <BdsText size="normal-sm" className="cp-fin-label">Total paid</BdsText>
                </div>
                <div className="cp-fin-divider" />
                <div>
                  <BdsText size="heavy-sm">{fmtUsd(remainingToPay)}</BdsText>
                  <BdsText size="normal-sm" className="cp-fin-label">Remaining to pay</BdsText>
                </div>
              </div>

              {/* Next payment card */}
              <div className="cp-fin-card cp-fin-cta">
                <BdsText size="normal-sm" className="cp-fin-label">Next payment</BdsText>
                <BdsText size="heavy-sm">{fmtUsd(fin.nextPayment)}</BdsText>
                <BdsText size="normal-sm" className="cp-fin-label">Due Oct 31, 2024</BdsText>
                <BdsButton text="Pay now" displayType="primary" />
              </div>
            </div>
          </BdsSection>

          {/* v3 drill-through side panel */}
          {clientFinVersion === 'v3' && finDrillOpen && (
            <div className="cp-fin-panel-scrim" onClick={() => setFinDrillOpen(false)}>
              <div className="cp-fin-panel" onClick={(e) => e.stopPropagation()}>
                <div className="cp-fin-panel-header">
                  <BdsText size="distinct-md">Approved changes detail</BdsText>
                  <button type="button" className="cp-fin-panel-close" aria-label="Close" onClick={() => setFinDrillOpen(false)}>×</button>
                </div>
                <div className="cp-fin-panel-body">
                  <div className="cp-fin-panel-section">
                    <div className="cp-fin-panel-section-header">
                      <BdsText size="distinct-sm">Change orders</BdsText>
                      <BdsText size="distinct-sm">{fmtUsd(fin.changeOrders)}</BdsText>
                    </div>
                    <div className="cp-fin-panel-line"><span>Add covered patio</span><span>{fmtUsd(4200)}</span></div>
                    <div className="cp-fin-panel-line"><span>Upgrade electrical panel</span><span>{fmtUsd(1800)}</span></div>
                    <div className="cp-fin-panel-line"><span>Add screened porch</span><span>{fmtUsd(15000)}</span></div>
                  </div>
                  <div className="cp-fin-panel-section">
                    <div className="cp-fin-panel-section-header">
                      <BdsText size="distinct-sm">Selection changes</BdsText>
                      <BdsText size="distinct-sm">{fmtUsd(fin.selectionsApprovedImpact)}</BdsText>
                    </div>
                    <div className="cp-fin-panel-line"><span>Recessed lighting package</span><span>{fmtUsd(1800)}</span></div>
                    <div className="cp-fin-panel-line"><span>Exterior soffit lighting</span><span>{fmtUsd(950)}</span></div>
                    <div className="cp-fin-panel-line"><span>Smart thermostat</span><span>{fmtUsd(420)}</span></div>
                    <div className="cp-fin-panel-line"><span>Lighting allowance overages</span><span>{fmtUsd(1300)}</span></div>
                  </div>
                  <div className="cp-fin-panel-section">
                    <div className="cp-fin-panel-section-header">
                      <BdsText size="distinct-sm">Bills</BdsText>
                      <BdsText size="distinct-sm">{fmtUsd(fin.billVariance)}</BdsText>
                    </div>
                    <div className="cp-fin-panel-line"><span>Framing · spent $26,500 of $25,000</span><span>{fmtUsd(1500)}</span></div>
                    <div className="cp-fin-panel-line"><span>Plumbing rough-in · spent $11,200 of $12,000</span><span>{fmtUsd(-800)}</span></div>
                    <div className="cp-fin-panel-line"><span>Electrical rough-in · spent $19,600 of $18,000</span><span>{fmtUsd(1600)}</span></div>
                    <div className="cp-fin-panel-line"><span>HVAC · spent $14,500 of $15,000</span><span>{fmtUsd(-500)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Updates */}
          <BdsSection title="Project updates" slot={<BdsButton text="View more" displayType="secondary" />}>
            <div className="cp-grid-3">
              {[
                { date: 'Apr 7, 2024', title: 'Rebar and concrete work today', desc: 'The siding had a set back, but we were still able to complete the work by putting in a few extra hours...', img: imgSiteWork1 },
                { date: 'Apr 5, 2024', title: 'Concrete Pour', desc: 'We were able to get a lot done today when it came to the concrete work. The crew did an amazing...', img: imgSiteWork2 },
                { date: 'Apr 1, 2024', title: 'Pool Excavation Update', desc: 'We were able to get the Big Cat over to the home today and have began digging and excavating in...', img: imgSiteWork3 },
              ].map((u, i) => (
                <div key={i} className="cp-card">
                  <BdsText size="normal-sm" className="cp-text-muted">{u.date}</BdsText>
                  <BdsText size="distinct-sm">{u.title}</BdsText>
                  <BdsText size="normal-sm" className="cp-text-muted">{u.desc}</BdsText>
                  <div className="cp-update-img" style={{ backgroundImage: `url(${u.img})` }}>
                    <span className="cp-img-count"><BdsText size="normal-sm">1 of 4</BdsText></span>
                  </div>
                </div>
              ))}
            </div>
          </BdsSection>

          {/* Project Schedule */}
          <BdsSection title="Project schedule" slot={<BdsButton text="View more" displayType="secondary" />}>
            <div className="cp-schedule-card">
              <BdsText size="distinct-sm">April</BdsText>
              <div className="cp-schedule-grid">
                {[
                  { day: 'Today 27', events: [{ name: 'Kitchen Demo', time: 'All day', type: 'success' }, { name: 'Guest bathroom tile work', time: '10:00 AM - 1:00 PM', type: 'info' }] },
                  { day: 'Wed 28', events: [{ name: 'Kitchen Demo', time: 'All day', type: 'success' }, { name: 'Master bath cabinets', time: '10:00 AM - 1:00 PM', type: 'warning' }, { name: 'Guest bathroom tile work', time: '10:00 AM - 1:00 PM', type: 'info' }] },
                  { day: 'Thur 29', events: [{ name: 'Kitchen Demo', time: 'All day', type: 'success' }, { name: 'Master bath cabinets', time: '10:00 AM - 1:00 PM', type: 'warning' }, { name: 'Guest bathroom tile work', time: '10:00 AM - 1:00 PM', type: 'info' }] },
                  { day: 'Fri 30', events: [{ name: 'Kitchen Demo', time: 'All day', type: 'success' }, { name: 'Master bath cabinets', time: '10:00 AM - 1:00 PM', type: 'warning' }, { name: 'Steam Shower install', time: '10:00 AM - 1:00 PM', type: 'info' }] },
                ].map((d, i) => (
                  <div key={i} className="cp-schedule-day">
                    <BdsText size="distinct-sm">{d.day}</BdsText>
                    {d.events.map((e, j) => (
                      <div key={j} className={`cp-schedule-event cp-schedule-event-${e.type}`}>
                        <BdsText size="normal-sm" style={{ fontWeight: 600 }}>{e.name}</BdsText>
                        <BdsText size="normal-sm" className="cp-text-muted">{e.time}</BdsText>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </BdsSection>

          {/* Recent Comments */}
          <BdsSection title="Recent comments" slot={<BdsButton text="View more" displayType="secondary" />}>
            <div className="cp-grid-3">
              {[
                { source: 'Daily Log', name: "La'trell Swanson", role: 'General Manager', text: 'I just put in some updates in this daily log. Thank you for stopping by to give us your input on what you saw, that w...', color: 'green' as const },
                { source: 'Daily Log', name: 'Larry Johnson', role: 'Builder', text: 'I just put in some updates in this daily log. Thank you for stopping by to give us your input on what you saw, that w...', color: 'blue' as const },
                { source: 'Warranty', name: "La'trell Swanson", role: 'General Manager', text: 'I saw that their was a bad leak after the dishwasher was installed. I tried to do a test to see if everything was smooth,...', color: 'green' as const },
              ].map((c, i) => (
                <div key={i} className="cp-card">
                  <BdsText size="normal-sm" className="cp-text-muted">Yesterday &bull; {c.source}</BdsText>
                  <div className="cp-comment-author">
                    <BdsAvatar text={c.name} size="sm" colorize={c.color} />
                    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                      <BdsText size="distinct-sm">{c.name}</BdsText>
                      <BdsText size="normal-sm" className="cp-text-muted">{c.role}</BdsText>
                    </div>
                  </div>
                  <BdsText size="normal-md" className="cp-text-muted">{c.text}</BdsText>
                  <BdsLink>Open Conversation</BdsLink>
                </div>
              ))}
            </div>
          </BdsSection>
        </div>
      </div>
    </div>
  );
}
