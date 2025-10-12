import FormField from "./FormField";
import { toSelectOptions, ROLES, GENDERS } from "../../utils/enums";
import PermissionsChecklist from "../permissions/PermissionsChecklist";

const ACCESS_PROFILES = [
  { value: "default", label: "ברירת מחדל" },
  { value: "readonly", label: "קריאה בלבד" },
  { value: "custom", label: "מותאם אישית" }
];

export default function UserFormPersonal({ 
  form, 
  errors, 
  onChange, 
  onNext, 
  disabled,
  duplicateCheckLoading = false 
}) {
  const isStaff = form.role === "trainer" || form.role === "admin";

  return (
    <fieldset className="section" disabled={disabled}>
      <legend className="sectionTitle">פרטים אישיים</legend>
      <div className="formGrid">
        <FormField
          label="שם משתמש"
          name="username"
          id="user-form-username"
          value={form?.username || ""} 
          onChange={onChange}
          error={errors?.username}
          required
          disabled={disabled}
          placeholder="יוסי כהן"
          autoComplete="name"
        />

        <FormField
          label="טלפון"
          name="phone"
          id="user-form-phone"
          value={form?.phone || ""} 
          onChange={onChange}
          error={errors?.phone}
          required
          disabled={disabled}
          placeholder="05X-XXXXXXX"
          autoComplete="tel"
          loading={duplicateCheckLoading}
        />

        <FormField
          label="סיסמה"
          name="password"
          id="user-form-password"
          type="password"
          value={form?.password || ""} 
          onChange={onChange}
          error={errors?.password}
          required
          disabled={disabled}
          placeholder="לפחות 4 תווים"
          autoComplete="new-password"
        />

        <FormField
          label="תאריך לידה"
          name="birth_date"
          id="user-form-birth-date"
          type="date"
          value={form?.birth_date || ""} 
          onChange={onChange}
          error={errors?.birth_date}
          disabled={disabled}
          autoComplete="bday"
        />

        <FormField
          label="תפקיד"
          name="role"
          id="user-form-role"
          type="select"
          options={toSelectOptions(ROLES)}
          value={form?.role || "trainee"} 
          onChange={onChange}
          error={errors?.role}
          disabled={disabled}
        />

        <FormField
          label="מגדר"
          name="gender"
          id="user-form-gender"
          type="select"
          options={toSelectOptions(GENDERS)}
          value={form?.gender || "male"} 
          onChange={onChange}
          error={errors?.gender}
          disabled={disabled}
        />

        {isStaff && (
          <FormField
            label="פרופיל גישה"
            name="access_profile"
            id="user-form-access-profile"
            type="select"
            options={ACCESS_PROFILES}
            value={form?.access_profile || "default"} 
            onChange={onChange}
            error={errors?.access_profile}
            disabled={disabled}
          />
        )}

        {isStaff && form.access_profile === "custom" && (
          <div className="newUserItem" style={{ gridColumn: "1 / -1" }}>
            <label>הרשאות מותאמות אישית</label>
            <div style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: "8px", 
              padding: "12px", 
              maxHeight: "200px", 
              overflowY: "auto",
              backgroundColor: "#fafafa"
            }}>
              <PermissionsChecklist
                selected={form.permissions_json || []}
                onChange={(permissions) => onChange("permissions_json", permissions)}
                disabled={disabled}
                compact={true}
              />
            </div>
            {errors?.permissions_json && (
              <span className="error-message">{errors.permissions_json}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="actions" style={{marginTop: 20}}>
        <button 
          type="button" 
          className="primary" 
          onClick={onNext}
          disabled={disabled}
        >
          הבא
        </button>
      </div>
    </fieldset>
  );
}