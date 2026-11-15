const PLACEHOLDER_LOCATIONS = new Set([
  '',
  'à renseigner',
  'a renseigner',
  'non renseignée',
  'non renseignee',
  'inconnue',
]);

function normalizePhone(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

/**
 * A profile is considered complete only when the mandatory onboarding fields
 * are actually filled in. Google sign-up creates accounts without a phone
 * number (and, for merchants, without a shop address), so those accounts must
 * be sent through the onboarding step before using the app.
 */
export function isProfileComplete(user) {
  if (!user) {
    return false;
  }

  const role = String(user.role || '').toUpperCase();

  if (role === 'ADMIN') {
    return true;
  }

  const hasPhone = normalizePhone(user.telephone).length >= 8;

  if (role === 'COMMERCANT') {
    const localisation = String(user.localisation || '').trim().toLowerCase();
    return hasPhone && !PLACEHOLDER_LOCATIONS.has(localisation);
  }

  if (role === 'CLIENT') {
    return hasPhone;
  }

  // Unknown roles are not blocked by the onboarding gate.
  return true;
}
