import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ─── Insight type config ──────────────────────────────────────────
const typeConfig = {
  positive: { bg: 'var(--success-light)', color: 'var(--success)',  icon: '✅' },
  warning:  { bg: 'var(--warning-light)', color: 'var(--warning)',  icon: '⚠️' },
  tip:      { bg: 'var(--primary-light)', color: 'var(--primary)',  icon: '💡' },
  goal:     { bg: 'var(--purple-light)',  color: 'var(--purple)',   icon: '🎯' },
};

// ─── Insight card ─────────────────────────────────────────────────
const InsightCard = ({ insight }) => {
  const cfg = typeConfig[insight.type] || typeConfig.tip;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius-md)',
        background: cfg.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, flexShrink: 0,
      }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>
          {insight.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {insight.message}
        </div>
      </div>
    </div>
  );
};

// ─── Budget allocation card ───────────────────────────────────────
const BudgetCard = ({ label, amount, percentage, color }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{percentage}%</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 10 }}>
      ${Number(amount).toLocaleString()}
    </div>
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 99, background: color, width: `${percentage}%`, transition: 'width 0.6s' }} />
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>per month</div>
  </div>
);

export default function Insights() {
  const [insights,       setInsights]       = useState([]);
  const [monthlySummary, setMonthlySummary] = useState('');
  const [budgetAdvice,   setBudgetAdvice]   = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [loaded,         setLoaded]         = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [insightRes, summaryRes, budgetRes] = await Promise.allSettled([
        api.post('/insights/analyze',         {}),
        api.get('/insights/monthly-summary'),
        api.get('/insights/budget-advice'),
      ]);

      if (insightRes.status === 'fulfilled')
        setInsights(insightRes.value.data.data.insights || []);

      if (summaryRes.status === 'fulfilled')
        setMonthlySummary(summaryRes.value.data.data.summary || '');

      if (budgetRes.status === 'fulfilled')
        setBudgetAdvice(budgetRes.value.data.data);

      setLoaded(true);
    } catch {
      toast.error('Failed to load insights. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Insights</h1>
          <p>Powered by Gemini — personalized tips based on your spending</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={fetchInsights} disabled={loading}>
            {loading ? '✨ Analyzing...' : '✨ Analyze my spending'}
          </button>
        </div>
      </div>

      {/* Not loaded yet */}
      {!loaded && !loading && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1060 0%, #2d1f8a 50%, #185FA5 100%)',
          borderRadius: 'var(--radius-lg)', padding: '3rem 2rem',
          textAlign: 'center', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 10 }}>
            Get AI-powered financial insights
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
            Gemini analyzes your transactions, spending patterns, and goals to give you personalized tips that actually make sense for your situation.
          </p>
          <button onClick={fetchInsights} disabled={loading} style={{
            background: 'white', color: 'var(--primary-dark)',
            border: 'none', padding: '12px 28px', borderRadius: 'var(--radius-md)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            ✨ Analyze my spending now
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '3rem',
          textAlign: 'center', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            Gemini is analyzing your finances...
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            This usually takes 5-10 seconds
          </div>
        </div>
      )}

      {/* Results */}
      {loaded && !loading && (
        <>
          {/* Monthly summary */}
          {monthlySummary && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              marginBottom: '1rem', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: 'var(--purple-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Monthly Summary</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Generated by Gemini</div>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, padding: '2px 10px',
                  borderRadius: 99, background: 'var(--purple-light)', color: 'var(--purple)', fontWeight: 500,
                }}>AI Generated</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {monthlySummary}
              </p>
            </div>
          )}

          {/* Spending insights */}
          {insights.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Spending Insights
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              </div>
            </div>
          )}

          {/* Budget advice */}
          {budgetAdvice && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                💰 Suggested Budget (50/30/20 Rule)
              </h2>
              {budgetAdvice.advice && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.25rem', padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
                  {budgetAdvice.advice}
                </p>
              )}
              {budgetAdvice.suggested_budget && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <BudgetCard
                    label="Needs"
                    amount={budgetAdvice.suggested_budget.needs?.amount}
                    percentage={budgetAdvice.suggested_budget.needs?.percentage}
                    color="var(--primary)"
                  />
                  <BudgetCard
                    label="Wants"
                    amount={budgetAdvice.suggested_budget.wants?.amount}
                    percentage={budgetAdvice.suggested_budget.wants?.percentage}
                    color="var(--purple)"
                  />
                  <BudgetCard
                    label="Savings"
                    amount={budgetAdvice.suggested_budget.savings?.amount}
                    percentage={budgetAdvice.suggested_budget.savings?.percentage}
                    color="var(--success)"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}