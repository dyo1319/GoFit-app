import FormField from "./FormField";

export default function UserFormSubscription({ data, errors, onChange, onBack, onSubmit, loading }) {
  return (
    <fieldset className="section">
      <legend className="sectionTitle">פרטי מנוי (אופציונלי)</legend>
      <div className="formGrid">
        <FormField name="start_date" label="תאריך התחלה" type="date" value={data.start_date} error={errors.start_date} onChange={onChange}/>
        <FormField name="end_date" label="תאריך סיום" type="date" value={data.end_date} error={errors.end_date} onChange={onChange}/>
        <FormField name="payment_status" label="סטטוס תשלום" type="select" value={data.payment_status} error={errors.payment_status} onChange={onChange}
                   options={[{value:"pending",label:"ממתין"},{value:"paid",label:"שולם"},{value:"failed",label:"נכשל"}]}/>
      </div>
      <div className="actions" style={{marginTop:10}}>
        <button type="button" className="primary" onClick={onBack}>חזרה</button>
        <button type="button" className="primary" onClick={onSubmit} disabled={loading}>{loading ? "שומר..." : "שמור"}</button>
      </div>
    </fieldset>
  );
}
