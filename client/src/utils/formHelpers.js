export const makeFieldChange = (setForm, setErrors) => (name, value) => {
  setForm((f) => ({ ...f, [name]: value }));
  setErrors((e) => (e?.[name] ? { ...e, [name]: null } : e));
};
