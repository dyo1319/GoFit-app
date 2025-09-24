import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import NewUserForm from "./NewUserForm";
import { validateUserForm, formatFormData } from "./userFormUtils";
import { createUser } from "./userApiService";
import { usePhoneDuplicate } from "./usePhoneDuplicate";
import "./newUser.css";

const initialForm = {
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

export default function NewUserPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const handlePhoneDup = useCallback((isDup) => {
    setErrors((prev) => {
      const msg = isDup ? "מספר טלפון כבר קיים במערכת" : null;
      if (prev.phone === msg) return prev;
      return { ...prev, phone: msg };
    });
  }, []);

  usePhoneDuplicate(API_BASE, form.phone, handlePhoneDup);

  const onChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const onSubmit = async () => {
    const v = validateUserForm(form);
    if (errors.phone) v.phone = errors.phone;

    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const payload = formatFormData(form);
      const { ok, status, json } = await createUser(API_BASE, payload);

      if (!ok) {
        setErrors((e) => ({
          ...e,
          submit: json?.message || `שגיאה ביצירת משתמש (${status})`,
        }));
        return;
      }
      navigate("/users", { replace: true });
    } catch (err) {
      setErrors((e) => ({ ...e, submit: err?.message || "שגיאה לא ידועה" }));
    } finally {
      setLoading(false);
    }
  };

        return (
        <div className="newUser" dir="rtl">
            <div className="pageHeader">
            <h1 className="pageTitle">הוספת משתמש</h1>
            <Link to="/users" className="secondary-link">
                <button type="button" className="primary" disabled={loading}> רשימת משתמשים </button>
            </Link>
            </div>

            <StepsNav step={step} />

            <NewUserForm
            form={form}
            errors={errors}
            loading={loading}
            step={step}
            onChange={onChange}
            onNext={() => setStep((s) => Math.min(3, s + 1))}
            onBack={() => setStep((s) => Math.max(1, s - 1))}
            onSubmit={onSubmit}
            />

            {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
            )}
        </div>
    );
}
