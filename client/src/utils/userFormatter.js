import { formatToHebrewDate } from './dateFormatter';
import { ROLES, GENDERS, PAYMENT_STATUSES } from './enums';

const getLabelFromEnum = (value, enumArray) => {
  const item = enumArray.find(item => item.value === value);
  return item ? item.labelHe : value;
};

export const formatUserData = (user) => {
  if (!user) return null;

  return {
    ...user,
    birth_date: formatToHebrewDate(user.birth_date),
    role: getLabelFromEnum(user.role, ROLES),
    gender: getLabelFromEnum(user.gender, GENDERS),
    ...(user.recorded_at && { recorded_at: formatToHebrewDate(user.recorded_at) }),
    ...(user.start_date && { start_date: formatToHebrewDate(user.start_date) }),
    ...(user.end_date && { end_date: formatToHebrewDate(user.end_date) }),
    ...(user.payment_status && { 
      payment_status: getLabelFromEnum(user.payment_status, PAYMENT_STATUSES) 
    })
  };
};

export const formatUsersData = (users) => {
  if (!Array.isArray(users)) return [];
  return users.map(formatUserData);
};