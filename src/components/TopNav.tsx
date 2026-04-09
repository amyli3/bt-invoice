import { useState, useRef, useEffect } from 'react';

interface TopNavProps {
  onNavigate?: (page: string) => void;
}

export default function TopNav({ onNavigate }: TopNavProps) {
  const [jobsOpen, setJobsOpen] = useState(false);
  const [pmOpen, setPmOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const jobsRef = useRef<HTMLDivElement>(null);
  const pmRef = useRef<HTMLDivElement>(null);
  const financialRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const closeAll = () => { setJobsOpen(false); setPmOpen(false); setFinancialOpen(false); setProfileOpen(false); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (jobsRef.current && !jobsRef.current.contains(e.target as Node)) setJobsOpen(false);
      if (pmRef.current && !pmRef.current.contains(e.target as Node)) setPmOpen(false);
      if (financialRef.current && !financialRef.current.contains(e.target as Node)) setFinancialOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const caretDown = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <div className="topnav">
      <div className="topnav-left">
        <div className="topnav-dropdown-wrap" ref={jobsRef}>
          <button className="topnav-item" onClick={() => { setJobsOpen(!jobsOpen); setPmOpen(false); setFinancialOpen(false); }}>Jobs {caretDown}</button>
          {jobsOpen && (
            <div className="topnav-dropdown">
              <button className="topnav-dropdown-item" onClick={() => { setJobsOpen(false); onNavigate?.('job-price-summary'); }}>Job Price Summary</button>
            </div>
          )}
        </div>
        <button className="topnav-item">Sales {caretDown}</button>
        <div className="topnav-dropdown-wrap" ref={pmRef}>
          <button className="topnav-item" onClick={() => { setPmOpen(!pmOpen); setJobsOpen(false); setFinancialOpen(false); }}>Project Management {caretDown}</button>
          {pmOpen && (
            <div className="topnav-dropdown">
              <button className="topnav-dropdown-item" onClick={() => { closeAll(); onNavigate?.('selections'); }}>Selections</button>
            </div>
          )}
        </div>
        <button className="topnav-item">Files {caretDown}</button>
        <button className="topnav-item">Messaging {caretDown}</button>
        <div className="topnav-dropdown-wrap" ref={financialRef}>
          <button className="topnav-item" onClick={() => { setFinancialOpen(!financialOpen); setJobsOpen(false); setPmOpen(false); }}>Financial {caretDown}</button>
          {financialOpen && (
            <div className="topnav-dropdown">
              <button className="topnav-dropdown-item" onClick={() => { setFinancialOpen(false); onNavigate?.('invoice'); }}>Invoice</button>
              <button className="topnav-dropdown-item" onClick={() => { setFinancialOpen(false); onNavigate?.('progress-invoice'); }}>Progress Invoice</button>
              <button className="topnav-dropdown-item" onClick={() => { setFinancialOpen(false); onNavigate?.('estimate'); }}>Estimate</button>
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
        <button className="topnav-icon-btn" title="Add">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 5V15M5 10H15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <button className="topnav-icon-btn" title="Notifications">
          <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.46934 0.00011506C10.8367 0.025573 13.5623 2.76972 13.6539 6.14562L13.6559 6.3214V6.87512C13.6559 9.17622 14.0515 10.8021 14.6715 11.8693C14.8974 12.2552 14.9003 12.7329 14.6783 13.1212C14.4734 13.4795 14.1061 13.7116 13.6979 13.7462L13.5943 13.7501H10.5465C10.5465 15.476 9.14737 16.8751 7.42149 16.8751C5.74102 16.8751 4.3704 15.5489 4.29942 13.8859L4.29649 13.7501H1.24668C0.799263 13.749 0.386604 13.5087 0.164654 13.1202C-0.0571361 12.7318 -0.0545461 12.2542 0.170513 11.8702C0.766979 10.844 1.15503 9.30549 1.18516 7.14855L1.18711 6.87512V6.25109C1.18487 4.58758 1.84694 2.99199 3.02598 1.81847C4.20522 0.644901 5.80479 -0.00998248 7.46934 0.00011506ZM5.54649 13.7501C5.54649 14.7856 6.38596 15.6251 7.42149 15.6251C8.42003 15.6251 9.23653 14.8447 9.29356 13.8605L9.29649 13.7501H5.54649ZM7.2711 1.25304C6.00917 1.29322 4.80601 1.81034 3.90782 2.70422C3.00968 3.59809 2.4872 4.7983 2.44102 6.06066L2.43711 6.25012V6.87512C2.43711 9.28646 2.02441 11.0802 1.33751 12.3448L1.24961 12.5011H13.5934L13.5055 12.3448C12.8476 11.1332 12.4415 9.43568 12.4088 7.17394L12.4059 6.87512V6.3214C12.4059 3.59902 10.2757 1.35702 7.61387 1.25402L7.45958 1.25012L7.2711 1.25304Z" fill="white"/></svg>
        </button>
        <button className="topnav-icon-btn" title="Directory">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M24.9999 12C24.9999 7.02944 20.9705 3 16 3C11.0294 3 6.99995 7.02944 6.99995 12C6.99995 15.2833 8.75808 18.1559 11.3834 19.7276C7.90065 20.8541 4.8927 23.2358 3.0077 26.4986C2.73142 26.9768 2.89512 27.5884 3.37333 27.8647C3.85154 28.141 4.46318 27.9773 4.73946 27.4991C7.06302 23.4772 11.3552 21 16.0001 21L16.3724 21.0053C20.8733 21.1338 24.9993 23.5851 27.2606 27.4993C27.5368 27.9775 28.1485 28.1412 28.6267 27.865C29.1049 27.5887 29.2686 26.9771 28.9924 26.4988C27.1073 23.2358 24.0991 20.8539 20.6157 19.7279C23.2418 18.1559 24.9999 15.2833 24.9999 12ZM16.029 18.9999L15.9711 19L15.7593 18.9959C12.0047 18.8691 8.99995 15.7854 8.99995 12C8.99995 8.13401 12.134 5 16 5C19.8659 5 23 8.13401 23 12C23 15.8563 19.8816 18.9843 16.029 18.9999Z" fill="white"/></svg>
        </button>
        <button className="topnav-icon-btn" title="Help">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.125 0C12.6123 0 16.25 3.63769 16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0ZM8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125C15 4.32804 11.922 1.25 8.125 1.25ZM8.125 11.25C8.64277 11.25 9.0625 11.6697 9.0625 12.1875C9.0625 12.7053 8.64277 13.125 8.125 13.125C7.60723 13.125 7.1875 12.7053 7.1875 12.1875C7.1875 11.6697 7.60723 11.25 8.125 11.25ZM8.125 3.75C9.67817 3.75002 10.9373 5.00937 10.9375 6.5625C10.9375 7.84787 10.0751 8.93187 8.89746 9.26758L8.74902 9.30469L8.75 9.375C8.75 9.69539 8.50889 9.95981 8.19824 9.99609L8.125 10C7.80448 10 7.54001 9.75908 7.50391 9.44824L7.5 9.375V8.75C7.50019 8.40498 7.77994 8.125 8.125 8.125C8.98793 8.12498 9.6875 7.42543 9.6875 6.5625C9.68731 5.69973 8.98781 5.00002 8.125 5C7.29662 5 6.6184 5.64497 6.56543 6.45996L6.5625 6.5625C6.5625 6.90766 6.28266 7.18748 5.9375 7.1875C5.59232 7.1875 5.3125 6.90768 5.3125 6.5625C5.31269 5.00936 6.57182 3.75 8.125 3.75Z" fill="white"/></svg>
        </button>
        <div className="topnav-dropdown-wrap" ref={profileRef}>
          <button className="topnav-icon-btn" title="Profile" onClick={() => { setProfileOpen(!profileOpen); setJobsOpen(false); setPmOpen(false); setFinancialOpen(false); }}>
            <span className="topnav-avatar">MR</span>
          </button>
          {profileOpen && (
            <div className="topnav-dropdown" style={{right: 0, left: 'auto', minWidth: 200}}>
              <div style={{padding: '10px 14px', borderBottom: '1px solid var(--g200)'}}>
                <div style={{fontWeight: 600, fontSize: 13, color: 'var(--g800)'}}>Mike Rodriguez</div>
                <div style={{fontSize: 12, color: 'var(--g400)'}}>Builder</div>
              </div>
              <button className="topnav-dropdown-item" onClick={() => { setProfileOpen(false); onNavigate?.('client-portal'); }}>Switch to client view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
