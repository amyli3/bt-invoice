import { useState } from 'react';
import { JOBS } from '../mockData';

interface Props {
  open: boolean;
  onToggle: () => void;
  selectedJob: number;
  onSelectJob: (id: number) => void;
  onHomeClick?: () => void;
}

export default function JobSidebar({ open, onToggle, selectedJob, onSelectJob, onHomeClick }: Props) {
  const [search, setSearch] = useState('');
  const filtered = JOBS.filter(j => j.name.toLowerCase().includes(search.toLowerCase()));
  const openJobs = filtered.filter(j => j.group === 'open');
  const allJobs = filtered.filter(j => j.group === 'all');
  return (
    <div className={"job-sidebar" + (open ? "" : " collapsed")}>
      <div className="job-sidebar-inner">
        <div className="job-sidebar-header">
          <span style={{fontSize: 13, fontWeight: 600, color: 'var(--bt-midnight)'}}>Jobs</span>
          <button className="job-sidebar-toggle" onClick={onToggle} title="Collapse">&times;</button>
        </div>
        <button className="job-new-btn">New Job</button>
        <div style={{padding: '0 16px 4px', display: 'flex', alignItems: 'center', gap: 6}}>
          <span style={{fontSize: 13, fontWeight: 600, color: 'var(--g700)'}}>Jobs</span>
          <span style={{fontSize: 11, color: 'var(--g400)'}}>(1) &#9660;</span>
        </div>
        <input className="job-search" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="job-list">
          {openJobs.length > 0 && <div className="job-group">Open</div>}
          {openJobs.map(j => (
            <div key={j.id} className={"job-item" + (selectedJob === j.id ? " active" : "")} onClick={() => onSelectJob(j.id)}>
              <div className="job-item-name"><span>{j.name}</span><svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0, cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); onHomeClick?.(); }}><path fillRule="evenodd" clipRule="evenodd" d="M4.65453 12.9617L14.6538 3.86985C15.4167 3.17623 16.5818 3.17619 17.3447 3.86976L27.3454 12.9616C27.7623 13.3407 28 13.878 28 14.4415V25.999C28 26.5295 27.7893 27.0382 27.4141 27.4133C27.039 27.7884 26.5303 27.999 25.9997 27.999L19.999 27.9982C18.8945 27.9981 17.9993 27.1027 17.9993 25.9982V19.9981H13.9993V25.9982C13.9993 27.1027 13.104 27.9981 11.9995 27.9982L6.00012 27.999C5.4697 27.999 4.96097 27.7884 4.58587 27.4133C4.21075 27.0382 4 26.5295 4 25.999V14.4415C4 13.878 4.23766 13.3407 4.65453 12.9617ZM15.9993 5.34961L6 14.4415V25.999L11.9993 25.9982V19.9981C11.9993 18.8935 12.8947 17.9981 13.9993 17.9981H17.9993C19.1038 17.9981 19.9993 18.8935 19.9993 19.9981V25.9982L26 25.999V14.4415L15.9993 5.34961Z" fill="currentColor"/></svg></div>
              {j.addr && <div className="job-item-addr">{j.addr.split('\n').map((l,i) => <span key={i}>{l}<br/></span>)}</div>}
            </div>
          ))}
          {allJobs.length > 0 && <div className="job-group">All Jobs</div>}
          {allJobs.map(j => (
            <div key={j.id} className={"job-item" + (selectedJob === j.id ? " active" : "")} onClick={() => onSelectJob(j.id)}>
              <div className="job-item-name">
                <span>{j.name}</span><svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink: 0, cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); onHomeClick?.(); }}><path fillRule="evenodd" clipRule="evenodd" d="M4.65453 12.9617L14.6538 3.86985C15.4167 3.17623 16.5818 3.17619 17.3447 3.86976L27.3454 12.9616C27.7623 13.3407 28 13.878 28 14.4415V25.999C28 26.5295 27.7893 27.0382 27.4141 27.4133C27.039 27.7884 26.5303 27.999 25.9997 27.999L19.999 27.9982C18.8945 27.9981 17.9993 27.1027 17.9993 25.9982V19.9981H13.9993V25.9982C13.9993 27.1027 13.104 27.9981 11.9995 27.9982L6.00012 27.999C5.4697 27.999 4.96097 27.7884 4.58587 27.4133C4.21075 27.0382 4 26.5295 4 25.999V14.4415C4 13.878 4.23766 13.3407 4.65453 12.9617ZM15.9993 5.34961L6 14.4415V25.999L11.9993 25.9982V19.9981C11.9993 18.8935 12.8947 17.9981 13.9993 17.9981H17.9993C19.1038 17.9981 19.9993 18.8935 19.9993 19.9981V25.9982L26 25.999V14.4415L15.9993 5.34961Z" fill="currentColor"/></svg>
                {j.tag && <span style={{marginLeft: 6, padding: '1px 5px', fontSize: 10, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 3}}>{j.tag}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
