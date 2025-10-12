import FormField from "./FormField";

export default function UserFormBodyMetrics({ form, errors, onChange, onBack, onNext, disabled }) { 
  return (
    <fieldset className="section">
      <legend className="sectionTitle">פרטי גוף (אופציונלי)</legend>
      <div className="formGrid">
        <FormField name="weight" label="משקל (ק״ג)" id="user-form-weight" type="number" value={form?.weight || ""} error={errors?.weight}
                   onChange={onChange} placeholder="לדוגמה 70.5" min="1" max="300" step="0.1" disabled={disabled}/>
        <FormField name="height" label="גובה (ס״מ)" id="user-form-height" type="number" value={form?.height || ""} error={errors?.height}
                   onChange={onChange} placeholder="לדוגמה 170" min="50" max="250" disabled={disabled}/>
        <FormField name="body_fat" label="שומן גוף (%)" id="user-form-body-fat" type="number" value={form?.body_fat || ""} error={errors?.body_fat}
                   onChange={onChange} placeholder="לדוגמה 22" min="1" max="50" step="0.1" disabled={disabled}/>
        <FormField name="muscle_mass" label="מסת שריר (ק״ג)" id="user-form-muscle-mass" type="number" value={form?.muscle_mass || ""} error={errors?.muscle_mass}
                   onChange={onChange} placeholder="לדוגמה 30.8" min="1" max="100" step="0.1" disabled={disabled}/>
        <FormField name="circumference" label="היקף (ס״מ)" id="user-form-circumference" type="number" value={form?.circumference || ""} error={errors?.circumference}
                   onChange={onChange} placeholder="לדוגמה 90" min="10" max="200" disabled={disabled}/>
        <FormField name="recorded_at" label="תאריך מדידה" id="user-form-recorded-at" type="date" value={form?.recorded_at || ""} error={errors?.recorded_at}
                   onChange={onChange} disabled={disabled}/>
      </div>
      <div className="actions" style={{marginTop:10}}>
        <button type="button" className="secondary" onClick={onBack} disabled={disabled}>חזרה</button>
        <button type="button" className="primary" onClick={onNext} disabled={disabled}>הבא</button>
      </div>
    </fieldset>
  );
}