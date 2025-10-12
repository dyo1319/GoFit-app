
export function formatUserFormData(form) {
  const payload = {
    username: form.username?.trim() || "",
    phone: form.phone?.replace(/\D/g, "") || "",
    password: form.password || "",
    birth_date: form.birth_date || "",
    role: form.role || "trainee",
    gender: form.gender || "male",
    access_profile: form.access_profile || "default",
  };

  if (form.access_profile === "custom" && form.permissions_json) {
    payload.permissions_json = form.permissions_json;
  }

  if (form.weight) payload.weight = Number(form.weight);
  if (form.height) payload.height = Number(form.height);
  if (form.body_fat) payload.body_fat = Number(form.body_fat);
  if (form.muscle_mass) payload.muscle_mass = Number(form.muscle_mass);
  if (form.circumference) payload.circumference = Number(form.circumference);
  if (form.recorded_at) payload.recorded_at = form.recorded_at;

  if (form.start_date) payload.start_date = form.start_date;
  if (form.end_date) payload.end_date = form.end_date;
  if (form.payment_status) payload.payment_status = form.payment_status;

  return payload;
}


// import { normalizePhone, toISOOrNull } from "./validators";

// export function formatUserFormData(form) {
//   const payload = {
//     username: form.username?.trim() || "",
//     phone: normalizePhone(form.phone) || "", // Use normalizePhone function
//     password: form.password || "",
//     birth_date: toISOOrNull(form.birth_date) || "", // Use toISOOrNull function
//     role: form.role || "trainee",
//     gender: form.gender || "male",
//     // NEW: Include permissions data
//     access_profile: form.access_profile || "default",
//   };

//   // Only include permissions_json for custom profile
//   if (form.access_profile === "custom" && form.permissions_json) {
//     payload.permissions_json = form.permissions_json;
//   }

//   // Add optional body metrics if provided - use toISOOrNull for dates
//   if (form.weight) payload.weight = Number(form.weight);
//   if (form.height) payload.height = Number(form.height);
//   if (form.body_fat) payload.body_fat = Number(form.body_fat);
//   if (form.muscle_mass) payload.muscle_mass = Number(form.muscle_mass);
//   if (form.circumference) payload.circumference = Number(form.circumference);
//   if (form.recorded_at) payload.recorded_at = toISOOrNull(form.recorded_at);

//   // Add optional subscription if provided - use toISOOrNull for dates
//   if (form.start_date) payload.start_date = toISOOrNull(form.start_date);
//   if (form.end_date) payload.end_date = toISOOrNull(form.end_date);
//   if (form.payment_status) payload.payment_status = form.payment_status;

//   return payload;
// }
