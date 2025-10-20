import FormField from "./FormField";
import { toSelectOptions, PAYMENT_STATUSES } from "../../utils/enums";
import { useAuth } from "../../context/AuthContext";

export default function UserFormSubscription({ form, errors, onChange, disabled, onBack, onSubmit, loading }) {
  const { hasPermission } = useAuth();
  
  const paymentOptions = toSelectOptions(
    PAYMENT_STATUSES.filter((s) => ["pending", "paid", "failed"].includes(s.value))
  );

  const canManagePaymentStatus = hasPermission('manage_payment_status');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit();
    } else {
      console.error("onSubmit is not a function:", onSubmit);
    }
  };

  return (
    <fieldset className="section">
      <legend className="sectionTitle">מנוי (אופציונלי)</legend>
      <div className="formGrid">
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