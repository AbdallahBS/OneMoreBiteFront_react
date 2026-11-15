import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeaturedDeals from '../components/FeaturedDeals';
import { fetchPublicCommercants, fetchPublicAvis } from '../api/produits';

const FAQ_ITEMS = [
  {
    q: 'Comment réserver un panier sur One More Bite ?',
    a: "C'est très simple : parcourez les paniers disponibles près de chez vous, ajoutez vos paniers au panier ou cliquez sur « Réserver », et confirmez instantanément votre commande sans paiement en ligne.",
  },
  {
    q: 'Est-ce que je dois payer en ligne par carte bancaire ?',
    a: 'Non ! Zéro carte bancaire requise. Vous réglez directement en espèces (cash) auprès du commerçant lors du retrait de votre commande.',
  },
  {
    q: 'À quelle heure dois-je récupérer mon panier ?',
    a: "Chaque commerce indique son créneau de retrait (généralement en fin d'après-midi ou en soirée, avant la fermeture). L'horaire exact est affiché sur chaque fiche produit et consultable dans votre espace client.",
  },
  {
    q: 'Je suis boulanger, restaurateur ou pâtissier, comment puis-je adhérer ?',
    a: "Cliquez sur « Inscrire mon commerce » dans le menu ou le pied de page. L'inscription est rapide et sans frais d'entrée : commencez à valoriser vos invendus dès aujourd'hui !",
  },
];

const MAX_FEATURED_AVIS = 3;
const MAX_FEATURED_COMMERCANTS = 3;

/** Mélange de Fisher-Yates (nouveau tableau, l'original n'est pas modifié). */
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Sélectionne les avis les mieux notés puis en tire 3 au hasard.
 * Seuls les avis contenant un commentaire sont éligibles (un avis sans texte
 * n'a rien à raconter sur la page d'accueil).
 */
function selectTopRatedAvis(avis, max = MAX_FEATURED_AVIS) {
  const withComment = avis.filter(
    (a) => a && typeof a.commentaire === 'string' && a.commentaire.trim().length > 0,
  );
  if (withComment.length === 0) return [];

  const sorted = [...withComment].sort((a, b) => (Number(b.note) || 0) - (Number(a.note) || 0));
  // On garde la moitié la mieux notée (au moins `max`) pour conserver de la variété.
  const poolSize = Math.max(max, Math.ceil(sorted.length / 2));

  return shuffle(sorted.slice(0, poolSize)).slice(0, max);
}

