import React, { useState } from 'react';
import './SignIn.css';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const SignIn = ({ onSignInSuccess, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    phone_number: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  // ולידציה לטלפון ישראלי: 10 ספרות, מתחיל ב-05
  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return /^05\d{8}$/.test(digits);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'יש להזין מספר טלפון';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      newErrors.phone_number = 'מספר לא תקין (10 ספרות, מתחיל ב־05)';
    }

    if (!formData.password) {
      newErrors.password = 'יש להזין סיסמה';
    } else if (formData.password.length < 6) {
      newErrors.password = 'סיסמה חייבת להיות לפחות 6 תווים';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // ניקוי מקפים ורווחים – שליחה כ-10 ספרות נקיות
      const cleanPhone = formData.phone_number.replace(/\D/g, '');

      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // במידה והשרת מחזיר cookie
        body: JSON.stringify({
          phone_number: cleanPhone,
          password: formData.password,
        }),
      });

      // במקרה של 204/טקסט – נגן על עצמנו
      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok && (data?.success || data?.user)) {
        if (onSignInSuccess) {
          onSignInSuccess(data.user, data.token);
        }
      } else {
        setErrors({ submit: data?.message || 'ההתחברות נכשלה. בדוק פרטים ונסה שוב.' });
      }
    } catch (err) {
      setErrors({ submit: 'שגיאת חיבור. בדוק רשת ונסה שוב.' });
    } finally {
      setIsLoading(false);
    }
  };

  // פורמט נוח לישראל: 05X-XXX-XXXX
  const formatPhoneIL = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    // 05X
    if (digits.length <= 3) return digits;
    // 05X-XXX
    if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    // 05X-XXX-XXXX
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneIL(e.target.value);
    setFormData(prev => ({ ...prev, phone_number: formatted }));
    if (errors.phone_number) setErrors(prev => ({ ...prev, phone_number: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const canSubmit =
    validatePhoneNumber(formData.phone_number) &&
    formData.password && formData.password.length >= 6 &&
    !isLoading;

  return (
    <div className="signin-container" dir="rtl">
      <div className="signin-card">
        <div className="signin-header">
          <div className="icon-container">
            <i className="fa-solid fa-dumbbell dumbbell-icon"></i>
          </div>
          <h2 style={{ margin: 0 }}>כניסה</h2>
        </div>

        <form onSubmit={handleSubmit} className="signin-form" noValidate>
          {errors.submit && <div className="submit-error">{errors.submit}</div>}

          <div className="input-group">
            <label htmlFor="phone_number">מספר טלפון</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handlePhoneChange}
              placeholder="05X-XXX-XXXX"
              className={errors.phone_number ? 'error' : ''}
              autoComplete="tel"
              autoFocus
              inputMode="tel"
            />
            {errors.phone_number && (
              <span className="error-message">⚠️ {errors.phone_number}</span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="הקלד סיסמה"
                className={errors.password ? 'error' : ''}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">⚠️ {errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="signin-button"
            disabled={!canSubmit}
          >
            {isLoading ? 'מתחבר…' : 'התחבר'}
          </button>
        </form>

        <div className="signin-footer">
          <p><a href="#forgot-password">שכחת סיסמה?</a></p>
          <p>
            אין לך חשבון?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                textDecoration: 'underline',
                font: 'inherit'
              }}
            >
              הרשמה
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
