import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style = {} }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
        ...style
      }}
      className="theme-toggle-btn"
    >
      {isDark ? (
        <Sun size={17} style={{ color: '#fbbf24', transition: 'transform 0.3s ease' }} />
      ) : (
        <Moon size={17} style={{ color: '#6366f1', transition: 'transform 0.3s ease' }} />
      )}
    </button>
  );
}
