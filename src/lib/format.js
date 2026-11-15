export function formatMoney(value, currency = 'DT') {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return `${number.toFixed(2)} ${currency}`;
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value).replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDay(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
