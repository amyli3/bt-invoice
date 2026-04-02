import { useState } from 'react';
import { JOBS } from '../mockData';

interface Props {
  open: boolean;
  onToggle: () => void;
  selectedJob: number;
  onSelectJob: (id: number) => void;
}

export default function JobSidebar({ open, onToggle, selectedJob, onSelectJob }: Props) {
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
              <div className="job-item-name">{j.name}</div>
              {j.addr && <div className="job-item-addr">{j.addr.split('\n').map((l,i) => <span key={i}>{l}<br/></span>)}</div>}
            </div>
          ))}
          {allJobs.length > 0 && <div className="job-group">All Jobs</div>}
          {allJobs.map(j => (
            <div key={j.id} className={"job-item" + (selectedJob === j.id ? " active" : "")} onClick={() => onSelectJob(j.id)}>
              <div className="job-item-name">
                {j.name}
                {j.tag && <span style={{marginLeft: 6, padding: '1px 5px', fontSize: 10, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 3}}>{j.tag}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
