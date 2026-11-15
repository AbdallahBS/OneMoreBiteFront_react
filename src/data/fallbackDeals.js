export const FALLBACK_DEAL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTDpKWMLknj0mslabK_BOr-5-9kVWyRk65DWlAhUI9UvAXIiNg30RLQ8WpJxa_XBJYE-7u9ss17UJQPqTjwEFh7nY40o2u_2J3LOikuLB4a8luf1p6o-5lxMc67QxwVxN7d3ob4lQ0sS5RVID2lDfr4wcKsheCScocEsD7RBJ2StUdcwPYG1FJQOBTYu9RC5enfhCdIsodXidSFwj_vgb62fj9eHaBQ1bEsOsL2m8';

const CATEGORY_KEYWORDS = {
  bakery: [
    'pain',
    'boulanger',
    'patisserie',
    'pâtisserie',
    'croissant',
    'viennois',
    'gateau',
    'gâteau',
    'baklava',
    'makroudh',
    'douceur',
    'sucre',
    'tarte',
    'brioche',
    'chocolatine',
  ],
  meals: [
    'sandwich',
    'kafteji',
    'plat',
    'repas',
    'pizza',
    'burger',
    'tacos',
    'menu',
    'fricass',
    'casse-croûte',
    'casse croute',
    'street',
    'lasagne',
    'couscous',
    'panini',
    'salade',
  ],
  cafes: [
    'cafe',
    'café',
    'the',
    'thé',
    'boisson',
    'jus',
    'salon',
    'tartelette',
    'limonade',
  ],
};

function describeProduct(produit) {
  return [
    produit?.nom,
    produit?.description,
    produit?.commercantNom,
    produit?.commercant?.nom,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function inferDealCategory(produit) {
  const haystack = describeProduct(produit);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return 'all';
}

/**
 * Converts a produit returned by the Java API into the shape used by the
 * storefront cards. Only real data is exposed: no invented price, rating or
 * discount. Missing values stay empty so the UI can display an honest state.
 */
export function normalizeBackendDeal(produit, index) {
  const prix = Number(produit?.prix) || 0;
  const rawOriginal = Number(produit?.prixOriginal ?? produit?.prix_original);
  const prixOriginal = Number.isFinite(rawOriginal) && rawOriginal > prix ? rawOriginal : null;
  const discount = prixOriginal
    ? Math.round((1 - prix / prixOriginal) * 100)
    : null;

  const commercantNom =
    produit?.commercantNom ||
    produit?.commercant?.nom ||
    (produit?.commercantId ? `Commerçant #${produit.commercantId}` : 'Commerçant partenaire');

  const commercantLocalisation =
    produit?.commercantLocalisation ||
    produit?.commercant?.localisation ||
    null;

  const quantite = Number(produit?.quantite);
  const disponible = produit?.disponibilite ?? produit?.disponible ?? true;

  const images = Array.isArray(produit?.images) && produit.images.length > 0
    ? produit.images.filter(Boolean)
    : produit?.imageUrl || produit?.photoUrl
      ? [produit.imageUrl || produit.photoUrl]
      : [];

  return {
    id: String(produit?.id ?? `api-${index}`),
    backendId: produit?.id,
    nom: produit?.nom || 'Panier surprise gourmand',
    description:
      produit?.description || 'Un assortiment surprise préparé par nos artisans partenaires.',
    merchantName: commercantNom,
    commercantId: produit?.commercantId || null,
    commercantNom,
    commercantLocalisation,
    category: inferDealCategory(produit),
    distance: commercantLocalisation,
    rating: null,
    discount,
    quantite: Number.isFinite(quantite) ? quantite : 0,
    pickup: 'Retrait en boutique',
    prix,
    prixOriginal,
    co2: null,
    currency: 'DT',
    tag: 'Anti-Gaspi',
    imageUrl: images[0] || FALLBACK_DEAL_IMAGE,
    images,
    disponible: Boolean(disponible),
    disponibilite: Boolean(disponible),
    isBackend: true,
  };
}
