export const ROLE = {
  CLIENT: 'CLIENT',
  COMMERCANT: 'COMMERCANT',
  ADMIN: 'ADMIN',
};

/** Roles as exposed by the segmented control on the auth page. */
export const AUTH_ROLES = [
  {
    key: 'client',
    backendRole: ROLE.CLIENT,
    label: 'Gourmet / Citoyen',
    shortLabel: 'Client',
    icon: 'restaurant',
    dashboard: '/client',
    subtitle: 'Connectez-vous pour sauver vos paniers gourmands du soir à prix doux.',
  },
  {
    key: 'commercant',
    backendRole: ROLE.COMMERCANT,
    label: 'Artisan / Commerçant',
    shortLabel: 'Commerçant',
    icon: 'storefront',
    dashboard: '/commercant',
    subtitle: 'Gérez vos paniers, votre stock et les réservations reçues.',
  },
  {
    key: 'admin',
    backendRole: ROLE.ADMIN,
    label: 'Administrateur',
    shortLabel: 'Admin',
    icon: 'admin_panel_settings',
    dashboard: '/admin',
    subtitle: 'Pilotez la plateforme, validez les partenaires et modérez les produits.',
  },
];

export const ROLE_BY_KEY = Object.fromEntries(AUTH_ROLES.map((role) => [role.key, role]));

export const ROLE_BY_BACKEND = Object.fromEntries(AUTH_ROLES.map((role) => [role.backendRole, role]));

export function dashboardPath(role) {
  const normalized = String(role || '').toUpperCase();
  return ROLE_BY_BACKEND[normalized]?.dashboard ?? '/';
}

export function roleLabel(role) {
  const normalized = String(role || '').toUpperCase();
  return ROLE_BY_BACKEND[normalized]?.shortLabel ?? 'Membre';
}

export function roleMeta(role) {
  const normalized = String(role || '').toUpperCase();
  return ROLE_BY_BACKEND[normalized] ?? null;
}
