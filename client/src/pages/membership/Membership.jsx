import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import './Membership.css';

const API_BASE = import.meta.env.VITE_API_BASE;

const Membership = ({ user: userProp }) => {
  const { user: userCtx } = useAuth();
  const user = userProp ?? userCtx ?? null;
  const { authenticatedFetch } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const daysBetween = (a, b) => {
    const d = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
    return d;
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    return daysBetween(today, end);
  };

  const paymentBadge = (status) => {
    const st = String(status || '').toLowerCase();
    if (st === 'paid')     return { text: 'שולם',      color: '#10b981', bg: '#ecfdf5', icon: 'check_circle' };
    if (st === 'pending')  return { text: 'ממתין',     color: '#f59e0b', bg: '#fffbeb', icon: 'schedule' };
    if (st === 'refunded') return { text: 'הוחזר',     color: '#0288d1', bg: '#e0f2fe', icon: 'undo' };
    return { text: 'נכשל', color: '#ef4444', bg: '#fef2f2', icon: 'cancel' };
  };

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [allR, curR, statsR] = await Promise.all([
          authenticatedFetch(`${API_BASE}/S/user/mine`),
          authenticatedFetch(`${API_BASE}/S/user/current`),
          authenticatedFetch(`${API_BASE}/S/user/stats`)
        ]);

        const allJ = await allR.json();
        const curJ = await curR.json();
        const statsJ = await statsR.json();

        setSubscriptions(Array.isArray(allJ.data) ? allJ.data : []);
        setCurrentSubscription(curJ?.data || null);
        setStats(statsJ?.data || null);
      } catch (e) {
        console.error(e);
        setError('טעינת נתוני המנוי נכשלה. נסה שוב.');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [authenticatedFetch]);

  if (isLoading) {
    return (
      <div className="membership-page" dir="rtl">
        <PageHeader />
        <div className="membership-content">
          <div className="loading-container">
            <div className="loading-spinner"><div className="spinner"></div></div>
            <p>טוען נתוני מנוי…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="membership-page" dir="rtl">
        <PageHeader />
        <div className="membership-content">
          <div className="error-message">
            <span className="material-icons">warning</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page" dir="rtl">
      <PageHeader />
      <div className="membership-content">
        <div className="page-header">
          <div className="page-title">
            <span className="material-icons">card_membership</span>
            <h1>מנוי</h1>
          </div>
          <p>ניהול המנוי וההרשמות שלך</p>
        </div>

        <div className="user-welcome-card">
          <div className="user-avatar"><span>{user?.username?.charAt(0).toUpperCase() || user?.phone?.charAt(0).toUpperCase() || 'מ'}</span></div>
          <div className="user-info">
            <h2>שלום, {user?.username || user?.phone || 'מתאמן/ת'}!</h2>
            <p>הנה תמונת מצב המנוי שלך</p>
          </div>
        </div>

        {currentSubscription ? (
          <div className="current-subscription-card">
            <div className="card-header">
              <div className="header-content">
                <span className="material-icons">stars</span>
                <h3>מנוי נוכחי</h3>
              </div>
              <div className="active-badge">פעיל</div>
            </div>

            <div className="subscription-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="material-icons detail-icon">fitness_center</span>
                  <div className="detail-content">
                    <span className="detail-label">תאריך התחלה</span>
                    <span className="detail-value">{new Date(currentSubscription.start_date).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="material-icons detail-icon">timer</span>
                  <div className="detail-content">
                    <span className="detail-label">תאריך סיום</span>
                    <span className="detail-value">{new Date(currentSubscription.end_date).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="material-icons detail-icon">history</span>
                  <div className="detail-content">
                    <span className="detail-label">ימים שנותרו</span>
                    <span className={`detail-value ${getDaysRemaining(currentSubscription.end_date) <= 7 ? 'expiring-soon' : ''}`}>
                      {getDaysRemaining(currentSubscription.end_date)} ימים
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="material-icons detail-icon">payment</span>
                  <div className="detail-content">
                    <span className="detail-label">סטטוס תשלום</span>
                    <div className="payment-status">
                      {(() => {
                        const badge = paymentBadge(currentSubscription.payment_status);
                        return (
                          <span className="payment-badge" style={{ color: badge.color, backgroundColor: badge.bg }}>
                            <span className="material-icons">{badge.icon}</span>
                            {badge.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* תקציר/סטטיסטיקות */}
            <div className="monthly-stats">
              <div className="stats-header">
                <span className="material-icons">fact_check</span>
                <h4>סקירה</h4>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{stats?.active_subscriptions ?? 0}</div>
                  <div className="stat-label">פעילים</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{stats?.expired_subscriptions ?? 0}</div>
                  <div className="stat-label">פגו</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{stats?.total_subscriptions ?? 0}</div>
                  <div className="stat-label">סה״כ</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-subscription-card">
            <span className="material-icons no-subscription-icon">fitness_center</span>
            <h3>אין מנוי פעיל</h3>
            <p>כרגע אין לך מנוי פעיל. ניתן לפנות למכון כדי להתחיל.</p>
          </div>
        )}

        {/* היסטוריה */}
        {subscriptions.length > 0 && (
          <div className="subscription-history">
            <div className="history-header">
              <span className="material-icons">history</span>
              <h3>היסטוריית מנויים</h3>
            </div>
            <div className="history-list">
              {subscriptions.map((s) => {
                const isActive = currentSubscription?.id === s.id;
                const daysRemaining = getDaysRemaining(s.end_date);
                const badge = paymentBadge(s.payment_status);
                return (
                  <div key={s.id} className={`history-item ${isActive ? 'active' : ''}`}>
                    <div className="history-header-item">
                      <span className="history-period">
                        {new Date(s.start_date).toLocaleDateString('he-IL')} - {new Date(s.end_date).toLocaleDateString('he-IL')}
                      </span>
                      {isActive && <span className="current-label">נוכחי</span>}
                    </div>
                    <div className="history-details">
                      <div className="history-stat">
                        <span className="material-icons">timer</span>
                        <span className="stat-label">ימים שנותרו:</span>
                        <span className={`stat-value ${daysRemaining <= 7 && daysRemaining > 0 ? 'expiring' : daysRemaining <= 0 ? 'expired' : ''}`}>
                          {daysRemaining > 0 ? `${daysRemaining} ימים` : daysRemaining === 0 ? 'פג היום' : 'פג תוקף'}
                        </span>
                      </div>
                      <div className="history-stat">
                        <span className="material-icons">payment</span>
                        <span className="stat-label">תשלום:</span>
                        <span className="payment-badge small" style={{ color: badge.color, backgroundColor: badge.bg }}>
                          <span className="material-icons">{badge.icon}</span>
                          {badge.text}
                        </span>
                      </div>
                      <div className="history-stat">
                        <span className="material-icons">fact_check</span>
                        <span className="stat-label">סטטוס:</span>
                        <span className="stat-value">{s.subscription_status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Membership;
