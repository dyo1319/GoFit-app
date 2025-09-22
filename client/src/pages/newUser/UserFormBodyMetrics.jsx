import FormField from "./FormField";

export default function UserFormBodyMetrics({ data, errors, onChange, onBack, onNext }) {
  return (
    <fieldset className="section">
      <legend className="sectionTitle">פרטי גוף (אופציונלי)</legend>
      <div className="formGrid">
        <FormField name="weight" label="משקל (ק״ג)" type="number" value={data.weight} error={errors.weight}
                   onChange={onChange} placeholder="לדוגמה 70.5" min="1" max="300" step="0.1"/>
        <FormField name="height" label="גובה (ס״מ)" type="number" value={data.height} error={errors.height}
                   onChange={onChange} placeholder="לדוגמה 170" min="50" max="250"/>
        <FormField name="body_fat" label="שומן גוף (%)" type="number" value={data.body_fat} error={errors.body_fat}
                   onChange={onChange} placeholder="לדוגמה 22" min="1" max="50" step="0.1"/>
        <FormField name="muscle_mass" label="מסת שריר (ק״ג)" type="number" value={data.muscle_mass} error={errors.muscle_mass}
                   onChange={onChange} placeholder="לדוגמה 30.8" min="1" max="100" step="0.1"/>
        <FormField name="circumference" label="היקף (ס״מ)" type="number" value={data.circumference} error={errors.circumference}
                   onChange={onChange} placeholder="לדוגמה 90" min="10" max="200"/>
        <FormField name="recorded_at" label="תאריך מדידה" type="date" value={data.recorded_at} error={errors.recorded_at}
                   onChange={onChange}/>
      </div>
      <div className="actions" style={{marginTop:10}}>
        <button type="button" className="primary" onClick={onBack}>חזרה</button>
        <button type="button" className="primary" onClick={onNext}>הבא</button>
      </div>
    </fieldset>
  );
}
