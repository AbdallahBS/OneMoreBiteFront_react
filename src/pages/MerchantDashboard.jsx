import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../lib/imageUtils';
import {
  fetchMesProduits,
  createProduit,
  updateProduit,
  deleteProduit,
  changeDisponibilite,
  changeStock,
  fetchReservationsRecues,
  confirmerReservation,
  refuserReservation,
  recupererReservation,
  fetchCommercantAvis,
  updateProfile,
  deleteAccount,
  uploadProductImage,
  uploadProfilePhoto,
  deleteProductImage,
} from '../api/produits';

function formatDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 DT';
  return `${num.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

function normalizeProduct(product) {
  const disponible = product?.disponibilite ?? product?.disponible ?? true;
  return { ...product, disponible, disponibilite: disponible };
}

export default function MerchantDashboard() {
  const { user, token, logout, reloadSession } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states
  const [produits, setProduits] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [avisList, setAvisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal create/edit product state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    prix: '',
    quantite: 5,
    disponible: true,
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Multi-image upload state
  const [uploadedImages, setUploadedImages] = useState([]); // [{ url, publicId }]
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    nom: user?.nom || '',
    telephone: user?.telephone || '',
    localisation: user?.localisation || '',
    nouveauMotDePasse: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const [prodRes, resRes] = await Promise.allSettled([
        fetchMesProduits(token),
        fetchReservationsRecues(token),
      ]);

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
        setProduits(prodRes.value.map(normalizeProduct));
      } else {
        setProduits([]);
      }

      if (resRes.status === 'fulfilled' && Array.isArray(resRes.value)) {
        setReservations(resRes.value);
      } else {
        setReservations([]);
      }

      // Load avis if user id exists
      if (user?.id) {
        try {
          const avisRes = await fetchCommercantAvis(user.id, token);
          setAvisList(Array.isArray(avisRes?.avis) ? avisRes.avis : avisRes || []);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

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

  // Product actions
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      nom: '',
      description: '',
      prix: '',
      quantite: 5,
      disponible: true,
    });
    setUploadedImages([]);
    setUploadError('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      nom: prod.nom || '',
      description: prod.description || '',
      prix: prod.prix || '',
      quantite: prod.quantite ?? 1,
      disponible: prod.disponibilite ?? prod.disponible ?? true,
    });
    // Pre-populate images from existing product data
    const existing = prod.images?.length
      ? prod.images.map((url) => ({ url, publicId: null }))
      : prod.photoUrl || prod.imageUrl
      ? [{ url: prod.photoUrl || prod.imageUrl, publicId: null }]
      : [];
    setUploadedImages(existing);
    setUploadError('');
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const imageUrls = uploadedImages.map((img) => img.url);
      const payload = {
        nom: productForm.nom.trim(),
        description: productForm.description.trim(),
        prix: Number(productForm.prix),
        quantite: Number(productForm.quantite),
        disponibilite: Boolean(productForm.disponible),
        images: imageUrls.length > 0 ? imageUrls : undefined,
      };

      if (editingProduct) {
        if (token) await updateProduit(editingProduct.id, payload, token);
        setProduits((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? normalizeProduct({ ...p, ...payload, images: imageUrls })
              : p,
          )
        );
        showFeedback('success', 'Panier mis à jour avec succès !');
      } else {
        let created;
        if (token) {
          created = await createProduit(payload, token);
        }
        const newObj = created ? normalizeProduct(created) : { id: Date.now(), ...payload };
        setProduits((prev) => [newObj, ...prev]);
        showFeedback('success', 'Nouveau panier publié dans le catalogue !');
      }
      setProductModalOpen(false);
    } catch (err) {
      showFeedback('error', err?.message || "Erreur lors de l'enregistrement du produit.");
    } finally {
      setSavingProduct(false);
    }
  };

  // Handle file selection → upload each file to Cloudinary via backend
  const handleImageFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImages(true);
    setUploadError('');
    const results = [];
    for (const file of files) {
      try {
        const dataUri = await compressImage(file);
        const res = await uploadProductImage(dataUri, token);
        const uploadedUrl = res?.imageUrl || res?.secureUrl;
        if (uploadedUrl) {
          results.push({ url: uploadedUrl, publicId: res.publicId || null });
        } else {
          setUploadError("Une image n'a pas pu être téléchargée. Vérifiez la configuration Cloudinary.");
        }
      } catch (err) {
        setUploadError(err?.message || "Erreur lors du téléchargement d'une image.");
      }
    }
    setUploadedImages((prev) => [...prev, ...results]);
    setUploadingImages(false);
    // Reset input so same files can be re-selected
    e.target.value = '';
  };

  const handleRemoveImage = async (idx) => {
    const img = uploadedImages[idx];
    if (img.publicId && token) {
      try {
        await deleteProductImage(img.publicId, token);
      } catch {
        // ignore delete errors — still remove from UI
      }
    }
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleDisponibilite = async (prod) => {
    const current = prod.disponibilite ?? prod.disponible ?? true;
    const nextVal = !current;
    try {
      if (token) await changeDisponibilite(prod.id, nextVal, token);
      setProduits((prev) =>
        prev.map((p) =>
          p.id === prod.id
            ? { ...p, disponible: nextVal, disponibilite: nextVal }
            : p,
        )
      );
      showFeedback('success', `Panier marqué comme ${nextVal ? 'Disponible' : 'Indisponible'}.`);
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du changement de disponibilité.');
    }
  };

  const handleUpdateStock = async (prod, delta) => {
    const newStock = Math.max(0, (prod.quantite || 0) + delta);
    try {
      if (token) await changeStock(prod.id, newStock, token);
      setProduits((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, quantite: newStock } : p))
      );
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la mise à jour du stock.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce panier du catalogue ?')) return;
    try {
      if (token) await deleteProduit(id, token);
      setProduits((prev) => prev.filter((p) => p.id !== id));
      showFeedback('success', 'Panier supprimé avec succès.');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la suppression.');
    }
  };

  // Reservation actions
  const handleConfirmReservation = async (resId) => {
    try {
      if (token) await confirmerReservation(resId, token);
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, statut: 'CONFIRMEE' } : r))
      );
      showFeedback('success', 'Réservation validée avec succès !');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la confirmation.');
    }
  };

  const handleRefuseReservation = async (resId) => {
    if (!window.confirm('Voulez-vous vraiment refuser cette réservation ?')) return;
    try {
      if (token) await refuserReservation(resId, token);
      setReservations((prev) =>
        prev.map((r) => (r.id === resId ? { ...r, statut: 'REFUSEE' } : r))
      );
      showFeedback('info', 'Réservation refusée.');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du refus.');
    }
  };

  // Le client est venu retirer son panier : on encaisse et on compte le revenu.
  const handleRecupererReservation = async (res) => {
    const montant = formatDT(res.prixTotal);
    if (
      !window.confirm(
        `Confirmer le retrait du panier « ${res.produitNom || 'Panier'} » par ${res.clientNom || 'le client'} ?\n\nMontant encaissé en espèces : ${montant}\nCette réservation sera ajoutée à vos revenus.`,
      )
    ) {
      return;
    }
    try {
      if (token) await recupererReservation(res.id, token);
      setReservations((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, statut: 'RECUPEREE' } : r))
      );
      showFeedback('success', `Retrait enregistré : ${montant} ajoutés à vos revenus.`);
    } catch (err) {
      showFeedback('error', err?.message || "Erreur lors de l'enregistrement du retrait.");
    }
  };

  // Profile update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        nom: profileForm.nom.trim(),
        telephone: profileForm.telephone.trim(),
        localisation: profileForm.localisation.trim(),
      };
      if (profileForm.nouveauMotDePasse.trim()) {
        payload.motDePasse = profileForm.nouveauMotDePasse;
      }
      if (token) {
        await updateProfile(payload, token);
        if (reloadSession) await reloadSession();
      }
      showFeedback('success', 'Profil établissement mis à jour avec succès !');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'ATTENTION IRREVERSIBLE :\nLa suppression de votre compte commerçant supprimera définitivement tous vos produits, réservations et avis clients.\n\nPour confirmer, tapez "SUPPRIMER" ci-dessous :'
    );
    if (confirmation !== 'SUPPRIMER') return;

    try {
      if (token) await deleteAccount(token);
      await logout();
      navigate('/');
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors de la suppression du compte.');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAvatar(true);
    try {
      const dataUri = await compressImage(file, 800, 800, 0.85);
      const res = await uploadProfilePhoto(dataUri, token);
      const uploadedUrl = res?.imageUrl || res?.secureUrl;
      if (uploadedUrl) {
        await updateProfile({ photoUrl: uploadedUrl }, token);
        if (reloadSession) await reloadSession();
        showFeedback('success', "Logo / photo de l'établissement mis à jour !");
      }
    } catch (err) {
      showFeedback('error', err?.message || 'Erreur lors du téléchargement de la photo.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Stats calculation
  // Le revenu ne compte que les paniers réellement retirés (encaissés en espèces),
  // pas les réservations simplement confirmées.
  const recuperees = reservations.filter((r) => r.statut === 'RECUPEREE');
  const totalRevenue = recuperees.reduce((sum, r) => sum + (Number(r.prixTotal) || 0), 0);

  const pendingReservations = reservations.filter((r) => r.statut === 'EN_ATTENTE');
  // Confirmées mais pas encore retirées : montant à encaisser au comptoir.
  const aEncaisser = reservations.filter((r) => r.statut === 'CONFIRMEE');
  const montantAEncaisser = aEncaisser.reduce((sum, r) => sum + (Number(r.prixTotal) || 0), 0);
  const activeCount = produits.filter((p) => p.disponible).length;
  const averageRating =
    avisList.length > 0
      ? (
          avisList.reduce((sum, a) => sum + (Number(a.note) || 0), 0) / avisList.length
        ).toFixed(1)
      : null;

  const NAV_ITEMS = [
    { key: 'overview', label: "Vue d'ensemble", icon: 'dashboard' },
    { key: 'produits', label: 'Mes Paniers & Produits', icon: 'inventory_2', badge: produits.length },
    { key: 'reservations', label: 'Réservations reçues', icon: 'receipt_long', badge: pendingReservations.length },
    { key: 'avis', label: 'Avis & Notations', icon: 'star' },
    { key: 'profil', label: 'Mon Établissement', icon: 'storefront' },
  ];

  return (
    <div className="flex min-h-screen bg-[#FBF9F6] font-sans text-on-surface antialiased">
      {/* ─── SIDEBAR NAVIGATION (NO top navbar) ─── */}
      <aside
        className={`${sidebarCollapsed ? 'w-20' : 'w-64 sm:w-72'
          } shrink-0 bg-[#5D0E25] text-white flex flex-col justify-between transition-all duration-300 shadow-xl z-30 sticky top-0 h-screen`}
      >
        <div className="flex flex-col">
          {/* Sidebar Header / Brand */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
            <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center shrink-0 shadow-sm">
                <svg className="w-6 h-6 fill-current text-primary" viewBox="0 0 24 24">
                  <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
                  <path d="M10 13c1.5 0 2.5-1 3.5-3 0 2 1.5 3 2.5 3-1.5 0-2.5 1-3.5 3 0-2-1.5-3-2.5-3z" fill="#496640" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-extrabold text-white text-base tracking-tight truncate">
                    One More Bite
                  </span>
                  <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">
                    Espace Artisan
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              type="button"
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Réduire / Agrandir la barre latérale"
            >
              <span className="material-symbols-outlined text-[20px]">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${active
                      ? 'bg-white text-primary shadow-sm'
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
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${active
                          ? 'bg-secondary text-white'
                          : 'bg-white/20 text-white'
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile & Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center font-bold text-xs uppercase text-white shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt={user.nom} className="w-full h-full object-cover" />
                ) : (
                  (user?.nom || 'C').charAt(0)
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.nom || 'Fournil Lafayette'}
                  </span>
                  <span className="text-[10px] text-white/60 truncate">Commerçant vérifié</span>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <span className="w-2 h-2 rounded-full bg-green-400" title="En ligne" />
            )}
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 text-xs font-semibold"
              title="Voir le site public"
            >
              <span className="material-symbols-outlined text-[16px]">public</span>
              {!sidebarCollapsed && <span>Voir le site</span>}
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
        {/* Top Header inside main view */}
        <div className="bg-white border-b border-[#F0E6DE] px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
              {activeSection === 'overview' && "Tableau de Bord Commerçant"}
              {activeSection === 'produits' && "Gestion de mes Paniers & Stocks"}
              {activeSection === 'reservations' && "Réservations Clients à Retirer"}
              {activeSection === 'avis' && "Avis & Évaluations Clients"}
              {activeSection === 'profil' && "Fiche Établissement & Horaires"}
            </h1>
            <p className="text-xs text-on-surface-variant">
              Plateforme One More Bite • Du bon goût à petit prix
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewProductModal}
              type="button"
              className="px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="hidden sm:inline">Nouveau Panier</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Feedback alerts */}
          {feedback.message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in ${feedback.type === 'error'
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-[#EAF5E9] text-[#346330]'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {feedback.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* ─── 1. OVERVIEW VIEW ─── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Revenus générés
                    </span>
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-primary font-sans">
                      {formatDT(totalRevenue)}
                    </span>
                    <span className="block text-[11px] text-secondary font-semibold mt-0.5">
                      {recuperees.length} retrait{recuperees.length > 1 ? 's' : ''} encaissé{recuperees.length > 1 ? 's' : ''}
                      {aEncaisser.length > 0
                        ? ` • ${formatDT(montantAEncaisser)} à encaisser`
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      À préparer (Attente)
                    </span>
                    <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-amber-600 font-sans">
                      {pendingReservations.length}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">
                      Demandes à valider
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Paniers en ligne
                    </span>
                    <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-secondary font-sans">
                      {activeCount} / {produits.length}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">
                      Disponibles à la réservation
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Note moyenne
                    </span>
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">star</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-on-surface font-sans">
                      {averageRating ? `${averageRating} ★` : '—'}
                    </span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">
                      {avisList.length > 0
                        ? `Sur ${avisList.length} avis vérifié${avisList.length > 1 ? 's' : ''}`
                        : 'Aucun avis pour le moment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Table: Demandes de Retrait Prioritaires */}
              <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      notifications_active
                    </span>
                    Réservations du Jour à Retirer
                  </h3>
                  <button
                    onClick={() => setActiveSection('reservations')}
                    type="button"
                    className="text-xs font-bold text-secondary hover:underline"
                  >
                    Voir tout ({reservations.length}) →
                  </button>
                </div>

                {reservations.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">
                    Aucune réservation en cours pour le moment.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-2.5">Client & Contact</th>
                          <th className="py-2.5">Panier</th>
                          <th className="py-2.5">Quantité</th>
                          <th className="py-2.5">Total Espèces</th>
                          <th className="py-2.5">Statut</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5EBE1]">
                        {reservations.slice(0, 5).map((res) => (
                          <tr key={res.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="py-3 font-semibold text-on-surface">
                              <div>{res.clientNom || 'Client Anonyme'}</div>
                              <div className="text-[11px] text-on-surface-variant font-normal">
                                {res.clientTelephone || '—'}
                              </div>
                            </td>
                            <td className="py-3 font-medium text-on-surface">
                              <div className="flex items-center gap-2">
                                {res.produitImageUrl && (
                                  <img src={res.produitImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#F0E6DE] shrink-0" />
                                )}
                                <span>{res.produitNom || '—'}</span>
                              </div>
                            </td>
                            <td className="py-3 font-mono font-bold text-primary text-sm">
                              x{res.quantite ?? 0}
                            </td>
                            <td className="py-3 font-bold text-on-surface">
                              {formatDT(res.prixTotal)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${res.statut === 'RECUPEREE'
                                    ? 'bg-primary/10 text-primary'
                                    : res.statut === 'CONFIRMEE'
                                      ? 'bg-green-100 text-green-800'
                                      : res.statut === 'REFUSEE' || res.statut === 'ANNULEE'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                  }`}
                              >
                                {res.statut === 'RECUPEREE' ? 'RETIRÉE' : res.statut}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-1.5">
                              {res.statut === 'EN_ATTENTE' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmReservation(res.id)}
                                    type="button"
                                    className="px-2.5 py-1 rounded-full bg-secondary text-white text-[11px] font-bold hover:bg-[#3d5735]"
                                  >
                                    Valider
                                  </button>
                                  <button
                                    onClick={() => handleRefuseReservation(res.id)}
                                    type="button"
                                    className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold"
                                  >
                                    Refuser
                                  </button>
                                </>
                              )}
                              {res.statut === 'CONFIRMEE' && (
                                <button
                                  onClick={() => handleRecupererReservation(res)}
                                  type="button"
                                  className="px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold hover:bg-primary-dark"
                                >
                                  Retrait effectué
                                </button>
                              )}
                              {res.statut === 'RECUPEREE' && (
                                <span className="text-[11px] text-primary font-bold">
                                  ✓ Encaissé
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── 2. PRODUITS VIEW ─── */}
          {activeSection === 'produits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-on-surface">Catalogue de vos Paniers</h3>
                  <p className="text-xs text-on-surface-variant">
                    Gérez la disponibilité et les stocks de vos invendus du jour.
                  </p>
                </div>
                <button
                  onClick={openNewProductModal}
                  type="button"
                  className="px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Ajouter un panier</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {produits.length === 0 && (
                  <div className="col-span-full bg-white border border-dashed border-[#E4D5C7] rounded-2xl p-10 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">
                      inventory_2
                    </span>
                    <p className="text-sm font-bold text-on-surface">
                      Aucun panier dans votre catalogue
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Ajoutez votre premier panier pour qu'il apparaisse sur la page d'accueil.
                    </p>
                  </div>
                )}
                {produits.map((prod) => {
                  const prodImg = (Array.isArray(prod.images) && prod.images[0]) || prod.imageUrl || prod.photoUrl;
                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-[#F0E6DE] rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      {/* Product Image Header */}
                      <div className="relative w-full h-44 bg-surface-container overflow-hidden">
                        {prodImg ? (
                          <img
                            src={prodImg}
                            alt={prod.nom}
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
                            prod.disponible ? 'bg-green-600/90 text-white' : 'bg-black/60 text-white'
                          }`}
                        >
                          {prod.disponible ? 'En ligne' : 'Masqué'}
                        </span>
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            onClick={() => openEditProductModal(prod)}
                            type="button"
                            className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-gray-700 hover:text-primary backdrop-blur-md shadow-xs transition-colors"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            type="button"
                            className="p-1.5 rounded-lg bg-white/85 hover:bg-white text-gray-700 hover:text-error backdrop-blur-md shadow-xs transition-colors"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        <span className="absolute bottom-2.5 right-2.5 font-extrabold text-white text-xs px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">
                          {formatDT(prod.prix)}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-base text-on-surface mb-1 line-clamp-1">{prod.nom}</h4>
                          <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                            {prod.description}
                          </p>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-lg font-extrabold text-primary">
                              {formatDT(prod.prix)}
                            </span>
                            <span className="text-xs text-outline line-through">
                              {formatDT(prod.prix * 2)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
                          {/* Stock controls */}
                          <div className="flex items-center gap-1.5 bg-surface-container rounded-full px-2 py-1">
                            <button
                              onClick={() => handleUpdateStock(prod, -1)}
                              type="button"
                              className="w-5 h-5 rounded-full bg-white text-xs font-bold hover:bg-gray-200"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-on-surface px-1">
                              {prod.quantite} dispo
                            </span>
                            <button
                              onClick={() => handleUpdateStock(prod, 1)}
                              type="button"
                              className="w-5 h-5 rounded-full bg-white text-xs font-bold hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>

                          {/* Toggle Disponibilité */}
                          <button
                            onClick={() => handleToggleDisponibilite(prod)}
                            type="button"
                            className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                              prod.disponible
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {prod.disponible ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── 3. RÉSERVATIONS VIEW ─── */}
          {activeSection === 'reservations' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-on-surface">Toutes les réservations reçues</h3>
                  <p className="text-xs text-on-surface-variant">
                    Validez les commandes lors du passage du client en caisse.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F0E6DE] text-outline font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5">ID & Date</th>
                      <th className="py-2.5">Client</th>
                      <th className="py-2.5">Panier</th>
                      <th className="py-2.5">Quantité</th>
                      <th className="py-2.5">Montant à encaisser</th>
                      <th className="py-2.5">Statut</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EBE1]">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 text-on-surface-variant">#{res.id}</td>
                        <td className="py-3 font-bold text-on-surface">
                          <div>{res.clientNom || 'Client'}</div>
                          <div className="text-[11px] font-normal text-on-surface-variant">
                            {res.clientTelephone || '—'}
                          </div>
                        </td>
                        <td className="py-3 text-on-surface font-medium">
                          <div className="flex items-center gap-2">
                            {res.produitImageUrl && (
                              <img src={res.produitImageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#F0E6DE] shrink-0" />
                            )}
                            <span>{res.produitNom || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-extrabold text-primary text-sm">
                          x{res.quantite ?? 0}
                        </td>
                        <td className="py-3 font-extrabold text-primary">
                          {formatDT(res.prixTotal)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${res.statut === 'RECUPEREE'
                                ? 'bg-primary/10 text-primary'
                                : res.statut === 'CONFIRMEE'
                                  ? 'bg-green-100 text-green-800'
                                  : res.statut === 'REFUSEE' || res.statut === 'ANNULEE'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {res.statut === 'RECUPEREE' ? 'RETIRÉE' : res.statut}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          {res.statut === 'EN_ATTENTE' ? (
                            <>
                              <button
                                onClick={() => handleConfirmReservation(res.id)}
                                type="button"
                                className="px-3 py-1 rounded-full bg-secondary text-white font-bold text-xs hover:bg-[#3d5735]"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleRefuseReservation(res.id)}
                                type="button"
                                className="px-3 py-1 rounded-full bg-error-container text-on-error-container font-bold text-xs"
                              >
                                Refuser
                              </button>
                            </>
                          ) : res.statut === 'CONFIRMEE' ? (
                            <button
                              onClick={() => handleRecupererReservation(res)}
                              type="button"
                              className="px-3 py-1 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary-dark"
                            >
                              Retrait effectué
                            </button>
                          ) : (
                            <span className="text-[11px] text-outline font-semibold">Traité</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── 4. AVIS VIEW ─── */}
          {activeSection === 'avis' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-on-surface">Avis des clients sur vos paniers</h3>
                    <p className="text-xs text-on-surface-variant">
                      Les retours et notes laissés par les gourmands après dégustation de vos invendus.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 self-start sm:self-auto">
                    <span className="text-amber-500 text-lg">★</span>
                    <span className="text-base font-extrabold text-on-surface">
                      {averageRating ? `${averageRating} / 5` : '—'}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      ({avisList.length} avis)
                    </span>
                  </div>
                </div>

                {avisList.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-[#F0E6DE] rounded-2xl bg-surface-container-low/50">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-2xl">rate_review</span>
                    </div>
                    <h4 className="font-bold text-sm text-on-surface">Aucun avis client pour le moment</h4>
                    <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                      Les commentaires et photos de profil de vos clients apparaîtront ici dès qu'ils auront noté leurs commandes retirées.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {avisList.map((a, idx) => (
                      <div
                        key={a.id || idx}
                        className="p-4 rounded-xl bg-surface-container-low border border-[#F0E6DE] space-y-2 hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {a.clientPhotoUrl ? (
                              <img
                                src={a.clientPhotoUrl}
                                alt={a.clientNom || 'Client'}
                                className="w-10 h-10 rounded-full object-cover border border-[#F0E6DE] shadow-2xs shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                                {a.clientNom ? a.clientNom.charAt(0).toUpperCase() : 'C'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-xs text-on-surface">
                                {a.clientNom || 'Gourmand OneMoreBite'}
                              </div>
                              {a.dateAvis && (
                                <div className="text-[10px] text-on-surface-variant">
                                  {new Date(a.dateAvis).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-amber-500 text-sm">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={i < (Number(a.note) || 0) ? 'text-amber-500' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {a.commentaire && (
                          <p className="text-xs text-on-surface-variant leading-relaxed pl-13 italic">
                            « {a.commentaire} »
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── 5. PROFIL ÉTABLISSEMENT VIEW ─── */}
          {activeSection === 'profil' && (
            <div className="bg-white border border-[#F0E6DE] rounded-2xl p-6 shadow-2xs max-w-2xl">
              <h3 className="text-base font-bold text-on-surface mb-1">
                Coordonnées de l'Établissement
              </h3>
              <p className="text-xs text-on-surface-variant mb-5">
                Ces informations sont affichées aux clients pour le retrait des commandes.
              </p>

              {/* Logo / Photo de l'établissement */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-[#F0E6DE] mb-5">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center shadow-xs">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.nom} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[32px] text-primary">storefront</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface">Logo / Photo de l'enseigne</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Cette photo est visible par les clients sur vos paniers et votre vitrine.
                  </p>
                </div>
                <label className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                  <span className="material-symbols-outlined text-[16px]">{uploadingAvatar ? 'hourglass_top' : 'photo_camera'}</span>
                  <span>{uploadingAvatar ? 'Téléchargement…' : 'Changer la photo'}</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} className="sr-only" />
                </label>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Nom de la boulangerie / restaurant
                  </label>
                  <input
                    required
                    type="text"
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm((f) => ({ ...f, nom: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Téléphone de contact (Boutique)
                  </label>
                  <input
                    required
                    type="tel"
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, telephone: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Adresse physique & Ville
                  </label>
                  <input
                    required
                    type="text"
                    value={profileForm.localisation}
                    onChange={(e) => setProfileForm((f) => ({ ...f, localisation: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Nouveau mot de passe (optionnel)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={profileForm.nouveauMotDePasse}
                    onChange={(e) => setProfileForm((f) => ({ ...f, nouveauMotDePasse: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs transition-all"
                  >
                    {savingProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>

              {/* Zone de danger : Suppression du compte commerçant */}
              <div className="mt-8 pt-6 border-t border-error/20">
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-600 text-2xl shrink-0 mt-0.5">
                      warning
                    </span>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-red-900">
                        Supprimer définitivement mon compte commerçant
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        Cette action est irréversible. L'intégralité de vos paniers, réservations et avis clients seront immédiatement et définitivement supprimés.
                      </p>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="mt-3 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        Supprimer mon compte et mes données
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL CRÉER / MODIFIER PRODUIT ─── */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#F0E6DE]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">
                {editingProduct ? 'Modifier le Panier' : 'Ajouter un Nouveau Panier'}
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
                <label className="block font-bold text-on-surface mb-1">Titre du panier</label>
                <input
                  required
                  type="text"
                  placeholder="Ex. Panier Viennoiseries & Pains Spéciaux"
                  value={productForm.nom}
                  onChange={(e) => setProductForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Description du contenu</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex. 3 croissants au beurre, 1 baguette tradition, 2 brioches..."
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
                    placeholder="4.800"
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
                    min="1"
                    value={productForm.quantite}
                    onChange={(e) => setProductForm((f) => ({ ...f, quantite: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-surface-container-low border-0 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-2">
                  Photos du produit
                </label>

                {/* Uploaded image thumbnails */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#F0E6DE] group">
                        <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploadingImages ? 'border-primary/40 bg-primary/5 text-primary/60 cursor-not-allowed' : 'border-[#C8A99A] hover:border-primary hover:bg-primary/5 text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                  <span className="text-sm font-semibold">
                    {uploadingImages ? 'Téléchargement en cours…' : 'Ajouter des photos'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadingImages}
                    onChange={handleImageFilesSelected}
                    className="sr-only"
                  />
                </label>

                {uploadError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{uploadError}</p>
                )}
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Formats acceptés : JPG, PNG, WEBP. Plusieurs photos autorisées.
                </p>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.disponible}
                  onChange={(e) => setProductForm((f) => ({ ...f, disponible: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-on-surface">Rendre immédiatement disponible en ligne</span>
              </label>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dark text-white font-bold"
                >
                  {savingProduct ? 'Enregistrement…' : 'Enregistrer le panier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
