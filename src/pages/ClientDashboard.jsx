import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../lib/imageUtils';
import { fetchMesReservations, annulerReservation, updateProfile, uploadProfilePhoto, deleteAccount, fetchMesAvis, updateAvis, deleteAvis } from '../api/produits';

function formatDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 DT';
  return `${num.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

export default function ClientDashboard() {
  const { user, token, logout, reloadSession } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('active');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Avis du client : liste, édition en ligne et suppression
  const [avisList, setAvisList] = useState([]);
  const [avisLoading, setAvisLoading] = useState(true);
  const [avisError, setAvisError] = useState('');
  const [editingAvisId, setEditingAvisId] = useState(null);
  const [avisDraft, setAvisDraft] = useState({ note: 5, commentaire: '' });
  const [avisSaving, setAvisSaving] = useState(false);

  // Edit profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    telephone: '',
    localisation: '',
    nouveauMotDePasse: '',
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const dataUri = await compressImage(file, 800, 800, 0.85);
      const res = await uploadProfilePhoto(dataUri, token);
      const uploadedUrl = res?.imageUrl || res?.secureUrl;
      if (uploadedUrl) {
        await updateProfile({ photoUrl: uploadedUrl }, token);
        if (reloadSession) await reloadSession();
        setToast('Photo de profil mise à jour !');
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      setError(err?.message || 'Erreur lors du téléchargement de la photo.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Sync profile fields from authenticated user
  useEffect(() => {
    if (user) {
      setEditForm({
        nom: user.nom || '',
        telephone: user.telephone || '',
        localisation: user.localisation || '',
        nouveauMotDePasse: '',
      });
    }
  }, [user]);

  // Load reservations live from backend API (no static data)
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError('');

    fetchMesReservations(token)
      .then((data) => {
        setReservations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Erreur chargement réservations:', err);
        setReservations([]);
        setError(err?.message || 'Erreur lors du chargement de vos réservations depuis le serveur.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Avis rédigés par ce client (API /avis/mes-avis)
  useEffect(() => {
    if (!token) {
      setAvisList([]);
      setAvisLoading(false);
      return;
    }
    let active = true;
    setAvisLoading(true);
    setAvisError('');
    fetchMesAvis(token)
      .then((data) => {
        if (active) setAvisList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!active) return;
        setAvisList([]);
        setAvisError(err?.message || 'Erreur lors du chargement de vos avis.');
      })
      .finally(() => {
        if (active) setAvisLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const startEditAvis = (avis) => {
    setEditingAvisId(avis.id);
    setAvisDraft({ note: Number(avis.note) || 5, commentaire: avis.commentaire || '' });
    setAvisError('');
  };

  const cancelEditAvis = () => {
    setEditingAvisId(null);
    setAvisDraft({ note: 5, commentaire: '' });
  };

  const handleSaveAvis = async (id) => {
    if (!avisDraft.commentaire.trim()) {
      setAvisError('Le commentaire ne peut pas être vide.');
      return;
    }
    setAvisSaving(true);
    setAvisError('');
    try {
      const updated = await updateAvis(
        id,
        { note: avisDraft.note, commentaire: avisDraft.commentaire.trim() },
        token,
      );
      setAvisList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...(updated || {}), ...avisDraft } : a)),
      );
      setEditingAvisId(null);
      setToast('Votre avis a été mis à jour.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setAvisError(err?.message || "Impossible de modifier l'avis.");
    } finally {
      setAvisSaving(false);
    }
  };

  const handleDeleteAvis = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet avis ? Cette action est définitive.')) return;
    setAvisError('');
    try {
      await deleteAvis(id, token);
      setAvisList((prev) => prev.filter((a) => a.id !== id));
      if (editingAvisId === id) cancelEditAvis();
      setToast('Votre avis a été supprimé.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setAvisError(err?.message || "Impossible de supprimer l'avis.");
    }
  };

  const handleCancelBooking = async (resId) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
    try {
      if (token) {
        await annulerReservation(resId, token);
      }
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, statut: 'ANNULEE' } : r))
      );
      setToast('Votre réservation a bien été annulée.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError(err?.message || "Impossible d'annuler la réservation.");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        nom: editForm.nom.trim(),
        telephone: editForm.telephone.trim(),
        localisation: editForm.localisation.trim(),
      };
      if (editForm.nouveauMotDePasse.trim()) {
        payload.motDePasse = editForm.nouveauMotDePasse.trim();
      }
      if (token) {
        await updateProfile(payload, token);
        if (reloadSession) await reloadSession();
      }
      setToast('Profil mis à jour avec succès sur le serveur !');
      setEditOpen(false);
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'ATTENTION IRREVERSIBLE :\nLa suppression de votre compte supprimera définitivement votre profil, vos réservations et vos avis clients.\n\nPour confirmer, tapez "SUPPRIMER" ci-dessous :'
    );
    if (confirmation !== 'SUPPRIMER') return;

    try {
      if (token) await deleteAccount(token);
      await logout();
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Erreur lors de la suppression du compte.');
    }
  };

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE'),
    [reservations]
  );

  const pastReservations = useMemo(
    () => reservations.filter((r) => r.statut === 'RECUPEREE' || r.statut === 'ANNULEE' || r.statut === 'REFUSEE'),
    [reservations]
  );

  // Real Impact Counters calculated strictly from database reservations
  const totalBasketsSaved = useMemo(() => {
    return reservations
      .filter((r) => r.statut !== 'ANNULEE' && r.statut !== 'REFUSEE')
      .reduce((sum, r) => sum + (Number(r.quantite) || 1), 0);
  }, [reservations]);

  const totalMoneySaved = useMemo(() => {
    return reservations
      .filter((r) => r.statut !== 'ANNULEE' && r.statut !== 'REFUSEE')
      .reduce((sum, r) => sum + ((Number(r.produitPrix) || 0) * (Number(r.quantite) || 1)), 0);
  }, [reservations]);

  const totalFoodPreservedKg = (totalBasketsSaved * 1.5).toFixed(1);
  const totalCo2AvoidedKg = (totalBasketsSaved * 2.1).toFixed(1);

  // Visited / favorite merchants extracted dynamically from past/current orders
  const visitedMerchants = useMemo(() => {
    const map = new Map();
    reservations.forEach((r) => {
      if (r.commercantId && !map.has(r.commercantId)) {
        map.set(r.commercantId, {
          id: r.commercantId,
          nom: r.commercantNom || `Commerçant #${r.commercantId}`,
          localisation: r.commercantLocalisation || 'Tunisie',
          ordersCount: Number(r.quantite) || 1,
        });
      } else if (r.commercantId) {
        map.get(r.commercantId).ordersCount += Number(r.quantite) || 1;
      }
    });
    return Array.from(map.values());
  }, [reservations]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8] font-sans text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-6 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* BANNIÈRE PROFIL & COMPTEURS IMPACT */}
          <div className="relative bg-white border border-[#F0E6DE] rounded-2xl shadow-xs overflow-hidden p-6 lg:p-8">
            {/* Glows d'ambiance */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Identité Client en direct */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden shadow-md p-1 bg-gradient-to-tr from-primary to-secondary">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt={user.nom} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary-soft flex items-center justify-center font-bold text-2xl text-primary uppercase">
                        {(user?.nom || 'C').charAt(0)}
                      </div>
                    )}
                  </div>
                  <label
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-primary-dark transition-colors"
                    title="Changer la photo de profil"
                  >
                    <span className="material-symbols-outlined text-[15px]">{uploadingAvatar ? 'hourglass_top' : 'photo_camera'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="sr-only" />
                  </label>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">eco</span>
                      Compte Client Anti-Gaspi
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                      {user?.statut || 'ACTIF'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight truncate">
                      {user?.nom || 'Client One More Bite'}
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-medium">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                      {user?.localisation || 'Localisation non renseignée'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">phone_iphone</span>
                      {user?.telephone || 'Numéro non renseigné'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                      {user?.email || 'Email non renseigné'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditOpen(true)}
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Modifier mon profil</span>
                </button>
                <Link
                  to="/#produits"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container hover:bg-[#b8e2a6] text-xs font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  <span>Sauver un panier</span>
                </Link>
              </div>
            </div>

            {/* Ruban d'indicateurs de sauvetage (Bento Impact direct des réservations) */}
            <div className="mt-6 pt-6 border-t border-[#F5EBE1] grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-[#F0E6DE]">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Paniers Sauvés</span>
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">shopping_basket</span>
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-primary font-sans">
                    {totalBasketsSaved}
                  </div>
                  <div className="text-[11px] text-on-surface-variant font-handwriting text-sm">
                    Du bon goût à petit prix
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-[#F0E6DE]">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Montant total</span>
                  <span className="w-7 h-7 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">savings</span>
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-secondary font-sans">
                    {formatDT(totalMoneySaved)}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Valeur des commandes</div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-[#F0E6DE]">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Nourriture Préservée</span>
                  <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">restaurant</span>
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-primary font-sans">
                    {totalFoodPreservedKg} kg
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Poids estimé sauvé</div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-[#F0E6DE]">
                <div className="flex items-center justify-between text-on-surface-variant mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">CO₂e Évités</span>
                  <span className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-secondary font-sans">
                    {totalCo2AvoidedKg} kg
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Impact environnemental</div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Toast */}
          {toast && (
            <div className="p-3 rounded-xl bg-[#EAF5E9] text-[#346330] text-xs font-bold text-center border border-[#CDE5CB]">
              {toast}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* TABS DE NAVIGATION INTÉRIEURE */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'active'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface border border-[#F0E6DE]'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">alarm_on</span>
              <span>Réservations en cours</span>
              <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center justify-center">
                {activeReservations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'history'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface border border-[#F0E6DE]'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Historique sauvetages</span>
              <span className="text-[11px] opacity-75">({pastReservations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'favorites'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface border border-[#F0E6DE]'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">favorite</span>
              <span>Mes Commerçants</span>
              <span className="text-[11px] opacity-75">({visitedMerchants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('avis')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'avis'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white hover:bg-surface-container text-on-surface border border-[#F0E6DE]'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">reviews</span>
              <span>Mes avis</span>
              <span className="text-[11px] opacity-75">({avisList.length})</span>
            </button>
          </div>

          {/* TAB 1: Réservations Actives en direct */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                  À récupérer ({activeReservations.length})
                </h2>
                <span className="text-xs text-secondary bg-secondary-container px-3 py-1 rounded-full font-bold">
                  Paiement sur place lors du retrait
                </span>
              </div>

              {loading ? (
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Chargement des réservations en direct depuis le serveur...</span>
                </div>
              ) : activeReservations.length === 0 ? (
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">shopping_bag</span>
                  <p className="text-sm font-bold text-on-surface">Aucune réservation en attente</p>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">
                    Explorez les paniers surprises disponibles chez vos commerçants tunisiens préférés !
                  </p>
                  <Link
                    to="/#produits"
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold"
                  >
                    Trouver un panier
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeReservations.map((res) => {
                    const prixTotal = (Number(res.produitPrix) || 0) * (Number(res.quantite) || 1);
                    const dateFormatted = res.dateCommande
                      ? new Date(res.dateCommande).toLocaleDateString('fr-TN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : "Aujourd'hui";

                    return (
                      <div
                        key={res.id}
                        className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">store</span>
                              {res.commercantNom || `Commerçant #${res.commercantId}`}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${res.statut === 'RECUPEREE'
                                  ? 'bg-primary/10 text-primary'
                                  : res.statut === 'CONFIRMEE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                            >
                              {res.statut === 'RECUPEREE'
                                ? 'Récupérée • Merci !'
                                : res.statut === 'CONFIRMEE'
                                  ? 'Confirmée • Prêt au retrait'
                                  : 'En attente de confirmation'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-on-surface">
                            {res.produitNom || 'Panier surprise gourmand'}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                            <span>
                              Date : <strong>{dateFormatted}</strong> (Quantité: {res.quantite || 1})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-primary text-[16px]">pin_drop</span>
                            <span className="truncate">{res.commercantLocalisation || 'Tunis, Tunisie'}</span>
                          </div>

                          {/* Order Reference Box */}
                          <div className="p-3 rounded-xl bg-surface-container-low border border-[#F0E6DE] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-outline block">
                                Réf Réservation
                              </span>
                              <span className="text-xl font-extrabold text-primary font-mono tracking-wider">
                                #{res.id}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-outline block">
                                À régler sur place
                              </span>
                              <span className="text-base font-extrabold text-primary">
                                {formatDT(prixTotal)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#F5EBE1]">
                          <button
                            onClick={() => handleCancelBooking(res.id)}
                            type="button"
                            className="text-xs font-semibold text-error hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            Annuler
                          </button>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                              res.commercantLocalisation || res.commercantNom || 'Tunis'
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">directions</span>
                            Itinéraire
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Historique direct du backend */}
          {activeTab === 'history' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-on-surface mb-4">
                Historique des commandes passées ({pastReservations.length})
              </h2>
              {pastReservations.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-3xl text-outline mb-1 block">
                    history
                  </span>
                  Vous n'avez pas encore de commandes terminées ou annulées dans votre historique.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastReservations.map((res) => {
                    const prixTotal = (Number(res.produitPrix) || 0) * (Number(res.quantite) || 1);
                    const dateFormatted = res.dateCommande
                      ? new Date(res.dateCommande).toLocaleDateString('fr-TN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                      : 'Passé';

                    const statusConfig = {
                      RECUPEREE: {
                        label: 'RÉCUPÉRÉ',
                        color: 'text-secondary bg-secondary-container/40',
                        icon: 'task_alt',
                      },
                      ANNULEE: {
                        label: 'ANNULÉE',
                        color: 'text-red-700 bg-red-100',
                        icon: 'cancel',
                      },
                      REFUSEE: {
                        label: 'REFUSÉE',
                        color: 'text-orange-700 bg-orange-100',
                        icon: 'block',
                      },
                    }[res.statut] || {
                      label: res.statut,
                      color: 'text-gray-700 bg-gray-100',
                      icon: 'info',
                    };

                    return (
                      <div
                        key={res.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-[#F0E6DE]"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-[24px] ${statusConfig.label === 'RÉCUPÉRÉ' ? 'text-secondary' : 'text-outline'
                              }`}
                          >
                            {statusConfig.icon}
                          </span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-on-surface">
                              {res.produitNom || 'Panier'} (x{res.quantite || 1})
                            </h4>
                            <p className="text-[11px] text-on-surface-variant">
                              {res.commercantNom || 'Commerçant'} • {dateFormatted} • Réf #{res.id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-primary">
                            {formatDT(prixTotal)}
                          </span>
                          <span
                            className={`block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 text-center ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Commerçants visités en direct */}
          {activeTab === 'favorites' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-xs">
              <h2 className="text-base font-bold text-on-surface mb-4">
                Mes Commerçants Partenaires ({visitedMerchants.length})
              </h2>
              {visitedMerchants.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-3xl text-outline mb-1 block">
                    store
                  </span>
                  Vous n'avez pas encore commandé chez un artisan partenaire.
                  <div className="mt-3">
                    <Link
                      to="/#produits"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white font-bold"
                    >
                      Découvrir les commerçants
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visitedMerchants.map((comm) => (
                    <div
                      key={comm.id}
                      className="bg-surface-container-low border border-[#F0E6DE] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-on-surface">{comm.nom}</h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                            {comm.ordersCount} panier(s) sauvé(s)
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                          <span>{comm.localisation}</span>
                        </p>
                      </div>
                      <Link
                        to={`/produits?commercantId=${comm.id}`}
                        className="w-full text-center py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all"
                      >
                        Voir les paniers de ce commerce
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Avis publiés par le client (modification / suppression) */}
          {activeTab === 'avis' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">reviews</span>
                  Mes avis publiés ({avisList.length})
                </h2>
                <span className="text-xs text-secondary bg-secondary-container px-3 py-1 rounded-full font-bold">
                  Modifiables et supprimables à tout moment
                </span>
              </div>

              {avisError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold text-center">
                  {avisError}
                </div>
              )}

              {avisLoading ? (
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Chargement de vos avis depuis le serveur...</span>
                </div>
              ) : avisList.length === 0 ? (
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">rate_review</span>
                  <p className="text-sm font-bold text-on-surface">Vous n'avez publié aucun avis</p>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">
                    Après un retrait, partagez votre expérience depuis la page d'un panier pour aider les autres gourmands.
                  </p>
                  <Link
                    to="/#produits"
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-primary text-white text-xs font-bold"
                  >
                    Découvrir les paniers
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {avisList.map((avis) => {
                    const isEditing = editingAvisId === avis.id;
                    const note = Number(avis.note) || 0;
                    return (
                      <div
                        key={avis.id}
                        className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                                <span className="material-symbols-outlined text-[16px]">store</span>
                                <span className="truncate">{avis.commercantNom || `Commerçant #${avis.commercantId}`}</span>
                              </div>
                              <div className="text-[11px] text-outline mt-0.5">
                                {avis.dateAvis
                                  ? new Date(avis.dateAvis).toLocaleDateString('fr-TN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                  : 'Date inconnue'}
                              </div>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setAvisDraft((d) => ({ ...d, note: n }))}
                                    className="leading-none"
                                    title={`${n} / 5`}
                                  >
                                    <span
                                      className={`material-symbols-outlined text-[20px] ${n <= avisDraft.note ? 'text-primary' : 'text-outline'}`}
                                    >
                                      {n <= avisDraft.note ? 'star' : 'star_border'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <span
                                    key={n}
                                    className={`material-symbols-outlined text-[16px] ${n <= note ? 'text-primary' : 'text-outline'}`}
                                  >
                                    {n <= note ? 'star' : 'star_border'}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>

                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={avisDraft.commentaire}
                              onChange={(e) => setAvisDraft((d) => ({ ...d, commentaire: e.target.value }))}
                              className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                              placeholder="Votre commentaire..."
                            />
                          ) : (
                            <p className="text-sm text-on-surface leading-relaxed">
                              « {avis.commentaire} »
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#F5EBE1]">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={cancelEditAvis}
                                disabled={avisSaving}
                                className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high disabled:opacity-60"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveAvis(avis.id)}
                                disabled={avisSaving}
                                className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark disabled:opacity-60"
                              >
                                {avisSaving ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditAvis(avis)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold hover:brightness-95"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAvis(avis.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-bold hover:brightness-95"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL MODIFIER PROFIL DIRECT AU SERVEUR */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">Modifier mes coordonnées</h3>
              <button
                onClick={() => setEditOpen(false)}
                type="button"
                className="text-gray-400 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Nom complet</label>
                <input
                  required
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Numéro de téléphone</label>
                <input
                  required
                  type="tel"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Ville / Quartier</label>
                <input
                  type="text"
                  placeholder="Ex: Tunis, Lafayette, Menzah..."
                  value={editForm.localisation}
                  onChange={(e) => setEditForm((f) => ({ ...f, localisation: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">
                  Nouveau mot de passe (laisser vide pour ne pas modifier)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editForm.nouveauMotDePasse}
                  onChange={(e) => setEditForm((f) => ({ ...f, nouveauMotDePasse: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dark text-white font-bold disabled:opacity-50"
                >
                  {updating ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>

            {/* Zone de danger : Suppression du compte client */}
            <div className="mt-6 pt-5 border-t border-error/20">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-red-600 text-xl shrink-0 mt-0.5">
                    warning
                  </span>
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-red-900">
                      Supprimer mon compte client
                    </h5>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Cette action effacera définitivement votre profil, vos réservations et vos avis.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="mt-2.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
