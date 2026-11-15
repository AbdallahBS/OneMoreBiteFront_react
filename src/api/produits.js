import { apiRequest } from './http';

export function fetchProduits({ recherche, commercantId, disponible } = {}, { signal } = {}) {
  const params = new URLSearchParams();

  if (recherche) {
    params.set('recherche', recherche);
  }

  if (commercantId !== undefined && commercantId !== null && commercantId !== '') {
    params.set('commercantId', String(commercantId));
  }

  if (disponible !== undefined && disponible !== null) {
    params.set('disponible', String(disponible));
  }

  const query = params.toString();

  return apiRequest(`/produits${query ? `?${query}` : ''}`, { signal });
}

export function fetchProduitById(id, { signal } = {}) {
  return apiRequest(`/produits/${id}`, { signal });
}

export function fetchPublicCommercants({ recherche } = {}, { signal } = {}) {
  const params = new URLSearchParams();
  if (recherche) params.set('recherche', recherche);
  const q = params.toString();
  return apiRequest(`/commercants${q ? `?${q}` : ''}`, { signal });
}

export function fetchPublicAvis(commercantId, { signal } = {}) {
  const q = commercantId ? `?commercantId=${commercantId}` : '';
  return apiRequest(`/avis${q}`, { signal });
}

export function createAvis(payload, token) {
  return apiRequest('/avis', {
    method: 'POST',
    token,
    body: payload,
  });
}

/** Avis rédigés par le client connecté (les siens uniquement). */
export function fetchMesAvis(token) {
  return apiRequest('/avis/mes-avis', { token });
}

/** Modification d'un avis par son auteur (client propriétaire). */
export function updateAvis(id, payload, token) {
  return apiRequest(`/avis/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

/** Suppression d'un avis (client propriétaire ou administrateur). */
export function deleteAvis(id, token) {
  return apiRequest(`/avis/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ─── COMMERÇANT PRODUITS ───
export function fetchMesProduits(token) {
  return apiRequest('/produits/mes-produits', { token });
}

export function createProduit(payload, token) {
  return apiRequest('/produits', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateProduit(id, payload, token) {
  return apiRequest(`/produits/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteProduit(id, token) {
  return apiRequest(`/produits/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function changeDisponibilite(id, disponible, token) {
  return apiRequest(`/produits/${id}/disponibilite`, {
    method: 'PUT',
    token,
    body: { disponibilite: Boolean(disponible) },
  });
}

export function changeStock(id, quantite, token) {
  return apiRequest(`/produits/${id}/stock`, {
    method: 'PUT',
    token,
    body: { quantite: Number(quantite) },
  });
}

// ─── RÉSERVATIONS ───
export function createReservation(produitId, quantite, token) {
  return apiRequest('/reservations', {
    method: 'POST',
    token,
    body: { produitId, quantite },
  });
}

export function fetchMesReservations(token) {
  return apiRequest('/reservations/mes-reservations', { token });
}

export function annulerReservation(id, token) {
  return apiRequest(`/reservations/${id}/annuler`, {
    method: 'PUT',
    token,
  });
}

export function fetchReservationsRecues(token) {
  return apiRequest('/reservations/recues', { token });
}

export function confirmerReservation(id, token) {
  return apiRequest(`/reservations/${id}/confirmer`, {
    method: 'PUT',
    token,
  });
}

export function refuserReservation(id, token) {
  return apiRequest(`/reservations/${id}/refuser`, {
    method: 'PUT',
    token,
  });
}

/**
 * Enregistre le retrait du panier par le client (statut RECUPEREE).
 * C'est cette action qui valide l'encaissement en espèces et alimente les revenus.
 */
export function recupererReservation(id, token) {
  return apiRequest(`/reservations/${id}/recuperer`, {
    method: 'PUT',
    token,
  });
}

export function fetchCommercantAvis(id, token) {
  return apiRequest(`/commercants/${id}/avis`, { token });
}

// ─── PROFIL ───
export function updateProfile(payload, token) {
  return apiRequest('/auth/me', {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteAccount(token) {
  return apiRequest('/auth/me', {
    method: 'DELETE',
    token,
  });
}

// ─── IMAGE UPLOAD ───
export function uploadProductImage(base64DataUri, token) {
  return apiRequest('/produits/images', {
    method: 'POST',
    token,
    body: { image: base64DataUri },
  });
}

export function uploadProfilePhoto(base64DataUri, token) {
  return apiRequest('/produits/images', {
    method: 'POST',
    token,
    body: { image: base64DataUri, folder: 'onemorebite/avatars' },
  });
}

export function deleteProductImage(publicId, token) {
  const encoded = encodeURIComponent(publicId);
  return apiRequest(`/produits/images?publicId=${encoded}`, {
    method: 'DELETE',
    token,
  });
}

// ─── ADMIN ENDPOINTS ───
export function fetchAdminUtilisateurs(token, { role, statut } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (statut) params.set('statut', statut);
  const q = params.toString();
  return apiRequest(`/admin/utilisateurs${q ? `?${q}` : ''}`, { token });
}

export function activerUtilisateur(id, token) {
  return apiRequest(`/admin/utilisateurs/${id}/activer`, {
    method: 'PUT',
    token,
  });
}

export function desactiverUtilisateur(id, token) {
  return apiRequest(`/admin/utilisateurs/${id}/desactiver`, {
    method: 'PUT',
    token,
  });
}

export function fetchCommercantsEnAttente(token) {
  return apiRequest('/admin/commercants?statut=EN_ATTENTE', { token });
}

export function fetchAdminCommercants(token, statut) {
  const q = statut ? `?statut=${statut}` : '';
  return apiRequest(`/admin/commercants${q}`, { token });
}

export function validerCommercant(id, token) {
  return apiRequest(`/admin/commercants/${id}/accepter`, { method: 'PUT', token });
}

export function rejeterCommercant(id, token) {
  return apiRequest(`/admin/commercants/${id}/rejeter`, { method: 'PUT', token });
}

export function fetchProduitStatistiques(token) {
  return apiRequest('/admin/produits/statistiques', { token });
}

export function fetchAdminReservations(token, { statut, clientId, commercantId } = {}) {
  const params = new URLSearchParams();
  if (statut) params.set('statut', statut);
  if (clientId) params.set('clientId', clientId);
  if (commercantId) params.set('commercantId', commercantId);
  const q = params.toString();
  return apiRequest(`/admin/reservations${q ? `?${q}` : ''}`, { token });
}

export function fetchAdminProduits(token, { commercantId, disponible, recherche } = {}) {
  const params = new URLSearchParams();
  if (commercantId) params.set('commercantId', commercantId);
  if (disponible !== undefined) params.set('disponible', disponible);
  if (recherche) params.set('recherche', recherche);
  const q = params.toString();
  return apiRequest(`/admin/produits${q ? `?${q}` : ''}`, { token });
}

export function updateAdminProduit(id, payload, token) {
  return apiRequest(`/admin/produits/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteAdminProduit(id, token) {
  return apiRequest(`/admin/produits/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function changeAdminProduitDisponibilite(id, disponible, token) {
  return apiRequest(`/admin/produits/${id}/disponibilite`, {
    method: 'PUT',
    token,
    body: { disponibilite: Boolean(disponible) },
  });
}

export function changeAdminProduitStock(id, quantite, token) {
  return apiRequest(`/admin/produits/${id}/stock`, {
    method: 'PUT',
    token,
    body: { quantite: Number(quantite) },
  });
}
