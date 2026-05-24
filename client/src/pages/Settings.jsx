import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Section = ({ title, subtitle, children }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)', marginBottom: '1rem',
  }}>
    <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileErrors,   setProfileErrors]   = useState({});
  const [passwordErrors,  setPasswordErrors]  = useState({});

  // ── Profile update ──────────────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profile.name.trim())                        e.name  = 'Name is required';
    if (!profile.email)                              e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profile.email))   e.email = 'Enter a valid email';
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfile()) return;
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateUser(res.data.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password change ─────────────────────────────────────────────
  const validatePassword = () => {
    const e = {};
    if (!password.currentPassword)             e.currentPassword = 'Enter your current password';
    if (!password.newPassword)                 e.newPassword     = 'Enter a new password';
    else if (password.newPassword.length < 6)  e.newPassword     = 'At least 6 characters';
    if (password.confirm !== password.newPassword) e.confirm     = 'Passwords do not match';
    setPasswordErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) return;
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: password.currentPassword,
        newPassword:     password.newPassword,
      });
      toast.success('Password changed successfully');
      setPassword({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile card */}
      <Section title="Profile" subtitle="Update your name and email address">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--primary-light)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
          }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Full name</label>
            <input type="text" value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className={profileErrors.name ? 'input-error' : ''}
            />
            {profileErrors.name && <span className="field-error">{profileErrors.name}</span>}
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className={profileErrors.email ? 'input-error' : ''}
            />
            {profileErrors.email && <span className="field-error">{profileErrors.email}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-primary" onClick={handleProfileSave} disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </Section>

      {/* Password section */}
      <Section title="Change Password" subtitle="Use a strong password with at least 6 characters">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Current password</label>
            <input type="password" value={password.currentPassword} placeholder="••••••••"
              onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))}
              className={passwordErrors.currentPassword ? 'input-error' : ''}
            />
            {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
          </div>
          <div className="form-group">
            <label>New password</label>
            <input type="password" value={password.newPassword} placeholder="••••••••"
              onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))}
              className={passwordErrors.newPassword ? 'input-error' : ''}
            />
            {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input type="password" value={password.confirm} placeholder="••••••••"
              onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
              className={passwordErrors.confirm ? 'input-error' : ''}
            />
            {passwordErrors.confirm && <span className="field-error">{passwordErrors.confirm}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn-primary" onClick={handlePasswordSave} disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </Section>

      {/* Account info */}
      <Section title="Account Information" subtitle="Details about your Finsight account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Account ID',  value: `#${user?.id}`                                                    },
            { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { label: 'Plan',        value: 'Free — all features included'                                     },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Session" subtitle="Manage your current login session">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Log out of Finsight</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>You will be redirected to the login page</div>
          </div>
          <button className="btn-danger" onClick={() => { logout(); window.location.href = '/login'; }}>
            Log out
          </button>
        </div>
      </Section>
    </>
  );
}