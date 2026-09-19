import { useState, useEffect, useRef, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, updateProfile, type User } from 'firebase/auth';
import { auth } from './firebase';
import {
  subscribeTransactions, subscribeNotifications,
  addTransaction, updateTransaction, deleteTransaction,
  markNotificationRead, markAllNotificationsRead,
  clearAllNotifications, saveProfile, getProfile,
  type TxRecord, type NotifRecord,
} from './db';
import AuthPage from './AuthPage';
import LandingPage from './LandingPage';
import {
  ArrowDown, ArrowDownLeft, ArrowUp, ArrowUpRight,
  BarChart3, Bell, CalendarDays, Check, ChevronDown,
  CreditCard, Gem, Grid2X2, LayoutDashboard, Menu,
  Moon, Sun, MoreVertical, Plus, Search, Settings,
  Sparkles, Target, WalletCards, X, Pencil, Trash2,
  User as UserIcon, LogOut, ShoppingBag, Zap, Coffee,
  Car, CheckCircle, Crown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type IconComponent = typeof LayoutDashboard;

// Re-export db types under the names the UI uses
type Transaction = TxRecord;
type Notification = NotifRecord;

type Budget = {
  label: string;
  spent: number;
  limit: number;
  color: string;
  icon: ReactNode;
};

type Goal = {
  label: string;
  saved: number;
  target: number;
  color: string;
  deadline: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const navItems: { label: string; icon: IconComponent }[] = [
  { label: 'Dashboard',    icon: LayoutDashboard },
  { label: 'Transactions', icon: CreditCard },
  { label: 'Analytics',    icon: BarChart3 },
  { label: 'Budgets',      icon: WalletCards },
  { label: 'Goals',        icon: Target },
  { label: 'Categories',   icon: Grid2X2 },
  { label: 'Calendar',     icon: CalendarDays },
  { label: 'Settings',     icon: Settings },
];

const CATEGORIES = [
  { label: 'Income',          color: '#25bd8d' },
  { label: 'Food & Dining',   color: '#7355ef' },
  { label: 'Transport',       color: '#3277ed' },
  { label: 'Bills & Utilities', color: '#f5a719' },
  { label: 'Shopping',        color: '#fa773a' },
  { label: 'Entertainment',   color: '#eb5892' },
  { label: 'Healthcare',      color: '#f04b67' },
  { label: 'Others',          color: '#8b97b1' },
];

const PERIODS = ['This Month', 'Last Month', 'Last 3 Months', 'This Year'];

const chartBars: [number, number][] = [
  [20,38],[34,66],[25,44],[11,24],[8,33],[41,19],[18,35],[13,23],
  [45,20],[27,35],[14,58],[31,18],[8,42],[22,16],[15,37],[32,19],
  [18,45],[9,31],[23,14],[16,30],[7,25],[22,10],[14,30],[10,20],
];
const lastMonthBars: [number, number][] = [
  [18,42],[30,55],[22,38],[14,28],[10,30],[38,22],[16,40],[15,20],
  [40,25],[24,40],[12,50],[28,20],[10,38],[20,18],[18,42],[28,22],
  [20,38],[11,28],[20,16],[14,33],[9,22],[18,12],[16,28],[12,18],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG');
}
function uid() {
  return Math.random().toString(36).slice(2);
}

/** Returns first name only — e.g. "Ada Okonkwo" → "Ada" */
function firstName(displayName: string | null | undefined): string {
  if (!displayName) return 'there';
  return displayName.split(' ')[0];
}

/** Returns initials — e.g. "Ada Okonkwo" → "AO" */
function initials(displayName: string | null | undefined): string {
  if (!displayName) return '??';
  const parts = displayName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

// ─── Greeting based on time of day ───────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function IconBadge({ color, children }: { color: string; children: ReactNode }) {
  return <div className="icon-badge" style={{ backgroundColor: color }}>{children}</div>;
}

function SummaryCard({ title, amount, note, color, icon, positive = true }: {
  title: string; amount: string; note: string; color: string; icon: ReactNode; positive?: boolean;
}) {
  return (
    <article className="summary-card">
      <div className="summary-card-top"><IconBadge color={color}>{icon}</IconBadge><span>{title}</span></div>
      <strong>{amount}</strong>
      <p className={positive ? 'positive' : 'negative'}>↗ {note}</p>
    </article>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

// Animated SVG donut — draws segments in on mount, re-animates when data changes
function DonutChart({ total, segments }: {
  total: number;
  segments?: { pct: number; color: string }[];
}) {
  const defaultSegments = [
    { pct: 31, color: '#7355ef' },
    { pct: 19, color: '#3277ed' },
    { pct: 16, color: '#25bd8d' },
    { pct: 12, color: '#f5a719' },
    { pct: 10, color: '#fa773a' },
    { pct: 12, color: '#eb5892' },
  ];
  const segs = (segments && segments.length > 0) ? segments : defaultSegments;

  const SIZE   = 160;
  const STROKE = 32;
  const R      = (SIZE - STROKE) / 2;
  const CIRC   = 2 * Math.PI * R;
  const CX     = SIZE / 2;

  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const keyRef  = useRef(0);

  // Re-animate whenever segments change
  const segKey = segs.map(s => s.pct).join(',');
  useEffect(() => {
    keyRef.current += 1;
    setProgress(0);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const duration = 900;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segKey]);

  // Build arc paths
  let cumulativePct = 0;
  const arcs = segs.map(s => {
    const startPct = cumulativePct;
    cumulativePct += s.pct;
    // Apply animation progress — segments that haven't started yet are hidden,
    // the active one is partially drawn, completed ones are full
    const segStart  = startPct / 100;
    const segEnd    = cumulativePct / 100;
    const drawn     = Math.max(0, Math.min(progress - segStart, segEnd - segStart) / (segEnd - segStart));
    const dashArray = CIRC * (s.pct / 100) * drawn;
    const dashOffset= -(CIRC * (startPct / 100));
    return { ...s, dashArray, dashOffset, startPct };
  });

  return (
    <div className="donut-wrap" aria-label="Spending breakdown chart">
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={CX} cy={CX} r={R} fill="none" stroke="#edf0f7" strokeWidth={STROKE} />
        {/* Animated segments */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={CX} cy={CX} r={R}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeDasharray={`${arc.dashArray} ${CIRC}`}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="donut-hole">
        <strong>{fmt(total)}</strong>
        <span>Total</span>
      </div>
    </div>
  );
}

// Animated cash flow bars — grow up from zero on mount and whenever `bars` changes
function CashFlowChart({ bars }: { bars: [number, number][] }) {
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);

  const barsKey = bars.map(b => b.join('')).join('|');
  useEffect(() => {
    setProgress(0);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const start    = performance.now();
    const duration = 750;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 2.5);
      setProgress(eased);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barsKey]);

  return (
    <div className="cash-flow-chart">
      <div className="y-axis">
        <span>₦60k</span><span>₦40k</span><span>₦20k</span>
        <span>₦0</span><span>-₦20k</span><span>-₦40k</span>
      </div>
      <div className="plot">
        <div className="grid-lines"><i/><i/><i/><i/><i/></div>
        <div className="bars">
          {bars.map(([inc, exp], i) => (
            <div className="bar-group" key={i}>
              <b style={{ height: `${inc * progress}%`, transition: 'none' }} />
              <em style={{ height: `${exp * progress}%`, transition: 'none' }} />
            </div>
          ))}
        </div>
        <div className="x-axis">
          <span>May 1</span><span>May 8</span><span>May 15</span>
          <span>May 22</span><span>May 31</span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, body, action, onAction }: {
  icon: ReactNode; title: string; body: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="empty-state-block">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{body}</p>
      {action && onAction && (
        <button className="btn-primary" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="auth-logo" style={{ justifyContent: 'center' }}>
        <div className="brand-mark"><WalletCards size={22} /></div>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
          Expense<span style={{ color: '#7b62f5' }}>Flow</span>
        </span>
      </div>
      <div className="loading-spinner" />
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Transaction modal ────────────────────────────────────────────────────────

function TransactionModal({ initial, onSave, onClose }: {
  initial?: Transaction; onSave: (t: Transaction) => void; onClose: () => void;
}) {
  const [date, setDate]               = useState(initial?.date ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory]       = useState(initial?.category ?? 'Food & Dining');
  const [type, setType]               = useState<'Income' | 'Expense'>(initial?.type ?? 'Expense');
  const [amount, setAmount]           = useState(initial ? String(initial.rawAmount) : '');
  const [error, setError]             = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !description.trim() || !amount) { setError('Please fill in all fields.'); return; }
    const num = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) { setError('Enter a valid positive amount.'); return; }
    const cat = CATEGORIES.find(c => c.label === category)!;
    onSave({
      id: initial?.id ?? uid(),
      date,
      description: description.trim(),
      category,
      categoryColor: cat.color,
      type,
      amount: type === 'Income' ? `+ ${fmt(num)}` : `- ${fmt(num)}`,
      rawAmount: num,
      // preserve createdAt on edit so Firestore handler knows it's an update
      ...(initial?.createdAt !== undefined ? { createdAt: initial.createdAt } : {}),
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="form-error">{error}</p>}
        <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>
        <label>Description<input type="text" placeholder="e.g. Salary Deposit" value={description} onChange={e => setDescription(e.target.value)} required /></label>
        <div className="form-row">
          <label>Type
            <select value={type} onChange={e => setType(e.target.value as 'Income' | 'Expense')}>
              <option>Income</option><option>Expense</option>
            </select>
          </label>
          <label>Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <label>Amount (₦)<input type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{initial ? 'Save Changes' : 'Add Transaction'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Premium modal ────────────────────────────────────────────────────────────

function PremiumModal({ onClose }: { onClose: () => void }) {
  const features = [
    'Unlimited transaction history', 'Advanced analytics & reports',
    'Multi-currency support', 'Export to CSV / PDF',
    'Priority customer support', 'Custom budget categories',
  ];
  return (
    <Modal title="Upgrade to Premium" onClose={onClose}>
      <div className="premium-modal-body">
        <div className="premium-modal-icon"><Crown size={36} /></div>
        <p className="premium-modal-tagline">Unlock the full power of ExpenseFlow</p>
        <ul className="premium-features">
          {features.map(f => <li key={f}><CheckCircle size={15} />{f}</li>)}
        </ul>
        <div className="premium-pricing">
          <span className="price">₦2,500<small>/month</small></span>
          <span className="price-alt">or ₦24,000/year (save 20%)</span>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Maybe Later</button>
          <button className="btn-primary" onClick={() => { alert('Redirecting to payment…'); onClose(); }}>Upgrade Now</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Date range modal ─────────────────────────────────────────────────────────

function DateRangeModal({ current, onSave, onClose }: {
  current: string; onSave: (label: string) => void; onClose: () => void;
}) {
  const [start, setStart] = useState('');
  const [end, setEnd]     = useState('');
  const presets = ['This Month','Last Month','Last 3 Months','Last 6 Months','This Year','All Time'];

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    const f = (s: string) => new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    onSave(`${f(start)} – ${f(end)}`);
    onClose();
  }

  return (
    <Modal title="Select Date Range" onClose={onClose}>
      <div className="date-modal-body">
        <p className="date-current">Current: <strong>{current}</strong></p>
        <div className="date-presets">
          {presets.map(p => <button key={p} className="preset-btn" onClick={() => { onSave(p); onClose(); }}>{p}</button>)}
        </div>
        <p className="date-or">— or pick a custom range —</p>
        <form className="modal-form" onSubmit={handleApply} noValidate>
          <div className="form-row">
            <label>From<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
            <label>To<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!start || !end}>Apply Range</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ─── Row ⋮ menu ───────────────────────────────────────────────────────────────

function RowMenu({ transaction, onEdit, onDelete }: {
  transaction: Transaction; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));
  return (
    <div className="row-menu-wrap" ref={ref}>
      <button className="more-button" aria-label={`More options for ${transaction.description}`} onClick={() => setOpen(o => !o)}>
        <MoreVertical size={17} />
      </button>
      {open && (
        <div className="row-menu">
          <button onClick={() => { onEdit(); setOpen(false); }}><Pencil size={13} /> Edit</button>
          <button className="delete" onClick={() => { onDelete(); setOpen(false); }}><Trash2 size={13} /> Delete</button>
        </div>
      )}
    </div>
  );
}

// ─── Transactions page ────────────────────────────────────────────────────────

function TransactionsPage({ transactions, onAdd, onEdit, onDelete, searchQuery }: {
  transactions: Transaction[]; onAdd: () => void;
  onEdit: (t: Transaction) => void; onDelete: (id: string) => void; searchQuery: string;
}) {
  const [filter, setFilter]     = useState<'All' | 'Income' | 'Expense'>('All');
  const [catFilter, setCatFilter] = useState('All');

  const visible = transactions.filter(t => {
    const matchType   = filter === 'All' || t.type === filter;
    const matchCat    = catFilter === 'All' || t.category === catFilter;
    const q           = searchQuery.toLowerCase();
    const matchSearch = !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.amount.toLowerCase().includes(q);
    return matchType && matchCat && matchSearch;
  });

  return (
    <div className="page-transactions">
      <div className="page-heading">
        <div><h1>Transactions</h1><p>All your financial activity in one place.</p></div>
        <button className="add-button" onClick={onAdd}><Plus size={17} /> Add Transaction</button>
      </div>
      <div className="filter-bar">
        <div className="filter-group">
          {(['All','Income','Expense'] as const).map(f => (
            <button key={f} className={filter === f ? 'filter-btn active' : 'filter-btn'} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <select className="cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}
        </select>
      </div>
      <div className="panel transactions-panel">
        <div className="table-wrap">
          {visible.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={32} />}
              title="No transactions yet"
              body={searchQuery || filter !== 'All' || catFilter !== 'All'
                ? "Nothing matches your current filters."
                : "Add your first transaction to get started."}
              action={!searchQuery && filter === 'All' && catFilter === 'All' ? '+ Add Transaction' : undefined}
              onAction={!searchQuery && filter === 'All' && catFilter === 'All' ? onAdd : undefined}
            />
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th><th /></tr></thead>
              <tbody>
                {visible.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td className="description">{t.description}</td>
                    <td><span className="category"><i style={{ backgroundColor: t.categoryColor }} />{t.category}</span></td>
                    <td><span className={t.type === 'Income' ? 'type income' : 'type expense'}>{t.type === 'Income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</span></td>
                    <td className={t.type === 'Income' ? 'amount income-text' : 'amount expense-text'}>{t.amount}</td>
                    <td><span className="status"><Check size={12} /> Completed</span></td>
                    <td><RowMenu transaction={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics page ───────────────────────────────────────────────────────────

function AnalyticsPage({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="page-analytics">
        <div className="page-heading"><div><h1>Analytics</h1><p>Deep dive into your financial patterns.</p></div></div>
        <EmptyState icon={<BarChart3 size={32} />} title="No data yet" body="Add some transactions and your analytics will appear here automatically." />
      </div>
    );
  }

  // Build monthly summary from real transactions
  const monthMap: Record<string, { income: number; expense: number }> = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = d.toLocaleString('en-NG', { month: 'short', year: 'numeric' });
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    if (t.type === 'Income') monthMap[key].income += t.rawAmount;
    else monthMap[key].expense += t.rawAmount;
  });
  const monthly = Object.entries(monthMap).map(([month, v]) => ({ month: month.split(' ')[0], ...v })).slice(-5);
  const maxVal  = Math.max(...monthly.flatMap(m => [m.income, m.expense]), 1);

  // Spending by category
  const catMap: Record<string, { amount: number; color: string }> = {};
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = { amount: 0, color: t.categoryColor };
    catMap[t.category].amount += t.rawAmount;
  });
  const totalExpense = Object.values(catMap).reduce((s, v) => s + v.amount, 0) || 1;
  const spendingData = Object.entries(catMap).map(([label, v]) => ({
    label, color: v.color,
    amount: fmt(v.amount),
    percent: Math.round((v.amount / totalExpense) * 100) + '%',
  }));

  return (
    <div className="page-analytics">
      <div className="page-heading"><div><h1>Analytics</h1><p>Deep dive into your financial patterns.</p></div></div>
      <div className="analytics-grid">
        <article className="panel analytics-card">
          <div className="panel-heading"><h2>Monthly Income vs Expenses</h2></div>
          <div className="bar-chart-wrap">
            {monthly.map(m => (
              <div className="month-group" key={m.month}>
                <div className="month-bars">
                  <div className="month-bar income-bar" style={{ height: `${(m.income / maxVal) * 160}px` }} title={fmt(m.income)} />
                  <div className="month-bar expense-bar" style={{ height: `${(m.expense / maxVal) * 160}px` }} title={fmt(m.expense)} />
                </div>
                <span className="month-label">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend" style={{ padding: '0 17px 16px' }}>
            <span><i className="income-dot" />Income</span>
            <span><i className="expense-dot" />Expenses</span>
          </div>
        </article>
        <article className="panel analytics-card">
          <div className="panel-heading"><h2>Spending Breakdown</h2></div>
          <div className="spending-body">
            <DonutChart
              total={totalExpense}
              segments={spendingData.map(s => ({ pct: parseInt(s.percent), color: s.color }))}
            />
            <div className="legend">
              {spendingData.map(item => (
                <div className="legend-row" key={item.label}>
                  <span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.label}</span>
                  <strong>{item.amount}</strong>
                  <small>{item.percent}</small>
                </div>
              ))}
            </div>
          </div>
        </article>
        <article className="panel analytics-card full-width">
          <div className="panel-heading"><h2>Savings Rate Trend</h2></div>
          <div className="savings-trend">
            {monthly.map(m => {
              const rate = m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 100) : 0;
              return (
                <div className="trend-item" key={m.month}>
                  <div className="trend-bar-wrap">
                    <div className="trend-bar" style={{ height: `${Math.max(rate, 0) * 1.4}px`, background: rate >= 60 ? '#25bd8d' : rate >= 40 ? '#f5a719' : '#f04b67' }} />
                  </div>
                  <span>{m.month}</span>
                  <small>{rate}%</small>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── Budgets page ─────────────────────────────────────────────────────────────

function BudgetsPage({ transactions, onAddTransaction }: {
  transactions: Transaction[]; onAddTransaction: () => void;
}) {
  // Derive spent per category from real transactions
  const spentMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    spentMap[t.category] = (spentMap[t.category] ?? 0) + t.rawAmount;
  });

  const budgetDefs: { label: string; limit: number; color: string; icon: ReactNode }[] = [
    { label: 'Food & Dining',    limit: 35000, color: '#7355ef', icon: <Coffee size={16} /> },
    { label: 'Transport',        limit: 20000, color: '#3277ed', icon: <Car size={16} /> },
    { label: 'Shopping',         limit: 15000, color: '#fa773a', icon: <ShoppingBag size={16} /> },
    { label: 'Bills & Utilities',limit: 12000, color: '#f5a719', icon: <Zap size={16} /> },
    { label: 'Entertainment',    limit: 10000, color: '#eb5892', icon: <Sparkles size={16} /> },
  ];

  const hasActivity = Object.keys(spentMap).length > 0;

  return (
    <div className="page-budgets">
      <div className="page-heading">
        <div><h1>Budgets</h1><p>Keep your spending in check.</p></div>
        <button className="add-button" onClick={onAddTransaction}><Plus size={17} /> Add Transaction</button>
      </div>
      {!hasActivity ? (
        <EmptyState
          icon={<WalletCards size={32} />}
          title="No spending data yet"
          body="Once you add expense transactions, your budget progress will show up here."
          action="+ Add Transaction"
          onAction={onAddTransaction}
        />
      ) : (
        <div className="budgets-grid">
          {budgetDefs.map(b => {
            const spent = spentMap[b.label] ?? 0;
            const pct   = Math.min(Math.round((spent / b.limit) * 100), 100);
            const over  = spent > b.limit;
            return (
              <article className="panel budget-card" key={b.label}>
                <div className="budget-top">
                  <div className="budget-icon" style={{ background: b.color + '22', color: b.color }}>{b.icon}</div>
                  <div><strong>{b.label}</strong><small>{fmt(spent)} of {fmt(b.limit)}</small></div>
                  <span className={over ? 'budget-pct over' : 'budget-pct'}>{pct}%</span>
                </div>
                <div className="budget-bar-track">
                  <div className="budget-bar-fill" style={{ width: `${pct}%`, background: over ? '#f04b67' : b.color }} />
                </div>
                {over && <p className="budget-warn">Over budget by {fmt(spent - b.limit)}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Goals page ───────────────────────────────────────────────────────────────

function GoalsPage({ transactions }: { transactions: Transaction[] }) {
  // Total income saved so far (income minus expenses)
  const totalIncome  = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.rawAmount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.rawAmount, 0);
  const netSavings   = Math.max(totalIncome - totalExpense, 0);

  const goalDefs: Goal[] = [
    { label: 'Emergency Fund',   saved: netSavings, target: 300000, color: '#25bd8d', deadline: 'Dec 2025' },
    { label: 'New Laptop',       saved: Math.min(netSavings * 0.3, 200000), target: 200000, color: '#3277ed', deadline: 'Aug 2025' },
    { label: 'Vacation Fund',    saved: Math.min(netSavings * 0.15, 150000), target: 150000, color: '#7355ef', deadline: 'Oct 2025' },
    { label: 'Car Down Payment', saved: Math.min(netSavings * 0.5, 500000), target: 500000, color: '#f5a719', deadline: 'Mar 2026' },
  ];

  if (transactions.length === 0) {
    return (
      <div className="page-goals">
        <div className="page-heading"><div><h1>Goals</h1><p>Track your savings milestones.</p></div></div>
        <EmptyState icon={<Target size={32} />} title="No savings data yet" body="Your goal progress will update automatically as you log income and expenses." />
      </div>
    );
  }

  return (
    <div className="page-goals">
      <div className="page-heading"><div><h1>Goals</h1><p>Track your savings milestones.</p></div></div>
      <div className="goals-grid">
        {goalDefs.map(g => {
          const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
          return (
            <article className="panel goal-card" key={g.label}>
              <div className="goal-header">
                <div className="goal-color-dot" style={{ background: g.color }} />
                <strong>{g.label}</strong>
                <span className="goal-deadline">{g.deadline}</span>
              </div>
              <div className="goal-amounts">
                <span className="goal-saved">{fmt(Math.round(g.saved))}</span>
                <span className="goal-target">of {fmt(g.target)}</span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
              </div>
              <div className="goal-footer">
                <span>{pct}% complete</span>
                <span>{fmt(Math.max(g.target - Math.round(g.saved), 0))} to go</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Categories page ──────────────────────────────────────────────────────────

function CategoriesPage({ transactions }: { transactions: Transaction[] }) {
  const catTotals: Record<string, { color: string; total: number; count: number }> = {};
  transactions.forEach(t => {
    if (!catTotals[t.category]) catTotals[t.category] = { color: t.categoryColor, total: 0, count: 0 };
    catTotals[t.category].total += t.rawAmount;
    catTotals[t.category].count += 1;
  });

  return (
    <div className="page-categories">
      <div className="page-heading"><div><h1>Categories</h1><p>Manage how your spending is grouped.</p></div></div>
      <div className="categories-grid">
        {CATEGORIES.map(c => {
          const data = catTotals[c.label];
          return (
            <article className="panel category-card" key={c.label}>
              <div className="cat-dot" style={{ background: c.color }} />
              <strong>{c.label}</strong>
              {data
                ? <small className="cat-stat">{data.count} transaction{data.count !== 1 ? 's' : ''} · {fmt(data.total)}</small>
                : <small className="cat-stat cat-stat-empty">No activity</small>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Calendar page ────────────────────────────────────────────────────────────

function CalendarPage({ transactions }: { transactions: Transaction[] }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthName  = new Date(year, month).toLocaleString('en-NG', { month: 'long', year: 'numeric' });
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth= new Date(year, month + 1, 0).getDate();

  const byDay: Record<number, Transaction[]> = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay[day] = byDay[day] ? [...byDay[day], t] : [t];
    }
  });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="page-calendar">
      <div className="page-heading"><div><h1>Calendar</h1><p>See your transactions by date.</p></div></div>
      <div className="panel calendar-panel">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>‹</button>
          <strong>{monthName}</strong>
          <button className="cal-nav-btn" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>›</button>
        </div>
        <div className="cal-grid">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div className="cal-day-label" key={d}>{d}</div>)}
          {cells.map((day, i) => (
            <div
              className={`cal-cell ${day === null ? 'empty' : ''} ${day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 'today' : ''}`}
              key={i}
            >
              {day && <>
                <span className="cal-day-num">{day}</span>
                {byDay[day] && (
                  <div className="cal-dots">
                    {byDay[day].slice(0, 3).map(t => <span key={t.id} className="cal-dot" style={{ background: t.categoryColor }} title={t.description} />)}
                  </div>
                )}
              </>}
            </div>
          ))}
        </div>
        {transactions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#a0aabc', fontSize: 12, padding: '20px 0' }}>
            No transactions to display. Add one to see it here.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

function SettingsPage({ user, dark, setDark }: { user: User; dark: boolean; setDark: (v: boolean) => void }) {
  const [name, setName]         = useState(user.displayName ?? '');
  const [currency, setCurrency] = useState('NGN (₦)');
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);

  // Load saved profile prefs from Firestore on mount
  useEffect(() => {
    getProfile(user.uid).then(p => {
      if (p?.currency) setCurrency(p.currency);
      if (p?.displayName) setName(p.displayName);
    });
  }, [user.uid]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Update Firebase Auth display name
      await updateProfile(user, { displayName: name.trim() });
      // Save prefs to Firestore
      await saveProfile(user.uid, { displayName: name.trim(), currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-settings">
      <div className="page-heading"><div><h1>Settings</h1><p>Manage your account and preferences.</p></div></div>
      <div className="settings-grid">
        <article className="panel settings-card">
          <div className="panel-heading"><h2>Profile</h2></div>
          <form className="settings-form" onSubmit={handleSave}>
            {saved && <p className="form-success">Changes saved successfully!</p>}
            <label>Full Name<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email Address<input type="email" value={user.email ?? ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} /></label>
            <label>Currency<select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option>NGN (₦)</option><option>USD ($)</option><option>GBP (£)</option><option>EUR (€)</option>
            </select></label>
            <div className="form-actions"><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button></div>
          </form>
        </article>
        <article className="panel settings-card">
          <div className="panel-heading"><h2>Appearance</h2></div>
          <div className="settings-form">
            <div className="toggle-row">
              <div><strong>Dark Mode</strong><p>Switch between light and dark theme</p></div>
              <button className={`toggle-switch ${dark ? 'on' : ''}`} onClick={() => setDark(!dark)} aria-label="Toggle dark mode" role="switch" aria-checked={dark}>
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </article>
        <article className="panel settings-card">
          <div className="panel-heading"><h2>Security</h2></div>
          <div className="settings-form">
            <label>Current Password<input type="password" placeholder="••••••••" /></label>
            <label>New Password<input type="password" placeholder="••••••••" /></label>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => alert('Password updated!')}>Update Password</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

function DashboardPage({ user, transactions, onAdd, onEdit, onDelete, onViewAll, period, setPeriod, cashBars }: {
  user: User; transactions: Transaction[];
  onAdd: () => void; onEdit: (t: Transaction) => void; onDelete: (id: string) => void;
  onViewAll: () => void; period: string; setPeriod: (p: string) => void; cashBars: [number, number][];
}) {
  const [periodOpen, setPeriodOpen]         = useState(false);
  const [cashPeriodOpen, setCashPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const cashRef   = useRef<HTMLDivElement>(null);
  useOutsideClick(periodRef, () => setPeriodOpen(false));
  useOutsideClick(cashRef,   () => setCashPeriodOpen(false));

  const totalIncome  = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.rawAmount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.rawAmount, 0);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  // Spending breakdown for donut
  const catMap: Record<string, { amount: number; color: string }> = {};
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = { amount: 0, color: t.categoryColor };
    catMap[t.category].amount += t.rawAmount;
  });
  const spendingData = Object.entries(catMap).map(([label, v]) => ({
    label, color: v.color,
    amount: fmt(v.amount),
    percent: totalExpense > 0 ? Math.round((v.amount / totalExpense) * 100) + '%' : '0%',
  }));

  const recent = transactions.slice(0, 5);

  return (
    <>
      <section className="summary-grid">
        <SummaryCard title="Total Income"   amount={fmt(totalIncome)}  note={totalIncome > 0 ? 'Updated just now' : 'No income yet'} color="#25bd8d" icon={<ArrowDownLeft size={18} />} />
        <SummaryCard title="Total Expenses" amount={fmt(totalExpense)} note={totalExpense > 0 ? 'Updated just now' : 'No expenses yet'} color="#f04b67" icon={<ArrowUpRight size={18} />} positive={false} />
        <SummaryCard title="Balance"        amount={fmt(balance)}      note={balance >= 0 ? 'Looking good!' : 'Spending exceeds income'} color="#3277ed" icon={<WalletCards size={18} />} positive={balance >= 0} />
        <SummaryCard title="Savings Rate"   amount={`${savingsRate}%`} note={savingsRate >= 20 ? 'Great work!' : transactions.length === 0 ? 'Add transactions' : 'Keep it up!'} color="#8754ed" icon={<Sparkles size={18} />} />
      </section>

      <section className="charts-grid">
        <article className="panel spending-panel">
          <div className="panel-heading">
            <h2>Spending Overview</h2>
            <div className="period-select-wrap" ref={periodRef}>
              <button className="select-button" onClick={() => setPeriodOpen(o => !o)}>{period}<ChevronDown size={14} /></button>
              {periodOpen && (
                <div className="period-dropdown">
                  {PERIODS.map(p => <button key={p} className={p === period ? 'active' : ''} onClick={() => { setPeriod(p); setPeriodOpen(false); }}>{p}</button>)}
                </div>
              )}
            </div>
          </div>
          <div className="spending-body">
            {spendingData.length === 0 ? (
              <EmptyState icon={<Grid2X2 size={28} />} title="No spending data" body="Your spending breakdown will appear once you add expense transactions." />
            ) : (
              <>
                <DonutChart
                  total={totalExpense}
                  segments={spendingData.map(s => ({ pct: parseInt(s.percent), color: s.color }))}
                />
                <div className="legend">
                  {spendingData.map(item => (
                    <div className="legend-row" key={item.label}>
                      <span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.label}</span>
                      <strong>{item.amount}</strong>
                      <small>{item.percent}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>

        <article className="panel cash-panel">
          <div className="panel-heading">
            <div>
              <h2>Cash Flow</h2>
              <div className="chart-legend"><span><i className="income-dot" />Income</span><span><i className="expense-dot" />Expenses</span></div>
            </div>
            <div className="period-select-wrap" ref={cashRef}>
              <button className="select-button" onClick={() => setCashPeriodOpen(o => !o)}>{period}<ChevronDown size={14} /></button>
              {cashPeriodOpen && (
                <div className="period-dropdown">
                  {PERIODS.map(p => <button key={p} className={p === period ? 'active' : ''} onClick={() => { setPeriod(p); setCashPeriodOpen(false); }}>{p}</button>)}
                </div>
              )}
            </div>
          </div>
          <CashFlowChart bars={cashBars} />
        </article>
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <h2>Recent Transactions</h2>
          <button className="view-all" onClick={onViewAll}>View All</button>
        </div>
        <div className="table-wrap">
          {recent.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={28} />}
              title="No transactions yet"
              body="Tap 'Add Transaction' to log your first one."
              action="+ Add Transaction"
              onAction={onAdd}
            />
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th><th /></tr></thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td className="description">{t.description}</td>
                    <td><span className="category"><i style={{ backgroundColor: t.categoryColor }} />{t.category}</span></td>
                    <td><span className={t.type === 'Income' ? 'type income' : 'type expense'}>{t.type === 'Income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</span></td>
                    <td className={t.type === 'Income' ? 'amount income-text' : 'amount expense-text'}>{t.amount}</td>
                    <td><span className="status"><Check size={12} /> Completed</span></td>
                    <td><RowMenu transaction={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  const [authUser, setAuthUser]   = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // ── Firebase auth listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthUser(user);
      setAuthLoading(false);
      if (user)  setPage('app');
      if (!user) setPage(prev => prev === 'app' ? 'landing' : prev);
    });
    return unsub;
  }, []);

  const [activeNav, setActiveNav]             = useState('Dashboard');
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [dark, setDark]                       = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [period, setPeriod]                   = useState('This Month');
  const [dateLabel, setDateLabel]             = useState('This Month');
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [showPremium, setShowPremium]         = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [transactions, setTransactions]       = useState<Transaction[]>([]);
  const [txModal, setTxModal]                 = useState<{ open: boolean; initial?: Transaction }>({ open: false });
  const [notifications, setNotifications]     = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setShowProfileMenu(false));
  useOutsideClick(notifRef,   () => setShowNotifications(false));

  // ── Dark mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // ── Firestore real-time listeners — attach when user logs in ───────────────
  useEffect(() => {
    if (!authUser) {
      setTransactions([]);
      setNotifications([]);
      setActiveNav('Dashboard');
      setSearchQuery('');
      return;
    }
    const uid = authUser.uid;
    const unsubTx    = subscribeTransactions(uid, setTransactions);
    const unsubNotif = subscribeNotifications(uid, setNotifications);
    return () => { unsubTx(); unsubNotif(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.uid]);

  const cashBars    = period === 'Last Month' ? lastMonthBars : chartBars;
  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Transaction handlers — write to Firestore ──────────────────────────────
  async function handleSaveTransaction(t: Transaction) {
    if (!authUser) return;
    if (t.createdAt !== undefined) {
      await updateTransaction(authUser.uid, t);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, ...data } = t;
      await addTransaction(authUser.uid, data);
    }
  }

  async function handleDeleteTransaction(id: string) {
    if (!authUser) return;
    await deleteTransaction(authUser.uid, id);
  }

  // ── Notification handlers — write to Firestore ─────────────────────────────
  async function markRead(id: string) {
    if (!authUser) return;
    await markNotificationRead(authUser.uid, id);
  }

  async function markAllRead() {
    if (!authUser) return;
    await markAllNotificationsRead(authUser.uid, notifications.map(n => n.id));
  }

  async function clearNotifications() {
    if (!authUser) return;
    await clearAllNotifications(authUser.uid, notifications.map(n => n.id));
    setShowNotifications(false);
  }

  function handleSignOut() {
    signOut(auth);
    setShowProfileMenu(false);
    setPage('landing');
  }

  const navToTransactions = () => { setActiveNav('Transactions'); setMobileOpen(false); };

  // ── Render guards ──────────────────────────────────────────────────────────
  if (authLoading) return <LoadingScreen />;
  if (page === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => { setAuthMode('signup'); setPage('auth'); }}
        onLogin={() => { setAuthMode('login'); setPage('auth'); }}
      />
    );
  }
  if (page === 'auth' || !authUser) {
    return <AuthPage initialMode={authMode} onBack={() => setPage('landing')} />;
  }

  // ── Page renderer ──────────────────────────────────────────────────────────
  function renderPage() {
    if (!authUser) return null;
    switch (activeNav) {
      case 'Transactions': return <TransactionsPage transactions={transactions} onAdd={() => setTxModal({ open: true })} onEdit={t => setTxModal({ open: true, initial: t })} onDelete={handleDeleteTransaction} searchQuery={searchQuery} />;
      case 'Analytics':    return <AnalyticsPage transactions={transactions} />;
      case 'Budgets':      return <BudgetsPage transactions={transactions} onAddTransaction={() => setTxModal({ open: true })} />;
      case 'Goals':        return <GoalsPage transactions={transactions} />;
      case 'Categories':   return <CategoriesPage transactions={transactions} />;
      case 'Calendar':     return <CalendarPage transactions={transactions} />;
      case 'Settings':     return <SettingsPage user={authUser} dark={dark} setDark={setDark} />;
      default:             return (
        <DashboardPage
          user={authUser}
          transactions={transactions}
          onAdd={() => setTxModal({ open: true })}
          onEdit={t => setTxModal({ open: true, initial: t })}
          onDelete={handleDeleteTransaction}
          onViewAll={navToTransactions}
          period={period}
          setPeriod={setPeriod}
          cashBars={cashBars}
        />
      );
    }
  }

  const displayName = authUser.displayName;
  const userInitials = initials(displayName);
  const userFirstName = firstName(displayName);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><WalletCards size={19} /></div>
          <span>Expense<span>Flow</span></span>
          <button className="close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: NavIcon }) => (
            <button
              className={activeNav === label ? 'nav-item active' : 'nav-item'}
              key={label}
              onClick={() => { setActiveNav(label); setMobileOpen(false); }}
            >
              <NavIcon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="premium-card">
          <div className="premium-icon"><Gem size={18} /></div>
          <strong>Go Premium</strong>
          <p>Unlock exclusive features and insights</p>
          <button onClick={() => { setShowPremium(true); setMobileOpen(false); }}>Upgrade Now</button>
        </div>

        <div className="profile-wrap" ref={profileRef}>
          <button className="profile" onClick={() => setShowProfileMenu(o => !o)}>
            <div className="avatar">{userInitials}</div>
            <div>
              <strong>{displayName ?? 'User'}</strong>
              <small>{authUser.email}</small>
            </div>
            <ChevronDown size={15} />
          </button>
          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={() => { setActiveNav('Settings'); setShowProfileMenu(false); setMobileOpen(false); }}><UserIcon size={13} /> View Profile</button>
              <button onClick={handleSignOut}><LogOut size={13} /> Sign Out</button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="search-box">
            <Search size={17} />
            <input
              aria-label="Search transactions"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (e.target.value && activeNav !== 'Transactions') setActiveNav('Transactions');
              }}
            />
            {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search"><X size={14} /></button>}
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Toggle dark mode" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="notification-wrap" ref={notifRef}>
              <button className="icon-button" onClick={() => setShowNotifications(o => !o)} aria-label="Notifications">
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-popover">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    <div className="notif-actions">
                      {unreadCount > 0 && <button onClick={markAllRead}>Mark all read</button>}
                      <button onClick={clearNotifications}>Clear all</button>
                    </div>
                  </div>
                  {notifications.length === 0
                    ? <p className="notif-empty">You're all caught up 🎉</p>
                    : notifications.map(n => (
                      <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`} onClick={() => markRead(n.id)}>
                        <span className={`notif-dot ${n.read ? '' : 'unread'}`} />
                        <p>{n.text}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <button className="add-button" onClick={() => setTxModal({ open: true })}>
              <Plus size={17} /> Add Transaction
            </button>
          </div>
        </header>

        {activeNav === 'Dashboard' && (
          <section className="page-heading">
            <div>
              <h1>{greeting()}, {userFirstName} <span>👋</span></h1>
              <p>Here's what's happening with your finances today.</p>
            </div>
            <button className="date-button" onClick={() => setShowDatePicker(true)}>
              <CalendarDays size={17} /> {dateLabel} <ChevronDown size={15} />
            </button>
          </section>
        )}

        <div className="page-body">{renderPage()}</div>
      </main>

      {/* ── Modals ── */}
      {txModal.open && (
        <TransactionModal
          initial={txModal.initial}
          onSave={handleSaveTransaction}
          onClose={() => setTxModal({ open: false })}
        />
      )}
      {showDatePicker && (
        <DateRangeModal current={dateLabel} onSave={setDateLabel} onClose={() => setShowDatePicker(false)} />
      )}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}

export default App;
