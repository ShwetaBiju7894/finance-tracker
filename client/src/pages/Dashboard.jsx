import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatDateShort, getProgressColor } from '../utils/formatters';
import './Dashboard.css';

// ─── Skeleton loader ──────────────────────────────────────────────
const DashboardSkeleton = () => (
  <>
    <div className="skeleton-metrics">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
      <div className="skeleton-card" style={{ height: 280 }} />
      <div className="skeleton-card" style={{ height: 280 }} />
    </div>
  </>
);

// ─── Metric card ──────────────────────────────────────────────────
const MetricCard = ({ label, value, icon, bg, change, changeLabel }) => {
  const isUp      = change > 0;
  const isDown    = change < 0;
  const arrow     = isUp ? '↑' : isDown ? '↓' : '';
  const direction = isUp ? 'up' : isDown ? 'down' : 'neutral';

  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon" style={{ background: bg }}>{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      {change !== null && change !== undefined && (
        <div className={`metric-change ${direction}`}>
          <span>{arrow} {Math.abs(change)}%</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{changeLabel}</span>
        </div>
      )}
    </div>
  );
};

// ─── Category bar ────────────────────────────────────────────────
const CategoryBar = ({ name, color, amount, percentage }) => (
  <div className="category-row">
    <div className="category-top">
      <div className="category-name">
        <div className="category-dot" style={{ background: color }} />
        {name}
      </div>
      <div className="category-amount">{formatCurrency(amount)}</div>
    </div>
    <div className="category-bar-bg">
      <div className="category-bar-fill" style={{ width: `${percentage}%`, background: color }} />
    </div>
  </div>
);

