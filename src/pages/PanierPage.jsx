import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createReservation, fetchProduits } from '../api/produits';

function formatDT(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0.000 DT';
  return `${num.toFixed(3).replace(/\.?0+$/, '')} DT`;
}

export default function PanierPage() {
  const { user, token } = useAuth();
  const { items, itemCount, totalPrice, totalOriginalPrice, totalSavings, updateQuantity, removeItem, clearCart } =
    useCart();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.nom || '');
  const [customerPhone, setCustomerPhone] = useState(user?.telephone || '');
  const [customerNote, setCustomerNote] = useState('');
  const [confirmedReservations, setConfirmedReservations] = useState(null);
  const [reservationResults, setReservationResults] = useState([]);
  const [reservationError, setReservationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync customer details when user auth updates
  useEffect(() => {
    if (user?.nom) setCustomerName(user.nom);
    if (user?.telephone) setCustomerPhone(user.telephone || '');
  }, [user]);

  // Live countdown timer (starts at 15 minutes)
  const [secondsLeft, setSecondsLeft] = useState(14 * 60 + 45);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleConfirmReservation = async (e) => {
    e?.preventDefault?.();
    if (items.length === 0) return;
    setReservationError('');

    if (!token) {
      setReservationError('Veuillez vous connecter avec votre compte Client pour valider et enregistrer votre réservation en direct.');
      return;
    }

    setSubmitting(true);

    try {
      const created = [];
      for (const item of items) {
        let prodId = Number(item.backendId || item.id);
        if (isNaN(prodId) || !prodId) {
          try {
            const available = await fetchProduits({ disponible: true });
            if (Array.isArray(available) && available.length > 0) {
              const matched = available.find((p) => p.nom === item.nom) || available[0];
              prodId = matched.id;
            }
          } catch {
            prodId = 1;
          }
        }

        const res = await createReservation(prodId, item.quantite || 1, token);
        created.push(res);
      }

      if (created.length > 0) {
        setConfirmedReservations(created);
        setReservationResults(created);
        clearCart();
      } else {
        throw new Error("Le serveur n'a pas pu valider votre réservation.");
      }
    } catch (err) {
      setReservationError(err?.message || 'Erreur lors de la réservation auprès du serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8] font-sans text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-6 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Steps Tracker Breadcrumb */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1.5">
                  <span className="material-symbols-outlined text-[15px]">eco</span>
                  Geste citoyen & gourmand
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  Mon Panier & Réservation
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container px-3.5 py-1.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>Réservation garantie sans carte bancaire</span>
              </div>
            </div>

       
          </div>

          {/* Prompt if user is not authenticated */}
          {!token && !confirmedReservations && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0">account_circle</span>
                <span>
                  Vous devez être connecté avec votre compte <strong>Client</strong> pour enregistrer votre réservation en direct sur le serveur.
                </span>
              </div>
              <Link
                to="/auth?mode=login"
                className="px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
              >
                Se connecter / Créer un compte
              </Link>
            </div>
          )}

          {/* Error Banner if any */}
          {reservationError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0">info</span>
                <span>{reservationError}</span>
              </div>
              <Link
                to="/auth?mode=login"
                className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
              >
                Se connecter
              </Link>
            </div>
          )}

          {/* Success Dialog if confirmed */}
          {confirmedReservations && (
            <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-[#EAF5E9] border-2 border-[#CDE5CB] shadow-md animate-fade-in text-center max-w-2xl mx-auto">
              <span className="material-symbols-outlined text-5xl text-secondary mb-2 block">
                check_circle
              </span>
              <h2 className="text-2xl font-extrabold text-[#231F20] mb-2">
                🎉 Réservation Transmise avec Succès !
              </h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
                Votre commande a été envoyée au commerçant et enregistrée sur notre serveur. Vous pouvez suivre son statut en temps réel.
              </p>

              {reservationResults.length > 0 && (
                <div className="mb-6 space-y-3 text-left">
                  {reservationResults.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="bg-white rounded-2xl p-4 border border-[#CDE5CB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm shrink-0">
                          #{r.id}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">
                            {r.produitNom || 'Panier Anti-Gaspillage'}
                          </h4>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-[15px] text-secondary">store</span>
                            <span>{r.commercantNom || 'Commerçant'}</span>
                            {r.commercantLocalisation && (
                              <span className="text-[11px] text-outline">({r.commercantLocalisation})</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F5EBE1]">
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                          {r.statut || 'EN_ATTENTE'}
                        </span>
                        <span className="text-xs font-bold text-primary sm:mt-1">
                          Quantité : {r.quantite || 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-on-surface-variant mb-6 bg-white/70 p-3 rounded-xl border border-[#CDE5CB]/80">
                <strong className="text-primary">Paiement sur place :</strong> Réglez directement le montant en espèces au commerçant lors de votre passage au créneau de retrait.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => {
                    clearCart();
                    setConfirmedReservations(null);
                    navigate('/client');
                  }}
                  className="bg-secondary hover:bg-secondary-dark text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Voir dans mon espace client
                </button>
                <button
                  onClick={() => {
                    clearCart();
                    setConfirmedReservations(null);
                    navigate('/');
                  }}
                  className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full shadow-xs transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          )}

          {items.length === 0 && !confirmedReservations ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#F0E6DE] p-8 max-w-md mx-auto">
              <span className="material-symbols-outlined text-6xl text-outline mb-3 block">
                shopping_cart
              </span>
              <h2 className="text-xl font-bold text-on-surface mb-2">Votre panier est vide</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
                Parcourez les offres anti-gaspi des boulangeries et restaurants partenaires près de chez vous.
              </p>
              <Link
                to="/#produits"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Explorer les offres
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Items + Customer info + Cash Reassurance */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
             

                {/* Section: Articles dans le Panier */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[22px]">
                        shopping_bag
                      </span>
                      Paniers à sauver ({itemCount})
                    </h2>
                    <span className="text-xs text-on-surface-variant font-medium">
                      {items.length} commerce(s) partenaire(s)
                    </span>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="relative bg-white border border-[#F0E6DE] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                          <img
                            src={item.imageUrl}
                            alt={item.nom}
                            className="w-full h-full object-cover"
                          />
                         
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                              {item.tag || 'Surprise Gourmande'}
                            </span>
                            <span className="text-[12px] text-on-surface-variant flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[14px]">store</span>
                              {item.merchantName}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-on-surface truncate">
                            {item.nom}
                          </h3>

                          

                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-base sm:text-lg font-extrabold text-primary">
                              {formatDT(item.prix)}
                            </span>
                            {item.prixOriginal && (
                              <span className="text-xs line-through text-outline">
                                {formatDT(item.prixOriginal)}
                              </span>
                            )}
                            <span className="text-[11px] text-secondary font-semibold ml-1">
                              Économie de {formatDT((item.prixOriginal || item.prix * 2) - item.prix)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Qty + Remove */}
                      <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F5EBE1]">
                        <div className="inline-flex items-center bg-surface-container rounded-full p-1 shadow-inner">
                          <button
                            aria-label="Diminuer la quantité"
                            onClick={() => updateQuantity(item.id, -1)}
                            type="button"
                            className="w-7 h-7 rounded-full bg-white text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="w-8 text-center font-bold text-xs">{item.quantite}</span>
                          <button
                            aria-label="Augmenter la quantité"
                            onClick={() => updateQuantity(item.id, 1)}
                            type="button"
                            className="w-7 h-7 rounded-full bg-white text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          type="button"
                          className="text-on-surface-variant hover:text-error p-1.5 rounded-full hover:bg-error-container/40 transition-colors flex items-center gap-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span className="sm:hidden text-xs">Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section: Informations de Retrait */}
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[22px]">
                        contact_mail
                      </span>
                      Coordonnées de Retrait
                    </h2>
                    <span className="text-[11px] font-bold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full">
                      Réservation sans paiement en ligne
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Nom et Prénom</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                          person
                        </span>
                        <input
                          type="text"
                          placeholder="Votre nom complet"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border-0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Numéro de téléphone (+216)
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                          smartphone
                        </span>
                        <input
                          type="tel"
                          placeholder="Ex: 98 123 456"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-surface-container-low rounded-xl text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border-0"
                        />
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Votre numéro permet au commerçant de vous identifier lors du retrait.
                      </p>
                    </div>
                  </div>


                  {/* Eco tip banner */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed-variant">
                    <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                      shopping_bag
                    </span>
                    <div className="text-xs leading-relaxed">
                      <strong className="font-bold text-on-secondary-fixed">Astuce Zéro Déchet :</strong> Pensez à apporter votre propre cabas, tupperware ou sac réutilisable en tissu pour récupérer vos douceurs et vos sandwichs !
                    </div>
                  </div>
                </div>

                {/* Section: Reassurance Paiement sur Place (Cash on Pickup) */}
                <div className="bg-[#FAF4ED] border border-[#EEDBCA] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">payments</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      Paiement 100% sur place en espèces chez le commerçant
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      Aucun paiement en ligne requis ni carte bancaire nécessaire sur l'application. Vous réglez directement le montant exact en mains propres à la caisse du commerce lors du retrait de votre commande.
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-secondary font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Annulation gratuite
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Sans commission cachée
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Order Summary Bento */}
              <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
                <div className="bg-white border border-[#F0E6DE] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F5EBE1]">
                    <h3 className="text-base sm:text-lg font-bold text-primary">Récapitulatif de Sauvetage</h3>
                    <span className="text-xs font-bold text-on-surface-variant">
                      {itemCount} article(s)
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center text-on-surface">
                      <span>Sous-total paniers :</span>
                      <span className="font-semibold">{formatDT(totalOriginalPrice)}</span>
                    </div>
                    <div className="pt-3 border-t border-[#F5EBE1] flex justify-between items-baseline">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">Total à payer sur place</span>
                        <span className="text-[11px] text-on-surface-variant">Au comptoir lors du retrait</span>
                      </div>
                      <span className="text-2xl font-extrabold text-primary font-sans">
                        {formatDT(totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Ecological Impact Metrics */}
                  <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5 border border-[#F0E6DE]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">nest_eco_leaf</span>
                        Votre Impact Positif
                      </span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                        Sauvetage
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2 rounded-lg bg-white shadow-2xs">
                        <div className="text-lg font-bold text-primary">{(itemCount * 1.2).toFixed(1)} kg</div>
                        <div className="text-[11px] text-on-surface-variant">Nourriture sauvée</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white shadow-2xs">
                        <div className="text-lg font-bold text-secondary">{(itemCount * 2.4).toFixed(1)} kg</div>
                        <div className="text-[11px] text-on-surface-variant">CO₂e évité</div>
                      </div>
                    </div>
                  </div>

                  {/* Accept checkbox */}
                  <label className="flex items-start gap-2 text-xs text-on-surface-variant cursor-pointer select-none">
                    <input
                      defaultChecked
                      required
                      type="checkbox"
                      className="mt-0.5 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>
                      Je m'engage à me présenter au créneau indiqué pour retirer et régler ma commande en espèces.
                    </span>
                  </label>

                  {/* Confirm CTA */}
                  <button
                    disabled={submitting || items.length === 0}
                    onClick={handleConfirmReservation}
                    type="button"
                    className="w-full py-3.5 px-6 rounded-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        <span>Transmission au serveur…</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmer ma réservation • {formatDT(totalPrice)}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
