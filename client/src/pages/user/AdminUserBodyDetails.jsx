import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatToBodyDetailsDate } from '../../utils/dateFormatter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './AdminUserBodyDetails.css';

const AdminUserBodyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bodyDetails, setBodyDetails] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [historyViewMode, setHistoryViewMode] = useState('all'); // 'recent' or 'all'

  useEffect(() => {
    if (!hasPermission('view_users')) {
      setError('אין לך הרשאות לצפות במדדי גוף של משתמשים');
      setLoading(false);
      return;
    }

    fetchUserInfo();
    fetchBodyDetails();
  }, [id, historyViewMode]);

  const fetchUserInfo = async () => {
    try {
      const response = await authenticatedFetch(`/U/${id}?expand=1`);
      const data = await response.json();
      
      if (data.success && data.data?.user) {
        setUserInfo(data.data.user);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchBodyDetails = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/body-details/user/${id}`);
      const data = await response.json();
      
      if (data.success) {
        let filteredData = data.data;
        
        // Filter by date if needed
        if (historyViewMode === 'recent') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filteredData = data.data.filter(record => {
            const recordDate = new Date(record.recorded_at);
            return recordDate >= thirtyDaysAgo;
          });
        }
        
        setBodyDetails(filteredData);
      } else {
        setError(data.message || 'שגיאה בטעינת מדדי הגוף');
      }
    } catch (err) {
      console.error('Error fetching body details:', err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  if (loading) {
    return (
      <div className="admin-body-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-body-details-page">
      <div className="admin-body-details-header">
        <button 
          className="back-button"
          onClick={() => navigate(`/admin/user/${id}`)}
        >
          <ArrowBackIcon />
          חזרה לפרופיל המשתמש
        </button>
        <div className="header-info">
          <h1 className="userTitle">היסטוריית מדדי גוף</h1>
          {userInfo && (
            <p className="user-name">{userInfo.username} ({userInfo.phone})</p>
          )}
        </div>
      </div>

      <div className="admin-body-details-content">
        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="history-header">
          <h3 className="userShowTitle">
            {historyViewMode === 'recent' 
              ? `30 הימים האחרונים (${bodyDetails.length} רשומות)`
              : `כל המדידות (${bodyDetails.length} רשומות)`
            }
          </h3>
          <div className="history-view-toggle">
            <button
              className={`view-toggle-btn ${historyViewMode === 'recent' ? 'active' : ''}`}
              onClick={() => setHistoryViewMode('recent')}
            >
              30 יום אחרונים
            </button>
            <button
              className={`view-toggle-btn ${historyViewMode === 'all' ? 'active' : ''}`}
              onClick={() => setHistoryViewMode('all')}
            >
              כל המדידות
            </button>
          </div>
        </div>

        {bodyDetails.length > 0 ? (
          <div className="history-list">
            {bodyDetails.map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-date">{formatToBodyDetailsDate(record.recorded_at)}</div>
                <div className="history-metrics">
                  {record.weight && <span>משקל: {record.weight} ק״ג</span>}
                  {record.height && <span>גובה: {record.height} ס״מ</span>}
                  {record.body_fat && <span>אחוזי שומן: {record.body_fat}%</span>}
                  {record.muscle_mass && <span>שריר: {record.muscle_mass} ק״ג</span>}
                  {record.circumference && <span>מותניים: {record.circumference} ס״מ</span>}
                  {record.weight && record.height && (
                    <span>BMI: {calculateBMI(record.weight, record.height)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>
              {historyViewMode === 'recent' 
                ? 'לא נרשמו מדדים ב-30 הימים האחרונים.'
                : 'לא נרשמו מדדים עדיין.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserBodyDetails;

