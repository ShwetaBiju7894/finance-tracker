import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())                      e.name     = 'Name is required';
    if (!form.email)                            e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email';
    if (!form.password)                         e.password = 'Password is required';
    else if (form.password.length < 6)          e.password = 'At least 6 characters';
    if (!form.confirm)                          e.confirm  = 'Please confirm your password';
    else if (form.confirm !== form.password)    e.confirm  = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to Finsight 🎉');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = () => {
    const p = form.password;
    if (!p)          return { width: '0%',   color: 'transparent', label: '' };
    if (p.length < 6) return { width: '25%',  color: 'var(--danger)',  label: 'Too short' };
    if (p.length < 8) return { width: '50%',  color: 'var(--warning)', label: 'Weak' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
                      return { width: '75%',  color: 'var(--primary)', label: 'Good' };
    return             { width: '100%', color: 'var(--success)', label: 'Strong' };
  };

  const strength = getStrength();

  return (
    <div className="auth-wrapper">

      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="white" fillOpacity="0.15"/>
              <path d="M7 14C7 10.134 10.134 7 14 7V14H21C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14Z" fill="white"/>
              <path d="M16 7.34A7.003 7.003 0 0121 13h-5V7.34Z" fill="white" fillOpacity="0.6"/>
            </svg>
            <span>Finsight</span>
          </div>
          <h1>Start your financial journey today</h1>
          <p>Join thousands of people who use Finsight to track spending, save more, and reach their goals faster.</p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🎯</div>
              <div>
                <strong>Goal Tracking</strong>
                <span>Set and achieve your savings goals</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📈</div>
              <div>
                <strong>Spending Trends</strong>
                <span>See where your money really goes</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div>
                <strong>Secure & Private</strong>
                <span>Your data is encrypted and never shared</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Free forever — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Jamie Doe"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
                autoComplete="new-password"
              />
              {form.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div style={{ width: strength.width, background: strength.color }} />
                  </div>
                  <span style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                placeholder="Repeat your password"
                value={form.confirm}
                onChange={handleChange}
                className={errors.confirm ? 'input-error' : ''}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  );
}