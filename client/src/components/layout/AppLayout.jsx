import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AppLayout.css';

const Icons = {
  dashboard:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  transactions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
  goals:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  bills:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  analytics:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  insights:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  settings:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  logout:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.75rem',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.25rem 0.75rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14C7 10.134 10.134 7 14 7V14H21C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14Z" fill="white"/>
              <path d="M16 7.34A7.003 7.003 0 0121 13h-5V7.34Z" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Finsight</span>
        </div>

        {/* Main nav */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem', marginBottom: 4 }}>Main</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.dashboard} Dashboard</NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.transactions} Transactions</NavLink>
          <NavLink to="/goals" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.goals} Goals</NavLink>
          <NavLink to="/bills" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.bills} Bills</NavLink>
        </div>

        {/* Insights nav */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem', marginBottom: 4 }}>Insights</div>
          <NavLink to="/analytics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.analytics} Analytics</NavLink>
          <NavLink to="/insights" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.insights} AI Insights</NavLink>
        </div>

        {/* Account nav */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.75rem', marginBottom: 4 }}>Account</div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{Icons.settings} Settings</NavLink>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
            {Icons.logout} <span style={{ color: 'var(--danger)' }}>Log out</span>
          </button>
        </div>

        {/* User card */}
        <div style={{ marginTop: 'auto', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/settings')}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main style={{
        marginLeft: '240px',
        flex: 1,
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '2rem',
        boxSizing: 'border-box',
        width: 'calc(100% - 240px)',
      }}>
        <Outlet />
      </main>

    </div>
  );
}