import FormField from "./FormField";
import { toSelectOptions, PAYMENT_STATUSES } from "../../utils/enums";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";

export default function UserFormSubscription({ form, errors, onChange, disabled, onBack, onSubmit, loading }) {
  const { hasPermission, authenticatedFetch } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  
  const paymentOptions = toSelectOptions(
    PAYMENT_STATUSES.filter((s) => ["pending", "paid", "failed"].includes(s.value))
  );

  const canManagePaymentStatus = hasPermission('manage_payment_status');

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await authenticatedFetch('/subscription-plans?active_only=true');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionPlans(data.data || []);
      }
    } catch (err) {
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = subscriptionPlans.find(plan => plan.id === parseInt(planId));
    if (selectedPlan) {
      onChange('plan_id', planId);
      onChange('price', selectedPlan.price);
      onChange('plan_type', selectedPlan.plan_type);
      onChange('plan_name', selectedPlan.plan_name);
    } else {
      onChange('plan_id', '');
      onChange('price', '');
      onChange('plan_type', 'monthly');
      onChange('plan_name', 'מנוי חודשי');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit();
    }
  };

  const planOptions = [
    { value: '', label: 'בחר סוג מנוי' },
    ...subscriptionPlans.map(plan => ({
      value: plan.id,
      label: `${plan.plan_name} - ${plan.price}₪ (${plan.plan_type === 'monthly' ? 'חודשי' : 
                                                      plan.plan_type === 'quarterly' ? 'רבעוני' :
                                                      plan.plan_type === 'yearly' ? 'שנתי' : 'מותאם'})`
    }))
  ];

  return (
    <fieldset className="section">
      <legend className="sectionTitle">מנוי (אופציונלי)</legend>
      <div className="formGrid">
        <FormField
          label="סוג מנוי"
          name="plan_id"
          id="user-form-plan-id"
          type="select"
          options={planOptions}
          value={form?.plan_id || ""}
          onChange={(e) => handlePlanChange(e.target.value)}
          error={errors?.plan_id}
          disabled={disabled || plansLoading}
          title={plansLoading ? "טוען סוגי מנויים..." : ""}
        />

        <FormField
          label="מחיר (₪)"
          name="price"
          id="user-form-price"
          type="number"
          value={form?.price || ""}
          onChange={onChange}
          error={errors?.price}
          disabled={disabled}
          inputProps={{ min: 0, step: 0.01 }}
        />

        <FormField
          label="תאריך התחלה"
          name="start_date"
          id="user-form-start-date"
          type="date"
          value={form?.start_date || ""}
          onChange={onChange}
          error={errors?.start_date}
          disabled={disabled}
        />

        <FormField
          label="תאריך סיום"
          name="end_date"
          id="user-form-end-date"
          type="date"
          value={form?.end_date || ""}
          onChange={onChange}
          error={errors?.end_date}
          disabled={disabled}
        />

        <FormField
          label="סטטוס תשלום"
          name="payment_status"
          id="user-form-payment-status"
          type="select"
          options={paymentOptions}
          value={form?.payment_status || "pending"}
          onChange={onChange}
          error={errors?.payment_status}
          disabled={disabled || !canManagePaymentStatus}
          title={!canManagePaymentStatus ? "אין לך הרשאות לשנות סטטוס תשלום" : ""}
        />
      </div>
      
      <div className="actions" style={{marginTop: 20}}>
        <button 
          type="button" 
          className="secondary" 
          onClick={onBack}
          disabled={disabled || loading}
        >
          חזרה
        </button>
        <button 
          type="button" 
          className="primary" 
          onClick={handleSubmit}
          disabled={disabled || loading}
        >
          {loading ? "יוצר משתמש..." : "יצירת משתמש"}
        </button>
      </div>
    </fieldset>
  );
}