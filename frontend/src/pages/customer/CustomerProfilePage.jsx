import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  Bell,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [resolutionAlerts, setResolutionAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await api.getCustomerProfile();
        if (data?.customer) {
          setProfile(data.customer);
        }
      } catch (err) {
        console.warn('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: '680px', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Profile & Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage your contact credentials, account tier, and resolution notification settings.
        </p>
      </div>

      {/* Account Info Card */}
      <div
        style={{
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}
          >
            {(profile?.name || user?.name || 'C')[0]}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {profile?.name || user?.name || 'Customer Account'}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: '#ecfdf5',
                  color: '#059669'
                }}
              >
                {profile?.tier || 'VIP Enterprise'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {profile?.email || user?.email}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              FULL NAME
            </label>
            <input
              type="text"
              disabled
              value={profile?.name || user?.name || ''}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              REGISTERED EMAIL
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || user?.email || ''}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              ORGANIZATION / COMPANY
            </label>
            <input
              type="text"
              disabled
              value={profile?.company || 'Individual Consumer'}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Notification Preferences */}
          <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
              Notification Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Email Case Updates</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Receive transactional emails on triage and investigation milestones
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Resolution Confirmation</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Immediate alert when replacement tracking or verified resolution is confirmed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={resolutionAlerts}
                  onChange={(e) => setResolutionAlerts(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-secondary"
              style={{ height: '42px', color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ height: '42px', paddingInline: '22px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              <span>{saved ? 'Preferences Saved' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
