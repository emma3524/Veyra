import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Gem,
  Grid2X2,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  WalletCards,
  X,
  Pencil,
  Trash2,
  User,
  LogOut,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShoppingBag,
  Zap,
  Coffee,
  Car,
  CheckCircle,
  Crown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type IconComponent = typeof LayoutDashboard;

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  categoryColor: string;
  type: 'Income' | 'Expense';
  amount: string;
  rawAmount: number;
};

type Notification = {
  id: string;
  text: string;
  read: boolean;
};

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
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Transactions', icon: CreditCard },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Budgets', icon: WalletCards },
  { label: 'Goals', icon: Target },
  { label: 'Categories', icon: Grid2X2 },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Settings', icon: Settings },
];

const CATEGORIES = [
  { label: 'Income', color: '#25bd8d' },
  { label: 'Food & Dining', color: '#7355ef' },
  { label: 'Transport', color: '#3277ed' },
  { label: 'Bills & Utilities', color: '#f5a719' },
  { label: 'Shopping', color: '#fa773a' },
  { label: 'Entertainment', color: '#eb5892' },
  { label: 'Healthcare', color: '#f04b67' },
  { label: 'Others', color: '#8b97b1' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: 'May 31, 2024', description: 'Salary Deposit', category: 'Income', categoryColor: '#25bd8d', type: 'Income', amount: '+ ₦150,000', rawAmount: 150000 },
  { id: '2', date: 'May 31, 2024', description: 'Lunch at Ter...kulture', category: 'Food & Dining', categoryColor: '#7355ef', type: 'Expense', amount: '- ₦4,500', rawAmount: 4500 },
  { id: '3', date: 'May 30, 2024', description: 'Bolt Ride', category: 'Transport', categoryColor: '#3277ed', type: 'Expense', amount: '- ₦2,800', rawAmount: 2800 },
  { id: '4', date: 'May 30, 2024', description: 'Internet Subscription', category: 'Bills & Utilities', categoryColor: '#f5a719', type: 'Expense', amount: '- ₦3,500', rawAmount: 3500 },
  { id: '5', date: 'May 29, 2024', description: 'Groceries', category: 'Food & Dining', categoryColor: '#7355ef', type: 'Expense', amount: '- ₦6,700', rawAmount: 6700 },
  { id: '6', date: 'May 28, 2024', description: 'Netflix Subscription', category: 'Entertainment', categoryColor: '#eb5892', type: 'Expense', amount: '- ₦4,200', rawAmount: 4200 },
  { id: '7', date: 'May 27, 2024', description: 'Freelance Payment', category: 'Income', categoryColor: '#25bd8d', type: 'Income', amount: '+ ₦45,000', rawAmount: 45000 },
  { id: '8', date: 'May 26, 2024', description: 'Electricity Bill', category: 'Bills & Utilities', categoryColor: '#f5a719', type: 'Expense', amount: '- ₦8,500', rawAmount: 8500 },
  { id: '9', date: 'May 25, 2024', description: 'Jumia Shopping', category: 'Shopping', categoryColor: '#fa773a', type: 'Expense', amount: '- ₦12,500', rawAmount: 12500 },
  { id: '10', date: 'May 24, 2024', description: 'Pharmacy', category: 'Healthcare', categoryColor: '#f04b67', type: 'Expense', amount: '- ₦2,300', rawAmount: 2300 },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', text: 'Your monthly report for May is ready.', read: false },
  { id: '2', text: 'You are within your food budget for this month.', read: false },
  { id: '3', text: 'New feature: Set savings goals and track progress!', read: false },
];

const spending = [
  { label: 'Food & Dining', amount: '₦25,000', percent: '31%', color: '#7355ef' },
  { label: 'Transport', amount: '₦15,000', percent: '19%', color: '#3277ed' },
  { label: 'Shopping', amount: '₦12,500', percent: '16%', color: '#25bd8d' },
  { label: 'Bills & Utilities', amount: '₦10,000', percent: '12%', color: '#f5a719' },
  { label: 'Entertainment', amount: '₦8,000', percent: '10%', color: '#fa773a' },
  { label: 'Others', amount: '₦10,000', percent: '12%', color: '#eb5892' },
];

const chartBars: [number, number][] = [
  [20, 38], [34, 66], [25, 44], [11, 24], [8, 33], [41, 19], [18, 35], [13, 23], [45, 20], [27, 35], [14, 58], [31, 18], [8, 42], [22, 16], [15, 37], [32, 19], [18, 45], [9, 31], [23, 14], [16, 30], [7, 25], [22, 10], [14, 30], [10, 20],
];

