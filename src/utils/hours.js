const dayNames = {
  fr: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  es: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
};

const dayLabels = {
  fr: {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  },
  en: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
  es: {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  },
};

// Parse hours data - handles both "10:00-19:00" string and {open, close} object
function parseHoursData(dayData) {
  if (!dayData) return null;

  // Check for closed (case insensitive)
  if (typeof dayData === 'string') {
    const lower = dayData.toLowerCase();
    if (lower === 'closed' || lower === 'fermé') return null;
  }

  // String format: "10:00-19:00"
  if (typeof dayData === 'string' && dayData.includes('-')) {
    const [open, close] = dayData.split('-').map(s => s.trim());
    return { open, close };
  }

  // Object format: {open: "10:00", close: "19:00"}
  if (typeof dayData === 'object' && dayData.open && dayData.close) {
    return { open: dayData.open, close: dayData.close };
  }

  return null;
}

export function getCurrentDay() {
  const dayIndex = new Date().getDay();
  return dayNames.fr[dayIndex];
}

export function isOpenNow(hours) {
  if (!hours) return null;

  const currentDay = getCurrentDay();
  const todayHours = parseHoursData(hours[currentDay]);

  if (!todayHours) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime < closeTime;
}

export function getTodayHours(hours, language = 'fr') {
  if (!hours) return null;

  const currentDay = getCurrentDay();
  const todayHours = parseHoursData(hours[currentDay]);

  if (!todayHours) {
    return language === 'fr' ? 'Fermé' : language === 'es' ? 'Cerrado' : 'Closed';
  }

  return `${todayHours.open} - ${todayHours.close}`;
}

export function getClosingInfo(hours, language = 'fr') {
  if (!hours) return null;

  const currentDay = getCurrentDay();
  const todayHours = parseHoursData(hours[currentDay]);

  if (!todayHours) return null;

  const isOpen = isOpenNow(hours);
  if (!isOpen) return null;

  const labels = {
    fr: `Ferme à ${todayHours.close}`,
    en: `Closes at ${todayHours.close}`,
    es: `Cierra a las ${todayHours.close}`,
  };

  return labels[language] || labels.fr;
}

export function getDayLabel(day, language = 'fr') {
  return dayLabels[language]?.[day] || dayLabels.fr[day];
}

export function formatHoursForDay(dayHours, language = 'fr') {
  const parsed = parseHoursData(dayHours);
  if (!parsed) {
    return language === 'fr' ? 'Fermé' : language === 'es' ? 'Cerrado' : 'Closed';
  }
  return `${parsed.open} - ${parsed.close}`;
}

export function getAllDaysOrdered() {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
}
