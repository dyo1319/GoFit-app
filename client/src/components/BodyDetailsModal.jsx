// BodyDetailsModal.jsx – Updated to match backend (/body-details)
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './BodyDetailsModal.css';

const initialForm = {
  weight: '',
  height: '',
  body_fat: '',
  muscle_mass: '',
  circumference: '',
  recorded_at: '' // yyyy-mm-dd חובה ל־POST/PUT
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const BodyDetailsModal = ({ isOpen, onClose }) => {
  const { authenticatedFetch } = useAuth();

  const [activeTab, setActiveTab] = useState('add');
  const [formData, setFormData] = useState(() => ({ ...initialForm, recorded_at: todayISO() }));
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');

  // למצב עריכה של רשומה קיימת
  const [editId, setEditId] = useState(null);

  // BMI מחושב מקומי
  const bmi = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (!w || !h || w <= 0 || h <= 0) return null;
    const meters = h / 100;
    return (w / (meters * meters)).toFixed(1);
  }, [formData.weight, formData.height]);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'progress') {
      loadStats();
    }
  }, [isOpen, activeTab]);

  const loadHistory = async () => {
    try {
      setTabLoading(true);
      setError('');
      const resp = await authenticatedFetch('/body-details', { method: 'GET' });
      if (!resp.ok) throw new Error('שגיאה בטעינת היסטוריה');
      const json = await resp.json();
      setHistory(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError('נכשלה טעינת היסטוריית מדדים');
    } finally {
      setTabLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setTabLoading(true);
      setError('');
      const resp = await authenticatedFetch('/body-details/stats', { method: 'GET' });
      if (!resp.ok) throw new Error('שגיאה בטעינת סטטוס');
      const json = await resp.json();
      setStats(json?.data ?? null);
    } catch (e) {
      setError('נכשלה טעינת התקדמות חודשית');
    } finally {
      setTabLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...initialForm, recorded_at: todayISO() });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // תוודא שיש לפחות שדה מדידה אחד (השרת בודק גם כן)
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = formData;
    const hasAny =
      [weight, height, body_fat, muscle_mass, circumference].some(v => v !== '' && v !== null && v !== undefined);
    if (!hasAny) {
      setLoading(false);
      setError('יש להזין לפחות מדידה אחת');
      return;
    }
    if (!recorded_at) {
      setLoading(false);
      setError('יש לבחור תאריך מדידה');
      return;
    }

    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/body-details/${editId}` : '/body-details';

      const resp = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: formData.weight !== '' ? Number(formData.weight) : null,
          height: formData.height !== '' ? Number(formData.height) : null,
          body_fat: formData.body_fat !== '' ? Number(formData.body_fat) : null,
          muscle_mass: formData.muscle_mass !== '' ? Number(formData.muscle_mass) : null,
          circumference: formData.circumference !== '' ? Number(formData.circumference) : null,
          recorded_at: formData.recorded_at
        })
      });

      if (!resp.ok) {
        const j = await safeJson(resp);
        throw new Error(j?.message || 'שמירת המדדים נכשלה');
      }

      // רענון היסטוריה/סטטוס במידת הצורך
      if (activeTab === 'history') await loadHistory();
      if (activeTab === 'progress') await loadStats();

      resetForm();
      setActiveTab('history'); // מעבר אוטומטי להיסטוריה אחרי שמירה
    } catch (err) {
      setError(err.message || 'שגיאת רשת');
    } finally {
      setLoading(false);
    }
  };

  const safeJson = async (resp) => {
    try { return await resp.json(); } catch { return null; }
  };

  const handleEdit = (row) => {
    setEditId(row.id);
    setActiveTab('add');
    setFormData({
      weight: row.weight ?? '',
      height: row.height ?? '',
      body_fat: row.body_fat ?? '',
      muscle_mass: row.muscle_mass ?? '',
      circumference: row.circumference ?? '',
      recorded_at: row.recorded_at ?? todayISO()
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הרשומה הזו?')) return;
    try {
      setTabLoading(true);
      const resp = await authenticatedFetch(`/body-details/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('מחיקה נכשלה');
      await loadHistory();
    } catch (e) {
      setError('מחיקה נכשלה');
    } finally {
      setTabLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => { resetForm(); onClose(); }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="modal-header">
          <h2>מדידות גוף</h2>
          <button
            className="modal-close"
            onClick={() => { resetForm(); onClose(); }}
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            {editId ? 'עריכת מדידה' : 'הוספת מדדים'}
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            היסטוריה
          </button>
          <button
            className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            התקדמות
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'add' && (
            <div className="tab-content">
              <form className="body-details-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>משקל (ק"ג)</label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="הכנס משקל"
                    />
                  </div>
                  <div className="form-group">
                    <label>גובה (ס"מ)</label>
                    <input
                      type="number"
                      step="1"
                      inputMode="numeric"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="הכנס גובה"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>אחוז שומן (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formData.body_fat}
                      onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                      placeholder="אחוז שומן"
                    />
                  </div>
                  <div className="form-group">
                    <label>מסת שריר (ק"ג)</label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formData.muscle_mass}
                      onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                      placeholder="מסת שריר"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>היקף (ס"מ)</label>
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={formData.circumference}
                      onChange={(e) => setFormData({ ...formData, circumference: e.target.value })}
                      placeholder="היקף (אופציונלי)"
                    />
                  </div>
                  <div className="form-group">
                    <label>תאריך מדידה</label>
                    <input
                      type="date"
                      value={formData.recorded_at}
                      onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
                    />
                  </div>
                </div>

                {bmi && (
                  <div className="bmi-preview">
                    BMI: {bmi}
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  {editId && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => resetForm()}
                      disabled={loading}
                    >
                      ביטול עריכה
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { resetForm(); onClose(); }}
                    disabled={loading}
                  >
                    סגור
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'שומר...' : (editId ? 'עדכן מדדים' : 'שמור מדדים')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="tab-content">
              {tabLoading ? (
                <div className="loading">טוען היסטוריה...</div>
              ) : (
                <>
                  {history.length === 0 ? (
                    <div className="empty">אין רשומות עדיין.</div>
                  ) : (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>תאריך</th>
                          <th>משקל</th>
                          <th>גובה</th>
                          <th>% שומן</th>
                          <th>מסת שריר</th>
                          <th>היקף</th>
                          <th style={{ minWidth: 140 }}>פעולות</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(row => (
                          <tr key={row.id}>
                            <td>{row.recorded_at || '-'}</td>
                            <td>{row.weight ?? '-'}</td>
                            <td>{row.height ?? '-'}</td>
                            <td>{row.body_fat ?? '-'}</td>
                            <td>{row.muscle_mass ?? '-'}</td>
                            <td>{row.circumference ?? '-'}</td>
                            <td className="actions-td">
                              <button className="link" onClick={() => handleEdit(row)}>ערוך</button>
                              <span className="sep">|</span>
                              <button className="link danger" onClick={() => handleDelete(row.id)}>מחק</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
              {error && <div className="error-message">{error}</div>}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="tab-content">
              {tabLoading ? (
                <div className="loading">טוען התקדמות...</div>
              ) : (
                <>
                  {!stats ? (
                    <div className="empty">אין נתונים להצגה.</div>
                  ) : (
                    <div className="progress-grid">
                      <div className="progress-card">
                        <h4>מדידה אחרונה</h4>
                        {stats.latest ? (
                          <ul>
                            <li>תאריך: {stats.latest.recorded_at}</li>
                            <li>משקל: {stats.latest.weight ?? '-'}</li>
                            <li>גובה: {stats.latest.height ?? '-'}</li>
                            <li>% שומן: {stats.latest.body_fat ?? '-'}</li>
                            <li>מסת שריר: {stats.latest.muscle_mass ?? '-'}</li>
                            <li>היקף: {stats.latest.circumference ?? '-'}</li>
                          </ul>
                        ) : (
                          <div className="empty">אין מדידה אחרונה.</div>
                        )}
                      </div>
                      <div className="progress-card">
                        <h4>לפני ~30 יום</h4>
                        {stats.old ? (
                          <ul>
                            <li>תאריך: {stats.old.recorded_at}</li>
                            <li>משקל: {stats.old.weight ?? '-'}</li>
                            <li>% שומן: {stats.old.body_fat ?? '-'}</li>
                            <li>מסת שריר: {stats.old.muscle_mass ?? '-'}</li>
                            <li>היקף: {stats.old.circumference ?? '-'}</li>
                          </ul>
                        ) : (
                          <div className="empty">אין מדידה ישנה להשוואה.</div>
                        )}
                      </div>
                      <div className="progress-card">
                        <h4>שינויים (30 יום)</h4>
                        {stats.latest && stats.old ? (
                          <ul>
                            <li>Δ משקל: {stats.changes?.weight ?? '-'}</li>
                            <li>Δ % שומן: {stats.changes?.body_fat ?? '-'}</li>
                            <li>Δ מסת שריר: {stats.changes?.muscle_mass ?? '-'}</li>
                            <li>Δ היקף: {stats.changes?.circumference ?? '-'}</li>
                          </ul>
                        ) : (
                          <div className="empty">צריך שתי מדידות לפחות להשוואה.</div>
                        )}
                      </div>
                    </div>
                  )}
              </>
              )}
              {error && <div className="error-message">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyDetailsModal;
