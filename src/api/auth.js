import { apiRequest } from './http';
import { ROLE } from '../lib/roles';

const LOGIN_PATH = {
  [ROLE.CLIENT]: '/auth/client/login',
  [ROLE.COMMERCANT]: '/auth/commercant/login',
  [ROLE.ADMIN]: '/auth/login',
};

/**
 * Authenticate against the role-specific endpoint of the Java API.
 * @param {'CLIENT'|'COMMERCANT'|'ADMIN'} role
 * @param {{ email: string, motDePasse: string }} credentials
 */
export function loginRequest(role, credentials) {
  const path = LOGIN_PATH[role];

  if (!path) {
    throw new Error(`Rôle inconnu : ${role}`);
  }

  return apiRequest(path, {
    method: 'POST',
    body: {
      email: credentials.email,
      motDePasse: credentials.motDePasse,
    },
  });
}

export function loginAdminRequest(credentials) {
  return apiRequest('/admin/login', {
    method: 'POST',
    body: {
      email: credentials.email,
      motDePasse: credentials.motDePasse,
    },
  });
}

export function registerClient(payload) {
  return apiRequest('/auth/client/register', {
    method: 'POST',
    body: {
      nom: payload.nom,
      email: payload.email,
      motDePasse: payload.motDePasse,
      telephone: payload.telephone,
    },
  });
}

export function registerMerchant(payload) {
  return apiRequest('/auth/commercant/register', {
    method: 'POST',
    body: {
      nom: payload.nom,
      email: payload.email,
      motDePasse: payload.motDePasse,
      telephone: payload.telephone,
      localisation: payload.localisation,
    },
  });
}

export function fetchSessionProfile(token) {
  return apiRequest('/auth/me', { token });
}

export function logoutRequest(token) {
  return apiRequest('/auth/logout', { method: 'POST', token });
}
