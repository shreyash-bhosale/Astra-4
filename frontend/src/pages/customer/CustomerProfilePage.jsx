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
  CheckCircle2,
  PhoneCall,
  Lock,
  Trash2,
  AlertTriangle,
  Clock,
  Globe
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [resolutionAlerts, setResolutionAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Accessible delete account modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = await api.getCustomerProfile();
        if (data?.customer) {
          setProfile(data.customer);
          setPhone(data.customer.phone || '');
          if (data.customer.email_notifications !== undefined) {
            setEmailNotifs(Boolean(data.customer.email_notifications));
          }
          if (data.customer.resolution_alerts !== undefined) {
            setResolutionAlerts(Boolean(data.customer.resolution_alerts));
          }
        }
      } catch (err) {
        console.warn('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateCustomerPreferences({
        phone: phone.trim(),
        email_notifications: emailNotifs,
        resolution_alerts: resolutionAlerts
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.deleteCustomerAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  // Masked phone format for privacy
  const getMaskedPhone = (raw) => {
    if (!raw) return 'No phone registered';
    const cleaned = raw.replace(/\s+/g, '');
    if (cleaned.length < 8) return raw;
    const firstPart = cleaned.slice(0, 3);
    const lastPart = cleaned.slice(-4);
    return `${firstPart} •••••• ${lastPart}`;
  };

  return (
    <div style={{ maxWidth: '680px', marginInline: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
          Profile & Preferences
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage your contact details, notification preferences, and account security.
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
                {profile?.tier || 'Standard Verified'}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                PHONE NUMBER
              </label>
              {profile?.phone && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Display: {getMaskedPhone(profile.phone)}
                </span>
              )}
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019 2834"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Used for verified support outreach and account security.
            </span>
          </div>

          {/* Notification Preferences */}
          <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Email Notifications
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  ResolveAI sends important updates to: <strong style={{ color: 'var(--text-primary)' }}>{profile?.email || user?.email}</strong>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: emailNotifs ? '#ecfdf5' : 'var(--bg-tertiary)',
                  color: emailNotifs ? '#059669' : 'var(--text-muted)'
                }}
              >
                {emailNotifs ? '✓ Enabled' : 'Disabled'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Case Lifecycle & Status Updates</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Receive transactional emails on case receipt, triage, replacement execution, and resolution milestones
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Resolution & Tracking Confirmations</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Immediate alert when fulfillment carrier tracking or verified resolution is confirmed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={resolutionAlerts}
                  onChange={(e) => setResolutionAlerts(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={saving}
              className="btn-primary"
              style={{ height: '42px', paddingInline: '22px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              <span>{saved ? 'Preferences Saved' : saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>

        {/* Security & Danger Zone */}
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Once you delete your account, your active customer profile will be permanently wiped.
          </p>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Accessible Themed Delete Account Modal */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <AlertTriangle size={22} />
              <h3 id="delete-dialog-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Delete Customer Account
              </h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This will permanently delete your personal profile, notification history, and remove access to your customer portal.
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                marginBlock: '14px'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="btn-secondary"
                style={{ height: '38px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                style={{
                  height: '38px',
                  paddingInline: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: (deleteConfirmText !== 'DELETE' || deleting) ? 'not-allowed' : 'pointer',
                  opacity: (deleteConfirmText !== 'DELETE' || deleting) ? 0.6 : 1
                }}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
