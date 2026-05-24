import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatCurrency, formatDate, formatDateInput } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Transactions.css';

// ─── Add / Edit Modal ─────────────────────────────────────────────
const TxnModal = ({ txn, categories, onClose, onSaved }) => {
  const isEdit = !!txn?.id;
  const [form, setForm] = useState({
    type:        txn?.type        || 'expense',
    amount:      txn?.amount      || '',
    category_id: txn?.category_id || '',
    note:        txn?.note        || '',
    date:        txn?.date ? formatDateInput(txn.date) : formatDateInput(new Date()),
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const filtered = categories.filter(c => c.type === form.type);

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/transactions/${txn.id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', form);
        toast.success('Transaction added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit transaction' : 'Add transaction'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Type toggle */}
        <div className="type-toggle">
          <button
            className={`type-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
            onClick={() => setForm(p => ({ ...p, type: 'expense', category_id: '' }))}
          >💳 Expense</button>
          <button
            className={`type-btn ${form.type === 'income' ? 'active-income' : ''}`}
            onClick={() => setForm(p => ({ ...p, type: 'income', category_id: '' }))}
          >💰 Income</button>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            className={errors.amount ? 'input-error' : ''}
            min="0"
            step="0.01"
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>

        {/* Category */}
        <div className="form-group">
          <label>Category <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
          <select
            value={form.category_id}
            onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
          >
            <option value="">Select category</option>
            {filtered.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="form-group">
          <label>Note <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Woolworths groceries"
            value={form.note}
            onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className={errors.date ? 'input-error' : ''}
          />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete confirm modal ─────────────────────────────────────────
const DeleteModal = ({ txn, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/transactions/${txn.id}`);
      toast.success('Transaction deleted');
      onDeleted();
      onClose();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Delete transaction?</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{txn.note || 'this transaction'}</strong> of <strong>{formatCurrency(txn.amount)}</strong>? This cannot be undone.
        </p>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Transactions page ───────────────────────────────────────
export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editTxn,      setEditTxn]      = useState(null);
  const [deleteTxn,    setDeleteTxn]    = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.append('search', search);
      if (typeFilter) params.append('type',   typeFilter);

      const [txRes, catRes, sumRes] = await Promise.all([
        api.get(`/transactions?${params}`),
        api.get('/categories'),
        api.get('/transactions/summary'),
      ]);

      setTransactions(txRes.data.data.transactions);
      setCategories(catRes.data.data.categories);
      setSummary(sumRes.data.data.summary);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEdit = (txn) => { setEditTxn(txn); setShowModal(true); };
  const handleAdd  = ()    => { setEditTxn(null); setShowModal(true); };

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>Track and manage all your income and expenses</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={handleAdd}>+ Add transaction</button>
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────── */}
      <div className="txn-summary">
        <div className="txn-summary-card">
          <div className="txn-summary-icon" style={{ background: 'var(--success-light)' }}>💰</div>
          <div className="txn-summary-info">
            <div className="txn-summary-label">Income this month</div>
            <div className="txn-summary-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(summary?.total_income)}
            </div>
          </div>
        </div>
        <div className="txn-summary-card">
          <div className="txn-summary-icon" style={{ background: 'var(--danger-light)' }}>💳</div>
          <div className="txn-summary-info">
            <div className="txn-summary-label">Expenses this month</div>
            <div className="txn-summary-value" style={{ color: 'var(--danger)' }}>
              {formatCurrency(summary?.total_expenses)}
            </div>
          </div>
        </div>
        <div className="txn-summary-card">
          <div className="txn-summary-icon" style={{ background: 'var(--primary-light)' }}>🏦</div>
          <div className="txn-summary-info">
            <div className="txn-summary-label">Net savings</div>
            <div className="txn-summary-value" style={{ color: 'var(--primary)' }}>
              {formatCurrency(summary?.net_savings)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="txn-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>{search || typeFilter ? 'Try adjusting your filters' : 'Add your first transaction to get started'}</p>
          </div>
        ) : (
          <table className="txn-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id}>
                  <td>
                    <div className="txn-cell-name">
                      <div className="txn-cell-icon" style={{
                        background: txn.type === 'income' ? 'var(--success-light)' : 'var(--primary-light)',
                        color:      txn.type === 'income' ? 'var(--success)'       : 'var(--primary)',
                      }}>
                        {txn.type === 'income' ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="txn-cell-label">{txn.note || '—'}</div>
                        <div className="txn-cell-sub">{txn.type === 'income' ? 'Income' : 'Expense'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {txn.category_name ? (
                      <span className="badge badge-info">{txn.category_name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Uncategorized</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatDate(txn.date)}</td>
                  <td>
                    <span className={txn.type === 'income' ? 'amount-income' : 'amount-expense'}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => handleEdit(txn)} title="Edit">✏️</button>
                      <button className="btn-icon" onClick={() => setDeleteTxn(txn)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {showModal && (
        <TxnModal
          txn={editTxn}
          categories={categories}
          onClose={() => { setShowModal(false); setEditTxn(null); }}
          onSaved={fetchData}
        />
      )}

      {deleteTxn && (
        <DeleteModal
          txn={deleteTxn}
          onClose={() => setDeleteTxn(null)}
          onDeleted={fetchData}
        />
      )}
    </>
  );
}