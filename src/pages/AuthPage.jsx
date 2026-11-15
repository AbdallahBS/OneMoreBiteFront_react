import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { registerClient, registerMerchant, verifierOtp, renvoyerOtp, googleAuthRequest, updateProfileRequest } from '../api/auth';
import { ROLE_BY_KEY, dashboardPath } from '../lib/roles';
import { isProfileComplete } from '../lib/profile';

const EDITORIAL_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDt7QxdGeV0T6yXjzKoFk9pr3BqoQuDmJSVBuJfFt596z2yo2fKu8WOjPXSIf2ktn_2hpPBN8Wx4xOsdCluZUzsv81xNt5NmVt3Sxq4N8Ms2f4zAoyKnnBIIFjj67ijRx-Zi2_p8utUMp2nSu557iZNZwE9TYDzbdkIyAhbJFGQ8cihAygy5mJ34t8xH_NdQWVdlL-ilbm3lqjTfukybKl7wRLoPF4W62kwwrMD5MjaL2CVfX1XOM7_';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, establishSession, isAuthenticated, user, booting, profileComplete, token, reloadSession, logout } = useAuth();

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

  // OTP Verification state
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);

  // Google Authentication states
  const [googleConfigModalOpen, setGoogleConfigModalOpen] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleCompleteStep, setGoogleCompleteStep] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleForm, setGoogleForm] = useState({
    phone: '',
    businessName: '',
    governorate: 'tunis',
    localisation: '',
  });
  const [completingProfile, setCompletingProfile] = useState(false);
  const [profileCompleteError, setProfileCompleteError] = useState('');
  const completionInitializedRef = useRef(false);

  // Account that must finish its profile: either the Google response we just
  // received or the persisted session (e.g. after a page reload).
  const completionUser = googleUser || user;
  const showCompletionForm =
    googleCompleteStep || (isAuthenticated && user?.role !== 'ADMIN' && !profileComplete);

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
    if (!booting && isAuthenticated && profileComplete) {
      navigate(nextPath || dashboardPath(user?.role), { replace: true });
    }
  }, [booting, isAuthenticated, profileComplete, user?.role, nextPath, navigate]);

  // When an incomplete profile is restored from localStorage (page reload or
  // direct dashboard access through ProtectedRoute), pre-fill the onboarding
  // form with the data the backend already knows about.
  useEffect(() => {
    if (completionInitializedRef.current) {
      return;
    }
    if (!isAuthenticated || profileComplete || !user || googleUser) {
      return;
    }

    completionInitializedRef.current = true;
    setGoogleForm({
      phone: String(user.telephone || '').replace(/\D/g, '').slice(-8),
      businessName: user.role === 'COMMERCANT' ? user.nom || '' : '',
      governorate: 'tunis',
      localisation:
        user.localisation && user.localisation.trim().toLowerCase() !== 'à renseigner'
          ? user.localisation
          : '',
    });
  }, [isAuthenticated, profileComplete, user, googleUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      completionInitializedRef.current = false;
    }
  }, [isAuthenticated]);

  // Keep the role selector in sync with the connected account.
  useEffect(() => {
    if (!isAuthenticated || !user?.role) {
      return;
    }
    const requested = Object.entries(ROLE_BY_KEY).find(
      ([, role]) => role.backendRole === user.role,
    );
    if (requested && requested[0] !== 'admin') {
      setRoleKey(requested[0]);
    }
  }, [isAuthenticated, user?.role]);

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
        const targetEmail = form.email.trim();

        if (roleKey === 'commercant') {
          await registerMerchant({
            nom: form.businessName.trim() || fullName,
            email: targetEmail,
            telephone: form.phone.trim(),
            localisation: form.governorate || 'Tunis',
            motDePasse: form.motDePasse,
          });
        } else {
          await registerClient({
            nom: fullName,
            email: targetEmail,
            telephone: form.phone.trim(),
            motDePasse: form.motDePasse,
          });
        }

        // Basculer vers l'écran de validation OTP
        setOtpEmail(targetEmail);
        setOtpCode('');
        setOtpError('');
        setOtpSuccess('Un code de vérification à 6 chiffres a été envoyé à votre adresse email.');
        setOtpStep(true);
        return;
      }

      // Connexion mode
      const session = await login(roleKey, {
        email: form.email.trim(),
        motDePasse: form.motDePasse,
      });

      if (isProfileComplete(session.user)) {
        navigate(nextPath || dashboardPath(session.user.role), { replace: true });
      }
    } catch (requestError) {
      const msg = requestError?.message || '';
      if (msg.toLowerCase().includes('valider votre adresse email') || msg.toLowerCase().includes('vérifier votre adresse email')) {
        setOtpEmail(form.email.trim());
        setOtpCode('');
        setOtpError(msg);
        setOtpSuccess('');
        setOtpStep(true);
      } else {
        setError(msg || 'Identifiants invalides ou service temporairement indisponible.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);

    try {
      await verifierOtp(otpEmail, otpCode);
      setOtpSuccess('Adresse email validée avec succès !');

      if (roleKey === 'client' && form.motDePasse) {
        // Connexion automatique pour le client vérifié
        try {
          const session = await login('client', {
            email: otpEmail,
            motDePasse: form.motDePasse,
          });
          if (isProfileComplete(session.user)) {
        navigate(nextPath || dashboardPath(session.user.role), { replace: true });
      }
          return;
        } catch {
          // Si la connexion auto échoue, basculer sur login normal
        }
      }

      setTimeout(() => {
        setOtpStep(false);
        setMode('login');
        if (roleKey === 'commercant') {
          setSuccess('Email vérifié ! Votre compte est en attente d’approbation par nos administrateurs.');
        } else {
          setSuccess('Email validé ! Vous pouvez maintenant vous connecter.');
        }
      }, 1400);
    } catch (err) {
      setOtpError(err?.message || 'Code de vérification invalide ou expiré.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setResendingOtp(true);
    try {
      await renvoyerOtp(otpEmail);
      setOtpSuccess('Un nouveau code OTP vient d’être envoyé par email.');
    } catch (err) {
      setOtpError(err?.message || 'Erreur lors du renvoi du code.');
    } finally {
      setResendingOtp(false);
    }
  };

  const getGoogleClientId = () => {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      window.localStorage.getItem('omb.google_client_id') ||
      ''
    ).trim();
  };

  const ensureGsiLoaded = () => {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2) {
        resolve(true);
        return;
      }
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        if (window.google?.accounts?.oauth2) {
          resolve(true);
          return;
        }
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const processGoogleAuthSuccess = async (authRes) => {
    await establishSession(authRes);
    setGoogleConfigModalOpen(false);

    if (authRes.profilComplet) {
      navigate(nextPath || dashboardPath(authRes.role), { replace: true });
    } else {
      // Profil incomplet : forcer la complétion du profil sans OTP car email vérifié.
      // La session est conservée pour pouvoir appeler PUT /auth/me, et
      // ProtectedRoute + AuthPage bloquent toute navigation tant que les
      // informations obligatoires ne sont pas renseignées.
      setGoogleUser(authRes);
      setGoogleForm({
        phone: '',
        businessName: authRes.role === 'COMMERCANT' ? authRes.nom : '',
        governorate: 'tunis',
        localisation: '',
      });
      setGoogleCompleteStep(true);
    }
  };

  const triggerNativeGoogleAuth = async (clientId) => {
    setGoogleLoading(true);
    setError('');

    try {
      await ensureGsiLoaded();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Impossible de charger le service Google Identity. Vérifiez votre connexion Internet.');
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError('Erreur Google OAuth : ' + (tokenResponse.error_description || tokenResponse.error));
            setGoogleLoading(false);
            return;
          }

          try {
            setGoogleLoading(true);
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await userInfoRes.json();

            if (!profile.email) {
              throw new Error('Impossible de récupérer l’adresse email depuis le compte Google.');
            }

            const targetRole = roleKey === 'commercant' ? 'COMMERCANT' : 'CLIENT';
            const authRes = await googleAuthRequest({
              email: profile.email,
              nom: profile.name || profile.given_name || profile.email.split('@')[0],
              photoUrl: profile.picture || '',
              role: targetRole,
            });

            await processGoogleAuthSuccess(authRes);
          } catch (err) {
            setError(err?.message || 'Erreur lors de la synchronisation de votre compte Google.');
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      // Ouvre directement la popup Google native de sélection de compte
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(err?.message || 'Erreur lors de l’ouverture de Google OAuth.');
      setGoogleLoading(false);
    }
  };

  const handleContinuerAvecGoogle = async () => {
    setError('');
    setSuccess('');

    const clientId = getGoogleClientId();
    if (!clientId) {
      setGoogleClientIdInput('');
      setGoogleConfigModalOpen(true);
      return;
    }

    await triggerNativeGoogleAuth(clientId);
  };

  const handleSaveClientIdAndContinue = async (e) => {
    e.preventDefault();
    const cleanId = (googleClientIdInput || '').trim();
    if (!cleanId) {
      setError('Veuillez saisir votre Client ID Google.');
      return;
    }

    window.localStorage.setItem('omb.google_client_id', cleanId);
    setGoogleConfigModalOpen(false);
    await triggerNativeGoogleAuth(cleanId);
  };

  const handleCompleteGoogleProfile = async (e) => {
    e.preventDefault();
    setProfileCompleteError('');

    const activeUser = googleUser || user;
    const activeToken = googleUser?.token || token;
    const isMerchant = activeUser?.role === 'COMMERCANT';

    if (!activeToken || !activeUser) {
      setProfileCompleteError('Votre session a expiré. Veuillez vous reconnecter.');
      return;
    }

    if (!googleForm.phone || googleForm.phone.trim().length < 8) {
      setProfileCompleteError('Veuillez saisir un numéro de téléphone valide à 8 chiffres.');
      return;
    }

    if (isMerchant && (!googleForm.businessName || !googleForm.businessName.trim())) {
      setProfileCompleteError('Le nom de votre commerce / enseigne est obligatoire.');
      return;
    }

    if (isMerchant && (!googleForm.localisation || !googleForm.localisation.trim())) {
      setProfileCompleteError("L'adresse complète de votre commerce est obligatoire.");
      return;
    }

    setCompletingProfile(true);
    try {
      const payload = isMerchant
        ? {
            nom: googleForm.businessName.trim(),
            telephone: googleForm.phone.trim(),
            localisation: googleForm.localisation.trim(),
          }
        : {
            telephone: googleForm.phone.trim(),
            localisation: googleForm.localisation.trim() || undefined,
          };

      const updated = await updateProfileRequest(activeToken, payload);

      // Un commerçant qui vient de compléter son profil doit encore être
      // validé par un administrateur : on affiche le message d'attente.
      if (isMerchant && updated?.statut === 'EN_ATTENTE') {
        await logout();
        setGoogleCompleteStep(false);
        setGoogleUser(null);
        setMode('login');
        setSuccess(
          'Profil commerçant complété avec succès ! Votre compte est en attente d’approbation par nos administrateurs.',
        );
        return;
      }

      await reloadSession();
      setGoogleCompleteStep(false);
      setGoogleUser(null);
      // The redirect is handled by the "profile complete" effect above once the
      // refreshed session has been committed to context.
    } catch (err) {
      setProfileCompleteError(err?.message || 'Erreur lors de la mise à jour de votre profil.');
    } finally {
      setCompletingProfile(false);
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
              {showCompletionForm ? (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-50 border-2 border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-xs">
                      <span className="material-symbols-outlined text-[34px]">verified</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      Finaliser votre inscription
                    </h2>
                    <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                      Bienvenue <strong className="text-primary">{completionUser?.nom}</strong> !
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant max-w-md mx-auto">
                      Ces informations sont obligatoires pour activer votre compte et vous permettre
                      de réserver ou de publier vos paniers.
                    </p>
                  </div>

                  {/* Verification Confirmation Badge */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
                    <div>
                      <p className="font-bold">Adresse email vérifiée : {completionUser?.email}</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {googleUser
                          ? 'Votre adresse email est certifiée par Google (aucun code OTP requis).'
                          : 'Votre adresse email est déjà vérifiée (aucun code OTP requis).'}{' '}
                        Veuillez renseigner ces dernières informations pour activer pleinement votre profil.
                      </p>
                    </div>
                  </div>

                  {profileCompleteError && (
                    <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span>{profileCompleteError}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
                    {completionUser?.role === 'COMMERCANT' ? (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Nom du commerce / Enseigne *
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="ex. Boulangerie Les Délices"
                            value={googleForm.businessName}
                            onChange={(e) => setGoogleForm((prev) => ({ ...prev, businessName: e.target.value }))}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Numéro de téléphone *
                          </label>
                          <div className="flex rounded-xl bg-surface-container-low focus-within:bg-white focus-within:ring-2 focus-within:ring-primary overflow-hidden">
                            <span className="inline-flex items-center px-3.5 text-xs font-bold text-on-surface-variant bg-surface-container border-r border-outline-variant/30">
                              +216
                            </span>
                            <input
                              required
                              type="tel"
                              maxLength={8}
                              placeholder="98 123 456"
                              value={googleForm.phone}
                              onChange={(e) => setGoogleForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                              className="w-full bg-transparent py-2.5 px-3 text-on-surface text-sm border-0 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Adresse complète du commerce *
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="ex. 15 Avenue Habib Bourguiba, La Marsa"
                            value={googleForm.localisation}
                            onChange={(e) => setGoogleForm((prev) => ({ ...prev, localisation: e.target.value }))}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Numéro de téléphone *
                          </label>
                          <div className="flex rounded-xl bg-surface-container-low focus-within:bg-white focus-within:ring-2 focus-within:ring-primary overflow-hidden">
                            <span className="inline-flex items-center px-3.5 text-xs font-bold text-on-surface-variant bg-surface-container border-r border-outline-variant/30">
                              +216
                            </span>
                            <input
                              required
                              type="tel"
                              maxLength={8}
                              placeholder="98 123 456"
                              value={googleForm.phone}
                              onChange={(e) => setGoogleForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                              className="w-full bg-transparent py-2.5 px-3 text-on-surface text-sm border-0 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Ville / Région
                          </label>
                          <select
                            value={googleForm.governorate}
                            onChange={(e) => setGoogleForm((prev) => ({ ...prev, governorate: e.target.value }))}
                            className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-sm border-0 outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
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
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={completingProfile}
                      className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      {completingProfile ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          <span>Enregistrement en cours…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          <span>Finaliser et continuer</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={completingProfile}
                      onClick={async () => {
                        await logout();
                        setGoogleCompleteStep(false);
                        setGoogleUser(null);
                        setProfileCompleteError('');
                        setMode('login');
                      }}
                      className="w-full text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 disabled:opacity-50 cursor-pointer"
                    >
                      Se déconnecter
                    </button>
                  </form>
                </div>
              ) : otpStep ? (
                <div className="space-y-6">
                  {/* Top Icon & Titles */}
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
                      <span className="material-symbols-outlined text-[36px]">mark_email_read</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                      Vérification de votre Email
                    </h2>
                    <p className="mt-2 text-sm text-on-surface-variant max-w-md mx-auto">
                      Un code de confirmation à 6 chiffres a été envoyé à :
                    </p>
                    <p className="font-bold text-primary text-base mt-1 break-all">
                      {otpEmail}
                    </p>
                  </div>

                  {/* Feedback alerts */}
                  {otpError && (
                    <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span>{otpError}</span>
                    </div>
                  )}
                  {otpSuccess && (
                    <div className="p-3.5 rounded-xl bg-[#EAF5E9] text-[#346330] text-xs flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>{otpSuccess}</span>
                    </div>
                  )}

                  {/* OTP Form */}
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="block text-center text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                        Code secret à 6 chiffres
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        autoFocus
                        className="w-full text-center text-3xl sm:text-4xl font-mono tracking-[0.4em] py-3.5 px-4 rounded-xl bg-surface-container-low focus:bg-white text-on-surface border-2 border-outline-variant/40 focus:border-primary outline-none transition-all shadow-inner"
                      />
                      <p className="text-center text-[11px] text-outline mt-2">
                        Pensez à vérifier vos courriers indésirables (spams) si nécessaire.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading || otpCode.length < 6}
                      className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {otpLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">
                            progress_activity
                          </span>
                          <span>Vérification en cours…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          <span>Valider mon adresse email</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Secondary Actions */}
                  <div className="pt-2 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                    <button
                      type="button"
                      disabled={resendingOtp}
                      onClick={handleResendOtp}
                      className="font-semibold text-secondary hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {resendingOtp ? 'sync' : 'refresh'}
                      </span>
                      <span>{resendingOtp ? 'Envoi en cours…' : 'Renvoyer un nouveau code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(false);
                        setOtpError('');
                        setOtpSuccess('');
                      }}
                      className="text-outline hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Retour à la connexion</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.99] transition-all text-sm font-semibold text-on-surface shadow-2xs border border-outline-variant/40 cursor-pointer disabled:opacity-50"
                  type="button"
                  disabled={googleLoading}
                  onClick={handleContinuerAvecGoogle}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>
                    {googleLoading
                      ? 'Connexion Google en cours…'
                      : roleKey === 'commercant'
                      ? 'Continuer avec Google (Commerçant)'
                      : 'Continuer avec Google'}
                  </span>
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
            </>
          )}
            </div>
          </div>
        </div>

        {/* Google OAuth Configuration Modal (displayed if Client ID is not yet provided in .env) */}
        {googleConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#F0E6DE] overflow-hidden p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setGoogleConfigModalOpen(false)}
                className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              {/* Header */}
              <div className="text-center mb-5">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-surface-container shadow-2xs">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
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
                </div>
                <h3 className="text-xl font-bold text-on-surface">Configuration Google OAuth</h3>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Pour ouvrir directement la boîte de dialogue de sélection de compte Google, collez votre <strong>Client ID Google</strong> (Google Cloud Console) :
                </p>
              </div>

              <form onSubmit={handleSaveClientIdAndContinue} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Google Client ID *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex. 123456789-xxx.apps.googleusercontent.com"
                    value={googleClientIdInput}
                    onChange={(e) => setGoogleClientIdInput(e.target.value)}
                    className="w-full bg-surface-container-low focus:bg-white rounded-xl py-2.5 px-3.5 text-on-surface text-xs font-mono border-0 outline-none focus:ring-2 focus:ring-primary transition-all"
                    autoFocus
                  />
                  <p className="text-[11px] text-outline mt-1.5">
                    Conseil : vous pouvez aussi le placer dans <code className="text-primary font-bold">FronEnd/.env</code> sous <code className="text-primary font-bold">VITE_GOOGLE_CLIENT_ID</code>.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">account_circle</span>
                    <span>Ouvrir la sélection de compte Google</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
