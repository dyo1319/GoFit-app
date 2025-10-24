import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import { formatToBodyDetailsDate } from '../../utils/dateFormatter';
import './Bodydetails.css';

const BodyDetailsPage = () => {
  const { authenticatedFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recentData, setRecentData] = useState([]);
  const [stats, setStats] = useState(null);

  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    body_fat: '',
    muscle_mass: '',
    circumference: '',
    recorded_at: new Date().toISOString().split('T')[0]
  });

  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchRecentData();
      fetchStats();
    }
  }, [user]);

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const fetchRecentData = async () => {
    try {
      const response = await authenticatedFetch(`/body-details/recent`);
      const data = await response.json();
      
      if (data.success) {
        setRecentData(data.data);
      }
    } catch (err) {
      console.error('Error fetching recent data:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch(`/body-details/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    const { weight, height, body_fat, muscle_mass, circumference } = formData;
    
    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      setError('אנא מלא לפחות שדה מדידה אחד');
      return false;
    }

    const numericFields = { weight, height, body_fat, muscle_mass, circumference };
    for (const [field, value] of Object.entries(numericFields)) {
      if (value && (isNaN(value) || parseFloat(value) <= 0)) {
        setError(`${field.replace('_', ' ')} חייב להיות מספר חיובי`);
        return false;
      }
    }

    if (weight && (parseFloat(weight) < 30 || parseFloat(weight) > 300)) {
      setError('המשקל חייב להיות בין 30-300 ק״ג');
      return false;
    }
    
    if (height && (parseFloat(height) < 100 || parseFloat(height) > 250)) {
      setError('הגובה חייב להיות בין 100-250 ס״מ');
      return false;
    }

    if (body_fat && (parseFloat(body_fat) < 3 || parseFloat(body_fat) > 60)) {
      setError('אחוזי השומן חייבים להיות בין 3-60%');
      return false;
    }

    if (muscle_mass && (parseFloat(muscle_mass) < 10 || parseFloat(muscle_mass) > 100)) {
      setError('מסת השריר חייבת להיות בין 10-100 ק״ג');
      return false;
    }

    if (circumference && (parseFloat(circumference) < 50 || parseFloat(circumference) > 200)) {
      setError('היקף המותניים חייב להיות בין 50-200 ס״מ');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        circumference: formData.circumference ? parseFloat(formData.circumference) : null,
        recorded_at: formData.recorded_at
      };

      console.log('Submitting data:', submitData);

      let response;
      if (editingRecord) {
        response = await authenticatedFetch(`/body-details/${editingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      } else {
        response = await authenticatedFetch('/body-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(editingRecord ? 'מדדי הגוף עודכנו בהצלחה!' : 'מדדי הגוף נוספו בהצלחה!');
        
        setFormData({
          weight: '',
          height: '',
          body_fat: '',
          muscle_mass: '',
          circumference: '',
          recorded_at: new Date().toISOString().split('T')[0]
        });
        setEditingRecord(null);
        
        await fetchRecentData();
        await fetchStats();
        
        setTimeout(() => {
          setActiveTab('history');
        }, 1000);
        
      } else {
        setError(result.message || 'שגיאה בשמירת מדדי הגוף');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב.');
      console.error('Error saving body details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      weight: record.weight || '',
      height: record.height || '',
      body_fat: record.body_fat || '',
      muscle_mass: record.muscle_mass || '',
      circumference: record.circumference || '',
      recorded_at: record.recorded_at
    });
    setEditingRecord(record);
    setActiveTab('add');
    setError('');
    setSuccess('');
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/body-details/${recordId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('הרשומה נמחקה בהצלחה!');
        await fetchRecentData();
        await fetchStats();
      } else {
        setError(result.message || 'שגיאה במחיקת הרשומה');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב.');
      console.error('Error deleting record:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setFormData({
      weight: '',
      height: '',
      body_fat: '',
      muscle_mass: '',
      circumference: '',
      recorded_at: new Date().toISOString().split('T')[0]
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="bodydetails-page" dir="rtl">
    <PageHeader />
      <div className="bodydetails-content">
      <div className="page-header">
        <div className="page-title">
            <h1>מדדי גוף</h1>
        </div>
        <p>מדדים, היסטוריה והתקדמות</p>
      </div>

        <div className="bodydetails-container">
          <div className="bodydetails-tabs">
            <button 
              className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => setActiveTab('add')}
            >
              {editingRecord ? 'עריכת רשומה' : 'הוספה חדשה'}
            </button>
            <button 
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              היסטוריה אחרונה
            </button>
            <button 
              className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              התקדמות
            </button>
          </div>

          <div className="bodydetails-content-area">
            {activeTab === 'add' && (
              <div className="tab-content">
                <form onSubmit={handleSubmit} className="body-details-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="body_weight">משקל (ק״ג)</label>
                      <input
                        id="body_weight"
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="לדוגמה: 70.5"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="body_height">גובה (ס״מ)</label>
                      <input
                        id="body_height"
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="לדוגמה: 175"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="body_fat_percentage">אחוזי שומן (%)</label>
                      <input
                        id="body_fat_percentage"
                        type="number"
                        name="body_fat"
                        value={formData.body_fat}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="לדוגמה: 15.5"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="muscle_mass_kg">מסת שריר (ק״ג)</label>
                      <input
                        id="muscle_mass_kg"
                        type="number"
                        name="muscle_mass"
                        value={formData.muscle_mass}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="לדוגמה: 45.2"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="waist_circumference">היקף מותניים (ס״מ)</label>
                      <input
                        id="waist_circumference"
                        type="number"
                        name="circumference"
                        value={formData.circumference}
                        onChange={handleInputChange}
                        step="0.1"
                        placeholder="לדוגמה: 85"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="measurement_date">תאריך מדידה</label>
                      <input
                        id="measurement_date"
                        type="date"
                        name="recorded_at"
                        value={formData.recorded_at}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {formData.weight && formData.height && (
                    <div className="bmi-preview">
                      <span>תצוגה מקדימה BMI: {calculateBMI(formData.weight, formData.height)}</span>
                    </div>
                  )}

                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}

                  <div className="form-actions">
                    {editingRecord && (
                      <button type="button" onClick={cancelEdit} className="btn-secondary">
                        ביטול עריכה
                      </button>
                    )}
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? 'שומר...' : (editingRecord ? 'עדכון רשומה' : 'הוספת רשומה')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-content">
                <h3>30 הימים האחרונים ({recentData.length} רשומות)</h3>
                {recentData.length > 0 ? (
                  <div className="history-list">
                    {recentData.map((record) => (
                      <div key={record.id} className="history-item">
                        <div className="history-date">{formatToBodyDetailsDate(record.recorded_at)}</div>
                        <div className="history-metrics">
                          {record.weight && <span>משקל: {record.weight}ק״ג</span>}
                          {record.height && <span>גובה: {record.height}ס״מ</span>}
                          {record.body_fat && <span>אחוזי שומן: {record.body_fat}%</span>}
                          {record.muscle_mass && <span>שריר: {record.muscle_mass}ק״ג</span>}
                          {record.circumference && <span>מותניים: {record.circumference}ס״מ</span>}
                          {record.weight && record.height && (
                            <span>BMI: {calculateBMI(record.weight, record.height)}</span>
                          )}
                        </div>
                        <div className="history-actions">
                          <button onClick={() => handleEdit(record)} className="btn-edit">
                            עריכה
                          </button>
                          <button 
                            onClick={() => handleDelete(record.id)} 
                            className="btn-delete"
                            disabled={loading}
                          >
                            מחיקה
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>לא נרשמו מדדים ב-30 הימים האחרונים.</p>
                    <button onClick={() => setActiveTab('add')} className="btn-primary">
                      הוסף את המדידה הראשונה שלך
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="tab-content">
                <h3>השוואת התקדמות של 30 יום</h3>
                {stats && stats.latest ? (
                  <div className="progress-content">
                    <div className="progress-comparison">
                      <div className="comparison-section">
                        <h4>מדדים נוכחיים</h4>
                        <div className="measurements-grid">
                          {stats.latest.weight && (
                            <div className="measurement-item">
                              <span className="label">משקל</span>
                              <span className="value">{stats.latest.weight} ק״ג</span>
                            </div>
                          )}
                          {stats.latest.height && (
                            <div className="measurement-item">
                              <span className="label">גובה</span>
                              <span className="value">{stats.latest.height} ס״מ</span>
                            </div>
                          )}
                          {stats.latest.body_fat && (
                            <div className="measurement-item">
                              <span className="label">אחוזי שומן</span>
                              <span className="value">{stats.latest.body_fat}%</span>
                            </div>
                          )}
                          {stats.latest.muscle_mass && (
                            <div className="measurement-item">
                              <span className="label">מסת שריר</span>
                              <span className="value">{stats.latest.muscle_mass} ק״ג</span>
                            </div>
                          )}
                          {stats.latest.circumference && (
                            <div className="measurement-item">
                              <span className="label">מותניים</span>
                              <span className="value">{stats.latest.circumference} ס״מ</span>
                            </div>
                          )}
                          {stats.latest.weight && stats.latest.height && (
                            <div className="measurement-item">
                              <span className="label">BMI</span>
                              <span className="value">{calculateBMI(stats.latest.weight, stats.latest.height)}</span>
                            </div>
                          )}
                        </div>
                        <div className="measurement-date">
                          עודכן לאחרונה: {formatToBodyDetailsDate(stats.latest.recorded_at)}
                        </div>
                      </div>

                      {stats.old && (
                        <div className="comparison-section">
                          <h4>לפני 30 יום</h4>
                          <div className="measurements-grid">
                            {stats.old.weight && (
                              <div className="measurement-item">
                                <span className="label">משקל</span>
                                <span className="value">{stats.old.weight} ק״ג</span>
                              </div>
                            )}
                            {stats.old.height && (
                              <div className="measurement-item">
                                <span className="label">גובה</span>
                                <span className="value">{stats.old.height} ס״מ</span>
                              </div>
                            )}
                            {stats.old.body_fat && (
                              <div className="measurement-item">
                                <span className="label">אחוזי שומן</span>
                                <span className="value">{stats.old.body_fat}%</span>
                              </div>
                            )}
                            {stats.old.muscle_mass && (
                              <div className="measurement-item">
                                <span className="label">מסת שריר</span>
                                <span className="value">{stats.old.muscle_mass} ק״ג</span>
                              </div>
                            )}
                            {stats.old.circumference && (
                              <div className="measurement-item">
                                <span className="label">מותניים</span>
                                <span className="value">{stats.old.circumference} ס״מ</span>
                              </div>
                            )}
                            {stats.old.weight && stats.old.height && (
                              <div className="measurement-item">
                                <span className="label">BMI</span>
                                <span className="value">{calculateBMI(stats.old.weight, stats.old.height)}</span>
                              </div>
                            )}
                          </div>
                          <div className="measurement-date">
                            מ: {formatToBodyDetailsDate(stats.old.recorded_at)}
                          </div>
                        </div>
                      )}
                    </div>

                    {stats.old && stats.changes && (
                      <div className="progress-changes">
                        <h4>שינויים במהלך 30 יום</h4>
                        <div className="changes-grid">
                          {stats.changes.weight && (
                            <div className={`change-item ${parseFloat(stats.changes.weight) >= 0 ? 'positive' : 'negative'}`}>
                              <span className="label">שינוי משקל</span>
                              <span className="change">
                                {parseFloat(stats.changes.weight) >= 0 ? '+' : ''}{stats.changes.weight} ק״ג
                              </span>
                            </div>
                          )}
                          {stats.changes.body_fat && (
                            <div className={`change-item ${parseFloat(stats.changes.body_fat) <= 0 ? 'positive' : 'negative'}`}>
                              <span className="label">שינוי אחוזי שומן</span>
                              <span className="change">
                                {parseFloat(stats.changes.body_fat) >= 0 ? '+' : ''}{stats.changes.body_fat}%
                              </span>
                            </div>
                          )}
                          {stats.changes.muscle_mass && (
                            <div className={`change-item ${parseFloat(stats.changes.muscle_mass) >= 0 ? 'positive' : 'negative'}`}>
                              <span className="label">שינוי שריר</span>
                              <span className="change">
                                {parseFloat(stats.changes.muscle_mass) >= 0 ? '+' : ''}{stats.changes.muscle_mass} ק״ג
                              </span>
                            </div>
                          )}
                          {stats.changes.circumference && (
                            <div className={`change-item ${parseFloat(stats.changes.circumference) <= 0 ? 'positive' : 'negative'}`}>
                              <span className="label">שינוי מותניים</span>
                              <span className="change">
                                {parseFloat(stats.changes.circumference) >= 0 ? '+' : ''}{stats.changes.circumference} ס״מ
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="progress-summary">
                          {parseFloat(stats.changes.weight || 0) < 0 && parseFloat(stats.changes.body_fat || 0) < 0 && (
                            <p className="positive-message">התקדמות מעולה! אתה מאבד משקל ואחוזי שומן! 🎉</p>
                          )}
                          {parseFloat(stats.changes.muscle_mass || 0) > 0 && (
                            <p className="positive-message">מעולה! אתה בונה מסת שריר! 💪</p>
                          )}
                          {parseFloat(stats.changes.circumference || 0) < 0 && (
                            <p className="positive-message">מותניים שלך הולכים וקטנים! המשך כך! ⭐</p>
                          )}
                        </div>
                      </div>
                    )}

                    {!stats.old && (
                      <div className="no-comparison">
                        <p>אין נתונים מלפני 30 יום להשוואה.</p>
                        <p>המשך לרשום את המדדים שלך כדי לעקוב אחרי ההתקדמות לאורך זמן!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data">
                    <p>אין מדדים נוכחיים להצגת התקדמות.</p>
                    <button onClick={() => setActiveTab('add')} className="btn-primary">
                      הוסף את המדידה הראשונה שלך
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  </div>
);
};

export default BodyDetailsPage;