// ─── Transaction row ─────────────────────────────────────────────
const TxnRow = ({ txn }) => {
  const isIncome = txn.type === 'income';
  return (
    <div className="txn-row">
      <div className="txn-icon" style={{
        background: isIncome ? 'var(--success-light)' : 'var(--primary-light)',
        color:      isIncome ? 'var(--success)'       : 'var(--primary)',
      }}>
        {isIncome ? '↓' : '↑'}
      </div>
      <div className="txn-info">
        <div className="txn-name">{txn.note || txn.category_name || 'Transaction'}</div>
        <div className="txn-meta">{txn.category_name} · {formatDateShort(txn.date)}</div>
      </div>
      <div className={`txn-amount ${txn.type}`}>
        {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
      </div>
    </div>
  );
};

// ─── Goal row ────────────────────────────────────────────────────
const GoalRow = ({ goal }) => {
  const pct = Math.min(Number(goal.percentage || 0), 100);
  return (
    <div className="goal-row">
      <div className="goal-icon" style={{ background: `${goal.color}20`, color: goal.color }}>
        🎯
      </div>
      <div className="goal-info">
        <div className="goal-name">
          <span>{goal.title}</span>
          <span className="goal-pct">{pct}%</span>
        </div>
        <div className="goal-bar-bg">
          <div className="goal-bar-fill"
            style={{ width: `${pct}%`, background: getProgressColor(pct) }} />
        </div>
        <div className="goal-amounts">
          {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
        </div>
      </div>
    </div>
  );
};

// ─── Bill row ────────────────────────────────────────────────────
const BillRow = ({ bill }) => {
  const days = bill.days_until_due;
  const tag  = days <= 1 ? 'urgent' : days <= 5 ? 'soon' : 'ok';
  const label = days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days} days`;

  return (
    <div className="bill-row">
      <div className="txn-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
        📄
      </div>
      <div className="bill-info">
        <div className="bill-name">{bill.name}</div>
        <div className="bill-due">Due on the {bill.due_date}{bill.due_date === 1 ? 'st' : bill.due_date === 2 ? 'nd' : bill.due_date === 3 ? 'rd' : 'th'}</div>
      </div>
      <div className="bill-right">
        <div className="bill-amount">{formatCurrency(bill.amount)}</div>
        <span className={`bill-tag ${tag}`}>{label}</span>
      </div>
    </div>
  );
};

// ─── Main dashboard ───────────────────────────────────────────────
export default function Dashboard() {

  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    summary, transactions, goals, bills,
    comparison, categories, loading, error,
  } = useDashboard();

     console.log('LOADING:', loading);
  console.log('ERROR:', error);
  console.log('SUMMARY:', summary);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div className="empty-state">
      <h3>Could not load dashboard</h3>
      <p>{error}</p>
    </div>
  );

  const { changes } = comparison || {};

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => navigate('/analytics')}>
            View analytics
          </button>
          <button className="btn-primary" onClick={() => navigate('/transactions')}>
            + Add transaction
          </button>
        </div>
      </div>

      {/* ── Getting started banner (shows only when no data) ── */}
{transactions.length === 0 && (
  <div style={{
    background: 'linear-gradient(135deg, #E6F1FB 0%, #F4F6FA 100%)',
    border: '1px solid var(--primary-light)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
      👋 Welcome to Finsight! Here's how to get started:
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
      {[
        { step: '1', icon: '💳', title: 'Add a transaction', desc: 'Record your first income or expense', link: '/transactions' },
        { step: '2', icon: '🎯', title: 'Create a goal',     desc: 'Set a savings target to work towards', link: '/goals'        },
        { step: '3', icon: '📄', title: 'Add your bills',    desc: 'Track recurring bills and due dates',  link: '/bills'        },
        { step: '4', icon: '✨', title: 'Get AI insights',   desc: 'Analyze your spending with Gemini AI', link: '/insights'     },
      ].map(item => (
        <div key={item.step}
          onClick={() => navigate(item.link)}
          style={{
            background: 'white', borderRadius: 'var(--radius-md)',
            padding: '1rem', cursor: 'pointer',
            border: '1px solid var(--border)',
            transition: 'box-shadow 0.15s',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {item.step}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
              {item.icon} {item.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {item.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

      {/* ── Metric cards ───────────────────────────────────────── */}
      <div className="metrics-grid">
        <MetricCard
          label="Total income"
          value={formatCurrency(summary?.total_income)}
          icon="💰"
          bg="var(--success-light)"
          change={changes?.income}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Total expenses"
          value={formatCurrency(summary?.total_expenses)}
          icon="💳"
          bg="var(--danger-light)"
          change={changes?.expenses}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Net savings"
          value={formatCurrency(summary?.net_savings)}
          icon="🏦"
          bg="var(--primary-light)"
          change={changes?.savings}
          changeLabel="vs last month"
        />
        <MetricCard
          label="Bills due soon"
          value={bills?.length || 0}
          icon="🔔"
          bg="var(--warning-light)"
          changeLabel="within 14 days"
        />
      </div>

      {/* ── Row 1: Categories + Transactions ───────────────────── */}
      <div className="dashboard-row dashboard-row-2">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Spending by category</span>
            <Link to="/analytics" className="dash-card-link">See all</Link>
          </div>
          {categories.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No expense data yet this month</p>
            </div>
          ) : (
            <div className="category-list">
              {categories.map((cat, i) => (
                <CategoryBar key={i} {...cat} amount={cat.total} />
              ))}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Recent transactions</span>
            <Link to="/transactions" className="dash-card-link">See all</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="txn-list">
              {transactions.map(txn => <TxnRow key={txn.id} txn={txn} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Goals + Bills ───────────────────────────────── */}
      <div className="dashboard-row dashboard-row-2b">
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Savings goals</span>
            <Link to="/goals" className="dash-card-link">Manage</Link>
          </div>
          {goals.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No goals yet — <Link to="/goals" style={{ color: 'var(--primary)' }}>create one</Link></p>
            </div>
          ) : (
            <div className="goal-list">
              {goals.map(goal => <GoalRow key={goal.id} goal={goal} />)}
            </div>
          )}
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Upcoming bills</span>
            <Link to="/bills" className="dash-card-link">Manage</Link>
          </div>
          {bills.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>No bills due in the next 14 days</p>
            </div>
          ) : (
            <div className="bill-list">
              {bills.map(bill => <BillRow key={bill.id} bill={bill} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Insights teaser ─────────────────────────────────── */}
      <div className="ai-teaser">
        <div className="ai-teaser-left">
          <div className="ai-teaser-icon">✨</div>
          <div>
            <h3>Get AI-powered spending insights</h3>
            <p>Claude analyzes your transactions and gives personalized tips to help you save more</p>
          </div>
        </div>
        <button className="ai-teaser-btn" onClick={() => navigate('/insights')}>
          View insights →
        </button>
      </div>
    </>
  );
}