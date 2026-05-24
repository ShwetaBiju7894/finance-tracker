import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// ─── Bill Modal ───────────────────────────────────────────────────
const BillModal = ({ bill, onClose, onSaved }) => {
  const isEdit = !!bill?.id;
  const [form, setForm] = useState({
    name:         bill?.name         || '',
    amount:       bill?.amount       || '',
    due_date:     bill?.due_date     || '',
    is_recurring: bill?.is_recurring !== undefined ? bill.is_recurring : true,
    remind_days:  bill?.remind_days  || 3,
    email_remind: bill?.email_remind !== undefined ? bill.email_remind : true,
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())                              e.name     = 'Name is required';
    if (!form.amount || Number(form.amount) <= 0)       e.amount   = 'Enter a valid amount';
    if (!form.due_date || form.due_date < 1 || form.due_date > 31)
                                                        e.due_date = 'Enter a day between 1 and 31';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/bills/${bill.id}`, form);
        toast.success('Bill updated');
      } else {
        await api.post('/bills', form);
        toast.success('Bill added');
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
          <span className="modal-title">{isEdit ? 'Edit bill' : 'Add bill'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>Bill name</label>
          <input type="text" placeholder="e.g. Netflix, Internet, Rent"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Amount</label>
            <input type="number" placeholder="0.00" min="0" step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className={errors.amount ? 'input-error' : ''}
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>
          <div className="form-group">
            <label>Due day of month</label>
            <input type="number" placeholder="e.g. 15" min="1" max="31"
              value={form.due_date}
              onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              className={errors.due_date ? 'input-error' : ''}
            />
            {errors.due_date && <span className="field-error">{errors.due_date}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Remind me how many days before?</label>
          <select value={form.remind_days}
            onChange={e => setForm(p => ({ ...p, remind_days: Number(e.target.value) }))}>
            <option value={1}>1 day before</option>
            <option value={3}>3 days before</option>
            <option value={5}>5 days before</option>
            <option value={7}>7 days before</option>
          </select>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Recurring bill</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Repeats every month</div>
            </div>
            <input type="checkbox" checked={form.is_recurring}
              onChange={e => setForm(p => ({ ...p, is_recurring: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Email reminders</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Get notified before due date</div>
            </div>
            <input type="checkbox" checked={form.email_remind}
              onChange={e => setForm(p => ({ ...p, email_remind: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────
const DeleteModal = ({ bill, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/bills/${bill.id}`);
      toast.success('Bill deleted');
      onDeleted();
      onClose();
    } catch { toast.error('Failed to delete'); }
    finally  { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Delete bill?</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{bill.name}</strong>? This cannot be undone.
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

// ─── Bill Card ────────────────────────────────────────────────────
const BillCard = ({ bill, onEdit, onDelete }) => {
  const days     = bill.days_until_due;
  const tagClass = days <= 1 ? 'urgent' : days <= 5 ? 'soon' : 'ok';
  const tagLabel = days === 0 ? 'Due today!' : days === 1 ? 'Due tomorrow' : `${days} days`;

  const suffix = d => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      boxShadow: 'var(--shadow-sm)', display: 'flex',
      alignItems: 'center', gap: 14,
    }}>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: 'var(--purple-light)', color: 'var(--purple)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>📄</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{bill.name}</span>
          {bill.is_recurring && (
            <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 7px', borderRadius: 99, fontWeight: 500 }}>
              Recurring
            </span>
          )}
          {bill.email_remind && (
            <span style={{ fontSize: 11, background: 'var(--success-light)', color: 'var(--success)', padding: '1px 7px', borderRadius: 99, fontWeight: 500 }}>
              📧 Reminder on
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Due on the {bill.due_date}{suffix(bill.due_date)} of each month · Reminder {bill.remind_days} day{bill.remind_days > 1 ? 's' : ''} before
        </div>
      </div>

      {/* Amount + tag */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          {formatCurrency(bill.amount)}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
          background: tagClass === 'urgent' ? 'var(--danger-light)'  : tagClass === 'soon' ? 'var(--warning-light)' : 'var(--success-light)',
          color:      tagClass === 'urgent' ? 'var(--danger)'        : tagClass === 'soon' ? 'var(--warning)'       : 'var(--success)',
        }}>
          {tagLabel}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="btn-icon" onClick={() => onEdit(bill)} title="Edit">✏️</button>
        <button className="btn-icon" onClick={() => onDelete(bill)} title="Delete">🗑️</button>
      </div>
    </div>
  );
};

// ─── Main Bills page ──────────────────────────────────────────────
export default function Bills() {
  const [bills,     setBills]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBill,  setEditBill]  = useState(null);
  const [deleteBill,setDeleteBill]= useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bills');
      setBills(res.data.data.bills);
    } catch { toast.error('Failed to load bills'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const dueSoon    = bills.filter(b => b.days_until_due <= 7);
  const totalMonthly = bills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Bills</h1>
          <p>Track recurring bills and never miss a payment</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => { setEditBill(null); setShowModal(true); }}>
            + Add bill
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Total bills</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{bills.length}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Monthly total</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(totalMonthly)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Due this week</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: dueSoon.length > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {dueSoon.length}
          </div>
        </div>
      </div>

      {/* Bills list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : bills.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3>No bills yet</h3>
          <p>Add your recurring bills to track due dates and get email reminders</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }}
            onClick={() => { setEditBill(null); setShowModal(true); }}>
            + Add first bill
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bills
            .sort((a, b) => a.days_until_due - b.days_until_due)
            .map(bill => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={b   => { setEditBill(b); setShowModal(true); }}
                onDelete={b => setDeleteBill(b)}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <BillModal
          bill={editBill}
          onClose={() => { setShowModal(false); setEditBill(null); }}
          onSaved={fetchBills}
        />
      )}
      {deleteBill && (
        <DeleteModal
          bill={deleteBill}
          onClose={() => setDeleteBill(null)}
          onDeleted={fetchBills}
        />
      )}
    </>
  );
}