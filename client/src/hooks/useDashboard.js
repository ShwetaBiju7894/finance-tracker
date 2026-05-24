import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useDashboard = () => {
  const [summary,      setSummary]      = useState({ total_income: 0, total_expenses: 0, net_savings: 0 });
  const [transactions, setTransactions] = useState([]);
  const [goals,        setGoals]        = useState([]);
  const [bills,        setBills]        = useState([]);
  const [comparison,   setComparison]   = useState({ changes: {} });
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch each independently so one failure doesn't kill the whole dashboard
      const [summaryRes, txRes, goalsRes, billsRes, compRes, catRes] =
        await Promise.allSettled([
          api.get('/transactions/summary'),
          api.get('/transactions'),
          api.get('/goals'),
          api.get('/bills'),
          api.get('/analytics/comparison'),
          api.get('/analytics/categories'),
        ]);

      if (summaryRes.status === 'fulfilled')
        setSummary(summaryRes.value.data.data.summary);

      if (txRes.status === 'fulfilled')
        setTransactions(txRes.value.data.data.transactions.slice(0, 5));

      if (goalsRes.status === 'fulfilled')
        setGoals(goalsRes.value.data.data.goals.slice(0, 3));

      if (billsRes.status === 'fulfilled')
        setBills(billsRes.value.data.data.bills
          .filter(b => b.days_until_due <= 14)
          .slice(0, 4));

      if (compRes.status === 'fulfilled')
        setComparison(compRes.value.data.data);

      if (catRes.status === 'fulfilled')
        setCategories(catRes.value.data.data.categories.slice(0, 5));

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    summary, transactions, goals, bills,
    comparison, categories, loading, error, refetch: fetchAll,
  };
};