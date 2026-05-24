import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatCurrency, formatDate, formatDateInput, getProgressColor } from '../utils/formatters';
import toast from 'react-hot-toast';

// ─── Goal Modal ───────────────────────────────────────────────────
const GoalModal = ({ goal, onClose, onSaved }) => {
  const isEdit = !!goal?.id;
  const [form, setForm] = useState({
    title:          goal?.title          || '',
    target_amount:  goal?.target_amount  || '',
    current_amount: goal?.current_amount || '',
    deadline:       goal?.deadline ? formatDateInput(goal.deadline) : '',
    color:          goal?.color          || '#1D9E75',
    icon:           goal?.icon           || '🎯',
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const icons = ['🎯','✈️','🏠','🚗','💻','📱','🎓','💍','🏋️','🌴','🐶','🎸'];
  const colors = ['#1D9E75','#185FA5','#7F77DD','#EF9F27','#E24B4A','#0C447C','#534AB7','#854F0B'];

  const validate = () => {
    const e = {};
    if (!form.title.trim())                                    e.title         = 'Title is required';
    if (!form.target_amount || Number(form.target_amount) <= 0) e.target_amount = 'Enter a valid target amount';
    if (form.current_amount && Number(form.current_amount) < 0) e.current_amount = 'Cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/goals/${goal.id}`, form);
        toast.success('Goal updated');
      } else {
        await api.post('/goals', form);
        toast.success('Goal created!');
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
          <span className="modal-title">{isEdit ? 'Edit goal' : 'Create new goal'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Icon picker */}
        <div className="form-group">
          <label>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {icons.map(ic => (
              <button key={ic} onClick={() => setForm(p => ({ ...p, icon: ic }))}
                style={{
                  width: 38, height: 38, borderRadius: 8, border: '1.5px solid',
                  borderColor: form.icon === ic ? 'var(--primary)' : 'var(--border)',
                  background:  form.icon === ic ? 'var(--primary-light)' : 'var(--bg)',
                  fontSize: 18, cursor: 'pointer',
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="form-group">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: form.color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                }} />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Goal title</label>
          <input
            type="text"
            placeholder="e.g. Emergency Fund"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className={errors.title ? 'input-error' : ''}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Target amount</label>
            <input
              type="number"
              placeholder="10000"
              value={form.target_amount}
              onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))}
              className={errors.target_amount ? 'input-error' : ''}
              min="0"
            />
            {errors.target_amount && <span className="field-error">{errors.target_amount}</span>}
          </div>

          <div className="form-group">
            <label>Saved so far</label>
            <input
              type="number"
              placeholder="0"
              value={form.current_amount}
              onChange={e => setForm(p => ({ ...p, current_amount: e.target.value }))}
              className={errors.current_amount ? 'input-error' : ''}
              min="0"
            />
            {errors.current_amount && <span className="field-error">{errors.current_amount}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Target date <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
          />
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Contribute Modal ─────────────────────────────────────────────
const ContributeModal = ({ goal, onClose, onSaved }) => {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/goals/${goal.id}/contribute`, { amount: Number(amount) });
      toast.success('Contribution added! 🎉');
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
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add contribution</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{goal.title}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatCurrency(remaining)} remaining
          </div>
        </div>

        <div className="form-group">
          <label>Amount to add</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0"
            autoFocus
          />
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          {[50, 100, 200, 500].map(v => (
            <button key={v} onClick={() => setAmount(v)}
              style={{
                flex: 1, padding: '6px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)',
              }}>
              ${v}
            </button>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add contribution'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────
const DeleteModal = ({ goal, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/goals/${goal.id}`);
      toast.success('Goal deleted');
      onDeleted();
      onClose();
    } catch { toast.error('Failed to delete'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Delete goal?</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{goal.title}</strong>? This cannot be undone.
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

// ─── Goal Card ────────────────────────────────────────────────────
const GoalCard = ({ goal, onEdit, onContribute, onDelete }) => {
  const pct       = Math.min(Number(goal.percentage || 0), 100);
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  const isComplete = pct >= 100;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.5rem',
      boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 'var(--radius-md)',
            background: `${goal.color}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {goal.icon || '🎯'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{goal.title}</div>
            {goal.deadline && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Target: {formatDate(goal.deadline)}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon" onClick={() => onEdit(goal)} title="Edit">✏️</button>
          <button className="btn-icon" onClick={() => onDelete(goal)} title="Delete">🗑️</button>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {formatCurrency(goal.current_amount)} saved
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: getProgressColor(pct) }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: getProgressColor(pct),
            width: `${pct}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {isComplete ? '🎉 Goal reached!' : `${formatCurrency(remaining)} to go`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Goal: {formatCurrency(goal.target_amount)}
          </span>
        </div>
      </div>

      {/* Contribute button */}
      {!isComplete && (
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => onContribute(goal)}>
          + Add contribution
        </button>
      )}
      {isComplete && (
        <div style={{
          background: 'var(--success-light)', borderRadius: 'var(--radius-md)',
          padding: '10px', textAlign: 'center', fontSize: 14,
          fontWeight: 600, color: 'var(--success)',
        }}>
          🎉 Goal completed!
        </div>
      )}
    </div>
  );
};

// ─── Main Goals page ──────────────────────────────────────────────
export default function Goals() {
  const [goals,       setGoals]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editGoal,    setEditGoal]    = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [deleteGoal,  setDeleteGoal]  = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data.data.goals);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const totalSaved  = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount),  0);
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Savings Goals</h1>
          <p>Set targets and track your progress</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-primary" onClick={() => { setEditGoal(null); setShowModal(true); }}>
            + New goal
          </button>
        </div>
      </div>

      {/* Overall summary */}
      {goals.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Total saved across all goals</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totalSaved)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>Total target</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(totalTarget)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall progress</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: getProgressColor(overallPct) }}>{overallPct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: getProgressColor(overallPct), width: `${overallPct}%`, transition: 'width 0.6s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : goals.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3>No goals yet</h3>
          <p>Create your first savings goal to start tracking your progress</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }}
            onClick={() => { setEditGoal(null); setShowModal(true); }}>
            + Create first goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={g    => { setEditGoal(g);        setShowModal(true); }}
              onContribute={g => setContributeGoal(g)}
              onDelete={g  => setDeleteGoal(g)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <GoalModal
          goal={editGoal}
          onClose={() => { setShowModal(false); setEditGoal(null); }}
          onSaved={fetchGoals}
        />
      )}
      {contributeGoal && (
        <ContributeModal
          goal={contributeGoal}
          onClose={() => setContributeGoal(null)}
          onSaved={fetchGoals}
        />
      )}
      {deleteGoal && (
        <DeleteModal
          goal={deleteGoal}
          onClose={() => setDeleteGoal(null)}
          onDeleted={fetchGoals}
        />
      )}
    </>
  );
}