import { useCallback } from "react";

export default function FormField({
  name, label, type="text", value, error, onChange,
  required=false, placeholder, options=[], min, max, step,
  disabled=false, autoComplete="on", loading=false, title, id
}) {
  const blockInvalidNumberInput = useCallback((e) => {
    if (["e","E","+","-"].includes(e.key)) e.preventDefault();
  }, []);

  const handle = (e) => onChange(e.target.name, e.target.value);

  const inputClass = `form-input ${error ? "error" : ""} ${disabled ? "disabled" : ""}`;

  const fieldId = id || name;

  return (
    <div className="newUserItem">
      <label htmlFor={fieldId}>
        {label} {required && <span className="required">*</span>}
        {loading && <span className="loading-indicator"> 🔄</span>}
      </label>

      {type === "select" ? (
        <select 
          id={fieldId} 
          name={name} 
          value={value} 
          onChange={handle} 
          className={inputClass}
          required={required}
          disabled={disabled}
          title={title}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={fieldId}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handle}
          className={inputClass}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          rows={4}
          title={title}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handle}
          onKeyDown={type === "number" ? blockInvalidNumberInput : undefined}
          inputMode={type === "number" ? "decimal" : undefined}
          min={min}
          max={max}
          step={step}
          className={inputClass}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          title={title}
        />
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}