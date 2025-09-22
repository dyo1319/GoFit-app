import { useCallback } from "react";

export default function FormField({
  name, label, type="text", value, error, onChange,
  required=false, placeholder, options=[], min, max, step
}) {
  const blockInvalidNumberInput = useCallback((e) => {
    if (["e","E","+","-"].includes(e.key)) e.preventDefault();
  }, []);

  const handle = (e) => onChange(e.target.name, e.target.value);

  return (
    <div className="newUserItem">
      <label htmlFor={name}>{label} {required && <span className="required">*</span>}</label>

      {type === "select" ? (
        <select id={name} name={name} value={value} onChange={handle} className={error ? "error" : ""} required={required}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          id={name} name={name} type={type} placeholder={placeholder} value={value} onChange={handle}
          onKeyDown={type === "number" ? blockInvalidNumberInput : undefined}
          inputMode={type === "number" ? "decimal" : undefined}
          min={min} max={max} step={step}
          className={error ? "error" : ""} required={required}
        />
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
