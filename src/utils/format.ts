let counter = 0;
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const nowISO = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 19);
};

export const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const formatTime = (iso?: string) => (iso && iso.length > 11 ? iso.slice(11, 16) : '');

export const formatDateTime = (iso?: string) => (iso ? `${formatDate(iso)} ${formatTime(iso)}`.trim() : '—');

export const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const normalizeSearch = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