const lastMonthBars: [number, number][] = [
  [18, 42], [30, 55], [22, 38], [14, 28], [10, 30], [38, 22], [16, 40], [15, 20], [40, 25], [24, 40], [12, 50], [28, 20], [10, 38], [20, 18], [18, 42], [28, 22], [20, 38], [11, 28], [20, 16], [14, 33], [9, 22], [18, 12], [16, 28], [12, 18],
];

const PERIODS = ['This Month', 'Last Month', 'Last 3 Months', 'This Year'];

const budgets: Budget[] = [
  { label: 'Food & Dining', spent: 25000, limit: 35000, color: '#7355ef', icon: <Coffee size={16} /> },
  { label: 'Transport', spent: 15000, limit: 20000, color: '#3277ed', icon: <Car size={16} /> },
  { label: 'Shopping', spent: 12500, limit: 15000, color: '#fa773a', icon: <ShoppingBag size={16} /> },
  { label: 'Bills & Utilities', spent: 10000, limit: 12000, color: '#f5a719', icon: <Zap size={16} /> },
  { label: 'Entertainment', spent: 8000, limit: 10000, color: '#eb5892', icon: <Sparkles size={16} /> },
];

const goals: Goal[] = [
  { label: 'Emergency Fund', saved: 120000, target: 300000, color: '#25bd8d', deadline: 'Dec 2024' },
  { label: 'New Laptop', saved: 75000, target: 200000, color: '#3277ed', deadline: 'Aug 2024' },
  { label: 'Vacation Fund', saved: 40000, target: 150000, color: '#7355ef', deadline: 'Oct 2024' },
  { label: 'Car Down Payment', saved: 200000, target: 500000, color: '#f5a719', deadline: 'Mar 2025' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG');
}

function uid() {
  return Math.random().toString(36).slice(2);
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

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function IconBadge({ color, children }: { color: string; children: ReactNode }) {
  return <div className="icon-badge" style={{ backgroundColor: color }}>{children}</div>;
}

function SummaryCard({ title, amount, note, color, icon, positive = true }: { title: string; amount: string; note: string; color: string; icon: ReactNode; positive?: boolean }) {
  return (
    <article className="summary-card">
      <div className="summary-card-top"><IconBadge color={color}>{icon}</IconBadge><span>{title}</span></div>
      <strong>{amount}</strong>
      <p className={positive ? 'positive' : 'negative'}>{positive ? '↗' : '↗'} {note}</p>
    </article>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function DonutChart() {
  return (
    <div className="donut" aria-label="Spending breakdown chart">
      <div className="donut-hole"><strong>₦80,500</strong><span>Total</span></div>
    </div>
  );
}

function CashFlowChart({ bars }: { bars: [number, number][] }) {
  return (
    <div className="cash-flow-chart">
      <div className="y-axis"><span>₦60k</span><span>₦40k</span><span>₦20k</span><span>₦0</span><span>-₦20k</span><span>-₦40k</span></div>
      <div className="plot">
        <div className="grid-lines"><i /><i /><i /><i /><i /></div>
        <div className="bars">{bars.map(([income, expense], index) => <div className="bar-group" key={index}><b style={{ height: `${income}%` }} /><em style={{ height: `${expense}%` }} /></div>)}</div>
        <div className="x-axis"><span>May 1</span><span>May 8</span><span>May 15</span><span>May 22</span><span>May 31</span></div>
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
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

// ─── Add / Edit Transaction modal ─────────────────────────────────────────────

function TransactionModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Transaction;
  onSave: (t: Transaction) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Food & Dining');
  const [type, setType] = useState<'Income' | 'Expense'>(initial?.type ?? 'Expense');
  const [amount, setAmount] = useState(initial ? String(initial.rawAmount) : '');
  const [error, setError] = useState('');

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
    });
    onClose();
  }

  return (
    <Modal title={initial ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose}>
      <form className="modal-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="form-error">{error}</p>}
        <label>
          Date
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>
        <label>
          Description
          <input type="text" placeholder="e.g. Salary Deposit" value={description} onChange={e => setDescription(e.target.value)} required />
        </label>
        <div className="form-row">
          <label>
            Type
            <select value={type} onChange={e => setType(e.target.value as 'Income' | 'Expense')}>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c.label}>{c.label}</option>)}
            </select>
          </label>
        </div>
        <label>
          Amount (₦)
          <input type="number" min="0" step="any" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </label>
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
    'Unlimited transaction history',
    'Advanced analytics & reports',
    'Multi-currency support',
    'Export to CSV / PDF',
    'Priority customer support',
    'Custom budget categories',
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

// ─── Date range picker modal ──────────────────────────────────────────────────

function DateRangeModal({ current, onSave, onClose }: { current: string; onSave: (label: string) => void; onClose: () => void }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const presets = ['This Month', 'Last Month', 'Last 3 Months', 'Last 6 Months', 'This Year', 'All Time'];

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    const fmt = (s: string) => new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    onSave(`${fmt(start)} – ${fmt(end)}`);
    onClose();
  }

  return (
    <Modal title="Select Date Range" onClose={onClose}>
      <div className="date-modal-body">
        <p className="date-current">Current: <strong>{current}</strong></p>
        <div className="date-presets">
          {presets.map(p => (
            <button key={p} className="preset-btn" onClick={() => { onSave(p); onClose(); }}>{p}</button>
          ))}
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

// ─── Transaction row ⋮ menu ───────────────────────────────────────────────────

function RowMenu({ transaction, onEdit, onDelete }: { transaction: Transaction; onEdit: () => void; onDelete: () => void }) {
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

// ─── Transactions page (full) ─────────────────────────────────────────────────

function TransactionsPage({
  transactions,
  onAdd,
  onEdit,
  onDelete,
  searchQuery,
}: {
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
}) {
  const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [catFilter, setCatFilter] = useState('All');

  const visible = transactions.filter(t => {
    const matchType = filter === 'All' || t.type === filter;
    const matchCat = catFilter === 'All' || t.category === catFilter;
    const q = searchQuery.toLowerCase();
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
          {(['All', 'Income', 'Expense'] as const).map(f => (
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
          {visible.length === 0
            ? <p className="empty-state">No transactions match your filters.</p>
            : (
              <table>
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {visible.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.date}</td>
                      <td className="description">{transaction.description}</td>
                      <td><span className="category"><i style={{ backgroundColor: transaction.categoryColor }} />{transaction.category}</span></td>
                      <td><span className={transaction.type === 'Income' ? 'type income' : 'type expense'}>{transaction.type === 'Income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</span></td>
                      <td className={transaction.type === 'Income' ? 'amount income-text' : 'amount expense-text'}>{transaction.amount}</td>
                      <td><span className="status"><Check size={12} /> Completed</span></td>
                      <td>
                        <RowMenu transaction={transaction} onEdit={() => onEdit(transaction)} onDelete={() => onDelete(transaction.id)} />
                      </td>
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

function AnalyticsPage() {
  const monthly = [
    { month: 'Jan', income: 200000, expense: 70000 },
    { month: 'Feb', income: 220000, expense: 85000 },
    { month: 'Mar', income: 195000, expense: 90000 },
    { month: 'Apr', income: 240000, expense: 78000 },
    { month: 'May', income: 250000, expense: 80500 },
  ];
  const maxVal = Math.max(...monthly.flatMap(m => [m.income, m.expense]));

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
            <DonutChart />
            <div className="legend">
              {spending.map(item => <div className="legend-row" key={item.label}><span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.amount}</strong><small>{item.percent}</small></div>)}
            </div>
          </div>
        </article>
        <article className="panel analytics-card full-width">
          <div className="panel-heading"><h2>Savings Rate Trend</h2></div>
          <div className="savings-trend">
            {monthly.map(m => {
              const rate = Math.round(((m.income - m.expense) / m.income) * 100);
              return (
                <div className="trend-item" key={m.month}>
                  <div className="trend-bar-wrap">
                    <div className="trend-bar" style={{ height: `${rate * 1.4}px`, background: rate >= 60 ? '#25bd8d' : rate >= 40 ? '#f5a719' : '#f04b67' }} />
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

function BudgetsPage({ onAddTransaction }: { onAddTransaction: () => void }) {
  return (
    <div className="page-budgets">
      <div className="page-heading">
        <div><h1>Budgets</h1><p>Keep your spending in check.</p></div>
        <button className="add-button" onClick={onAddTransaction}><Plus size={17} /> Add Transaction</button>
      </div>
      <div className="budgets-grid">
        {budgets.map(b => {
          const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100);
          const over = b.spent > b.limit;
          return (
            <article className="panel budget-card" key={b.label}>
              <div className="budget-top">
                <div className="budget-icon" style={{ background: b.color + '22', color: b.color }}>{b.icon}</div>
                <div>
                  <strong>{b.label}</strong>
                  <small>{fmt(b.spent)} of {fmt(b.limit)}</small>
                </div>
                <span className={over ? 'budget-pct over' : 'budget-pct'}>{pct}%</span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{ width: `${pct}%`, background: over ? '#f04b67' : b.color }} />
              </div>
              {over && <p className="budget-warn">Over budget by {fmt(b.spent - b.limit)}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Goals page ───────────────────────────────────────────────────────────────

function GoalsPage() {
  return (
    <div className="page-goals">
      <div className="page-heading"><div><h1>Goals</h1><p>Track your savings milestones.</p></div></div>
      <div className="goals-grid">
        {goals.map(g => {
          const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
          return (
            <article className="panel goal-card" key={g.label}>
              <div className="goal-header">
                <div className="goal-color-dot" style={{ background: g.color }} />
                <strong>{g.label}</strong>
                <span className="goal-deadline">{g.deadline}</span>
              </div>
              <div className="goal-amounts">
                <span className="goal-saved">{fmt(g.saved)}</span>
                <span className="goal-target">of {fmt(g.target)}</span>
              </div>
              <div className="budget-bar-track">
                <div className="budget-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
              </div>
              <div className="goal-footer">
                <span>{pct}% complete</span>
                <span>{fmt(g.target - g.saved)} to go</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Categories page ──────────────────────────────────────────────────────────

function CategoriesPage() {
  return (
    <div className="page-categories">
      <div className="page-heading"><div><h1>Categories</h1><p>Manage how your spending is grouped.</p></div></div>
      <div className="categories-grid">
        {CATEGORIES.map(c => (
          <article className="panel category-card" key={c.label}>
            <div className="cat-dot" style={{ background: c.color }} />
            <strong>{c.label}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar page ────────────────────────────────────────────────────────────

function CalendarPage({ transactions }: { transactions: Transaction[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthName = new Date(year, month).toLocaleString('en-NG', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay: Record<number, Transaction[]> = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      byDay[day] = byDay[day] ? [...byDay[day], t] : [t];
    }
  });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

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
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div className="cal-day-label" key={d}>{d}</div>)}
          {cells.map((day, i) => (
            <div className={`cal-cell ${day === null ? 'empty' : ''} ${day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 'today' : ''}`} key={i}>
              {day && <>
                <span className="cal-day-num">{day}</span>
                {byDay[day] && <div className="cal-dots">{byDay[day].slice(0, 3).map(t => <span key={t.id} className="cal-dot" style={{ background: t.categoryColor }} title={t.description} />)}</div>}
              </>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

function SettingsPage({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [name, setName] = useState('Prince K.');
  const [email, setEmail] = useState('prince@example.com');
  const [currency, setCurrency] = useState('NGN (₦)');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-settings">
      <div className="page-heading"><div><h1>Settings</h1><p>Manage your account and preferences.</p></div></div>
      <div className="settings-grid">
        <article className="panel settings-card">
          <div className="panel-heading"><h2>Profile</h2></div>
          <form className="modal-form settings-form" onSubmit={handleSave}>
            {saved && <p className="form-success">Changes saved successfully!</p>}
            <label>Full Name<input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Email Address<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Currency<select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option>NGN (₦)</option><option>USD ($)</option><option>GBP (£)</option><option>EUR (€)</option>
            </select></label>
            <div className="form-actions"><button type="submit" className="btn-primary">Save Changes</button></div>
          </form>
        </article>
        <article className="panel settings-card">
          <div className="panel-heading"><h2>Appearance</h2></div>
          <div className="settings-form" style={{ padding: '16px' }}>
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
          <div className="settings-form" style={{ padding: '16px' }}>
            <label className="modal-form" style={{ display: 'grid', gap: '8px' }}>
              Current Password
              <input type="password" placeholder="••••••••" />
            </label>
            <label className="modal-form" style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
              New Password
              <input type="password" placeholder="••••••••" />
            </label>
            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button className="btn-primary" onClick={() => alert('Password updated!')}>Update Password</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

function DashboardPage({
  transactions,
  onAdd,
  onEdit,
  onDelete,
  onViewAll,
  period,
  setPeriod,
  cashBars,
}: {
  transactions: Transaction[];
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onViewAll: () => void;
  period: string;
  setPeriod: (p: string) => void;
  cashBars: [number, number][];
}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [cashPeriodOpen, setCashPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const cashRef = useRef<HTMLDivElement>(null);
  useOutsideClick(periodRef, () => setPeriodOpen(false));
  useOutsideClick(cashRef, () => setCashPeriodOpen(false));

  const recent = transactions.slice(0, 5);

  return (
    <>
      <section className="summary-grid">
        <SummaryCard title="Total Income" amount="₦250,000" note="12.5% vs last month" color="#25bd8d" icon={<ArrowDownLeft size={18} />} />
        <SummaryCard title="Total Expenses" amount="₦80,500" note="8.3% vs last month" color="#f04b67" icon={<ArrowUpRight size={18} />} positive={false} />
        <SummaryCard title="Balance" amount="₦169,500" note="15.8% vs last month" color="#3277ed" icon={<WalletCards size={18} />} />
        <SummaryCard title="Savings Rate" amount="68%" note="Good job!" color="#8754ed" icon={<Sparkles size={18} />} />
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
            <DonutChart />
            <div className="legend">{spending.map(item => <div className="legend-row" key={item.label}><span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.label}</span><strong>{item.amount}</strong><small>{item.percent}</small></div>)}</div>
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
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {recent.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td className="description">{transaction.description}</td>
                  <td><span className="category"><i style={{ backgroundColor: transaction.categoryColor }} />{transaction.category}</span></td>
                  <td><span className={transaction.type === 'Income' ? 'type income' : 'type expense'}>{transaction.type === 'Income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</span></td>
                  <td className={transaction.type === 'Income' ? 'amount income-text' : 'amount expense-text'}>{transaction.amount}</td>
                  <td><span className="status"><Check size={12} /> Completed</span></td>
                  <td>
                    <RowMenu transaction={transaction} onEdit={() => onEdit(transaction)} onDelete={() => onDelete(transaction.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('This Month');
  const [dateLabel, setDateLabel] = useState('May 1 – May 31, 2024');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [txModal, setTxModal] = useState<{ open: boolean; initial?: Transaction }>({ open: false });
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileRef, () => setShowProfileMenu(false));
  useOutsideClick(notifRef, () => setShowNotifications(false));

  // Dark mode: toggle class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const cashBars = period === 'Last Month' ? lastMonthBars : chartBars;
  const unreadCount = notifications.filter(n => !n.read).length;

  function handleSaveTransaction(t: Transaction) {
    setTransactions(prev => {
      const exists = prev.find(p => p.id === t.id);
      return exists ? prev.map(p => p.id === t.id ? t : p) : [t, ...prev];
    });
  }

  function handleDeleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
    setShowNotifications(false);
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const navToTransactions = () => { setActiveNav('Transactions'); setMobileOpen(false); };

  function renderPage() {
    switch (activeNav) {
      case 'Transactions':
        return <TransactionsPage transactions={transactions} onAdd={() => setTxModal({ open: true })} onEdit={t => setTxModal({ open: true, initial: t })} onDelete={handleDeleteTransaction} searchQuery={searchQuery} />;
      case 'Analytics':
        return <AnalyticsPage />;
      case 'Budgets':
        return <BudgetsPage onAddTransaction={() => setTxModal({ open: true })} />;
      case 'Goals':
        return <GoalsPage />;
      case 'Categories':
        return <CategoriesPage />;
      case 'Calendar':
        return <CalendarPage transactions={transactions} />;
      case 'Settings':
        return <SettingsPage dark={dark} setDark={setDark} />;
      default:
        return (
          <DashboardPage
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

  return (
    <div className="app-shell">
      {/* Sidebar */}
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
            <div className="avatar">PK</div>
            <div><strong>Prince K.</strong><small>prince@example.com</small></div>
            <ChevronDown size={15} />
          </button>
          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={() => { setActiveNav('Settings'); setShowProfileMenu(false); setMobileOpen(false); }}><User size={13} /> View Profile</button>
              <button onClick={() => { setShowProfileMenu(false); alert('Signed out. Goodbye, Prince!'); }}><LogOut size={13} /> Sign Out</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
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
                    ? <p className="notif-empty">No notifications</p>
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
              <h1>Good morning, Prince <span>👋</span></h1>
              <p>Here&apos;s what&apos;s happening with your finances today.</p>
            </div>
            <button className="date-button" onClick={() => setShowDatePicker(true)}>
              <CalendarDays size={17} /> {dateLabel} <ChevronDown size={15} />
            </button>
          </section>
        )}

        <div className="page-body">
          {renderPage()}
        </div>
      </main>

      {/* Modals */}
      {txModal.open && (
        <TransactionModal
          initial={txModal.initial}
          onSave={handleSaveTransaction}
          onClose={() => setTxModal({ open: false })}
        />
      )}
      {showDatePicker && (
        <DateRangeModal
          current={dateLabel}
          onSave={setDateLabel}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  );
}

export default App;
