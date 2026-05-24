import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

// ─── Custom tooltip ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-md)', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Section card ─────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, style = {} }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)', ...style,
  }}>
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

// ─── Stat box ─────────────────────────────────────────────────────
const StatBox = ({ label, current, previous, change, color }) => {
  const isUp   = change > 0;
  const isDown = change < 0;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 6 }}>
        {formatCurrency(current)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        vs last month: {formatCurrency(previous)}
        {change !== null && change !== undefined && (
          <span style={{ marginLeft: 6, fontWeight: 600, color: isUp ? 'var(--success)' : isDown ? 'var(--danger)' : 'var(--text-muted)' }}>
            {isUp ? '↑' : isDown ? '↓' : ''} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [monthly,     setMonthly]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [comparison,  setComparison]  = useState(null);
  const [topDays,     setTopDays]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [activeYear,  setActiveYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [mRes, catRes, compRes, daysRes] = await Promise.allSettled([
          api.get('/analytics/monthly'),
          api.get(`/analytics/categories?month=${activeMonth}&year=${activeYear}`),
          api.get('/analytics/comparison'),
          api.get('/analytics/top-days'),
        ]);
        if (mRes.status    === 'fulfilled') setMonthly(mRes.value.data.data.monthly);
        if (catRes.status  === 'fulfilled') setCategories(catRes.value.data.data.categories);
        if (compRes.status === 'fulfilled') setComparison(compRes.value.data.data);
        if (daysRes.status === 'fulfilled') setTopDays(daysRes.value.data.data.topDays);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, [activeMonth, activeYear]);

  const COLORS = ['#185FA5','#1D9E75','#7F77DD','#EF9F27','#E24B4A','#534AB7','#0C447C','#854F0B'];

  const months = [
    { value: 1, label: 'January' }, { value: 2,  label: 'February' },
    { value: 3, label: 'March'   }, { value: 4,  label: 'April'    },
    { value: 5, label: 'May'     }, { value: 6,  label: 'June'     },
    { value: 7, label: 'July'    }, { value: 8,  label: 'August'   },
    { value: 9, label: 'September'}, { value: 10, label: 'October' },
    { value: 11, label: 'November'}, { value: 12, label: 'December'},
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      Loading analytics...
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Deep dive into your financial patterns</p>
        </div>
        <div className="page-header-actions">
          <select className="filter-select" value={activeMonth}
            onChange={e => setActiveMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="filter-select" value={activeYear}
            onChange={e => setActiveYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Month comparison stats */}
      {comparison && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatBox
            label="Income this month"
            current={comparison.current.income}
            previous={comparison.previous.income}
            change={comparison.changes.income}
            color="var(--success)"
          />
          <StatBox
            label="Expenses this month"
            current={comparison.current.expenses}
            previous={comparison.previous.expenses}
            change={comparison.changes.expenses}
            color="var(--danger)"
          />
          <StatBox
            label="Net savings this month"
            current={comparison.current.savings}
            previous={comparison.previous.savings}
            change={comparison.changes.savings}
            color="var(--primary)"
          />
        </div>
      )}

      {/* Income vs Expenses bar chart */}
      <ChartCard
        title="Income vs Expenses"
        subtitle="Last 6 months comparison"
        style={{ marginBottom: '1rem' }}
      >
        {monthly.length === 0 ? (
          <div className="empty-state"><p>No data for this period</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} />
              <Bar dataKey="income"   name="Income"   fill="#1D9E75" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#E24B4A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Savings trend */}
      <ChartCard
        title="Savings Trend"
        subtitle="Net savings over the last 6 months"
        style={{ marginBottom: '1rem' }}
      >
        {monthly.length === 0 ? (
          <div className="empty-state"><p>No data yet</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#185FA5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#185FA5" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="savings" name="Savings" stroke="#185FA5" strokeWidth={2.5} fill="url(#savingsGrad)" dot={{ fill: '#185FA5', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Category breakdown + top spending days */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Pie chart */}
        <ChartCard title="Spending by Category" subtitle={`${months.find(m => m.value === activeMonth)?.label} ${activeYear}`}>
          {categories.length === 0 ? (
            <div className="empty-state"><p>No expense data for this month</p></div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categories} dataKey="total" nameKey="name"
                    cx="50%" cy="50%" outerRadius={85} innerRadius={45}
                    paddingAngle={2}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {categories.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.percentage}%</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(cat.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Top spending days */}
        <ChartCard title="Average Spending by Day" subtitle="Which days do you spend most?">
          {topDays.length === 0 ? (
            <div className="empty-state"><p>Not enough data yet</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topDays} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="day_name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_spending" name="Avg spending" fill="#7F77DD" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </>
  );
}