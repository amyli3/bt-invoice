import { useState } from 'react';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ChangeOrderSummary {
  id: string;
  title: string;
  totalPrice: number;
  status: 'draft' | 'approved' | 'pending' | 'sent';
}

interface Props {
  onNavigate?: (page: string) => void;
  approvedCOIds?: string[];
}

export default function ChangeOrderListPage({ onNavigate, approvedCOIds = [] }: Props) {
  const [search, setSearch] = useState('');

  // Build CO list from known data — status based on whether they've been approved
  const changeOrders: ChangeOrderSummary[] = [
    {
      id: 'co-1',
      title: 'Change order #1',
      totalPrice: 13600,
      status: approvedCOIds.includes('co-1') ? 'approved' : 'draft',
    },
    {
      id: 'co-2',
      title: 'Change order #2',
      totalPrice: 8500,
      status: approvedCOIds.includes('co-2') ? 'approved' : 'draft',
    },
    {
      id: 'co-3',
      title: 'Change order #3',
      totalPrice: 0,
      status: approvedCOIds.includes('co-3a') ? 'approved' : 'pending',
    },
  ];

  const filtered = search
    ? changeOrders.filter(co => co.title.toLowerCase().includes(search.toLowerCase()))
    : changeOrders;

  const statusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'approved':
        return { background: '#dcfce7', color: '#15803d' };
      case 'sent':
        return { background: '#dbeafe', color: '#1d4ed8' };
      case 'pending':
        return { background: '#fef3c7', color: '#92400e' };
      default:
        return { background: '#f1f5f9', color: '#64748b' };
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#f1f5f9', minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Change Orders</h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Johnson Residence</div>
          </div>
          <button
            onClick={() => onNavigate?.('change-order')}
            style={{
              padding: '9px 20px', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 6,
              background: '#0065db', color: 'white', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Change Order
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 24px' }}>
        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{
            flex: 1, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 6,
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: '#94a3b8', flexShrink: 0 }}>
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search change orders..."
              style={{
                border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', fontFamily: 'inherit',
                width: '100%', background: 'transparent',
              }}
            />
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {filtered.length} change order{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grid table */}
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Title
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Total Price
                </th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(co => (
                <tr
                  key={co.id}
                  onClick={() => onNavigate?.(`change-order:${co.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{co.title}</div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 500, color: '#0f172a' }}>
                    ${fmt(co.totalPrice)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 10,
                      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                      ...statusStyle(co.status),
                    }}>
                      {co.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    No change orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
