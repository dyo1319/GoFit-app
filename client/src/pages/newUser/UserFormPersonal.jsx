import FormField from "./FormField";

export default function UserFormPersonal({ data, errors, onChange, onNext }) {
  const canProceed = () => data.username && data.phone && data.password && data.birth_date;
  return (
    <fieldset className="section">
      <legend className="sectionTitle">פרטי משתמש</legend>
      <div className="formGrid">
        <FormField name="username" label="שם משתמש" type="text" value={data.username} error={errors.username}
                   onChange={onChange} required placeholder="הכנס שם משתמש"/>
        <FormField name="phone" label="טלפון" type="tel" value={data.phone} error={errors.phone}
                   onChange={onChange} required placeholder="050-1234567"/>
        <FormField name="password" label="סיסמה" type="password" value={data.password} error={errors.password}
                   onChange={onChange} required placeholder="לפחות 6 תווים"/>
        <FormField name="birth_date" label="תאריך לידה" type="date" value={data.birth_date} error={errors.birth_date}
                   onChange={onChange} required/>
        <FormField name="role" label="תפקיד" type="select" value={data.role} error={errors.role} onChange={onChange}
                   options={[{value:"trainee",label:"מתאמן/ת"},{value:"trainer",label:"מאמן/ת"},{value:"admin",label:"אדמין"}]}/>
        <FormField name="gender" label="מגדר" type="select" value={data.gender} error={errors.gender} onChange={onChange}
                   options={[{value:"male",label:"זכר"},{value:"female",label:"נקבה"}]}/>
      </div>
      <div className="actions" style={{marginTop:10}}>
        <button type="button" className="primary" onClick={onNext} disabled={!canProceed()}>הבא</button>
      </div>
    </fieldset>
  );
}
