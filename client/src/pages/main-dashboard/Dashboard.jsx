import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import BottomNavBar from '../../components/BottomNavBar';
import Workouts from '../workout/Workouts';
import Membership from '../membership/Membership';
import Profile from '../profile/Profile';
import ProgressOverview from '../../components/ProgressOverview';
import './Dashboard.css';
import '../../components/BottomNavBar.css';
import '../../components/EmptyPages.css';

const API_BASE = import.meta.env.VITE_API_BASE;

const Dashboard = ({ user, onSignOut }) => {
  const { authenticatedFetch } = useAuth();

  const [fitnessData, setFitnessData] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const calculateBMI = (weight, height) => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || w <= 0 || h <= 0) return null;
    const meters = h / 100;
    return parseFloat((w / (meters * meters)).toFixed(1));
  };

  // מספר ימים פעילים בחודש הנוכחי לפי המנוי
  const getActiveDaysThisMonth = (subs) => {
    if (!Array.isArray(subs) || subs.length === 0) return 0;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const current = subs.find(s =>
      s.cancelled_at == null &&
      new Date(s.start_date) <= today &&
      new Date(s.end_date) >= today
    );
    if (!current) return 0;

    const effectiveStart = new Date(Math.max(new Date(current.start_date).getTime(), startOfMonth.getTime()));
    const effectiveEnd = new Date(Math.min(new Date(current.end_date).getTime(), endOfMonth.getTime()));
    const diff = Math.round((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diff);
  };

  const prepareChartData = (bodyRows) => {
    if (!Array.isArray(bodyRows)) return [];
    return bodyRows
      .map(r => {
        const height = parseFloat(r.height) || 0;
        const weight = parseFloat(r.weight) || 0;
        const bodyFat = parseFloat(r.body_fat) || 0;
        const muscleMass = parseFloat(r.muscle_mass) || 0;
        return {
          date: r.recorded_at || r.checked_at,
          weight,
          bodyFat,
          muscleMass,
          bmi: calculateBMI(weight, height) || 0
        };
      })
      .reverse();
  };

  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // /body-details משתמש ב־JWT; /S/user/mine מחזיר היסטוריית מנויים למשתמש
        const [bodyResp, subsResp] = await Promise.all([
          authenticatedFetch(`${API_BASE}/body-details`, { signal: controller.signal }),
          authenticatedFetch(`${API_BASE}/S/user/mine`,   { signal: controller.signal }),
        ]);

        const bodyJson = await bodyResp.json().catch(() => ({ success:false, message:'Invalid JSON from /body-details' }));
        const subsJson = await subsResp.json().catch(() => ({ success:false, message:'Invalid JSON from /S/user/mine' }));

        if (cancelled) return;

        if (bodyJson?.success) {
          const arr = Array.isArray(bodyJson.data) ? bodyJson.data : [];
          setFitnessData(arr);
          setChartData(prepareChartData(arr));
        } else {
          setFitnessData([]);
          setChartData([]);
          if (bodyJson?.message) setError(bodyJson.message);
        }

        const subsArr = Array.isArray(subsJson?.data) ? subsJson.data : [];
        setSubscriptions(subsArr);
      } catch (e) {
        if (cancelled) return;
        setError(e.name === 'AbortError' ? 'השרת לא מגיב כרגע (Timeout)' : (e.message || 'שגיאת רשת'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => { cancelled = true; controller.abort(); };
  }, [activeTab, authenticatedFetch]);

  const handleTabChange = (tabId) => setActiveTab(tabId);

  const renderLoadingState = () => (
    <div className="loading-container" dir="rtl">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>טוען נתוני כושר…</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="error-message" dir="rtl">{error}</div>
  );

  const renderWelcomeSection = () => (
    <div className="welcome-section" dir="rtl">
      <h2>ברוך הבא!</h2>
      <p>עקוב אחר הדרך שלך בכושר</p>
    </div>
  );

  const renderFitnessCards = (latestData, activeDays, bmi) => (
    <div className="fitness-cards" dir="rtl">
      {/* מדדי גוף */}
      <div className="fitness-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="currentColor"/>
          </svg>
          <h4>מדדי גוף</h4>
        </div>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-value">{latestData?.weight ? parseFloat(latestData.weight).toFixed(1) : '--'}</span>
            <span className="metric-label">משקל (ק״ג)</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{latestData?.height ? parseFloat(latestData.height).toFixed(0) : '--'}</span>
            <span className="metric-label">גובה (ס״מ)</span>
          </div>
          <div className="metric-item">
            <span className="metric-value">{bmi || '--'}</span>
            <span className="metric-label">BMI</span>
          </div>
        </div>
      </div>

      {/* הרכב גוף */}
      <div className="fitness-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
          </svg>
          <h4>הרכב גוף</h4>
        </div>
        <div className="body-fat-display">
          <div className="body-fat-circle" style={{'--body-fat': latestData?.body_fat || 20}}>
            <div className="body-fat-percentage">
              {latestData?.body_fat ? parseFloat(latestData.body_fat).toFixed(1) : '--'}%
            </div>
          </div>
          <div className="muscle-info">
            <p>אחוזי שומן: <strong>{latestData?.body_fat ? parseFloat(latestData.body_fat).toFixed(1) : '--'}%</strong></p>
            <p>מסת שריר: <strong>{latestData?.muscle_mass ? parseFloat(latestData.muscle_mass).toFixed(1) : '--'} ק״ג</strong></p>
          </div>
        </div>
      </div>

      {/* החודש */}
      <div className="fitness-card">
        <div className="card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
          </svg>
          <h4>החודש</h4>
        </div>
        <div className="visits-display">
          <div className="visits-count">{activeDays}</div>
          <p>ימי פעילות שנותרו</p>
          <div className="motivation-text">
            {activeDays >= 12 ? 'התקדמות מעולה!' : `${Math.max(0, 12 - activeDays)} ימים כדי להגיע ליעד`}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFitnessDataSection = (latestData, activeDays, bmi) => (
    <section className="fitness-data-section" dir="rtl">
      <div className="section-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" fill="currentColor"/>
        </svg>
        <h3>נתוני הכושר שלך</h3>
      </div>
      {renderFitnessCards(latestData, activeDays, bmi)}
    </section>
  );

  const renderProgressSection = () => (
    <section className="workout-stats-section" dir="rtl">
      <div className="section-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" fill="currentColor"/>
        </svg>
        <h3>סקירת התקדמות</h3>
      </div>
      <ProgressOverview chartData={chartData} />
    </section>
  );

  const renderDashboard = () => {
    const latestData = Array.isArray(fitnessData) && fitnessData.length > 0 ? fitnessData[0] : null;
    const bmi = latestData ? calculateBMI(latestData.weight, latestData.height) : null;
    const activeDaysThisMonth = getActiveDaysThisMonth(subscriptions);

    if (isLoading) return renderLoadingState();

    return (
      <div className="dashboard" dir="rtl">
        <PageHeader />
        <main className="dashboard-main">
          <div className="dashboard-content">
            {renderWelcomeSection()}
            {error && renderErrorState()}
            {renderFitnessDataSection(latestData, activeDaysThisMonth, bmi)}
            {renderProgressSection()}
          </div>
        </main>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'workouts':   return <Workouts user={user} />;
      case 'membership': return <Membership user={user} />;
      case 'profile':    return <Profile user={user} onSignOut={onSignOut} />;
      case 'dashboard':
      default:           return renderDashboard();
    }
  };

  return (
    <div>
      {renderContent()}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Dashboard;
