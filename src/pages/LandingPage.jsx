import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [commercants, setCommercants] = useState([]);
  const [avisList, setAvisList] = useState([]);

  useEffect(() => {
    let active = true;
    fetchPublicCommercants()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setCommercants(data);
        }
      })
      .catch(() => { });

    fetchPublicAvis()
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setAvisList(data);
        }
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, []);

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
            {commercants.length > 0 ? (
              commercants.slice(0, 3).map((comm, idx) => (
                <div
                  key={comm.id || idx}
                  className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group"
                >
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      alt={comm.nom}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={
                        idx === 0
                          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCO6ViaxEF0Oo_KNR8A_HiBjN0T2-tXFfb11Zt6NuGZwC3TzSKkxx3MoBXw1GYhvCe9JyTLT3ZJdpjh7X-NAT_FiWUtMRfQl5-vrUylDC4d-yTevMD1xcqdkIhf1kYISLRrC9fQniO0sGyK93gDstGqoowirKjqA8_5IgAoNtGisMLjT6owX4ursZbhckpVOshcjJUeGQbh8t3Ey6Rkp_TEUCz7VVBw0J77HAIhQf4'
                          : idx === 1
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRmJfAuVeIyl3WmS6-vvupz8mt3dAnWNyk2gJ68sQAdAcu5bwOvEVLaiS_ETQecGviOkRgt21xdKpWb72zVbutv_8XsHqhlAYFJA0GfjcU0DvdAcqrjL-VXb9nzzmNR83Sm7IfDNjLPxP13DPiia_dtEJ-JCqq62LtGKDmVUaT0GGuK-KWYUrjgJBnI8KEqC4E6iiinsY3R9ASpikt0WHOtGxIajL8FBua_YUiz7s'
                            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDvciAWPIwJtLvOOD-WuzJuAa-d1i4fxzDtXGwRShv2QpZY9DBry3LqxVLk3N4l3h1ErLb82OwDemrXCIYwtIulK8VRvNr--Bp3BFBmRdqPRta-Js3VN_0t12CucH5h56d_YgrY4IIfPKeJhsCg77_KU_T6MbKLOTForjU-za-NAQbxhJ3mjEgIESUdsRyHQcApdlDqsj4hPHdyCRc4XI10fqNNfUFpWVK5b-TlrQ'
                      }
                    />
                    <span className="absolute top-3 right-3 bg-secondary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Commerçant certifié
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      {comm.localisation ? comm.localisation.split(',')[0] : 'Tunis'}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] font-bold text-[#231F20] group-hover:text-primary transition-colors">
                        {comm.nom}
                      </h3>
                      <span className="text-[12px] font-bold text-[#C96B26] bg-[#FFEAD6] px-2 py-0.5 rounded-full">
                        ★ 4.9
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                      <span>📍</span>
                      <span>{comm.localisation || 'Grand Tunis'}</span>
                    </p>
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
              ))
            ) : (
              <>
                {/* Fallback Merchant 1 */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group">
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      alt="Boulangerie & Pâtisserie Le Jasmin"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO6ViaxEF0Oo_KNR8A_HiBjN0T2-tXFfb11Zt6NuGZwC3TzSKkxx3MoBXw1GYhvCe9JyTLT3ZJdpjh7X-NAT_FiWUtMRfQl5-vrUylDC4d-yTevMD1xcqdkIhf1kYISLRrC9fQniO0sGyK93gDstGqoowirKjqA8_5IgAoNtGisMLjT6owX4ursZbhckpVOshcjJUeGQbh8t3Ey6Rkp_TEUCz7VVBw0J77HAIhQf4"
                    />
                    <span className="absolute top-3 right-3 bg-secondary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Coup de cœur
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Boulangerie & Pâtisserie
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] font-bold text-[#231F20] group-hover:text-primary transition-colors">
                        Boulangerie & Pâtisserie Le Jasmin
                      </h3>
                      <span className="text-[12px] font-bold text-[#C96B26] bg-[#FFEAD6] px-2 py-0.5 rounded-full">
                        ★ 4.9 (142 avis)
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                      <span>📍</span>
                      <span>Lafayette, Tunis (à 800 m)</span>
                    </p>
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

                {/* Fallback Merchant 2 */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group">
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      alt="Pâtisserie La Médina"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRmJfAuVeIyl3WmS6-vvupz8mt3dAnWNyk2gJ68sQAdAcu5bwOvEVLaiS_ETQecGviOkRgt21xdKpWb72zVbutv_8XsHqhlAYFJA0GfjcU0DvdAcqrjL-VXb9nzzmNR83Sm7IfDNjLPxP13DPiia_dtEJ-JCqq62LtGKDmVUaT0GGuK-KWYUrjgJBnI8KEqC4E6iiinsY3R9ASpikt0WHOtGxIajL8FBua_YUiz7s"
                    />
                    <span className="absolute top-3 right-3 bg-primary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Mieux noté
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Douceurs & Gâteaux
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] font-bold text-[#231F20] group-hover:text-primary transition-colors">
                        Pâtisserie La Médina
                      </h3>
                      <span className="text-[12px] font-bold text-[#C96B26] bg-[#FFEAD6] px-2 py-0.5 rounded-full">
                        ★ 4.8 (98 avis)
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                      <span>📍</span>
                      <span>Menzah 6, Tunis (à 2.5 km)</span>
                    </p>
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

                {/* Fallback Merchant 3 */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all border border-[#F0E6DE] flex flex-col group">
                  <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                    <img
                      alt="Café & Délices Saveurs d'Antan"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDvciAWPIwJtLvOOD-WuzJuAa-d1i4fxzDtXGwRShv2QpZY9DBry3LqxVLk3N4l3h1ErLb82OwDemrXCIYwtIulK8VRvNr--Bp3BFBmRdqPRta-Js3VN_0t12CucH5h56d_YgrY4IIfPKeJhsCg77_KU_T6MbKLOTForjU-za-NAQbxhJ3mjEgIESUdsRyHQcApdlDqsj4hPHdyCRc4XI10fqNNfUFpWVK5b-TlrQ"
                    />
                    <span className="absolute top-3 right-3 bg-primary text-white text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      Plus populaire
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      Restauration gourmande
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] font-bold text-[#231F20] group-hover:text-primary transition-colors">
                        Café & Délices Saveurs d'Antan
                      </h3>
                      <span className="text-[12px] font-bold text-[#C96B26] bg-[#FFEAD6] px-2 py-0.5 rounded-full">
                        ★ 4.9 (210 avis)
                      </span>
                    </div>
                    <p className="text-[13px] text-on-surface-variant mb-4 flex items-center gap-1.5 leading-relaxed">
                      <span>📍</span>
                      <span>La Marsa, Tunis (à 1.2 km)</span>
                    </p>
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
              </>
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
            {avisList.length > 0 ? (
              avisList.slice(0, 3).map((a, idx) => (
                <div
                  key={a.id || idx}
                  className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#C96B26] text-[15px] font-bold tracking-widest">
                      {'★'.repeat(Math.max(1, Math.min(5, a.note || 5)))}
                    </div>
                    <span className="text-primary/30 text-2xl font-serif font-extrabold leading-none">”</span>
                  </div>
                  <p className="text-[14px] text-on-surface leading-relaxed mb-6 font-normal">
                    « {a.commentaire} »
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center border border-primary/20 shrink-0 text-sm">
                      {(a.clientNom || 'Client').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#231F20]">
                        {a.clientNom || 'Client vérifié'}
                      </span>
                      <span className="text-[11.5px] text-on-surface-variant">
                        {a.commercantNom ? `Panier sauvé chez : ${a.commercantNom}` : 'Client à Tunis'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Fallback Testimonial 1 */}
                <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#C96B26] text-[15px] font-bold tracking-widest">★★★★★</div>
                    <span className="text-primary/30 text-2xl font-serif font-extrabold leading-none">”</span>
                  </div>
                  <p className="text-[14px] text-on-surface leading-relaxed mb-6 font-normal">
                    « Une expérience culinaire incroyable ! Des viennoiseries et gâteaux frais à moitié prix, tout en aidant nos artisans locaux. Je recommande à 100%. »
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center border border-primary/20 shrink-0 text-sm">
                      M.O
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#231F20]">Meriem El Obeidi</span>
                      <span className="text-[11.5px] text-on-surface-variant">Panier sauvé chez : Pâtisserie La Médina</span>
                    </div>
                  </div>
                </div>

                {/* Fallback Testimonial 2 */}
                <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#C96B26] text-[15px] font-bold tracking-widest">★★★★★</div>
                    <span className="text-primary/30 text-2xl font-serif font-extrabold leading-none">”</span>
                  </div>
                  <p className="text-[14px] text-on-surface leading-relaxed mb-6 font-normal">
                    « Excellente initiative anti-gaspillage. J'économise sur mon budget tout en profitant de super repas après le travail. C'est rapide et efficace. »
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E5F2E2] text-[#346330] font-bold flex items-center justify-center border border-[#CDE5CB] shrink-0 text-sm">
                      Y.S
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#231F20]">Yassine Ben Salah</span>
                      <span className="text-[11.5px] text-on-surface-variant">Panier sauvé chez : Boulangerie Le Jasmin</span>
                    </div>
                  </div>
                </div>

                {/* Fallback Testimonial 3 */}
                <div className="bg-white rounded-2xl p-6 border border-[#F0E6DE] shadow-xs hover:shadow-md transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#C96B26] text-[15px] font-bold tracking-widest">★★★★★</div>
                    <span className="text-primary/30 text-2xl font-serif font-extrabold leading-none">”</span>
                  </div>
                  <p className="text-[14px] text-on-surface leading-relaxed mb-6 font-normal">
                    « Réservation instantanée sans carte bancaire, accueil très chaleureux du commerçant et panier copieux. Une superbe découverte à Tunis ! »
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFEAD6] text-[#C96B26] font-bold flex items-center justify-center border border-[#EEDBCA] shrink-0 text-sm">
                      S.M
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#231F20]">Sarra Mejri</span>
                      <span className="text-[11.5px] text-on-surface-variant">Panier sauvé chez : Saveurs d'Antan</span>
                    </div>
                  </div>
                </div>
              </>
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
