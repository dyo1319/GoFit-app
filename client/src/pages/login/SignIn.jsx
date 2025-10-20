import React, { useState } from 'react';
import './SignIn.css';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { isPhoneIL, normalizePhone } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const SignIn = () => {
  const [formData, setFormData] = useState({ phone_number: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'יש להזין מספר טלפון';
    } else if (!isPhoneIL(formData.phone_number)) {
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
      const cleanPhone = normalizePhone(formData.phone_number);
      const result = await signIn(cleanPhone, formData.password);
      
      if (result.success) {
        const role = result.user.role;
        let dest = '/admin';
        if (role === 'admin') dest = '/admin/permissions';
        else if (role === 'trainer') dest = '/admin/users';
        else dest = '/unauthorized';

        console.log('Sign in successful, navigating to:', dest, '(was from:', from, ')');
        navigate(dest, { replace: true });
      } else {
        setErrors({ submit: result.message || 'שגיאה בהתחברות' });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ submit: 'שגיאת חיבור. בדוק רשת ונסה שוב.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneIL = (value) => {
    const d = value.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneIL(e.target.value);
    setFormData(prev => ({ ...prev, phone_number: formatted }));
    if (errors.phone_number) setErrors(prev => ({ ...prev, phone_number: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  const canSubmit =
    isPhoneIL(formData.phone_number) &&
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

          <button type="submit" className="signin-button" disabled={!canSubmit}>
            {isLoading ? 'מתחבר…' : 'התחבר'}
          </button>
        </form>

        <div className="signin-footer">
          <p><a href="#forgot-password">שכחת סיסמה?</a></p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
