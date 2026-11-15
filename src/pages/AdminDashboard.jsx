import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../lib/imageUtils';
import {
  fetchProduitStatistiques,
  fetchAdminUtilisateurs,
  activerUtilisateur,
  desactiverUtilisateur,
  fetchAdminCommercants,
  validerCommercant,
  rejeterCommercant,
  fetchAdminReservations,
  fetchAdminProduits,
  fetchPublicAvis,
  deleteAvis,
  updateAdminProduit,
  deleteAdminProduit,
  changeAdminProduitDisponibilite,
  changeAdminProduitStock,
  updateProfile,
  uploadProfilePhoto,
} from '../api/produits';

function formatDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 DT';
  return `${num.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

// The backend exposes `disponibilite`, while parts of the UI still rely on
// `disponible`. Keep both in sync so availability is never lost.
function normalizeProduct(product) {
  const disponible = product?.disponibilite ?? product?.disponible ?? true;
  return { ...product, disponible, disponibilite: disponible };
}

export default function AdminDashboard() {
  const { user, token, logout, reloadSession } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [commercants, setCommercants] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [produits, setProduits] = useState([]);
  const [avisList, setAvisList] = useState([]);
  const [avisSearch, setAvisSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Product edit modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    prix: '',
    quantite: 5,
    disponible: true,
    imageUrl: '',
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Admin Profile form state
  const [adminProfileForm, setAdminProfileForm] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    nouveauMotDePasse: '',
  });
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);
  const [uploadingAdminAvatar, setUploadingAdminAvatar] = useState(false);

  // Filters
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [commercantStatutFilter, setCommercantStatutFilter] = useState('EN_ATTENTE');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      setAdminProfileForm({
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        nouveauMotDePasse: '',
      });
    }
  }, [user]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [statsRes, comRes, usersRes, resRes, prodRes, avisRes] = await Promise.allSettled([
        fetchProduitStatistiques(token),
        fetchAdminCommercants(token, commercantStatutFilter),
        fetchAdminUtilisateurs(token, { role: userRoleFilter || undefined }),
        fetchAdminReservations(token),
        fetchAdminProduits(token),
        fetchPublicAvis(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (comRes.status === 'fulfilled' && Array.isArray(comRes.value)) {
        setCommercants(comRes.value);
      }
      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setUtilisateurs(usersRes.value);
      }
      if (resRes.status === 'fulfilled' && Array.isArray(resRes.value)) {
        setReservations(resRes.value);
      }
      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProduits(prodRes.value.map(normalizeProduct));
      }
      if (avisRes.status === 'fulfilled' && Array.isArray(avisRes.value)) {
        setAvisList(avisRes.value);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, userRoleFilter, commercantStatutFilter]);

  // Actions
  const handleValiderCommercant = async (id, nom) => {
    try {
      if (token) await validerCommercant(id, token);
      setCommercants((prev) =>
        prev.map((c) => (c.id === id ? { ...c, statut: 'ACTIF' } : c))
      );
      showFeedback('success', `Le commerçant « ${nom} » a été validé avec succès !`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la validation.');
    }
  };

  const handleRejeterCommercant = async (id, nom) => {
    if (!window.confirm(`Confirmer le rejet de l'inscription pour « ${nom} » ?`)) return;
    try {
      if (token) await rejeterCommercant(id, token);
      setCommercants((prev) =>
        prev.map((c) => (c.id === id ? { ...c, statut: 'REJETE' } : c))
      );
      showFeedback('info', `La demande de « ${nom} » a été rejetée.`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du rejet.');
    }
  };

  const handleActiverUser = async (id) => {
    try {
      if (token) await activerUtilisateur(id, token);
      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === id ? { ...u, statut: 'ACTIF' } : u))
      );
      showFeedback('success', 'Compte utilisateur réactivé.');
    } catch (err) {
      showFeedback('error', err?.message || "Erreur lors de l'activation.");
    }
  };

  const handleDesactiverUser = async (id) => {
    if (!window.confirm("Désactiver l'accès de cet utilisateur ?")) return;
    try {
      if (token) await desactiverUtilisateur(id, token);
      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === id ? { ...u, statut: 'DESACTIVE' } : u))
      );
      showFeedback('info', 'Compte utilisateur désactivé.');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la désactivation.');
    }
  };

  // Product actions for Admin
  const handleToggleProductDisponibilite = async (p) => {
    const current = p.disponibilite ?? p.disponible ?? true;
    const nouvelleDispo = !current;
    try {
      if (token) await changeAdminProduitDisponibilite(p.id, nouvelleDispo, token);
      setProduits((prev) =>
        prev.map((item) =>
          item.id === p.id ? { ...item, disponible: nouvelleDispo, disponibilite: nouvelleDispo } : item
        )
      );
      showFeedback('success', `Disponibilité du produit « ${p.nom} » modifiée (${nouvelleDispo ? 'En ligne' : 'Épuisé'}).`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du changement de disponibilité.');
    }
  };

  const handleUpdateProductStock = async (p, delta) => {
    const newStock = Math.max(0, (p.quantite || 0) + delta);
    try {
      if (token) await changeAdminProduitStock(p.id, newStock, token);
      setProduits((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, quantite: newStock } : item))
      );
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la mise à jour du stock.');
    }
  };

  const handleDeleteProduct = async (id, nom) => {
    if (!window.confirm(`Confirmer la suppression définitive du panier « ${nom} » ?`)) return;
    try {
      if (token) await deleteAdminProduit(id, token);
      setProduits((prev) => prev.filter((p) => p.id !== id));
      showFeedback('info', `Le panier « ${nom} » a été supprimé.`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la suppression.');
    }
  };

  const openEditProductModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      nom: p.nom || '',
      description: p.description || '',
      prix: p.prix || '',
      quantite: p.quantite ?? 5,
      disponible: p.disponibilite ?? p.disponible ?? true,
      imageUrl: (Array.isArray(p.images) && p.images[0]) || p.imageUrl || p.photoUrl || '',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const payload = {
        nom: productForm.nom.trim(),
        description: productForm.description.trim(),
        prix: parseFloat(productForm.prix),
        quantite: parseInt(productForm.quantite, 10),
        disponibilite: Boolean(productForm.disponible),
        imageUrl: productForm.imageUrl?.trim() || null,
        images: productForm.imageUrl?.trim() ? [productForm.imageUrl.trim()] : [],
      };
      if (token) await updateAdminProduit(editingProduct.id, payload, token);
      setProduits((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? normalizeProduct({
                ...item,
                ...payload,
                disponible: payload.disponibilite,
                images: payload.images,
              })
            : item
        )
      );
      setProductModalOpen(false);
      showFeedback('success', `Le panier « ${payload.nom} » a été mis à jour.`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la modification.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Admin Account actions
  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSavingAdminProfile(true);
    try {
      const payload = {
        nom: adminProfileForm.nom.trim(),
        email: adminProfileForm.email.trim(),
        telephone: adminProfileForm.telephone.trim(),
      };
      if (adminProfileForm.nouveauMotDePasse?.trim()) {
        payload.motDePasse = adminProfileForm.nouveauMotDePasse.trim();
      }
      if (token) await updateProfile(payload, token);
      if (reloadSession) await reloadSession();
      setAdminProfileForm((f) => ({ ...f, nouveauMotDePasse: '' }));
      showFeedback('success', 'Profil administrateur mis à jour avec succès.');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  const handleAdminAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAdminAvatar(true);
    try {
      const dataUri = await compressImage(file, 800, 800, 0.85);
      const res = await uploadProfilePhoto(dataUri, token);
      const uploadedUrl = res?.imageUrl || res?.secureUrl;
      if (uploadedUrl) {
        await updateProfile({ photoUrl: uploadedUrl }, token);
        if (reloadSession) await reloadSession();
        showFeedback('success', 'Photo de profil administrateur mise à jour !');
      }
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du téléchargement de la photo.');
    } finally {
      setUploadingAdminAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteAvis = async (avis) => {
    const auteur = avis.clientNom || 'ce client';
    const cible = avis.commercantNom || 'ce commerçant';
    if (!window.confirm(`Supprimer définitivement l'avis de « ${auteur} » sur « ${cible} » ?`)) return;
    try {
      if (token) await deleteAvis(avis.id, token);
      setAvisList((prev) => prev.filter((a) => a.id !== avis.id));
      showFeedback('success', 'Avis supprimé de la plateforme.');
    } catch (err) {
      showFeedback('error', err?.message || "Erreur lors de la suppression de l'avis.");
    }
  };

  const filteredAvis = avisList.filter((a) => {
    const q = avisSearch.trim().toLowerCase();
    if (!q) return true;
    return [a.clientNom, a.commercantNom, a.commentaire]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const averageNote = avisList.length
    ? avisList.reduce((sum, a) => sum + (Number(a.note) || 0), 0) / avisList.length
    : 0;

  const pendingCommercantsCount = commercants.filter((c) => c.statut === 'EN_ATTENTE').length;

  const NAV_ITEMS = [
    { key: 'overview', label: "Vue d'ensemble & Stats", icon: 'query_stats' },
    { key: 'commercants', label: 'Validation Commerçants', icon: 'how_to_reg', badge: pendingCommercantsCount },
    { key: 'utilisateurs', label: 'Comptes Utilisateurs', icon: 'group', badge: utilisateurs.length },
    { key: 'produits', label: 'Supervision Paniers', icon: 'inventory_2' },
    { key: 'reservations', label: 'Flux Réservations', icon: 'receipt_long' },
    { key: 'avis', label: 'Modération des Avis', icon: 'reviews', badge: avisList.length },
    { key: 'profil', label: 'Sécurité & Admin', icon: 'admin_panel_settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#FBF9F6] font-sans text-on-surface antialiased">
      {/* ─── SIDEBAR NAVIGATION (NO top navbar) ─── */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64 sm:w-72'
        } shrink-0 bg-[#231F20] text-white flex flex-col justify-between transition-all duration-300 shadow-xl z-30 sticky top-0 h-screen`}
      >
        <div className="flex flex-col">
          {/* Sidebar Header / Brand */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">shield_person</span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-extrabold text-white text-base tracking-tight truncate">
                    One More Bite
                  </span>
                  <span className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider">
                    Super Administration
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              type="button"
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Réduire / Agrandir le menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined text-[20px] shrink-0">
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-red-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                A
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.nom || 'Administrateur'}
                  </span>
                  <span className="text-[10px] text-green-400 font-semibold truncate">
                    ● Connecté (Root)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">public</span>
              {!sidebarCollapsed && <span>Portail public</span>}
            </Link>
            <button
              onClick={handleLogout}
              type="button"
              className="p-2 rounded-lg text-white/70 hover:text-red-300 hover:bg-white/10"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <div className="bg-white border-b border-[#F0E6DE] px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#231F20] tracking-tight">
              {activeSection === 'overview' && "Console d'Administration & Métriques"}
              {activeSection === 'commercants' && "Validation des Commerçants Partenaires"}
              {activeSection === 'utilisateurs' && "Gestion Globale des Utilisateurs"}
              {activeSection === 'produits' && "Supervision du Catalogue & Paniers"}
              {activeSection === 'reservations' && "Historique des Réservations"}
              {activeSection === 'avis' && "Modération des Avis Clients"}
              {activeSection === 'profil' && "Paramètres de Sécurité Administrateur"}
            </h1>
            <p className="text-xs text-on-surface-variant">
              One More Bite Tunisie • Gestion centrale du réseau anti-gaspillage
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Feedback alerts */}
          {feedback.message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in ${
                feedback.type === 'error'
                  ? 'bg-error-container text-on-error-container'
                  : feedback.type === 'info'
                  ? 'bg-surface-container text-on-surface'
                  : 'bg-[#EAF5E9] text-[#346330]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {feedback.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* ─── 1. OVERVIEW & STATS ─── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Commerçants en attente
                    </span>
                    <span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[18px]">store</span>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-primary font-sans">
                    {pendingCommercantsCount}
                  </div>
                  <button
                    onClick={() => setActiveSection('commercants')}
                    className="text-[11px] font-bold text-secondary hover:underline mt-1 block"
                  >
                    Examiner les dossiers →
                  </button>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Utilisateurs Inscrits
                    </span>
                    <span className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-on-surface font-sans">
                    {utilisateurs.length}
                  </div>
                  <span className="text-[11px] text-on-surface-variant block mt-1">
                    Gourmands et commerçants actifs
                  </span>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Total Paniers Référencés
                    </span>
                    <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-secondary font-sans">
                    {stats?.totalProduits ?? produits.length}
                  </div>
                  <span className="text-[11px] text-secondary font-semibold block mt-1">
                    {stats?.produitsDisponibles ?? produits.filter((p) => p.disponible).length} disponibles en ligne
                  </span>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-outline uppercase tracking-wider">
                      Paniers Sauvés (Total)
                    </span>
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">eco</span>
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-amber-700 font-sans">
                    {reservations.length}
                  </div>
                  <span className="text-[11px] text-on-surface-variant block mt-1">
                    réservations enregistrées
                  </span>
                </div>
              </div>

              {/* Action Banner: Commerçants en attente de validation */}
              {pendingCommercantsCount > 0 && (
                <div className="p-5 rounded-2xl bg-[#FFF5E6] border border-[#FAD7A0] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="material-symbols-outlined text-amber-700 text-3xl shrink-0">
                      notification_important
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">
                        {pendingCommercantsCount} demande(s) d'adhésion commerçant en attente d'approbation !
                      </h3>
                      <p className="text-xs text-on-surface-variant">
                        Validez les coordonnées des artisans pour leur permettre de publier leurs invendus.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('commercants')}
                    type="button"
                    className="px-5 py-2 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary-dark transition-all shrink-0 shadow-xs"
                  >
                    Examiner les demandes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── 2. VALIDATION DES COMMERÇANTS ─── */}
          {activeSection === 'commercants' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Demandes d'adhésion des Commerçants
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Approuvez ou refusez les comptes commerçants selon l'article 3 de la charte partenaire.
                  </p>
                </div>
                {/* Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={commercantStatutFilter}
                    onChange={(e) => setCommercantStatutFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface border-0"
                  >
                    <option value="EN_ATTENTE">En attente de validation</option>
                    <option value="ACTIF">Partenaires validés (Actifs)</option>
                    <option value="">Tous les commerçants</option>
                  </select>
                </div>
              </div>

              {commercants.length === 0 ? (
                <p className="text-xs text-on-surface-variant py-8 text-center">
                  Aucun commerçant dans cette sélection.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Commerçant</th>
                        <th className="py-2.5">Contact</th>
                        <th className="py-2.5">Localisation</th>
                        <th className="py-2.5">Statut</th>
                        <th className="py-2.5 text-right">Décision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EBE1]">
                      {commercants.map((c) => (
                        <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 font-mono font-bold text-outline">#{c.id}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {c.photoUrl ? (
                                <img
                                  src={c.photoUrl}
                                  alt={c.nom}
                                  className="w-10 h-10 rounded-full object-cover border border-[#F0E6DE] shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-on-surface truncate">{c.nom}</div>
                                <div className="text-[11px] text-on-surface-variant truncate">{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-on-surface">{c.telephone || '-'}</div>
                          </td>
                          <td className="py-3 text-on-surface-variant font-medium">
                            {c.localisation || 'Tunis'}
                          </td>
                          <td className="py-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                c.statut === 'ACTIF'
                                  ? 'bg-green-100 text-green-800'
                                  : c.statut === 'REJETE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.statut}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            {c.statut === 'EN_ATTENTE' ? (
                              <>
                                <button
                                  onClick={() => handleValiderCommercant(c.id, c.nom)}
                                  type="button"
                                  className="px-3 py-1 rounded-full bg-secondary text-white text-xs font-bold hover:bg-[#3d5735] shadow-2xs"
                                >
                                  Valider
                                </button>
                                <button
                                  onClick={() => handleRejeterCommercant(c.id, c.nom)}
                                  type="button"
                                  className="px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold hover:bg-red-200"
                                >
                                  Refuser
                                </button>
                              </>
                            ) : c.statut === 'ACTIF' ? (
                              <button
                                onClick={() => handleRejeterCommercant(c.id, c.nom)}
                                type="button"
                                className="px-2.5 py-0.5 rounded-full border border-outline-variant text-[11px] font-semibold text-outline hover:text-error"
                              >
                                Suspendre
                              </button>
                            ) : (
                              <button
                                onClick={() => handleValiderCommercant(c.id, c.nom)}
                                type="button"
                                className="px-2.5 py-0.5 rounded-full border border-secondary text-[11px] font-semibold text-secondary hover:bg-secondary-container"
                              >
                                Réactiver
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── 3. GESTION DES UTILISATEURS ─── */}
          {activeSection === 'utilisateurs' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-on-surface">Comptes Utilisateurs Enregistrés</h3>
                  <p className="text-xs text-on-surface-variant">
                    Activation, désactivation et contrôle d'accès sur l'ensemble de la plateforme.
                  </p>
                </div>
                {/* Filters */}
                <div className="flex items-center gap-2">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface border-0"
                  >
                    <option value="">Tous les rôles</option>
                    <option value="CLIENT">Clients gourmands</option>
                    <option value="COMMERCANT">Commerçants</option>
                    <option value="ADMIN">Administrateurs</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {utilisateurs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-8 text-center">
                    Aucun utilisateur ne correspond à cette sélection.
                  </p>
                ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5">ID</th>
                      <th className="py-2.5">Utilisateur</th>
                      <th className="py-2.5">Téléphone</th>
                      <th className="py-2.5">Rôle</th>
                      <th className="py-2.5">Statut Compte</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EBE1]">
                    {utilisateurs.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 font-mono text-outline">#{u.id}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {u.photoUrl ? (
                              <img
                                src={u.photoUrl}
                                alt={u.nom}
                                className="w-9 h-9 rounded-full object-cover border border-[#F0E6DE] shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {u.nom ? u.nom.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-on-surface truncate">{u.nom}</div>
                              <div className="text-[11px] text-on-surface-variant truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-on-surface-variant font-medium">
                          {u.telephone || '-'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-primary-soft text-primary'
                                : u.role === 'COMMERCANT'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container text-on-surface'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              u.statut === 'ACTIF'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.statut || 'ACTIF'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {u.role !== 'ADMIN' && (
                            u.statut === 'DESACTIVE' ? (
                              <button
                                onClick={() => handleActiverUser(u.id)}
                                type="button"
                                className="px-3 py-1 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#3d5735]"
                              >
                                Activer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDesactiverUser(u.id)}
                                type="button"
                                className="px-3 py-1 rounded-full bg-error-container text-on-error-container font-bold text-xs"
                              >
                                Désactiver
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          )}

          {/* ─── 4. SUPERVISION DU CATALOGUE DES PANIERS ─── */}
          {activeSection === 'produits' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-on-surface">Supervision des Produits & Paniers</h3>
              <p className="text-xs text-on-surface-variant">
                Consultez tous les paniers publiés par les partenaires à travers la Tunisie.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {produits.length === 0 ? (
                  <p className="col-span-full text-xs text-on-surface-variant py-8 text-center">
                    Aucun panier n'a encore été publié par les commerçants.
                  </p>
                ) : (
                  produits.map((p) => {
                  const isAvailable = p.disponible ?? p.disponibilite ?? true;
                  const img = (Array.isArray(p.images) && p.images[0]) || p.imageUrl || p.photoUrl;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-[#F0E6DE] shadow-2xs flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative w-full h-44 bg-surface-container overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt={p.nom}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-outline bg-[#F5EBE1]/60">
                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                            <span className="text-[11px] font-semibold mt-1">Aucune photo</span>
                          </div>
                        )}
                        <span
                          className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs ${
                            isAvailable ? 'bg-green-600/90 text-white' : 'bg-black/60 text-white'
                          }`}
                        >
                          {isAvailable ? 'En ligne' : 'Épuisé'}
                        </span>

                        {/* Admin Action Buttons on Card Header */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            onClick={() => openEditProductModal(p)}
                            type="button"
                            className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-gray-700 hover:text-primary backdrop-blur-md shadow-xs transition-colors"
                            title="Modifier ce produit"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.nom)}
                            type="button"
                            className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-gray-700 hover:text-error backdrop-blur-md shadow-xs transition-colors"
                            title="Supprimer définitivement ce produit"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>

                        <span className="absolute bottom-2.5 right-2.5 font-extrabold text-white text-xs px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                          {formatDT(p.prix)}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-on-surface line-clamp-1">{p.nom}</h4>
                            <span className="text-[11px] text-primary font-bold shrink-0 truncate max-w-[45%]" title={p.commercantNom || undefined}>
                              {p.commercantNom || (p.commercantId ? `#${p.commercantId}` : 'Partenaire')}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{p.description}</p>
                        </div>

                        <div className="pt-3 border-t border-[#F5EBE1] flex items-center justify-between gap-2">
                          {/* Stock Controls */}
                          <div className="flex items-center gap-1.5 bg-surface-container rounded-full px-2 py-1">
                            <button
                              onClick={() => handleUpdateProductStock(p, -1)}
                              type="button"
                              className="w-5 h-5 rounded-full bg-white text-xs font-bold hover:bg-gray-200"
                              title="Diminuer stock"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-on-surface px-1">
                              {p.quantite} dispo
                            </span>
                            <button
                              onClick={() => handleUpdateProductStock(p, 1)}
                              type="button"
                              className="w-5 h-5 rounded-full bg-white text-xs font-bold hover:bg-gray-200"
                              title="Augmenter stock"
                            >
                              +
                            </button>
                          </div>

                          {/* Toggle Disponibilité Button */}
                          <button
                            onClick={() => handleToggleProductDisponibilite(p)}
                            type="button"
                            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                              isAvailable
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {isAvailable ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </div>
          )}

          {/* ─── 5. FLUX DES RÉSERVATIONS ─── */}
          {activeSection === 'reservations' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-on-surface">Flux des Réservations Nationales</h3>
              <p className="text-xs text-on-surface-variant">
                Historique temps réel des commandes passées entre gourmands et commerçants.
              </p>

              <div className="overflow-x-auto">
                {reservations.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-8 text-center">
                    Aucune réservation enregistrée pour le moment.
                  </p>
                ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5">ID</th>
                      <th className="py-2.5">Client</th>
                      <th className="py-2.5">Commerçant</th>
                      <th className="py-2.5">Produit</th>
                      <th className="py-2.5">Total Espèces</th>
                      <th className="py-2.5">Quantité</th>
                      <th className="py-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EBE1]">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 font-mono text-outline">#{r.id}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {r.clientPhotoUrl ? (
                              <img src={r.clientPhotoUrl} alt={r.clientNom} className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#F0E6DE]" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                                {r.clientNom ? r.clientNom.charAt(0).toUpperCase() : 'C'}
                              </div>
                            )}
                            <span className="font-bold text-on-surface">{r.clientNom || 'Client'}</span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-secondary">{r.commercantNom || '—'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {r.produitImageUrl && (
                              <img src={r.produitImageUrl} alt="" className="w-7 h-7 rounded-md object-cover border border-[#F0E6DE] shrink-0" />
                            )}
                            <span className="font-medium text-on-surface">{r.produitNom || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 font-extrabold text-primary">{formatDT(r.prixTotal)}</td>
                        <td className="py-3 font-mono font-bold text-sm text-on-surface">x{r.quantite ?? 0}</td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.statut === 'RECUPEREE'
                                ? 'bg-primary/10 text-primary'
                                : r.statut === 'CONFIRMEE'
                                  ? 'bg-green-100 text-green-800'
                                  : r.statut === 'REFUSEE' || r.statut === 'ANNULEE'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.statut === 'RECUPEREE' ? 'RETIRÉE' : r.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          )}

          {/* ─── 5 bis. MODÉRATION DES AVIS CLIENTS ─── */}
          {activeSection === 'avis' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-on-surface">Avis clients publiés</h3>
                  <p className="text-xs text-on-surface-variant">
                    {avisList.length} avis • note moyenne{' '}
                    <span className="font-bold text-primary">
                      {avisList.length > 0 ? `${averageNote.toFixed(2)} / 5` : '—'}
                    </span>
                    {' '}— l'administrateur peut retirer tout avis inapproprié.
                  </p>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">
                    search
                  </span>
                  <input
                    type="text"
                    value={avisSearch}
                    onChange={(e) => setAvisSearch(e.target.value)}
                    placeholder="Rechercher (client, commerçant, texte)..."
                    className="pl-9 pr-3 py-2 w-64 rounded-full bg-surface-container-low border-0 text-xs focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <p className="text-xs text-on-surface-variant py-8 text-center">
                    Chargement des avis depuis le serveur...
                  </p>
                ) : filteredAvis.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-8 text-center">
                    {avisList.length === 0
                      ? 'Aucun avis publié pour le moment.'
                      : 'Aucun avis ne correspond à cette recherche.'}
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Client</th>
                        <th className="py-2.5">Commerçant</th>
                        <th className="py-2.5">Note</th>
                        <th className="py-2.5">Commentaire</th>
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EBE1]">
                      {filteredAvis.map((a) => {
                        const note = Number(a.note) || 0;
                        return (
                          <tr key={a.id} className="hover:bg-surface-container-low transition-colors align-top">
                            <td className="py-3 font-mono text-outline">#{a.id}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {a.clientPhotoUrl ? (
                                  <img
                                    src={a.clientPhotoUrl}
                                    alt={a.clientNom}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#F0E6DE]"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                                    {a.clientNom ? a.clientNom.charAt(0).toUpperCase() : 'C'}
                                  </div>
                                )}
                                <span className="font-bold text-on-surface">{a.clientNom || 'Client'}</span>
                              </div>
                            </td>
                            <td className="py-3 font-semibold text-secondary">{a.commercantNom || '—'}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <span
                                    key={n}
                                    className={`material-symbols-outlined text-[15px] ${n <= note ? 'text-primary' : 'text-outline'}`}
                                  >
                                    {n <= note ? 'star' : 'star_border'}
                                  </span>
                                ))}
                                <span className="ml-1 font-bold text-on-surface">{note}/5</span>
                              </span>
                            </td>
                            <td className="py-3 max-w-xs">
                              <p className="text-on-surface leading-relaxed line-clamp-3">{a.commentaire}</p>
                            </td>
                            <td className="py-3 text-on-surface-variant whitespace-nowrap">
                              {a.dateAvis
                                ? new Date(a.dateAvis).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                                : '—'}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteAvis(a)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold hover:brightness-95"
                                title="Supprimer cet avis"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ─── 6. MON COMPTE ADMIN ─── */}
          {activeSection === 'profil' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-on-surface mb-1">
                  Paramètres du Compte Administrateur
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Gérez vos informations d'identité, votre photo de profil et votre mot de passe d'accès root.
                </p>
              </div>

              {/* Photo de profil Administrateur */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-[#F0E6DE]">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center shadow-xs">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.nom} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[32px] text-primary">shield_person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface">Photo de profil Administrateur</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Avatar affiché sur la console de super-administration.
                  </p>
                </div>
                <label className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadingAdminAvatar ? 'hourglass_top' : 'photo_camera'}
                  </span>
                  <span>{uploadingAdminAvatar ? 'Téléchargement…' : 'Changer photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdminAvatarChange}
                    disabled={uploadingAdminAvatar}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Formulaire de modification */}
              <form onSubmit={handleSaveAdminProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Nom complet de l'administrateur
                  </label>
                  <input
                    required
                    type="text"
                    value={adminProfileForm.nom}
                    onChange={(e) =>
                      setAdminProfileForm((f) => ({ ...f, nom: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Adresse email de connexion
                  </label>
                  <input
                    required
                    type="email"
                    value={adminProfileForm.email}
                    onChange={(e) =>
                      setAdminProfileForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    required
                    type="tel"
                    value={adminProfileForm.telephone}
                    onChange={(e) =>
                      setAdminProfileForm((f) => ({ ...f, telephone: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Nouveau mot de passe (laisser vide pour conserver l'actuel)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={adminProfileForm.nouveauMotDePasse}
                    onChange={(e) =>
                      setAdminProfileForm((f) => ({ ...f, nouveauMotDePasse: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={savingAdminProfile}
                    className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs transition-all"
                  >
                    {savingAdminProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>

                  <button
                    onClick={handleLogout}
                    type="button"
                    className="px-5 py-2.5 rounded-full border border-outline-variant hover:bg-error-container hover:text-on-error-container text-outline font-bold text-xs transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL ÉDITION PRODUIT PAR L'ADMINISTRATEUR ─── */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">
                Modifier le Panier #{editingProduct?.id}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                type="button"
                className="text-gray-400 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Nom du panier</label>
                <input
                  required
                  type="text"
                  value={productForm.nom}
                  onChange={(e) => setProductForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Prix anti-gaspi (DT)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={productForm.prix}
                    onChange={(e) => setProductForm((f) => ({ ...f, prix: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Quantité en stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={productForm.quantite}
                    onChange={(e) => setProductForm((f) => ({ ...f, quantite: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">URL de l'image</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminProductDispo"
                  checked={productForm.disponible}
                  onChange={(e) => setProductForm((f) => ({ ...f, disponible: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <label htmlFor="adminProductDispo" className="font-bold text-on-surface select-none">
                  Panier disponible et visible en ligne
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-all"
                >
                  {savingProduct ? 'Enregistrement…' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
