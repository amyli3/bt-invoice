export const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (s: string) => {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const parseTaxRate = (taxType: string) => {
  const m = taxType.match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
};

export const calcDueDate = (dateStr: string, terms: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = terms === 'Net 7' ? 7 : terms === 'Net 15' ? 15 : terms === 'Net 30' ? 30 : terms === 'Net 45' ? 45 : terms === 'Net 60' ? 60 : terms === 'Due on Receipt' ? 0 : 0;
  if (terms === 'None') return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
