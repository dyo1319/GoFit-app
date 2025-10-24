import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function toYMD(dateLike) {
  if (!dateLike) return '';
  const s = String(dateLike);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  } catch {}
  return '';
}

function formatDateDisplay(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return 'לא הוגדר';
  
  try {
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  return 'לא הוגדר';
}

const Profile = ({ user: userProp }) => {
  const { user: userCtx } = useAuth();
  const user = userProp ?? userCtx ?? null;

  const [form, setForm] = useState({
    username: '',
    birth_date: '',
    gender: ''
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        birth_date: toYMD(user.birth_date),
        gender: user.gender || ''
      });
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: form.username,
          birth_date: form.birth_date || null,
          gender: form.gender || null
        })
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage(j.message || j.error || 'שגיאה בעדכון הפרופיל');
      } else {
        setMessage('הפרופיל עודכן בהצלחה');
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setMessage('שגיאת רשת בעת שמירת הפרופיל');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPwdError(null);
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError('יש למלא את כל השדות');
      return;
    }
    if (newPwd.length < 6) {
      setPwdError('הסיסמה החדשה קצרה מדי (מינימום 6 תווים)');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('הסיסמאות החדשות אינן תואמות');
      return;
    }

    setPwdSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          old_password: oldPwd,
          new_password: newPwd
        })
      });
      const j = await res.json();
      if (!res.ok) {
        setPwdError(j.message || j.error || 'שגיאה בעדכון הסיסמה');
      } else {
        setPwModalOpen(false);
        setOldPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setMessage('הסיסמה עודכנה בהצלחה');
      }
    } catch (err) {
      console.error(err);
      setPwdError('שגיאת רשת בעת שינוי הסיסמה');
    } finally {
      setPwdSaving(false);
    }
  }

  const cancelEdit = () => {
    setForm({
      username: user.username || '',
      birth_date: toYMD(user.birth_date),
      gender: user.gender || ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="profile-page" dir="rtl">
        <PageHeader />
        <div className="profile-content">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner" />
              <p>טוען פרטי פרופיל…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initialLetter = String(user?.username ?? user?.phone ?? 'מ')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="profile-page" dir="rtl">
      <PageHeader />
      <div className="profile-content">
        <div className="page-header">
          <div className="page-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
            <h1>פרופיל</h1>
          </div>
          <p>ניהול חשבון והעדפות</p>
        </div>

        <div className="profile-card">
          <div className="user-avatar">
            <span>{initialLetter}</span>
          </div>
          <div className="user-details">
            <h3>{user?.username ?? 'משתמש'}</h3>
            {user?.phone && <p>{user.phone}</p>}
            {user?.email && <p>{user.email}</p>}
          </div>
        </div>

        <div className="profile-edit-card">
          <div className="edit-header">
            <h3>פרטים אישיים</h3>
            {!isEditing && (
              <button className="btn primary" onClick={() => setIsEditing(true)}>
                ערוך פרטים
              </button>
            )}
          </div>

          {isEditing ? (
            <>
              <label htmlFor="profile_username">שם משתמש</label>
              <input
                id="profile_username"
                name="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />

              <label htmlFor="profile_birth_date">תאריך לידה</label>
              <input
                id="profile_birth_date"
                name="birth_date"
                type="date"
                inputMode="none"
                value={form.birth_date || ''}
                onChange={e => setForm({ ...form, birth_date: e.target.value })}
              />

              <label>מגדר</label>
              <select
                value={form.gender || ''}
                onChange={e => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">לא מוגדר</option>
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
              </select>

              <div className="edit-actions">
                <button className="btn primary" onClick={saveProfile} disabled={saving}>
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button className="btn" onClick={cancelEdit}>
                  ביטול
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="field-display">
                <label>שם משתמש</label>
                <div className="field-value">{form.username || 'לא הוגדר'}</div>
              </div>

              <div className="field-display">
                <label>תאריך לידה</label>
                <div className="field-value">{formatDateDisplay(form.birth_date)}</div>
              </div>

              <div className="field-display">
                <label>מגדר</label>
                <div className="field-value">
                  {form.gender === 'male' ? 'זכר' : 
                   form.gender === 'female' ? 'נקבה' : 'לא מוגדר'}
                </div>
              </div>
            </>
          )}

          <div className="password-section">
            <button className="btn" onClick={() => setPwModalOpen(true)}>
              שנה סיסמה
            </button>
          </div>

          {message && <div className="notice">{message}</div>}
        </div>

        {pwModalOpen && (
          <div
            className="pw-modal-overlay"
            onClick={() => {
              if (!pwdSaving) {
                setPwModalOpen(false);
                setPwdError(null);
              }
            }}
          >
            <div
              className="pw-modal"
              onClick={e => e.stopPropagation()}
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pw-title"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !pwdSaving) {
                  handleChangePassword();
                }
              }}
            >
              <h4 id="pw-title">שינוי סיסמה</h4>

              <form className="pw-form" onSubmit={(e)=>{e.preventDefault(); handleChangePassword();}}>
                <div className="pw-row">
                  <label htmlFor="oldPwd">סיסמה ישנה</label>
                  <div className="pw-input-wrap">
                    <input
                      id="oldPwd"
                      type={showOld ? 'text' : 'password'}
                      value={oldPwd}
                      onChange={e => setOldPwd(e.target.value)}
                      tabIndex={1}
                      autoFocus
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="pw-eye"
                      onClick={()=>setShowOld(v=>!v)}
                      aria-label={showOld ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      tabIndex={-1}
                    >
                      {showOld ? 'הסתר' : 'הצג'}
                    </button>
                  </div>
                </div>

                <div className="pw-row">
                  <label htmlFor="newPwd">סיסמה חדשה</label>
                  <div className="pw-input-wrap">
                    <input
                      id="newPwd"
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      tabIndex={2}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pw-eye"
                      onClick={()=>setShowNew(v=>!v)}
                      aria-label={showNew ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      tabIndex={-1}
                    >
                      {showNew ? 'הסתר' : 'הצג'}
                    </button>
                  </div>
                </div>

                <div className="pw-row">
                  <label htmlFor="confirmPwd">אשר סיסמה חדשה</label>
                  <div className="pw-input-wrap">
                    <input
                      id="confirmPwd"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      tabIndex={3}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pw-eye"
                      onClick={()=>setShowConfirm(v=>!v)}
                      aria-label={showConfirm ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      tabIndex={-1}
                    >
                      {showConfirm ? 'הסתר' : 'הצג'}
                    </button>
                  </div>
                </div>

                {pwdError && <div className="error" role="alert">{pwdError}</div>}

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={pwdSaving}
                    tabIndex={4}
                  >
                    {pwdSaving ? 'שומר...' : 'שנה סיסמה'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => { if (!pwdSaving) setPwModalOpen(false); }}
                    tabIndex={5}
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
