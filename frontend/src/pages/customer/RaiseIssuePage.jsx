import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Package,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'damaged_product', label: 'Damaged Product', desc: 'Hardware defect, broken parts, or physical wear on delivery' },
  { id: 'delivery_issue', label: 'Delivery / Courier Problem', desc: 'Tracking delay, missing package, or carrier exception' },
  { id: 'missing_item', label: 'Missing Item / Accessory', desc: 'Cables, documentation, or bundle items missing from box' },
  { id: 'wrong_item', label: 'Received Wrong Item', desc: 'Different color, SKU, or incorrect product delivered' },
  { id: 'refund_request', label: 'Refund / Return Request', desc: 'Inquire about refund eligibility under standard policy' },
  { id: 'general', label: 'Other General Support', desc: 'Product questions, warranty inquiry, or feedback' }
];

export default function RaiseIssuePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated with preselected order
  const preselectedOrderId = location.state?.orderId || '';

  const [category, setCategory] = useState('damaged_product');
  const [orderId, setOrderId] = useState(preselectedOrderId);
  const [orders, setOrders] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const data = await api.getCustomerOrders();
        setOrders(Array.isArray(data) ? data : []);
        if (!orderId && data?.length > 0) {
          setOrderId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load customer orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, [orderId]);

  // Dynamic helper suggestions based on category
  const getHelperHint = () => {
    switch (category) {
      case 'damaged_product':
        return 'Tip: Mention which ear cup, hinge, or component is affected and when you noticed the damage.';
      case 'delivery_issue':
        return 'Tip: Include the carrier tracking status or expected delivery date from your order.';
      case 'missing_item':
        return 'Tip: Specify which cable, adaptor, or accessory was missing from the packaging.';
      default:
        return 'Tip: Please provide specific details so ResolveAI can verify your warranty or order timeline.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject for your issue.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError('Please describe your issue in at least 5 characters.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await api.createCustomerTicket({
        title: subject.trim(),
        description: description.trim(),
        category,
        order_id: orderId || null,
        preferred_contact: preferredContact
      });

      if (res?.success && res.ticket) {
        setSubmittedTicket(res.ticket);
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        navigate('/customer/issues');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div style={{ maxWidth: '640px', marginInline: 'auto', textAlign: 'center', padding: '40px 20px' }}>
        <div
          style={{
            padding: '40px 32px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Issue Created Successfully
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Ticket <strong>#{submittedTicket.id}</strong> has been received by ResolveAI.
          </p>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '28px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CURRENT STATUS</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--status-open-bg)', color: 'var(--status-open-text)' }}>
                {submittedTicket.customerSafeStatus?.label || 'Received'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              ResolveAI is currently evaluating your order history and warranty terms. You will receive updates here in your portal and directly to your registered email address.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setSubmittedTicket(null);
                setSubject('');
                setDescription('');
                setCategory('damaged_product');
                setError('');
                if (orders.length > 0) setOrderId(orders[0].id);
              }}
              className="btn-primary"
              style={{ height: '44px', paddingInline: '22px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={16} />
              <span>Raise Another Issue</span>
            </button>
            <Link
              to={`/customer/issues/${submittedTicket.id}`}
              className="btn-secondary"
              style={{ height: '44px', paddingInline: '20px', fontSize: '0.9rem' }}
            >
              Track Case Progress
            </Link>
            <Link
              to="/customer"
              className="btn-secondary"
              style={{ height: '44px', paddingInline: '20px', fontSize: '0.9rem' }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', marginInline: 'auto' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/customer')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: '6px 0',
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Customer Portal</span>
      </button>

      <div
        style={{
          padding: '36px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            ASSISTANCE & WARRANTY INTAKE
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Raise an Issue
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
            Tell us what went wrong. ResolveAI will evaluate your case against warranty policies and initiate resolution.
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '24px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Step 1: Issue Type / Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>
              1. What type of issue are you experiencing?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      {cat.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Adaptive Order Link */}
          {(category === 'damaged_product' || category === 'delivery_issue' || category === 'missing_item' || category === 'wrong_item' || category === 'refund_request') && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                2. Which order does this pertain to? (Optional)
              </label>
              {orders.length > 0 ? (
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">-- No specific order linked --</option>
                  {orders.map((o) => {
                    const pName = o.product_name || o.productName || (o.items && o.items[0]?.name) || 'Product Item';
                    const rawPrice = o.amount !== undefined ? o.amount : (o.price !== undefined ? o.price : (o.items && o.items[0]?.price) || 0);
                    return (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} • {pName} (${Number(rawPrice).toFixed(2)}) • {o.status}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                  No past orders found on file. Our team will verify your account during triage.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Headphones arrived with left ear cup damaged"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Step 4: Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                Describe the problem
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {getHelperHint()}
              </span>
            </div>
            <textarea
              rows={5}
              required
              placeholder="Please provide full details of what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Step 5: Preferred Contact */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              Preferred Notification Method
            </label>
            <div style={{ display: 'flex', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="contact"
                  value="email"
                  checked={preferredContact === 'email'}
                  onChange={() => setPreferredContact('email')}
                />
                <span>Email & Portal (Recommended)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="contact"
                  value="in_app"
                  checked={preferredContact === 'in_app'}
                  onChange={() => setPreferredContact('in_app')}
                />
                <span>Portal Only</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="btn-secondary"
              style={{ height: '46px', paddingInline: '20px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ height: '46px', paddingInline: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting to ResolveAI...' : 'Submit Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
