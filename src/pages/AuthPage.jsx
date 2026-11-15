import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { registerClient, registerMerchant } from '../api/auth';
import { AUTH_ROLES, ROLE_BY_KEY, dashboardPath } from '../lib/roles';

const EDITORIAL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDt7QxdGeV0T6yXjzKoFk9pr3BqoQuDmJSVBuJfFt596z2yo2fKu8WOjPXSIf2ktn_2hpPBN8Wx4xOsdCluZUzsv81xNt5NmVt3Sxq4N8Ms2f4zAoyKnnBIIFjj67ijRx-Zi2_p8utUMp2nSu557iZNZwE9TYDzbdkIyAhbJFGQ8cihAygy5mJ34t8xH_NdQWVdlL-ilbm3lqjTfukybKl7wRLoPF4W62kwwrMD5MjaL2CVfX1XOM7_';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, user, booting } = useAuth();

  const [roleKey, setRoleKey] = useState(() => {
    const requested = searchParams.get('role');
    return requested && ROLE_BY_KEY[requested] ? requested : 'client';
  });

  const [mode, setMode] = useState(() =>
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    businessName: '',
    email: '',
    phone: '',
    governorate: 'tunis',
    motDePasse: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register' && roleKey !== 'admin';

  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/auth')) {
      return null;
    }
    return next;
  }, [searchParams]);

  useEffect(() => {
    const requested = searchParams.get('role');
    if (requested && ROLE_BY_KEY[requested]) {
      setRoleKey(requested);
    }
  }, [searchParams]);

  useEffect(() => {
    const requested = searchParams.get('mode');
    if (requested === 'register' || requested === 'login') {
      setMode(requested);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!booting && isAuthenticated) {
      navigate(nextPath || dashboardPath(user?.role), { replace: true });
    }
  }, [booting, isAuthenticated, user?.role, nextPath, navigate]);

  const updateField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const getPasswordStrength = (val) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const pwdScore = getPasswordStrength(form.motDePasse);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const fullName = `${form.prenom.trim()} ${form.nom.trim()}`.trim();
        if (roleKey === 'commercant') {
          await registerMerchant({
            nom: form.businessName.trim() || fullName,
            email: form.email.trim(),
            telephone: form.phone.trim(),
            localisation: form.governorate || 'Tunis',
            motDePasse: form.motDePasse,
          });
          setSuccess(
            'Votre demande commerçant a bien été envoyée ! Un administrateur va valider votre compte.'
          );
        } else {
          await registerClient({
            nom: fullName,
            email: form.email.trim(),
            telephone: form.phone.trim(),
            motDePasse: form.motDePasse,
          });
          setSuccess('Votre compte gourmand a été créé avec succès ! Vous pouvez maintenant vous connecter.');
        }

        setForm((prev) => ({ ...prev, motDePasse: '' }));
        setMode('login');
        return;
      }

      // Connexion mode
      const session = await login(roleKey, {
        email: form.email.trim(),
        motDePasse: form.motDePasse,
      });

      navigate(nextPath || dashboardPath(session.user.role), { replace: true });
    } catch (requestError) {
      setError(requestError?.message || 'Identifiants invalides ou service temporairement indisponible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F8] font-sans text-on-surface antialiased">
      <Header />

      <main className="w-full flex-1 pt-6 pb-16 relative overflow-hidden">
        {/* Ambient Mediterranean Warmth Background Accents */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-secondary-container/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-tertiary-fixed/30 blur-2xl pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Inspiring Cultural Editorial & Impact Panel */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-surface-container-low p-4 sm:p-6 shadow-xs border border-[#F0E6DE]">
              <div className="relative w-full h-[26rem] sm:h-[30rem] rounded-xl overflow-hidden shadow-sm group flex flex-col justify-between p-6">
                <img
                  src={EDITORIAL_IMAGE}
                  alt="Panier de délices artisanaux tunisiens"
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-primary font-semibold text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[16px] text-secondary">eco</span>
                    <span>Anti-gaspillage en Tunisie</span>
                  </span>
                </div>

                <div className="relative z-10 text-white">
                  <span className="font-handwriting text-2xl text-secondary-fixed mb-1 block">
                    « La nourriture est précieuse, sauvons chaque bouchée »
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold leading-snug mb-2 text-white">
                    Savourez le meilleur de nos artisans à moitié prix.
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                    Rejoignez des milliers de citoyens qui sauvent chaque jour d'exquis surplus de
                    boulangeries, pâtisseries et traiteurs locaux.
                  </p>
                </div>
              </div>

              {/* Verified Reviews Card */}
              <div className="mt-4 p-4 rounded-xl bg-white shadow-xs border border-[#F0E6DE]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      <span className="inline-block h-7 w-7 rounded-full bg-primary text-white text-center font-bold leading-7 text-xs">
                        SR
                      </span>
                      <span className="inline-block h-7 w-7 rounded-full bg-secondary text-white text-center font-bold leading-7 text-xs">
                        YM
                      </span>
                      <span className="inline-block h-7 w-7 rounded-full bg-tertiary text-white text-center font-bold leading-7 text-xs">
                        AB
                      </span>
                    </div>
                    <span className="text-xs font-bold text-on-surface">+3 200 avis vérifiés</span>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs">
                    <span>★★★★★</span>
                    <span className="ml-1 font-bold text-on-surface">4.9</span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant italic leading-relaxed">
                  « Grâce à One More Bite, je récupère chaque soir de succulents paniers chez ma
                  boulangerie pour 6 DT au lieu de 22 DT. Un geste simple, délicieux et responsable. »
                </p>
                <span className="text-xs font-bold text-primary block mt-1.5">— Meriem B., La Marsa</span>
              </div>
            </div>

            {/* Right Column: Interactive Registration & Login Desk */}
            <div className="lg:col-span-7 flex flex-col justify-center bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-sm border border-[#F0E6DE]">
              {/* Header Title */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                    {mode === 'register' ? 'Créer un compte' : 'Connexion à votre espace'}
                  </h2>
                  {roleKey === 'admin' ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      Portail Administrateur
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-on-surface-variant">
                  {mode === 'register'
                    ? 'Sauvez de bons petits plats et rejoignez la communauté anti-gaspi !'
                    : 'Accédez à vos réservations, vos commerces favoris et vos offres du jour.'}
                </p>
              </div>

              {/* Role Switcher Segmented Control (if not admin) */}
              {roleKey !== 'admin' && (
                <div className="mb-5">
                  <span className="text-xs uppercase tracking-wider text-outline font-semibold block mb-2">
                    Choisissez votre profil
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-xl bg-surface-container">
                    <button
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm transition-all text-left ${
                        roleKey === 'client'
                          ? 'shadow-xs bg-primary text-white font-bold'
                          : 'text-on-surface-variant hover:text-primary font-medium'
                      }`}
                      onClick={() => setRoleKey('client')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                      <div className="flex flex-col leading-tight">
                        <span>Je suis un Gourmand</span>
                       
                      </div>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm transition-all text-left ${
                        roleKey === 'commercant'
                          ? 'shadow-xs bg-secondary text-white font-bold'
                          : 'text-on-surface-variant hover:text-primary font-medium'
                      }`}
                      onClick={() => setRoleKey('commercant')}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                      <div className="flex flex-col leading-tight">
                        <span>Je suis un Commerçant</span>
                    
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Fast Social Signup Button */}
              <div className="mb-4">
                <button
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-sm font-semibold text-on-surface shadow-2xs border border-outline-variant/40"
                  type="button"
                  onClick={() => setError('La connexion Google sera disponible prochainement dans votre région.')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-5">
                <div className="w-full h-px bg-surface-container-high" />
                <span className="absolute bg-white px-3 text-xs text-outline uppercase tracking-wider">
                  ou avec votre e-mail
                </span>
              </div>

              {/* Feedback messages */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 rounded-xl bg-[#EAF5E9] text-[#346330] text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Form Element */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isRegister && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="prenom">
                          Prénom
                        </label>
                        <div className="relative">
                          <input
                            id="prenom"
                            required
                            type="text"
                            placeholder="ex. Amira"
                            value={form.prenom}
                            onChange={updateField('prenom')}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px]">
                            person
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="nom">
                          Nom
                        </label>
                        <div className="relative">
                          <input
                            id="nom"
                            required
                            type="text"
                            placeholder="ex. Trabelsi"
                            value={form.nom}
                            onChange={updateField('nom')}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px]">
                            badge
                          </span>
                        </div>
                      </div>
                    </div>

                    {roleKey === 'commercant' && (
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="businessName">
                          Nom de votre établissement
                        </label>
                        <div className="relative">
                          <input
                            id="businessName"
                            required
                            type="text"
                            placeholder="ex. Boulangerie Pâtisserie La Rose de Carthage"
                            value={form.businessName}
                            onChange={updateField('businessName')}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px]">
                            store
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="email">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      required
                      type="email"
                      placeholder="votre.email@exemple.tn"
                      value={form.email}
                      onChange={updateField('email')}
                      className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px]">
                      mail
                    </span>
                  </div>
                </div>

                {/* Phone & Governorate (shown on register) */}
                {isRegister && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="phone">
                        Numéro de téléphone portable
                      </label>
                      <div className="flex rounded-xl bg-surface-container-low overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                        <span className="inline-flex items-center px-3 bg-surface-container text-on-surface-variant text-xs font-semibold select-none">
                          🇹🇳 +216
                        </span>
                        <input
                          id="phone"
                          required
                          type="tel"
                          maxLength={8}
                          placeholder="98 123 456"
                          value={form.phone}
                          onChange={updateField('phone')}
                          className="w-full bg-transparent py-2.5 px-3 text-on-surface text-sm border-0 outline-none placeholder:text-outline"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-on-surface mb-1" htmlFor="governorate">
                        Ville / Région
                      </label>
                      <div className="relative">
                        <select
                          id="governorate"
                          required
                          value={form.governorate}
                          onChange={updateField('governorate')}
                          className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer pr-8"
                        >
                          <option value="tunis">Tunis - Centre</option>
                          <option value="marsa">La Marsa / Gammarth</option>
                          <option value="ariana">Ariana / Ennasr</option>
                          <option value="ben_arous">Ben Arous / Mégrine</option>
                          <option value="sousse">Sousse</option>
                          <option value="sfax">Sfax</option>
                          <option value="nabeul">Nabeul / Hammamet</option>
                          <option value="bizerte">Bizerte</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-[18px] pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password & Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-on-surface" htmlFor="motDePasse">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                      <span>{showPassword ? 'Masquer' : 'Afficher'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="motDePasse"
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isRegister ? 'Minimum 8 caractères' : 'Votre mot de passe'}
                      value={form.motDePasse}
                      onChange={updateField('motDePasse')}
                      className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline"
                    />
                  </div>

                  {/* Password Strength Meter (Registration only) */}
                  {isRegister && (
                    <div className="mt-2">
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                        <div
                          className={`rounded-full transition-colors duration-300 ${
                            pwdScore >= 1
                              ? pwdScore === 1
                                ? 'bg-error'
                                : pwdScore === 2
                                ? 'bg-amber-500'
                                : 'bg-secondary'
                              : 'bg-surface-container-high'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-colors duration-300 ${
                            pwdScore >= 2
                              ? pwdScore === 2
                                ? 'bg-amber-500'
                                : 'bg-secondary'
                              : 'bg-surface-container-high'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-colors duration-300 ${
                            pwdScore >= 3 ? 'bg-secondary' : 'bg-surface-container-high'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-colors duration-300 ${
                            pwdScore >= 4 ? 'bg-secondary' : 'bg-surface-container-high'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-outline">
                        <span>
                          {pwdScore === 0
                            ? 'Force du mot de passe'
                            : pwdScore === 1
                            ? 'Faible'
                            : pwdScore === 2
                            ? 'Moyen'
                            : pwdScore === 3
                            ? 'Bon'
                            : 'Sécurisé'}
                        </span>
                        <span>Chiffres, minuscules, majuscules</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consents / Checkboxes */}
                {isRegister ? (
                  <div className="pt-1 space-y-1.5 text-xs text-on-surface-variant">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        required
                        type="checkbox"
                        className="mt-0.5 rounded text-primary focus:ring-primary border-outline-variant"
                      />
                      <span>
                        J'accepte les{' '}
                        <a href="#" className="text-primary font-bold hover:underline">
                          Conditions Générales
                        </a>{' '}
                        et la{' '}
                        <a href="#" className="text-primary font-bold hover:underline">
                          Politique de Confidentialité
                        </a>
                        .
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        defaultChecked
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary border-outline-variant"
                      />
                      <span>Se souvenir de moi</span>
                    </label>
                    <a href="#" className="text-primary hover:underline font-semibold">
                      Mot de passe oublié ?
                    </a>
                  </div>
                )}

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        <span>Veuillez patienter…</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {isRegister
                            ? roleKey === 'commercant'
                              ? 'Inscrire mon commerce partenaire'
                              : 'Créer mon compte gourmand'
                            : 'Se connecter à mon compte'}
                        </span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Reassurance Trust Badges */}
                <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
                    Données chiffrées & protégées
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">cancel</span>
                    Sans engagement
                  </span>
                </div>

                {/* Switch Login / Register Navigation */}
                <div className="text-center pt-3 border-t border-surface-container-high mt-4 text-xs text-on-surface-variant">
                  {mode === 'register' ? (
                    <p>
                      Vous avez déjà un compte ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setSuccess('');
                        }}
                        className="font-bold text-primary hover:underline ml-1"
                      >
                        Se connecter
                      </button>
                    </p>
                  ) : (
                    <p>
                      Pas encore de compte ?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                          setSuccess('');
                        }}
                        className="font-bold text-primary hover:underline ml-1"
                      >
                        S'inscrire gratuitement
                      </button>
                    </p>
                  )}
                </div>

                {/* Quick switch back if admin role is active */}
                {roleKey === 'admin' && (
                  <div className="text-center pt-1 text-[11px] text-outline">
                    <button
                      type="button"
                      onClick={() => setRoleKey('client')}
                      className="hover:text-primary transition-colors underline"
                    >
                      ← Retour au portail client & commerçant
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
