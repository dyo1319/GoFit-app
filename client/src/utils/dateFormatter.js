export const formatToHebrewDate = (dateValue, fallback = '') => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    return fallback;
  }

  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else if (typeof dateValue === 'string') {
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateValue)) {
        date = new Date(dateValue + 'T00:00:00');
      }
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
        const [day, month, year] = dateValue.split('/');
        date = new Date(year, month - 1, day);
      }
      else {
        date = new Date(dateValue);
      }
    } else {
      return fallback;
    }

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return fallback;
  }
};

export const formatToISODate = (hebrewDate) => {
  if (!hebrewDate || hebrewDate === 'null' || hebrewDate === 'undefined') {
    return null;
  }

  try {
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(hebrewDate)) {
      const [day, month, year] = hebrewDate.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const testDate = new Date(isoDate);
      if (isNaN(testDate.getTime())) {
        return null;
      }
      
      return isoDate;
    }
    
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(hebrewDate)) {
      return hebrewDate;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const formatToTime = (dateValue, fallback = '') => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    return fallback;
  }

  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return fallback;
    }

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
  } catch (error) {
    return fallback;
  }
};

export const formatToWorkoutDate = (dateValue, fallback = '') => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    return fallback;
  }

  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return fallback;
    }

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  } catch (error) {
    return fallback;
  }
};

export const formatToBodyDetailsDate = (dateValue, fallback = '') => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    return fallback;
  }

  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else if (typeof dateValue === 'string') {
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateValue)) {
        date = new Date(dateValue + 'T00:00:00');
      }
      else {
        date = new Date(dateValue);
      }
    } else {
      return fallback;
    }

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    return fallback;
  }
};

export const formatToWorkoutDateTime = (dateValue, fallback = '') => {
  if (!dateValue || dateValue === 'null' || dateValue === 'undefined') {
    return fallback;
  }

  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      return fallback;
    }

    if (isNaN(date.getTime())) {
      return fallback;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return fallback;
  }
};

export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes;
  } catch (error) {
    return null;
  }
};


