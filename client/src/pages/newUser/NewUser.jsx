import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./newUser.css";

export default function NewUser() {
  const initialFormState = {
    username: "",
    phone: "",
    password: "",
    birth_date: "",              
    role: "trainee",            
    gender: "male",
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    circumference: "",
    recorded_at: "",
    start_date: "",
    end_date: "",
    payment_status: "pending",
  };

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const blockInvalidNumberInput = useCallback((e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!form.username.trim()) newErrors.username = "שם משתמש הוא שדה חובה";
    if (!form.phone.trim()) newErrors.phone = "טלפון הוא שדה חובה";
    if (!form.password) newErrors.password = "סיסמה היא שדה חובה";

    const phoneRegex = /^05\d{8}$/;
    if (form.phone && !phoneRegex.test(form.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = "מספר טלפון לא תקין (צריך להתחיל ב-05 ולהיות 10 ספרות)";
    }

    if (form.password && form.password.length < 6) {
      newErrors.password = "סיסמה חייבת להיות לפחות 6 תווים";
    }

    const dateFields = ['birth_date', 'recorded_at', 'start_date', 'end_date'];
    const isValidDate = (dateStr) => !dateStr || /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    if (!form.birth_date) newErrors.birth_date = "שדה חובה"; 
    

    dateFields.forEach(field => {
      if (!isValidDate(form[field])) {
        newErrors[field] = "תאריך חייב להיות בפורמט YYYY-MM-DD";
      }
    });

    if (form.start_date && form.end_date && form.start_date >= form.end_date) {
      newErrors.end_date = "תאריך סיום חייב להיות אחרי תאריך התחלה";
    }

    const numericFields = ['weight', 'height', 'body_fat', 'muscle_mass', 'circumference'];
    numericFields.forEach(field => {
      if (form[field] && (isNaN(form[field]) || Number(form[field]) <= 0)) {
        newErrors[field] = "ערך לא תקין";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const numOrUndef = useCallback((v) => (v === "" ? undefined : Number(v)), []);

  const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const payload = {
      username: form.username.trim(),
      phone: form.phone.trim().replace(/[^0-9]/g, ''), 
      password: form.password,
      birth_date: form.birth_date || undefined,
      role: form.role,
      gender: form.gender,

      weight: numOrUndef(form.weight),
      height: numOrUndef(form.height),
      body_fat: numOrUndef(form.body_fat),
      muscle_mass: numOrUndef(form.muscle_mass),
      circumference: numOrUndef(form.circumference),
      recorded_at: form.recorded_at || undefined,

      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      payment_status: form.payment_status || undefined,
    };

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/U/Add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // שינוי כאן - בדיקה נכונה של התשובה
      if (!res.ok || !data.success) {
        throw new Error(data?.message || `שגיאה ביצירת משתמש (${res.status})`);
      }

      setForm(initialFormState);
      setErrors({});
      
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (err) {
      console.error('Error creating user:', err);
      setErrors({ submit: err.message }); // הוספת הודעת שגיאה כללית
    } finally {
      setLoading(false);
    }
  };


  const renderField = (name, label, type = "text", options = {}) => {
    const { placeholder, required = false, min, max, step, children } = options;
    
    return (
      <div className="newUserItem">
        <label htmlFor={name}>
          {label} {required && <span className="required">*</span>}
        </label>
        {type === "select" ? (
          <select
            id={name}
            name={name}
            value={form[name]}
            onChange={onChange}
            className={errors[name] ? "error" : ""}
            required={required}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={onChange}
            onKeyDown={type === "number" ? blockInvalidNumberInput : undefined}
            inputMode={type === "number" ? "decimal" : undefined}
            min={min}
            max={max}
            step={step}
            className={errors[name] ? "error" : ""}
            required={required}
          />
        )}
        {errors[name] && <span className="error-message">{errors[name]}</span>}
      </div>
    );
  };

  return (
    <div className="newUser" dir="rtl">
      <h1 className="pageTitle">הוספת משתמש</h1>

      <form className="newUserForm" onSubmit={handleSubmit}>
        <fieldset className="section">
          <legend className="sectionTitle">פרטי משתמש</legend>
          <div className="formGrid">
            {renderField("username", "שם משתמש", "text", { 
              placeholder: "הכנס שם משתמש", 
              required: true 
            })}

            {renderField("phone", "טלפון", "tel", { 
              placeholder: "050-1234567", 
              required: true 
            })}

            {renderField("password", "סיסמה", "password", { 
              placeholder: "לפחות 6 תווים", 
              required: true 
            })}

            {renderField("birth_date", "תאריך לידה", "date",{required: true})}

            {renderField("role", "תפקיד", "select", {
              children: (
                <>
                  <option value="trainee">מתאמן/ת</option>
                  <option value="trainer">מאמן/ת</option>
                  <option value="admin">אדמין</option>
                </>
              )
            })}

            {renderField("gender", "מגדר", "select", {
              children: (
                <>
                  <option value="male">זכר</option>
                  <option value="female">נקבה</option>
                </>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="section">
          <legend className="sectionTitle">פרטי גוף (אופציונלי)</legend>
          <div className="formGrid">
            {renderField("weight", "משקל (ק״ג)", "number", { 
              placeholder: "לדוגמה 70.5", 
              min: "1", 
              max: "300", 
              step: "0.1" 
            })}

            {renderField("height", "גובה (ס״מ)", "number", { 
              placeholder: "לדוגמה 170", 
              min: "50", 
              max: "250" 
            })}

            {renderField("body_fat", "שומן גוף (%)", "number", { 
              placeholder: "לדוגמה 22", 
              min: "1", 
              max: "50", 
              step: "0.1" 
            })}

            {renderField("muscle_mass", "מסת שריר (ק״ג)", "number", { 
              placeholder: "לדוגמה 30.8", 
              min: "1", 
              max: "100", 
              step: "0.1" 
            })}

            {renderField("circumference", "היקף (ס״מ)", "number", { 
              placeholder: "לדוגמה 90", 
              min: "10", 
              max: "200" 
            })}

            {renderField("recorded_at", "תאריך מדידה", "date")}
          </div>
        </fieldset>

        <fieldset className="section">
          <legend className="sectionTitle">פרטי מנוי (אופציונלי)</legend>
          <div className="formGrid">
            {renderField("start_date", "תאריך התחלה", "date")}
            {renderField("end_date", "תאריך סיום", "date")}
            
            {renderField("payment_status", "סטטוס תשלום", "select", {
              children: (
                <>
                  <option value="pending">ממתין</option>
                  <option value="paid">שולם</option>
                  <option value="failed">נכשל</option>
                </>
              )
            })}
          </div>
        </fieldset>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
        <div className="actions">
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "שומר..." : "שמור משתמש"}
          </button>
          <Link to="/users" className="secondary-link">
            <button type="button" className="primary" disabled={loading}>
             רשימת משתמשים
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}