/** Agrège les avis par commerçant pour obtenir une note moyenne réelle. */
function buildMerchantRatings(avis) {
  const ratings = new Map();
  avis.forEach((a) => {
    if (!a || a.commercantId === undefined || a.commercantId === null) return;
    const note = Number(a.note);
    if (!Number.isFinite(note)) return;
    const entry = ratings.get(a.commercantId) || { total: 0, count: 0 };
    entry.total += note;
    entry.count += 1;
    ratings.set(a.commercantId, entry);
  });
  return ratings;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [commercants, setCommercants] = useState([]);
  const [avisList, setAvisList] = useState([]);
  const [loadingCommercants, setLoadingCommercants] = useState(true);
  const [loadingAvis, setLoadingAvis] = useState(true);

  useEffect(() => {
    let active = true;

    fetchPublicCommercants()
      .then((data) => {
        if (!active) return;
        setCommercants(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setCommercants([]);
      })
      .finally(() => {
        if (active) setLoadingCommercants(false);
      });

    fetchPublicAvis()
      .then((data) => {
        if (!active) return;
        setAvisList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setAvisList([]);
      })
      .finally(() => {
        if (active) setLoadingAvis(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const merchantRatings = useMemo(() => buildMerchantRatings(avisList), [avisList]);
  const featuredAvis = useMemo(() => selectTopRatedAvis(avisList), [avisList]);
  const featuredCommercants = commercants.slice(0, MAX_FEATURED_COMMERCANTS);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9F1] font-sans text-on-surface antialiased selection:bg-primary-soft selection:text-primary">
      <Header />

      <main className="w-full flex-1">
        {/* 1. HERO BANNER SECTION */}
        <section className="relative w-full max-w-[1400px] mx-auto px-4 lg:px-8 pt-4 pb-2" id="home">
          <div className="relative w-full min-h-[460px] lg:min-h-[500px] rounded-3xl overflow-hidden bg-[#FAF4ED] shadow-sm flex items-center">
            {/* Hero Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                alt="Corbeille de viennoiseries et pains tunisiens à l'heure dorée"
                className="w-full h-full object-cover object-right md:object-center transform scale-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQZhJ7cmvdUOIQG8DWh1sq8vN6heKWnrQUQQQjrMAkFqQz_CcZ3dpTSPNMbzxCOafYjY9eEIumZvMAhgHrBy4gO1vBuOc5lGchG5vs1XpSKei2ZRPO29TSPPNE1FkP_PX8XCKApcJAEl0SK9J3aFkodxFoNWtVa32DPBr4-bl_p4k8IDcjMSZgjl1I5Hm4u5BECuOW0G8e8wGyat10QpDPqjAUC-afuvVCelZVejLNM9w8k9QaEF1a"
              />
              {/* Gentle Left Cream/Golden Gradient Mask */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFF8EE] via-[#FFF8EE]/90 md:via-[#FFF8EE]/75 to-transparent w-full md:w-[68%]" />
            </div>

            {/* Hero Content (Left Column) */}
            <div className="relative z-10 w-full max-w-2xl px-6 sm:px-10 lg:px-14 py-8 flex flex-col items-start">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-1.5 bg-[#EAF5E9] border border-[#CDE5CB] text-[#346330] text-[12px] font-semibold px-3 py-1 rounded-full mb-4 shadow-2xs">
                <span>🌱</span>
                <span>Ensemble contre le gaspillage alimentaire</span>
                <span className="text-red-500">❤️</span>
              </div>

              {/* Main Headlines */}
              <div className="flex flex-col mb-4">
                <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-extrabold text-primary tracking-tight leading-none mb-1">
                  One More Bite
                </h1>
                <div className="inline-block relative">
                  <h2 className="text-[32px] sm:text-[40px] lg:text-[46px] font-extrabold text-[#231F20] tracking-tight leading-tight">
                    Du bon goût à petit prix...
                  </h2>
                  <div className="w-48 sm:w-60 h-2 wavy-underline mt-0.5" />
                </div>
              </div>

              {/* Subtitle with Hand-drawn heart doodle */}
              <div className="relative max-w-lg mb-7">
                <p className="text-[14.5px] sm:text-[15.5px] text-[#4A4345] leading-relaxed font-normal">
                  Découvrez des produits gourmands à prix réduits chez vos commerçants tunisiens, et donnez une seconde vie à la nourriture !
                </p>
                <div className="absolute -right-7 sm:-right-9 top-0 text-red-500 select-none">
                  <svg className="w-6 h-6 transform rotate-12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <div className="absolute -top-1 -right-2 text-[10px] text-red-400 font-handwriting">✨</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-[14px] px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95"
                  href="#produits"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span>Explorer les produits →</span>
                </a>
                <a
                  className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-primary border border-primary/50 font-bold text-[14px] px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all"
                  href="#comment-ca-marche"
                >
                  <span className="text-primary text-[12px]">▶</span>
                  <span>Comment ça marche ?</span>
                </a>
              </div>
            </div>

            {/* Right Slate / Chalkboard Signboard */}
            
          </div>
        </section>

        {/* 2. FEATURE HIGHLIGHTS BAR */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3">
          <div className="bg-[#FAF3EA] rounded-2xl p-4 lg:p-6 shadow-xs border border-[#F2E5D6]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {/* Highlight 1 */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#E5F2E2] text-[#3D7736] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">eco</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] lg:text-[14px] font-bold text-[#2E282A] leading-snug">
                    Réduisons le gaspillage alimentaire
                  </span>
                </div>
              </div>
              {/* Highlight 2 */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#FFEAD6] text-[#C96B26] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">savings</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] lg:text-[14px] font-bold text-[#2E282A] leading-snug">
                    Économisez sur vos achats
                  </span>
                </div>
              </div>
              {/* Highlight 3 */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#FCE8E8] text-[#9A3434] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">storefront</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] lg:text-[14px] font-bold text-[#2E282A] leading-snug">
                    Soutenez les commerçants locaux
                  </span>
                </div>
              </div>
              {/* Highlight 4 */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#FDF0E6] text-[#A63A4D] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[26px]">volunteer_activism</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[13px] lg:text-[14px] font-bold text-[#2E282A] leading-snug">
                    Agissons ensemble pour un avenir durable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SECTION: PRODUITS POPULAIRES */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 pb-4" id="produits">
          <div className="flex items-center justify-center gap-3 text-center mb-6">
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
            <h2 className="text-[26px] sm:text-[30px] font-extrabold text-primary tracking-tight">
              Produits populaires
            </h2>
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
          </div>

          <FeaturedDeals />

          {/* Trust Indicator Card (Cash on pickup) */}
          <div className="max-w-3xl mx-auto bg-[#FBF5ED] border border-[#EEDBCA] rounded-2xl p-4 sm:p-5 flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-full bg-[#E6F3E4] text-[#346330] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">payments</span>
            </div>
            <div className="flex flex-col text-left">
              <h4 className="text-[14.5px] font-bold text-on-surface">
                Paiement 100% sur place, zéro carte bancaire requise
              </h4>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                Réservez gratuitement votre panier en ligne en un clic, et réglez directement en espèces auprès de votre commerçant lors du retrait.
              </p>
            </div>
          </div>
        </section>

        {/* 4. SECTION: HOW TO RESERVE (Comment ça marche) */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mb-16" id="comment-ca-marche">
          <div className="bg-[#FAF4ED] border border-[#EEDBCA] rounded-3xl p-6 sm:p-10 shadow-xs">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 bg-[#FDF2F4] border border-primary/20 text-primary text-[12px] font-semibold px-3 py-1 rounded-full mb-3 shadow-2xs">
                <span>⚡</span>
                <span>Réservation simple & rapide</span>
              </div>
              <h2 className="text-[28px] sm:text-[34px] font-extrabold text-primary tracking-tight leading-tight mb-2">
                Comment sauver un panier ? C'est un jeu d'enfant !
              </h2>
              <p className="text-[15px] text-on-surface-variant font-medium">
                3 étapes faciles pour récupérer vos délices préférés à prix mini.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all group relative">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md mb-4 group-hover:scale-105 transition-transform relative">
                  <span className="material-symbols-outlined text-[28px]">search_spark</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#C96B26] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    1
                  </span>
                </div>
                <h3 className="text-[18px] font-bold text-[#231F20] mb-2">Étape 1 : « Explorez & découvrez »</h3>
                <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                  Parcourez les offres anti-gaspillage près de chez vous et choisissez les saveurs qui vous font envie à prix tout doux.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all group relative">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md mb-4 group-hover:scale-105 transition-transform relative">
                  <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#C96B26] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    2
                  </span>
                </div>
                <h3 className="text-[18px] font-bold text-[#231F20] mb-2">Étape 2 : « Réservez sans tracas »</h3>
                <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                  Sélectionnez vos paniers gourmands, ajustez la quantité et validez votre réservation gratuitement en quelques secondes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all group relative">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md mb-4 group-hover:scale-105 transition-transform relative">
                  <span className="material-symbols-outlined text-[28px]">storefront</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#C96B26] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    3
                  </span>
                </div>
                <h3 className="text-[18px] font-bold text-[#231F20] mb-2">Étape 3 : « Retirez & savourez »</h3>
                <p className="text-[13.5px] text-on-surface-variant leading-relaxed">
                  Passez chez le commerçant au créneau de retrait indiqué, récupérez votre panier et réglez directement en espèces au comptoir.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-[#EAF5E9] border border-[#CDE5CB] text-[#346330] text-[13px] font-semibold px-4 py-2 rounded-full shadow-2xs">
                <span>✨</span>
                <span>Réservation 100% gratuite et paiement direct en espèces auprès du commerçant lors du retrait</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: FEATURED MERCHANTS (Commerçants Partenaires) */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mb-16" id="commercants">
          <div className="flex items-center justify-center gap-3 text-center mb-2">
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
            <h2 className="text-[26px] sm:text-[32px] font-extrabold text-primary tracking-tight">
              Nos commerçants partenaires près de chez vous
            </h2>
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
          </div>
          <p className="text-center text-[14.5px] text-on-surface-variant mb-8">
            Découvrez les artisans, boulangeries et restaurants engagés contre le gaspillage alimentaire.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingCommercants ? (
              Array.from({ length: MAX_FEATURED_COMMERCANTS }).map((_, idx) => (
                <div
                  key={`merchant-skeleton-${idx}`}
                  className="bg-white rounded-2xl overflow-hidden border border-[#F0E6DE] flex flex-col animate-pulse"
                >
                  <div className="w-full h-48 bg-[#F3E9DF]" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 w-2/3 bg-[#F3E9DF] rounded-full" />
                    <div className="h-3 w-1/2 bg-[#F8F1EA] rounded-full" />
                    <div className="h-9 w-full bg-[#F8F1EA] rounded-full mt-3" />
                  </div>
                </div>
              ))
            ) : featuredCommercants.length > 0 ? (
              featuredCommercants.map((comm) => {
                const rating = merchantRatings.get(comm.id);
                const average = rating && rating.count > 0 ? rating.total / rating.count : null;

                return (
                  <div
                    key={comm.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group"
                  >
                    <div className="relative w-full h-48 overflow-hidden bg-[#FBF3EA]">
                      {comm.photoUrl ? (
                        <img
                          alt={comm.nom}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={comm.photoUrl}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FDF0E6] to-[#F3E2D3] text-primary/60 group-hover:scale-105 transition-transform duration-500">
                          <span className="material-symbols-outlined text-[64px]">storefront</span>
                        </div>
                      )}
                      <span className="absolute top-3 right-3 bg-secondary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        Commerçant certifié
                      </span>
                      {comm.localisation && (
                        <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                          {comm.localisation}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-[18px] font-bold text-[#231F20] group-hover:text-primary transition-colors">
                          {comm.nom}
                        </h3>
                        {average !== null ? (
                          <span className="text-[12px] font-bold text-[#C96B26] bg-[#FFEAD6] px-2 py-0.5 rounded-full whitespace-nowrap">
                            ★ {average.toFixed(1)} ({rating.count})
                          </span>
                        ) : (
                          <span className="text-[12px] font-bold text-[#346330] bg-[#EAF5E9] px-2 py-0.5 rounded-full whitespace-nowrap">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                        <span>📍</span>
                        <span>{comm.localisation || 'Localisation non renseignée'}</span>
                      </p>
                      {comm.telephone && (
                        <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                          <span>📞</span>
                          <span>{comm.telephone}</span>
                        </p>
                      )}
                      <div className="mt-auto pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
                        <a
                          className="w-full text-center bg-primary hover:bg-primary-dark text-white text-[13px] font-bold py-2 rounded-full shadow-xs hover:shadow transition-all active:scale-95"
                          href="#produits"
                        >
                          Voir les offres
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-[#E6D6C8] p-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-primary/50">storefront</span>
                <p className="text-[15px] font-bold text-[#231F20]">
                  Aucun commerçant partenaire pour le moment
                </p>
                <p className="text-[13.5px] text-on-surface-variant max-w-md">
                  De nouveaux artisans nous rejoignent régulièrement. Revenez bientôt pour découvrir leurs paniers anti-gaspillage.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 6. SECTION: CUSTOMER REVIEWS (Avis Clients) */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 mb-16" id="avis">
          <div className="flex items-center justify-center gap-3 text-center mb-2">
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
            <h2 className="text-[26px] sm:text-[32px] font-extrabold text-primary tracking-tight">
              Ce que disent nos clients gourmands
            </h2>
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
          </div>
          <p className="text-center text-[14.5px] text-on-surface-variant mb-8">
            Des retours authentiques de gourmets qui sauvent des paniers au quotidien.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingAvis ? (
              Array.from({ length: MAX_FEATURED_AVIS }).map((_, idx) => (
                <div
                  key={`avis-skeleton-${idx}`}
                  className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs flex flex-col gap-3 animate-pulse"
                >
                  <div className="h-4 w-24 bg-[#F3E9DF] rounded-full" />
                  <div className="h-3 w-full bg-[#F8F1EA] rounded-full" />
                  <div className="h-3 w-5/6 bg-[#F8F1EA] rounded-full" />
                  <div className="h-3 w-2/3 bg-[#F8F1EA] rounded-full" />
                  <div className="mt-4 pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F3E9DF]" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="h-3 w-1/2 bg-[#F3E9DF] rounded-full" />
                      <div className="h-2.5 w-3/4 bg-[#F8F1EA] rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredAvis.length > 0 ? (
              featuredAvis.map((a) => {
                const note = Math.max(1, Math.min(5, Number(a.note) || 5));

                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[#C96B26] text-[15px] font-bold tracking-widest">
                        {'★'.repeat(note)}
                      </div>
                      <span className="text-primary/30 text-2xl font-serif font-extrabold leading-none">”</span>
                    </div>
                    <p className="text-[14px] text-on-surface leading-relaxed mb-6 font-normal">
                      « {a.commentaire} »
                    </p>
                    <div className="mt-auto pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                      {a.clientPhotoUrl ? (
                        <img
                          alt={a.clientNom || 'Client'}
                          className="w-10 h-10 rounded-full object-cover border border-primary/20 shrink-0"
                          src={a.clientPhotoUrl}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center border border-primary/20 shrink-0 text-sm">
                          {(a.clientNom || 'Client').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#231F20]">
                          {a.clientNom || 'Client vérifié'}
                        </span>
                        <span className="text-[11.5px] text-on-surface-variant">
                          {a.commercantNom ? `Panier sauvé chez : ${a.commercantNom}` : 'Client One More Bite'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-[#E6D6C8] p-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[40px] text-primary/50">reviews</span>
                <p className="text-[15px] font-bold text-[#231F20]">
                  Aucun avis client pour le moment
                </p>
                <p className="text-[13.5px] text-on-surface-variant max-w-md">
                  Les avis publiés par nos gourmets apparaîtront ici. Sauvez votre premier panier et partagez votre expérience !
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 7. FAQ SECTION */}
        <section className="max-w-[1000px] mx-auto px-4 lg:px-8 mb-20" id="faq">
          <div className="flex items-center justify-center gap-3 text-center mb-2">
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
            <h2 className="text-[26px] sm:text-[32px] font-extrabold text-primary tracking-tight">
              Questions fréquentes (FAQ)
            </h2>
            <span className="h-[1.5px] w-12 sm:w-20 bg-primary/40 rounded-full" />
          </div>
          <p className="text-center text-[14.5px] text-on-surface-variant mb-8">
            Tout ce que vous devez savoir pour démarrer avec One More Bite.
          </p>

          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#F0E6DE] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    type="button"
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-[15px] sm:text-[16px] text-on-surface hover:text-primary transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className="material-symbols-outlined text-[20px] text-outline ml-2 shrink-0">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-[13.5px] sm:text-[14.5px] text-on-surface-variant leading-relaxed border-t border-[#F5EBE1]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
