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

export function getCurrentDay() {
  const dayIndex = new Date().getDay();
  return dayNames.fr[dayIndex];
}

export function isOpenNow(hours) {
  if (!hours) return null;

  const currentDay = getCurrentDay();
  const todayHours = hours[currentDay];

  // Fermé si pas d'horaires ou si null (jour fermé)
  if (!todayHours || !todayHours.open || !todayHours.close) return false;

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
  const todayHours = hours[currentDay];

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return language === 'fr' ? 'Fermé' : language === 'es' ? 'Cerrado' : 'Closed';
  }

  return `${todayHours.open} - ${todayHours.close}`;
}

export function getClosingInfo(hours, language = 'fr') {
  if (!hours) return null;

  const currentDay = getCurrentDay();
  const todayHours = hours[currentDay];

  if (!todayHours || !todayHours.open || !todayHours.close) return null;

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
  if (!dayHours || !dayHours.open || !dayHours.close) {
    return language === 'fr' ? 'Fermé' : language === 'es' ? 'Cerrado' : 'Closed';
  }
  return `${dayHours.open} - ${dayHours.close}`;
}

export function getAllDaysOrdered() {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
}
