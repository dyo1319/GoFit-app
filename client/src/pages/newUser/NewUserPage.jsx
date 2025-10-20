import { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import NewUserForm from "./NewUserForm";
import "./newUser.css";
import { useAuth } from "../../context/AuthContext";

import { validateUserForm, validateField } from "../../utils/validators";
import { initialUserForm } from "../../utils/formDefaults";
import { makeFieldChange } from "../../utils/formHelpers";
import { formatUserFormData } from "../../utils/formFormatters";
import { createUser } from "./userApiService";
import { usePhoneDuplicate } from "./usePhoneDuplicate";

function StepsNav({ step }) {
  const steps = ["פרטים אישיים", "מדדים גופניים", "מנוי"];
  return (
    <div className="stepsNav" role="tablist" aria-label="שלבי טופס">
      {steps.map((label, i) => {
        const index = i + 1;
        const state = step === index ? "is-active" : step > index ? "is-done" : "";
        return (
          <div
            key={label}
            role="tab"
            aria-selected={step === index}
            className={`stepsNav__item ${state}`}
          >
            <span className="stepsNav__index">{index}</span>
            <span className="stepsNav__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const fieldToStep = {
  username: 1,
  phone: 1,
  password: 1,
  birth_date: 1,
  role: 1,
  gender: 1,
  access_profile: 1,
  permissions_json: 1,
  weight: 2,
  height: 2,
  body_fat: 2,
  muscle_mass: 2,
  circumference: 2,
  recorded_at: 2,
  start_date: 3,
  end_date: 3,
  payment_status: 3
};

export default function NewUserPage() {
  const { hasPermission, authLoading } = useAuth();
  const [form, setForm] = useState(initialUserForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({
    submit: false,
    duplicateCheck: false
  });
  const [step, setStep] = useState(1);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

  useEffect(() => {
    if (!authLoading && !hasPermission('create_users')) {
      navigate('/unauthorized');
    }
  }, [hasPermission, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  if (!hasPermission('create_users')) {
    return null;
  }

  const handlePhoneDup = useCallback((isDup) => {
    setLoading(prev => ({ ...prev, duplicateCheck: false }));
    setErrors((prev) => {
      const msg = isDup ? "מספר טלפון כבר קיים במערכת" : null;
      if (prev.phone === msg) return prev;
      return { ...prev, phone: msg };
    });
  }, []);

  const handlePhoneDupStart = useCallback(() => {
    setLoading(prev => ({ ...prev, duplicateCheck: true }));
  }, []);

  usePhoneDuplicate(API_BASE, form.phone, handlePhoneDup, handlePhoneDupStart);

  const onChange = makeFieldChange(setForm, setErrors);

  const validateStep = (currentStep) => {
    const stepFields = {
      1: ['username', 'phone', 'password', 'birth_date', 'role', 'gender', 'access_profile', 'permissions_json'],
      2: ['weight', 'height', 'body_fat', 'muscle_mass', 'circumference', 'recorded_at'],
      3: ['start_date', 'end_date', 'payment_status']
    };
    
    const stepErrors = {};
    const fieldsToValidate = stepFields[currentStep] || [];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, form[field], form);
      if (error) {
        stepErrors[field] = error;
      }
    });
    
    if (currentStep === 1 && form.access_profile === 'custom') {
      if (!form.permissions_json || form.permissions_json.length === 0) {
        stepErrors.permissions_json = "נדרש לבחור הרשאות עבור פרופיל מותאם אישית";
      }
    }
    
    if (currentStep === 3) {
      if (form.start_date && form.end_date) {
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (start > end) {
          stepErrors.end_date = "תאריך סיום חייב להיות אחרי תאריך התחלה";
        }
      }
    }
    return stepErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    
    if (step > 1) {
      const previousErrors = validateStep(step - 1);
      if (Object.keys(previousErrors).length > 0) {
        setStep(step - 1);
        setErrors(previousErrors);
        
        setTimeout(() => {
          const firstError = Object.keys(previousErrors)[0];
          const element = document.getElementById(firstError);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }, 100);
        return;
      }
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      
      setTimeout(() => {
        const firstError = Object.keys(stepErrors)[0];
        const element = document.getElementById(firstError);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }, 100);
      return;
    }
    
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const onSubmit = async () => {
    let allErrors = {};
    
    const step1Errors = validateStep(1);
    if (Object.keys(step1Errors).length > 0) {
      allErrors = { ...allErrors, ...step1Errors };
    }
    
    const step2Errors = validateStep(2);
    if (Object.keys(step2Errors).length > 0) {
      allErrors = { ...allErrors, ...step2Errors };
    }
    
    const step3Errors = validateStep(3);
    if (Object.keys(step3Errors).length > 0) {
      allErrors = { ...allErrors, ...step3Errors };
    }
    
    const fullValidationErrors = validateUserForm(form);
    if (errors.phone) fullValidationErrors.phone = errors.phone;
    
    allErrors = { ...allErrors, ...fullValidationErrors };
    
    setErrors(allErrors);
    if (Object.keys(allErrors).length) {
      const firstError = Object.keys(allErrors)[0];
      const errorStep = fieldToStep[firstError] || 1;
      
      if (errorStep !== step) {
        setStep(errorStep);
        setTimeout(() => {
          const element = document.getElementById(firstError);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }, 100);
      } else {
        const element = document.getElementById(firstError);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const payload = formatUserFormData(form);
      const { ok, status, json } = await createUser(API_BASE, payload);

      if (!ok) {
        setErrors((e) => ({
          ...e,
          submit: json?.message || `שגיאה ביצירת משתמש (${status})`,
        }));
        
        setTimeout(() => {
          const errorElement = document.querySelector('.submit-error');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        return;
      }
      
      navigate("/users", { 
        replace: true,
        state: { message: "משתמש נוצר בהצלחה!" }
      });
    } catch (err) {
      setErrors((e) => ({ 
        ...e, 
        submit: err?.message || "שגיאה לא ידועה" 
      }));
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const isStepDisabled = loading.submit || loading.duplicateCheck;

  return (
    <div className="newUser" dir="rtl">
      <div className="pageHeader">
        <h1 className="pageTitle">הוספת משתמש</h1>
        <Link to="/users" className="secondary-link">
          <button type="button" className="primary" disabled={loading.submit}>
            רשימת משתמשים
          </button>
        </Link>
      </div>

      <StepsNav step={step} />

      <NewUserForm
        form={form}
        errors={errors}
        loading={loading}
        step={step}
        onChange={onChange}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={onSubmit}
        disabled={isStepDisabled}
      />

      {errors.submit && (
        <div className="error-message submit-error">
          {errors.submit}
        </div>
      )}

      {loading.submit && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>יוצר משתמש...</p>
        </div>
      )}
    </div>
  );
}