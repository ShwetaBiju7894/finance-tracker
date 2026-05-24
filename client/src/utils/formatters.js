// Format number as currency — e.g. 1234.5 → $1,234.50
export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);

// Format date — e.g. 2026-05-20 → May 20, 2026
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

// Format date short — e.g. 2026-05-20 → May 20
export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Format date for input field — e.g. Date → 2026-05-20
export const formatDateInput = (date) =>
  new Date(date).toISOString().split('T')[0];

// Get relative time — e.g. "2 days ago"
export const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDateShort(date);
};

// Capitalize first letter
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// Get color based on percentage
export const getProgressColor = (pct) => {
  if (pct >= 100) return 'var(--success)';
  if (pct >= 60)  return 'var(--primary)';
  if (pct >= 30)  return 'var(--warning)';
  return 'var(--danger)';
};

// Get badge class for transaction type
export const getTypeBadge = (type) =>
  type === 'income' ? 'badge-income' : 'badge-expense';

// Format large numbers — e.g. 1200 → 1.2k
export const formatCompact = (num) =>
  new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num || 0);